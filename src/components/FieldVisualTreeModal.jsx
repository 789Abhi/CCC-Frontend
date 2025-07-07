"use client"

import { useState, useEffect } from "react"
import { X, Edit, GitBranch, GitCommit, ArrowRight } from "lucide-react"
import FieldPopup from "./FieldPopup"
import axios from "axios"

function FieldVisualTreeModal({ isOpen, fields, onClose, onFieldUpdate }) {
  const [processedFields, setProcessedFields] = useState([])
  const [showFieldPopup, setShowFieldPopup] = useState(false)
  const [editingField, setEditingField] = useState(null)
  const [editingPath, setEditingPath] = useState([])

  // Process fields into visual tree structure
  useEffect(() => {
    if (fields && Array.isArray(fields) && fields.length > 0) {
      const processFields = (fieldList, level = 0, path = []) => {
        return fieldList.map((field, index) => {
          // Validate field data
          if (!field || typeof field !== 'object') {
            console.error('CCC FieldVisualTreeModal: Invalid field data:', field)
            return null
          }
          
          const currentPath = [...path, index]
          const processedField = {
            ...field,
            id: field.id || `${field.name || 'field'}-${level}-${index}`,
            level,
            path: currentPath,
            treeId: `${field.name || 'field'}-${level}-${index}`,
            children: []
          }

          // Add children for repeater fields
          if (field.type === "repeater" && field.config && Array.isArray(field.config.nested_fields)) {
            processedField.children = processFields(field.config.nested_fields, level + 1, currentPath).filter(Boolean)
          }

          return processedField
        }).filter(Boolean) // Remove any null entries
      }

      const processed = processFields(fields)
      console.log('CCC FieldVisualTreeModal: Processed fields:', processed)
      setProcessedFields(processed)
    } else {
      setProcessedFields([])
    }
  }, [fields])

  // Helper: Find the path to a field by ID (returns array of IDs)
  const getPathById = (fields, targetId, path = []) => {
    for (let i = 0; i < fields.length; i++) {
      const field = fields[i]
      if (field.id === targetId) return [...path, field.id]
      if (field.type === 'repeater' && field.config?.nested_fields) {
        const childPath = getPathById(field.config.nested_fields, targetId, [...path, field.id])
        if (childPath) return childPath
      }
    }
    return null
  }

  // Helper: Find a field by ID path
  const findFieldByIdPath = (fields, idPath) => {
    if (!Array.isArray(idPath) || idPath.length === 0) return null
    const [currentId, ...rest] = idPath
    const field = fields.find(f => f.id === currentId)
    if (!field) return null
    if (rest.length === 0) return field
    if (field.type === 'repeater' && field.config?.nested_fields) {
      return findFieldByIdPath(field.config.nested_fields, rest)
    }
    return null
  }

  // Update handleEditField to use ID path
  const handleEditField = (field) => {
    // Find the ID path to this field
    const idPath = getPathById(fields, field.id)
    if (!idPath) {
      console.error('Could not find ID path for field:', field)
      return
    }
    const originalField = findFieldByIdPath(fields, idPath)
    if (!originalField) {
      console.error('Could not find original field data for ID path:', idPath, fields)
    }
    // Ensure the field data is properly formatted for FieldPopup
    const formattedField = {
      ...originalField,
      config: typeof originalField.config === 'string' 
        ? JSON.parse(originalField.config) 
        : originalField.config || {}
    }
    setEditingField(formattedField)
    setEditingPath(idPath)
    setShowFieldPopup(true)
  }

  // Update handleFieldUpdate to use ID path
  const handleFieldUpdate = (updatedField) => {
    console.log('CCC FieldVisualTreeModal: Field update received:', updatedField)
    try {
      if (!updatedField || typeof updatedField !== 'object') {
        console.error('CCC FieldVisualTreeModal: Invalid updatedField data:', updatedField)
        return
      }
      if (!Array.isArray(editingPath) || editingPath.length === 0) {
        console.error('CCC FieldVisualTreeModal: Invalid editingPath:', editingPath)
        return
      }
      // Process the updated field to ensure proper structure
      const processUpdatedField = (field) => {
        if (!field || typeof field !== 'object') {
          console.error('CCC FieldVisualTreeModal: Invalid field in processUpdatedField:', field)
          return null
        }
        
        const processedField = {
          label: field.label || '',
          name: field.name || '',
          type: field.type || 'text'
        }
        
        // Add config based on field type
        if (field.type === 'repeater') {
          processedField.config = {
            max_sets: field.maxSets ? parseInt(field.maxSets) : 0,
            nested_fields: Array.isArray(field.nestedFieldDefinitions) ? field.nestedFieldDefinitions : []
          }
        } else if (field.type === 'image') {
          processedField.config = {
            return_type: field.imageReturnType || 'url'
          }
        } else if (['select', 'checkbox', 'radio'].includes(field.type)) {
          // Convert options array to object format
          const optionsObject = {}
          if (Array.isArray(field.fieldOptions)) {
            field.fieldOptions.forEach((option) => {
              if (option && option.label && option.value) {
                optionsObject[option.value] = option.label
              }
            })
          }
          processedField.config = {
            options: optionsObject
          }
        }
        
        return processedField
      }
      
      const processedUpdatedField = processUpdatedField(updatedField)
      if (!processedUpdatedField) {
        console.error('CCC FieldVisualTreeModal: Failed to process updated field')
        return
      }
      
      console.log('CCC FieldVisualTreeModal: Processed updated field:', processedUpdatedField)
      
      // Find the original field to get the field ID
      const originalField = findFieldByIdPath(fields, editingPath)
      
      if (!originalField || !originalField.id) {
        console.error('CCC FieldVisualTreeModal: Could not find original field or field ID', { editingPath, fields, originalField })
        return
      }
      
      // Send the update to the backend using the new endpoint
      const updateFieldInBackend = async () => {
        try {
          const formData = new FormData()
          formData.append("action", "ccc_update_field_from_hierarchy")
          formData.append("field_id", originalField.id)
          formData.append("label", processedUpdatedField.label)
          formData.append("name", processedUpdatedField.name)
          formData.append("type", processedUpdatedField.type)
          formData.append("required", originalField.required || false)
          formData.append("placeholder", originalField.placeholder || "")
          formData.append("nonce", window.cccData.nonce)
          
          // Add config if it exists
          if (processedUpdatedField.config) {
            formData.append("config", JSON.stringify(processedUpdatedField.config))
          }
          
          const response = await axios.post(window.cccData.ajaxUrl, formData)
          
          if (response.data.success) {
            console.log('CCC FieldVisualTreeModal: Field updated successfully in backend')
            
            // Update the field in the processed fields structure
            const updateFieldInStructure = (fields, path, updatedField) => {
              if (!Array.isArray(fields) || !Array.isArray(path) || !updatedField) {
                console.error('CCC FieldVisualTreeModal: Invalid parameters for updateFieldInStructure:', { fields, path, updatedField })
                return fields
              }
              
              const [currentIndex, ...remainingPath] = path
              
              if (remainingPath.length === 0) {
                // Update at current level - preserve tree-specific properties
                return fields.map((f, i) => {
                  if (i === currentIndex) {
                    // Preserve tree-specific properties and update the field data
                    const updatedTreeField = {
                      ...f, // Keep tree-specific properties (treeId, level, path, children)
                      ...updatedField, // Update field data
                      // Ensure children are preserved for repeater fields
                      children: f.type === 'repeater' && updatedField.type === 'repeater' 
                        ? (Array.isArray(updatedField.config?.nested_fields) ? updatedField.config.nested_fields : f.children || [])
                        : f.children || []
                    }
                    
                    // If this is a repeater field, we need to reprocess the children
                    if (updatedTreeField.type === 'repeater' && Array.isArray(updatedTreeField.config?.nested_fields)) {
                      const processChildren = (fieldList, level, path) => {
                        if (!Array.isArray(fieldList)) return []
                        
                        return fieldList.map((field, index) => {
                          if (!field || typeof field !== 'object') {
                            console.error('CCC FieldVisualTreeModal: Invalid field in processChildren:', field)
                            return null
                          }
                          
                          const currentPath = [...path, index]
                          const processedField = {
                            ...field,
                            level,
                            path: currentPath,
                            treeId: `${field.name || 'field'}-${level}-${index}`,
                            children: []
                          }

                          // Add children for repeater fields
                          if (field.type === "repeater" && field.config?.nested_fields && Array.isArray(field.config.nested_fields)) {
                            processedField.children = processChildren(field.config.nested_fields, level + 1, currentPath).filter(Boolean)
                          }

                          return processedField
                        }).filter(Boolean)
                      }
                      
                      updatedTreeField.children = processChildren(updatedTreeField.config.nested_fields, updatedTreeField.level + 1, updatedTreeField.path)
                    }
                    
                    return updatedTreeField
                  }
                  return f
                })
              } else {
                // Navigate deeper
                return fields.map((f, i) => {
                  if (i === currentIndex && f.type === "repeater" && f.config?.nested_fields && Array.isArray(f.config.nested_fields)) {
                    return {
                      ...f,
                      config: {
                        ...f.config,
                        nested_fields: updateFieldInStructure(f.config.nested_fields, remainingPath, updatedField)
                      }
                    }
                  }
                  return f
                })
              }
            }
            
            setProcessedFields(prev => {
              const updated = updateFieldInStructure(prev, editingPath, processedUpdatedField)
              console.log('CCC FieldVisualTreeModal: Updated processed fields:', updated)
              return updated
            })
            
            // Call the parent update function to update the component state
            onFieldUpdate(editingPath, processedUpdatedField)
            
            setShowFieldPopup(false)
            setEditingField(null)
            setEditingPath([])
          } else {
            console.error('CCC FieldVisualTreeModal: Failed to update field in backend:', response.data.message)
          }
        } catch (error) {
          console.error('CCC FieldVisualTreeModal: Error updating field in backend:', error)
        }
      }
      
      updateFieldInBackend()
      
    } catch (error) {
      console.error('CCC FieldVisualTreeModal: Error updating field:', error)
      // Don't close the popup on error, let the user try again
    }
  }

  const getFieldIcon = (type) => {
    switch (type) {
      case "text":
        return "📝"
      case "textarea":
        return "📄"
      case "image":
        return "🖼️"
      case "repeater":
        return "🔄"
      case "wysiwyg":
        return "✏️"
      case "color":
        return "🎨"
      case "select":
        return "📋"
      case "checkbox":
        return "☑️"
      case "radio":
        return "🔘"
      default:
        return "📌"
    }
  }

  const getFieldColor = (type) => {
    switch (type) {
      case "text":
        return "bg-gradient-to-br from-blue-50 to-blue-100 border-blue-300 shadow-blue-100"
      case "textarea":
        return "bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-300 shadow-emerald-100"
      case "image":
        return "bg-gradient-to-br from-purple-50 to-purple-100 border-purple-300 shadow-purple-100"
      case "repeater":
        return "bg-gradient-to-br from-orange-50 to-orange-100 border-orange-300 shadow-orange-100"
      case "wysiwyg":
        return "bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-300 shadow-indigo-100"
      case "color":
        return "bg-gradient-to-br from-pink-50 to-pink-100 border-pink-300 shadow-pink-100"
      case "select":
        return "bg-gradient-to-br from-teal-50 to-teal-100 border-teal-300 shadow-teal-100"
      case "checkbox":
        return "bg-gradient-to-br from-amber-50 to-amber-100 border-amber-300 shadow-amber-100"
      case "radio":
        return "bg-gradient-to-br from-red-50 to-red-100 border-red-300 shadow-red-100"
      default:
        return "bg-gradient-to-br from-gray-50 to-gray-100 border-gray-300 shadow-gray-100"
    }
  }

  const renderFieldNode = (field, isLast = false) => {
    // Add comprehensive null checks
    if (!field || typeof field !== 'object') {
      console.error('CCC FieldVisualTreeModal: Invalid field data in renderFieldNode:', field)
      return null
    }
    
    // Ensure all required properties exist
    const safeField = {
      treeId: field.treeId || `field-${Math.random()}`,
      level: typeof field.level === 'number' ? field.level : 0,
      type: field.type || 'text',
      label: field.label || 'Unnamed Field',
      name: field.name || 'unnamed',
      children: Array.isArray(field.children) ? field.children : []
    }
    
    const hasChildren = safeField.children.length > 0
    if (safeField.type === 'repeater') {
      console.log('CCC FieldVisualTreeModal: Rendering repeater field', safeField.name, 'with children:', safeField.children)
    }
    
    return (
      <div key={safeField.treeId} className="relative">
        {/* Field Box */}
        <div className={`relative group ${safeField.level > 0 ? 'ml-12' : ''}`}>
          {/* Connecting Line */}
          {safeField.level > 0 && (
            <div className="absolute left-0 top-1/2 w-8 h-0.5 bg-gradient-to-r from-gray-400 to-gray-300 transform -translate-y-1/2 rounded-full shadow-sm"></div>
          )}
          
          {/* Vertical Line for Children */}
          {hasChildren && (
            <div className="absolute left-8 top-full w-0.5 h-6 bg-gradient-to-b from-gray-400 to-gray-300 rounded-full shadow-sm"></div>
          )}
          
          {/* Field Card */}
          <div className={`relative border-2 rounded-xl p-5 shadow-lg hover:shadow-xl transition-all duration-300 ${getFieldColor(safeField.type)} backdrop-blur-sm`}>
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-xl pointer-events-none"></div>
            
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/30 rounded-xl flex items-center justify-center shadow-inner">
                    <span className="text-2xl">{getFieldIcon(safeField.type)}</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-lg mb-1">{safeField.label}</h4>
                    <div className="flex items-center gap-2">
                      <code className="bg-white/70 backdrop-blur-sm px-3 py-1.5 rounded-lg text-xs font-mono font-semibold shadow-sm">
                        {safeField.name}
                      </code>
                      <span className="bg-white/70 backdrop-blur-sm px-3 py-1.5 rounded-lg text-xs font-semibold capitalize shadow-sm">
                        {safeField.type}
                      </span>
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={() => handleEditField(field)}
                  className="opacity-0 group-hover:opacity-100 p-3 text-gray-700 hover:text-blue-600 hover:bg-white/60 rounded-xl transition-all duration-300 shadow-md hover:shadow-lg"
                  title="Edit field"
                >
                  <Edit className="w-5 h-5" />
                </button>
              </div>
              
              {/* Repeater Indicator */}
              {safeField.type === "repeater" && (
                <div className="mt-4 pt-4 border-t border-white/30 flex items-center gap-3">
                  <div className="w-8 h-8 bg-white/40 rounded-lg flex items-center justify-center">
                    <GitBranch className="w-4 h-4" />
                  </div>
                  <span className="text-gray-800">
                    Contains {safeField.children.length} nested field{safeField.children.length !== 1 ? 's' : ''}
                  </span>
                  {safeField.children.length > 0 && (
                    <span className="ml-2 px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold">
                      {safeField.children.length} nested
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Children */}
        {hasChildren && (
          <div className="mt-6 relative">
            {/* Horizontal Line for Multiple Children */}
            {safeField.children.length > 1 && (
              <div className="absolute left-8 top-0 w-0.5 h-6 bg-gradient-to-b from-gray-400 to-gray-300 rounded-full shadow-sm"></div>
            )}
            <div className="space-y-6">
              {safeField.children.map((child, index) => {
                if (!child || typeof child !== 'object' || !('id' in child)) {
                  console.error('CCC FieldVisualTreeModal: Invalid child field in children map:', child)
                  return null
                }
                return (
                  <div key={child.treeId || `child-${index}-${Math.random()}`} className="relative">
                    {renderFieldNode(child, index === safeField.children.length - 1)}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    )
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden border border-gray-100">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 p-6 rounded-t-2xl text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -mr-16 -mt-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full -ml-12 -mb-12"></div>
          </div>
          
          <div className="flex justify-between items-center relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <GitCommit className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Field Structure Visualization</h3>
                <p className="text-sm text-white/80 mt-1">
                  Visual representation of nested fields with direct edit access
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white p-2 rounded-lg hover:bg-white/20 transition-all duration-200"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Visual Tree Content */}
        <div className="p-8 h-[calc(90vh-120px)] overflow-y-auto">
          {(() => {
            try {
              if (Array.isArray(processedFields) && processedFields.length > 0) {
                return (
                  <div className="space-y-8">
                    <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 rounded-2xl p-6 border border-emerald-200 shadow-sm">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                          <GitBranch className="w-5 h-5 text-emerald-600" />
                        </div>
                        <h4 className="text-lg font-bold text-emerald-800">Field Hierarchy</h4>
                      </div>
                      <p className="text-sm text-emerald-700 leading-relaxed">
                        Hover over any field card and click the edit icon to modify it directly. 
                        The visual structure shows the relationship between fields .
                      </p>
                    </div>
                    
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-8 border border-gray-200 shadow-lg">
                      <div className="space-y-8">
                        {processedFields.map((field, index) => {
                          if (!field || typeof field !== 'object') {
                            console.error('CCC FieldVisualTreeModal: Invalid field in processedFields:', field)
                            return null
                          }
                          return (
                            <div key={field.treeId || `processed-field-${index}-${Math.random()}`}>
                              {renderFieldNode(field, index === processedFields.length - 1)}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )
              } else {
                return (
                  <div className="text-center py-12">
                    <div className="text-gray-400 mb-4">
                      <GitCommit className="w-16 h-16 mx-auto" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-600 mb-2">No Fields to Display</h3>
                    <p className="text-gray-500">Add some nested fields to see the visual structure.</p>
                  </div>
                )
              }
            } catch (error) {
              console.error('CCC FieldVisualTreeModal: Error rendering content:', error)
              return (
                <div className="text-center py-12">
                  <div className="text-red-400 mb-4">
                    <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-red-600 mb-2">Error Rendering Fields</h3>
                  <p className="text-red-500">There was an error displaying the field structure. Please try refreshing the page.</p>
                </div>
              )
            }
          })()}
        </div>
      </div>

      {/* Field Edit Popup */}
      {showFieldPopup && editingField && (
        <div className="relative">
          {(() => {
            try {
              return (
                <FieldPopup
                  componentId={null}
                  isOpen={showFieldPopup}
                  initialField={editingField}
                  onSave={handleFieldUpdate}
                  onClose={() => {
                    setShowFieldPopup(false)
                    setEditingField(null)
                    setEditingPath([])
                  }}
                  onFieldAdded={() => {}}
                />
              )
            } catch (error) {
              console.error('CCC FieldVisualTreeModal: Error rendering FieldPopup:', error)
              return (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
                  <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
                    <div className="text-center">
                      <div className="text-red-400 mb-4">
                        <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-medium text-red-600 mb-2">Error Opening Field Editor</h3>
                      <p className="text-red-500 mb-4">There was an error opening the field editor.</p>
                      <button
                        onClick={() => {
                          setShowFieldPopup(false)
                          setEditingField(null)
                          setEditingPath([])
                        }}
                        className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              )
            }
          })()}
        </div>
      )}
    </div>
  )
}

export default FieldVisualTreeModal 