"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import FieldEditModal from "./FieldEditModal"
import { Plus, Edit, Trash2, LayoutGrid, FileText, ImageIcon, Repeat } from "lucide-react"

const ComponentList = () => {
  const [showNewComponentDialog, setShowNewComponentDialog] = useState(false)
  const [componentName, setComponentName] = useState("")
  const [handle, setHandle] = useState("")
  const [components, setComponents] = useState([])
  const [message, setMessage] = useState("")
  const [messageType, setMessageType] = useState("")
  const [showFieldEditModal, setShowFieldEditModal] = useState(false)
  const [selectedComponentForField, setSelectedComponentForField] = useState(null)
  const [editingField, setEditingField] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const generateHandle = (name) => {
    return name
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

  const fetchComponents = async () => {
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append("action", "ccc_get_components")
      formData.append("nonce", window.cccData.nonce)

      const response = await axios.post(window.cccData.ajaxUrl, formData)

      if (response.data.success && Array.isArray(response.data.data?.components)) {
        setComponents(response.data.data.components)
        setError("")
      } else {
        setComponents([])
        setError("Failed to fetch components. Invalid response format.")
        console.error("Invalid response format:", response.data)
      }
    } catch (err) {
      setError("Failed to connect to server. Please refresh and try again.")
      console.error("Failed to fetch components", err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitNewComponent = async () => {
    if (!componentName) {
      showMessage("Please enter a component name", "error")
      return
    }

    const formData = new FormData()
    formData.append("action", "ccc_create_component")
    formData.append("name", componentName)
    formData.append("handle", handle || generateHandle(componentName))
    formData.append("nonce", window.cccData.nonce)

    try {
      const response = await axios.post(window.cccData.ajaxUrl, formData)

      if (response.data.success) {
        showMessage(response.data.message || "Component created successfully.", "success")
        fetchComponents()
        setShowNewComponentDialog(false)
        setComponentName("")
        setHandle("")
      } else {
        showMessage(response.data.message || "Failed to create component.", "error")
      }
    } catch (error) {
      console.error("Error creating component:", error)
      showMessage("Error connecting to server. Please try again.", "error")
    }
  }

  const handleDeleteComponent = async (componentId) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this component? This will also remove it from all assigned pages.",
      )
    )
      return

    try {
      const formData = new FormData()
      formData.append("action", "ccc_delete_component")
      formData.append("component_id", componentId)
      formData.append("nonce", window.cccData.nonce)

      const response = await axios.post(window.cccData.ajaxUrl, formData)

      if (response.data.success) {
        showMessage("Component deleted successfully.", "success")
        fetchComponents()
      } else {
        showMessage(response.data.message || "Failed to delete component.", "error")
      }
    } catch (error) {
      console.error("Error deleting component:", error)
      showMessage("Error connecting to server. Please try again.", "error")
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
        showMessage("Field deleted successfully.", "success")
        fetchComponents() // Re-fetch components to update field list
      } else {
        showMessage(response.data.message || "Failed to delete field.", "error")
      }
    } catch (error) {
      console.error("Error deleting field:", error)
      showMessage("Error connecting to server. Please try again.", "error")
    }
  }

  useEffect(() => {
    fetchComponents()
  }, [])

  const openFieldEditModal = (component, field = null) => {
    setSelectedComponentForField(component)
    setEditingField(field)
    setShowFieldEditModal(true)
  }

  const closeFieldEditModal = () => {
    setShowFieldEditModal(false)
    setSelectedComponentForField(null)
    setEditingField(null)
    fetchComponents() // Refresh components after field changes
  }

  const getFieldIcon = (type) => {
    switch (type) {
      case "text":
        return <FileText className="w-4 h-4 text-blue-500" />
      case "textarea":
        return <FileText className="w-4 h-4 text-green-500" />
      case "image":
        return <ImageIcon className="w-4 h-4 text-purple-500" />
      case "repeater":
        return <Repeat className="w-4 h-4 text-orange-500" />
      default:
        return <FileText className="w-4 h-4 text-gray-500" />
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
        <p className="ml-4 text-lg text-gray-600">Loading components...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Error!</strong>
        <span className="block sm:inline"> {error}</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {message && (
        <div
          className={`mb-4 px-4 py-3 rounded-lg ${
            messageType === "success"
              ? "bg-green-100 text-green-800 border border-green-200"
              : "bg-red-100 text-red-800 border border-red-200"
          }`}
        >
          {message}
        </div>
      )}

      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <div className="flex flex-row items-center justify-between space-y-0 pb-2 mb-4">
          <h2 className="text-2xl font-bold text-gray-800">Defined Components</h2>
          <button
            onClick={() => {
              setShowNewComponentDialog(true)
              setComponentName("")
              setHandle("")
            }}
            className="bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded-md flex items-center gap-2 transition-all duration-200 shadow-md hover:shadow-lg"
          >
            <Plus className="w-5 h-5" /> Add New Component
          </button>
        </div>
        <div>
          {components.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No components found. Click "Add New Component" to get started!
            </p>
          ) : (
            <div className="grid gap-4">
              {components.map((comp) => (
                <div
                  key={comp.id}
                  className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200 rounded-lg overflow-hidden"
                >
                  <div className="flex flex-row items-center justify-between space-y-0 p-4 pb-2 bg-gray-50 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <LayoutGrid className="w-6 h-6 text-pink-600" />
                      <div>
                        <h3 className="text-lg font-semibold">{comp.name}</h3>
                        <code className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-mono">
                          {comp.handle_name}
                        </code>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openFieldEditModal(comp)}
                        className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-600 disabled:pointer-events-none disabled:opacity-50 border border-blue-200 bg-white hover:bg-blue-50 text-blue-600 h-9 px-3 py-2 gap-1"
                      >
                        <Plus className="w-4 h-4" /> Add Field
                      </button>
                      <button
                        onClick={() => handleDeleteComponent(comp.id)}
                        className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-600 disabled:pointer-events-none disabled:opacity-50 bg-red-600 text-white hover:bg-red-700 h-9 px-3 py-2 gap-1"
                      >
                        <Trash2 className="w-4 h-4" /> Delete
                      </button>
                    </div>
                  </div>
                  <div className="p-4 pt-0">
                    {comp.fields && comp.fields.length > 0 ? (
                      <div className="mt-3 border-t border-gray-100 pt-3">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Fields ({comp.fields.length}):</h4>
                        <ul className="space-y-2">
                          {comp.fields.map((field) => (
                            <li
                              key={field.id}
                              className="flex items-center justify-between p-3 bg-gray-50 border border-gray-100 rounded-md"
                            >
                              <div className="flex items-center gap-2">
                                {getFieldIcon(field.type)}
                                <span className="font-medium text-gray-800">{field.label}</span>
                                <span className="text-gray-500 mx-1">—</span>
                                <code className="bg-gray-100 px-2 py-1 rounded text-xs text-gray-600">
                                  {field.name}
                                </code>
                                <span className="ml-2 text-sm text-gray-600 capitalize">
                                  ({field.type}
                                  {field.type === "repeater" && field.config?.nested_fields?.length > 0
                                    ? ` with ${field.config.nested_fields.length} nested fields`
                                    : ""}
                                  )
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => openFieldEditModal(comp, field)}
                                  className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-600 disabled:pointer-events-none disabled:opacity-50 hover:bg-yellow-50 text-yellow-600 h-9 w-9 p-0"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteField(field.id)}
                                  className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-600 disabled:pointer-events-none disabled:opacity-50 hover:bg-red-50 text-red-600 h-9 w-9 p-0"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      <p className="mt-2 text-gray-500 text-sm">No fields added yet. Click "Add Field" above.</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showNewComponentDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-800">Create New Component</h3>
              <button
                onClick={() => setShowNewComponentDialog(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                &times;
              </button>
            </div>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="componentName" className="text-right text-gray-700">
                  Name
                </label>
                <input
                  id="componentName"
                  type="text"
                  value={componentName}
                  onChange={(e) => {
                    const value = e.target.value
                    setComponentName(value)
                    if (!handle || handle === generateHandle(componentName)) {
                      setHandle(generateHandle(value))
                    }
                  }}
                  placeholder="e.g., Hero Section"
                  className="col-span-3 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-600"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="handle" className="text-right text-gray-700">
                  Handle
                </label>
                <input
                  id="handle"
                  type="text"
                  value={handle}
                  onChange={(e) => setHandle(e.target.value)}
                  placeholder="e.g., hero_section"
                  className="col-span-3 px-3 py-2 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed"
                  disabled={true}
                />
              </div>
              <p className="text-sm text-gray-500 text-center">Handle is auto-generated and used in templates.</p>
            </div>
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={() => setShowNewComponentDialog(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitNewComponent}
                className="bg-pink-600 hover:bg-pink-700 text-white px-6 py-2 rounded-md transition-colors"
              >
                Save Component
              </button>
            </div>
          </div>
        </div>
      )}

      {showFieldEditModal && (
        <FieldEditModal
          isOpen={showFieldEditModal}
          component={selectedComponentForField}
          field={editingField}
          onClose={closeFieldEditModal}
          onSave={closeFieldEditModal}
        />
      )}
    </div>
  )
}

export default ComponentList
