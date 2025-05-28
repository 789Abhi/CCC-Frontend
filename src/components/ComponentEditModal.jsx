"use client"

import { useState, useEffect } from "react"
import axios from "axios"

function ComponentEditModal({ isOpen, component, onClose, onSave }) {
  const [name, setName] = useState("")
  const [handle, setHandle] = useState("")
  const [instruction, setInstruction] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

  const isEditing = !!component

  useEffect(() => {
    if (component) {
      setName(component.name || "")
      setHandle(component.handle_name || "")
      setInstruction(component.instruction || "")
    } else {
      setName("")
      setHandle("")
      setInstruction("")
    }
    setError("")
  }, [component])

  const generateHandle = (inputName) => {
    return inputName
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/[^\w_]+/g, "")
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!name.trim()) {
      setError("Component name is required")
      return
    }

    setIsSubmitting(true)
    setError("")

    try {
      const formData = new FormData()
      formData.append("action", isEditing ? "ccc_update_component" : "ccc_create_component")
      formData.append("nonce", window.cccData.nonce)
      formData.append("name", name.trim())
      formData.append("handle", handle || generateHandle(name))
      formData.append("instruction", instruction.trim())

      if (isEditing) {
        formData.append("component_id", component.id)
      }

      const response = await axios.post(window.cccData.ajaxUrl, formData)

      if (response.data.success) {
        onSave()
      } else {
        setError(response.data.message || `Failed to ${isEditing ? "update" : "create"} component`)
      }
    } catch (error) {
      console.error("Error saving component:", error)
      setError("Failed to connect to server. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-custom p-6 w-full max-w-md shadow-xl">
        <h3 className="text-xl font-semibold mb-4 text-gray-800">
          {isEditing ? "Edit Component" : "Create New Component"}
        </h3>

        {error && <div className="mb-4 px-4 py-2 rounded bg-red-100 text-red-800 border border-red-200">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-700 font-medium mb-2">Component Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                const value = e.target.value
                setName(value)
                if (!isEditing && (!handle || handle === generateHandle(name))) {
                  setHandle(generateHandle(value))
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-custom focus:outline-none focus:ring-2 focus:ring-bgPrimary focus:border-transparent"
              placeholder="Enter component name"
              disabled={isSubmitting}
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-2">Handle</label>
            <input
              type="text"
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-custom focus:outline-none focus:ring-2 focus:ring-bgPrimary focus:border-transparent"
              placeholder="component_handle"
              disabled={isSubmitting || isEditing}
            />
            <p className="text-xs text-gray-500 mt-1">
              {isEditing
                ? "Handle cannot be changed after creation"
                : "Used in code. Auto-generated from name if left empty."}
            </p>
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-2">Instructions (Optional)</label>
            <textarea
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-custom focus:outline-none focus:ring-2 focus:ring-bgPrimary focus:border-transparent"
              placeholder="Add instructions for content editors"
              rows="3"
              disabled={isSubmitting}
            />
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
              {isSubmitting ? "Saving..." : isEditing ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ComponentEditModal
