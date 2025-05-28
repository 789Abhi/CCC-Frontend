"use client"

import { useState, useEffect } from "react"
import axios from "axios"

function FieldEditModal({ isOpen, component, field, onClose, onSave }) {
  const [label, setLabel] = useState("")
  const [name, setName] = useState("")
  const [type, setType] = useState("text")
  const [isRequired, setIsRequired] = useState(false)
  const [placeholder, setPlaceholder] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

  const isEditing = !!field

  useEffect(() => {
    if (field) {
      setLabel(field.label || "")
      setName(field.name || "")
      setType(field.type || "text")
      setIsRequired(field.required || false)
      setPlaceholder(field.placeholder || "")
    } else {
      setLabel("")
      setName("")
      setType("text")
      setIsRequired(false)
      setPlaceholder("")
    }
    setError("")
  }, [field])

  const generateHandle = (inputLabel) => {
    return inputLabel
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/[^\w_]+/g, "")
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!label.trim()) {
      setError("Field label is required")
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
      <div className="bg-white rounded-custom p-6 w-full max-w-md shadow-xl">
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
              disabled={isSubmitting}
            >
              <option value="text">Text</option>
              <option value="text-area">Textarea</option>
              <option value="email">Email</option>
              <option value="url">URL</option>
              <option value="number">Number</option>
              <option value="select">Select Dropdown</option>
              <option value="checkbox">Checkbox</option>
            </select>
          </div>

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
      </div>
    </div>
  )
}

export default FieldEditModal
