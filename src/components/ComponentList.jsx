"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import toast from "react-hot-toast"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import {
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import FieldEditModal from "./FieldEditModal"

import plusIcon from "/plus-Icon.svg"
import SearchIcon from "/SearchIcon.svg"
import FilterIcon from "/Filter.svg"
import dragDropIcon from "/drag-drop-icon.svg"
import deleteIcon from "/delete.svg"
import editIcon from "/Edit.svg"
import { LayoutGrid, FileText, ImageIcon, Repeat, Settings, Users, Palette, GripVertical, GitBranch } from "lucide-react"
import ComponentEditNameModal from "./ComponentEditModal"
import FieldVisualTreeModal from "./FieldVisualTreeModal"

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
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false)
  const [postType, setPostType] = useState("page")
  const [posts, setPosts] = useState([])
  const [selectedPosts, setSelectedPosts] = useState([])
  const [selectAllPages, setSelectAllPages] = useState(false)
  const [selectAllPosts, setSelectAllPosts] = useState(false)
  const [copiedText, setCopiedText] = useState(null)
  const [showEditComponentNameModal, setShowEditComponentNameModal] = useState(false)
  const [componentToEditName, setComponentToEditName] = useState(null)
  
  // Tree modal state
  const [showTreeModal, setShowTreeModal] = useState(false)
  const [selectedComponentForTree, setSelectedComponentForTree] = useState(null)

  const generateHandle = (name) => {
    return name
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/[^\w_]+/g, "")
  }

  const showMessage = (msg, type) => {
    if (type === 'success') {
      toast.success(msg)
    } else if (type === 'error') {
      toast.error(msg)
    } else {
      toast(msg)
    }
  }

  const handleCopy = (text) => {
    console.log("Attempting to copy text:", text)

    const copyFallback = (textToCopy) => {
      const textArea = document.createElement("textarea")
      textArea.value = textToCopy
      document.body.appendChild(textArea)
      textArea.select()

      try {
        document.execCommand("copy")
        console.log("Copy successful using fallback")
        return true
      } catch (err) {
        console.error("Fallback copy failed:", err)
        return false
      } finally {
        document.body.removeChild(textArea)
      }
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(text)
        .then(() => {
          console.log("Text copied to clipboard:", text)
          setCopiedText(text)
          setTimeout(() => setCopiedText(null), 2000)
        })
        .catch((err) => {
          console.error("Failed to copy text with clipboard API:", err)
          const success = copyFallback(text)
          if (success) {
            setCopiedText(text)
            setTimeout(() => setCopiedText(null), 2000)
          } else {
            toast.error("Failed to copy text.")
          }
        })
    } else {
      console.warn("Clipboard API not supported, using fallback")
      const success = copyFallback(text)
      if (success) {
        setCopiedText(text)
        setTimeout(() => setCopiedText(null), 2000)
      } else {
        toast.error("Failed to copy text.")
      }
    }
  }

  const fetchComponents = async () => {
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append("action", "ccc_get_components")
      formData.append("nonce", window.cccData.nonce)

      const response = await axios.post(window.cccData.ajaxUrl, formData)

      if (response.data.success && Array.isArray(response.data.data)) {
        setComponents(response.data.data)
        setError("")
        return response.data.data // <-- return latest data
      } else {
        setComponents([])
        setError("Failed to fetch components. Invalid response format.")
        console.error("Invalid response format:", response.data)
        return []
      }
    } catch (err) {
      setError("Failed to connect to server. Please refresh and try again.")
      console.error("Failed to fetch components", err)
      return []
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
        
        // IMPORTANT: Show posts as selected if they were assigned via main interface, regardless of current component count
        // This ensures metabox changes don't affect main interface selection
        const initiallySelected = response.data.data.posts
          .filter((post) => post.assigned_via_main_interface)
          .map((post) => post.id)
        
        setSelectedPosts(initiallySelected)

        // Check if all posts are assigned via main interface (for "select all" functionality)
        const postsAssignedViaMain = response.data.data.posts.filter((post) => post.assigned_via_main_interface)
        
        if (postsAssignedViaMain.length > 0 && postsAssignedViaMain.length === response.data.data.posts.length) {
          // All posts are assigned via main interface
          if (type === "page") setSelectAllPages(true)
          if (type === "post") setSelectAllPosts(true)
        } else {
          // Not all posts are assigned via main interface
          if (type === "page") setSelectAllPages(false)
          if (type === "post") setSelectAllPosts(false)
        }
        
        console.log('CCC: Fetched posts:', response.data.data.posts)
        console.log('CCC: Initially selected posts (main interface only):', initiallySelected)
        
        // DEBUG: Log detailed information for each post
        response.data.data.posts.forEach(post => {
          console.log(`CCC DEBUG Post ${post.id} (${post.title}):`, {
            has_components: post.has_components,
            assigned_via_main_interface: post.assigned_via_main_interface,
            will_be_selected: post.assigned_via_main_interface, // Changed: only depends on main interface flag
            component_count: post.assigned_components ? post.assigned_components.length : 0
          });
        });
      } else {
        setPosts([])
        setSelectedPosts([])
        setSelectAllPages(false)
        setSelectAllPosts(false)
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
        fetchPosts(postType)
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
    ) {
      return
    }

    try {
      const formData = new FormData()
      formData.append("action", "ccc_delete_component")
      formData.append("component_id", componentId)
      formData.append("nonce", window.cccData.nonce)

      const response = await axios.post(window.cccData.ajaxUrl, formData)

      if (response.data.success) {
        showMessage("Component deleted successfully.", "success")
        fetchComponents()
        fetchPosts(postType)
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

  const handleUpdateComponentFields = async (componentId, updatedFields) => {
    try {
      const formData = new FormData()
      formData.append("action", "ccc_update_component_fields")
      formData.append("component_id", componentId)
      formData.append("fields", JSON.stringify(updatedFields))
      formData.append("nonce", window.cccData.nonce)

      const response = await axios.post(window.cccData.ajaxUrl, formData)

      if (response.data.success) {
        showMessage("Component fields updated successfully.", "success")
        return true
      } else {
        showMessage(response.data.message || "Failed to update component fields.", "error")
        return false
      }
    } catch (error) {
      console.error("Error updating component fields:", error)
      showMessage("Error connecting to server. Please try again.", "error")
      return false
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

      posts.forEach((post) => {
        const isSelected =
          (postType === "page" && selectAllPages) ||
          (postType === "post" && selectAllPosts) ||
          selectedPosts.includes(post.id)

        if (isSelected) {
          assignments[post.id] = allComponentObjects
        } else {
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
        fetchPosts(postType)
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
      setSelectedPosts(posts.map((p) => p.id))
    } else {
      setSelectedPosts([])
    }
  }

  const handleSelectAllPostsChange = (isChecked) => {
    setSelectAllPosts(isChecked)
    if (isChecked) {
      setSelectedPosts(posts.map((p) => p.id))
    } else {
      setSelectedPosts([])
    }
  }

  useEffect(() => {
    fetchComponents()
  }, [])

  useEffect(() => {
    fetchPosts(postType)
    setSelectAllPages(false)
    setSelectAllPosts(false)
  }, [postType])

  const openFieldEditModal = async (component, field = null) => {
    // Always fetch the latest components before opening the modal
    const latestComponents = await fetchComponents();
    const latestComponent = latestComponents.find(c => c.id === component.id)
    let latestField = field
    if (latestComponent && field) {
      latestField = latestComponent.fields.find(f => f.id === field.id)
    }
    setSelectedComponentForField(latestComponent || component)
    setEditingField(latestField)
    setShowFieldEditModal(true)
  }

  const closeFieldEditModal = () => {
    setShowFieldEditModal(false)
    setSelectedComponentForField(null)
    setEditingField(null)
    fetchComponents()
  }

  const openEditComponentNameModal = (component) => {
    setComponentToEditName(component)
    setShowEditComponentNameModal(true)
  }

  const closeEditComponentNameModal = () => {
    setShowEditComponentNameModal(false)
    setComponentToEditName(null)
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
      case "color": // NEW: Icon for color field
        return <Palette className="w-4 h-4 text-pink-500" />
      default:
        return <FileText className="w-4 h-4 text-gray-500" />
    }
  }

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = async (event, componentId) => {
    const { active, over } = event

    if (active.id !== over.id) {
      // Update the local state immediately for smooth UX
      const updatedComponents = components.map(comp => {
        if (comp.id === componentId) {
          const oldIndex = comp.fields.findIndex(field => field.id.toString() === active.id)
          const newIndex = comp.fields.findIndex(field => field.id.toString() === over.id)
          
          const newFields = arrayMove(comp.fields, oldIndex, newIndex)
          return { ...comp, fields: newFields }
        }
        return comp
      })
      setComponents(updatedComponents)

      // Send the new order to the backend
      try {
        const formData = new FormData()
        formData.append("action", "ccc_update_field_order")
        formData.append("component_id", componentId)
        formData.append("field_order", JSON.stringify(updatedComponents.find(c => c.id === componentId).fields.map(f => f.id)))
        formData.append("nonce", window.cccData.nonce)

        const response = await axios.post(window.cccData.ajaxUrl, formData)
        
        if (!response.data.success) {
          // Revert the change if the backend update failed
          setComponents(components)
          showMessage("Failed to update field order. Please try again.", "error")
        }
      } catch (error) {
        // Revert the change if the request failed
        setComponents(components)
        showMessage("Failed to update field order. Please try again.", "error")
        console.error("Error updating field order:", error)
      }
    }
  }

  // Sortable Field Component
  const SortableField = ({ field, component, onEdit, onDelete, onCopy, copiedText }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: field.id.toString() })

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    }

    return (
      <div
        ref={setNodeRef}
        style={style}
        className={`border border-bgPrimary rounded-custom transition-all duration-200 ${
          isDragging ? 'shadow-2xl scale-105 z-50' : ''
        }`}
      >
        <div className="flex items-center justify-between p-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center">
              <div
                {...attributes}
                {...listeners}
                className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-100 rounded transition-colors mr-2"
              >
                <GripVertical className="w-5 h-5 text-gray-400 hover:text-gray-600" />
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-800 text-lg">{field.label}</span>
                <span className="text-gray-400">•</span>
                <div className="relative">
                  <code
                    className="bg-[#F672BB] border border-[#F2080C] text-white px-2 py-1 rounded-lg text-sm font-mono cursor-pointer hover:bg-[#F672BB]/80 transition-colors"
                    onClick={() => onCopy(field.name)}
                  >
                    {field.name}
                  </code>
                  {copiedText === field.name && (
                    <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded py-1 px-2 z-50 shadow-lg">
                      Copied!
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 mt-1">
              <span className="bg-blue-100 border border-[#F2080C] text-bgSecondary px-2 py-1 rounded-full text-sm font-medium capitalize">
                {field.type}
              </span>
              {field.type === "repeater" && Array.isArray(field.children) && field.children.length > 0 && (
                <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs font-medium">
                  {field.children.length} nested field
                  {field.children.length !== 1 ? "s" : ""}
                </span>
              )}
            </div>
      
            <img
              onClick={() => onEdit(component, field)}
              src={editIcon || "/placeholder.svg"}
              className="h-[18px] w-[18px] cursor-pointer"
              alt="edit-icon"
            />
            <img
              onClick={() => onDelete(field.id)}
              className="h-[18px] w-[18px] cursor-pointer"
              src={deleteIcon || "/placeholder.svg"}
              alt="delete-icon"
            />
          </div>
        </div>
      </div>
    )
  }

  const filteredComponents = components.filter((comp) => {
    const searchLower = searchTerm.toLowerCase()
    const matchesComponentName =
      comp.name.toLowerCase().includes(searchLower) || comp.handle_name.toLowerCase().includes(searchLower)

    const matchesFieldName =
      comp.fields &&
      comp.fields.some(
        (field) => field.label.toLowerCase().includes(searchLower) || field.name.toLowerCase().includes(searchLower),
      )

    const matchesSearch = matchesComponentName || matchesFieldName

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
    <div className="min-h-screen bg-customGray rounded-custom py-3 px-10">
      <div className="flex flex-col gap-5">
        {message && (
          <div
            className={`
              mb-6 p-4 rounded-lg shadow-sm border-l-4 
              ${
                messageType === "success"
                  ? "bg-green-50 border-green-400 text-green-800"
                  : "bg-red-50 border-red-400 text-red-800"
              }
            `}
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

        <div className="rounded-custom">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <button
              onClick={() => {
                setShowNewComponentDialog(true)
                setComponentName("")
                setHandle("")
              }}
              className="text-bgSecondary px-6 py-3 text-lg rounded-custom flex border border-bgPrimary items-center gap-3 font-medium"
            >
              Add New
              <img
                className="h-[30px] w-[30px] object-contain"
                src={plusIcon || "/placeholder.svg"}
                alt="Add New Component"
              />
            </button>

            <div className="flex flex-row items-center gap-4">
              <div className="relative flex items-center border rounded-custom border-bgPrimary px-3 py-3 w-[220px]">
                <img className="h-[25px] w-[25px]" src={SearchIcon || "/placeholder.svg"} alt="Search" />
                <input
                  type="text"
                  placeholder="Search components/Fields"
                  value={searchTerm}
                  style={{ boxShadow: "none" }}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full outline-0 !border-0 !focus:shadow-none !bg-transparent focus:outline-0 focus:border-0"
                />
              </div>

              <div className="relative">
                <button
                  onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
                  className="flex items-center border rounded-custom border-bgPrimary px-3 py-3 gap-2"
                >
                  <img src={FilterIcon || "/placeholder.svg"} alt="Filter" className="h-[30px] w-[30px]" />
                  <span className="text-[#aca3af] text-[13px]">
                    {filterType === "all"
                      ? "All Components"
                      : filterType === "with-fields"
                        ? "With Fields"
                        : "No Fields"}
                  </span>
                </button>

                {isFilterDropdownOpen && (
                  <div className="absolute top-full mt-2 right-0 w-48 bg-white border border-gray-200 rounded-custom shadow-lg z-10">
                    <button
                      onClick={() => {
                        setFilterType("all")
                        setIsFilterDropdownOpen(false)
                      }}
                      className={`
                        block w-full text-left px-4 py-2 text-bgSecondary 
                        ${filterType === "all" ? "bg-gray-100 font-semibold" : ""}
                      `}
                    >
                      All Components
                    </button>
                    <button
                      onClick={() => {
                        setFilterType("with-fields")
                        setIsFilterDropdownOpen(false)
                      }}
                      className={`
                        block w-full text-left px-4 py-2 text-bgSecondary  
                        ${filterType === "with-fields" ? "bg-gray-100 font-semibold" : ""}
                      `}
                    >
                      With Fields
                    </button>
                    <button
                      onClick={() => {
                        setFilterType("no-fields")
                        setIsFilterDropdownOpen(false)
                      }}
                      className={`
                        block w-full text-left px-4 py-2 text-bgSecondary  
                        ${filterType === "no-fields" ? "bg-gray-100 font-semibold" : ""}
                      `}
                    >
                      No Fields
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 p-5 bg-white rounded-custom border border-bgPrimary">
          {filteredComponents.length === 0 ? (
            <div className="bg-customGray rounded-custom p-12 text-center">
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
              <div key={comp.id} className="bg-customGray rounded-custom p-5">
                <div className="">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex flex-row items-center gap-2">
                        <h3 className="text-xl font-bold">{comp.name}</h3>
                        <div className="relative">
                          <code
                            className="bg-[#F672BB] border border-[#F2080C] text-white px-3 py-1 rounded-lg text-sm font-mono cursor-pointer hover:bg-[#F672BB]/80 transition-colors"
                            onClick={() => handleCopy(comp.handle_name)}
                          >
                            {comp.handle_name}
                          </code>
                          {copiedText === comp.handle_name && (
                            <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded py-1 px-2 z-50 shadow-lg">
                              Copied!
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <img
                        onClick={() => openFieldEditModal(comp)}
                        className="w-[25px] h-[25px] cursor-pointer"
                        src={plusIcon || "/placeholder.svg"}
                        alt="add field"
                      />
                        <GitBranch
                        className="w-[25px] h-[25px] cursor-pointer text-emerald-600 hover:text-emerald-800 transition-colors duration-200"
                        title="View Field Structure"
                        onClick={() => {
                          setSelectedComponentForTree(comp)
                          setShowTreeModal(true)
                        }}
                      />
                      <img
                        onClick={() => openEditComponentNameModal(comp)}
                        className="w-[25px] h-[25px] cursor-pointer"
                        src={editIcon || "/placeholder.svg"}
                        alt="edit Component"
                      />
               
                      <img
                        onClick={() => handleDeleteComponent(comp.id)}
                        className="w-[25px] h-[25px] cursor-pointer"
                        src={deleteIcon || "/placeholder.svg"}
                        alt="Delete Component"
                      />
                    </div>
                  </div>
                </div>
                <div className="py-6">
                  {comp.fields && comp.fields.length > 0 ? (
                    <div>
                      <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={(event) => handleDragEnd(event, comp.id)}
                      >
                        <SortableContext
                          items={comp.fields.map(field => field.id.toString())}
                          strategy={verticalListSortingStrategy}
                        >
                          <div className="space-y-3">
                            {comp.fields.map((field) => (
                              <SortableField
                                key={field.id}
                                field={field}
                                component={comp}
                                onEdit={openFieldEditModal}
                                onDelete={handleDeleteField}
                                onCopy={handleCopy}
                                copiedText={copiedText}
                              />
                            ))}
                          </div>
                        </SortableContext>
                      </DndContext>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="text-gray-400 mb-3">
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

            <button
              onClick={handleSaveAssignments}
              className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-6 py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl font-medium"
            >
              Save Assignments
            </button>
          </div>
        </div>

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
                className="px-6 py-3 text-gray-600 border border-gray-200 rounded-xl transition-all duration-200 font-medium"
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

      {showFieldEditModal && (
        <FieldEditModal
          isOpen={showFieldEditModal}
          component={selectedComponentForField}
          field={editingField}
          onClose={closeFieldEditModal}
          onSave={closeFieldEditModal}
        />
      )}

      {showEditComponentNameModal && (
        <ComponentEditNameModal
          isOpen={showEditComponentNameModal}
          component={componentToEditName}
          onClose={closeEditComponentNameModal}
          onSave={closeEditComponentNameModal}
        />
      )}

      {/* Visual Tree Modal */}
      {showTreeModal && selectedComponentForTree && (
        <FieldVisualTreeModal
          isOpen={showTreeModal}
          fields={selectedComponentForTree.fields || []}
          onClose={() => {
            setShowTreeModal(false)
            setSelectedComponentForTree(null)
          }}
          onFieldUpdate={async (path, updatedField) => {
            try {
              console.log('CCC ComponentList: Updating field at path:', path, 'with data:', updatedField)
              
              // Update the field in the component
              const updateFieldInComponent = (fields, path, updatedField) => {
                const [currentIndex, ...remainingPath] = path
                if (!Array.isArray(fields) || typeof currentIndex !== 'number') return fields
                
                if (remainingPath.length === 0) {
                  return fields.map((f, i) => {
                    if (i === currentIndex) {
                      // Merge, don't replace. Always preserve id and config.
                      return {
                        ...f,
                        ...updatedField,
                        id: f.id,
                        config: updatedField.config || f.config || {},
                      }
                    }
                    return f
                  })
                } else {
                  return fields.map((f, i) => {
                    if (i === currentIndex && f.type === "repeater" && f.config?.nested_fields) {
                      return {
                        ...f,
                        config: {
                          ...f.config,
                          nested_fields: updateFieldInComponent(f.config.nested_fields, remainingPath, updatedField)
                        }
                      }
                    }
                    return f
                  })
                }
              }
              
              // Get the updated fields
              const updatedFields = updateFieldInComponent(selectedComponentForTree.fields, path, updatedField)
              console.log('CCC ComponentList: Updated fields:', updatedFields)
              
              // Update the component in the list
              setComponents(prev => prev.map(comp => 
                comp.id === selectedComponentForTree.id 
                  ? { ...comp, fields: updatedFields }
                  : comp
              ))
              
              // Update the selected component
              setSelectedComponentForTree(prev => ({
                ...prev,
                fields: updatedFields
              }))
              
              // Note: We don't need to call handleUpdateComponentFields here because
              // the individual field has already been updated in the backend through
              // the ccc_update_field_from_hierarchy endpoint in FieldVisualTreeModal
              console.log('CCC ComponentList: Field updated successfully in component state')
              
            } catch (error) {
              console.error('CCC ComponentList: Error in onFieldUpdate:', error)
            }
          }}
          onFieldUpdateSuccess={async () => {
            // Await fetchComponents and update selectedComponentForTree with the latest data
            const latestComponents = await fetchComponents();
            if (selectedComponentForTree) {
              const latest = latestComponents.find(c => c.id === selectedComponentForTree.id);
              if (latest) setSelectedComponentForTree(latest);
              return latest ? latest.fields : [];
            }
            return [];
          }}
        />
      )}
    </div>
  )
}

export default ComponentList
