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
  const [message, setMessage] = useState("")
  const [messageType, setMessageType] = useState("")

  const availableFieldTypes = ["text", "textarea", "image", "repeater"]

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
        formData.append("max_sets", maxSets || "0")
        formData.append("allowed_fields", JSON.stringify(allowedFields))
      } else if (type === "image") {
        formData.append("return_type", imageReturnType)
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
            <h3 className="text-xl font-bold">Add New Field</h3>
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
                <option value="image">Image</option>
                <option value="repeater">Repeater</option>
              </select>
            </div>

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
              {isSubmitting ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FieldPopup