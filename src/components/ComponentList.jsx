"use client"

import { useState, useEffect, useRef } from "react"
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
import { LayoutGrid, FileText, ImageIcon, Repeat, Settings, Users, Palette, GripVertical, GitBranch, Download, Upload, Copy } from "lucide-react"
import ChatGPTModal from "./ChatGPTModal"
import ComponentEditNameModal from "./ComponentEditModal"
import FieldVisualTreeModal from "./FieldVisualTreeModal"
import DesignChatGPTModal from "./DesignChatGPTModal"

// Sortable Field Component - moved outside main component to fix re-rendering issues
const SortableField = ({ field, component, onEdit, onDelete, onCopy, copiedText }) => {
  try {
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

    const handleEditClick = (e) => {
      if (e && e.preventDefault) e.preventDefault()
      if (e && e.stopPropagation) e.stopPropagation()
      onEdit(component, field)
    }

    const handleDeleteClick = (e) => {
      if (e && e.preventDefault) e.preventDefault()
      if (e && e.stopPropagation) e.stopPropagation()
      onDelete(field.id)
    }

    const handleCopyClick = (e) => {
      if (e && e.preventDefault) e.preventDefault()
      if (e && e.stopPropagation) e.stopPropagation()
      onCopy(field.name)
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
                    onClick={handleCopyClick}
                  >
                    {field.name}
                  </code>
                  {copiedText && copiedText.text === field.name && copiedText.fieldId === field.id && copiedText.componentId === component.id && (
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
      
            <button
              type="button"
              onClick={handleEditClick}
              className="h-[18px] w-[18px] cursor-pointer hover:opacity-80 transition-opacity border-none bg-transparent p-0"
              title="Edit Field"
            >
              <img
                src={editIcon || "/placeholder.svg"}
                className="h-full w-full"
                alt="edit-icon"
              />
            </button>
            <button
              type="button"
              onClick={handleDeleteClick}
              className="h-[18px] w-[18px] cursor-pointer hover:opacity-80 transition-opacity border-none bg-transparent p-0"
              title="Delete Field"
            >
              <img
                src={deleteIcon || "/placeholder.svg"}
                className="h-full w-full"
                alt="delete-icon"
              />
            </button>
          </div>
        </div>
      </div>
    )
  } catch (error) {
    console.error('Error rendering SortableField:', error)
    // Fallback to a simple field display if useSortable fails
    return (
      <div className="border border-bgPrimary rounded-custom p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-800 text-lg">{field.label}</span>
            <span className="text-gray-400">•</span>
            <code 
              className="bg-[#F672BB] border border-[#F2080C] text-white px-2 py-1 rounded-lg text-sm font-mono cursor-pointer"
              onClick={handleCopyClick}
            >
              {field.name}
            </code>
          </div>
          <div className="flex items-center gap-2">
            <span className="bg-blue-100 border border-[#F2080C] text-bgSecondary px-2 py-1 rounded-full text-sm font-medium capitalize">
              {field.type}
            </span>
            <button
              type="button"
              onClick={(e) => {
                if (e && e.preventDefault) e.preventDefault()
                if (e && e.stopPropagation) e.stopPropagation()
                onEdit(component, field)
              }}
              className="h-[18px] w-[18px] cursor-pointer hover:opacity-80 transition-opacity border-none bg-transparent p-0"
              title="Edit Field"
            >
              <img
                src={editIcon || "/placeholder.svg"}
                className="h-full w-full"
                alt="edit-icon"
              />
            </button>
            <button
              type="button"
              onClick={(e) => {
                if (e && e.preventDefault) e.preventDefault()
                if (e && e.stopPropagation) e.stopPropagation()
                onDelete(field.id)
              }}
              className="h-[18px] w-[18px] cursor-pointer hover:opacity-80 transition-opacity border-none bg-transparent p-0"
              title="Delete Field"
            >
              <img
                src={deleteIcon || "/placeholder.svg"}
                className="h-full w-full"
                alt="delete-icon"
              />
            </button>
          </div>
        </div>
      </div>
    )
  }
}

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
  const [postsLoading, setPostsLoading] = useState(false)
  const [badgeUpdating, setBadgeUpdating] = useState(false)
  
  // Track last fetched postType to prevent infinite loops
  const lastFetchedPostTypeRef = useRef(null)
  
  // New state for post types
  const [postTypes, setPostTypes] = useState([])
  const [selectedPostTypes, setSelectedPostTypes] = useState([])
  const [selectAllPostTypes, setSelectAllPostTypes] = useState(false)
  const [postTypesLoading, setPostTypesLoading] = useState(false)
  const [assignedPostTypes, setAssignedPostTypes] = useState([])
  
  // Tree modal state
  const [showTreeModal, setShowTreeModal] = useState(false)
  const [selectedComponentForTree, setSelectedComponentForTree] = useState(null)

  // ChatGPT modal state
  const [showChatGPTModal, setShowChatGPTModal] = useState(false)
  
  // Duplicate functionality state
  const [componentToDuplicate, setComponentToDuplicate] = useState(null)
  
  // Design ChatGPT modal state
  
  // Design ChatGPT modal state
  const [showDesignModal, setShowDesignModal] = useState(false)
  const [selectedComponentForDesign, setSelectedComponentForDesign] = useState(null)

  // Import/Export modal state
  const [showExportModal, setShowExportModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [componentToExport, setComponentToExport] = useState(null)
  const [importJson, setImportJson] = useState("")
  const [importError, setImportError] = useState("")
  
  // New state for revised import/export functionality
  const [showExportAllModal, setShowExportAllModal] = useState(false)

  const [showExportAllDropdown, setShowExportAllDropdown] = useState(false)
  const [showImportMultipleModal, setShowImportMultipleModal] = useState(false)
  const [exportType, setExportType] = useState("component") // "component" or "fields"
  const [importType, setImportType] = useState("component") // "component" or "fields"
  const [selectedComponentForImport, setSelectedComponentForImport] = useState(null)
  const [showExportTypeDropdown, setShowExportTypeDropdown] = useState({}) // Track dropdown state for each component

  // Add useEffect to handle clicking outside dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Close all export type dropdowns when clicking outside
      const isDropdownClick = event.target.closest('.export-dropdown-container')
      const isExportAllDropdownClick = event.target.closest('.export-all-dropdown-container')
      
      if (!isDropdownClick) {
        setShowExportTypeDropdown({})
      }
      
      if (!isExportAllDropdownClick) {
        setShowExportAllDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const generateHandle = (name) => {
    return name
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/[^a-z0-9_]+/g, "")
  }

  const showMessage = (msg, type) => {
    try {
      if (type === 'success') {
        toast.success(msg)
      } else if (type === 'error') {
        toast.error(msg)
      } else {
        toast(msg)
      }
    } catch (error) {
      console.error("Toast error:", error)
      // Fallback to alert if toast fails
      if (type === 'error') {
        alert(`Error: ${msg}`)
      } else {
        alert(msg)
      }
    }
  }

  const handleCopy = (text, fieldId, componentId) => {
    const copyFallback = (textToCopy) => {
      const textArea = document.createElement("textarea")
      textArea.value = textToCopy
      document.body.appendChild(textArea)
      textArea.select()

      try {
        document.execCommand("copy")
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
          setCopiedText({ text, fieldId, componentId })
          setTimeout(() => setCopiedText(null), 2000)
        })
        .catch((err) => {
          console.error("Failed to copy text with clipboard API:", err)
          const success = copyFallback(text)
          if (success) {
            setCopiedText({ text, fieldId, componentId })
            setTimeout(() => setCopiedText(null), 2000)
          } else {
            toast.error("Failed to copy text.")
          }
        })
    } else {
      const success = copyFallback(text)
      if (success) {
        setCopiedText({ text, fieldId, componentId })
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

  // Add this function before fetchPostTypes
  const checkPostTypeAssignments = async (postTypes) => {
    const postTypesWithAssignments = [];
    
    for (const postType of postTypes) {
      try {
        const formData = new FormData();
        formData.append("action", "ccc_get_posts_with_components");
        formData.append("post_type", postType.value);
        formData.append("nonce", window.cccData.nonce);
        
        const response = await axios.post(window.cccData.ajaxUrl, formData);
        
        if (response.data.success && response.data.data && response.data.data.posts) {
          const posts = response.data.data.posts;
          // Check if any posts in this post type have components assigned via main interface
          const hasAssignedComponents = posts.some(post => post.assigned_via_main_interface);
          if (hasAssignedComponents) {
            postTypesWithAssignments.push(postType.value);
          }
        }
      } catch (error) {
        // console.error(`CCC: Error checking assignments for post type ${postType.value}:`, error);
      }
    }
    
    // console.log('CCC: Post types with assigned components:', postTypesWithAssignments);
    
    return postTypesWithAssignments;
  };

  const fetchPostTypes = async () => {
    try {
      // console.log('CCC: Fetching available post types');
      // console.log('CCC: AJAX URL:', window.cccData.ajaxUrl);
      // console.log('CCC: Nonce:', window.cccData.nonce);
      
      const formData = new FormData();
      formData.append("action", "ccc_get_available_post_types");
      formData.append("nonce", window.cccData.nonce);
      
      // Log the FormData contents
      // console.log('CCC: FormData contents:');
      // for (let [key, value] of formData.entries()) {
      //   console.log('  ', key, ':', value);
      // }
      
      const response = await axios.post(window.cccData.ajaxUrl, formData);

      // console.log('CCC: fetchPostTypes response:', response.data);

      // Check if response is successful and contains data
      if (response.data.success && response.data.data && Array.isArray(response.data.data)) {
        // Filter out 'page' and 'attachment' (Media) post types
        const filteredPostTypes = response.data.data.filter(postType => 
          postType.value !== 'page' && postType.value !== 'attachment'
        );
        
        // console.log('CCC: Filtered post types:', filteredPostTypes);
        
        // Check which post types have components assigned
        const assignedPostTypes = await checkPostTypeAssignments(filteredPostTypes);
        
        setPostTypes(filteredPostTypes);
        setSelectedPostTypes(assignedPostTypes);
        setSelectAllPostTypes(assignedPostTypes.length > 0 && assignedPostTypes.length === filteredPostTypes.length);
      } else {
        // console.error('CCC: Invalid response format from getAvailablePostTypes');
        // console.error('CCC: Response data:', response.data);
      }
    } catch (error) {
      // console.error('CCC: Failed to fetch post types:', error);
      if (error.response) {
        // console.error('CCC: Error response status:', error.response.status);
        // console.error('CCC: Error response data:', error.response.data);
      }
    }
  };

  const fetchPosts = async (type) => {
    try {
      // Validate post type
      if (!type || typeof type !== 'string') {
        // console.error('CCC: Invalid post type:', type)
        setError("Invalid post type specified.")
        return
      }
      
      // console.log('CCC: Fetching posts for post type:', type)
      setPostsLoading(true)
      setError("") // Clear any previous errors
      
      const formData = new FormData()
      formData.append("action", "ccc_get_posts_with_components")
      formData.append("post_type", type)
      formData.append("nonce", window.cccData.nonce)
      let response
      try {
        response = await axios.post(window.cccData.ajaxUrl, formData)
      } catch (ajaxError) {
        // console.error('CCC: AJAX request failed:', ajaxError)
        // console.error('CCC: AJAX error response:', ajaxError.response)
        // console.error('CCC: AJAX error status:', ajaxError.response?.status)
        // console.error('CCC: AJAX error data:', ajaxError.response?.data)
        throw ajaxError
      }
      
      // Handle successful response
      if (response.data.success) {
        let posts = null
        
        // Check different possible locations for posts data
        if (Array.isArray(response.data.data?.posts)) {
          posts = response.data.data.posts
        } else if (Array.isArray(response.data.posts)) {
          posts = response.data.posts
        } else if (Array.isArray(response.data.data)) {
          posts = response.data.data
        }
        
        if (posts !== null) {
          setPosts(posts)
          
          // IMPORTANT: Show posts as selected if they were assigned via main interface, regardless of current component count
          // This ensures metabox changes don't affect main interface selection
          const initiallySelected = posts
            .filter((post) => post.assigned_via_main_interface)
            .map((post) => post.id)
          
          setSelectedPosts(initiallySelected)

          // Check if all posts are assigned via main interface (for "select all" functionality)
          const postsAssignedViaMain = posts.filter((post) => post.assigned_via_main_interface)
          
          if (postsAssignedViaMain.length > 0 && postsAssignedViaMain.length === posts.length) {
            // All posts are assigned via main interface
            if (type === "page") setSelectAllPages(true)
            if (type === "post") setSelectAllPosts(true)
          } else {
            // Not all posts are assigned via main interface
            if (type === "page") setSelectAllPages(false)
            if (type === "post") setSelectAllPosts(false)
          }
          
        } else {
          // No posts found in expected locations
          setPosts([])
          setSelectedPosts([])
          setSelectAllPages(false)
          setSelectAllPosts(false)
        }
      } else {
        // Response indicates failure
        setPosts([])
        setSelectedPosts([])
        setSelectAllPages(false)
        setSelectAllPosts(false)
        const errorMessage = response.data.message || "Failed to fetch posts."
        setError(errorMessage)
        // console.error("Failed to fetch posts - server returned failure:", response.data)
      }
    } catch (err) {
      let errorMessage = "Failed to fetch posts. Please try again."
      
      if (err.response) {
        // Server responded with error status
        if (err.response.data && err.response.data.message) {
          errorMessage = err.response.data.message
        } else if (err.response.status === 500) {
          errorMessage = "Server error occurred. Please check if the plugin is properly configured."
        } else if (err.response.status === 400) {
          errorMessage = "Invalid request. Please refresh the page and try again."
        }
      } else if (err.request) {
        // Request was made but no response received
        errorMessage = "No response from server. Please check your connection."
      }
      
      setError(errorMessage)
      // console.error("Failed to fetch posts", err)
    } finally {
      setPostsLoading(false)
    }
  }

  const handleSubmitNewComponent = async () => {
    if (!componentName) {
      toast.error("Please enter a component name")
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
        // Get the component ID
        let componentId = null;
        if (response.data.data && response.data.data.data && response.data.data.data.id) {
          // New nested structure: response.data.data.data.id
          componentId = response.data.data.data.id;
        } else if (response.data.data && response.data.data.id) {
          // Direct structure: response.data.data.id
          componentId = response.data.data.id;
        } else if (response.data.id) {
          componentId = response.data.id;
        } else if (response.data.component_id) {
          componentId = response.data.component_id;
        }
        

        // If this is a duplicate operation, copy the fields
        if (componentToDuplicate && componentId) {
          // Handle different field structures from the backend
          let fieldsToCopy = null;
          
          if (componentToDuplicate.fields && Array.isArray(componentToDuplicate.fields)) {
            // Direct array structure
            fieldsToCopy = componentToDuplicate.fields;
          } else if (componentToDuplicate.fields && componentToDuplicate.fields.fields && Array.isArray(componentToDuplicate.fields.fields)) {
            // Nested structure (fields.fields)
            fieldsToCopy = componentToDuplicate.fields.fields;
          }
          
          if (fieldsToCopy && fieldsToCopy.length > 0) {
            try {
              // Create each field individually using the createFieldCallback
              let successCount = 0;
              let errorCount = 0;
              
              for (const field of fieldsToCopy) {
                try {
                  const fieldFormData = new FormData();
                  fieldFormData.append("action", "ccc_add_field");
                  fieldFormData.append("component_id", componentId);
                  fieldFormData.append("label", field.label || '');
                  fieldFormData.append("name", field.name || '');
                  fieldFormData.append("type", field.type || 'text');
                  fieldFormData.append("required", field.required ? '1' : '0');
                  fieldFormData.append("placeholder", field.placeholder || '');
                  fieldFormData.append("nonce", window.cccData.nonce);

                  // Handle field configuration
                  if (field.config) {
                    const config = typeof field.config === 'string' ? JSON.parse(field.config) : field.config;
                    
                    // Handle repeater fields with nested fields
                    if (field.type === 'repeater' && config.nested_fields) {
                      fieldFormData.append("nested_field_definitions", JSON.stringify(config.nested_fields));
                      fieldFormData.append("max_sets", config.max_sets || 0);
                    } else {
                      fieldFormData.append("field_config", JSON.stringify(config));
                    }
                  }

                  const fieldResponse = await axios.post(window.cccData.ajaxUrl, fieldFormData);
                  
                  if (fieldResponse.data.success) {
                    successCount++;
                  } else {
                    // console.error("Failed to create field:", field.name, fieldResponse.data);
                    errorCount++;
                  }
                } catch (fieldError) {
                  // console.error("Error creating field:", field.name, fieldError);
                  errorCount++;
                }
              }
              
              if (successCount > 0) {
                toast.success(`Component duplicated successfully with ${successCount} fields!${errorCount > 0 ? ` (${errorCount} fields failed to copy)` : ''}`)
              } else {
                toast.error("Component created but failed to copy any fields. Please add fields manually.")
              }
            } catch (error) {
              // console.error("Error copying fields:", error);
              toast.error("Component created but failed to copy fields. Please add fields manually.")
            }
          } else {
            toast.success("Component duplicated successfully, but no fields were found to copy.")
          }
        } else {
          toast.success(response.data.message || "Component created successfully.")
        }

        fetchComponents()
        fetchPosts(postType)
        setShowNewComponentDialog(false)
        setComponentName("")
        setHandle("")
        setComponentToDuplicate(null) // Clear the duplicate reference
      } else {
        // Handle error response
        let errorMessage = "Failed to create component."
        
        // Try different possible error message locations
        if (response.data.message) {
          errorMessage = response.data.message
        } else if (response.data.data && response.data.data.message) {
          errorMessage = response.data.data.message
        } else if (response.data.error) {
          errorMessage = response.data.error
        } else if (typeof response.data === 'string') {
          errorMessage = response.data
        }
        
        toast.error(errorMessage)
        // console.error("Component creation failed:", response.data)
      }
    } catch (error) {
      // console.error("Error creating component:", error)
      
      // Handle different types of errors
      let errorMessage = "Error connecting to server. Please try again."
      
      if (error.response) {
        // Server responded with error status
        const serverError = error.response.data?.message || error.response.data?.data?.message
        if (serverError) {
          errorMessage = serverError
        } else if (error.response.status === 400) {
          errorMessage = "Invalid request. Please check your input."
        } else if (error.response.status === 500) {
          errorMessage = "Server error. Please try again later."
        }
      } else if (error.request) {
        // Request was made but no response received
        errorMessage = "No response from server. Please check your connection."
      }
      
              toast.error(errorMessage)
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
        toast.success("Component deleted successfully.")
        fetchComponents()
        fetchPosts(postType)
      } else {
        toast.error(response.data.message || "Failed to delete component.")
      }
    } catch (error) {
      // console.error("Error deleting component:", error)
      toast.error("Error connecting to server. Please try again.")
    }
  }

  const handleDuplicateComponent = async (component) => {
    try {
      // First, fetch the full component data with fields
      const formData = new FormData()
      formData.append("action", "ccc_get_component_fields")
      formData.append("component_id", component.id)
      formData.append("nonce", window.cccData.nonce)

      const response = await axios.post(window.cccData.ajaxUrl, formData)
      
      if (response.data.success && response.data.data) {
        // Use the component with full field data
        const componentWithFields = {
          ...component,
          fields: response.data.data
        }
        
        // Pre-fill the component name with "Duplicate" suffix
        const duplicateName = `${component.name} Duplicate`
        const duplicateHandle = generateHandle(duplicateName)
        
        setComponentName(duplicateName)
        setHandle(duplicateHandle)
        setComponentToDuplicate(componentWithFields)
        setShowNewComponentDialog(true)
      } else {
        // Fallback to original component if field fetch fails
        const duplicateName = `${component.name} Duplicate`
        const duplicateHandle = generateHandle(duplicateName)
        
        setComponentName(duplicateName)
        setHandle(duplicateHandle)
        setComponentToDuplicate(component)
        setShowNewComponentDialog(true)
        
        toast.error("Could not load component fields. Duplicating without fields.")
      }
    } catch (error) {
      // console.error("Error fetching component fields:", error)
      // Fallback to original component
      const duplicateName = `${component.name} Duplicate`
      const duplicateHandle = generateHandle(duplicateName)
      
      setComponentName(duplicateName)
      setHandle(duplicateHandle)
      setComponentToDuplicate(component)
      setShowNewComponentDialog(true)
      
      toast.error("Could not load component fields. Duplicating without fields.")
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
        toast.success("Field deleted successfully.")
        fetchComponents()
      } else {
        toast.error(response.data.message || "Failed to delete field.")
      }
    } catch (error) {
      // console.error("Error deleting field:", error)
      toast.error("Error connecting to server. Please try again.")
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
        toast.success("Component fields updated successfully.")
        return true
      } else {
        toast.error(response.data.message || "Failed to update component fields.")
        return false
      }
    } catch (error) {
      // console.error("Error updating component fields:", error)
      toast.error("Error connecting to server. Please try again.")
      return false
    }
  }

  const handleSaveAssignments = async () => {
    try {
      let assignments = {}
      
      if (postType === "page") {
        // Handle page assignments (existing logic)
        posts.forEach((post) => {
          const isSelected =
            selectAllPages ||
            selectedPosts.includes(post.id)
          if (isSelected) {
            assignments[post.id] = null; // Mark as assigned, but no components yet
          } else {
            assignments[post.id] = [];
          }
        })
      } else if (postType === "post") {
        // Handle post type assignments
        // Send ALL post types so backend can handle both assignments and unassignments
        postTypes.forEach((pt) => {
          if (selectedPostTypes.includes(pt.value)) {
            // Post type is selected - assign it
            assignments[`post_type:${pt.value}`] = null;
          } else {
            // Post type is not selected - unassign it
            assignments[`post_type:${pt.value}`] = [];
          }
        });
      }
      
      const formData = new FormData()
      formData.append("action", "ccc_save_component_assignments")
      formData.append("nonce", window.cccData.nonce)
      formData.append("assignments", JSON.stringify(assignments))
      formData.append("assignment_type", postType === "post" ? "post_types" : "individual_posts")
      
      const response = await axios.post(window.cccData.ajaxUrl, formData)
      if (response.data.success) {
        toast.success(response.data.message || "Assignments saved successfully.")
        
        // Update the assignedPostTypes state to reflect the actual backend assignments
        if (postType === "post") {
          setAssignedPostTypes(selectedPostTypes);
        }
        
        if (postType === "page") {
          fetchPosts(postType)
        }
        // Don't call fetchPostTypes() here as it resets the UI state
        // The user's selections should be preserved
      } else {
        toast.error(response.data.message || "Failed to save assignments.")
      }
    } catch (error) {
      // console.error("Error saving assignments:", error)
      toast.error("Error connecting to server. Please try again.")
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

  const handlePostTypeSelectionChange = (postTypeValue, isChecked) => {
    setSelectedPostTypes((prev) => {
      const newSelected = isChecked 
        ? [...prev, postTypeValue]
        : prev.filter((pt) => pt !== postTypeValue);
      
      // Don't automatically update selectAllPostTypes - let the user control it explicitly
      // Only update it when the user explicitly unchecks the last post type
      if (newSelected.length === 0) {
        setSelectAllPostTypes(false);
      }
      
      return newSelected;
    })
  }

  const handleSelectAllPostTypesChange = (isChecked) => {
    setSelectAllPostTypes(isChecked)
    if (isChecked) {
      setSelectedPostTypes(postTypes.map((pt) => pt.value))
    } else {
      setSelectedPostTypes([])
    }
  }

  useEffect(() => {
    fetchComponents()
    
    // Test the AJAX system
    const testAjax = async () => {
      try {
        const formData = new FormData()
        formData.append("action", "ccc_test")
        formData.append("nonce", window.cccData.nonce)
        const response = await axios.post(window.cccData.ajaxUrl, formData)
      } catch (err) {
        // console.error('CCC: Test AJAX failed:', err)
      }
    }
    
    testAjax()
  }, [])

  useEffect(() => {
    // Only fetch if postType has changed, avoid infinite loops
    fetchPosts(postType)
    setSelectAllPages(false)
    setSelectAllPosts(false)
    
    // If "post" is selected, fetch available post types
    if (postType === "post") {
      fetchPostTypes()
    } else {
      // Clear post type selections when switching to pages
      setSelectedPostTypes([])
      setSelectAllPostTypes(false)
      setAssignedPostTypes([])
    }
  }, []) // Remove postType dependency to prevent infinite loops

  // Separate useEffect to handle postType changes without infinite loops
  useEffect(() => {
    if (postType && postType !== lastFetchedPostTypeRef.current) {
      // console.log('CCC: PostType changed to:', postType, 'Previous:', lastFetchedPostTypeRef.current)
      lastFetchedPostTypeRef.current = postType
      
      // Use setTimeout to break any potential render loops
      setTimeout(() => {
        fetchPosts(postType)
        setSelectAllPages(false)
        setSelectAllPosts(false)
        
        // If "post" is selected, fetch available post types
        if (postType === "post") {
          fetchPostTypes()
        } else {
          // Remove post type selections when switching to pages
          setSelectedPostTypes([])
          setSelectAllPostTypes(false)
          setAssignedPostTypes([])
        }
      }, 0)
    }
  }, [postType]) // This useEffect specifically handles postType changes

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
    // Refresh the component list to show updated names
    fetchComponents()
  }

  // ChatGPT integration functions
  const handleChatGPTModalClose = () => {
    setShowChatGPTModal(false)
  }

  const handleChatGPTComponentCreated = () => {
    fetchComponents()
  }
  
  const openDesignModal = (component) => {
    setSelectedComponentForDesign(component)
    setShowDesignModal(true)
  }
  
  const closeDesignModal = () => {
    setShowDesignModal(false)
    setSelectedComponentForDesign(null)
  }

  // Helper function to clean field data for export (remove database IDs)
  const cleanFieldsForExport = (fields) => {
    if (!Array.isArray(fields)) return []
    
    return fields.map(field => {
      const cleanField = {
        label: field.label,
        name: field.name,
        type: field.type,
        required: field.required || false
      }
      
      // Add placeholder if it exists
      if (field.placeholder) {
        cleanField.placeholder = field.placeholder
      }
      
      // Handle field options for select, checkbox, and radio fields
      if (["select", "checkbox", "radio"].includes(field.type)) {
        if (field.fieldOptions && Array.isArray(field.fieldOptions)) {
          cleanField.fieldOptions = field.fieldOptions
        } else if (field.config && field.config.options) {
          // Convert options object to array format
          cleanField.fieldOptions = Object.entries(field.config.options).map(([value, label]) => ({
            value,
            label
          }))
        }
        
        // Add select multiple option if it exists
        if (field.type === "select" && field.config && field.config.multiple !== undefined) {
          cleanField.selectMultiple = field.config.multiple
        }
      }
      
      // Handle field configuration for different field types
      if (field.config) {
        cleanField.config = { ...field.config }
      }
      
      // Handle specific field type configurations
      if (field.type === "repeater") {
        if (field.maxSets) cleanField.maxSets = field.maxSets
        if (field.max_sets) cleanField.maxSets = field.max_sets
        if (field.children && Array.isArray(field.children)) {
          cleanField.children = cleanFieldsForExport(field.children)
        }
      }
      
      if (field.type === "image") {
        if (field.imageReturnType) cleanField.imageReturnType = field.imageReturnType
        if (field.config && field.config.return_type) cleanField.imageReturnType = field.config.return_type
      }
      
      if (field.type === "video") {
        if (field.videoReturnType) cleanField.videoReturnType = field.videoReturnType
        if (field.videoSources) cleanField.videoSources = field.videoSources
        if (field.videoPlayerOptions) cleanField.videoPlayerOptions = field.videoPlayerOptions
        if (field.config) {
          if (field.config.return_type) cleanField.videoReturnType = field.config.return_type
          if (field.config.sources) cleanField.videoSources = field.config.sources
          if (field.config.player_options) cleanField.videoPlayerOptions = field.config.player_options
        }
      }
      
      if (field.type === "wysiwyg") {
        if (field.wysiwygSettings) cleanField.wysiwygSettings = field.wysiwygSettings
        if (field.config && field.config.editor_settings) cleanField.wysiwygSettings = field.config.editor_settings
      }
      
      if (field.type === "number") {
        if (field.fieldConfig) cleanField.fieldConfig = field.fieldConfig
        if (field.config) cleanField.fieldConfig = field.config
      }
      
      if (field.type === "range") {
        if (field.fieldConfig) cleanField.fieldConfig = field.fieldConfig
        if (field.config) cleanField.fieldConfig = field.config
      }
      
      if (field.type === "toggle") {
        if (field.toggleConfig) cleanField.toggleConfig = field.toggleConfig
        if (field.config) cleanField.toggleConfig = field.config
      }
      
      if (field.type === "user") {
        if (field.userConfig) cleanField.userConfig = field.userConfig
        if (field.config) cleanField.userConfig = field.config
      }
      
      if (field.type === "relationship") {
        if (field.relationshipConfig) cleanField.relationshipConfig = field.relationshipConfig
        if (field.config) cleanField.relationshipConfig = field.config
      }
      
      if (field.type === "link") {
        if (field.linkConfig) cleanField.linkConfig = field.linkConfig
        if (field.config) cleanField.linkConfig = field.config
      }
      
      if (field.type === "file") {
        if (field.fieldConfig) cleanField.fieldConfig = field.fieldConfig
        if (field.config) cleanField.fieldConfig = field.config
      }
      
      return cleanField
    })
  }

  // Import/Export functions
  const handleExportComponent = (component) => {
    const exportData = {
      name: component.name,
      handle_name: component.handle_name,
      fields: cleanFieldsForExport(component.fields || []),
      export_date: new Date().toISOString(),
      version: "1.0"
    }
    return JSON.stringify(exportData, null, 2)
  }

  const handleExportComponentFields = (component) => {
    const exportData = {
      fields: cleanFieldsForExport(component.fields || []),
      export_date: new Date().toISOString(),
      version: "1.0"
    }
    return JSON.stringify(exportData, null, 2)
  }

  const handleExportComponentOrFields = (component, type) => {
    if (type === "fields") {
      return handleExportComponentFields(component)
    } else {
      return handleExportComponent(component)
    }
  }

  const handleExportAllComponents = () => {
    const exportData = {
      components: components.map(comp => ({
        name: comp.name,
        handle_name: comp.handle_name,
        fields: cleanFieldsForExport(comp.fields || []),
        export_date: new Date().toISOString(),
        version: "1.0"
      })),
      export_date: new Date().toISOString(),
      version: "1.0"
    }
    return JSON.stringify(exportData, null, 2)
  }

  

  const handleImportComponent = async () => {
    try {
      setImportError("")
      
      if (!importJson.trim()) {
        setImportError("Please paste the JSON data")
        return
      }

      let parsedData
      try {
        parsedData = JSON.parse(importJson)
      } catch (parseError) {
        setImportError("Invalid JSON format. Please check your data.")
        return
      }

      // Validate required fields
      if (!parsedData.name || !parsedData.handle_name || !Array.isArray(parsedData.fields)) {
        setImportError("Invalid component data. Missing required fields.")
        return
      }

      // Check if component with same handle already exists
      const existingComponent = components.find(comp => comp.handle_name === parsedData.handle_name)
      if (existingComponent) {
        setImportError(`A component with handle "${parsedData.handle_name}" already exists. Please use a different handle.`)
        return
      }

      // Create the component
      const formData = new FormData()
      formData.append("action", "ccc_create_component")
      formData.append("name", parsedData.name)
      formData.append("handle", parsedData.handle_name)
      formData.append("nonce", window.cccData.nonce)

      const response = await axios.post(window.cccData.ajaxUrl, formData)

      if (response.data.success) {
        // Try different possible locations for the component ID
        let newComponentId = null
        
        if (response.data.data && response.data.data.id) {
          newComponentId = response.data.data.id
        } else if (response.data.id) {
          newComponentId = response.data.id
        } else if (response.data.component_id) {
          newComponentId = response.data.component_id
        } else {
          // Fallback: try to get the component ID by querying for the component we just created
          try {
            const searchFormData = new FormData()
            searchFormData.append("action", "ccc_get_components")
            searchFormData.append("nonce", window.cccData.nonce)
            
            const searchResponse = await axios.post(window.cccData.ajaxUrl, searchFormData)
            if (searchResponse.data.success && searchResponse.data.data) {
              const foundComponent = searchResponse.data.data.find(comp => 
                comp.name === parsedData.name || comp.label === parsedData.name
              )
              if (foundComponent) {
                newComponentId = foundComponent.id
              }
            }
          } catch (searchError) {
            console.error(`Error searching for component "${parsedData.name}":`, searchError)
          }
          
          if (!newComponentId) {
            console.error(`Component created but no ID returned. Response:`, response.data)
            throw new Error("Component created but no ID returned from server")
          }
        }
        
        // If there are fields, create them
        if (parsedData.fields && parsedData.fields.length > 0) {
          for (const field of parsedData.fields) {
            const fieldFormData = new FormData()
            fieldFormData.append("action", "ccc_create_field")
            fieldFormData.append("component_id", newComponentId)
            fieldFormData.append("label", field.label)
            fieldFormData.append("name", field.name)
            fieldFormData.append("type", field.type)
            fieldFormData.append("required", field.required || false)
            fieldFormData.append("nonce", window.cccData.nonce)

            // Add placeholder if it exists
            if (field.placeholder) {
              fieldFormData.append("placeholder", field.placeholder)
            }

            // Handle field options for select, checkbox, and radio fields
            if (["select", "checkbox", "radio"].includes(field.type)) {
              let optionsObject = {}
              let hasOptions = false
              
              // Check for fieldOptions array format
              if (field.fieldOptions && Array.isArray(field.fieldOptions)) {
                field.fieldOptions.forEach((option) => {
                  if (option.label && option.value) {
                    optionsObject[option.value] = option.label
                    hasOptions = true
                  }
                })
              }
              // Check for config.options object format
              else if (field.config && field.config.options && typeof field.config.options === 'object') {
                optionsObject = field.config.options
                hasOptions = true
              }
              
              if (hasOptions) {
                const config = { 
                  options: optionsObject,
                  field_condition: 'always_show',
                  conditional_logic: [],
                  logic_operator: 'AND'
                }
                
                // Add select multiple option if it exists
                if (field.type === "select") {
                  if (field.selectMultiple !== undefined) {
                    config.multiple = field.selectMultiple
                  } else if (field.config && field.config.multiple !== undefined) {
                    config.multiple = field.config.multiple
                  }
                }
                
                fieldFormData.append("field_config", JSON.stringify(config))
              }
            }

            // Handle field configuration for other field types (but not select/checkbox/radio as they're handled above)
            if (field.config && !["select", "checkbox", "radio"].includes(field.type)) {
              fieldFormData.append("field_config", JSON.stringify(field.config))
            }

            // Handle specific field type configurations
            if (field.type === "repeater") {
              if (field.maxSets) {
                fieldFormData.append("max_sets", field.maxSets)
              }
              if (field.children && Array.isArray(field.children)) {
                // Try both field names - the backend might expect 'sub_fields' instead of 'children'
                fieldFormData.append("children", JSON.stringify(field.children))
                fieldFormData.append("sub_fields", JSON.stringify(field.children))
              }
            }

            await axios.post(window.cccData.ajaxUrl, fieldFormData)
          }
        }

        toast.success("Component imported successfully!")
        setShowImportModal(false)
        setImportJson("")
        fetchComponents()
        fetchPosts(postType)
      } else {
        setImportError(response.data.message || "Failed to create component")
      }
    } catch (error) {
      // console.error("Error importing component:", error)
      setImportError("Error connecting to server. Please try again.")
    }
  }

  const handleImportMultipleComponents = async () => {
    try {
      setImportError("")
      
      if (!importJson.trim()) {
        setImportError("Please paste the JSON data")
        return
      }

      let parsedData
      try {
        parsedData = JSON.parse(importJson)
      } catch (parseError) {
        setImportError("Invalid JSON format. Please check your data.")
        return
      }

      // Check if it's a single component or multiple components
      let componentsToImport = []
      if (parsedData.components && Array.isArray(parsedData.components)) {
        // Multiple components
        componentsToImport = parsedData.components
      } else if (parsedData.name && parsedData.handle_name) {
        // Single component
        componentsToImport = [parsedData]
      } else {
        setImportError("Invalid data format. Expected component(s) data.")
        return
      }

      let successCount = 0
      let errorCount = 0
      let fieldSuccessCount = 0
      let fieldErrorCount = 0

      for (const componentData of componentsToImport) {
        try {
          // Validate required fields
          if (!componentData.name || !componentData.handle_name || !Array.isArray(componentData.fields)) {
            // console.error("Invalid component data:", componentData)
            errorCount++
            continue
          }

          // Check if component with same handle already exists
          const existingComponent = components.find(comp => comp.handle_name === componentData.handle_name)
          if (existingComponent) {
            // console.warn(`Component with handle "${componentData.handle_name}" already exists, skipping`)
            errorCount++
            continue
          }

          // Create the component
          const formData = new FormData()
          formData.append("action", "ccc_create_component")
          formData.append("name", componentData.name)
          formData.append("handle", componentData.handle_name)
          formData.append("nonce", window.cccData.nonce)

          const response = await axios.post(window.cccData.ajaxUrl, formData)

          if (response.data.success) {
            // Try different possible locations for the component ID
            let newComponentId = null
            
            if (response.data.data && response.data.data.id) {
              newComponentId = response.data.data.id
            } else if (response.data.id) {
              newComponentId = response.data.id
            } else if (response.data.component_id) {
              newComponentId = response.data.component_id
            } else {
              // Fallback: try to get the component ID by querying for the component we just created
              try {
                const searchFormData = new FormData()
                searchFormData.append("action", "ccc_get_components")
                searchFormData.append("nonce", window.cccData.nonce)
                
                const searchResponse = await axios.post(window.cccData.ajaxUrl, searchFormData)
                if (searchResponse.data.success && searchResponse.data.data) {
                  const foundComponent = searchResponse.data.data.find(comp => 
                    comp.name === componentData.name || comp.label === componentData.name
                  )
                  if (foundComponent) {
                    newComponentId = foundComponent.id
                  }
                }
              } catch (searchError) {
                // console.error(`Error searching for component "${componentData.name}":`, searchError)
              }
              
              if (!newComponentId) {
                // console.error(`Component created but no ID returned. Response:`, response.data)
                throw new Error("Component created but no ID returned from server")
              }
            }
            
            // If there are fields, create them
            if (componentData.fields && componentData.fields.length > 0) {
              
              for (const field of componentData.fields) {
                try {
                  const fieldFormData = new FormData()
                  fieldFormData.append("action", "ccc_create_field")
                  fieldFormData.append("component_id", newComponentId)
                  fieldFormData.append("label", field.label)
                  fieldFormData.append("name", field.name)
                  fieldFormData.append("type", field.type)
                  fieldFormData.append("required", field.required || false)
                  fieldFormData.append("nonce", window.cccData.nonce)

                  // Add placeholder if it exists
                  if (field.placeholder) {
                    fieldFormData.append("placeholder", field.placeholder)
                  }

                  // Handle field options for select, checkbox, and radio fields
                  if (["select", "checkbox", "radio"].includes(field.type)) {
                    let optionsObject = {}
                    let hasOptions = false
                    
                    // Check for fieldOptions array format
                    if (field.fieldOptions && Array.isArray(field.fieldOptions)) {
                      field.fieldOptions.forEach((option) => {
                        if (option.label && option.value) {
                          optionsObject[option.value] = option.label
                          hasOptions = true
                        }
                      })
                    }
                    // Check for config.options object format
                    else if (field.config && field.config.options && typeof field.config.options === 'object') {
                      optionsObject = field.config.options
                      hasOptions = true
                    }
                    
                    if (hasOptions) {
                      const config = { 
                        options: optionsObject,
                        field_condition: 'always_show',
                        conditional_logic: [],
                        logic_operator: 'AND'
                      }
                      
                      // Add select multiple option if it exists
                      if (field.type === "select") {
                        if (field.selectMultiple !== undefined) {
                          config.multiple = field.selectMultiple
                        } else if (field.config && field.config.multiple !== undefined) {
                          config.multiple = field.config.multiple
                        }
                      }
                      
                      fieldFormData.append("field_config", JSON.stringify(config))
                    }
                  }

                  // Handle field configuration for other field types (but not select/checkbox/radio as they're handled above)
                  if (field.config && !["select", "checkbox", "radio"].includes(field.type)) {
                    fieldFormData.append("field_config", JSON.stringify(field.config))
                  }

                  // Handle specific field type configurations
                  if (field.type === "repeater") {
                    if (field.maxSets) {
                      fieldFormData.append("max_sets", field.maxSets)
                    }
                    if (field.children && Array.isArray(field.children)) {
                      // Try both field names - the backend might expect 'sub_fields' instead of 'children'
                      fieldFormData.append("children", JSON.stringify(field.children))
                      fieldFormData.append("sub_fields", JSON.stringify(field.children))
                    }
                  }

                  const fieldResponse = await axios.post(window.cccData.ajaxUrl, fieldFormData)
                  
                  if (fieldResponse.data.success) {
                    fieldSuccessCount++
                  } else {
                    fieldErrorCount++
                    // console.error(`Failed to create field "${field.name}":`, fieldResponse.data.message)
                  }
                } catch (fieldError) {
                  fieldErrorCount++
                  // console.error(`Error creating field "${field.name}":`, fieldError)
                }
              }
            }
            successCount++
          } else {
            errorCount++
            // console.error(`Failed to create component "${componentData.name}":`, response.data.message)
          }
        } catch (error) {
          // console.error("Error importing component:", componentData.name, error)
          errorCount++
        }
      }

      if (successCount > 0) {
        const message = `${successCount} component(s) imported successfully!`
        const fieldMessage = fieldSuccessCount > 0 ? ` ${fieldSuccessCount} fields created.` : ''
        const errorMessage = errorCount > 0 ? ` ${errorCount} components failed.` : ''
        const fieldErrorMessage = fieldErrorCount > 0 ? ` ${fieldErrorCount} fields failed.` : ''
        
        toast.success(message + fieldMessage + errorMessage + fieldErrorMessage)
        setShowImportMultipleModal(false)
        setImportJson("")
        fetchComponents()
        fetchPosts(postType)
      } else {
        setImportError(`Failed to import any components. ${errorCount} errors occurred.`)
      }
    } catch (error) {
      // console.error("Error importing components:", error)
      setImportError("Error connecting to server. Please try again.")
    }
  }

  const handleImportFieldsOnly = async () => {
    try {
      setImportError("")
      
      if (!importJson.trim()) {
        setImportError("Please paste the JSON data")
        return
      }

      if (!selectedComponentForImport) {
        setImportError("No component selected for field import")
        return
      }

      let parsedData
      try {
        parsedData = JSON.parse(importJson)
      } catch (parseError) {
        setImportError("Invalid JSON format. Please check your data.")
        return
      }

      // Validate fields data
      if (!Array.isArray(parsedData.fields)) {
        setImportError("Invalid data format. Expected fields array.")
        return
      }

      // Delete existing fields first
      if (selectedComponentForImport.fields && selectedComponentForImport.fields.length > 0) {
        for (const field of selectedComponentForImport.fields) {
          try {
            const deleteFormData = new FormData()
            deleteFormData.append("action", "ccc_delete_field")
            deleteFormData.append("field_id", field.id)
            deleteFormData.append("nonce", window.cccData.nonce)
            await axios.post(window.cccData.ajaxUrl, deleteFormData)
          } catch (error) {
            // console.error("Error deleting existing field:", field.id, error)
          }
        }
      }

      // Create new fields
      for (const field of parsedData.fields) {
        try {
          const fieldFormData = new FormData()
          fieldFormData.append("action", "ccc_create_field")
          fieldFormData.append("component_id", selectedComponentForImport.id)
          fieldFormData.append("label", field.label)
          fieldFormData.append("name", field.name)
          fieldFormData.append("type", field.type)
          fieldFormData.append("required", field.required || false)
          fieldFormData.append("nonce", window.cccData.nonce)

          // Add placeholder if it exists
          if (field.placeholder) {
            fieldFormData.append("placeholder", field.placeholder)
          }

          // Handle field options for select, checkbox, and radio fields
          if (["select", "checkbox", "radio"].includes(field.type)) {
            let optionsObject = {}
            let hasOptions = false
            
            // Check for fieldOptions array format
            if (field.fieldOptions && Array.isArray(field.fieldOptions)) {
              field.fieldOptions.forEach((option) => {
                if (option.label && option.value) {
                  optionsObject[option.value] = option.label
                  hasOptions = true
                }
              })
            }
            // Check for config.options object format
            else if (field.config && field.config.options && typeof field.config.options === 'object') {
              optionsObject = field.config.options
              hasOptions = true
            }
            
            if (hasOptions) {
              const config = { 
                options: optionsObject,
                field_condition: 'always_show',
                conditional_logic: [],
                logic_operator: 'AND'
              }
              
              // Add select multiple option if it exists
              if (field.type === "select") {
                if (field.selectMultiple !== undefined) {
                  config.multiple = field.selectMultiple
                } else if (field.config && field.config.multiple !== undefined) {
                  config.multiple = field.config.multiple
                }
              }
              
              fieldFormData.append("field_config", JSON.stringify(config))
            }
          }

          // Handle field configuration for other field types (but not select/checkbox/radio as they're handled above)
          if (field.config && !["select", "checkbox", "radio"].includes(field.type)) {
            fieldFormData.append("field_config", JSON.stringify(field.config))
          }

          // Handle specific field type configurations
          if (field.type === "repeater") {
            if (field.maxSets) {
              fieldFormData.append("max_sets", field.maxSets)
            }
            if (field.children && Array.isArray(field.children)) {
              fieldFormData.append("children", JSON.stringify(field.children))
            }
          }

          await axios.post(window.cccData.ajaxUrl, fieldFormData)
        } catch (error) {
          // console.error("Error creating field:", field.name, error)
        }
      }

      toast.success("Fields imported successfully!")
      setShowImportModal(false)
      setImportJson("")
      setSelectedComponentForImport(null)
      fetchComponents()
      fetchPosts(postType)
    } catch (error) {
      // console.error("Error importing fields:", error)
      setImportError("Error connecting to server. Please try again.")
    }
  }

  const copyToClipboard = (text) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text)
        .then(() => {
          toast.success("JSON copied to clipboard!")
        })
        .catch(() => {
          toast.error("Failed to copy to clipboard")
        })
    } else {
      // Fallback for older browsers
      const textArea = document.createElement("textarea")
      textArea.value = text
      document.body.appendChild(textArea)
      textArea.select()
      try {
        document.execCommand("copy")
        toast.success("JSON copied to clipboard!")
      } catch (err) {
        toast.error("Failed to copy to clipboard")
      } finally {
        document.body.removeChild(textArea)
      }
    }
  }

  // Remove all revision-related state, functions, and UI. Only keep component management, assignment, and field editing logic.

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
          toast.error("Failed to update field order. Please try again.")
        }
      } catch (error) {
        // Revert the change if the request failed
        setComponents(components)
        toast.error("Failed to update field order. Please try again.")
        // console.error("Error updating field order:", error)
      }
    }
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
            <div className="flex gap-3">
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
              
              <button
                onClick={() => setShowChatGPTModal(true)}
                className="text-white px-6 py-3 text-lg rounded-custom flex border border-green-600 bg-green-600 hover:bg-green-700 items-center gap-3 font-medium transition-colors"
              >
                <svg className="h-[30px] w-[30px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Use AI
              </button>

              {/* Only show export button if there are components */}
              {components.length > 0 && (
                <div className="relative export-all-dropdown-container">
                  <button
                    onClick={() => setShowExportAllDropdown(!showExportAllDropdown)}
                    className="text-white p-3 text-lg rounded-custom flex border border-purple-600 bg-purple-600 hover:bg-purple-700 items-center justify-center transition-colors"
                    title="Export All Components - Export complete components with their fields"
                  >
                    <Upload className="h-[30px] w-[30px]" />
                  </button>
                  
                  {showExportAllDropdown && (
                    <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                      <button
                        onClick={() => {
                          setShowExportAllModal(true)
                          setShowExportAllDropdown(false)
                        }}
                        className="block w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 border-b border-gray-100 font-medium"
                      >
                        <Download className="w-4 h-4 inline mr-2" />
                        Export All Components
                      </button>

                    </div>
                  )}
                </div>
              )}
              
              <button
                onClick={() => setShowImportMultipleModal(true)}
                className="text-white p-3 text-lg rounded-custom flex border border-blue-600 bg-blue-600 hover:bg-blue-700 items-center justify-center transition-colors"
                title="Import Components - Import single or multiple components"
              >
                <Download className="h-[30px] w-[30px]" />
              </button>
              

            </div>

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
                            onClick={() => handleCopy(comp.handle_name, null, comp.id)}
                          >
                            {comp.handle_name}
                          </code>
                          {copiedText && copiedText.text === comp.handle_name && copiedText.componentId === comp.id && (
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
                        title="Add Field"
                      />
                      {comp.fields && comp.fields.length > 0 && (
                        <>
                          <div
                            className="w-[25px] h-[25px] cursor-pointer text-emerald-600 hover:text-emerald-800 transition-colors duration-200"
                            title="View Field Structure"
                            onClick={() => {
                              setSelectedComponentForTree(comp)
                              setShowTreeModal(true)
                            }}
                          >
                            <GitBranch className="w-[25px] h-[25px]" />
                          </div>
                          <div
                            className="w-[25px] h-[25px] cursor-pointer text-orange-600 hover:text-orange-800 transition-colors duration-200"
                            title="Duplicate Component"
                            onClick={() => handleDuplicateComponent(comp)}
                          >
                            <Copy className="w-[25px] h-[25px]" />
                          </div>
                          <div
                            className="w-[25px] h-[25px] cursor-pointer text-purple-600 hover:text-purple-800 transition-colors duration-200"
                            title="Design with ChatGPT"
                            onClick={() => openDesignModal(comp)}
                          >
                            <Palette className="w-[25px] h-[25px]" />
                          </div>
                        </>
                      )}
                      <img
                        onClick={() => openEditComponentNameModal(comp)}
                        className="w-[25px] h-[25px] cursor-pointer"
                        src={editIcon || "/placeholder.svg"}
                        alt="edit Component"
                        title="Edit Component Name"
                      />
               
                                             <div
                         className="w-[25px] h-[25px] cursor-pointer text-blue-600 hover:text-blue-800 transition-colors duration-200 relative export-dropdown-container"
                         title="Export Component"
                       >
                         <Upload 
                           className="w-[25px] h-[25px]" 
                           onClick={() => {
                             setShowExportTypeDropdown(prev => ({
                               ...prev,
                               [comp.id]: !prev[comp.id]
                             }))
                           }}
                         />
                         {showExportTypeDropdown[comp.id] && (
                           <div className="absolute top-full right-0 mt-1 w-32 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                             <button
                               onClick={() => {
                                 setComponentToExport(comp)
                                 setExportType("component")
                                 setShowExportModal(true)
                                 setShowExportTypeDropdown(prev => ({
                                   ...prev,
                                   [comp.id]: false
                                 }))
                               }}
                               className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 border-b border-gray-100"
                             >
                               Export Component
                             </button>
                             <button
                               onClick={() => {
                                 setComponentToExport(comp)
                                 setExportType("fields")
                                 setShowExportModal(true)
                                 setShowExportTypeDropdown(prev => ({
                                   ...prev,
                                   [comp.id]: false
                                 }))
                               }}
                               className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                             >
                               Export Fields
                             </button>
                           </div>
                         )}
                       </div>
                       <div
                         className="w-[25px] h-[25px] cursor-pointer text-green-600 hover:text-green-800 transition-colors duration-200"
                         title="Import Fields Only"
                         onClick={() => {
                           setSelectedComponentForImport(comp)
                           setImportType("fields")
                           setShowImportModal(true)
                         }}
                       >
                         <Download className="w-[25px] h-[25px]" />
                       </div>
                       <img
                         onClick={() => handleDeleteComponent(comp.id)}
                         className="w-[25px] h-[25px] cursor-pointer"
                         src={deleteIcon || "/placeholder.svg"}
                         alt="Delete Component"
                         title="Delete Component"
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
                                onCopy={(text) => handleCopy(text, field.id, comp.id)}
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
                 Select {postType === "page" ? "Pages" : "Post Types"} to Assign All Components To
               </h4>
               {postType === "page" ? (
                 // Show individual pages
                 postsLoading ? (
                   <div className="bg-gray-50 rounded-xl p-8 text-center">
                     <div className="animate-spin rounded-full h-8 w-8 border-4 border-purple-200 mx-auto mb-3"></div>
                     <div className="animate-spin rounded-full h-8 w-8 border-t-4 border-purple-600 absolute top-0 left-0"></div>
                     <p className="text-gray-600">Loading pages...</p>
                   </div>
                 ) : (
                   <div className="bg-gray-50 rounded-xl p-4 space-y-3 max-h-64 overflow-y-auto">
                     <label className="flex items-center p-3 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-all duration-200">
                       <input
                         type="checkbox"
                         checked={selectAllPages}
                         onChange={(e) => handleSelectAllPagesChange(e.target.checked)}
                         className="mr-3 w-4 h-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                       />
                       <span className="font-semibold text-gray-800">All Pages</span>
                     </label>
                     {posts.length === 0 ? (
                       <div className="text-center py-8">
                         <div className="text-gray-400 mb-3">
                           <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                           </svg>
                         </div>
                         <p className="text-gray-500 mb-2">No pages found</p>
                         <p className="text-gray-400 text-sm">Create some pages first to assign components to them.</p>
                       </div>
                     ) : (
                       posts.map((post) => (
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
                             <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs font-medium">
                               Components Assigned
                             </span>
                           )}
                         </label>
                       ))
                     )}
                   </div>
                 )
               ) : (
                 // Show post types
                 postTypesLoading ? (
                   <div className="bg-gray-50 rounded-xl p-8 text-center">
                     <div className="animate-spin rounded-full h-8 w-8 border-4 border-purple-200 mx-auto mb-3"></div>
                     <div className="animate-spin rounded-full h-8 w-8 border-t-4 border-purple-600 absolute top-0 left-0"></div>
                     <p className="text-gray-600">Loading post types...</p>
                   </div>
                 ) : (
                   <div className="bg-gray-50 rounded-xl p-4 space-y-3 max-h-64 overflow-y-auto">
                     <label className="flex items-center p-3 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-all duration-200">
                       <input
                         type="checkbox"
                         checked={selectAllPostTypes}
                        onChange={(e) => {
                          handleSelectAllPostTypesChange(e.target.checked)
                        }}
                         className="mr-3 w-4 h-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                       />
                       <span className="font-semibold text-gray-800">All Post Types</span>
                     </label>
                     {postTypes.length === 0 ? (
                       <div className="text-center py-8">
                         <div className="text-gray-400 mb-3">
                           <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                           </svg>
                         </div>
                         <p className="text-gray-500 mb-2">No post types found</p>
                         <p className="text-gray-400 text-sm">No custom post types are available on this site.</p>
                       </div>
                     ) : (
                       <>
                         {postTypes.map((postTypeItem) => {
                           const isSelected = selectedPostTypes.includes(postTypeItem.value)
                           return (
                             <label
                               key={postTypeItem.value}
                               className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-all duration-200"
                             >
                               <div className="flex items-center">
                                 <input
                                   type="checkbox"
                                   checked={isSelected}
                                   onChange={(e) => {
                                     handlePostTypeSelectionChange(postTypeItem.value, e.target.checked)
                                   }}
                                   className="mr-3 w-4 h-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                                 />
                                                                <span className="font-semibold text-gray-800">
                                 {postTypeItem.label || postTypeItem.value || 'Unknown Post Type'}
                               </span>
                             </div>
                             <div className="flex items-center space-x-2">
                                                               {assignedPostTypes.includes(postTypeItem.value) && (
                                  <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs font-medium">
                                    Components Assigned
                                  </span>
                                )}
                               <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                                 Post Type
                               </span>
                             </div>
                             </label>
                           )
                         })}
                       </>
                     )}
                   </div>
                 )
               )}
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
           <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl transform transition-all duration-300">
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
             
             {/* Tabs */}
             <div className="flex border-b border-gray-200">
               <button
                 onClick={() => setComponentName("")}
                 className="flex-1 py-3 px-4 text-center text-gray-600 hover:text-gray-800 border-b-2 border-transparent hover:border-purple-300 transition-all duration-200"
               >
                 Create New
               </button>
               <button
                 onClick={() => {
                   setImportType("component")
                   setShowImportModal(true)
                   setShowNewComponentDialog(false)
                 }}
                 className="flex-1 py-3 px-4 text-center text-gray-600 hover:text-gray-800 border-b-2 border-transparent hover:border-purple-300 transition-all duration-200"
               >
                 Import Component
               </button>
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
                     // Always update the handle when the name changes
                     setHandle(generateHandle(value))
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
              // Update the field in the component
              const updateFieldInComponent = (fields, path, updatedField) => {
                const [index, ...rest] = path
                if (rest.length === 0) {
                  const newFields = [...fields]
                  newFields[index] = { ...newFields[index], ...updatedField }
                  return newFields
                } else {
                  const newFields = [...fields]
                  newFields[index] = {
                    ...newFields[index],
                    children: updateFieldInComponent(newFields[index].children || [], rest, updatedField)
                    }
                  return newFields
                }
              }

              const updatedFields = updateFieldInComponent(selectedComponentForTree.fields, path, updatedField)
              
              // Update the component in the list
              setComponents(prevComponents => 
                prevComponents.map(comp => 
                comp.id === selectedComponentForTree.id 
                  ? { ...comp, fields: updatedFields }
                  : comp
                )
              )
              
              // Send update to backend
              await handleUpdateComponentFields(selectedComponentForTree.id, updatedFields)
              
              toast.success('Field updated successfully!')
            } catch (error) {
              console.error('Error updating field:', error)
              toast.error('Failed to update field')
            }
          }}
          onFieldUpdateSuccess={async () => {
            // Refresh the component data to ensure we have the latest fields
            try {
              const response = await axios.post(window.cccData.ajaxUrl, new URLSearchParams({
                action: 'ccc_get_components',
                nonce: window.cccData.nonce
              }))
              
              if (response.data.success && Array.isArray(response.data.data)) {
                const updatedComponent = response.data.data.find(comp => comp.id === selectedComponentForTree.id)
                if (updatedComponent) {
                  setSelectedComponentForTree(updatedComponent)
                  setComponents(response.data.data)
                }
              }
            } catch (error) {
              console.error('Error refreshing component data:', error)
            }
          }}
          component={selectedComponentForTree}
        />
      )}

      {/* ChatGPT Modal */}
      <ChatGPTModal
        isOpen={showChatGPTModal}
        onClose={handleChatGPTModalClose}
        onComponentCreated={handleChatGPTComponentCreated}
      />


             {/* Design ChatGPT Modal */}
       <DesignChatGPTModal
         isOpen={showDesignModal}
         component={selectedComponentForDesign}
         onClose={closeDesignModal}
       />

       {/* Export Modal */}
       {showExportModal && componentToExport && (
         <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
           <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl transform transition-all duration-300">
             <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-6 rounded-t-2xl text-white">
               <div className="flex justify-between items-center">
                 <h3 className="text-xl font-bold">
                   Export {exportType === "fields" ? "Fields" : "Component"}: {componentToExport.name}
                 </h3>
                 <button
                   onClick={() => {
                     setShowExportModal(false)
                     setComponentToExport(null)
                     setExportType("component")
                   }}
                   className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/20 transition-all duration-200"
                 >
                   <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                   </svg>
                 </button>
               </div>
             </div>
             <div className="p-6">
               <div className="mb-4">
                 <p className="text-gray-600 mb-2">
                   Copy the JSON below to import {exportType === "fields" ? "these fields" : "this component"} on another site:
                 </p>
                 <button
                   onClick={() => copyToClipboard(handleExportComponentOrFields(componentToExport, exportType))}
                   className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center gap-2"
                 >
                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                   </svg>
                   Copy JSON
                 </button>
               </div>
               <div className="bg-gray-100 rounded-lg p-4 max-h-96 overflow-y-auto">
                 <pre className="text-sm text-gray-800 whitespace-pre-wrap">
                   {handleExportComponentOrFields(componentToExport, exportType)}
                 </pre>
               </div>
             </div>
           </div>
         </div>
       )}

       {/* Import Modal */}
       {showImportModal && (
         <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
           <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl transform transition-all duration-300">
             <div className="bg-gradient-to-r from-green-500 to-blue-500 p-6 rounded-t-2xl text-white">
               <div className="flex justify-between items-center">
                 <h3 className="text-xl font-bold">
                   {importType === "fields" ? "Import Fields" : "Import Component"}
                   {selectedComponentForImport && ` to ${selectedComponentForImport.name}`}
                 </h3>
                 <button
                   onClick={() => {
                     setShowImportModal(false)
                     setImportJson("")
                     setImportError("")
                     setSelectedComponentForImport(null)
                     setImportType("component")
                   }}
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
                 <label htmlFor="importJson" className="block text-sm font-medium text-gray-700 mb-2">
                   Paste {importType === "fields" ? "Fields" : "Component"} JSON
                 </label>
                 <textarea
                   id="importJson"
                   value={importJson}
                   onChange={(e) => setImportJson(e.target.value)}
                   placeholder={`Paste the exported ${importType === "fields" ? "fields" : "component"} JSON here...`}
                   className="w-full h-64 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 font-mono text-sm"
                 />
                 {importError && (
                   <p className="text-red-600 text-sm mt-2">{importError}</p>
                 )}
               </div>
               <div className="flex justify-end gap-3">
                 <button
                   type="button"
                   onClick={() => {
                     setShowImportModal(false)
                     setImportJson("")
                     setImportError("")
                     setSelectedComponentForImport(null)
                     setImportType("component")
                   }}
                   className="px-6 py-3 text-gray-600 border border-gray-200 rounded-xl transition-all duration-200 font-medium"
                 >
                   Cancel
                 </button>
                 <button
                   onClick={importType === "fields" ? handleImportFieldsOnly : handleImportComponent}
                   className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white px-6 py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl font-medium"
                 >
                   {importType === "fields" ? "Import Fields" : "Import Component"}
                 </button>
               </div>
             </div>
           </div>
         </div>
       )}

       {/* Export All Components Modal */}
       {showExportAllModal && (
         <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
           <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl transform transition-all duration-300">
             <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-6 rounded-t-2xl text-white">
               <div className="flex justify-between items-center">
                 <h3 className="text-xl font-bold">Export All Components</h3>
                 <button
                   onClick={() => setShowExportAllModal(false)}
                   className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/20 transition-all duration-200"
                 >
                   <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                   </svg>
                 </button>
               </div>
             </div>
             <div className="p-6">
               <div className="mb-4">
                 <p className="text-gray-600 mb-2">
                   Copy the JSON below to import all components on another site:
                 </p>
                 <button
                   onClick={() => copyToClipboard(handleExportAllComponents())}
                   className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center gap-2"
                 >
                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                   </svg>
                   Copy JSON
                 </button>
               </div>
               <div className="bg-gray-100 rounded-lg p-4 max-h-96 overflow-y-auto">
                 <pre className="text-sm text-gray-800 whitespace-pre-wrap">
                   {handleExportAllComponents()}
                 </pre>
               </div>
             </div>
           </div>
         </div>
       )}

       


       {/* Import Multiple Components Modal */}
       {showImportMultipleModal && (
         <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
           <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl transform transition-all duration-300">
             <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-6 rounded-t-2xl text-white">
               <div className="flex justify-between items-center">
                 <h3 className="text-xl font-bold">Import Multiple Components</h3>
                 <button
                   onClick={() => {
                     setShowImportMultipleModal(false)
                     setImportJson("")
                     setImportError("")
                   }}
                   className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/20 transition-all duration-200"
                 >
                   <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                   </svg>
                 </button>
               </div>
             </div>
             <div className="p-6 space-y-6">
               <div>
                 <label htmlFor="importMultipleJson" className="block text-sm font-medium text-gray-700 mb-2">
                   Paste Multiple Component JSON
                 </label>
                 <textarea
                   id="importMultipleJson"
                   value={importJson}
                   onChange={(e) => setImportJson(e.target.value)}
                   placeholder="Paste multiple component JSON data here..."
                   className="w-full h-64 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 font-mono text-sm"
                 />
                 {importError && (
                   <p className="text-red-600 text-sm mt-2">{importError}</p>
                 )}
               </div>
               <div className="flex justify-end gap-3">
                 <button
                   type="button"
                   onClick={() => {
                     setShowImportMultipleModal(false)
                     setImportJson("")
                     setImportError("")
                   }}
                   className="px-6 py-3 text-gray-600 border border-gray-200 rounded-xl transition-all duration-200 font-medium"
                 >
                   Cancel
                 </button>
                 <button
                   onClick={handleImportMultipleComponents}
                   className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white px-6 py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl font-medium"
                 >
                   Import Components
                 </button>
               </div>
             </div>
           </div>
         </div>
       )}
     </div>
   )
 }

export default ComponentList
