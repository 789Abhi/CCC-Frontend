"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import FieldEditModal from "./FieldEditModal" // Corrected import
import { Plus, Edit, Trash2 } from "lucide-react" // Using Lucide React icons

const ComponentList = () => {
  const [showPopup, setShowPopup] = useState(false)
  const [componentName, setComponentName] = useState("")
  const [handle, setHandle] = useState("")
  const [components, setComponents] = useState([])
  const [message, setMessage] = useState("")
  const [messageType, setMessageType] = useState("")
  const [showFieldEditModal, setShowFieldEditModal] = useState(false) // Renamed state
  const [selectedComponentForField, setSelectedComponentForField] = useState(null) // Store full component object
  const [editingField, setEditingField] = useState(null) // State for field being edited
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [postType, setPostType] = useState("page")
  const [posts, setPosts] = useState([])
  const [selectedPosts, setSelectedPosts] = useState([])
  const [selectAllPages, setSelectAllPages] = useState(false)
  const [selectAllPosts, setSelectAllPosts] = useState(false)
  const [selectedComponentsForAssignment, setSelectedComponentsForAssignment] = useState([]) // Renamed for clarity

  const generateHandle = (name) => {
    return name
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/[^\w_]+/g, "")
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
      formData.append("action", "ccc_get_posts_with_components") // Use the new AJAX action
      formData.append("post_type", type)
      formData.append("nonce", window.cccData.nonce)

      const response = await axios.post(window.cccData.ajaxUrl, formData)

      if (response.data.success && Array.isArray(response.data.data?.posts)) {
        setPosts(response.data.data.posts)
        // Initialize selectedComponentsForAssignment based on fetched posts
        const initialSelected = []
        response.data.data.posts.forEach((post) => {
          if (post.assigned_components && post.assigned_components.length > 0) {
            post.assigned_components.forEach((comp_id) => {
              if (!initialSelected.includes(comp_id)) {
                initialSelected.push(comp_id)
              }
            })
          }
        })
        setSelectedComponentsForAssignment(initialSelected)
      } else {
        setPosts([])
        setError("Failed to fetch posts.")
      }
    } catch (err) {
      setError("Failed to fetch posts. Please try again.")
      console.error("Failed to fetch posts", err)
    }
  }

  const handleSubmit = async () => {
    if (!componentName) {
      setMessage("Please enter a component name")
      setMessageType("error")
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
        setMessage(response.data.message || "Component created successfully.")
        setMessageType("success")
        fetchComponents()
        setShowPopup(false)
        setComponentName("")
        setHandle("")
      } else {
        setMessage(response.data.message || "Failed to create component.")
        setMessageType("error")
      }
    } catch (error) {
      console.error("Error creating component:", error)
      setMessage("Error connecting to server. Please try again.")
      setMessageType("error")
    }

    setTimeout(() => {
      setMessage("")
      setMessageType("")
    }, 5000)
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
        setMessage("Component deleted successfully.")
        setMessageType("success")
        fetchComponents()
        fetchPosts(postType) // Refresh assignments after deletion
      } else {
        setMessage(response.data.message || "Failed to delete component.")
        setMessageType("error")
      }
    } catch (error) {
      console.error("Error deleting component:", error)
      setMessage("Error connecting to server. Please try again.")
      setMessageType("error")
    }

    setTimeout(() => setMessage(""), 5000)
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
        setMessage("Field deleted successfully.")
        setMessageType("success")
        fetchComponents() // Re-fetch components to update field list
      } else {
        setMessage(response.data.message || "Failed to delete field.")
        setMessageType("error")
      }
    } catch (error) {
      console.error("Error deleting field:", error)
      setMessage("Error connecting to server. Please try again.")
      setMessageType("error")
    }

    setTimeout(() => setMessage(""), 5000)
  }

  const handleSaveAssignments = async () => {
    try {
      const assignments = {}
      const allPostIds = posts.map((p) => p.id)

      if (selectAllPages && postType === "page") {
        // Assign selected components to all pages
        allPostIds.forEach((id) => {
          assignments[id] = selectedComponentsForAssignment
        })
      } else if (selectAllPosts && postType === "post") {
        // Assign selected components to all posts
        allPostIds.forEach((id) => {
          assignments[id] = selectedComponentsForAssignment
        })
      } else {
        // Assign selected components to specific posts
        selectedPosts.forEach((id) => {
          assignments[id] = selectedComponentsForAssignment
        })
        // For posts not selected, ensure components are removed if they were previously assigned
        const unselectedPosts = allPostIds.filter((id) => !selectedPosts.includes(id))
        unselectedPosts.forEach((id) => {
          // Only clear if the post was previously managed by this system
          const post = posts.find((p) => p.id === id)
          if (post && post.has_components) {
            assignments[id] = []
          }
        })
      }

      const formData = new FormData()
      formData.append("action", "ccc_save_component_assignments") // Use the new AJAX action
      formData.append("nonce", window.cccData.nonce)
      formData.append("assignments", JSON.stringify(assignments))

      const response = await axios.post(window.cccData.ajaxUrl, formData)

      if (response.data.success) {
        setMessage(response.data.message || "Assignments saved successfully.")
        setMessageType("success")
        fetchPosts(postType) // Refresh posts to show updated assignment status
      } else {
        setMessage(response.data.message || "Failed to save assignments.")
        setMessageType("error")
      }
    } catch (error) {
      console.error("Error saving assignments:", error)
      setMessage("Error connecting to server. Please try again.")
      setMessageType("error")
    }

    setTimeout(() => setMessage(""), 5000)
  }

  useEffect(() => {
    fetchComponents()
  }, [])

  useEffect(() => {
    fetchPosts(postType)
    setSelectedPosts([])
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

  const handleComponentAssignmentChange = (componentId, isChecked) => {
    setSelectedComponentsForAssignment((prev) => {
      if (isChecked) {
        return [...prev, componentId]
      } else {
        return prev.filter((id) => id !== componentId)
      }
    })
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
      setSelectedPosts([]) // Clear individual selections if 'All Pages' is checked
    }
  }

  const handleSelectAllPostsChange = (isChecked) => {
    setSelectAllPosts(isChecked)
    if (isChecked) {
      setSelectedPosts([]) // Clear individual selections if 'All Posts' is checked
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
                          key={field.id}
                          className="border-l-4 border-blue-500 pl-3 py-2 bg-gray-50 rounded flex justify-between items-center"
                        >
                          <div>
                            <span className="font-medium">{field.label}</span> <span className="text-gray-500">—</span>{" "}
                            <code className="bg-gray-100 px-1 rounded">{field.name}</code>
                            <span className="ml-2 text-gray-600 text-sm capitalize">
                              ({field.type}
                              {field.type === "repeater" && field.config?.nested_fields?.length > 0
                                ? ` with ${field.config.nested_fields.length} nested fields`
                                : ""}
                              )
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => openFieldEditModal(comp, field)}
                              className="text-yellow-600 hover:text-yellow-800 p-1 rounded-full hover:bg-yellow-50 transition-colors"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteField(field.id)}
                              className="text-red-600 hover:text-red-800 p-1 rounded-full hover:bg-red-50 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
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

        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            Select Components to Assign to {postType === "page" ? "Pages" : "Posts"}
          </h4>
          <div className="space-y-2 bg-white p-4 rounded shadow">
            {components.length === 0 ? (
              <p className="text-gray-500">No components available to assign.</p>
            ) : (
              components.map((comp) => (
                <label key={comp.id} className="flex items-center text-gray-800">
                  <input
                    type="checkbox"
                    checked={selectedComponentsForAssignment.includes(comp.id)}
                    onChange={(e) => handleComponentAssignmentChange(comp.id, e.target.checked)}
                    className="mr-2"
                  />
                  {comp.name}
                </label>
              ))
            )}
          </div>
        </div>

        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            Select {postType === "page" ? "Pages" : "Posts"} to Assign Components To
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
                  checked={
                    (postType === "page" && selectAllPages) ||
                    (postType === "post" && selectAllPosts) ||
                    selectedPosts.includes(post.id)
                  }
                  onChange={(e) => handlePostSelectionChange(post.id, e.target.checked)}
                  className="mr-2"
                  disabled={(postType === "page" && selectAllPages) || (postType === "post" && selectAllPosts)}
                />
                {post.title}{" "}
                {post.assigned_components && post.assigned_components.length > 0 && (
                  <span className="text-green-600 text-sm ml-1">
                    (Assigned:{" "}
                    {post.assigned_components
                      .map((id) => components.find((c) => c.id === id)?.name || `ID:${id}`)
                      .join(", ")}
                    )
                  </span>
                )}
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
                onClick={handleSubmit}
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
          onSave={closeFieldEditModal} // Close and refresh components on save
        />
      )}
    </div>
  )
}

export default ComponentList
