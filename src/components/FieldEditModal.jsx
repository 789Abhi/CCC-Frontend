"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { Plus, X, GripVertical, Edit } from "lucide-react"
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd"

function FieldEditModal({ isOpen, component, field, onClose, onSave }) {
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
  const [showNestedFieldModal, setShowNestedFieldModal] = useState(false)
  const [currentNestedField, setCurrentNestedField] = useState(null)

  // New field configuration states
  const [fieldOptions, setFieldOptions] = useState([])
  const [allowMultiple, setAllowMultiple] = useState(false)
  const [selectedTaxonomy, setSelectedTaxonomy] = useState("category")
  const [returnType, setReturnType] = useState("url")

  const isEditing = !!field
  const availableFieldTypes = [
    "text",
    "textarea",
    "wysiwyg",
    "checkbox",
    "select",
    "radio",
    "button_group",
    "color",
    "video",
    "oembed",
    "relationship",
    "page_link",
    "taxonomy_term",
    "tab",
    "toggle",
    "image",
    "repeater",
  ]

  const availableTaxonomies = [
    { value: "category", label: "Categories" },
    { value: "post_tag", label: "Tags" },
    { value: "product_cat", label: "Product Categories" },
    { value: "product_tag", label: "Product Tags" },
  ]

  useEffect(() => {
    if (field) {
      setLabel(field.label || "")
      setName(field.name || "")
      setType(field.type || "text")
      setIsRequired(field.required || false)
      setPlaceholder(field.placeholder || "")

      if (field.config) {
        const config = typeof field.config === "string" ? JSON.parse(field.config) : field.config

        // Handle different field type configurations
        if (field.type === "repeater") {
          setMaxSets(config.max_sets || "")
          setNestedFieldDefinitions(config.nested_fields || [])
        } else if (
          field.type === "checkbox" ||
          field.type === "select" ||
          field.type === "radio" ||
          field.type === "button_group"
        ) {
          setFieldOptions(
            config.options ? Object.entries(config.options).map(([value, label]) => ({ value, label })) : [],
          )
          setAllowMultiple(config.multiple || false)
        } else if (field.type === "taxonomy_term") {
          setSelectedTaxonomy(config.taxonomy || "category")
        } else if (field.type === "image") {
          setReturnType(config.return_type || "url")
        }
      } else {
        resetFieldConfig()
      }
    } else {
      setLabel("")
      setName("")
      setType("text")
      setIsRequired(false)
      setPlaceholder("")
      resetFieldConfig()
    }
    setError("")
    setEditingNestedFieldIndex(null)
    setShowNestedFieldModal(false)
    setCurrentNestedField(null)
  }, [field])

  const resetFieldConfig = () => {
    setMaxSets("")
    setNestedFieldDefinitions([])
    setFieldOptions([])
    setAllowMultiple(false)
    setSelectedTaxonomy("category")
    setReturnType("url")
  }

  const generateHandle = (inputLabel) => {
    return inputLabel
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/[^\w_]+/g, "")
  }

  const handleAddOption = () => {
    setFieldOptions([...fieldOptions, { value: "", label: "" }])
  }

  const handleRemoveOption = (index) => {
    setFieldOptions(fieldOptions.filter((_, i) => i !== index))
  }

  const handleOptionChange = (index, field, value) => {
    const newOptions = [...fieldOptions]
    newOptions[index][field] = value
    if (field === "label" && !newOptions[index].value) {
      newOptions[index].value = generateHandle(value)
    }
    setFieldOptions(newOptions)
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

  const onDragEnd = (result) => {
    if (!result.destination) return
    const reorderedFields = Array.from(nestedFieldDefinitions)
    const [removed] = reorderedFields.splice(result.source.index, 1)
    reorderedFields.splice(result.destination.index, 0, removed)
    setNestedFieldDefinitions(reorderedFields)
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

    if (
      (type === "checkbox" || type === "select" || type === "radio" || type === "button_group") &&
      fieldOptions.length === 0
    ) {
      setError("This field type requires at least one option.")
      return
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
      let config = {}

      if (type === "repeater") {
        config = {
          max_sets: maxSets || "0",
          nested_fields: nestedFieldDefinitions,
        }
      } else if (type === "checkbox" || type === "select" || type === "radio" || type === "button_group") {
        const optionsObj = {}
        fieldOptions.forEach((option) => {
          if (option.value && option.label) {
            optionsObj[option.value] = option.label
          }
        })
        config = {
          options: optionsObj,
          multiple: allowMultiple,
        }
      } else if (type === "taxonomy_term") {
        config = {
          taxonomy: selectedTaxonomy,
        }
      } else if (type === "image") {
        config = {
          return_type: returnType,
        }
      }

      if (Object.keys(config).length > 0) {
        formData.append("field_config", JSON.stringify(config))
      }

      const response = await axios.post(window.cccData.ajaxUrl, formData)

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

  const renderFieldTypeConfig = () => {
    switch (type) {
      case "repeater":
        return (
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
                      setShowNestedFieldModal(true)
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
                                  <code className="bg-gray-100 px-2 py-1 rounded text-xs text-gray-600">{nf.name}</code>
                                  <span className="ml-2 text-sm text-gray-600 capitalize">({nf.type})</span>
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setCurrentNestedField(nf)
                                      setEditingNestedFieldIndex(index)
                                      setShowNestedFieldModal(true)
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
                  setShowNestedFieldModal(true)
                }}
                className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-200 shadow-md hover:shadow-lg"
                disabled={isSubmitting}
              >
                <Plus className="w-5 h-5" />
                Add Nested Field
              </button>
            </div>
          </div>
        )

      case "checkbox":
      case "select":
      case "radio":
      case "button_group":
        return (
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 space-y-4">
            <h4 className="text-sm font-medium text-gray-700">Options Configuration</h4>

            {type === "select" && (
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="allowMultiple"
                  checked={allowMultiple}
                  onChange={(e) => setAllowMultiple(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  disabled={isSubmitting}
                />
                <label htmlFor="allowMultiple" className="ml-2 text-sm text-gray-700">
                  Allow multiple selections
                </label>
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Options</label>
              {fieldOptions.map((option, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <input
                    type="text"
                    placeholder="Label"
                    value={option.label}
                    onChange={(e) => handleOptionChange(index, "label", e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    disabled={isSubmitting}
                  />
                  <input
                    type="text"
                    placeholder="Value"
                    value={option.value}
                    onChange={(e) => handleOptionChange(index, "value", e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveOption(index)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    disabled={isSubmitting}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={handleAddOption}
                className="w-full py-2 px-4 border border-dashed border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
                disabled={isSubmitting}
              >
                <Plus className="w-4 h-4 inline mr-2" />
                Add Option
              </button>
            </div>
          </div>
        )

      case "taxonomy_term":
        return (
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 space-y-4">
            <h4 className="text-sm font-medium text-gray-700">Taxonomy Settings</h4>
            <div className="space-y-2">
              <label htmlFor="taxonomy" className="block text-sm font-medium text-gray-700">
                Select Taxonomy
              </label>
              <select
                id="taxonomy"
                value={selectedTaxonomy}
                onChange={(e) => setSelectedTaxonomy(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                disabled={isSubmitting}
              >
                {availableTaxonomies.map((tax) => (
                  <option key={tax.value} value={tax.value}>
                    {tax.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )

      case "image":
        return (
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 space-y-4">
            <h4 className="text-sm font-medium text-gray-700">Image Settings</h4>
            <div className="space-y-2">
              <label htmlFor="returnType" className="block text-sm font-medium text-gray-700">
                Return Type
              </label>
              <select
                id="returnType"
                value={returnType}
                onChange={(e) => setReturnType(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                disabled={isSubmitting}
              >
                <option value="url">URL Only</option>
                <option value="array">Full Image Data (ID, URL, Alt, etc.)</option>
              </select>
              <p className="text-xs text-gray-500">
                Choose whether to return just the image URL or complete image data including ID, alt text, etc.
              </p>
            </div>
          </div>
        )

      case "wysiwyg":
        return (
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 space-y-4">
            <h4 className="text-sm font-medium text-gray-700">WYSIWYG Editor Settings</h4>
            <p className="text-sm text-gray-600">
              This field will provide a full rich text editor with formatting options including:
            </p>
            <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
              <li>Headings (H1-H6)</li>
              <li>Text formatting (Bold, Italic, Underline)</li>
              <li>Lists (Bulleted and Numbered)</li>
              <li>Text alignment (Left, Center, Right, Justify)</li>
              <li>Colors and background colors</li>
              <li>Links and media insertion</li>
              <li>Visual and Text editing modes</li>
            </ul>
          </div>
        )

      case "color":
        return (
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 space-y-4">
            <h4 className="text-sm font-medium text-gray-700">Color Picker Settings</h4>
            <p className="text-sm text-gray-600">
              This field will provide a color picker interface for selecting colors.
            </p>
          </div>
        )

      case "toggle":
        return (
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 space-y-4">
            <h4 className="text-sm font-medium text-gray-700">Toggle Settings</h4>
            <p className="text-sm text-gray-600">This field will provide a toggle switch for True/False values.</p>
          </div>
        )

      case "video":
        return (
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 space-y-4">
            <h4 className="text-sm font-medium text-gray-700">Video Field Settings</h4>
            <p className="text-sm text-gray-600">
              This field allows users to enter video URLs from platforms like YouTube, Vimeo, etc.
            </p>
          </div>
        )

      case "oembed":
        return (
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 space-y-4">
            <h4 className="text-sm font-medium text-gray-700">oEmbed Settings</h4>
            <p className="text-sm text-gray-600">
              This field allows embedding content from various platforms using oEmbed protocol.
            </p>
          </div>
        )

      case "page_link":
        return (
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 space-y-4">
            <h4 className="text-sm font-medium text-gray-700">Page Link Settings</h4>
            <p className="text-sm text-gray-600">This field allows users to select from existing pages on the site.</p>
          </div>
        )

      default:
        return null
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
                onChange={(e) => {
                  setType(e.target.value)
                  resetFieldConfig()
                }}
                disabled={isSubmitting}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              >
                <option value="text">Text</option>
                <option value="textarea">Textarea</option>
                <option value="wysiwyg">WYSIWYG Editor</option>
                <option value="checkbox">Checkbox</option>
                <option value="select">Select Dropdown</option>
                <option value="radio">Radio Button</option>
                <option value="button_group">Button Group</option>
                <option value="color">Color Picker</option>
                <option value="video">Video</option>
                <option value="oembed">oEmbed</option>
                <option value="relationship">Relationship</option>
                <option value="page_link">Page Link</option>
                <option value="taxonomy_term">Taxonomy Term</option>
                <option value="tab">Tab</option>
                <option value="toggle">Toggle (True/False)</option>
                <option value="image">Image</option>
                <option value="repeater">Repeater</option>
              </select>
            </div>

            {/* Placeholder and Required for applicable fields */}
            {!["repeater", "checkbox", "radio", "button_group", "toggle", "color"].includes(type) && (
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
              </>
            )}

            {/* Field Type Specific Configuration */}
            {renderFieldTypeConfig()}

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

      {showNestedFieldModal && (
        <NestedFieldModal
          isOpen={showNestedFieldModal}
          field={currentNestedField}
          onClose={() => setShowNestedFieldModal(false)}
          onSave={editingNestedFieldIndex !== null ? handleUpdateNestedField : handleAddNestedField}
          availableFieldTypes={availableFieldTypes}
        />
      )}
    </div>
  )
}

function NestedFieldModal({ isOpen, field, onClose, onSave, availableFieldTypes }) {
  const [label, setLabel] = useState("")
  const [name, setName] = useState("")
  const [type, setType] = useState("text")
  const [error, setError] = useState("")
  const [fieldOptions, setFieldOptions] = useState([])
  const [selectedTaxonomy, setSelectedTaxonomy] = useState("category")
  const [returnType, setReturnType] = useState("url")

  const isEditing = !!field

  const availableTaxonomies = [
    { value: "category", label: "Categories" },
    { value: "post_tag", label: "Tags" },
    { value: "product_cat", label: "Product Categories" },
    { value: "product_tag", label: "Product Tags" },
  ]

  useEffect(() => {
    if (field) {
      setLabel(field.label || "")
      setName(field.name || "")
      setType(field.type || "text")

      if (field.config) {
        const config = typeof field.config === "string" ? JSON.parse(field.config) : field.config

        if (
          field.type === "checkbox" ||
          field.type === "select" ||
          field.type === "radio" ||
          field.type === "button_group"
        ) {
          setFieldOptions(
            config.options ? Object.entries(config.options).map(([value, label]) => ({ value, label })) : [],
          )
        } else if (field.type === "taxonomy_term") {
          setSelectedTaxonomy(config.taxonomy || "category")
        } else if (field.type === "image") {
          setReturnType(config.return_type || "url")
        }
      } else {
        resetConfig()
      }
    } else {
      setLabel("")
      setName("")
      setType("text")
      resetConfig()
    }
    setError("")
  }, [field])

  const resetConfig = () => {
    setFieldOptions([])
    setSelectedTaxonomy("category")
    setReturnType("url")
  }

  const generateHandle = (inputLabel) => {
    return inputLabel
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/[^\w_]+/g, "")
  }

  const handleAddOption = () => {
    setFieldOptions([...fieldOptions, { value: "", label: "" }])
  }

  const handleRemoveOption = (index) => {
    setFieldOptions(fieldOptions.filter((_, i) => i !== index))
  }

  const handleOptionChange = (index, field, value) => {
    const newOptions = [...fieldOptions]
    newOptions[index][field] = value
    if (field === "label" && !newOptions[index].value) {
      newOptions[index].value = generateHandle(value)
    }
    setFieldOptions(newOptions)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!label.trim()) {
      setError("Label is required.")
      return
    }
    if (!name.trim()) {
      setError("Name is required.")
      return
    }

    const newFieldData = {
      label: label.trim(),
      name: name.trim(),
      type,
    }

    // Add configuration based on field type
    const config = {}

    if (type === "checkbox" || type === "select" || type === "radio" || type === "button_group") {
      if (fieldOptions.length === 0) {
        setError("This field type requires at least one option.")
        return
      }
      const optionsObj = {}
      fieldOptions.forEach((option) => {
        if (option.value && option.label) {
          optionsObj[option.value] = option.label
        }
      })
      config.options = optionsObj
    } else if (type === "taxonomy_term") {
      config.taxonomy = selectedTaxonomy
    } else if (type === "image") {
      config.return_type = returnType
    }

    if (Object.keys(config).length > 0) {
      newFieldData.config = config
    }

    onSave(newFieldData)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-gray-200">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-gray-50 rounded-t-xl">
          <h3 className="text-xl font-semibold text-gray-800">
            {isEditing ? "Edit Nested Field" : "Add Nested Field"}
          </h3>
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
            {/* Label */}
            <div className="space-y-2">
              <label htmlFor="nestedLabel" className="block text-sm font-medium text-gray-700">
                Label <span className="text-red-500">*</span>
              </label>
              <input
                id="nestedLabel"
                type="text"
                value={label}
                onChange={(e) => {
                  const value = e.target.value
                  setLabel(value)
                  if (!isEditing && (!name || name === generateHandle(label))) {
                    setName(generateHandle(value))
                  }
                }}
                placeholder="e.g., Item Title"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              />
            </div>

            {/* Name */}
            <div className="space-y-2">
              <label htmlFor="nestedName" className="block text-sm font-medium text-gray-700">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                id="nestedName"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., item_title"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              />
              <p className="text-xs text-gray-500">Used in code. Must be unique within this repeater.</p>
            </div>

            {/* Type */}
            <div className="space-y-2">
              <label htmlFor="nestedType" className="block text-sm font-medium text-gray-700">
                Type
              </label>
              <select
                id="nestedType"
                value={type}
                onChange={(e) => {
                  setType(e.target.value)
                  resetConfig()
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              >
                {availableFieldTypes
                  .filter((ft) => ft !== "repeater")
                  .map((ft) => (
                    <option key={ft} value={ft}>
                      {ft.charAt(0).toUpperCase() + ft.slice(1).replace("_", " ")}
                    </option>
                  ))}
              </select>
            </div>

            {/* Field Type Specific Configuration */}
            {(type === "checkbox" || type === "select" || type === "radio" || type === "button_group") && (
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 space-y-4">
                <h4 className="text-sm font-medium text-gray-700">Options Configuration</h4>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Options</label>
                  {fieldOptions.map((option, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <input
                        type="text"
                        placeholder="Label"
                        value={option.label}
                        onChange={(e) => handleOptionChange(index, "label", e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <input
                        type="text"
                        placeholder="Value"
                        value={option.value}
                        onChange={(e) => handleOptionChange(index, "value", e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveOption(index)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={handleAddOption}
                    className="w-full py-2 px-4 border border-dashed border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    <Plus className="w-4 h-4 inline mr-2" />
                    Add Option
                  </button>
                </div>
              </div>
            )}

            {type === "taxonomy_term" && (
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 space-y-4">
                <h4 className="text-sm font-medium text-gray-700">Taxonomy Settings</h4>
                <div className="space-y-2">
                  <label htmlFor="nestedTaxonomy" className="block text-sm font-medium text-gray-700">
                    Select Taxonomy
                  </label>
                  <select
                    id="nestedTaxonomy"
                    value={selectedTaxonomy}
                    onChange={(e) => setSelectedTaxonomy(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  >
                    {availableTaxonomies.map((tax) => (
                      <option key={tax.value} value={tax.value}>
                        {tax.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {type === "image" && (
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 space-y-4">
                <h4 className="text-sm font-medium text-gray-700">Image Settings</h4>
                <div className="space-y-2">
                  <label htmlFor="nestedReturnType" className="block text-sm font-medium text-gray-700">
                    Return Type
                  </label>
                  <select
                    id="nestedReturnType"
                    value={returnType}
                    onChange={(e) => setReturnType(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  >
                    <option value="url">URL Only</option>
                    <option value="array">Full Image Data (ID, URL, Alt, etc.)</option>
                  </select>
                </div>
              </div>
            )}

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
              >
                {isEditing ? "Update Field" : "Add Field"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default FieldEditModal
