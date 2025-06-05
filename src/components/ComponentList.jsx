"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import FieldEditModal from "./FieldEditModal"
import {
  Plus,
  Edit,
  Trash2,
  LayoutGrid,
  FileText,
  ImageIcon,
  Repeat,
  Search,
  Filter,
  Settings,
  Users,
} from "lucide-react"

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
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("all")

  // Assignment functionality
  const [postType, setPostType] = useState("page")
  const [posts, setPosts] = useState([])
  const [selectedPosts, setSelectedPosts] = useState([])
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
        fetchPosts(postType) // Refresh posts after creating component
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
        fetchComponents()
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
    fetchComponents()
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

  const filteredComponents = components.filter((comp) => {
    const matchesSearch =
      comp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comp.handle_name.toLowerCase().includes(searchTerm.toLowerCase())

    if (filterType === "all") return matchesSearch
    if (filterType === "with-fields") return matchesSearch && comp.fields && comp.fields.length > 0
    if (filterType === "no-fields") return matchesSearch && (!comp.fields || comp.fields.length === 0)

    return matchesSearch
  })

  if (loading) {
    return (
      <div className="min-h-screen rounded-custom bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-center items-center h-64">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-200"></div>
              <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-purple-600 absolute top-0 left-0"></div>
            </div>
            <p className="ml-6 text-xl text-gray-700 font-medium">Loading components...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br rounded-custom from-purple-50 via-pink-50 to-indigo-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border-l-4 border-red-400 p-6 rounded-lg shadow-sm">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error Loading Components</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-customGray py-3 px-10 ">
      <div className=" space-y-8">
     

        {/* Message Display */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg shadow-sm border-l-4 ${
              messageType === "success"
                ? "bg-green-50 border-green-400 text-green-800"
                : "bg-red-50 border-red-400 text-red-800"
            }`}
          >
            <div className="flex">
              <div className="flex-shrink-0">
                {messageType === "success" ? (
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>
              <div className="ml-3">
                <p className="font-medium">{message}</p>
              </div>
            </div>
          </div>
        )}

        {/* Controls Section */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search components..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                />
              </div>

              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="pl-10 pr-8 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-white"
                >
                  <option value="all">All Components</option>
                  <option value="with-fields">With Fields</option>
                  <option value="no-fields">No Fields</option>
                </select>
              </div>
            </div>

            {/* Add Component Button */}
            <button
              onClick={() => {
                setShowNewComponentDialog(true)
                setComponentName("")
                setHandle("")
              }}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-3 rounded-xl flex items-center gap-3 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-medium"
            >
              <Plus className="w-5 h-5" />
              Create Component
            </button>
          </div>
        </div>

        {/* Components Grid */}
        <div className="grid gap-6">
          {filteredComponents.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 text-center">
              <div className="text-gray-400 mb-6">
                <LayoutGrid className="w-16 h-16 mx-auto" />
              </div>
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                {searchTerm || filterType !== "all" ? "No components found" : "No components yet"}
              </h3>
              <p className="text-gray-500 mb-6">
                {searchTerm || filterType !== "all"
                  ? "Try adjusting your search or filter criteria"
                  : "Get started by creating your first component"}
              </p>
              {!searchTerm && filterType === "all" && (
                <button
                  onClick={() => setShowNewComponentDialog(true)}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Create Your First Component
                </button>
              )}
            </div>
          ) : (
            filteredComponents.map((comp) => (
              <div
                key={comp.id}
                className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
              >
                {/* Component Header */}
                <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="bg-white/20 p-3 rounded-xl">
                        <LayoutGrid className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold">{comp.name}</h3>
                        <code className="bg-white/20 text-white/90 px-3 py-1 rounded-lg text-sm font-mono">
                          {comp.handle_name}
                        </code>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openFieldEditModal(comp)}
                        className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-lg transition-all duration-200 backdrop-blur-sm"
                        title="Add Field"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteComponent(comp.id)}
                        className="bg-red-500/80 hover:bg-red-600 text-white p-2 rounded-lg transition-all duration-200"
                        title="Delete Component"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Component Body */}
                <div className="p-6">
                  {comp.fields && comp.fields.length > 0 ? (
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-lg font-semibold text-gray-800">Fields ({comp.fields.length})</h4>
                        <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
                          {comp.fields.length} field{comp.fields.length !== 1 ? "s" : ""}
                        </span>
                      </div>
                      <div className="space-y-3">
                        {comp.fields.map((field) => (
                          <div
                            key={field.id}
                            className="bg-gray-50 border border-gray-200 rounded-xl p-4 hover:bg-gray-100 transition-all duration-200"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-white rounded-lg shadow-sm">{getFieldIcon(field.type)}</div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold text-gray-800">{field.label}</span>
                                    <span className="text-gray-400">•</span>
                                    <code className="bg-gray-200 px-2 py-1 rounded text-xs text-gray-700 font-mono">
                                      {field.name}
                                    </code>
                                  </div>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium capitalize">
                                      {field.type}
                                    </span>
                                    {field.type === "repeater" && field.config?.nested_fields?.length > 0 && (
                                      <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs font-medium">
                                        {field.config.nested_fields.length} nested field
                                        {field.config.nested_fields.length !== 1 ? "s" : ""}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => openFieldEditModal(comp, field)}
                                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                                  title="Edit Field"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteField(field.id)}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                                  title="Delete Field"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="text-gray-400 mb-4">
                        <Settings className="w-12 h-12 mx-auto" />
                      </div>
                      <p className="text-gray-500 mb-4">No fields added yet</p>
                      <button
                        onClick={() => openFieldEditModal(comp)}
                        className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-4 py-2 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
                      >
                        Add First Field
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Component Assignment Section */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-3 rounded-xl text-white">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800">Assign Components to Content</h3>
              <p className="text-gray-600">Choose which pages or posts should display your components</p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Content Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Content Type</label>
              <select
                value={postType}
                onChange={(e) => setPostType(e.target.value)}
                className="w-full max-w-xs px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
              >
                <option value="page">Pages</option>
                <option value="post">Posts</option>
              </select>
            </div>

            {/* Page/Post Selection */}
            <div>
              <h4 className="text-lg font-semibold text-gray-800 mb-4">
                Select {postType === "page" ? "Pages" : "Posts"} to Assign All Components To
              </h4>
              <div className="bg-gray-50 rounded-xl p-4 space-y-3 max-h-64 overflow-y-auto">
                {postType === "page" && (
                  <label className="flex items-center p-3 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-all duration-200">
                    <input
                      type="checkbox"
                      checked={selectAllPages}
                      onChange={(e) => handleSelectAllPagesChange(e.target.checked)}
                      className="mr-3 w-4 h-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                    />
                    <span className="font-semibold text-gray-800">All Pages</span>
                  </label>
                )}
                {postType === "post" && (
                  <label className="flex items-center p-3 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-all duration-200">
                    <input
                      type="checkbox"
                      checked={selectAllPosts}
                      onChange={(e) => handleSelectAllPostsChange(e.target.checked)}
                      className="mr-3 w-4 h-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                    />
                    <span className="font-semibold text-gray-800">All Posts</span>
                  </label>
                )}
                {posts.map((post) => (
                  <label
                    key={post.id}
                    className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-all duration-200"
                  >
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedPosts.includes(post.id)}
                        onChange={(e) => handlePostSelectionChange(post.id, e.target.checked)}
                        className="mr-3 w-4 h-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                      />
                      <span className="text-gray-800">{post.title}</span>
                    </div>
                    {post.has_components && (
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                        Components Assigned
                      </span>
                    )}
                  </label>
                ))}
              </div>
            </div>

            {/* Save Button */}
            <button
              onClick={handleSaveAssignments}
              className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-6 py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl font-medium"
            >
              Save Assignments
            </button>
          </div>
        </div>

        {/* Stats Footer */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-3xl font-bold text-purple-600">{components.length}</div>
              <div className="text-gray-600">Total Components</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-pink-600">
                {components.reduce((total, comp) => total + (comp.fields?.length || 0), 0)}
              </div>
              <div className="text-gray-600">Total Fields</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-indigo-600">
                {components.filter((comp) => comp.fields && comp.fields.length > 0).length}
              </div>
              <div className="text-gray-600">Active Components</div>
            </div>
          </div>
        </div>
      </div>

      {/* Create Component Modal */}
      {showNewComponentDialog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all duration-300">
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-6 rounded-t-2xl text-white">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold">Create New Component</h3>
                <button
                  onClick={() => setShowNewComponentDialog(false)}
                  className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/20 transition-all duration-200"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <label htmlFor="componentName" className="block text-sm font-medium text-gray-700 mb-2">
                  Component Name *
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
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                />
              </div>

              <div>
                <label htmlFor="handle" className="block text-sm font-medium text-gray-700 mb-2">
                  Handle (Auto-generated)
                </label>
                <input
                  id="handle"
                  type="text"
                  value={handle}
                  onChange={(e) => setHandle(e.target.value)}
                  placeholder="e.g., hero_section"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-600 focus:outline-none"
                  disabled={true}
                />
                <p className="text-xs text-gray-500 mt-2">This handle will be used in templates and code.</p>
              </div>
            </div>

            <div className="flex justify-end gap-3 p-6 bg-gray-50 rounded-b-2xl">
              <button
                type="button"
                onClick={() => setShowNewComponentDialog(false)}
                className="px-6 py-3 text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-100 transition-all duration-200 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitNewComponent}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl font-medium"
              >
                Create Component
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Field Edit Modal */}
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
