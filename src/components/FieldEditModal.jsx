"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { Plus, X, GripVertical, Edit } from "lucide-react"
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd"
import FieldPopup from "./FieldPopup"

function FieldEditModal({ isOpen, component, field, onClose, onSave }) {
  // Add debugging
  console.log("FieldEditModal rendered with:", { isOpen, field, component })

  const [label, setLabel] = useState("")
  const [name, setName] = useState("")
  const [type, setType] = useState("text")
  const [isRequired, setIsRequired] = useState(false)
  const [placeholder, setPlaceholder] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [maxSets, setMaxSets] = useState("")
  const [nestedFieldDefinitions, setNestedFieldDefinitions] = useState([])
  const [editingNestedFieldIndex, setEditingNestedFieldIndex] = useState(null)
  const [currentNestedField, setCurrentNestedField] = useState(null)
  const [fieldOptions, setFieldOptions] = useState([])
  const [wysiwygSettings, setWysiwygSettings] = useState({
    media_buttons: true,
    teeny: false,
    textarea_rows: 10,
  })

  // FieldPopup state for nested fields
  const [showFieldPopup, setShowFieldPopup] = useState(false)

  const isEditing = !!field

  const availableFieldTypes = [
    "text",
    "textarea",
    "image",
    "repeater",
    "wysiwyg",
    "color",
    "select",
    "checkbox",
    "radio",
  ]

  useEffect(() => {
    console.log("FieldEditModal useEffect triggered:", { field, isOpen })

    if (field) {
      console.log("Loading field data:", field)
      setLabel(field.label || "")
      setName(field.name || "")
      setType(field.type || "text")
      setIsRequired(field.required || false)
      setPlaceholder(field.placeholder || "")

      // Handle field configuration based on type
      if (field.config) {
        try {
          const config = typeof field.config === "string" ? JSON.parse(field.config) : field.config
          console.log("Field config:", config)

          if (field.type === "repeater") {
            setMaxSets(config.max_sets || "")
            setNestedFieldDefinitions(config.nested_fields || [])
          } else if (["select", "checkbox", "radio"].includes(field.type)) {
            const options = config.options || {}
            setFieldOptions(Object.entries(options).map(([value, label]) => ({ value, label })))
          } else if (field.type === "wysiwyg") {
            setWysiwygSettings({
              media_buttons: config.editor_settings?.media_buttons ?? true,
              teeny: config.editor_settings?.teeny ?? false,
              textarea_rows: config.editor_settings?.textarea_rows ?? 10,
            })
          }
        } catch (e) {
          console.error("Error parsing field config:", e)
        }
      }
    } else {
      // Reset form for new field
      setLabel("")
      setName("")
      setType("text")
      setIsRequired(false)
      setPlaceholder("")
      setMaxSets("")
      setNestedFieldDefinitions([])
      setFieldOptions([])
      setWysiwygSettings({
        media_buttons: true,
        teeny: false,
        textarea_rows: 10,
      })
    }

    setError("")
    setEditingNestedFieldIndex(null)
    setShowFieldPopup(false)
    setCurrentNestedField(null)
  }, [field, isOpen])

  const generateHandle = (inputLabel) => {
    return inputLabel
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/[^\w_]+/g, "")
  }

  const handleAddNestedField = (newField) => {
    setNestedFieldDefinitions((prev) => [...prev, newField])
    setShowFieldPopup(false)
    setCurrentNestedField(null)
  }

  const handleUpdateNestedField = (updatedField) => {
    setNestedFieldDefinitions((prev) => prev.map((f, i) => (i === editingNestedFieldIndex ? updatedField : f)))
    setEditingNestedFieldIndex(null)
    setShowFieldPopup(false)
    setCurrentNestedField(null)
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

  const handleAddOption = () => {
    setFieldOptions((prev) => [...prev, { label: "", value: "" }])
  }

  const handleUpdateOption = (index, field, value) => {
    setFieldOptions((prev) => prev.map((option, i) => (i === index ? { ...option, [field]: value } : option)))
  }

  const handleDeleteOption = (index) => {
    setFieldOptions((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!label.trim()) {
      setError("Field label is required")
      return
    }

    if (type === "repeater" && nestedFieldDefinitions.length === 0) {
      setError("Repeater fields must have at least one nested field defined.")
      return
    }

    if (["select", "checkbox", "radio"].includes(type) && fieldOptions.length === 0) {
      setError("Please add at least one option for this field type.")
      return
    }

    // Validate that all options have both label and value
    if (["select", "checkbox", "radio"].includes(type)) {
      const invalidOptions = fieldOptions.filter((option) => !option.label.trim() || !option.value.trim())
      if (invalidOptions.length > 0) {
        setError("All options must have both label and value.")
        return
      }
    }

    setIsSubmitting(true)
    setError("")

    try {
      const formData = new FormData()
      formData.append("action", isEditing ? "ccc_update_field" : "ccc_add_field")
      formData.append("nonce", window.cccData.nonce)
      formData.append("label", label.trim())
      formData.append("name", name || generateHandle(label))
      formData.append("type", type)
      formData.append("component_id", component.id)
      formData.append("required", isRequired ? "1" : "0")
      formData.append("placeholder", placeholder.trim())

      if (isEditing) {
        formData.append("field_id", field.id)
      }

      // Handle different field type configurations
      if (type === "repeater") {
        formData.append("max_sets", maxSets ? Number.parseInt(maxSets) : 0)
        formData.append("nested_field_definitions", JSON.stringify(nestedFieldDefinitions))
      } else if (type === "image") {
        const config = {
          return_type: "url",
        }
        formData.append("field_config", JSON.stringify(config))
      } else if (type === "wysiwyg") {
        const config = {
          editor_settings: wysiwygSettings,
        }
        formData.append("field_config", JSON.stringify(config))
      } else if (["select", "checkbox", "radio"].includes(type)) {
        // Convert options array to object format expected by backend
        const optionsObject = {}
        fieldOptions.forEach((option) => {
          if (option.label.trim() && option.value.trim()) {
            optionsObject[option.value.trim()] = option.label.trim()
          }
        })
        const config = { options: optionsObject }
        if (type === "select") {
          config.multiple = false // Default to single selection, can be extended later
        }
        formData.append("field_config", JSON.stringify(config))
      }

      console.log("Submitting form data:", Object.fromEntries(formData))

      const response = await axios.post(window.cccData.ajaxUrl, formData)

      console.log("Server response:", response.data)

      if (response.data.success) {
        onSave()
      } else {
        setError(response.data.message || `Failed to ${isEditing ? "update" : "create"} field`)
      }
    } catch (error) {
      console.error("Error saving field:", error)
      setError("Failed to connect to server. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-gray-200">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-gray-50 rounded-t-xl">
          <h3 className="text-xl font-semibold text-gray-800">{isEditing ? "Edit Field" : "Add New Field"}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {error && (
            <div className="mb-4 px-4 py-2 rounded-lg bg-red-50 text-red-800 border border-red-200 flex items-center gap-2">
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Field Label */}
            <div className="space-y-2">
              <label htmlFor="label" className="block text-sm font-medium text-gray-700">
                Field Label <span className="text-red-500">*</span>
              </label>
              <input
                id="label"
                type="text"
                value={label}
                onChange={(e) => {
                  const value = e.target.value
                  setLabel(value)
                  if (!isEditing && (!name || name === generateHandle(label))) {
                    setName(generateHandle(value))
                  }
                }}
                placeholder="Enter field label"
                disabled={isSubmitting}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              />
            </div>

            {/* Field Name */}
            <div className="space-y-2">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Field Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="field_name"
                disabled={isSubmitting || isEditing}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors bg-gray-50 text-gray-600"
              />
              <p className="text-xs text-gray-500">
                {isEditing
                  ? "Field name cannot be changed after creation"
                  : "Used in templates. Auto-generated from label if left empty."}
              </p>
            </div>

            {/* Field Type */}
            <div className="space-y-2">
              <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                Field Type
              </label>
              <select
                id="type"
                value={type}
                onChange={(e) => setType(e.target.value)}
                disabled={isSubmitting}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              >
                <option value="text">Text</option>
                <option value="textarea">Textarea</option>
                <option value="image">Image</option>
                <option value="repeater">Repeater</option>
                <option value="wysiwyg">WYSIWYG Editor</option>
                <option value="color">Color</option>
                <option value="select">Select</option>
                <option value="checkbox">Checkbox</option>
                <option value="radio">Radio</option>
              </select>
              {isEditing && <p className="text-xs text-gray-500">Field type can be changed.</p>}
            </div>

            {/* WYSIWYG Settings */}
            {type === "wysiwyg" && (
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 space-y-4">
                <h4 className="text-sm font-medium text-gray-700">WYSIWYG Editor Settings</h4>

                <div className="space-y-3">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="media_buttons"
                      checked={wysiwygSettings.media_buttons}
                      onChange={(e) => setWysiwygSettings((prev) => ({ ...prev, media_buttons: e.target.checked }))}
                      className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      disabled={isSubmitting}
                    />
                    <label htmlFor="media_buttons" className="ml-2 text-sm text-gray-700">
                      Show media buttons
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="teeny"
                      checked={wysiwygSettings.teeny}
                      onChange={(e) => setWysiwygSettings((prev) => ({ ...prev, teeny: e.target.checked }))}
                      className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      disabled={isSubmitting}
                    />
                    <label htmlFor="teeny" className="ml-2 text-sm text-gray-700">
                      Use minimal editor (teeny mode)
                    </label>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="textarea_rows" className="block text-sm font-medium text-gray-700">
                      Editor Height (rows)
                    </label>
                    <input
                      id="textarea_rows"
                      type="number"
                      value={wysiwygSettings.textarea_rows}
                      onChange={(e) =>
                        setWysiwygSettings((prev) => ({
                          ...prev,
                          textarea_rows: Number.parseInt(e.target.value) || 10,
                        }))
                      }
                      min="5"
                      max="30"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Options Configuration for Select, Checkbox, Radio */}
            {["select", "checkbox", "radio"].includes(type) && (
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 space-y-4">
                <h4 className="text-sm font-medium text-gray-700">Field Options</h4>
                <p className="text-xs text-gray-600">Define the options available for this {type} field.</p>

                {fieldOptions.length === 0 ? (
                  <div className="text-center py-4 text-gray-500 border border-dashed border-gray-300 rounded-lg">
                    <p>No options defined yet.</p>
                    <button
                      type="button"
                      onClick={handleAddOption}
                      className="text-indigo-600 hover:underline text-sm mt-2"
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
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                          disabled={isSubmitting}
                        />
                        <input
                          type="text"
                          value={option.value}
                          onChange={(e) => handleUpdateOption(index, "value", e.target.value)}
                          placeholder="Option Value"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                          disabled={isSubmitting}
                        />
                        <button
                          type="button"
                          onClick={() => handleDeleteOption(index)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          disabled={isSubmitting}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleAddOption}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 shadow-md hover:shadow-lg"
                  disabled={isSubmitting}
                >
                  <Plus className="w-5 h-5" />
                  Add Option
                </button>
              </div>
            )}

            {/* Placeholder and Required for non-repeater fields */}
            {type !== "repeater" && !["select", "checkbox", "radio"].includes(type) && (
              <>
                <div className="space-y-2">
                  <label htmlFor="placeholder" className="block text-sm font-medium text-gray-700">
                    Placeholder
                  </label>
                  <input
                    id="placeholder"
                    type="text"
                    value={placeholder}
                    onChange={(e) => setPlaceholder(e.target.value)}
                    placeholder="Enter placeholder text"
                    disabled={isSubmitting}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  />
                </div>
              </>
            )}

            {/* Required field checkbox */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="required"
                checked={isRequired}
                onChange={(e) => setIsRequired(e.target.checked)}
                className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                disabled={isSubmitting}
              />
              <label htmlFor="required" className="ml-2 text-sm text-gray-700">
                Required field
              </label>
            </div>

            {/* Repeater Settings */}
            {type === "repeater" && (
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 space-y-4">
                <h4 className="text-sm font-medium text-gray-700">Repeater Settings</h4>

                <div className="space-y-2">
                  <label htmlFor="maxSets" className="block text-sm font-medium text-gray-700">
                    Max Items
                  </label>
                  <input
                    id="maxSets"
                    type="number"
                    value={maxSets}
                    onChange={(e) => setMaxSets(e.target.value)}
                    placeholder="Unlimited"
                    min="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    disabled={isSubmitting}
                  />
                  <p className="text-xs text-gray-500">Limit the number of items that can be added to this repeater.</p>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-700">Nested Fields</h4>
                  <p className="text-xs text-gray-600">Define the fields that will appear within each repeater item.</p>

                  {nestedFieldDefinitions.length === 0 ? (
                    <div className="text-center py-4 text-gray-500 border border-dashed border-gray-300 rounded-lg">
                      <p>No nested fields defined yet.</p>
                      <button
                        type="button"
                        onClick={() => {
                          setCurrentNestedField(null)
                          setEditingNestedFieldIndex(null)
                          setShowFieldPopup(true)
                        }}
                        className="text-indigo-600 hover:underline text-sm mt-2"
                        disabled={isSubmitting}
                      >
                        Add your first nested field
                      </button>
                    </div>
                  ) : (
                    <DragDropContext onDragEnd={onDragEnd}>
                      <Droppable droppableId="nested-fields">
                        {(provided) => (
                          <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                            {nestedFieldDefinitions.map((nf, index) => (
                              <Draggable key={nf.name + index} draggableId={nf.name + index} index={index}>
                                {(provided) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow"
                                  >
                                    <div className="flex items-center gap-2">
                                      <span {...provided.dragHandleProps}>
                                        <GripVertical className="w-4 h-4 text-gray-400 cursor-grab" />
                                      </span>
                                      <span className="font-medium text-gray-800">{nf.label}</span>
                                      <span className="text-gray-500 mx-1">—</span>
                                      <code className="bg-gray-100 px-2 py-1 rounded text-xs text-gray-600">
                                        {nf.name}
                                      </code>
                                      <span className="ml-2 text-sm text-gray-600 capitalize">({nf.type})</span>
                                    </div>

                                    <div className="flex gap-2">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setCurrentNestedField(nf)
                                          setEditingNestedFieldIndex(index)
                                          setShowFieldPopup(true)
                                        }}
                                        className="p-1 rounded-md text-yellow-600 hover:bg-yellow-50 transition-colors"
                                        disabled={isSubmitting}
                                      >
                                        <Edit className="w-4 h-4" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteNestedField(index)}
                                        className="p-1 rounded-md text-red-600 hover:bg-red-50 transition-colors"
                                        disabled={isSubmitting}
                                      >
                                        <X className="w-4 h-4" />
                                      </button>
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
                    type="button"
                    onClick={() => {
                      setCurrentNestedField(null)
                      setEditingNestedFieldIndex(null)
                      setShowFieldPopup(true)
                    }}
                    className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-200 shadow-md hover:shadow-lg"
                    disabled={isSubmitting}
                  >
                    <Plus className="w-5 h-5" />
                    Add Nested Field
                  </button>
                </div>
              </div>
            )}

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`px-6 py-2 rounded-lg text-white transition-colors ${
                  isSubmitting ? "bg-gray-400 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700"
                }`}
              >
                {isSubmitting ? "Saving..." : isEditing ? "Update" : "Add Field"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {showFieldPopup && (
        <FieldPopup
          isOpen={showFieldPopup}
          field={currentNestedField}
          onClose={() => setShowFieldPopup(false)}
          onSave={editingNestedFieldIndex !== null ? handleUpdateNestedField : handleAddNestedField}
          availableFieldTypes={availableFieldTypes}
        />
      )}
    </div>
  )
}

export default FieldEditModal
