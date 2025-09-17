"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
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

import ConditionalLogicTab from "./ConditionalLogicTab"

function FieldEditModal({ isOpen, component, field, onClose, onSave, preventDatabaseSave = false, parentFieldType = null, siblingFields = null }) {

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

  // Conditional logic state for all field types
  const [conditionalLogicConfig, setConditionalLogicConfig] = useState({
    field_condition: 'always_show',
    conditional_logic: [],
    logic_operator: 'AND'
  });

  // Available post types and taxonomies for relationship field
  const [availablePostTypes, setAvailablePostTypes] = useState([]);
  const [availableTaxonomies, setAvailableTaxonomies] = useState([]);

  const isEditing = !!field

  // Add the missing generateHandle function
  const generateHandle = (name) => {
    return name
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/[^a-z0-9_]+/g, "")
  }

  // Memoized callback for toggle config changes to prevent unnecessary rerenders
  const handleToggleConfigChange = useCallback((config) => {
    setToggleConfig(prev => ({ ...prev, ...config }));
  }, []);

  // Memoized available fields to prevent array recreation on every render
  const availableFields = useMemo(() => {
    // If we're editing a nested field (inside a repeater), only include sibling fields
    if (parentFieldType === 'repeater' && siblingFields) {
      // For nested fields, only show sibling fields (other fields within the same repeater)
      // This ensures proper scoping - nested fields can only reference other fields in the same repeater
      const filteredSiblings = (siblingFields || []).filter(siblingField => {
        return !(field && (field.id === siblingField.id || field.name === siblingField.name));
      }).map((siblingField, index) => ({
        ...siblingField,
        id: siblingField.id || siblingField.name || `nested_${index}_${siblingField.label}`
      }));
      
      return filteredSiblings;
    }
    
    // For normal (non-nested) fields, use all component fields with deduplication
    const uniqueTopLevelFieldsMap = new Map();
    (component?.fields || []).forEach(f => {
      const stableId = f.id || f.name;
      if (stableId && !uniqueTopLevelFieldsMap.has(stableId)) {
        uniqueTopLevelFieldsMap.set(stableId, f);
      }
    });
    return Array.from(uniqueTopLevelFieldsMap.values());
  }, [component?.fields, parentFieldType, siblingFields, field?.id, field?.name]);

  // Get validation fields for conditional logic (separate from available fields for dropdown)
  const validationFields = useMemo(() => {
    // For nested fields, include all fields from component.fields for validation purposes
    // This ensures rules can be validated against all relevant fields
    if (parentFieldType === 'repeater') {
      const allValidationFields = component?.fields || [];
      const uniqueValidationFieldsMap = new Map();
      allValidationFields.forEach(f => {
        const stableId = f.id || f.name;
        if (stableId && !uniqueValidationFieldsMap.has(stableId)) {
          uniqueValidationFieldsMap.set(stableId, f);
        }
      });
      console.log('FieldEditModal: Validation fields for nested field:', Array.from(uniqueValidationFieldsMap.values()).map(f => ({ id: f.id, name: f.name })));
      return Array.from(uniqueValidationFieldsMap.values());
    }
    
    // For normal fields, include all component fields with deduplication
    const uniqueTopLevelFieldsMap = new Map();
    (component?.fields || []).forEach(f => {
      const stableId = f.id || f.name;
      if (stableId && !uniqueTopLevelFieldsMap.has(stableId)) {
        uniqueTopLevelFieldsMap.set(stableId, f);
      }
    });
    return Array.from(uniqueTopLevelFieldsMap.values());
  }, [component?.fields, parentFieldType, field?.id, field?.name]);

  const availableFieldTypes = [
    "text",
    "textarea",
    "image",
    "video",
    "oembed",
        "link",
        "email",
        "password",
        "user",
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
  ]

  useEffect(() => {

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
            

            
            // Update conditional logic references in nested fields to match current field IDs
            const updatedNestedFields = nestedFields.map(nestedField => {
              if (nestedField.config && nestedField.config.conditional_logic && Array.isArray(nestedField.config.conditional_logic)) {
                const updatedConditionalLogic = nestedField.config.conditional_logic.map(rule => {
                  // For each rule, find the target field among current nested fields
                  let targetField = null;
                  
                  // First try to find by exact ID match (in case ID is still valid)
                  targetField = nestedFields.find(f => f.id === rule.target_field);
                  
                  // If not found by ID, try to find by name (more reliable for nested fields)
                  if (!targetField) {
                    targetField = nestedFields.find(f => f.name === rule.target_field);
                  }
                  
                                      // If still not found, try to find by logical inference
                    if (!targetField) {
                      // Try to find the target field by looking for fields that could logically be the target
                      // For toggle-based conditional logic, look for toggle fields
                      if (rule.condition === 'when_toggle_is') {
                        targetField = nestedFields.find(f => f.type === 'toggle' && f.name !== nestedField.name);
                      }
                      
                      // If still not found and there's only one other field, assume that's the target
                      if (!targetField) {
                        const otherFields = nestedFields.filter(f => f.name !== nestedField.name);
                        if (otherFields.length === 1) {
                          targetField = otherFields[0];
                        }
                      }
                    }
                  
                  // Update the target_field to use the stable field name if available, otherwise use the ID
                  if (targetField) {
                    const newTargetField = targetField.name || targetField.id;
                    if (newTargetField !== rule.target_field) {
                      return {
                        ...rule,
                        target_field: newTargetField
                      };
                    }
                  }
                  return rule;
                });
                
                return {
                  ...nestedField,
                  config: {
                    ...nestedField.config,
                    conditional_logic: updatedConditionalLogic
                  }
                };
              }
              return nestedField;
            });
            
            setNestedFieldDefinitions(updatedNestedFields)
            
            // Load conditional logic config for repeater fields
            setConditionalLogicConfig({
              field_condition: config.field_condition || 'always_show',
              conditional_logic: config.conditional_logic || [],
              logic_operator: config.logic_operator || 'AND'
            })
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
          } else if (field.config) {
            // Load conditional logic config for all other field types
            try {
              const config = typeof field.config === 'string' ? JSON.parse(field.config) : field.config;
              setConditionalLogicConfig({
                field_condition: config.field_condition || 'always_show',
                conditional_logic: config.conditional_logic || [],
                logic_operator: config.logic_operator || 'AND'
              });
            } catch (e) {
              console.error("Error parsing field config:", e);
              setConditionalLogicConfig({
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
        
        // Centralized conditional logic loading for ALL field types (except toggle which handles it separately)
        if (field.config && field.type !== 'toggle') {
          try {
            const config = typeof field.config === 'string' ? JSON.parse(field.config) : field.config;
            setConditionalLogicConfig({
              field_condition: config.field_condition || 'always_show',
              conditional_logic: config.conditional_logic || [],
              logic_operator: config.logic_operator || 'AND'
            });
          } catch (e) {
            console.error("Error parsing conditional logic config:", e);
            setConditionalLogicConfig({
              field_condition: 'always_show',
              conditional_logic: [],
              logic_operator: 'AND'
            });
          }
        }
        
        // Comprehensive field configuration loading for all field types
        if (field.config) {
          try {
            const config = typeof field.config === 'string' ? JSON.parse(field.config) : field.config;
            
            // Load field-specific configurations that might have been missed
            if (field.type === 'image' && config.return_type) {
              setImageReturnType(config.return_type);
            }
            
            if (field.type === 'video' && config.return_type) {
              setVideoReturnType(config.return_type);
            }
            
            if (field.type === 'select' && config.multiple !== undefined) {
              setSelectMultiple(!!config.multiple);
            }
            
            if (field.type === 'file' && config.allowed_types) {
              setFieldConfig(prev => ({
                ...prev,
                allowed_types: config.allowed_types,
                max_file_size: config.max_file_size !== undefined ? config.max_file_size : 25,
                return_type: config.return_type || 'url',
                show_preview: config.show_preview !== undefined ? config.show_preview : true,
                show_download: config.show_download !== undefined ? config.show_download : true,
                show_delete: config.show_delete !== undefined ? config.show_delete : true
              }));
            }
            
            if (field.type === 'user' && config.role_filter) {
              setUserConfig(prev => ({
                ...prev,
                role_filter: config.role_filter || [],
                multiple: config.multiple !== undefined ? config.multiple : false,
                return_type: config.return_type || 'id',
                searchable: config.searchable !== undefined ? config.searchable : true,
                orderby: config.orderby || 'display_name',
                order: config.order || 'ASC'
              }));
            }
            
            if (field.type === 'relationship' && config.filter_post_types) {
              setRelationshipConfig(prev => ({
                ...prev,
                filter_post_types: config.filter_post_types || [],
                filter_post_status: config.filter_post_status || [],
                filter_taxonomy: config.filter_taxonomy || '',
                filters: config.filters || ['search', 'post_type'],
                max_posts: config.max_posts || 0,
                return_format: config.return_format || 'object'
              }));
            }
            
            if (field.type === 'link' && config.link_types) {
              setLinkConfig(prev => ({
                ...prev,
                link_types: config.link_types || ['internal', 'external'],
                default_type: config.default_type || 'internal',
                post_types: config.post_types || ['post', 'page'],
                show_target: config.show_target !== undefined ? config.show_target : true,
                show_title: config.show_title !== undefined ? config.show_title : true
              }));
            }
            
            if (field.type === 'wysiwyg' && config.editor_settings) {
              setWysiwygSettings(prev => ({
                ...prev,
                media_buttons: config.editor_settings?.media_buttons ?? true,
                teeny: config.editor_settings?.teeny ?? false,
                textarea_rows: config.editor_settings?.textarea_rows ?? 10,
              }));
            }
            
          } catch (e) {
            console.error("Error parsing comprehensive field config:", e);
          }
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
        
        // Reset conditional logic config for new fields
        setConditionalLogicConfig({
          field_condition: 'always_show',
          conditional_logic: [],
          logic_operator: 'AND'
        });
        
        // Reset toggle config for new fields
        setToggleConfig({
          default_value: false,
          field_condition: 'always_show',
          conditional_logic: [],
          logic_operator: 'AND'
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

  const handleCopy = (text, fieldId = null, fieldName = null) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text)
        .then(() => {
          setCopiedText({ text, fieldId, fieldName })
          setTimeout(() => setCopiedText(null), 2000)
        })
        .catch(() => {
          // Fallback for older browsers
          const textArea = document.createElement("textarea")
          textArea.value = text
          document.body.appendChild(textArea)
          textArea.select()
          try {
            document.execCommand("copy")
            setCopiedText({ text, fieldId, fieldName })
            setTimeout(() => setCopiedText(null), 2000)
          } catch (err) {
            console.error("Failed to copy text:", err)
          } finally {
            document.body.removeChild(textArea)
          }
        })
    } else {
      // Fallback for older browsers
      const textArea = document.createElement("textarea")
      textArea.value = text
      document.body.appendChild(textArea)
      textArea.select()
      try {
        document.execCommand("copy")
        setCopiedText({ text, fieldId, fieldName })
        setTimeout(() => setCopiedText(null), 2000)
      } catch (err) {
        console.error("Failed to copy text:", err)
      } finally {
        document.body.removeChild(textArea)
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
    setNestedFieldDefinitions(prev => 
      prev.map((field, index) => 
        index === editingNestedFieldIndex ? updatedField : field
      )
    )
    setShowFieldPopup(false)
    setCurrentNestedField(null)
    setEditingNestedFieldIndex(null)
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
  const SortableNestedField = ({ field, index, onEdit, onDelete, isSubmitting, onCopy, copiedText }) => {
    console.log('SortableNestedField rendered with:', { field, index, onEdit, onDelete, isSubmitting, onCopy, copiedText })
    
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

    const handleEditClick = (e) => {
      console.log('=== EDIT BUTTON CLICKED ===')
      console.log('Event object:', e)
      console.log('Field:', field)
      console.log('Index:', index)
      console.log('onEdit function:', onEdit)
      console.log('onEdit type:', typeof onEdit)
      
      if (e && e.preventDefault) {
        console.log('Calling preventDefault')
        e.preventDefault()
      }
      if (e && e.stopPropagation) {
        console.log('Calling stopPropagation')
        e.stopPropagation()
      }
      
      console.log('About to call onEdit()')
      try {
        onEdit()
        console.log('onEdit() called successfully')
      } catch (error) {
        console.error('Error calling onEdit:', error)
      }
    }

    const handleDeleteClick = (e) => {
      console.log('=== DELETE BUTTON CLICKED ===')
      console.log('Event object:', e)
      console.log('Field:', field)
      console.log('Index:', index)
      console.log('onDelete function:', onDelete)
      
      if (e && e.preventDefault) e.preventDefault()
      if (e && e.stopPropagation) e.stopPropagation()
      
      try {
        onDelete()
        console.log('onDelete() called successfully')
      } catch (error) {
        console.error('Error calling onDelete:', error)
      }
    }

    const handleCopyClick = (e) => {
      console.log('=== COPY BUTTON CLICKED ===')
      console.log('Field name to copy:', field.name)
      if (e && e.preventDefault) e.preventDefault()
      if (e && e.stopPropagation) e.stopPropagation()
      if (onCopy) {
        onCopy(field.name)
        console.log('Copy function called with:', field.name)
      } else {
        console.error('onCopy function not provided')
      }
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
                    onClick={(e) => {
                      console.log('=== DIRECT COPY CLICK ===')
                      console.log('Field name:', field.name)
                      console.log('onCopy function:', onCopy)
                      e.preventDefault()
                      e.stopPropagation()
                      if (onCopy) {
                        onCopy(field.name)
                        console.log('Copy function called directly')
                      }
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                    onMouseUp={(e) => e.stopPropagation()}
                  >
                    {field.name}
                  </code>
                  
                  
                  {copiedText && copiedText.text === field.name && copiedText.fieldName === field.name && (
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
            
            {/* Edit Button with enhanced debugging */}
            <button
              type="button"
              onClick={handleEditClick}
              onMouseDown={(e) => {
                console.log('Edit button mouseDown event:', e)
                e.stopPropagation()
              }}
              onMouseUp={(e) => {
                console.log('Edit button mouseUp event:', e)
                e.stopPropagation()
              }}
              className="p-1 rounded-md text-blue-600 hover:bg-blue-50 transition-colors border border-transparent hover:border-blue-200"
              disabled={isSubmitting}
              title="Edit Field"
             
            >
              <Edit className="w-4 h-4" />
            </button>
            
            {/* Delete Button with enhanced debugging */}
            <button
              type="button"
              onClick={handleDeleteClick}
              onMouseDown={(e) => e.stopPropagation()}
              className="p-1 rounded-md text-red-600 hover:bg-red-50 transition-colors border border-transparent hover:border-red-200"
              disabled={isSubmitting}
              title="Delete Field"
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
            nested_fields: nestedFieldDefinitions,
            // Include conditional logic for repeater fields
            field_condition: conditionalLogicConfig?.field_condition || 'always_show',
            conditional_logic: conditionalLogicConfig?.conditional_logic || [],
            logic_operator: conditionalLogicConfig?.logic_operator || 'AND'
          }
        } else if (type === "image") {
          fieldData.config = {
            return_type: imageReturnType || "url",
            // Include conditional logic for image fields
            field_condition: conditionalLogicConfig?.field_condition || 'always_show',
            conditional_logic: conditionalLogicConfig?.conditional_logic || [],
            logic_operator: conditionalLogicConfig?.logic_operator || 'AND'
          }
        } else if (type === "video") {
          fieldData.config = {
            return_type: videoReturnType || "url",
            sources: videoSources,
            player_options: videoPlayerOptions,
            // Include conditional logic for video fields
            field_condition: conditionalLogicConfig?.field_condition || 'always_show',
            conditional_logic: conditionalLogicConfig?.conditional_logic || [],
            logic_operator: conditionalLogicConfig?.logic_operator || 'AND'
          }
        } else if (type === "wysiwyg") {
          fieldData.config = {
            editor_settings: wysiwygSettings,
            // Include conditional logic for wysiwyg fields
            field_condition: conditionalLogicConfig?.field_condition || 'always_show',
            conditional_logic: conditionalLogicConfig?.conditional_logic || [],
            logic_operator: conditionalLogicConfig?.logic_operator || 'AND'
          }
        } else if (["select", "checkbox", "radio"].includes(type)) {
          const optionsObject = {}
          fieldOptions.forEach((option) => {
            if (option.label.trim() && option.value.trim()) {
              optionsObject[option.value.trim()] = option.label.trim()
            }
          })
          fieldData.config = { 
            options: optionsObject,
            // Include conditional logic for select/checkbox/radio fields
            field_condition: conditionalLogicConfig?.field_condition || 'always_show',
            conditional_logic: conditionalLogicConfig?.conditional_logic || [],
            logic_operator: conditionalLogicConfig?.logic_operator || 'AND'
          }
          if (type === "select") {
            fieldData.config.multiple = !!selectMultiple
          }
        } else if (type === "relationship") {
          fieldData.config = {
            ...relationshipConfig,
            // Include conditional logic for relationship fields
            field_condition: conditionalLogicConfig?.field_condition || 'always_show',
            conditional_logic: conditionalLogicConfig?.conditional_logic || [],
            logic_operator: conditionalLogicConfig?.logic_operator || 'AND'
          }
        } else if (type === "number") {
          fieldData.config = {
            number_type: fieldConfig?.number_type || 'normal',
            unique: fieldConfig?.unique || false,
            min_value: fieldConfig?.min_value || null,
            max_value: fieldConfig?.max_value || null,
            min_length: fieldConfig?.min_length || null,
            max_length: fieldConfig?.max_length || null,
            prepend: fieldConfig?.prepend || '',
            append: fieldConfig?.append || '',
            // Include conditional logic for number fields
            field_condition: conditionalLogicConfig?.field_condition || 'always_show',
            conditional_logic: conditionalLogicConfig?.conditional_logic || [],
            logic_operator: conditionalLogicConfig?.logic_operator || 'AND'
          }
        } else if (type === "range") {
          fieldData.config = {
            min_value: fieldConfig?.min_value !== undefined && fieldConfig?.min_value !== null ? fieldConfig.min_value : null,
            max_value: fieldConfig?.max_value !== undefined && fieldConfig?.max_value !== null ? fieldConfig.max_value : null,
            prepend: fieldConfig?.prepend || '',
            append: fieldConfig?.append || '',
            // Include conditional logic for range fields
            field_condition: conditionalLogicConfig?.field_condition || 'always_show',
            conditional_logic: conditionalLogicConfig?.conditional_logic || [],
            logic_operator: conditionalLogicConfig?.logic_operator || 'AND'
          }
        } else if (type === "toggle") {
          fieldData.config = {
            default_value: toggleConfig?.default_value || false,
            field_condition: toggleConfig?.field_condition || 'always_show',
            conditional_logic: toggleConfig?.conditional_logic || [],
            logic_operator: toggleConfig?.logic_operator || 'AND'
          }
        } else if (type === "file") {
          fieldData.config = {
            allowed_types: fieldConfig?.allowed_types || ['image', 'video', 'document', 'audio', 'archive'],
            max_file_size: fieldConfig?.max_file_size !== undefined && fieldConfig?.max_file_size !== null ? fieldConfig.max_file_size : null,
            return_type: fieldConfig?.return_type || 'url',
            show_preview: fieldConfig?.show_preview !== undefined ? fieldConfig?.show_preview : true,
            show_download: fieldConfig?.show_download !== undefined ? fieldConfig?.show_download : true,
            show_delete: fieldConfig?.show_delete !== undefined ? fieldConfig?.show_delete : true,
            // Include conditional logic for file fields
            field_condition: conditionalLogicConfig?.field_condition || 'always_show',
            conditional_logic: conditionalLogicConfig?.conditional_logic || [],
            logic_operator: conditionalLogicConfig?.logic_operator || 'AND'
          }
        } else if (type === "user") {
          fieldData.config = {
            role_filter: userConfig.role_filter || [],
            multiple: userConfig.multiple || false,
            return_type: userConfig.return_type || 'id',
            searchable: userConfig.searchable !== undefined ? userConfig.searchable : true,
            orderby: userConfig.orderby || 'display_name',
            order: userConfig.order || 'ASC',
            // Include conditional logic for user fields
            field_condition: conditionalLogicConfig?.field_condition || 'always_show',
            conditional_logic: conditionalLogicConfig?.conditional_logic || [],
            logic_operator: conditionalLogicConfig?.logic_operator || 'AND'
          }
        } else {
          // For all other field types, include conditional logic
          const existingConfig = fieldData.config || {};
          fieldData.config = {
            ...existingConfig,
            field_condition: conditionalLogicConfig?.field_condition || 'always_show',
            conditional_logic: conditionalLogicConfig?.conditional_logic || [],
            logic_operator: conditionalLogicConfig?.logic_operator || 'AND'
          };
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
        
        // Add conditional logic configuration for repeater fields
        const repeaterConfig = {
          max_sets: maxSets ? Number.parseInt(maxSets) : 0,
          field_condition: conditionalLogicConfig?.field_condition || 'always_show',
          conditional_logic: conditionalLogicConfig?.conditional_logic || [],
          logic_operator: conditionalLogicConfig?.logic_operator || 'AND'
        };
        console.log('FieldEditModal: Repeater field config with conditional logic:', repeaterConfig);
        formData.append("field_config", JSON.stringify(repeaterConfig));
        
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
                nested_fields: field.config?.nested_fields || field.nestedFieldDefinitions || [],
                // Include conditional logic for nested repeater fields
                field_condition: field.config?.field_condition || 'always_show',
                conditional_logic: field.config?.conditional_logic || [],
                logic_operator: field.config?.logic_operator || 'AND'
              }
              
              // Recursively process nested fields if they exist
              if (processedField.config.nested_fields && processedField.config.nested_fields.length > 0) {
                processedField.config.nested_fields = processNestedFieldsRecursively(processedField.config.nested_fields)
              }
              
              console.log('FieldEditModal: Processed nested repeater field', field.label, processedField.config)
            } else if (field.type === 'image') {
              processedField.config = {
                return_type: field.config?.return_type || field.imageReturnType || 'url',
                // Include conditional logic for image fields
                field_condition: field.config?.field_condition || 'always_show',
                conditional_logic: field.config?.conditional_logic || [],
                logic_operator: field.config?.logic_operator || 'AND'
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
                options: optionsObject,
                // Include conditional logic for select/checkbox/radio fields
                field_condition: field.config?.field_condition || 'always_show',
                conditional_logic: field.config?.conditional_logic || [],
                logic_operator: field.config?.logic_operator || 'AND'
              }
            } else if (field.type === 'user') {
              processedField.config = {
                role_filter: field.config?.role_filter || [],
                multiple: field.config?.multiple || false,
                return_type: field.config?.return_type || 'id',
                searchable: field.config?.searchable !== undefined ? field.config?.searchable : true,
                orderby: field.config?.orderby || 'display_name',
                order: field.config?.order || 'ASC',
                // Include conditional logic for user fields
                field_condition: field.config?.field_condition || 'always_show',
                conditional_logic: field.config?.conditional_logic || [],
                logic_operator: field.config?.logic_operator || 'AND'
              }
            } else {
              // For all other field types (text, textarea, email, number, etc.), include conditional logic
              processedField.config = {
                // Preserve any existing field-specific config
                ...field.config,
                // Always include conditional logic
                field_condition: field.config?.field_condition || 'always_show',
                conditional_logic: field.config?.conditional_logic || [],
                logic_operator: field.config?.logic_operator || 'AND'
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
          field_condition: conditionalLogicConfig?.field_condition || 'always_show',
          conditional_logic: conditionalLogicConfig?.conditional_logic || [],
          logic_operator: conditionalLogicConfig?.logic_operator || 'AND'
        }
        formData.append("field_config", JSON.stringify(config))
      } else if (type === "video") {
        const config = {
          return_type: videoReturnType || "url",
          sources: videoSources,
          player_options: videoPlayerOptions,
          field_condition: conditionalLogicConfig?.field_condition || 'always_show',
          conditional_logic: conditionalLogicConfig?.conditional_logic || [],
          logic_operator: conditionalLogicConfig?.logic_operator || 'AND'
        }
        formData.append("field_config", JSON.stringify(config))
      } else if (type === "wysiwyg") {
        const config = {
          editor_settings: wysiwygSettings,
          field_condition: conditionalLogicConfig?.field_condition || 'always_show',
          conditional_logic: conditionalLogicConfig?.conditional_logic || [],
          logic_operator: conditionalLogicConfig?.logic_operator || 'AND'
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
        const config = { 
          options: optionsObject,
          field_condition: conditionalLogicConfig?.field_condition || 'always_show',
          conditional_logic: conditionalLogicConfig?.conditional_logic || [],
          logic_operator: conditionalLogicConfig?.logic_operator || 'AND'
        }
        if (type === "select") {
          config.multiple = !!selectMultiple;
        }
        formData.append("field_config", JSON.stringify(config))
      } else if (type === "relationship") {
        const config = {
          ...relationshipConfig,
          field_condition: conditionalLogicConfig?.field_condition || 'always_show',
          conditional_logic: conditionalLogicConfig?.conditional_logic || [],
          logic_operator: conditionalLogicConfig?.logic_operator || 'AND'
        }
        formData.append("field_config", JSON.stringify(config))
      } else if (type === "number") {
        const config = {
          number_type: fieldConfig?.number_type || 'normal',
          unique: fieldConfig?.unique || false,
          min_value: fieldConfig?.min_value || null,
          max_value: fieldConfig?.max_value || null,
          min_length: fieldConfig?.min_length || null,
          max_length: fieldConfig?.max_length || null,
          prepend: fieldConfig?.prepend || '',
          append: fieldConfig?.append || '',
          field_condition: conditionalLogicConfig?.field_condition || 'always_show',
          conditional_logic: conditionalLogicConfig?.conditional_logic || [],
          logic_operator: conditionalLogicConfig?.logic_operator || 'AND'
        }
        console.log("Number field config being sent:", config);
        formData.append("field_config", JSON.stringify(config))
      } else if (type === "range") {
        const config = {
          min_value: fieldConfig?.min_value !== undefined && fieldConfig?.min_value !== null ? fieldConfig.min_value : null,
          max_value: fieldConfig?.max_value !== undefined && fieldConfig?.max_value !== null ? fieldConfig.max_value : null,
          prepend: fieldConfig?.prepend || '',
          append: fieldConfig?.append || '',
          field_condition: conditionalLogicConfig?.field_condition || 'always_show',
          conditional_logic: conditionalLogicConfig?.conditional_logic || [],
          logic_operator: conditionalLogicConfig?.logic_operator || 'AND'
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
      } else if (type === "user") {
        const config = {
          role_filter: userConfig.role_filter || [],
          multiple: userConfig.multiple || false,
          return_type: userConfig.return_type || 'id',
          searchable: userConfig.searchable !== undefined ? userConfig.searchable : true,
          orderby: userConfig.orderby || 'display_name',
          order: userConfig.order || 'ASC',
          field_condition: conditionalLogicConfig?.field_condition || 'always_show',
          conditional_logic: conditionalLogicConfig?.conditional_logic || [],
          logic_operator: conditionalLogicConfig?.logic_operator || 'AND'
        }
        console.log("User field config being sent:", config);
        formData.append("field_config", JSON.stringify(config))
      } else {
        // For all other field types, include conditional logic
        const existingConfig = {};
        
        // Add existing config based on field type
        if (type === "wysiwyg") {
          existingConfig.editor_settings = wysiwygSettings;
        } else if (type === "image") {
          existingConfig.return_type = imageReturnType;
        } else if (type === "video") {
          existingConfig.return_type = videoReturnType;
          existingConfig.sources = videoSources;
          existingConfig.player_options = videoPlayerOptions;
        } else if (type === "link") {
          existingConfig.link_types = linkConfig.link_types;
          existingConfig.default_type = linkConfig.default_type;
          existingConfig.post_types = linkConfig.post_types;
          existingConfig.show_target = linkConfig.show_target;
          existingConfig.show_title = linkConfig.show_title;
        } else if (type === "number") {
          existingConfig.number_type = fieldConfig?.number_type || 'normal';
          existingConfig.unique = fieldConfig?.unique || false;
          existingConfig.min_value = fieldConfig?.min_value || null;
          existingConfig.max_value = fieldConfig?.max_value || null;
          existingConfig.min_length = fieldConfig?.min_length || null;
          existingConfig.max_length = fieldConfig?.max_length || null;
          existingConfig.prepend = fieldConfig?.prepend || '';
          existingConfig.append = fieldConfig?.append || '';
        } else if (type === "range") {
          existingConfig.min_value = fieldConfig?.min_value || null;
          existingConfig.max_value = fieldConfig?.max_value || null;
          existingConfig.prepend = fieldConfig?.prepend || '';
          existingConfig.append = fieldConfig?.append || '';
        } else if (type === "file") {
          existingConfig.allowed_types = fieldConfig?.allowed_types || ['image', 'video', 'document', 'audio', 'archive'];
          existingConfig.max_file_size = fieldConfig?.max_file_size || 25;
          existingConfig.return_type = fieldConfig?.return_type || 'url';
          existingConfig.show_preview = fieldConfig?.show_preview !== undefined ? fieldConfig?.show_preview : true;
          existingConfig.show_download = fieldConfig?.show_download !== undefined ? fieldConfig?.show_download : true;
          existingConfig.show_delete = fieldConfig?.show_delete !== undefined ? fieldConfig?.show_delete : true;
        }
        
        // Add conditional logic to all field types
        const config = {
          ...existingConfig,
          field_condition: conditionalLogicConfig?.field_condition || 'always_show',
          conditional_logic: conditionalLogicConfig?.conditional_logic || [],
          logic_operator: conditionalLogicConfig?.logic_operator || 'AND'
        };
        
        console.log(`${type} field config with conditional logic being sent:`, config);
        formData.append("field_config", JSON.stringify(config));
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

                {/* Nested Fields Management */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h5 className="text-sm font-medium text-gray-700">Nested Fields</h5>
                    <div className="flex gap-2">

                      <button
                        type="button"
                        onClick={() => {
                          setEditingNestedFieldIndex(null)
                          setCurrentNestedField(null)
                          setShowFieldPopup(true)
                        }}
                        className="flex items-center gap-1 px-3 py-1 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                        disabled={isSubmitting}
                      >
                        <Plus className="w-3 h-3" />
                        Add Field
                      </button>
                    </div>
                  </div>
                  
                  {/* Nested Fields List */}
                  {nestedFieldDefinitions.length > 0 ? (
                    <DndContext collisionDetection={closestCenter} onDragEnd={onDragEnd} sensors={sensors}>
                      <SortableContext items={nestedFieldDefinitions.map(field => field.name + field.label)} strategy={verticalListSortingStrategy}>
                        <div className="space-y-2">
                          {nestedFieldDefinitions.map((nestedField, index) => (
                            <SortableNestedField
                              key={nestedField.name + nestedField.label}
                              field={nestedField}
                              index={index}
                              onEdit={() => {
                                setEditingNestedFieldIndex(index)
                                setCurrentNestedField(nestedField)
                                setShowFieldPopup(true)
                              }}
                              onDelete={() => handleDeleteNestedField(index)}
                              isSubmitting={isSubmitting}
                              onCopy={(text) => handleCopy(text, nestedField.name, nestedField.name)}
                              copiedText={copiedText}
                            />
                          ))}
                  </div>
                      </SortableContext>
                    </DndContext>
                  ) : (
                    <div className="text-center py-6 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
                      <p className="text-sm">No nested fields added yet</p>
                      <p className="text-xs mt-1">Click "Add Field" to create your first nested field</p>
                  </div>
                  )}
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
                <ConditionalLogicTab
                  fieldConfig={toggleConfig}
                  onConfigChange={handleToggleConfigChange}
                  availableFields={availableFields}
                  isSubmitting={isSubmitting}
                  fieldType="toggle"
                  currentFieldId={field?.id}
                />
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

            {/* Conditional Logic Tab for All Field Types */}
            {type !== "toggle" && (
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 space-y-4">
                <ConditionalLogicTab
                  fieldConfig={conditionalLogicConfig}
                  onConfigChange={setConditionalLogicConfig}
                  availableFields={availableFields}
                  isSubmitting={isSubmitting}
                  fieldType={type}
                  currentFieldId={field?.id}
                  validationFields={validationFields}
                />
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

      {/* Debug info */}
      <div style={{ display: 'none' }}>
        Debug: showFieldPopup={showFieldPopup.toString()}, 
        currentNestedField={currentNestedField ? 'exists' : 'null'}, 
        editingNestedFieldIndex={editingNestedFieldIndex}
      </div>

      {showFieldPopup && (
        <>
          {console.log('Rendering nested field popup, showFieldPopup:', showFieldPopup)}
          {console.log('currentNestedField:', currentNestedField)}
          {console.log('editingNestedFieldIndex:', editingNestedFieldIndex)}
          <FieldEditModal
            isOpen={showFieldPopup}
            field={currentNestedField}
            component={{
              ...component,
              fields: [
                ...(component?.fields || []),
                ...(nestedFieldDefinitions || [])
                // Don't include availableFields here as it might cause conflicts
                // The nested modal will calculate its own availableFields
              ]
            }}
            onClose={() => {
              console.log('Closing nested field popup')
              setShowFieldPopup(false)
            }}
            onSave={(updatedField) => {
              console.log('Saving nested field:', updatedField)
              if (editingNestedFieldIndex !== null) {
                handleUpdateNestedField(updatedField)
              } else {
                handleAddNestedField(updatedField)
              }
            }}
            preventDatabaseSave={true}
            parentFieldType={type}
            siblingFields={nestedFieldDefinitions}
          />
        </>
      )}
    </div>
  )
}

export default FieldEditModal
