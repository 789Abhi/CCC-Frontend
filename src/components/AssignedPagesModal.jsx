"use client"

import { useState, useEffect } from "react"
import axios from "axios"

function AssignedPagesModal({ isOpen, component, onClose, onUpdate }) {
  const [assignedPages, setAssignedPages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const fetchAssignedPages = async () => {
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append("action", "ccc_get_assigned_pages")
      formData.append("component_id", component.id)
      formData.append("nonce", window.cccData.nonce)

      const response = await axios.post(window.cccData.ajaxUrl, formData)

      if (response.data.success) {
        setAssignedPages(response.data.data.pages || [])
      } else {
        setError("Failed to fetch assigned pages")
      }
    } catch (err) {
      setError("Failed to connect to server")
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveFromPage = async (postId) => {
    if (!window.confirm("Are you sure you want to remove this component from this page?")) return

    try {
      const formData = new FormData()
      formData.append("action", "ccc_remove_component_from_page")
      formData.append("component_id", component.id)
      formData.append("post_id", postId)
      formData.append("nonce", window.cccData.nonce)

      const response = await axios.post(window.cccData.ajaxUrl, formData)

      if (response.data.success) {
        fetchAssignedPages()
        onUpdate()
      } else {
        setError(response.data.message || "Failed to remove component")
      }
    } catch (error) {
      setError("Error connecting to server")
    }
  }

  useEffect(() => {
    if (isOpen && component) {
      fetchAssignedPages()
    }
  }, [isOpen, component])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-custom p-6 w-full max-w-2xl shadow-xl max-h-[80vh] overflow-hidden">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-gray-800">Pages Using "{component.name}"</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">
            ×
          </button>
        </div>

        {error && <div className="mb-4 px-4 py-2 rounded bg-red-100 text-red-800 border border-red-200">{error}</div>}

        <div className="overflow-y-auto max-h-96">
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-bgPrimary"></div>
            </div>
          ) : assignedPages.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <svg className="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <p>This component is not assigned to any pages yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {assignedPages.map((page) => (
                <div
                  key={page.id}
                  className="flex justify-between items-center p-4 border border-gray-200 rounded-custom hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-800">{page.title}</h4>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                      <span className="capitalize">{page.post_type}</span>
                      <span>•</span>
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          page.status === "publish" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {page.status}
                      </span>
                      <span>•</span>
                      <span>
                        {page.instances} instance{page.instances !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <a
                      href={page.edit_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm transition-colors"
                    >
                      Edit
                    </a>
                    {page.view_url && (
                      <a
                        href={page.view_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm transition-colors"
                      >
                        View
                      </a>
                    )}
                    <button
                      onClick={() => handleRemoveFromPage(page.id)}
                      className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end pt-4 border-t border-gray-200 mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-custom hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default AssignedPagesModal
