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

  // Allowed types for nested fields - Repeater is now included
  const availableFieldTypes = ["text", "textarea", "image", "repeater"]

  useEffect(() => {
    if (field) {
      setLabel(field.label || "")
      setName(field.name || "")
      setType(field.type || "text")
      setIsRequired(field.required || false)
      setPlaceholder(field.placeholder || "") // Load placeholder value
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
      } else if (type === "image") {
        // Image fields always return URL
        formData.append("return_type", "url")
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-gray-800">{isEditing ? "Edit Field" : "Add New Field"}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">
            &times;
          </button>
        </div>

        {error && <div className="mb-4 px-4 py-2 rounded bg-red-100 text-red-800 border border-red-200">{error}</div>}

        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="label" className="text-right text-gray-700">
              Field Label *
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
              className="col-span-3 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="name" className="text-right text-gray-700">
              Field Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="field_name"
              disabled={isSubmitting || isEditing}
              className="col-span-3 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
            <p className="col-span-4 text-xs text-gray-500 text-center">
              {isEditing
                ? "Field name cannot be changed after creation"
                : "Used in templates. Auto-generated from label if left empty."}
            </p>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="type" className="text-right text-gray-700">
              Field Type
            </label>
            <select
              id="type"
              value={type}
              onChange={(e) => setType(e.target.value)}
              disabled={isSubmitting}
              className="col-span-3 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
            >
              <option value="text">Text</option>
              <option value="text-area">Textarea</option>
              <option value="image">Image</option>
              <option value="repeater">Repeater</option>
            </select>
            {isEditing && <p className="col-span-4 text-xs text-gray-500 text-center">Field type can be changed.</p>}
          </div>

          {type !== "repeater" && (
            <>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="placeholder" className="text-right text-gray-700">
                  Placeholder
                </label>
                <input
                  id="placeholder"
                  type="text"
                  value={placeholder}
                  onChange={(e) => setPlaceholder(e.target.value)}
                  placeholder="Enter placeholder text"
                  disabled={isSubmitting}
                  className="col-span-3 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>

              <div className="flex items-center col-span-4 justify-center">
                <input
                  type="checkbox"
                  id="required"
                  checked={isRequired}
                  onChange={(e) => setIsRequired(e.target.checked)}
                  className="mr-2 rounded focus:ring-pink-500"
                  disabled={isSubmitting}
                />
                <label htmlFor="required" className="text-gray-700">
                  Required field
                </label>
              </div>
            </>
          )}

          {type === "repeater" && (
            <div className="border border-gray-200 rounded-md p-4 bg-gray-50 col-span-4">
              <h4 className="font-medium text-gray-700 mb-3">Repeater Settings</h4>
              <div className="grid grid-cols-4 items-center gap-4 mb-4">
                <label htmlFor="maxSets" className="text-right text-gray-700">
                  Max Items
                </label>
                <input
                  id="maxSets"
                  type="number"
                  value={maxSets}
                  onChange={(e) => setMaxSets(e.target.value)}
                  placeholder="Unlimited"
                  min="0"
                  className="col-span-3 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                  disabled={isSubmitting}
                />
                <p className="col-span-4 text-xs text-gray-500 text-center">
                  Limit the number of items that can be added to this repeater.
                </p>
              </div>

              <div className="mb-4">
                <h4 className="font-medium text-gray-700 mb-2">Nested Fields</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Define the fields that will appear within each repeater item.
                </p>

                {nestedFieldDefinitions.length === 0 ? (
                  <div className="text-center py-4 text-gray-500 border border-dashed border-gray-300 rounded-md">
                    <p>No nested fields defined yet.</p>
                    <button
                      type="button"
                      onClick={() => {
                        setCurrentNestedField(null)
                        setEditingNestedFieldIndex(null)
                        setShowNestedFieldModal(true)
                      }}
                      className="text-pink-600 hover:underline text-sm mt-2"
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
                        className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-md shadow-sm"
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
                            className="p-1 rounded-md text-yellow-600 hover:bg-yellow-50"
                            disabled={isSubmitting}
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteNestedField(index)}
                            className="p-1 rounded-md text-red-600 hover:bg-red-50"
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
                  className="mt-4 bg-pink-600 hover:bg-pink-700 text-white font-medium px-4 py-2 rounded-md flex items-center gap-2 transition-all duration-200 shadow-md hover:shadow-lg"
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
              disabled={isSubmitting}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-6 py-2 rounded-md text-white transition-colors ${
                isSubmitting ? "bg-gray-400 cursor-not-allowed" : "bg-pink-600 hover:bg-pink-700"
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
  const [maxSets, setMaxSets] = useState("") // For nested repeater's max_sets
  const [nestedFieldDefinitions, setNestedFieldDefinitions] = useState([]) // For nested repeater's nested_fields
  const [currentNestedField, setCurrentNestedField] = useState(null)

  const isEditing = !!field

  useEffect(() => {
    if (field) {
      setLabel(field.label || "")
      setName(field.name || "")
      setType(field.type || "text")
      if (field.type === "repeater" && field.config) {
        setMaxSets(field.config.max_sets || "")
        setNestedFieldDefinitions(field.config.nested_fields || [])
      } else {
        setMaxSets("")
        setNestedFieldDefinitions([])
      }
    } else {
      setLabel("")
      setName("")
      setType("text")
      setMaxSets("")
      setNestedFieldDefinitions([])
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
    if (type === "repeater" && nestedFieldDefinitions.length === 0) {
      setError("Nested repeater fields must have at least one nested field defined.")
      return
    }

    const newFieldData = { label: label.trim(), name: name.trim(), type }
    if (type === "image") {
      newFieldData.config = { return_type: "url" } // Always save URL only
    } else if (type === "repeater") {
      newFieldData.config = {
        max_sets: maxSets || "0",
        nested_fields: nestedFieldDefinitions,
      }
    }

    onSave(newFieldData)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-gray-800">
            {isEditing ? "Edit Nested Field" : "Add Nested Field"}
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">
            &times;
          </button>
        </div>

        {error && <div className="mb-4 px-4 py-2 rounded bg-red-100 text-red-800 border border-red-200">{error}</div>}

        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="nestedLabel" className="text-right text-gray-700">
              Label *
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
              className="col-span-3 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="nestedName" className="text-right text-gray-700">
              Name *
            </label>
            <input
              id="nestedName"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., item_title"
              required
              className="col-span-3 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
            />
            <p className="col-span-4 text-xs text-gray-500 text-center">
              Used in code. Must be unique within this repeater.
            </p>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <label htmlFor="nestedType" className="text-right text-gray-700">
              Type
            </label>
            <select
              id="nestedType"
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="col-span-3 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
            >
              {availableFieldTypes.map((ft) => (
                <option key={ft} value={ft}>
                  {ft.charAt(0).toUpperCase() + ft.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {type === "repeater" && (
            <div className="border border-gray-200 rounded-md p-4 bg-gray-50 col-span-4">
              <h4 className="font-medium text-gray-700 mb-3">Nested Repeater Settings</h4>
              <div className="grid grid-cols-4 items-center gap-4 mb-4">
                <label htmlFor="nestedMaxSets" className="text-right text-gray-700">
                  Max Items
                </label>
                <input
                  id="nestedMaxSets"
                  type="number"
                  value={maxSets}
                  onChange={(e) => setMaxSets(e.target.value)}
                  placeholder="Unlimited"
                  min="0"
                  className="col-span-3 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
                <p className="col-span-4 text-xs text-gray-500 text-center">
                  Limit the number of items that can be added to this nested repeater.
                </p>
              </div>

              <div className="mb-4">
                <h4 className="font-medium text-gray-700 mb-2">Deeply Nested Fields</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Define the fields that will appear within each item of this nested repeater.
                </p>

                {nestedFieldDefinitions.length === 0 ? (
                  <div className="text-center py-4 text-gray-500 border border-dashed border-gray-300 rounded-md">
                    <p>No deeply nested fields defined yet.</p>
                    <button
                      type="button"
                      onClick={() => {
                        setCurrentNestedField(null) // This is for the *parent* modal, not this one
                        // For deeply nested fields, we need a way to add them.
                        // For simplicity, I'll add a basic text field as an example.
                        // A more robust solution would involve another modal for deep nesting.
                        setNestedFieldDefinitions((prev) => [
                          ...prev,
                          { label: "New Text Field", name: "new_text_field", type: "text" },
                        ])
                      }}
                      className="text-pink-600 hover:underline text-sm mt-2"
                    >
                      Add your first deeply nested field
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {nestedFieldDefinitions.map((nf, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-md shadow-sm"
                      >
                        <div className="flex items-center gap-2">
                          <GripVertical className="w-4 h-4 text-gray-400 cursor-grab" />
                          <span className="font-medium text-gray-800">{nf.label}</span>
                          <span className="text-gray-500 mx-1">—</span>
                          <code className="bg-gray-100 px-2 py-1 rounded text-xs text-gray-600">{nf.name}</code>
                          <span className="ml-2 text-sm text-gray-600 capitalize">({nf.type})</span>
                        </div>
                        <div className="flex gap-2">
                          {/* For simplicity, no edit/delete for deeply nested fields in this modal */}
                          <button
                            type="button"
                            onClick={() => setNestedFieldDefinitions((prev) => prev.filter((_, i) => i !== index))}
                            className="p-1 rounded-md text-red-600 hover:bg-red-50"
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
                    // Add a new field to the deeply nested repeater
                    setNestedFieldDefinitions((prev) => [
                      ...prev,
                      { label: "New Field", name: generateHandle("New Field"), type: "text" },
                    ])
                  }}
                  className="mt-4 bg-pink-600 hover:bg-pink-700 text-white font-medium px-4 py-2 rounded-md flex items-center gap-2 transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  <Plus className="w-5 h-5" />
                  Add Deeply Nested Field
                </button>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 rounded-md text-white bg-pink-600 hover:bg-pink-700 transition-colors"
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
