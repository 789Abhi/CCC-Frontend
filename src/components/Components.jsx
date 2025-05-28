"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import ComponentEditModal from "./ComponentEditModal"
import FieldEditModal from "./FieldEditModal"
import AssignedPagesModal from "./AssignedPagesModal"

function Components() {
  const [components, setComponents] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showFieldModal, setShowFieldModal] = useState(false)
  const [showAssignedModal, setShowAssignedModal] = useState(false)
  const [selectedComponent, setSelectedComponent] = useState(null)
  const [selectedField, setSelectedField] = useState(null)
  const [message, setMessage] = useState("")
  const [messageType, setMessageType] = useState("")

  const fetchComponents = async () => {
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append("action", "ccc_get_components")
      formData.append("nonce", window.cccData.nonce)

      const response = await axios.post(window.cccData.ajaxUrl, formData)

      if (response.data.success && Array.isArray(response.data.data?.components)) {
        setComponents(response.data.data.components)
      } else {
        setComponents([])
        showMessage("Failed to fetch components", "error")
      }
    } catch (err) {
      showMessage("Failed to connect to server", "error")
      console.error("Failed to fetch components", err)
    } finally {
      setLoading(false)
    }
  }

  const showMessage = (msg, type) => {
    setMessage(msg)
    setMessageType(type)
    setTimeout(() => {
      setMessage("")
      setMessageType("")
    }, 5000)
  }

  const handleDeleteComponent = async (componentId) => {
    if (!window.confirm("Are you sure you want to delete this component? This action cannot be undone.")) return

    try {
      const formData = new FormData()
      formData.append("action", "ccc_delete_component")
      formData.append("component_id", componentId)
      formData.append("nonce", window.cccData.nonce)

      const response = await axios.post(window.cccData.ajaxUrl, formData)

      if (response.data.success) {
        showMessage("Component deleted successfully", "success")
        fetchComponents()
      } else {
        showMessage(response.data.message || "Failed to delete component", "error")
      }
    } catch (error) {
      showMessage("Error connecting to server", "error")
    }
  }

  const handleDeleteField = async (fieldId) => {
    if (!window.confirm("Are you sure you want to delete this field?")) return

    try {
      const formData = new FormData()
      formData.append("action", "ccc_delete_field")
      formData.append("field_id", fieldId)
      formData.append("nonce", window.cccData.nonce)

      const response = await axios.post(window.cccData.ajaxUrl, formData)

      if (response.data.success) {
        showMessage("Field deleted successfully", "success")
        fetchComponents()
      } else {
        showMessage(response.data.message || "Failed to delete field", "error")
      }
    } catch (error) {
      showMessage("Error connecting to server", "error")
    }
  }

  useEffect(() => {
    fetchComponents()
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-bgPrimary"></div>
      </div>
    )
  }

  return (
    <section className="space-y-6">
      {/* Message Display */}
      {message && (
        <div
          className={`p-4 rounded-custom ${
            messageType === "success"
              ? "bg-green-100 text-green-800 border border-green-200"
              : "bg-red-100 text-red-800 border border-red-200"
          }`}
        >
          {message}
        </div>
      )}

      {/* Header with Add New Button */}
      <div className="bg-white rounded-custom p-6 shadow-sm border border-gray-200">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Components</h2>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-bgPrimary hover:bg-pink-600 text-white font-medium px-6 py-3 rounded-custom flex items-center gap-2 transition-all duration-200 shadow-md hover:shadow-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add New Component
          </button>
        </div>

        {/* Components Grid */}
        {components.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1"
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-600 mb-2">No Components Found</h3>
            <p className="text-gray-500 mb-6">Create your first component to get started</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-bgPrimary hover:bg-pink-600 text-white px-6 py-2 rounded-custom transition-colors"
            >
              Create Component
            </button>
          </div>
        ) : (
          <div className="grid gap-6">
            {components.map((component) => (
              <div
                key={component.id}
                className="border-2 border-gray-200 hover:border-bgPrimary rounded-custom p-6 transition-all duration-200 bg-gray-50"
              >
                {/* Component Header */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">{component.name}</h3>
                    <code className="bg-gray-200 px-3 py-1 rounded text-sm text-gray-600">{component.handle_name}</code>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setSelectedComponent(component)
                        setShowAssignedModal(true)
                      }}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm transition-colors"
                    >
                      View Pages
                    </button>
                    <button
                      onClick={() => {
                        setSelectedComponent(component)
                        setShowEditModal(true)
                      }}
                      className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-sm transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteComponent(component.id)}
                      className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {/* Fields Section */}
                <div className="border-2 border-bgPrimary rounded-custom p-4 mb-4 bg-white">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-medium text-gray-700">Fields ({component.fields?.length || 0})</h4>
                    <button
                      onClick={() => {
                        setSelectedComponent(component)
                        setSelectedField(null)
                        setShowFieldModal(true)
                      }}
                      className="bg-bgPrimary hover:bg-pink-600 text-white px-3 py-1 rounded text-sm transition-colors"
                    >
                      Add Field
                    </button>
                  </div>

                  {component.fields && component.fields.length > 0 ? (
                    <div className="space-y-2">
                      {component.fields.map((field) => (
                        <div key={field.id} className="flex justify-between items-center p-3 bg-gray-50 rounded border">
                          <div className="flex-1">
                            <span className="font-medium text-gray-800">{field.label}</span>
                            <span className="text-gray-500 mx-2">—</span>
                            <code className="bg-gray-200 px-2 py-1 rounded text-sm">{field.name}</code>
                            <span className="ml-2 text-sm text-gray-600 capitalize">({field.type})</span>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setSelectedComponent(component)
                                setSelectedField(field)
                                setShowFieldModal(true)
                              }}
                              className="bg-yellow-500 hover:bg-yellow-600 text-white px-2 py-1 rounded text-xs transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteField(field.id)}
                              className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <svg
                        className="w-8 h-8 mx-auto mb-2 opacity-50"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      <p>No fields added yet</p>
                      <button
                        onClick={() => {
                          setSelectedComponent(component)
                          setSelectedField(null)
                          setShowFieldModal(true)
                        }}
                        className="text-bgPrimary hover:underline text-sm mt-1"
                      >
                        Add your first field
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {showCreateModal && (
        <ComponentEditModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSave={() => {
            setShowCreateModal(false)
            fetchComponents()
            showMessage("Component created successfully", "success")
          }}
        />
      )}

      {showEditModal && selectedComponent && (
        <ComponentEditModal
          isOpen={showEditModal}
          component={selectedComponent}
          onClose={() => {
            setShowEditModal(false)
            setSelectedComponent(null)
          }}
          onSave={() => {
            setShowEditModal(false)
            setSelectedComponent(null)
            fetchComponents()
            showMessage("Component updated successfully", "success")
          }}
        />
      )}

      {showFieldModal && selectedComponent && (
        <FieldEditModal
          isOpen={showFieldModal}
          component={selectedComponent}
          field={selectedField}
          onClose={() => {
            setShowFieldModal(false)
            setSelectedComponent(null)
            setSelectedField(null)
          }}
          onSave={() => {
            setShowFieldModal(false)
            setSelectedComponent(null)
            setSelectedField(null)
            fetchComponents()
            showMessage(selectedField ? "Field updated successfully" : "Field created successfully", "success")
          }}
        />
      )}

      {showAssignedModal && selectedComponent && (
        <AssignedPagesModal
          isOpen={showAssignedModal}
          component={selectedComponent}
          onClose={() => {
            setShowAssignedModal(false)
            setSelectedComponent(null)
          }}
          onUpdate={() => {
            fetchComponents()
            showMessage("Page assignments updated", "success")
          }}
        />
      )}
    </section>
  )
}

export default Components
