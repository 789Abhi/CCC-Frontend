"use client"

import { useState, useEffect } from "react"
import axios from "axios"

function FieldPopup({ componentId, onClose, onFieldAdded, initialField, onSave }) {
  const [label, setLabel] = useState(initialField?.label || "")
  const [name, setName] = useState(initialField?.name || "")
  const [type, setType] = useState(initialField?.type || "text")
  const [maxSets, setMaxSets] = useState(initialField?.maxSets || initialField?.config?.max_sets || "")
  const [allowedFields, setAllowedFields] = useState(initialField?.allowedFields || ["text", "textarea", "image"])
  const [imageReturnType, setImageReturnType] = useState(initialField?.returnType || initialField?.config?.return_type || "url")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [messageType, setMessageType] = useState("")
  const [fieldOptions, setFieldOptions] = useState(initialField?.options || initialField?.config?.options || [])
  const [nestedFieldDefinitions, setNestedFieldDefinitions] = useState(initialField?.nestedFieldDefinitions || initialField?.config?.nested_fields || [])
  const [editingNestedFieldIndex, setEditingNestedFieldIndex] = useState(null)

  // Recursive popup state
  const [showRecursivePopup, setShowRecursivePopup] = useState(false)
  const [recursivePopupInitialField, setRecursivePopupInitialField] = useState(null)
  const [recursivePopupIndex, setRecursivePopupIndex] = useState(null)

  const availableFieldTypes = ["text", "textarea", "image", "repeater", "wysiwyg", "color", "select", "checkbox", "radio"]

  // Effect to handle state updates when type changes
  useEffect(() => {
    if (type === "repeater") {
      // If switching to repeater and no allowed fields are set, set defaults
      if (allowedFields.length === 0) {
        setAllowedFields(["text", "textarea", "image"])
      }
    }
  }, [type, allowedFields.length])

  const generateHandle = (inputLabel) => {
    return inputLabel
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/[^\w_]+/g, "")
  }

  const showMessage = (msg, type) => {
    setMessage(msg)
    setMessageType(type)
    setTimeout(() => {
      setMessage("")
      setMessageType("")
    }, 5000)
  }

  const handleAllowedFieldChange = (fieldType, checked) => {
    if (checked) {
      setAllowedFields([...allowedFields, fieldType])
    } else {
      setAllowedFields(allowedFields.filter((f) => f !== fieldType))
    }
  }

  const handleAddOption = () => {
    setFieldOptions((prev) => [...prev, { label: "", value: "" }])
  }

  const handleUpdateOption = (index, field, value) => {
    setFieldOptions((prev) => prev.map((option, i) => (i === index ? { ...option, [field]: value } : option)))
  }

  const handleDeleteOption = (index) => {
    setFieldOptions((prev) => prev.filter((_, i) => i !== index))
  }

  const handleAddNestedField = (newField) => {
    setNestedFieldDefinitions((prev) => [...prev, newField])
    setShowNestedFieldModal(false)
    setCurrentNestedField(null)
  }

  const handleUpdateNestedField = (updatedField) => {
    setNestedFieldDefinitions((prev) => prev.map((f, i) => (i === editingNestedFieldIndex ? updatedField : f)))
    setEditingNestedFieldIndex(null)
    setShowNestedFieldModal(false)
    setCurrentNestedField(null)
  }

  const handleDeleteNestedField = (indexToDelete) => {
    if (window.confirm("Are you sure you want to delete this nested field?")) {
      setNestedFieldDefinitions((prev) => prev.filter((_, i) => i !== indexToDelete))
    }
  }

  // Recursive: open popup for nested repeater field
  const openRecursivePopup = (index = null) => {
    console.log('CCC FieldPopup: Opening recursive popup', { index, existingFields: nestedFieldDefinitions })
    
    let initialFieldData = null
    if (index !== null && nestedFieldDefinitions[index]) {
      const field = nestedFieldDefinitions[index]
      initialFieldData = {
        label: field.label,
        name: field.name,
        type: field.type,
        maxSets: field.config?.max_sets || field.maxSets || "",
        allowedFields: field.allowedFields || ["text", "textarea", "image"],
        imageReturnType: field.config?.return_type || field.imageReturnType || "url",
        fieldOptions: field.config?.options ? Object.entries(field.config.options).map(([value, label]) => ({ value, label })) : field.fieldOptions || [],
        nestedFieldDefinitions: field.config?.nested_fields || field.nestedFieldDefinitions || []
      }
      console.log('CCC FieldPopup: Initial field data for edit', initialFieldData)
    }
    
    setRecursivePopupIndex(index)
    setRecursivePopupInitialField(initialFieldData)
    setShowRecursivePopup(true)
  }

  // Recursive: save nested repeater field
  const handleSaveRecursive = (nestedField) => {
    console.log('CCC FieldPopup: Saving recursive field', { nestedField, recursivePopupIndex })
    
    // Process the nested field to ensure proper structure
    const processedField = {
      label: nestedField.label,
      name: nestedField.name,
      type: nestedField.type
    }
    
    // Add config based on field type
    if (nestedField.type === 'repeater') {
      processedField.config = {
        max_sets: nestedField.maxSets ? parseInt(nestedField.maxSets) : 0,
        nested_fields: nestedField.nestedFieldDefinitions || []
      }
    } else if (nestedField.type === 'image') {
      processedField.config = {
        return_type: nestedField.imageReturnType || 'url'
      }
    } else if (['select', 'checkbox', 'radio'].includes(nestedField.type)) {
      // Convert options array to object format
      const optionsObject = {}
      if (nestedField.fieldOptions) {
        nestedField.fieldOptions.forEach((option) => {
          if (option.label && option.value) {
            optionsObject[option.value] = option.label
          }
        })
      }
      processedField.config = {
        options: optionsObject
      }
    }
    
    setNestedFieldDefinitions((prev) => {
      const arr = [...prev]
      if (recursivePopupIndex !== null) {
        arr[recursivePopupIndex] = processedField
      } else {
        arr.push(processedField)
      }
      console.log('CCC FieldPopup: Updated nested field definitions', arr)
      return arr
    })
    setShowRecursivePopup(false)
    setRecursivePopupIndex(null)
    setRecursivePopupInitialField(null)
  }

  // Render nested fields list (with recursive popup for repeaters)
  const renderNestedFields = () => (
    <div className="space-y-2">
      {nestedFieldDefinitions.map((nf, i) => (
        <div key={i} className="flex items-center gap-2 border p-2 rounded">
          <div className="flex-1">
            <span className="font-medium">{nf.label}</span>
            <span className="text-gray-500 ml-2">({nf.type})</span>
            {nf.type === "repeater" && (nf.nestedFieldDefinitions || nf.config?.nested_fields) && (
              <div className="text-xs text-gray-400 mt-1">
                {(nf.nestedFieldDefinitions || nf.config?.nested_fields || []).length} nested field{(nf.nestedFieldDefinitions || nf.config?.nested_fields || []).length !== 1 ? 's' : ''}
              </div>
            )}
          </div>
          <button 
            className="text-blue-600 hover:text-blue-800 underline text-sm" 
            onClick={() => openRecursivePopup(i)}
          >
            Edit
          </button>
          <button 
            className="text-red-600 hover:text-red-800 underline text-sm" 
            onClick={() => handleDeleteNestedField(i)}
          >
            Delete
          </button>
        </div>
      ))}
      <button 
        className="mt-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors duration-200 flex items-center gap-2" 
        onClick={() => openRecursivePopup()}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
        </svg>
        Add Nested Field
      </button>
    </div>
  )

  const handleSubmit = async () => {
    if (!label) {
      showMessage("Please enter a display label", "error")
      return
    }

    if (!name) {
      showMessage("Please enter a field name", "error")
      return
    }

    if (type === "repeater" && allowedFields.length === 0) {
      showMessage("Please select at least one allowed field type for the repeater", "error")
      return
    }

    if (["select", "checkbox", "radio"].includes(type) && fieldOptions.length === 0) {
      showMessage("Please add at least one option for this field type", "error")
      return
    }

    if (type === "repeater" && nestedFieldDefinitions.length === 0) {
      showMessage("Please add at least one nested field for the repeater", "error")
      return
    }

    // Validate nested field definitions for repeaters
    if (type === "repeater") {
      for (let i = 0; i < nestedFieldDefinitions.length; i++) {
        const field = nestedFieldDefinitions[i]
        if (!field.label || !field.name || !field.type) {
          showMessage(`Nested field #${i + 1} is missing required information (label, name, or type)`, "error")
          return
        }
        
        // If it's a nested repeater, ensure it has nested field definitions
        if (field.type === "repeater" && (!field.nestedFieldDefinitions || field.nestedFieldDefinitions.length === 0)) {
          showMessage(`Nested repeater field "${field.label}" must have at least one nested field`, "error")
          return
        }
      }
    }

    // If this is a recursive popup (onSave is provided), save the field data and close
    if (onSave) {
      const fieldData = {
        label,
        name,
        type,
        maxSets,
        allowedFields,
        imageReturnType,
        fieldOptions,
        nestedFieldDefinitions
      }
      
      console.log('CCC FieldPopup: Saving field data for recursive popup', fieldData)
      onSave(fieldData)
      return
    }

    setIsSubmitting(true)
    setError("")

    try {
      const formData = new FormData()
      formData.append("action", "ccc_add_field")
      formData.append("nonce", window.cccData.nonce)
      formData.append("label", label)
      formData.append("name", name)
      formData.append("type", type)
      formData.append("component_id", componentId)

      if (type === "repeater") {
        formData.append("max_sets", maxSets ? Number.parseInt(maxSets) : 0)
        
        // Process nested field definitions to ensure proper structure
        const processedNestedFields = nestedFieldDefinitions.map(field => {
          const processedField = {
            label: field.label,
            name: field.name,
            type: field.type
          }
          
          // Add config if it exists
          if (field.config) {
            processedField.config = field.config
          }
          
          // For repeater fields, ensure nested field definitions are included
          if (field.type === 'repeater' && field.nestedFieldDefinitions) {
            if (!processedField.config) {
              processedField.config = {}
            }
            processedField.config.nested_fields = field.nestedFieldDefinitions
          }
          
          return processedField
        })
        
        console.log('CCC FieldPopup: Sending nested field definitions', processedNestedFields)
        formData.append("nested_field_definitions", JSON.stringify(processedNestedFields))
      } else if (type === "image") {
        formData.append("return_type", imageReturnType)
      } else if (["select", "checkbox", "radio"].includes(type)) {
        // Convert options array to object format expected by backend
        const optionsObject = {}
        fieldOptions.forEach((option) => {
          if (option.label && option.value) {
            optionsObject[option.value] = option.label
          }
        })
        formData.append("field_config", JSON.stringify({ options: optionsObject }))
      }

      const response = await axios.post(window.cccData.ajaxUrl, formData)

      if (response.data.success) {
        showMessage("Field added successfully", "success")
        onFieldAdded()
        onClose()
      } else {
        showMessage(response.data.message || "Failed to add field", "error")
      }
    } catch (error) {
      console.error("Error adding field:", error)
      showMessage("Failed to connect to server. Please try again.", "error")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg transform transition-all duration-300 max-h-[90vh] overflow-y-auto">
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-6 rounded-t-2xl text-white">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold">{onSave ? "Add Nested Field" : "Add New Field"}</h3>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/20 transition-all duration-200"
              disabled={isSubmitting}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {(error || message) && (
            <div
              className={`mb-4 p-3 rounded-lg border-l-4 ${
                error || messageType === "error"
                  ? "bg-red-50 border-red-400 text-red-800"
                  : "bg-green-50 border-green-400 text-green-800"
              }`}
            >
              <p className="font-medium">{error || message}</p>
            </div>
          )}

          <div className="space-y-5">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Display Label *</label>
              <input
                type="text"
                value={label}
                placeholder="Enter display label (e.g., Title)"
                onChange={(e) => {
                  const value = e.target.value
                  setLabel(value)
                  if (!name || name === generateHandle(label)) {
                    setName(generateHandle(value))
                  }
                }}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 disabled:bg-gray-100"
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Handle *</label>
              <input
                type="text"
                value={name}
                placeholder="Enter handle (e.g., title)"
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 disabled:bg-gray-100"
                disabled={isSubmitting}
              />
              <p className="text-xs text-gray-500">This will be used in code. Must be unique.</p>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Field Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 disabled:bg-gray-100"
                disabled={isSubmitting}
              >
                <option value="text">Text</option>
                <option value="textarea">Textarea</option>
                <option value="wysiwyg">WYSIWYG Editor</option>
                <option value="image">Image</option>
                <option value="repeater">Repeater</option>
                <option value="color">Color</option>
                <option value="select">Select</option>
                <option value="checkbox">Checkbox</option>
                <option value="radio">Radio</option>
              </select>
            </div>

            {/* Options Configuration for Select, Checkbox, Radio */}
            {["select", "checkbox", "radio"].includes(type) && (
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">Field Options *</label>
                <p className="text-xs text-gray-500">
                  Define the options available for this {type} field.
                </p>

                {fieldOptions.length === 0 ? (
                  <div className="text-center py-4 text-gray-500 border border-dashed border-gray-300 rounded-lg">
                    <p>No options defined yet.</p>
                    <button
                      type="button"
                      onClick={handleAddOption}
                      className="text-purple-600 hover:underline text-sm mt-2"
                      disabled={isSubmitting}
                    >
                      Add your first option
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {fieldOptions.map((option, index) => (
                      <div key={index} className="flex gap-2 items-center">
                        <input
                          type="text"
                          value={option.label}
                          onChange={(e) => handleUpdateOption(index, "label", e.target.value)}
                          placeholder="Option Label"
                          className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                          disabled={isSubmitting}
                        />
                        <input
                          type="text"
                          value={option.value}
                          onChange={(e) => handleUpdateOption(index, "value", e.target.value)}
                          placeholder="Option Value"
                          className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                          disabled={isSubmitting}
                        />
                        <button
                          type="button"
                          onClick={() => handleDeleteOption(index)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          disabled={isSubmitting}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleAddOption}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 shadow-md hover:shadow-lg"
                  disabled={isSubmitting}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  Add Option
                </button>
              </div>
            )}

            {type === "image" && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Return Type</label>
                <select
                  value={imageReturnType}
                  onChange={(e) => setImageReturnType(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 disabled:bg-gray-100"
                  disabled={isSubmitting}
                >
                  <option value="url">URL Only</option>
                  <option value="array">Full Image Data (ID, URL, Alt, etc.)</option>
                </select>
                <p className="text-xs text-gray-500">
                  Choose whether to return just the image URL or complete image data including ID, alt text, etc.
                </p>
              </div>
            )}

            {type === "repeater" && renderNestedFields()}

            {type === "repeater" && (
              <>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Maximum Sets (leave empty for unlimited)
                  </label>
                  <input
                    type="number"
                    value={maxSets}
                    onChange={(e) => setMaxSets(e.target.value)}
                    placeholder="Unlimited (leave blank for no limit)"
                    min="0"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 disabled:bg-gray-100"
                    disabled={isSubmitting}
                  />
                  <p className="text-xs text-gray-500">
                    Limit how many items can be added to this repeater field.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Allowed Field Types</label>
                  <div className="space-y-3">
                    {availableFieldTypes.map((fieldType) => (
                      <label key={fieldType} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={allowedFields.includes(fieldType)}
                          onChange={(e) => handleAllowedFieldChange(fieldType, e.target.checked)}
                          className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500 disabled:opacity-50"
                          disabled={isSubmitting}
                        />
                        <span className="ml-2 text-sm capitalize text-gray-700">{fieldType}</span>
                      </label>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500">
                    Select which field types can be added inside this repeater field.
                  </p>
                </div>
              </>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-5 bg-gray-50 p-6 rounded-b-2xl">
            <button
              onClick={onClose}
              className="px-6 py-3 text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-100 transition-all duration-200 font-medium disabled:bg-gray-200 disabled:cursor-not-allowed"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className={`bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl font-medium disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed`}
            >
              {isSubmitting ? "Saving..." : (onSave ? "Add Field" : "Save")}
            </button>
          </div>
        </div>
      </div>
      {/* Recursive popup for nested repeater fields */}
      {showRecursivePopup && (
        <FieldPopup
          componentId={componentId}
          initialField={recursivePopupInitialField}
          onSave={handleSaveRecursive}
          onClose={() => setShowRecursivePopup(false)}
          onFieldAdded={() => {}} // Empty function for recursive popup
        />
      )}
    </div>
  )
}

export default FieldPopup