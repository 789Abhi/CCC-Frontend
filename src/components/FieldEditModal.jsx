"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { Plus, X, GripVertical, Edit, Eye } from "lucide-react"
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
import FieldTreeModal from "./FieldTreeModal"

function FieldEditModal({ isOpen, component, field, onClose, onSave, preventDatabaseSave = false }) {
  // Add debugging
  console.log("FieldEditModal rendered with:", { isOpen, field, component })

  const [label, setLabel] = useState("")
  const [name, setName] = useState("")
  const [type, setType] = useState("text")
  const [isRequired, setIsRequired] = useState(false)
  const [placeholder, setPlaceholder] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [maxSets, setMaxSets] = useState("")
  const [nestedFieldDefinitions, setNestedFieldDefinitions] = useState([])
  const [editingNestedFieldIndex, setEditingNestedFieldIndex] = useState(null)
  const [currentNestedField, setCurrentNestedField] = useState(null)
  const [fieldOptions, setFieldOptions] = useState([])
  const [wysiwygSettings, setWysiwygSettings] = useState({
    media_buttons: true,
    teeny: false,
    textarea_rows: 10,
  })

  // FieldPopup state for nested fields
  const [showFieldPopup, setShowFieldPopup] = useState(false)
  const [copiedText, setCopiedText] = useState(null)
  
  // Tree structure modal state
  const [showTreeModal, setShowTreeModal] = useState(false)

  // Add state for image return type
  const [imageReturnType, setImageReturnType] = useState('url');
  const [selectMultiple, setSelectMultiple] = useState(false);
  const [videoReturnType, setVideoReturnType] = useState('url');
  const [videoSources, setVideoSources] = useState(['file', 'youtube', 'vimeo', 'url']);
  const [videoPlayerOptions, setVideoPlayerOptions] = useState({
    controls: true,
    autoplay: false,
    muted: false,
    loop: false,
    download: true
  });

  // Relationship field configuration state
  const [relationshipConfig, setRelationshipConfig] = useState({
    filter_post_types: [],
    filter_post_status: [],
    filter_taxonomy: '',
    filters: ['search', 'post_type'],
    max_posts: 0,
    return_format: 'object'
  });

  // Link field configuration state
  const [linkConfig, setLinkConfig] = useState({
    link_types: ['internal', 'external'],
    default_type: 'internal',
    post_types: ['post', 'page'],
    show_target: true,
    show_title: true
  });

  // Number field configuration state
  const [fieldConfig, setFieldConfig] = useState({
    unique: false,
    min_value: null,
    max_value: null,
    min_length: null,
    max_length: null,
    prepend: '',
    append: ''
  });

  // User field configuration state
  const [userConfig, setUserConfig] = useState({
    role_filter: [],
    multiple: false,
    return_type: 'id',
    searchable: true,
    orderby: 'display_name',
    order: 'ASC'
  });

  // Toggle field configuration state
  const [toggleConfig, setToggleConfig] = useState({
    default_value: false,
    field_condition: 'always_show', // 'always_show', 'show_when', 'hide_when'
    conditional_logic: [],
    logic_operator: 'AND'
  });

  // Available post types and taxonomies for relationship field
  const [availablePostTypes, setAvailablePostTypes] = useState([]);
  const [availableTaxonomies, setAvailableTaxonomies] = useState([]);

  const isEditing = !!field

  const availableFieldTypes = [
    "text",
    "textarea",
    "image",
    "video",
    "oembed",
    "relationship",
        "link",
        "email",
        "number",
        "range",
        "file",
        "repeater",
        "wysiwyg",
        "color",
    "select",
    "checkbox",
    "radio",
    "toggle",
    "user",
  ]

  useEffect(() => {
    console.log("FieldEditModal useEffect triggered:", { field, isOpen })

    if (field) {
      console.log("Loading field data:", field)
      setLabel(field.label || "")
      setName(field.name || "")
      setType(field.type || "text")
      setIsRequired(field.required || false)
      setPlaceholder(field.placeholder || "")

      // Handle field configuration based on type
      if (field.config) {
        try {
          const config = typeof field.config === "string" ? JSON.parse(field.config) : field.config
          console.log("Field config:", config)

          if (field.type === "repeater") {
            setMaxSets(config.max_sets || "")
            // Prefer DB children if available, fallback to config.nested_fields
            const nestedFields = (Array.isArray(field.children) && field.children.length > 0)
              ? field.children
              : (config.nested_fields || [])
            console.log("Loading nested field definitions:", nestedFields)
            setNestedFieldDefinitions(nestedFields)
          } else if (["select", "checkbox", "radio"].includes(field.type)) {
            const options = config.options || {}
            setFieldOptions(Object.entries(options).map(([value, label]) => ({ value, label })))
          } else if (field.type === "wysiwyg") {
            setWysiwygSettings({
              media_buttons: config.editor_settings?.media_buttons ?? true,
              teeny: config.editor_settings?.teeny ?? false,
              textarea_rows: config.editor_settings?.textarea_rows ?? 10,
            })
          } else if (field.type === 'image' && field.config) {
            try {
              const config = typeof field.config === 'string' ? JSON.parse(field.config) : field.config;
              setImageReturnType(config.return_type || 'url');
            } catch (e) {
              setImageReturnType('url');
            }
          } else if (field.type === 'video' && field.config) {
            try {
              const config = typeof field.config === 'string' ? JSON.parse(field.config) : field.config;
              setVideoReturnType(config.return_type || 'url');
              setVideoSources(config.sources || ['file', 'youtube', 'vimeo', 'url']);
              setVideoPlayerOptions(config.player_options || {
                controls: true,
                autoplay: false,
                muted: false,
                loop: false,
                download: true
              });
            } catch (e) {
              setVideoReturnType('url');
              setVideoSources(['file', 'youtube', 'vimeo', 'url']);
              setVideoPlayerOptions({
                controls: true,
                autoplay: false,
                muted: false,
                loop: false,
                download: true
              });
            }
          } else if (field.type === 'link' && field.config) {
            try {
              const config = typeof field.config === 'string' ? JSON.parse(field.config) : field.config;
              setLinkConfig({
                link_types: config.link_types || ['internal', 'external'],
                default_type: config.default_type || 'internal',
                post_types: config.post_types || ['post', 'page'],
                show_target: config.show_target !== undefined ? config.show_target : true,
                show_title: config.show_title !== undefined ? config.show_title : true
              });
            } catch (e) {
              console.error("Error parsing link config:", e);
              setLinkConfig({
                link_types: ['internal', 'external'],
                default_type: 'internal',
                post_types: ['post', 'page'],
                show_target: true,
                show_title: true
              });
            }
          } else if (field.type === 'number' && field.config) {
            try {
              const config = typeof field.config === 'string' ? JSON.parse(field.config) : field.config;
              setFieldConfig({
                number_type: config.number_type || 'normal',
                unique: config.unique || false,
                min_value: config.min_value !== undefined && config.min_value !== null ? config.min_value : null,
                max_value: config.max_value !== undefined && config.max_value !== null ? config.max_value : null,
                min_length: config.min_length || null,
                max_length: config.max_length || null,
                prepend: config.prepend || '',
                append: config.append || ''
              });
            } catch (e) {
              console.error("Error parsing number config:", e);
              setFieldConfig({
                number_type: 'normal',
                unique: false,
                min_value: null,
                max_value: null,
                min_length: null,
                max_length: null,
                prepend: '',
                append: ''
              });
            }
                     } else if (field.type === 'range' && field.config) {
             try {
               const config = typeof field.config === 'string' ? JSON.parse(field.config) : field.config;
               setFieldConfig({
                 min_value: config.min_value !== undefined && config.min_value !== null ? config.min_value : null,
                 max_value: config.max_value !== undefined && config.max_value !== null ? config.max_value : null,
                 prepend: config.prepend || '',
                 append: config.append || ''
               });
             } catch (e) {
               console.error("Error parsing range config:", e);
               setFieldConfig({
                 min_value: null,
                 max_value: null,
                 prepend: '',
                 append: ''
               });
             }
          } else if (field.type === 'toggle' && field.config) {
            try {
              const config = typeof field.config === 'string' ? JSON.parse(field.config) : field.config;
              setToggleConfig({
                default_value: config.default_value !== undefined ? config.default_value : false,
                field_condition: config.field_condition || 'always_show',
                conditional_logic: config.conditional_logic || [],
                logic_operator: config.logic_operator || 'AND'
              });
            } catch (e) {
              console.error("Error parsing toggle config:", e);
              setToggleConfig({
                default_value: false,
                field_condition: 'always_show',
                conditional_logic: [],
                logic_operator: 'AND'
              });
            }
          } else if (field.type === 'file' && field.config) {
            try {
              const config = typeof field.config === 'string' ? JSON.parse(field.config) : field.config;
              setFieldConfig({
                allowed_types: config.allowed_types || ['image', 'video', 'document', 'audio', 'archive'],
                max_file_size: config.max_file_size || 25,
                return_type: config.return_type || 'url',
                show_preview: config.show_preview !== undefined ? config.show_preview : true,
                show_download: config.show_download !== undefined ? config.show_download : true,
                show_delete: config.show_delete !== undefined ? config.show_delete : true
              });
            } catch (e) {
              console.error("Error parsing file config:", e);
              setFieldConfig({
                allowed_types: ['image', 'video', 'document', 'audio', 'archive'],
                max_file_size: 25,
                return_type: 'url',
                show_preview: true,
                show_download: true,
                show_delete: true
              });
            }
          } else if (field.type === 'user' && field.config) {
            try {
              const config = typeof field.config === 'string' ? JSON.parse(field.config) : field.config;
              setUserConfig({
                role_filter: config.role_filter || [],
                multiple: config.multiple || false,
                return_type: config.return_type || 'id',
                searchable: config.searchable !== undefined ? config.searchable : true,
                orderby: config.orderby || 'display_name',
                order: config.order || 'ASC'
              });
            } catch (e) {
              console.error("Error parsing user config:", e);
              setUserConfig({
                role_filter: [],
                multiple: false,
                return_type: 'id',
                searchable: true,
                orderby: 'display_name',
                order: 'ASC'
              });
            }
          }
          
          if (field.type === 'select' && field.config) {
            const config = typeof field.config === 'string' ? JSON.parse(field.config) : field.config;
            setSelectMultiple(!!config.multiple);
          } else if (field.type === 'relationship' && field.config) {
            try {
              const config = typeof field.config === 'string' ? JSON.parse(field.config) : field.config;
              setRelationshipConfig({
                filter_post_types: config.filter_post_types || [],
                filter_post_status: config.filter_post_status || [],
                filter_taxonomy: config.filter_taxonomy || '',
                filters: config.filters || ['search', 'post_type'],
                max_posts: config.max_posts || 0,
                return_format: config.return_format || 'object'
              });
            } catch (e) {
              console.error("Error parsing relationship config:", e);
              setRelationshipConfig({
                filter_post_types: [],
                filter_post_status: [],
                filter_taxonomy: '',
                filters: ['search', 'post_type'],
                max_posts: 0,
                return_format: 'object'
              });
            }
          }
        } catch (e) {
          console.error("Error parsing field config:", e)
        }
      } else {
        console.log("No field config found")
        if (field.type === "repeater") {
          setNestedFieldDefinitions([])
        }
      }
          } else {
        // Reset form for new field
        setLabel("")
        setName("")
        setType("text")
        setIsRequired(false)
        setPlaceholder("")
        setMaxSets("")
        setNestedFieldDefinitions([])
        setFieldOptions([])
        setWysiwygSettings({
          media_buttons: true,
          teeny: false,
          textarea_rows: 10,
        })
        setImageReturnType('url');
        setSelectMultiple(false);
        setVideoReturnType('url');
        setVideoSources(['file', 'youtube', 'vimeo', 'url']);
        setVideoPlayerOptions({
          controls: true,
          autoplay: false,
          muted: false,
          loop: false,
          download: true,
          fullscreen: true,
          pictureInPicture: true
        });
        setRelationshipConfig({
          filter_post_types: [],
          filter_post_status: [],
          filter_taxonomy: '',
          filters: ['search', 'post_type'],
          max_posts: 0,
          return_format: 'object'
        });
        // Don't set fieldConfig here - let the type-specific useEffect handle it
        setLinkConfig({
          link_types: ['internal', 'external'],
          default_type: 'internal',
          post_types: ['post', 'page'],
          show_target: true,
          show_title: true
        });
        setUserConfig({
          role_filter: [],
          multiple: false,
          return_type: 'id',
          searchable: true,
          orderby: 'display_name',
          order: 'ASC'
        });
      }

    setError("")
    setEditingNestedFieldIndex(null)
    setShowFieldPopup(false)
    setCurrentNestedField(null)
  }, [field, isOpen])

  // Reset field configuration when type changes
  useEffect(() => {
    // Only set defaults for new fields, not when editing existing ones
    if (!field && type === 'range') {
      setFieldConfig({
        min_value: null,
        max_value: null,
        prepend: '',
        append: ''
      });
    } else if (!field && type === 'number') {
      setFieldConfig({
        number_type: 'normal',
        unique: false,
        min_value: null,
        max_value: null,
        min_length: null,
        max_length: null,
        prepend: '',
        append: ''
      });
    } else if (!field && type === 'file') {
      setFieldConfig({
        allowed_types: ['image', 'video', 'document', 'audio', 'archive'],
        max_file_size: 25,
        return_type: 'url',
        multiple: false,
        show_preview: true,
        show_download: true,
        show_delete: true
      });
    }
  }, [type, field]);

  // Fetch available post types and taxonomies for relationship field
  useEffect(() => {
    if (isOpen && type === 'relationship') {
      fetchAvailablePostTypes();
      fetchAvailableTaxonomies();
    }
  }, [isOpen, type]);

  const fetchAvailablePostTypes = async () => {
    try {
      console.log('FieldEditModal: Fetching available post types');
      const response = await fetch(window.cccData.ajaxUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          action: 'ccc_get_available_post_types',
          nonce: window.cccData.nonce
        })
      });
      
      const data = await response.json();
      console.log('FieldEditModal: Post types data received:', data);
      
      // Handle nested data structure
      let postTypesArray = null;
      if (data.success && data.data) {
        if (Array.isArray(data.data)) {
          postTypesArray = data.data;
          console.log('FieldEditModal: Found direct array in data.data');
        } else if (data.data.data && Array.isArray(data.data.data)) {
          postTypesArray = data.data.data;
          console.log('FieldEditModal: Found nested array in data.data.data');
        } else {
          console.log('FieldEditModal: No valid array found in data structure');
        }
      }

      if (postTypesArray && Array.isArray(postTypesArray)) {
        // Filter out 'attachment' post type (Media)
        const filteredPostTypes = postTypesArray.filter(postType => postType.value !== 'attachment');
        console.log('FieldEditModal: Setting available post types:', filteredPostTypes);
        setAvailablePostTypes(filteredPostTypes);
      } else {
        console.warn('Invalid post types data received:', data);
        setAvailablePostTypes([]);
      }
    } catch (error) {
      console.error('Error fetching available post types:', error);
      setAvailablePostTypes([]);
    }
  };

  const fetchAvailableTaxonomies = async () => {
    try {
      console.log('FieldEditModal: Fetching available taxonomies');
      const response = await fetch(window.cccData.ajaxUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          action: 'ccc_get_available_taxonomies',
          nonce: window.cccData.nonce
        })
      });
      
      const data = await response.json();
      console.log('FieldEditModal: Taxonomies data received:', data);
      
      // Handle nested data structure
      let taxonomiesArray = null;
      if (data.success && data.data) {
        if (Array.isArray(data.data)) {
          taxonomiesArray = data.data;
        } else if (data.data.data && Array.isArray(data.data.data)) {
          taxonomiesArray = data.data.data;
        }
      }

      if (taxonomiesArray && Array.isArray(taxonomiesArray)) {
        console.log('FieldEditModal: Setting available taxonomies:', taxonomiesArray);
        setAvailableTaxonomies(taxonomiesArray);
      } else {
        console.warn('Invalid taxonomies data received:', data);
        setAvailableTaxonomies([]);
      }
    } catch (error) {
      console.error('Error fetching available taxonomies:', error);
      setAvailableTaxonomies([]);
    }
  };

  const generateHandle = (inputLabel) => {
    return inputLabel
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/[^\w_]+/g, "")
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
          }
        })
    } else {
      console.warn("Clipboard API not supported, using fallback")
      const success = copyFallback(text)
      if (success) {
        setCopiedText(text)
        setTimeout(() => setCopiedText(null), 2000)
      }
    }
  }

  const handleAddNestedField = (newField) => {
    console.log("FieldEditModal: Adding new nested field:", newField)
    setNestedFieldDefinitions((prev) => [...prev, newField])
    setShowFieldPopup(false)
    setCurrentNestedField(null)
  }

  const handleUpdateNestedField = (updatedField) => {
    console.log("FieldEditModal: Updating nested field at index:", editingNestedFieldIndex, "with data:", updatedField)
    setNestedFieldDefinitions((prev) => prev.map((f, i) => (i === editingNestedFieldIndex ? updatedField : f)))
    setEditingNestedFieldIndex(null)
    setShowFieldPopup(false)
    setCurrentNestedField(null)
  }

  const handleTreeFieldUpdate = (path, updatedField) => {
    console.log("FieldEditModal: Updating field from tree at path:", path, "with data:", updatedField)
    
    // Update the field at the specified path in nestedFieldDefinitions
    const updateFieldAtPath = (fields, path, updatedField) => {
      const [currentIndex, ...remainingPath] = path
      
      if (remainingPath.length === 0) {
        // Update at current level
        return fields.map((f, i) => (i === currentIndex ? updatedField : f))
      } else {
        // Navigate deeper
        return fields.map((f, i) => {
          if (i === currentIndex && f.type === "repeater" && f.config?.nested_fields) {
            return {
              ...f,
              config: {
                ...f.config,
                nested_fields: updateFieldAtPath(f.config.nested_fields, remainingPath, updatedField)
              }
            }
          }
          return f
        })
      }
    }
    
    setNestedFieldDefinitions(prev => updateFieldAtPath(prev, path, updatedField))
  }

  const handleDeleteNestedField = (indexToDelete) => {
    if (window.confirm("Are you sure you want to delete this field?")) {
      setNestedFieldDefinitions((prev) => prev.filter((_, i) => i !== indexToDelete))
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

  const onDragEnd = (event) => {
    const { active, over } = event

    if (active.id !== over.id) {
      const oldIndex = nestedFieldDefinitions.findIndex(field => field.name + field.label === active.id)
      const newIndex = nestedFieldDefinitions.findIndex(field => field.name + field.label === over.id)
      
      const reorderedFields = arrayMove(nestedFieldDefinitions, oldIndex, newIndex)
      setNestedFieldDefinitions(reorderedFields)
    }
  }

  // Sortable Nested Field Component with external field design
  const SortableNestedField = ({ field, index, onEdit, onDelete, isSubmitting }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: field.name + field.label })

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
                    onClick={() => handleCopy(field.name)}
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
              {field.type === "repeater" && (field.config?.nested_fields || field.nestedFieldDefinitions || field.nested_fields || []).length > 0 && (
                <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs font-medium">
                  {(field.config?.nested_fields || field.nestedFieldDefinitions || field.nested_fields || []).length} nested field
                  {(field.config?.nested_fields || field.nestedFieldDefinitions || field.nested_fields || []).length !== 1 ? "s" : ""}
                </span>
              )}
            </div>
            <button
              onClick={onEdit}
              className="p-1 rounded-md text-blue-600 hover:bg-blue-50 transition-colors"
              disabled={isSubmitting}
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={onDelete}
              className="p-1 rounded-md text-red-600 hover:bg-red-50 transition-colors"
              disabled={isSubmitting}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  const handleAddOption = () => {
    setFieldOptions((prev) => [...prev, { label: "", value: "" }])
  }

  const handleUpdateOption = (index, field, value) => {
    setFieldOptions((prev) => prev.map((option, i) => (i === index ? { ...option, [field]: value } : option)))
  }

  const handleDeleteOption = (index) => {
    setFieldOptions((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!label.trim()) {
      setError("Field label is required")
      return
    }

    if (type === "repeater" && nestedFieldDefinitions.length === 0) {
      setError("Repeater fields must have at least one field defined.")
      return
    }

    if (["select", "checkbox", "radio"].includes(type) && fieldOptions.length === 0) {
      setError("Please add at least one option for this field type.")
      return
    }

    // Validate that all options have both label and value
    if (["select", "checkbox", "radio"].includes(type)) {
      const invalidOptions = fieldOptions.filter((option) => !option.label.trim() || !option.value.trim())
      if (invalidOptions.length > 0) {
        setError("All options must have both label and value.")
        return
      }
    }

    setIsSubmitting(true)
    setError("")

    try {
      // If preventDatabaseSave is true, just call onSave with the field data
      if (preventDatabaseSave) {
        const fieldData = {
          id: field?.id,
          label: label.trim(),
          name: name || generateHandle(label),
          type: type,
          required: isRequired,
          placeholder: placeholder.trim(),
          config: {}
        }

        // Build config based on field type
        if (type === "repeater") {
          fieldData.config = {
            max_sets: maxSets ? Number.parseInt(maxSets) : 0,
            nested_fields: nestedFieldDefinitions
          }
        } else if (type === "image") {
          fieldData.config = {
            return_type: imageReturnType || "url"
          }
        } else if (type === "video") {
          fieldData.config = {
            return_type: videoReturnType || "url",
            sources: videoSources,
            player_options: videoPlayerOptions
          }
        } else if (type === "wysiwyg") {
          fieldData.config = {
            editor_settings: wysiwygSettings
          }
        } else if (["select", "checkbox", "radio"].includes(type)) {
          const optionsObject = {}
          fieldOptions.forEach((option) => {
            if (option.label.trim() && option.value.trim()) {
              optionsObject[option.value.trim()] = option.label.trim()
            }
          })
          fieldData.config = { options: optionsObject }
          if (type === "select") {
            fieldData.config.multiple = !!selectMultiple
          }
        } else if (type === "relationship") {
          fieldData.config = relationshipConfig
        } else if (type === "number") {
          fieldData.config = {
            number_type: fieldConfig?.number_type || 'normal',
            unique: fieldConfig?.unique || false,
            min_value: fieldConfig?.min_value || null,
            max_value: fieldConfig?.max_value || null,
            min_length: fieldConfig?.min_length || null,
            max_length: fieldConfig?.max_length || null,
            prepend: fieldConfig?.prepend || '',
            append: fieldConfig?.append || ''
          }
          console.log("Number field config for preventDatabaseSave:", fieldData.config);
        } else if (type === "range") {
          fieldData.config = {
            min_value: fieldConfig?.min_value !== undefined && fieldConfig?.min_value !== null ? fieldConfig.min_value : null,
            max_value: fieldConfig?.max_value !== undefined && fieldConfig?.max_value !== null ? fieldConfig.max_value : null,
            prepend: fieldConfig?.prepend || '',
            append: fieldConfig?.append || ''
          }
          console.log("Range field config for preventDatabaseSave:", fieldData.config);
        } else if (type === "toggle") {
          fieldData.config = {
            default_value: toggleConfig?.default_value || false,
            field_condition: toggleConfig?.field_condition || 'always_show',
            conditional_logic: toggleConfig?.conditional_logic || [],
            logic_operator: toggleConfig?.logic_operator || 'AND'
          }
          console.log("Toggle field config for preventDatabaseSave:", fieldData.config);
        } else if (type === "file") {
          fieldData.config = {
            allowed_types: fieldConfig?.allowed_types || ['image', 'video', 'document', 'audio', 'archive'],
            max_file_size: fieldConfig?.max_file_size !== undefined && fieldConfig?.max_file_size !== null ? fieldConfig.max_file_size : null,
            return_type: fieldConfig?.return_type || 'url',
            show_preview: fieldConfig?.show_preview !== undefined ? fieldConfig?.show_preview : true,
            show_download: fieldConfig?.show_download !== undefined ? fieldConfig?.show_download : true,
            show_delete: fieldConfig?.show_delete !== undefined ? fieldConfig?.show_delete : true
          }
          console.log("File field config for preventDatabaseSave:", fieldData.config);
        } else if (type === "user") {
          fieldData.config = {
            role_filter: userConfig.role_filter || [],
            multiple: userConfig.multiple || false,
            return_type: userConfig.return_type || 'id',
            searchable: userConfig.searchable !== undefined ? userConfig.searchable : true,
            orderby: userConfig.orderby || 'display_name',
            order: userConfig.order || 'ASC'
          }
          console.log("User field config for preventDatabaseSave:", fieldData.config);
        }

        onSave(fieldData)
        return
      }

      // Normal database save flow
      const formData = new FormData()
      formData.append("action", isEditing ? "ccc_update_field" : "ccc_add_field")
      formData.append("nonce", window.cccData.nonce)
      formData.append("label", label.trim())
      formData.append("name", name || generateHandle(label))
      formData.append("type", type)
      formData.append("component_id", component.id)
      formData.append("required", isRequired ? "1" : "0")
      formData.append("placeholder", placeholder.trim())

      if (isEditing) {
        formData.append("field_id", field.id)
      }

      // Handle different field type configurations
      if (type === "repeater") {
        formData.append("max_sets", maxSets ? Number.parseInt(maxSets) : 0)
        
        // Process nested field definitions recursively for unlimited nesting levels
        const processNestedFieldsRecursively = (fields) => {
          return fields.map(field => {
            const processedField = {
              label: field.label,
              name: field.name,
              type: field.type
            }
            
            // Handle different field types
            if (field.type === 'repeater') {
              // For repeater fields, always use config.nested_fields structure
              // This ensures consistency across all nesting levels
              processedField.config = {
                max_sets: field.config?.max_sets || field.maxSets || 0,
                nested_fields: field.config?.nested_fields || field.nestedFieldDefinitions || []
              }
              
              // Recursively process nested fields if they exist
              if (processedField.config.nested_fields && processedField.config.nested_fields.length > 0) {
                processedField.config.nested_fields = processNestedFieldsRecursively(processedField.config.nested_fields)
              }
              
              console.log('FieldEditModal: Processed nested repeater field', field.label, processedField.config)
            } else if (field.type === 'image') {
              processedField.config = {
                return_type: field.config?.return_type || field.imageReturnType || 'url'
              }
            } else if (['select', 'checkbox', 'radio'].includes(field.type)) {
              // Handle options for select/checkbox/radio fields
              let optionsObject = {}
              if (field.config?.options) {
                optionsObject = field.config.options
              } else if (field.fieldOptions) {
                field.fieldOptions.forEach((option) => {
                  if (option.label && option.value) {
                    optionsObject[option.value] = option.label
                  }
                })
              }
              processedField.config = {
                options: optionsObject
              }
            } else if (field.type === 'user') {
              processedField.config = {
                role_filter: field.config?.role_filter || [],
                multiple: field.config?.multiple || false,
                return_type: field.config?.return_type || 'id',
                searchable: field.config?.searchable !== undefined ? field.config?.searchable : true,
                orderby: field.config?.orderby || 'display_name',
                order: field.config?.order || 'ASC'
              }
            }
            
            return processedField
          })
        }
        
        const processedNestedFields = processNestedFieldsRecursively(nestedFieldDefinitions)
        
        console.log('FieldEditModal: Sending nested field definitions', processedNestedFields)
        formData.append("nested_field_definitions", JSON.stringify(processedNestedFields))
      } else if (type === "image") {
        const config = {
          return_type: imageReturnType || "url",
        }
        formData.append("field_config", JSON.stringify(config))
      } else if (type === "video") {
        const config = {
          return_type: videoReturnType || "url",
          sources: videoSources,
          player_options: videoPlayerOptions
        }
        formData.append("field_config", JSON.stringify(config))
      } else if (type === "wysiwyg") {
        const config = {
          editor_settings: wysiwygSettings,
        }
        formData.append("field_config", JSON.stringify(config))
      } else if (["select", "checkbox", "radio"].includes(type)) {
        // Convert options array to object format expected by backend
        const optionsObject = {}
        fieldOptions.forEach((option) => {
          if (option.label.trim() && option.value.trim()) {
            optionsObject[option.value.trim()] = option.label.trim()
          }
        })
        const config = { options: optionsObject }
        if (type === "select") {
          config.multiple = !!selectMultiple;
        }
        formData.append("field_config", JSON.stringify(config))
      } else if (type === "relationship") {
        formData.append("field_config", JSON.stringify(relationshipConfig))
      } else if (type === "number") {
        const config = {
          number_type: fieldConfig?.number_type || 'normal',
          unique: fieldConfig?.unique || false,
          min_value: fieldConfig?.min_value || null,
          max_value: fieldConfig?.max_value || null,
          min_length: fieldConfig?.min_length || null,
          max_length: fieldConfig?.max_length || null,
          prepend: fieldConfig?.prepend || '',
          append: fieldConfig?.append || ''
        }
        console.log("Number field config being sent:", config);
        formData.append("field_config", JSON.stringify(config))
      } else if (type === "range") {
        const config = {
          min_value: fieldConfig?.min_value !== undefined && fieldConfig?.min_value !== null ? fieldConfig.min_value : null,
          max_value: fieldConfig?.max_value !== undefined && fieldConfig?.max_value !== null ? fieldConfig.max_value : null,
          prepend: fieldConfig?.prepend || '',
          append: fieldConfig?.append || ''
        }
        console.log("Range field config being sent:", config);
        formData.append("field_config", JSON.stringify(config))
      } else if (type === "toggle") {
        const config = {
          default_value: toggleConfig?.default_value || false,
          field_condition: toggleConfig?.field_condition || 'always_show',
          conditional_logic: toggleConfig?.conditional_logic || [],
          logic_operator: toggleConfig?.logic_operator || 'AND'
        }
        console.log("Toggle field config being sent:", config);
        formData.append("field_config", JSON.stringify(config))
      } else if (type === "file") {
        const config = {
          allowed_types: fieldConfig?.allowed_types || ['image', 'video', 'document', 'audio', 'archive'],
          max_file_size: fieldConfig?.max_file_size !== undefined && fieldConfig?.max_file_size !== null ? fieldConfig.max_file_size : null,
          return_type: fieldConfig?.return_type || 'url',
          show_preview: fieldConfig?.show_preview !== undefined ? fieldConfig?.show_preview : true,
          show_download: fieldConfig?.show_download !== undefined ? fieldConfig?.show_download : true,
          show_delete: fieldConfig?.show_delete !== undefined ? fieldConfig?.show_delete : true
        }
        console.log("File field config being sent:", config);
        formData.append("field_config", JSON.stringify(config))
      } else if (type === "user") {
        const config = {
          role_filter: userConfig.role_filter || [],
          multiple: userConfig.multiple || false,
          return_type: userConfig.return_type || 'id',
          searchable: userConfig.searchable !== undefined ? userConfig.searchable : true,
          orderby: userConfig.orderby || 'display_name',
          order: userConfig.order || 'ASC'
        }
        console.log("User field config being sent:", config);
        formData.append("field_config", JSON.stringify(config))
      }

      console.log("Submitting form data:", Object.fromEntries(formData))

      const response = await axios.post(window.cccData.ajaxUrl, formData)

      console.log("Server response:", response.data)

      if (response.data.success) {
        onSave()
      } else {
        setError(response.data.message || `Failed to ${isEditing ? "update" : "create"} field`)
      }
    } catch (error) {
      console.error("Error saving field:", error)
      setError("Failed to connect to server. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-gray-200">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-gray-50 rounded-t-xl">
          <h3 className="text-xl font-semibold text-gray-800">{isEditing ? "Edit Field" : "Add New Field"}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {error && (
            <div className="mb-4 px-4 py-2 rounded-lg bg-red-50 text-red-800 border border-red-200 flex items-center gap-2">
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Field Label */}
            <div className="space-y-2">
              <label htmlFor="label" className="block text-sm font-medium text-gray-700">
                Field Label <span className="text-red-500">*</span>
              </label>
              <input
                id="label"
                type="text"
                value={label}
                onChange={(e) => {
                  const value = e.target.value;
                  setLabel(value);
                  if (!isEditing && (!name || name === generateHandle(label))) {
                    setName(generateHandle(value));
                  }
                }}
                placeholder="Enter field label"
                disabled={isSubmitting}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-pink-400 transition-colors shadow-sm"
              />
            </div>

            {/* Field Name with copy-to-clipboard */}
            <div className="space-y-2">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Field Name
              </label>
              <div className="flex items-center gap-2">
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="field_name"
                disabled={isSubmitting || isEditing}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-pink-400 transition-colors bg-gray-50 text-gray-600 shadow-sm"
              />
              </div>
              <p className="text-xs text-gray-500">
                {isEditing
                  ? "Field name cannot be changed after creation"
                  : "Used in templates. Auto-generated from label if left empty."}
              </p>
            </div>

            {/* Field Type with badge */}
            <div className="space-y-2">
              <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                Field Type
              </label>
              <select
                id="type"
                value={type}
                onChange={(e) => setType(e.target.value)}
                disabled={isSubmitting}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-pink-400 transition-colors shadow-sm"
              >
                {availableFieldTypes.map(fieldType => {
                                      const labels = {
                        text: "Text",
                        textarea: "Textarea",
                        image: "Image",
                        video: "Video",
                        oembed: "O-Embed",
                        relationship: "Relationship",
                        link: "Link",
                        email: "Email",
                        repeater: "Repeater",
                        wysiwyg: "WYSIWYG Editor",
                        color: "Color",
                        select: "Select",
                        checkbox: "Checkbox",
                        radio: "Radio"
                    };
                  return (
                    <option key={fieldType} value={fieldType}>
                      {labels[fieldType] || fieldType}
                    </option>
                  );
                })}
              </select>
            </div>


            {/* Required Checkbox */}
            <div className="flex items-center gap-2">
                    <input
                id="required"
                      type="checkbox"
                checked={isRequired}
                onChange={e => setIsRequired(e.target.checked)}
                      disabled={isSubmitting}
                className="h-4 w-4 text-pink-600 border-gray-300 rounded focus:ring-pink-400"
                    />
              <label htmlFor="required" className="text-sm font-medium text-gray-700">
                Required
                    </label>
                  </div>

            {/* Placeholder */}
            {type !== 'repeater' && type !== 'wysiwyg' && (
              <div className="space-y-2">
                <label htmlFor="placeholder" className="block text-sm font-medium text-gray-700">
                  Placeholder
                </label>
                    <input
                  id="placeholder"
                  type="text"
                  value={placeholder}
                  onChange={e => setPlaceholder(e.target.value)}
                  placeholder="Enter placeholder text"
                      disabled={isSubmitting}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-pink-400 transition-colors shadow-sm"
                    />
                  </div>
            )}

            {/* Options for select/checkbox/radio with chips and drag handles */}
            {['select', 'checkbox', 'radio'].includes(type) && (
                  <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Options
                    </label>
                {/* Multiple select checkbox for select fields */}
                {type === 'select' && (
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      id="select-multiple"
                      type="checkbox"
                      checked={selectMultiple}
                      onChange={e => setSelectMultiple(e.target.checked)}
                      disabled={isSubmitting}
                      className="h-4 w-4 text-pink-600 border-gray-300 rounded focus:ring-pink-400"
                    />
                    <label htmlFor="select-multiple" className="text-sm text-gray-700">
                      Choose Multiple
                    </label>
              </div>
            )}
                <div className="flex flex-col gap-2">
                  {fieldOptions.map((option, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1">
                      <span className="cursor-grab"><GripVertical className="w-4 h-4 text-gray-400" /></span>
                        <input
                          type="text"
                          value={option.label}
                        onChange={e => handleUpdateOption(idx, 'label', e.target.value)}
                        placeholder="Label"
                        className="w-32 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-pink-400 focus:border-pink-400 text-sm"
                          disabled={isSubmitting}
                        />
                        <input
                          type="text"
                          value={option.value}
                        onChange={e => handleUpdateOption(idx, 'value', e.target.value)}
                        placeholder="Value"
                        className="w-32 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-pink-400 focus:border-pink-400 text-sm"
                          disabled={isSubmitting}
                        />
                        <button
                          type="button"
                        onClick={() => handleDeleteOption(idx)}
                        className="text-red-500 hover:text-red-700 px-2 py-1 rounded transition-colors"
                          disabled={isSubmitting}
                        >
                        Remove
                        </button>
                      </div>
                    ))}
                <button
                  type="button"
                  onClick={handleAddOption}
                    className="mt-2 px-4 py-2 bg-pink-500 text-white rounded hover:bg-pink-600 focus:outline-none focus:ring-2 focus:ring-pink-400 text-base font-semibold shadow disabled:opacity-50"
                  disabled={isSubmitting}
                >
                  Add Option
                </button>
                </div>
              </div>
            )}

            {/* Max Sets for Repeater */}
            {type === 'repeater' && (
                <div className="space-y-2">
                <label htmlFor="maxSets" className="block text-sm font-medium text-gray-700">
                  Max Sets
                  </label>
                  <input
                  id="maxSets"
                  type="number"
                  value={maxSets}
                  onChange={e => setMaxSets(e.target.value)}
                  placeholder="Enter max sets (0 for unlimited)"
                    disabled={isSubmitting}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-pink-400 transition-colors shadow-sm"
                  />
                </div>
            )}

            {/* Repeater Settings */}
            {type === "repeater" && (
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 space-y-4">
                <h4 className="text-sm font-medium text-gray-700">Repeater Settings</h4>

                <div className="space-y-2">
                  <label htmlFor="maxSets" className="block text-sm font-medium text-gray-700">
                    Max Items
                  </label>
                  <input
                    id="maxSets"
                    type="number"
                    value={maxSets}
                    onChange={(e) => setMaxSets(e.target.value)}
                    placeholder="Unlimited"
                    min="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    disabled={isSubmitting}
                  />
                  <p className="text-xs text-gray-500">Limit the number of items that can be added to this repeater.</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <input
                        type="checkbox"
                        checked={fieldConfig?.unique || false}
                        onChange={(e) => setFieldConfig(prev => ({ ...prev, unique: e.target.checked }))}
                        className="mr-2"
                      />
                      Unique Value
                    </label>
                    <p className="text-xs text-gray-500">Ensures each number is unique across all posts</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Minimum Value
                    </label>
                    <input
                      type="number"
                      value={fieldConfig?.min_value || ''}
                      onChange={(e) => {
                        const currentConfig = fieldConfig || {};
                        setFieldConfig({
                          ...currentConfig,
                          min_value: e.target.value === '' ? null : parseFloat(e.target.value)
                        });
                      }}
                      placeholder="No minimum"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500">Sets the lowest allowed number</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Maximum Value
                    </label>
                    <input
                      type="number"
                      value={fieldConfig?.max_value !== undefined && fieldConfig?.max_value !== null ? fieldConfig.max_value : ''}
                      onChange={(e) => {
                        const currentConfig = fieldConfig || {};
                        setFieldConfig({
                          ...currentConfig,
                          max_value: e.target.value === '' ? null : parseFloat(e.target.value)
                        });
                      }}
                      placeholder="100"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500">
                      Sets the highest allowed value for the range slider (leave empty for no maximum, default is 100)
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Prepend Text
                    </label>
                    <input
                      type="text"
                      value={fieldConfig?.prepend || ''}
                      onChange={(e) => setFieldConfig(prev => ({ ...prev, prepend: e.target.value }))}
                      placeholder="e.g., $"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500">Adds visual text before the input</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Append Text
                    </label>
                    <input
                      type="text"
                      value={fieldConfig?.append || ''}
                      onChange={(e) => setFieldConfig(prev => ({ ...prev, append: e.target.value }))}
                      placeholder="e.g., %"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-500">Adds visual text after the input</p>
                  </div>
                </div>
              </div>
            )}

            {/* Video Field Settings */}
            {type === "video" && (
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 space-y-4">
                <h4 className="text-sm font-medium text-gray-700">Video Field Settings</h4>

                {/* Return Type */}
                <div className="space-y-2">
                  <label htmlFor="videoReturnType" className="block text-sm font-medium text-gray-700">
                    Return Type
                  </label>
                  <select
                    id="videoReturnType"
                    value={videoReturnType}
                    onChange={(e) => setVideoReturnType(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    disabled={isSubmitting}
                  >
                    <option value="url">URL only</option>
                    <option value="array">Full Video Data</option>
                  </select>
                  <p className="text-xs text-gray-500">
                    {videoReturnType === 'url' 
                      ? 'Returns just the video URL as a string' 
                      : 'Returns complete video data including URL, type, and metadata'
                    }
                  </p>
                </div>

                {/* Allowed Video Sources */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Allowed Video Source
                  </label>
                  <div className="flex flex-col gap-2">
                    {[
                      { value: 'file', label: 'File Upload' },
                      { value: 'url', label: 'Video URL (YouTube, Vimeo, etc.)' }
                    ].map((source) => (
                      <label key={source.value} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="video-source"
                          value={source.value}
                          checked={videoSources[0] === source.value}
                          onChange={() => setVideoSources([source.value])}
                          className="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                          disabled={isSubmitting}
                        />
                        <span className="text-sm text-gray-700">{source.label}</span>
                      </label>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500">
                    Only one source can be selected. If none is selected, File Upload will be used by default.
                  </p>
                </div>

                {/* Ensure default to file if nothing is selected */}
                {videoSources.length === 0 && setVideoSources(['file'])}

                {/* Video Player Options */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Video Player Options
                  </label>
                  <div className="space-y-2">
                    {[
                      { key: 'controls', label: 'Show Controls', description: 'Display video player controls' },
                      { key: 'autoplay', label: 'Autoplay', description: 'Start video automatically (requires muted)' },
                      { key: 'muted', label: 'Muted', description: 'Start video muted (auto-enabled with autoplay)' },
                      { key: 'loop', label: 'Loop', description: 'Repeat video continuously' },
                      { key: 'download', label: 'Download Button', description: 'Show download option' }
                    ].map((option) => (
                      <div key={option.key} className="flex items-center gap-2">
                        <input
                          id={`video-option-${option.key}`}
                          type="checkbox"
                          checked={videoPlayerOptions[option.key]}
                          onChange={(e) => {
                            const newValue = e.target.checked;
                            let updatedOptions = {
                              ...videoPlayerOptions,
                              [option.key]: newValue
                            };
                            
                            // Auto-enable muted when autoplay is enabled
                            if (option.key === 'autoplay' && newValue) {
                              updatedOptions.muted = true;
                            }
                            
                            setVideoPlayerOptions(updatedOptions);
                          }}
                          className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                          disabled={isSubmitting}
                        />
                        <label htmlFor={`video-option-${option.key}`} className="text-sm text-gray-700">
                          {option.label}
                        </label>
                        <span className="text-xs text-gray-500">({option.description})</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <p className="text-xs text-blue-800">
                      <strong>Note:</strong> Autoplay requires muted to work in modern browsers. When you enable autoplay, muted will be automatically enabled.
                    </p>
                  </div>
                  <p className="text-xs text-gray-500">
                    Configure video player behavior and available features
                  </p>
                </div>
              </div>
            )}

            {/* Relationship Field Settings */}
            {type === "relationship" && (
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 space-y-4">
                <h4 className="text-sm font-medium text-gray-700">Relationship Field Settings</h4>

                {/* Filter Post Types */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Filter by Post Type
                  </label>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <p className="text-xs text-gray-600 mb-3">
                      Select which post types to include. Leave all unchecked to include all post types.
                    </p>
                    <div className="flex flex-col gap-2 max-h-40 overflow-y-auto">
                      {Array.isArray(availablePostTypes) && availablePostTypes.length > 0 ? (
                        availablePostTypes.map((postType) => (
                          <label key={postType.value} className="flex items-center gap-2 p-2 bg-white rounded border border-gray-200 hover:border-blue-300 transition-colors">
                            <input
                              type="checkbox"
                              checked={Array.isArray(relationshipConfig.filter_post_types) && relationshipConfig.filter_post_types.includes(postType.value)}
                              onChange={(e) => {
                                const currentTypes = Array.isArray(relationshipConfig.filter_post_types) ? relationshipConfig.filter_post_types : [];
                                const newTypes = e.target.checked
                                  ? [...currentTypes, postType.value]
                                  : currentTypes.filter(type => type !== postType.value);
                                setRelationshipConfig({
                      ...relationshipConfig,
                                  filter_post_types: newTypes
                                });
                              }}
                              className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    disabled={isSubmitting}
                            />
                            <span className="text-sm text-gray-700">{postType.label}</span>
                            <span className="text-xs text-gray-500">({postType.value})</span>
                          </label>
                        ))
                      ) : (
                        <div className="text-sm text-gray-500 italic">Loading post types...</div>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">
                    Select specific post types to filter by. If none are selected, all post types will be included.
                  </p>
                </div>

                {/* Filter Post Status */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Filter by Post Status
                  </label>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <p className="text-xs text-gray-600 mb-3">
                      Select which post statuses to include. Leave all unchecked to include all statuses.
                    </p>
                    <div className="flex flex-col gap-2">
                      {[
                        { value: 'publish', label: 'Published' },
                        { value: 'draft', label: 'Draft' },
                        { value: 'pending', label: 'Pending' },
                        { value: 'private', label: 'Private' }
                      ].map((status) => (
                        <label key={status.value} className="flex items-center gap-2 p-2 bg-white rounded border border-gray-200 hover:border-blue-300 transition-colors">
                          <input
                            type="checkbox"
                            checked={Array.isArray(relationshipConfig.filter_post_status) && relationshipConfig.filter_post_status.includes(status.value)}
                            onChange={(e) => {
                              const currentStatuses = Array.isArray(relationshipConfig.filter_post_status) ? relationshipConfig.filter_post_status : [];
                              const newStatuses = e.target.checked
                                ? [...currentStatuses, status.value]
                                : currentStatuses.filter(s => s !== status.value);
                              setRelationshipConfig({
                      ...relationshipConfig,
                                filter_post_status: newStatuses
                              });
                            }}
                            className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    disabled={isSubmitting}
                          />
                          <span className="text-sm text-gray-700">{status.label}</span>
                          <span className="text-xs text-gray-500">({status.value})</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">
                    Select specific post statuses to filter by. If none are selected, all statuses will be included.
                  </p>
                </div>

                {/* Filter Taxonomy */}
                <div className="space-y-2">
                  <label htmlFor="filterTaxonomy" className="block text-sm font-medium text-gray-700">
                    Filter by Taxonomy
                  </label>
                  <select
                    id="filterTaxonomy"
                    value={relationshipConfig.filter_taxonomy}
                    onChange={(e) => setRelationshipConfig({
                      ...relationshipConfig,
                      filter_taxonomy: e.target.value
                    })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    disabled={isSubmitting}
                  >
                    <option value="">No taxonomy filter</option>
                    {Array.isArray(availableTaxonomies) && availableTaxonomies.map((taxonomy) => (
                      <option key={taxonomy.value} value={taxonomy.value}>
                        {taxonomy.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500">
                    Select a taxonomy to filter posts by. Users will be able to select terms from this taxonomy.
                  </p>
                </div>

                {/* Available Filters */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Available Filters (Metabox Display Options)
                  </label>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-xs text-blue-700 mb-3">
                      <strong>Important:</strong> Select which filter options you want to display on the metabox when users are selecting posts. 
                      These controls will appear above the post selection area.
                    </p>
                    <div className="flex flex-col gap-3">
                      {[
                        { key: 'search', label: 'Search Filter', description: 'Allow users to search for posts by title or content' },
                        { key: 'post_type', label: 'Post Type Filter', description: 'Show dropdown to filter by post type (Post, Page, etc.)' },
                        { key: 'taxonomy', label: 'Taxonomy Filter', description: 'Show dropdown to filter by taxonomy terms' }
                    ].map((filter) => (
                        <label key={filter.key} className="flex items-start gap-3 p-2 bg-white rounded border border-gray-200 hover:border-blue-300 transition-colors">
                        <input
                          type="checkbox"
                          checked={Array.isArray(relationshipConfig.filters) && relationshipConfig.filters.includes(filter.key)}
                          onChange={(e) => {
                            const currentFilters = Array.isArray(relationshipConfig.filters) ? relationshipConfig.filters : [];
                            const newFilters = e.target.checked
                              ? [...currentFilters, filter.key]
                              : currentFilters.filter(f => f !== filter.key);
                            setRelationshipConfig({
                              ...relationshipConfig,
                              filters: newFilters
                            });
                          }}
                            className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 mt-0.5"
                          disabled={isSubmitting}
                        />
                          <div className="flex-1">
                            <span className="text-sm font-medium text-gray-700">{filter.label}</span>
                            <p className="text-xs text-gray-500 mt-1">{filter.description}</p>
                          </div>
                      </label>
                    ))}
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">
                    <strong>Note:</strong> At least one filter should be selected to provide a good user experience. 
                    If no filters are selected, users will see all posts without any filtering options.
                  </p>
                </div>

                {/* Max Posts */}
                <div className="space-y-2">
                  <label htmlFor="maxPosts" className="block text-sm font-medium text-gray-700">
                    Maximum Posts
                  </label>
                  <input
                    id="maxPosts"
                    type="number"
                    value={relationshipConfig.max_posts}
                    onChange={(e) => setRelationshipConfig({
                      ...relationshipConfig,
                      max_posts: parseInt(e.target.value) || 0
                    })}
                    placeholder="0 for unlimited"
                    min="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    disabled={isSubmitting}
                  />
                  <p className="text-xs text-gray-500">
                    Maximum number of posts that can be selected. Set to 0 for unlimited.
                  </p>
                </div>

                {/* Return Format */}
                <div className="space-y-2">
                  <label htmlFor="returnFormat" className="block text-sm font-medium text-gray-700">
                    Return Format
                  </label>
                  <select
                    id="returnFormat"
                    value={relationshipConfig.return_format}
                    onChange={(e) => setRelationshipConfig({
                      ...relationshipConfig,
                      return_format: e.target.value
                    })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    disabled={isSubmitting}
                  >
                    <option value="object">Post Objects</option>
                    <option value="id">Post IDs</option>
                    <option value="title">Post Titles</option>
                  </select>
                  <p className="text-xs text-gray-500">
                    Choose how the selected posts will be returned in templates.
                  </p>
                </div>
              </div>
            )}

            {/* Number Field Settings */}
            {type === "number" && (
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 space-y-4">
                <h4 className="text-sm font-medium text-gray-700">Number Field Settings</h4>
                
                {/* Number Type Selection */}
                <div className="space-y-2">
                  <label htmlFor="numberType" className="block text-sm font-medium text-gray-700">
                    Number Type
                  </label>
                  <select
                    id="numberType"
                    value={fieldConfig?.number_type || 'normal'}
                    onChange={(e) => {
                      const currentConfig = fieldConfig || {};
                      setFieldConfig({
                        ...currentConfig,
                        number_type: e.target.value
                      });
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    disabled={isSubmitting}
                  >
                    <option value="normal">Normal Number</option>
                    <option value="phone">Phone Number</option>
                  </select>
                  <p className="text-xs text-gray-500">
                    {fieldConfig?.number_type === 'phone' 
                      ? 'Phone numbers use character length limits instead of value ranges' 
                      : 'Normal numbers use minimum and maximum value constraints'
                    }
                  </p>
                </div>
                
                {/* Unique Number Option */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={fieldConfig?.unique || false}
                      onChange={(e) => {
                        const currentConfig = fieldConfig || {};
                        setFieldConfig({
                          ...currentConfig,
                          unique: e.target.checked
                        });
                      }}
                      className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                      disabled={isSubmitting}
                    />
                    <span className="text-sm font-medium text-gray-700">Require Unique Number</span>
                  </label>
                  <p className="text-xs text-gray-500 ml-6">
                    When enabled, this field will ensure that each number entered is unique across all instances of this field.
                  </p>
                </div>

                {/* Min/Max Values - Only show for Normal Number type */}
                {fieldConfig?.number_type === 'normal' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="minValue" className="block text-sm font-medium text-gray-700">
                        Minimum Value
                      </label>
                      <input
                        id="minValue"
                        type="number"
                        value={fieldConfig?.min_value || ''}
                        onChange={(e) => {
                          const currentConfig = fieldConfig || {};
                          setFieldConfig({
                            ...currentConfig,
                            min_value: e.target.value === '' ? null : parseFloat(e.target.value)
                          });
                        }}
                        placeholder="No minimum"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                        disabled={isSubmitting}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label htmlFor="maxValue" className="block text-sm font-medium text-gray-700">
                        Maximum Value
                      </label>
                      <input
                        id="maxValue"
                        type="number"
                        value={fieldConfig?.max_value || ''}
                        onChange={(e) => {
                          const currentConfig = fieldConfig || {};
                          setFieldConfig({
                            ...currentConfig,
                            max_value: e.target.value === '' ? null : parseFloat(e.target.value)
                          });
                        }}
                        placeholder="100"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>
                )}

                {/* Character Length Limits - Only show for Phone Number type */}
                {fieldConfig?.number_type === 'phone' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="minLength" className="block text-sm font-medium text-gray-700">
                        Minimum Characters
                      </label>
                      <input
                        id="minLength"
                        type="number"
                        min="1"
                        value={fieldConfig?.min_length || ''}
                        onChange={(e) => {
                          const currentConfig = fieldConfig || {};
                          setFieldConfig({
                            ...currentConfig,
                            min_length: e.target.value === '' ? null : parseInt(e.target.value)
                          });
                        }}
                        placeholder="No minimum"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                        disabled={isSubmitting}
                      />
                      <p className="text-xs text-gray-500">
                        Minimum number of characters (e.g., 10 for phone numbers)
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <label htmlFor="maxLength" className="block text-sm font-medium text-gray-700">
                        Maximum Characters
                      </label>
                      <input
                        id="maxLength"
                        type="number"
                        min="1"
                        value={fieldConfig?.max_length || ''}
                        onChange={(e) => {
                          const currentConfig = fieldConfig || {};
                          setFieldConfig({
                            ...currentConfig,
                            max_length: e.target.value === '' ? null : parseInt(e.target.value)
                          });
                        }}
                        placeholder="No maximum"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                        disabled={isSubmitting}
                      />
                      <p className="text-xs text-gray-500">
                        Maximum number of characters allowed
                      </p>
                    </div>
                  </div>
                )}

                {/* Prepend and Append */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="prependValue" className="block text-sm font-medium text-gray-700">
                      Prepend Text
                    </label>
                    <input
                      id="prependValue"
                      type="text"
                      value={fieldConfig?.prepend || ''}
                      onChange={(e) => {
                        const currentConfig = fieldConfig || {};
                        setFieldConfig({
                          ...currentConfig,
                          prepend: e.target.value
                        });
                      }}
                      placeholder="e.g., $, €, etc."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                      disabled={isSubmitting}
                    />
                    <p className="text-xs text-gray-500">
                      Text to display before the input field
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="appendValue" className="block text-sm font-medium text-gray-700">
                      Append Text
                    </label>
                    <input
                      id="appendValue"
                      type="text"
                      value={fieldConfig?.append || ''}
                      onChange={(e) => {
                        const currentConfig = fieldConfig || {};
                        setFieldConfig({
                          ...currentConfig,
                          append: e.target.value
                        });
                      }}
                      placeholder="e.g., %, kg, etc."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                      disabled={isSubmitting}
                    />
                    <p className="text-xs text-gray-500">
                      Text to display after the input field
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Range Field Settings */}
            {type === "range" && (
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 space-y-4">
                <h4 className="text-sm font-medium text-gray-700">Range Field Settings</h4>
                
                {/* Min/Max Values */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="rangeMinValue" className="block text-sm font-medium text-gray-700">
                      Minimum Value
                    </label>
                    <input
                      id="rangeMinValue"
                      type="number"
                      value={fieldConfig?.min_value !== undefined && fieldConfig?.min_value !== null ? fieldConfig.min_value : ''}
                      onChange={(e) => {
                        const currentConfig = fieldConfig || {};
                        setFieldConfig({
                          ...currentConfig,
                          min_value: e.target.value === '' ? null : parseFloat(e.target.value)
                        });
                      }}
                      placeholder="Enter minimum value (optional)"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                      disabled={isSubmitting}
                    />
                    <p className="text-xs text-gray-500">
                      Sets the lowest allowed value for the range slider (leave empty for no minimum, default is 0)
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="rangeMaxValue" className="block text-sm font-medium text-gray-700">
                      Maximum Value
                    </label>
                    <input
                      id="rangeMaxValue"
                      type="number"
                      value={fieldConfig?.max_value !== undefined && fieldConfig?.max_value !== null ? fieldConfig.max_value : ''}
                      onChange={(e) => {
                        const currentConfig = fieldConfig || {};
                        setFieldConfig({
                          ...currentConfig,
                          max_value: e.target.value === '' ? null : parseFloat(e.target.value)
                        });
                      }}
                      placeholder="Enter maximum value (optional)"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                      disabled={isSubmitting}
                    />
                    <p className="text-xs text-gray-500">
                      Sets the highest allowed value for the range slider (leave empty for no maximum, default is 100)
                    </p>
                  </div>
                </div>

                {/* Prepend and Append */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="rangePrependValue" className="block text-sm font-medium text-gray-700">
                      Prepend Text
                    </label>
                    <input
                      id="rangePrependValue"
                      type="text"
                      value={fieldConfig?.prepend || ''}
                      onChange={(e) => {
                        const currentConfig = fieldConfig || {};
                        setFieldConfig({
                          ...currentConfig,
                          prepend: e.target.value
                        });
                      }}
                      placeholder="e.g., A, Size, etc."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                      disabled={isSubmitting}
                    />
                    <p className="text-xs text-gray-500">
                      Text to display before the range slider (e.g., "A" for "Amount")
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="rangeAppendValue" className="block text-sm font-medium text-gray-700">
                      Append Text
                    </label>
                    <input
                      id="rangeAppendValue"
                      type="text"
                      value={fieldConfig?.append || ''}
                      onChange={(e) => {
                        const currentConfig = fieldConfig || {};
                        setFieldConfig({
                          ...currentConfig,
                          append: e.target.value
                        });
                      }}
                      placeholder="e.g., px, %, kg, etc."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                      disabled={isSubmitting}
                    />
                    <p className="text-xs text-gray-500">
                      Unit to display after the numeric input (optional)
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Toggle Field Settings */}
            {type === "toggle" && (
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 space-y-4">
                <h4 className="text-sm font-medium text-gray-700">Toggle Field Settings</h4>
                
                {/* Default Value */}
                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={toggleConfig?.default_value || false}
                      onChange={(e) => {
                        setToggleConfig({
                          ...toggleConfig,
                          default_value: e.target.checked
                        });
                      }}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      disabled={isSubmitting}
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Default to Enabled
                    </span>
                  </label>
                  <p className="text-xs text-gray-500">
                    When checked, the toggle will be enabled by default
                  </p>
                </div>

                {/* Conditional Logic */}
                <div className="space-y-3">
                  {/* Overall Field Condition */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Field Condition</label>
                    <select
                      value={toggleConfig?.field_condition || 'always_show'}
                      onChange={(e) => {
                        setToggleConfig({
                          ...toggleConfig,
                          field_condition: e.target.value
                        });
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                      disabled={isSubmitting}
                    >
                      <option value="always_show">Always show</option>
                      <option value="show_when">Show when</option>
                      <option value="hide_when">Hide when</option>
                    </select>
                    <p className="text-xs text-gray-500">
                      {toggleConfig?.field_condition === 'always_show' && 'Field will always be visible and interactive'}
                      {toggleConfig?.field_condition === 'show_when' && 'Field will only be visible when conditions are met'}
                      {toggleConfig?.field_condition === 'hide_when' && 'Field will be hidden when conditions are met'}
                    </p>
                  </div>

                  {/* Conditional Rules - Only show if not "always_show" */}
                  {(toggleConfig?.field_condition === 'show_when' || toggleConfig?.field_condition === 'hide_when') && (
                    <>
                      <div className="flex items-center justify-between">
                        <h5 className="text-sm font-medium text-gray-700">Conditional Rules</h5>
                        <button
                          type="button"
                          onClick={() => {
                            const newRule = {
                              id: Date.now(),
                              target_field: '',
                              action: toggleConfig?.field_condition === 'show_when' ? 'show' : 'hide',
                              condition: 'when_toggle_is',
                              operator: '===',
                              value: '1'
                            };
                            setToggleConfig({
                              ...toggleConfig,
                              conditional_logic: [...(toggleConfig?.conditional_logic || []), newRule]
                            });
                          }}
                          className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                          disabled={isSubmitting}
                        >
                          + Add Rule
                        </button>
                      </div>

                      {/* Logic Operator Selection */}
                      {toggleConfig?.conditional_logic && toggleConfig.conditional_logic.length > 1 && (
                        <div className="flex items-center gap-2 p-2 bg-white rounded border">
                          <span className="text-xs text-gray-500">Logic:</span>
                          <select
                            value={toggleConfig?.logic_operator || 'AND'}
                            onChange={(e) => {
                              setToggleConfig({
                                ...toggleConfig,
                                logic_operator: e.target.value
                              });
                            }}
                            className="text-xs border border-gray-300 rounded px-2 py-1 bg-white"
                            disabled={isSubmitting}
                          >
                            <option value="AND">All of the conditions pass</option>
                            <option value="OR">Any of the following conditions pass</option>
                          </select>
                          <span className="text-xs text-gray-500">Rules will be combined using this logic</span>
                        </div>
                      )}
                      
                      {toggleConfig?.conditional_logic && toggleConfig.conditional_logic.length > 0 ? (
                        <div className="space-y-3">
                          {toggleConfig.conditional_logic.map((rule, index) => (
                            <div key={rule.id} className="bg-white rounded-lg border border-gray-200 p-3">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded">
                                  Rule {index + 1}
                                </span>
                                {index < toggleConfig.conditional_logic.length - 1 && (
                                  <span className="text-xs text-gray-400 font-medium">
                                    {toggleConfig?.logic_operator === 'AND' ? 'All of the conditions pass' : 'Any of the following conditions pass'}
                                  </span>
                                )}
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
                                {/* Target Field Selection */}
                                <div>
                                  <label className="block text-xs text-gray-600 mb-1">Target Field</label>
                                  <select
                                    value={rule.target_field}
                                    onChange={(e) => {
                                      const updatedRules = [...toggleConfig.conditional_logic];
                                      updatedRules[index] = { ...rule, target_field: e.target.value };
                                      setToggleConfig({
                                        ...toggleConfig,
                                        conditional_logic: updatedRules
                                      });
                                    }}
                                    className="w-full text-sm border border-gray-300 rounded px-2 py-1"
                                    disabled={isSubmitting}
                                  >
                                    <option value="">Select target field</option>
                                    {/* Show only fields from the current component */}
                                    {component?.fields?.map((compField) => (
                                      <option key={compField.id} value={compField.id}>
                                        {compField.label || compField.name}
                                      </option>
                                    )) || []}
                                  </select>
                                </div>
                                
                                {/* Action Selection */}
                                <div>
                                  <label className="block text-xs text-gray-600 mb-1">Action</label>
                                  <select
                                    value={rule.action}
                                    onChange={(e) => {
                                      const updatedRules = [...toggleConfig.conditional_logic];
                                      updatedRules[index] = { ...rule, action: e.target.value };
                                      setToggleConfig({
                                        ...toggleConfig,
                                        conditional_logic: updatedRules
                                      });
                                    }}
                                    className="w-full text-sm border border-gray-300 rounded px-2 py-1"
                                    disabled={isSubmitting}
                                  >
                                    <option value="show">Show</option>
                                    <option value="hide">Hide</option>
                                    <option value="enable">Enable</option>
                                    <option value="disable">Disable</option>
                                  </select>
                                </div>
                                
                                {/* Condition Type */}
                                <div>
                                  <label className="block text-xs text-gray-600 mb-1">Condition</label>
                                  <select
                                    value={rule.condition}
                                    onChange={(e) => {
                                      const updatedRules = [...toggleConfig.conditional_logic];
                                      updatedRules[index] = { ...rule, condition: e.target.value };
                                      setToggleConfig({
                                        ...toggleConfig,
                                        conditional_logic: updatedRules
                                      });
                                    }}
                                    className="w-full text-sm border border-gray-300 rounded px-2 py-1"
                                    disabled={isSubmitting}
                                  >
                                    <option value="when_toggle_is">When toggle is</option>
                                    <option value="when_field_equals">When field equals</option>
                                    <option value="when_field_not_equals">When field not equals</option>
                                    <option value="when_field_contains">When field contains</option>
                                    <option value="when_field_not_contains">When field not contains</option>
                                  </select>
                                </div>
                                
                                {/* Operator */}
                                <div>
                                  <label className="block text-xs text-gray-600 mb-1">Operator</label>
                                  <select
                                    value={rule.operator || '==='}
                                    onChange={(e) => {
                                      const updatedRules = [...toggleConfig.conditional_logic];
                                      updatedRules[index] = { ...rule, operator: e.target.value };
                                      setToggleConfig({
                                        ...toggleConfig,
                                        conditional_logic: updatedRules
                                      });
                                    }}
                                    className="w-full text-sm border border-gray-300 rounded px-2 py-1"
                                    disabled={isSubmitting}
                                  >
                                    <option value="===">===</option>
                                    <option value="!==">!==</option>
                                    <option value=">">{'>'}</option>
                                    <option value="<">{'<'}</option>
                                    <option value=">=">{'>='}</option>
                                    <option value="<=">{'<='}</option>
                                  </select>
                                </div>
                                
                                {/* Value */}
                                <div className="md:col-span-2 lg:col-span-1">
                                  <label className="block text-xs text-gray-600 mb-1">Value</label>
                                  {rule.condition === 'when_toggle_is' ? (
                                    <select
                                      value={rule.value}
                                      onChange={(e) => {
                                        const updatedRules = [...toggleConfig.conditional_logic];
                                        updatedRules[index] = { ...rule, value: e.target.value };
                                        setToggleConfig({
                                          ...toggleConfig,
                                          conditional_logic: updatedRules
                                        });
                                      }}
                                      className="w-full text-sm border border-gray-300 rounded px-2 py-1"
                                      disabled={isSubmitting}
                                    >
                                      <option value="1">Enabled</option>
                                      <option value="0">Disabled</option>
                                    </select>
                                  ) : (
                                    <input
                                      type="text"
                                      value={rule.value}
                                      onChange={(e) => {
                                        const updatedRules = [...toggleConfig.conditional_logic];
                                        updatedRules[index] = { ...rule, value: e.target.value };
                                        setToggleConfig({
                                          ...toggleConfig,
                                          conditional_logic: updatedRules
                                        });
                                      }}
                                      placeholder="Enter value"
                                      className="w-full text-sm border border-gray-300 rounded px-2 py-1"
                                      disabled={isSubmitting}
                                    />
                                  )}
                                </div>
                              </div>
                              
                              {/* Remove Rule Button */}
                              <div className="flex justify-end mt-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updatedRules = toggleConfig.conditional_logic.filter((_, i) => i !== index);
                                    setToggleConfig({
                                      ...toggleConfig,
                                      conditional_logic: updatedRules
                                    });
                                  }}
                                  className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50 transition-colors"
                                  title="Remove rule"
                                  disabled={isSubmitting}
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-6">
                          <div className="w-12 h-12 mx-auto mb-3 text-gray-300">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <p className="text-sm text-gray-500 mb-3">
                            No conditional rules set. Add rules to control other fields based on this toggle.
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              const newRule = {
                                id: Date.now(),
                                target_field: '',
                                action: toggleConfig?.field_condition === 'show_when' ? 'show' : 'hide',
                                condition: 'when_toggle_is',
                                operator: '===',
                                value: '1'
                              };
                              setToggleConfig({
                                ...toggleConfig,
                                conditional_logic: [...(toggleConfig?.conditional_logic || []), newRule]
                              });
                            }}
                            className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                            disabled={isSubmitting}
                          >
                            + Add First Rule
                          </button>
                        </div>
                      )}
                      
                      {/* Help Text */}
                      {toggleConfig?.conditional_logic && toggleConfig.conditional_logic.length > 0 && (
                        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <h5 className="text-xs font-medium text-blue-800 mb-2">How it works:</h5>
                          <div className="text-xs text-blue-700 space-y-1">
                            <p><strong>All of the conditions pass (AND):</strong> All rules must be true for the action to execute</p>
                            <p><strong>Any of the following conditions pass (OR):</strong> Any rule being true will execute the action</p>
                            <p><strong>Show/Hide:</strong> Controls field visibility</p>
                            <p><strong>Enable/Disable:</strong> Controls field interaction</p>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                  
                  <div className="text-xs text-gray-500">
                    <p><strong>Show/Hide:</strong> Controls field visibility</p>
                    <p><strong>Enable/Disable:</strong> Controls field interaction</p>
                  </div>
                </div>
              </div>
            )}

            {/* File Field Settings */}
            {type === "file" && (
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 space-y-4">
                <h4 className="text-sm font-medium text-gray-700">File Field Settings</h4>
                
                {/* Allowed File Types */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Allowed File Types
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {['image', 'video', 'document', 'audio', 'archive'].map((fileType) => (
                      <label key={fileType} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={fieldConfig?.allowed_types?.includes(fileType) || false}
                          onChange={(e) => {
                            const currentConfig = fieldConfig || {};
                            const currentTypes = currentConfig.allowed_types || [];
                            let newTypes;
                            if (e.target.checked) {
                              newTypes = [...currentTypes, fileType];
                            } else {
                              newTypes = currentTypes.filter(type => type !== fileType);
                            }
                            setFieldConfig({
                              ...currentConfig,
                              allowed_types: newTypes
                            });
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700 capitalize">{fileType}</span>
                      </label>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500">
                    Select which file types are allowed for upload
                  </p>
                </div>

                {/* Max File Size */}
                <div className="space-y-2">
                  <label htmlFor="fileMaxSize" className="block text-sm font-medium text-gray-700">
                    Maximum File Size (MB)
                  </label>
                  <input
                    id="fileMaxSize"
                    type="number"
                    min="0"
                    max="100"
                    value={fieldConfig?.max_file_size !== undefined && fieldConfig?.max_file_size !== null ? fieldConfig.max_file_size : ''}
                    onChange={(e) => {
                      const currentConfig = fieldConfig || {};
                      setFieldConfig({
                        ...currentConfig,
                        max_file_size: e.target.value === '' ? null : parseInt(e.target.value)
                      });
                    }}
                    placeholder="Enter size (optional)"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    disabled={isSubmitting}
                  />
                  <p className="text-xs text-gray-500">
                    Maximum file size allowed for upload (leave empty for no restriction, default is 25 MB for new fields)
                  </p>
                </div>

                {/* Return Type */}
                <div className="space-y-2">
                  <label htmlFor="fileReturnType" className="block text-sm font-medium text-gray-700">
                    Return Type
                  </label>
                  <select
                    id="fileReturnType"
                    value={fieldConfig?.return_type || 'url'}
                    onChange={(e) => {
                      const currentConfig = fieldConfig || {};
                      setFieldConfig({
                        ...currentConfig,
                        return_type: e.target.value
                      });
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    disabled={isSubmitting}
                  >
                    <option value="url">File URL</option>
                    <option value="id">File ID</option>
                    <option value="array">File Array</option>
                  </select>
                  <p className="text-xs text-gray-500">
                    How the file data should be returned
                  </p>
                </div>



                {/* Display Options */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Display Options</label>
                  <div className="grid grid-cols-3 gap-4">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={fieldConfig?.show_preview !== undefined ? fieldConfig.show_preview : true}
                        onChange={(e) => {
                          const currentConfig = fieldConfig || {};
                          setFieldConfig({
                            ...currentConfig,
                            show_preview: e.target.checked
                          });
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">Show Preview</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={fieldConfig?.show_download !== undefined ? fieldConfig.show_download : true}
                        onChange={(e) => {
                          const currentConfig = fieldConfig || {};
                          setFieldConfig({
                            ...currentConfig,
                            show_download: e.target.checked
                          });
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">Show Download</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={fieldConfig?.show_delete !== undefined ? fieldConfig.show_delete : true}
                        onChange={(e) => {
                          const currentConfig = fieldConfig || {};
                          setFieldConfig({
                            ...currentConfig,
                            show_delete: e.target.checked
                          });
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">Show Delete</span>
                    </label>
                  </div>
                  <p className="text-xs text-gray-500">
                    Control which UI elements are displayed for uploaded files
                  </p>
                </div>
              </div>
            )}

            {/* User Field Settings */}
            {type === "user" && (
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 space-y-4">
                <h4 className="text-sm font-medium text-gray-700">User Field Settings</h4>

                {/* Multiple Selection */}
                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={userConfig.multiple}
                      onChange={(e) => setUserConfig(prev => ({ ...prev, multiple: e.target.checked }))}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Allow Multiple Selection</span>
                  </label>
                  <p className="text-xs text-gray-500">Users can select multiple users if enabled</p>
                </div>

                {/* Return Type */}
                <div className="space-y-2">
                  <label htmlFor="userReturnType" className="block text-sm font-medium text-gray-700">
                    Return Type
                  </label>
                  <select
                    id="userReturnType"
                    value={userConfig.return_type}
                    onChange={(e) => setUserConfig(prev => ({ ...prev, return_type: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="id">User ID only</option>
                    <option value="object">Full User Object</option>
                    <option value="array">User Data Array</option>
                  </select>
                  <p className="text-xs text-gray-500">Format of the returned user data</p>
                </div>

                {/* Searchable */}
                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={userConfig.searchable}
                      onChange={(e) => setUserConfig(prev => ({ ...prev, searchable: e.target.checked }))}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Enable Search</span>
                  </label>
                  <p className="text-xs text-gray-500">Allow users to search through the user list</p>
                </div>

                {/* Order By */}
                <div className="space-y-2">
                  <label htmlFor="userOrderBy" className="block text-sm font-medium text-gray-700">
                    Order By
                  </label>
                  <select
                    id="userOrderBy"
                    value={userConfig.orderby}
                    onChange={(e) => setUserConfig(prev => ({ ...prev, orderby: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="display_name">Display Name</option>
                    <option value="user_login">Username</option>
                    <option value="user_email">Email</option>
                    <option value="user_registered">Registration Date</option>
                  </select>
                  <p className="text-xs text-gray-500">How to sort the user list</p>
                </div>

                {/* Order */}
                <div className="space-y-2">
                  <label htmlFor="userOrder" className="block text-sm font-medium text-gray-700">
                    Order
                  </label>
                  <select
                    id="userOrder"
                    value={userConfig.order}
                    onChange={(e) => setUserConfig(prev => ({ ...prev, order: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="ASC">Ascending (A-Z)</option>
                    <option value="DESC">Descending (Z-A)</option>
                  </select>
                  <p className="text-xs text-gray-500">Sort order for the user list</p>
                </div>

                {/* Role Filter */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Role Filter
                  </label>
                  <div className="space-y-2">
                    {['administrator', 'editor', 'author', 'contributor', 'subscriber'].map(role => (
                      <label key={role} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={userConfig.role_filter.includes(role)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setUserConfig(prev => ({
                                ...prev,
                                role_filter: [...prev.role_filter, role]
                              }));
                            } else {
                              setUserConfig(prev => ({
                                ...prev,
                                role_filter: prev.role_filter.filter(r => r !== role)
                              }));
                            }
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700 capitalize">{role}</span>
                      </label>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500">Limit user selection to specific roles (leave empty for all roles)</p>
                </div>
              </div>
            )}

            {/* Form Actions */}
            <div className="flex justify-end gap-2 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 text-base font-semibold shadow"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-pink-500 text-white rounded hover:bg-pink-600 focus:outline-none focus:ring-2 focus:ring-pink-400 text-base font-semibold shadow disabled:opacity-50"
                disabled={isSubmitting}
              >
                {isEditing ? 'Update Field' : 'Add Field'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {showFieldPopup && (
        <FieldEditModal
          isOpen={showFieldPopup}
          field={currentNestedField}
          component={component}
          onClose={() => setShowFieldPopup(false)}
          onSave={(updatedField) => {
            if (editingNestedFieldIndex !== null) {
              handleUpdateNestedField(updatedField)
            } else {
              handleAddNestedField(updatedField)
            }
          }}
          preventDatabaseSave={true}
        />
      )}

      {/* Tree Structure Modal */}
      {showTreeModal && (
        <FieldTreeModal
          isOpen={showTreeModal}
          fields={nestedFieldDefinitions}
          onClose={() => setShowTreeModal(false)}
          onFieldUpdate={handleTreeFieldUpdate}
          component={component}
        />
      )}
    </div>
  )
}

export default FieldEditModal
