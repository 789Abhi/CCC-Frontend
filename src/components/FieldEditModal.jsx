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
import FieldPopup from "./FieldPopup"
import FieldTreeModal from "./FieldTreeModal"

function FieldEditModal({ isOpen, component, field, onClose, onSave }) {
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

  const isEditing = !!field

  const availableFieldTypes = [
    "text",
    "textarea",
    "image",
    "repeater",
    "wysiwyg",
    "color",
    "select",
    "checkbox",
    "radio",
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
    }

    setError("")
    setEditingNestedFieldIndex(null)
    setShowFieldPopup(false)
    setCurrentNestedField(null)
  }, [field, isOpen])

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
    if (window.confirm("Are you sure you want to delete this nested field?")) {
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
      setError("Repeater fields must have at least one nested field defined.")
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
          config.multiple = false // Default to single selection, can be extended later
        }
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
                  const value = e.target.value
                  setLabel(value)
                  if (!isEditing && (!name || name === generateHandle(label))) {
                    setName(generateHandle(value))
                  }
                }}
                placeholder="Enter field label"
                disabled={isSubmitting}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              />
            </div>

            {/* Field Name */}
            <div className="space-y-2">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Field Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="field_name"
                disabled={isSubmitting || isEditing}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors bg-gray-50 text-gray-600"
              />
              <p className="text-xs text-gray-500">
                {isEditing
                  ? "Field name cannot be changed after creation"
                  : "Used in templates. Auto-generated from label if left empty."}
              </p>
            </div>

            {/* Field Type */}
            <div className="space-y-2">
              <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                Field Type
              </label>
              <select
                id="type"
                value={type}
                onChange={(e) => setType(e.target.value)}
                disabled={isSubmitting}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              >
                <option value="text">Text</option>
                <option value="textarea">Textarea</option>
                <option value="image">Image</option>
                <option value="repeater">Repeater</option>
                <option value="wysiwyg">WYSIWYG Editor</option>
                <option value="color">Color</option>
                <option value="select">Select</option>
                <option value="checkbox">Checkbox</option>
                <option value="radio">Radio</option>
              </select>
              {isEditing && <p className="text-xs text-gray-500">Field type can be changed.</p>}
            </div>

            {/* WYSIWYG Settings */}
            {type === "wysiwyg" && (
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 space-y-4">
                <h4 className="text-sm font-medium text-gray-700">WYSIWYG Editor Settings</h4>

                <div className="space-y-3">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="media_buttons"
                      checked={wysiwygSettings.media_buttons}
                      onChange={(e) => setWysiwygSettings((prev) => ({ ...prev, media_buttons: e.target.checked }))}
                      className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      disabled={isSubmitting}
                    />
                    <label htmlFor="media_buttons" className="ml-2 text-sm text-gray-700">
                      Show media buttons
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="teeny"
                      checked={wysiwygSettings.teeny}
                      onChange={(e) => setWysiwygSettings((prev) => ({ ...prev, teeny: e.target.checked }))}
                      className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      disabled={isSubmitting}
                    />
                    <label htmlFor="teeny" className="ml-2 text-sm text-gray-700">
                      Use minimal editor (teeny mode)
                    </label>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="textarea_rows" className="block text-sm font-medium text-gray-700">
                      Editor Height (rows)
                    </label>
                    <input
                      id="textarea_rows"
                      type="number"
                      value={wysiwygSettings.textarea_rows}
                      onChange={(e) =>
                        setWysiwygSettings((prev) => ({
                          ...prev,
                          textarea_rows: Number.parseInt(e.target.value) || 10,
                        }))
                      }
                      min="5"
                      max="30"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Options Configuration for Select, Checkbox, Radio */}
            {["select", "checkbox", "radio"].includes(type) && (
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 space-y-4">
                <h4 className="text-sm font-medium text-gray-700">Field Options</h4>
                <p className="text-xs text-gray-600">Define the options available for this {type} field.</p>

                {fieldOptions.length === 0 ? (
                  <div className="text-center py-4 text-gray-500 border border-dashed border-gray-300 rounded-lg">
                    <p>No options defined yet.</p>
                    <button
                      type="button"
                      onClick={handleAddOption}
                      className="text-indigo-600 hover:underline text-sm mt-2"
                      disabled={isSubmitting}
                    >
                      Add your first option
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {fieldOptions.map((option, index) => (
                      <div key={index} className="flex gap-2 items-center">
                        <input
                          type="text"
                          value={option.label}
                          onChange={(e) => handleUpdateOption(index, "label", e.target.value)}
                          placeholder="Option Label"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                          disabled={isSubmitting}
                        />
                        <input
                          type="text"
                          value={option.value}
                          onChange={(e) => handleUpdateOption(index, "value", e.target.value)}
                          placeholder="Option Value"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                          disabled={isSubmitting}
                        />
                        <button
                          type="button"
                          onClick={() => handleDeleteOption(index)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          disabled={isSubmitting}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleAddOption}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 shadow-md hover:shadow-lg"
                  disabled={isSubmitting}
                >
                  <Plus className="w-5 h-5" />
                  Add Option
                </button>
              </div>
            )}

            {/* Placeholder and Required for non-repeater fields */}
            {type !== "repeater" && !["select", "checkbox", "radio"].includes(type) && (
              <>
                <div className="space-y-2">
                  <label htmlFor="placeholder" className="block text-sm font-medium text-gray-700">
                    Placeholder
                  </label>
                  <input
                    id="placeholder"
                    type="text"
                    value={placeholder}
                    onChange={(e) => setPlaceholder(e.target.value)}
                    placeholder="Enter placeholder text"
                    disabled={isSubmitting}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  />
                </div>
              </>
            )}

            {/* Required field checkbox */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="required"
                checked={isRequired}
                onChange={(e) => setIsRequired(e.target.checked)}
                className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                disabled={isSubmitting}
              />
              <label htmlFor="required" className="ml-2 text-sm text-gray-700">
                Required field
              </label>
            </div>

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

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-700">Nested Fields</h4>
                      <p className="text-xs text-gray-600">Define the fields that will appear within each repeater item.</p>
                    </div>
                  </div>
                  {nestedFieldDefinitions.length === 0 ? (
                    <div className="text-center py-4 text-gray-500 border border-dashed border-gray-300 rounded-lg">
                      <p>No nested fields defined yet.</p>
                      <button
                        type="button"
                        onClick={() => {
                          setCurrentNestedField(null)
                          setEditingNestedFieldIndex(null)
                          setShowFieldPopup(true)
                        }}
                        className="text-indigo-600 hover:underline text-sm mt-2"
                        disabled={isSubmitting}
                      >
                        Add your first nested field
                      </button>
                    </div>
                  ) : (
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={onDragEnd}
                    >
                      <SortableContext
                        items={nestedFieldDefinitions.map(field => field.name + field.label)}
                        strategy={verticalListSortingStrategy}
                      >
                        <div className="space-y-2">
                          {nestedFieldDefinitions.map((nf, index) => (
                            <SortableNestedField
                              key={nf.name + index}
                              field={nf}
                              index={index}
                              onEdit={() => {
                                console.log("FieldEditModal: Opening edit popup for nested field:", nf, "at index:", index)
                                setCurrentNestedField(nf)
                                setEditingNestedFieldIndex(index)
                                setShowFieldPopup(true)
                              }}
                              onDelete={() => handleDeleteNestedField(index)}
                              isSubmitting={isSubmitting}
                            />
                          ))}
                        </div>
                      </SortableContext>
                    </DndContext>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setCurrentNestedField(null)
                      setEditingNestedFieldIndex(null)
                      setShowFieldPopup(true)
                    }}
                    className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-200 shadow-md hover:shadow-lg"
                    disabled={isSubmitting}
                  >
                    <Plus className="w-5 h-5" />
                    Add Nested Field
                  </button>
                </div>
              </div>
            )}

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`px-6 py-2 rounded-lg text-white transition-colors ${
                  isSubmitting ? "bg-gray-400 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700"
                }`}
              >
                {isSubmitting ? "Saving..." : isEditing ? "Update" : "Add Field"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {showFieldPopup && (
        <FieldPopup
          isOpen={showFieldPopup}
          initialField={currentNestedField}
          onClose={() => setShowFieldPopup(false)}
          onSave={editingNestedFieldIndex !== null ? handleUpdateNestedField : handleAddNestedField}
          availableFieldTypes={availableFieldTypes}
        />
      )}

      {/* Tree Structure Modal */}
      {showTreeModal && (
        <FieldTreeModal
          isOpen={showTreeModal}
          fields={nestedFieldDefinitions}
          onClose={() => setShowTreeModal(false)}
          onFieldUpdate={handleTreeFieldUpdate}
        />
      )}
    </div>
  )
}

export default FieldEditModal
