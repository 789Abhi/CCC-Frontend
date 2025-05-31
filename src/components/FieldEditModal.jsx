"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { Plus, X, GripVertical, Edit } from "lucide-react"

function FieldEditModal({ isOpen, component, field, onClose, onSave }) {
  const [label, setLabel] = useState("")
  const [name, setName] = useState("")
  const [type, setType] = useState("text")
  const [isRequired, setIsRequired] = useState(false)
  const [placeholder, setPlaceholder] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

  // Repeater specific states
  const [maxSets, setMaxSets] = useState("")
  const [nestedFieldDefinitions, setNestedFieldDefinitions] = useState([])
  const [editingNestedFieldIndex, setEditingNestedFieldIndex] = useState(null)
  const [showNestedFieldModal, setShowNestedFieldModal] = useState(false)
  const [currentNestedField, setCurrentNestedField] = useState(null)

  const isEditing = !!field

  // Allowed types for nested fields - Repeater is explicitly excluded here.
  const availableFieldTypes = ["text", "textarea", "image"]

  useEffect(() => {
    if (field) {
      setLabel(field.label || "")
      setName(field.name || "")
      setType(field.type || "text")
      setIsRequired(field.required || false)
      setPlaceholder(field.placeholder || "")

      if (field.type === "repeater" && field.config) {
        const config = field.config // config is already parsed object from AjaxHandler
        setMaxSets(config.max_sets || "")
        setNestedFieldDefinitions(config.nested_fields || [])
      } else {
        setMaxSets("")
        setNestedFieldDefinitions([])
      }
    } else {
      setLabel("")
      setName("")
      setType("text")
      setIsRequired(false)
      setPlaceholder("")
      setMaxSets("")
      setNestedFieldDefinitions([])
    }
    setError("")
    setEditingNestedFieldIndex(null)
    setShowNestedFieldModal(false)
    setCurrentNestedField(null)
  }, [field])

  const generateHandle = (inputLabel) => {
    return inputLabel
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/[^\w_]+/g, "")
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

  const handleMoveNestedField = (dragIndex, hoverIndex) => {
    const draggedField = nestedFieldDefinitions[dragIndex]
    const newNestedFields = [...nestedFieldDefinitions]
    newNestedFields.splice(dragIndex, 1)
    newNestedFields.splice(hoverIndex, 0, draggedField)
    setNestedFieldDefinitions(newNestedFields)
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

      // Add type-specific configurations
      if (type === "repeater") {
        formData.append("max_sets", maxSets || "0")
        formData.append("nested_field_definitions", JSON.stringify(nestedFieldDefinitions))
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

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 modal-backdrop">
      <div className="bg-white rounded-custom p-6 w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-semibold mb-4 text-gray-800">{isEditing ? "Edit Field" : "Add New Field"}</h3>

        {error && <div className="mb-4 px-4 py-2 rounded bg-red-100 text-red-800 border border-red-200">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-700 font-medium mb-2">Field Label *</label>
            <input
              type="text"
              value={label}
              onChange={(e) => {
                const value = e.target.value
                setLabel(value)
                if (!isEditing && (!name || name === generateHandle(label))) {
                  setName(generateHandle(value))
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-custom focus:outline-none focus:ring-2 focus:ring-bgPrimary focus:border-transparent"
              placeholder="Enter field label"
              disabled={isSubmitting}
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-2">Field Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-custom focus:outline-none focus:ring-2 focus:ring-bgPrimary focus:border-transparent"
              placeholder="field_name"
              disabled={isSubmitting || isEditing}
            />
            <p className="text-xs text-gray-500 mt-1">
              {isEditing
                ? "Field name cannot be changed after creation"
                : "Used in templates. Auto-generated from label if left empty."}
            </p>
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-2">Field Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-custom focus:outline-none focus:ring-2 focus:ring-bgPrimary focus:border-transparent"
              disabled={isSubmitting || isEditing} // Type cannot be changed after creation
            >
              <option value="text">Text</option>
              <option value="text-area">Textarea</option>
              <option value="image">Image</option>
              <option value="repeater">Repeater</option>
            </select>
            {isEditing && <p className="text-xs text-gray-500 mt-1">Field type cannot be changed after creation.</p>}
          </div>

          {type !== "repeater" && (
            <>
              <div>
                <label className="block text-gray-700 font-medium mb-2">Placeholder Text</label>
                <input
                  type="text"
                  value={placeholder}
                  onChange={(e) => setPlaceholder(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-custom focus:outline-none focus:ring-2 focus:ring-bgPrimary focus:border-transparent"
                  placeholder="Enter placeholder text"
                  disabled={isSubmitting}
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="required"
                  checked={isRequired}
                  onChange={(e) => setIsRequired(e.target.checked)}
                  className="mr-2 rounded focus:ring-bgPrimary"
                  disabled={isSubmitting}
                />
                <label htmlFor="required" className="text-gray-700">
                  Required field
                </label>
              </div>
            </>
          )}

          {type === "repeater" && (
            <div className="border border-gray-200 rounded-custom p-4 bg-gray-50">
              <h4 className="font-medium text-gray-700 mb-3">Repeater Settings</h4>
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">Maximum Items (Optional)</label>
                <input
                  type="number"
                  value={maxSets}
                  onChange={(e) => setMaxSets(e.target.value)}
                  placeholder="Leave empty for unlimited"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-custom focus:outline-none focus:ring-2 focus:ring-bgPrimary focus:border-transparent"
                  disabled={isSubmitting}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Limit the number of items that can be added to this repeater.
                </p>
              </div>

              <div className="mb-4">
                <h4 className="font-medium text-gray-700 mb-2">Nested Fields</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Define the fields that will appear within each repeater item.
                </p>

                {nestedFieldDefinitions.length === 0 ? (
                  <div className="text-center py-4 text-gray-500 border border-dashed border-gray-300 rounded-custom">
                    <p>No nested fields defined yet.</p>
                    <button
                      type="button"
                      onClick={() => {
                        setCurrentNestedField(null)
                        setEditingNestedFieldIndex(null)
                        setShowNestedFieldModal(true)
                      }}
                      className="text-bgPrimary hover:underline text-sm mt-2"
                      disabled={isSubmitting}
                    >
                      Add your first nested field
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {nestedFieldDefinitions.map((nf, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-custom shadow-sm"
                      >
                        <div className="flex items-center gap-2">
                          <GripVertical className="w-4 h-4 text-gray-400 cursor-grab" />
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
                            className="text-yellow-600 hover:text-yellow-800 p-1 rounded-full hover:bg-yellow-50 transition-colors"
                            disabled={isSubmitting}
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteNestedField(index)}
                            className="text-red-600 hover:text-red-800 p-1 rounded-full hover:bg-red-50 transition-colors"
                            disabled={isSubmitting}
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setCurrentNestedField(null)
                    setEditingNestedFieldIndex(null)
                    setShowNestedFieldModal(true)
                  }}
                  className="mt-4 bg-bgPrimary hover:bg-pink-600 text-white font-medium px-4 py-2 rounded-custom flex items-center gap-2 transition-all duration-200 shadow-md hover:shadow-lg"
                  disabled={isSubmitting}
                >
                  <Plus className="w-5 h-5" />
                  Add Nested Field
                </button>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-custom hover:bg-gray-50 transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-6 py-2 rounded-custom text-white transition-colors ${
                isSubmitting ? "bg-gray-400 cursor-not-allowed" : "bg-bgPrimary hover:bg-pink-600"
              }`}
            >
              {isSubmitting ? "Saving..." : isEditing ? "Update" : "Add Field"}
            </button>
          </div>
        </form>

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
    </div>
  )
}

// New component for adding/editing nested fields
function NestedFieldModal({ isOpen, field, onClose, onSave, availableFieldTypes }) {
  const [label, setLabel] = useState("")
  const [name, setName] = useState("")
  const [type, setType] = useState("text")
  const [error, setError] = useState("")

  const isEditing = !!field

  useEffect(() => {
    if (field) {
      setLabel(field.label || "")
      setName(field.name || "")
      setType(field.type || "text")
    } else {
      setLabel("")
      setName("")
      setType("text")
    }
    setError("")
  }, [field])

  const generateHandle = (inputLabel) => {
    return inputLabel
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/[^\w_]+/g, "")
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

    onSave({ label: label.trim(), name: name.trim(), type })
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-[60] modal-backdrop">
      <div className="bg-white rounded-custom p-6 w-full max-w-sm shadow-xl">
        <h4 className="text-lg font-semibold mb-4 text-gray-800">
          {isEditing ? "Edit Nested Field" : "Add Nested Field"}
        </h4>

        {error && <div className="mb-4 px-4 py-2 rounded bg-red-100 text-red-800 border border-red-200">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-700 font-medium mb-2">Label *</label>
            <input
              type="text"
              value={label}
              onChange={(e) => {
                const value = e.target.value
                setLabel(value)
                if (!isEditing && (!name || name === generateHandle(label))) {
                  setName(generateHandle(value))
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-custom focus:outline-none focus:ring-2 focus:ring-bgPrimary focus:border-transparent"
              placeholder="e.g., Item Title"
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-2">Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-custom focus:outline-none focus:ring-2 focus:ring-bgPrimary focus:border-transparent"
              placeholder="e.g., item_title"
              required
            />
            <p className="text-xs text-gray-500 mt-1">Used in code. Must be unique within this repeater.</p>
          </div>
          <div>
            <label className="block text-gray-700 font-medium mb-2">Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-custom focus:outline-none focus:ring-2 focus:ring-bgPrimary focus:border-transparent"
            >
              {availableFieldTypes.map((ft) => (
                <option key={ft} value={ft}>
                  {ft.charAt(0).toUpperCase() + ft.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-custom hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 rounded-custom text-white bg-bgPrimary hover:bg-pink-600 transition-colors"
            >
              {isEditing ? "Update Field" : "Add Field"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default FieldEditModal
