"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd"
import { GripVertical } from "lucide-react"

function FieldPopup({ componentId, onClose, onFieldAdded, initialField, onSave }) {
  const [label, setLabel] = useState(initialField?.label || "")
  const [name, setName] = useState(initialField?.name || "")
  const [type, setType] = useState(initialField?.type || "text")
  const [maxSets, setMaxSets] = useState(initialField?.maxSets || initialField?.config?.max_sets || "")
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

  // Effect to handle initial field data changes
  useEffect(() => {
    if (initialField) {
      console.log('CCC FieldPopup: Initial field data received', initialField)
      
      setLabel(initialField.label || "")
      setName(initialField.name || "")
      setType(initialField.type || "text")
      setMaxSets(initialField.maxSets || initialField.config?.max_sets || "")
      setImageReturnType(initialField.returnType || initialField.config?.return_type || "url")
      
      // Handle field options
      if (initialField.config?.options) {
        const options = Object.entries(initialField.config.options).map(([value, label]) => ({ value, label }))
        setFieldOptions(options)
      } else if (initialField.fieldOptions) {
        setFieldOptions(initialField.fieldOptions)
      } else {
        setFieldOptions([])
      }
      
      // Handle nested field definitions
      let nestedFields = []
      if (initialField.type === 'repeater') {
        nestedFields = initialField.config?.nested_fields || initialField.nestedFieldDefinitions || []
      }
      setNestedFieldDefinitions(nestedFields)
      
      console.log('CCC FieldPopup: Loaded nested field definitions', nestedFields)
    }
  }, [initialField])

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

  const handleAddOption = () => {
    setFieldOptions((prev) => [...prev, { label: "", value: "" }])
  }

  const handleUpdateOption = (index, field, value) => {
    setFieldOptions((prev) => prev.map((option, i) => (i === index ? { ...option, [field]: value } : option)))
  }

  const handleDeleteOption = (index) => {
    setFieldOptions((prev) => prev.filter((_, i) => i !== index))
  }

  const handleDeleteNestedField = (indexToDelete) => {
    if (window.confirm("Are you sure you want to delete this nested field?")) {
      setNestedFieldDefinitions((prev) => prev.filter((_, i) => i !== indexToDelete))
    }
  }

  const onDragEnd = (result) => {
    if (!result.destination) return

    const reorderedFields = Array.from(nestedFieldDefinitions)
    const [removed] = reorderedFields.splice(result.source.index, 1)
    reorderedFields.splice(result.destination.index, 0, removed)

    setNestedFieldDefinitions(reorderedFields)
  }

  // Recursive: open popup for nested repeater field
  const openRecursivePopup = (index = null) => {
    console.log('CCC FieldPopup: Opening recursive popup', { index, existingFields: nestedFieldDefinitions })
    
    let initialFieldData = null
    if (index !== null && nestedFieldDefinitions[index]) {
      const field = nestedFieldDefinitions[index]
      console.log('CCC FieldPopup: Field to edit', field)
      
      // Extract nested field definitions properly - handle both data structures
      let nestedFields = []
      if (field.type === 'repeater') {
        // Check multiple possible locations for nested fields
        nestedFields = field.config?.nested_fields || 
                      field.nestedFieldDefinitions || 
                      field.nested_fields || 
                      []
        console.log('CCC FieldPopup: Found nested fields in repeater', nestedFields)
      }
      
      // Extract field options properly
      let fieldOpts = []
      if (['select', 'checkbox', 'radio'].includes(field.type)) {
        if (field.config?.options) {
          fieldOpts = Object.entries(field.config.options).map(([value, label]) => ({ value, label }))
        } else if (field.fieldOptions) {
          fieldOpts = field.fieldOptions
        }
      }
      
      initialFieldData = {
        label: field.label,
        name: field.name,
        type: field.type,
        maxSets: field.config?.max_sets || field.maxSets || "",
        imageReturnType: field.config?.return_type || field.imageReturnType || "url",
        fieldOptions: fieldOpts,
        nestedFieldDefinitions: nestedFields
      }
      console.log('CCC FieldPopup: Initial field data for edit', initialFieldData)
      console.log('CCC FieldPopup: Extracted nested fields', nestedFields)
    }
    
    setRecursivePopupIndex(index)
    setRecursivePopupInitialField(initialFieldData)
    setShowRecursivePopup(true)
  }

  // Recursive: save nested repeater field
  const handleSaveRecursive = (nestedField) => {
    console.log('CCC FieldPopup: Saving recursive field', { nestedField, recursivePopupIndex })
    
    // Process the nested field to ensure proper structure for unlimited nesting
    const processedField = {
      label: nestedField.label,
      name: nestedField.name,
      type: nestedField.type
    }
    
    // Add config based on field type
    if (nestedField.type === 'repeater') {
      // For repeater fields, always store nested fields in config.nested_fields
      // This ensures consistency across all nesting levels
      processedField.config = {
        max_sets: nestedField.maxSets ? parseInt(nestedField.maxSets) : 0,
        nested_fields: nestedField.nestedFieldDefinitions || []
      }
      console.log('CCC FieldPopup: Processed repeater field with nested fields', processedField.config.nested_fields)
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

  // Render nested fields list with better visual hierarchy
  const renderNestedFields = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h4 className="text-sm font-semibold text-gray-700">Nested Fields</h4>
        </div>
        <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full font-medium">
          {nestedFieldDefinitions.length} field{nestedFieldDefinitions.length !== 1 ? 's' : ''}
        </span>
      </div>
      
      {nestedFieldDefinitions.length === 0 ? (
        <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100">
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <p className="text-sm font-medium">No nested fields defined yet</p>
          <p className="text-xs mt-1 text-gray-400">Add fields that will appear within each repeater item</p>
        </div>
      ) : (
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="nested-fields-popup">
            {(provided, snapshot) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className={`space-y-3 transition-all duration-200 ${
                  snapshot.isDraggingOver ? 'bg-blue-50 rounded-lg p-2' : ''
                }`}
              >
                {nestedFieldDefinitions.map((nf, i) => (
                  <Draggable key={nf.name + i} draggableId={nf.name + i} index={i}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200 group ${
                          snapshot.isDragging ? 'shadow-2xl rotate-2 scale-105 z-50' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <div
                                {...provided.dragHandleProps}
                                className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-100 rounded transition-colors"
                              >
                                <GripVertical className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                              </div>
                              <span className="font-semibold text-gray-800">{nf.label}</span>
                              <span className="text-xs bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 px-2 py-1 rounded-full capitalize font-medium">
                                {nf.type}
                              </span>
                            </div>
                            
                            {/* Show nested field count for repeater fields */}
                            {nf.type === "repeater" && (
                              <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                                <div className="w-4 h-4 bg-gray-200 rounded-full flex items-center justify-center">
                                  <svg className="w-2 h-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                  </svg>
                                </div>
                                <span className="font-medium">
                                  {(nf.config?.nested_fields || nf.nestedFieldDefinitions || nf.nested_fields || []).length} nested field{(nf.config?.nested_fields || nf.nestedFieldDefinitions || nf.nested_fields || []).length !== 1 ? 's' : ''}
                                </span>
                              </div>
                            )}
                            
                            <code className="text-xs text-gray-500 mt-2 block bg-gray-50 px-2 py-1 rounded font-mono">{nf.name}</code>
                          </div>
                          
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <button 
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 hover:scale-105" 
                              onClick={() => openRecursivePopup(i)}
                              title="Edit field"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button 
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 hover:scale-105" 
                              onClick={() => handleDeleteNestedField(i)}
                              title="Delete field"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}
      
      <button 
        className="w-full mt-4 px-4 py-3 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 text-white rounded-xl transition-all duration-200 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl font-medium group" 
        onClick={() => openRecursivePopup()}
        disabled={isSubmitting}
      >
        <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
      const validateNestedFieldsRecursively = (fields, level = 1) => {
        for (let i = 0; i < fields.length; i++) {
          const field = fields[i]
          if (!field.label || !field.name || !field.type) {
            showMessage(`Nested field #${i + 1} at level ${level} is missing required information (label, name, or type)`, "error")
            return false
          }
          
          // If it's a nested repeater, ensure it has nested field definitions
          if (field.type === "repeater") {
            const nestedFields = field.config?.nested_fields || field.nestedFieldDefinitions || []
            if (nestedFields.length === 0) {
              showMessage(`Nested repeater field "${field.label}" at level ${level} must have at least one nested field`, "error")
              return false
            }
            
            // Recursively validate nested fields
            if (!validateNestedFieldsRecursively(nestedFields, level + 1)) {
              return false
            }
          }
        }
        return true
      }
      
      if (!validateNestedFieldsRecursively(nestedFieldDefinitions)) {
        return
      }
    }

    // If this is a recursive popup (onSave is provided), save the field data and close
    if (onSave) {
      const fieldData = {
        label,
        name,
        type,
        maxSets,
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
        
        // Process nested field definitions recursively for unlimited nesting levels
        const processNestedFieldsRecursively = (fields) => {
          return fields.map(field => {
            const processedField = {
              label: field.label,
              name: field.name,
              type: field.type
            }
            
            // Handle different field types
            if (field.type === 'repeater') {
              // For repeater fields, always use config.nested_fields structure
              // This ensures consistency across all nesting levels
              processedField.config = {
                max_sets: field.config?.max_sets || field.maxSets || 0,
                nested_fields: field.config?.nested_fields || field.nestedFieldDefinitions || []
              }
              
              // Recursively process nested fields if they exist
              if (processedField.config.nested_fields && processedField.config.nested_fields.length > 0) {
                processedField.config.nested_fields = processNestedFieldsRecursively(processedField.config.nested_fields)
              }
              
              console.log('CCC FieldPopup: Processed nested repeater field', field.label, processedField.config)
            } else if (field.type === 'image') {
              processedField.config = {
                return_type: field.config?.return_type || field.imageReturnType || 'url'
              }
            } else if (['select', 'checkbox', 'radio'].includes(field.type)) {
              // Handle options for select/checkbox/radio fields
              let optionsObject = {}
              if (field.config?.options) {
                optionsObject = field.config.options
              } else if (field.fieldOptions) {
                field.fieldOptions.forEach((option) => {
                  if (option.label && option.value) {
                    optionsObject[option.value] = option.label
                  }
                })
              }
              processedField.config = {
                options: optionsObject
              }
            }
            
            return processedField
          })
        }
        
        const processedNestedFields = processNestedFieldsRecursively(nestedFieldDefinitions)
        
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg transform transition-all duration-300 max-h-[90vh] overflow-y-auto border border-gray-100">
        {/* Enhanced Header with better design */}
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-6 rounded-t-2xl text-white relative overflow-hidden">
          {/* Background pattern for visual appeal */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -mr-16 -mt-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full -ml-12 -mb-12"></div>
          </div>
          
          <div className="flex justify-between items-center relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold">
                  {onSave ? (initialField ? "Edit Nested Field" : "Add Nested Field") : "Add New Field"}
                </h3>
                {onSave && initialField && (
                  <p className="text-sm text-white/80 mt-1">
                    Editing: {initialField.label || "Nested Field"}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white p-2 rounded-lg hover:bg-white/20 transition-all duration-200 group"
              disabled={isSubmitting}
            >
              <svg className="w-6 h-6 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {(error || message) && (
            <div
              className={`mb-4 p-4 rounded-xl border-l-4 shadow-sm ${
                error || messageType === "error"
                  ? "bg-red-50 border-red-400 text-red-800"
                  : "bg-green-50 border-green-400 text-green-800"
              }`}
            >
              <div className="flex items-center gap-2">
                {error || messageType === "error" ? (
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                <p className="font-medium">{error || message}</p>
              </div>
            </div>
          )}

          <div className="space-y-6">
            {/* Enhanced form fields with better styling */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
                Display Label *
              </label>
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
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 disabled:bg-gray-50 shadow-sm"
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                Handle *
              </label>
              <input
                type="text"
                value={name}
                placeholder="Enter handle (e.g., title)"
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 disabled:bg-gray-50 shadow-sm"
                disabled={isSubmitting}
              />
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                This will be used in code. Must be unique.
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                <span className="w-2 h-2 bg-pink-500 rounded-full"></span>
                Field Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all duration-200 disabled:bg-gray-50 shadow-sm"
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
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Maximum Items (optional)
                </label>
                <input
                  type="number"
                  value={maxSets}
                  onChange={(e) => setMaxSets(e.target.value)}
                  placeholder="Leave empty for unlimited"
                  min="0"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 disabled:bg-gray-100"
                  disabled={isSubmitting}
                />
                <p className="text-xs text-gray-500">
                  Limit how many items can be added to this repeater field. Leave empty for unlimited.
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-5 bg-gradient-to-r from-gray-50 to-gray-100 p-6 rounded-b-2xl border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-6 py-3 text-gray-600 border border-gray-200 rounded-xl hover:bg-white hover:border-gray-300 transition-all duration-200 font-medium disabled:bg-gray-200 disabled:cursor-not-allowed shadow-sm"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className={`bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 text-white px-6 py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl font-medium disabled:from-gray-400 disabled:via-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed flex items-center gap-2`}
            >
              {isSubmitting ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : onSave ? (
                initialField ? (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    Update Field
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                    </svg>
                    Add Field
                  </>
                )
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  Save
                </>
              )}
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