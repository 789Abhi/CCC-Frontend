"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { X, Save, AlertCircle } from "lucide-react"

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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h3 className="text-xl font-semibold text-slate-900">
            {isEditing ? "Edit Component" : "Create New Component"}
          </h3>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mx-6 mt-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Component Name *</label>
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
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
              placeholder="Enter component name"
              disabled={isSubmitting}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Handle</label>
            <input
              type="text"
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors disabled:bg-slate-50 disabled:text-slate-500"
              placeholder="component_handle"
              disabled={isSubmitting || isEditing}
            />
            <p className="text-xs text-slate-500 mt-2">
              {isEditing
                ? "Handle cannot be changed after creation"
                : "Used in code. Auto-generated from name if left empty."}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Instructions (Optional)</label>
            <textarea
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors resize-none"
              placeholder="Add instructions for content editors"
              rows="3"
              disabled={isSubmitting}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`inline-flex items-center px-6 py-2 rounded-lg text-white font-medium transition-all duration-200 ${
                isSubmitting
                  ? "bg-slate-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl"
              }`}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {isEditing ? "Update" : "Create"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ComponentEditModal
