"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import FieldEditModal from "./FieldEditModal"
import { Plus, Edit, Trash2 } from "lucide-react"

const ComponentList = () => {
  const [showPopup, setShowPopup] = useState(false)
  const [componentName, setComponentName] = useState("")
  const [handle, setHandle] = useState("")
  const [components, setComponents] = useState([]) // All defined components
  const [message, setMessage] = useState("")
  const [messageType, setMessageType] = useState("")
  const [showFieldEditModal, setShowFieldEditModal] = useState(false)
  const [selectedComponentForField, setSelectedComponentForField] = useState(null)
  const [editingField, setEditingField] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [postType, setPostType] = useState("page")
  const [posts, setPosts] = useState([]) // Posts/pages for assignment
  const [selectedPosts, setSelectedPosts] = useState([]) // IDs of selected posts/pages
  const [selectAllPages, setSelectAllPages] = useState(false)
  const [selectAllPosts, setSelectAllPosts] = useState(false)

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

  const fetchPosts = async (type) => {
    try {
      const formData = new FormData()
      formData.append("action", "ccc_get_posts_with_components")
      formData.append("post_type", type)
      formData.append("nonce", window.cccData.nonce)

      const response = await axios.post(window.cccData.ajaxUrl, formData)

      if (response.data.success && Array.isArray(response.data.data?.posts)) {
        setPosts(response.data.data.posts)
        // Initialize selectedPosts based on which posts already have components assigned
        const initiallySelected = response.data.data.posts.filter((post) => post.has_components).map((post) => post.id)
        setSelectedPosts(initiallySelected)

        // If all posts are initially selected, set selectAll checkbox
        if (initiallySelected.length > 0 && initiallySelected.length === response.data.data.posts.length) {
          if (type === "page") setSelectAllPages(true)
          if (type === "post") setSelectAllPosts(true)
        } else {
          if (type === "page") setSelectAllPages(false)
          if (type === "post") setSelectAllPosts(false)
        }
      } else {
        setPosts([])
        setError("Failed to fetch posts.")
      }
    } catch (err) {
      setError("Failed to fetch posts. Please try again.")
      console.error("Failed to fetch posts", err)
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
        setShowPopup(false)
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
        fetchPosts(postType) // Refresh assignments after deletion
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

  const handleSaveAssignments = async () => {
    try {
      const assignments = {}
      const allComponentObjects = components.map((comp) => ({
        id: comp.id,
        name: comp.name,
        handle_name: comp.handle_name,
      }))

      // Determine which posts should have all components, and which should have none
      posts.forEach((post) => {
        const isSelected =
          (postType === "page" && selectAllPages) ||
          (postType === "post" && selectAllPosts) ||
          selectedPosts.includes(post.id)

        if (isSelected) {
          // Assign all currently defined components to this post
          assignments[post.id] = allComponentObjects
        } else {
          // Remove all components from this post
          assignments[post.id] = []
        }
      })

      const formData = new FormData()
      formData.append("action", "ccc_save_component_assignments")
      formData.append("nonce", window.cccData.nonce)
      formData.append("assignments", JSON.stringify(assignments))

      const response = await axios.post(window.cccData.ajaxUrl, formData)

      if (response.data.success) {
        showMessage(response.data.message || "Assignments saved successfully.", "success")
        fetchPosts(postType) // Refresh posts to show updated assignment status
      } else {
        showMessage(response.data.message || "Failed to save assignments.", "error")
      }
    } catch (error) {
      console.error("Error saving assignments:", error)
      showMessage("Error connecting to server. Please try again.", "error")
    }
  }

  useEffect(() => {
    fetchComponents()
  }, [])

  useEffect(() => {
    fetchPosts(postType)
    // Reset selectAll checkboxes when postType changes
    setSelectAllPages(false)
    setSelectAllPosts(false)
  }, [postType])

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

  const handlePostSelectionChange = (postId, isChecked) => {
    setSelectedPosts((prev) => {
      if (isChecked) {
        return [...prev, postId]
      } else {
        return prev.filter((id) => id !== postId)
      }
    })
  }

  const handleSelectAllPagesChange = (isChecked) => {
    setSelectAllPages(isChecked)
    if (isChecked) {
      setSelectedPosts(posts.map((p) => p.id)) // Select all current pages
    } else {
      setSelectedPosts([]) // Deselect all pages
    }
  }

  const handleSelectAllPostsChange = (isChecked) => {
    setSelectAllPosts(isChecked)
    if (isChecked) {
      setSelectedPosts(posts.map((p) => p.id)) // Select all current posts
    } else {
      setSelectedPosts([]) // Deselect all posts
    }
  }

  const renderFieldValue = (field) => {
    switch (field.type) {
      case "text":
      case "text-area":
        return field.value || "No value set"
      case "image":
        if (field.return_type === "array" && field.value) {
          return field.value.url ? (
            <div className="flex items-center gap-2">
              <img src={field.value.url} alt={field.value.alt || ""} className="w-8 h-8 object-cover rounded" />
              <span>{field.value.url}</span>
            </div>
          ) : (
            "No image set"
          )
        }
        return field.value ? (
          <div className="flex items-center gap-2">
            <img src={field.value} alt="" className="w-8 h-8 object-cover rounded" />
            <span>{field.value}</span>
          </div>
        ) : (
          "No image set"
        )
      case "repeater":
        return field.value && field.value.length > 0 ? (
          <div className="space-y-2">
            {field.value.map((set, index) => (
              <div key={index} className="pl-4 border-l-2 border-gray-200">
                <div className="text-sm font-medium text-gray-600">Set {index + 1}</div>
                {Object.entries(set).map(([key, value]) => (
                  <div key={key} className="text-sm">
                    <span className="font-medium">{key}:</span>{" "}
                    {typeof value === "string" ? value : JSON.stringify(value)}
                  </div>
                ))}
              </div>
            ))}
          </div>
        ) : (
          "No items added"
        )
      case "color":
        return field.value ? (
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded border border-gray-300"
              style={{ backgroundColor: field.value }}
            />
            <span>{field.value}</span>
          </div>
        ) : (
          "No color set"
        )
      case "wysiwyg":
        return field.value ? (
          <div
            className="prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: field.value }}
          />
        ) : (
          "No content set"
        )
      case "checkbox":
        if (!field.field_config?.options) return "No options configured"
        return field.value ? (
          <div className="space-y-1">
            {field.field_config.options
              .filter((opt) => field.value.includes(opt.value))
              .map((opt) => (
                <div key={opt.value} className="flex items-center gap-2">
                  <input type="checkbox" checked readOnly className="cursor-default" />
                  <span>{opt.label}</span>
                </div>
              ))}
          </div>
        ) : (
          "No options selected"
        )
      case "radio":
        if (!field.field_config?.options) return "No options configured"
        const selectedOption = field.field_config.options.find((opt) => opt.value === field.value)
        return selectedOption ? (
          <div className="flex items-center gap-2">
            <input type="radio" checked readOnly className="cursor-default" />
            <span>{selectedOption.label}</span>
          </div>
        ) : (
          "No option selected"
        )
      case "group":
        if (!field.field_config?.fields) return "No fields configured"
        return field.value ? (
          <div className="space-y-2">
            {field.field_config.fields.map((groupField) => (
              <div key={groupField.name} className="pl-4 border-l-2 border-gray-200">
                <div className="text-sm font-medium text-gray-600">{groupField.label}</div>
                <div className="text-sm">
                  {renderFieldValue({
                    ...groupField,
                    value: field.value[groupField.name],
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          "No group data set"
        )
      default:
        return typeof field.value === "object" ? JSON.stringify(field.value) : field.value || "No value set"
    }
  }

  const renderFieldType = (type) => {
    switch (type) {
      case "text":
        return "Text"
      case "text-area":
        return "Textarea"
      case "image":
        return "Image"
      case "repeater":
        return "Repeater"
      case "color":
        return "Color Picker"
      case "wysiwyg":
        return "WYSIWYG Editor"
      case "checkbox":
        return "Checkbox"
      case "radio":
        return "Radio Buttons"
      case "group":
        return "Field Group"
      default:
        return type
    }
  }

  if (loading) {
    return <p className="text-gray-500">Loading components...</p>
  }

  if (error) {
    return <p className="text-red-500">{error}</p>
  }

  return (
    <div className="p-6">
      {message && (
        <div
          className={`mb-4 px-4 py-2 rounded ${
            messageType === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
          }`}
        >
          {message}
        </div>
      )}

      <button
        onClick={() => {
          setShowPopup(true)
          setComponentName("")
          setHandle("")
        }}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition flex items-center gap-2"
      >
        <Plus className="w-5 h-5" /> Add New Component
      </button>

      <div className="mt-6">
        <h3 className="text-lg text-white font-semibold mb-2">Existing Components</h3>

        {components.length === 0 ? (
          <p>No components found. Create your first component above.</p>
        ) : (
          <ul className="space-y-3">
            {components.map((comp) => (
              <li key={comp.id} className="bg-white p-4 rounded shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <strong>{comp.name}</strong> <span className="text-gray-500">—</span>{" "}
                    <code className="bg-gray-100 px-1 rounded">{comp.handle_name}</code>
                  </div>
                  <div className="space-x-2 flex items-center">
                    <button
                      onClick={() => openFieldEditModal(comp)}
                      className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition flex items-center gap-1 text-sm"
                    >
                      <Plus className="w-4 h-4" /> Add Field
                    </button>
                    <button
                      onClick={() => handleDeleteComponent(comp.id)}
                      className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition flex items-center gap-1 text-sm"
                    >
                      <Trash2 className="w-4 h-4" /> Delete
                    </button>
                  </div>
                </div>
                {comp.fields && comp.fields.length > 0 ? (
                  <div className="mt-3">
                    <h4 className="text-sm font-medium text-gray-700">Fields:</h4>
                    <ul className="mt-2 space-y-2">
                      {comp.fields.map((field) => (
                        <li
                          key={field.name}
                          className="border-b border-gray-200 last:border-b-0 py-3"
                        >
                          <div className="flex justify-between items-start mb-1">
                            <div>
                              <span className="font-medium text-gray-900">{field.label}</span>
                              <span className="ml-2 text-sm text-gray-500">({renderFieldType(field.type)})</span>
                            </div>
                            <button
                              onClick={() => handleDeleteField(field.id)}
                              className="text-red-600 hover:text-red-800 text-sm"
                            >
                              Delete
                            </button>
                          </div>
                          <div className="text-sm text-gray-600">{renderFieldValue(field)}</div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p className="mt-2 text-gray-500 text-sm">No fields added yet.</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-6 text-white">
        <h3 className="text-lg font-semibold mb-2 text-white">Assign Components to Content</h3>
        <div className="mb-4">
          <label className="block text-white mb-1">Content Type</label>
          <select
            value={postType}
            onChange={(e) => setPostType(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
          >
            <option value="page">Pages</option>
            <option value="post">Posts</option>
          </select>
        </div>

        {/* Removed "Select Components to Assign" section as per user request */}

        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            Select {postType === "page" ? "Pages" : "Posts"} to Assign All Components To
          </h4>
          <div className="space-y-2 bg-white p-4 rounded shadow">
            {postType === "page" && (
              <label className="flex items-center text-gray-800 font-semibold">
                <input
                  type="checkbox"
                  checked={selectAllPages}
                  onChange={(e) => handleSelectAllPagesChange(e.target.checked)}
                  className="mr-2"
                />
                All Pages
              </label>
            )}
            {postType === "post" && (
              <label className="flex items-center text-gray-800 font-semibold">
                <input
                  type="checkbox"
                  checked={selectAllPosts}
                  onChange={(e) => handleSelectAllPostsChange(e.target.checked)}
                  className="mr-2"
                />
                All Posts
              </label>
            )}
            {posts.map((post) => (
              <label key={post.id} className="flex items-center text-gray-800">
                <input
                  type="checkbox"
                  checked={selectedPosts.includes(post.id)}
                  onChange={(e) => handlePostSelectionChange(post.id, e.target.checked)}
                  className="mr-2"
                />
                {post.title}{" "}
                {post.has_components && <span className="text-green-600 text-sm ml-1">(Components Assigned)</span>}
              </label>
            ))}
          </div>
        </div>

        <button
          onClick={handleSaveAssignments}
          className="mt-4 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition flex items-center gap-2"
        >
          Save Assignments
        </button>
      </div>

      {showPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">Create New Component</h3>
            <input
              type="text"
              value={componentName}
              placeholder="Component Name"
              onChange={(e) => {
                const value = e.target.value
                setComponentName(value)
                if (!handle || handle === generateHandle(componentName)) {
                  setHandle(generateHandle(value))
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
            />
            <p className="text-sm text-gray-600 mb-4">
              Handle: <span className="font-mono">{handle}</span>
            </p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={handleSubmitNewComponent}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setShowPopup(false)
                  setComponentName("")
                  setHandle("")
                }}
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition"
              >
                Cancel
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
