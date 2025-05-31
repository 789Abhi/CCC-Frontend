"use client"

import { useState } from "react"
import axios from "axios"

function FieldPopup({ componentId, onClose, onFieldAdded }) {
  const [label, setLabel] = useState("")
  const [name, setName] = useState("")
  const [type, setType] = useState("text")
  const [maxSets, setMaxSets] = useState("")
  const [allowedFields, setAllowedFields] = useState(["text", "textarea", "image"])
  const [imageReturnType, setImageReturnType] = useState("url")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

  const availableFieldTypes = ["text", "textarea", "image", "repeater"]

  const generateHandle = (inputLabel) => {
    return inputLabel
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/[^\w_]+/g, "")
  }

  const handleAllowedFieldChange = (fieldType, checked) => {
    if (checked) {
      setAllowedFields([...allowedFields, fieldType])
    } else {
      setAllowedFields(allowedFields.filter((f) => f !== fieldType))
    }
  }

  const handleSubmit = async () => {
    if (!label) {
      setError("Please enter a display label")
      return
    }

    if (type === "repeater" && allowedFields.length === 0) {
      setError("Please select at least one allowed field type for the repeater")
      return
    }

    setIsSubmitting(true)
    setError("")

    try {
      const fieldName = name || generateHandle(label)

      const formData = new FormData()
      formData.append("action", "ccc_add_field")
      formData.append("nonce", window.cccData.nonce)
      formData.append("label", label)
      formData.append("name", fieldName)
      formData.append("type", type)
      formData.append("component_id", componentId)

      // Add type-specific configurations
      if (type === "repeater") {
        formData.append("max_sets", maxSets || "0")
        formData.append("allowed_fields", JSON.stringify(allowedFields))
      } else if (type === "image") {
        formData.append("return_type", imageReturnType)
      }

      const response = await axios.post(window.cccData.ajaxUrl, formData)

      if (response.data.success) {
        onFieldAdded()
        onClose()
      } else {
        setError(response.data.message || "Failed to add field")
      }
    } catch (error) {
      console.error("Error adding field:", error)
      setError("Failed to connect to server. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-semibold mb-4 text-gray-800">Add New Field</h3>

        {error && <div className="mb-4 px-4 py-2 rounded bg-red-100 text-red-800">{error}</div>}

        <div className="mb-3">
          <label className="block text-gray-700 mb-1">Display Label</label>
          <input
            type="text"
            value={label}
            placeholder="Display Label"
            onChange={(e) => {
              const value = e.target.value
              setLabel(value)
              if (!name || name === generateHandle(label)) {
                setName(generateHandle(value))
              }
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isSubmitting}
          />
        </div>

        <div className="mb-3">
          <label className="block text-gray-700 mb-1">Handle</label>
          <input
            type="text"
            value={name}
            placeholder="Handle (generated automatically)"
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isSubmitting}
          />
          <p className="text-xs text-gray-500 mt-1">
            This will be used in code. Automatically generated from label if left empty.
          </p>
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 mb-1">Field Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isSubmitting}
          >
            <option value="text">Text</option>
            <option value="text-area">Textarea</option>
            <option value="image">Image</option>
            <option value="repeater">Repeater</option>
          </select>
        </div>

        {type === "image" && (
          <div className="mb-4">
            <label className="block text-gray-700 mb-1">Return Type</label>
            <select
              value={imageReturnType}
              onChange={(e) => setImageReturnType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isSubmitting}
            >
              <option value="url">URL Only</option>
              <option value="array">Full Image Data (ID, URL, Alt, etc.)</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Choose whether to return just the image URL or complete image data including ID, alt text, etc.
            </p>
          </div>
        )}

        {type === "repeater" && (
          <>
            <div className="mb-4">
              <label className="block text-gray-700 mb-1">Maximum Sets (leave empty for unlimited)</label>
              <input
                type="number"
                value={maxSets}
                onChange={(e) => setMaxSets(e.target.value)}
                placeholder="Optional"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isSubmitting}
              />
              <p className="text-xs text-gray-500 mt-1">
                Limit how many items can be added to this repeater field. Leave empty for unlimited.
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Allowed Field Types</label>
              <div className="space-y-2">
                {availableFieldTypes.map((fieldType) => (
                  <label key={fieldType} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={allowedFields.includes(fieldType)}
                      onChange={(e) => handleAllowedFieldChange(fieldType, e.target.checked)}
                      className="mr-2"
                      disabled={isSubmitting}
                    />
                    <span className="capitalize">{fieldType}</span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Select which field types can be added inside this repeater field.
              </p>
            </div>
          </>
        )}

        <div className="flex justify-end space-x-2">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={`px-4 py-2 rounded transition ${
              isSubmitting ? "bg-gray-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700 text-white"
            }`}
          >
            {isSubmitting ? "Saving..." : "Save"}
          </button>
          <button
            onClick={onClose}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition"
            disabled={isSubmitting}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

export default FieldPopup
