"use client"

import { useState, useEffect } from "react"
import { X, Edit, GitBranch, GitCommit, ArrowRight } from "lucide-react"
import FieldPopup from "./FieldPopup"

function FieldVisualTreeModal({ isOpen, fields, onClose, onFieldUpdate }) {
  const [processedFields, setProcessedFields] = useState([])
  const [showFieldPopup, setShowFieldPopup] = useState(false)
  const [editingField, setEditingField] = useState(null)
  const [editingPath, setEditingPath] = useState([])

  // Process fields into visual tree structure
  useEffect(() => {
    if (fields && fields.length > 0) {
      const processFields = (fieldList, level = 0, path = []) => {
        return fieldList.map((field, index) => {
          const currentPath = [...path, index]
          const processedField = {
            ...field,
            level,
            path: currentPath,
            treeId: `${field.name}-${level}-${index}`,
            children: []
          }

          // Add children for repeater fields
          if (field.type === "repeater" && field.config?.nested_fields) {
            processedField.children = processFields(field.config.nested_fields, level + 1, currentPath)
          }

          return processedField
        })
      }

      setProcessedFields(processFields(fields))
    }
  }, [fields])

  const handleEditField = (field) => {
    // Find the original field data using the path
    const findOriginalField = (fields, path) => {
      if (path.length === 0) return null
      
      const [currentIndex, ...remainingPath] = path
      const currentField = fields[currentIndex]
      
      if (remainingPath.length === 0) {
        return currentField
      } else if (currentField.type === "repeater" && currentField.config?.nested_fields) {
        return findOriginalField(currentField.config.nested_fields, remainingPath)
      }
      
      return null
    }
    
    const originalField = findOriginalField(fields, field.path)
    
    if (originalField) {
      console.log('CCC FieldVisualTreeModal: Original field found:', originalField)
      
      // Ensure the field data is properly formatted for FieldPopup
      const formattedField = {
        ...originalField,
        // Ensure config is an object, not a string
        config: typeof originalField.config === 'string' 
          ? JSON.parse(originalField.config) 
          : originalField.config || {}
      }
      
      console.log('CCC FieldVisualTreeModal: Formatted field for editing:', formattedField)
      
      setEditingField(formattedField)
      setEditingPath(field.path)
      setShowFieldPopup(true)
    } else {
      console.error('Could not find original field data for path:', field.path)
    }
  }

  const handleFieldUpdate = (updatedField) => {
    console.log('CCC FieldVisualTreeModal: Field update received:', updatedField)
    
    try {
      // Process the updated field to ensure proper structure
      const processUpdatedField = (field) => {
        const processedField = {
          label: field.label,
          name: field.name,
          type: field.type
        }
        
        // Add config based on field type
        if (field.type === 'repeater') {
          processedField.config = {
            max_sets: field.maxSets ? parseInt(field.maxSets) : 0,
            nested_fields: field.nestedFieldDefinitions || []
          }
        } else if (field.type === 'image') {
          processedField.config = {
            return_type: field.imageReturnType || 'url'
          }
        } else if (['select', 'checkbox', 'radio'].includes(field.type)) {
          // Convert options array to object format
          const optionsObject = {}
          if (field.fieldOptions) {
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
      }
      
      const processedUpdatedField = processUpdatedField(updatedField)
      console.log('CCC FieldVisualTreeModal: Processed updated field:', processedUpdatedField)
      
      // Update the field in the processed fields structure
      const updateFieldInStructure = (fields, path, updatedField) => {
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
                  ? (updatedField.config?.nested_fields || f.children || [])
                  : f.children || []
              }
              
              // If this is a repeater field, we need to reprocess the children
              if (updatedTreeField.type === 'repeater' && updatedTreeField.config?.nested_fields) {
                const processChildren = (fieldList, level, path) => {
                  return fieldList.map((field, index) => {
                    const currentPath = [...path, index]
                    const processedField = {
                      ...field,
                      level,
                      path: currentPath,
                      treeId: `${field.name}-${level}-${index}`,
                      children: []
                    }

                    // Add children for repeater fields
                    if (field.type === "repeater" && field.config?.nested_fields) {
                      processedField.children = processChildren(field.config.nested_fields, level + 1, currentPath)
                    }

                    return processedField
                  })
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
            if (i === currentIndex && f.type === "repeater" && f.config?.nested_fields) {
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
      
      // Call the parent update function
      onFieldUpdate(editingPath, processedUpdatedField)
      
      setShowFieldPopup(false)
      setEditingField(null)
      setEditingPath([])
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
      console.error('CCC FieldVisualTreeModal: Invalid field data:', field)
      return null
    }
    
    const hasChildren = field.children && Array.isArray(field.children) && field.children.length > 0
    
    return (
      <div key={field.treeId || `field-${Math.random()}`} className="relative">
        {/* Field Box */}
        <div className={`relative group ${(field.level || 0) > 0 ? 'ml-12' : ''}`}>
          {/* Connecting Line */}
          {(field.level || 0) > 0 && (
            <div className="absolute left-0 top-1/2 w-8 h-0.5 bg-gradient-to-r from-gray-400 to-gray-300 transform -translate-y-1/2 rounded-full shadow-sm"></div>
          )}
          
          {/* Vertical Line for Children */}
          {hasChildren && (
            <div className="absolute left-8 top-full w-0.5 h-6 bg-gradient-to-b from-gray-400 to-gray-300 rounded-full shadow-sm"></div>
          )}
          
          {/* Field Card */}
          <div className={`relative border-2 rounded-xl p-5 shadow-lg hover:shadow-xl transition-all duration-300 ${getFieldColor(field.type || 'text')} backdrop-blur-sm`}>
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-xl pointer-events-none"></div>
            
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/30 rounded-xl flex items-center justify-center shadow-inner">
                    <span className="text-2xl">{getFieldIcon(field.type || 'text')}</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-lg mb-1">{field.label || 'Unnamed Field'}</h4>
                    <div className="flex items-center gap-2">
                      <code className="bg-white/70 backdrop-blur-sm px-3 py-1.5 rounded-lg text-xs font-mono font-semibold shadow-sm">
                        {field.name || 'unnamed'}
                      </code>
                      <span className="bg-white/70 backdrop-blur-sm px-3 py-1.5 rounded-lg text-xs font-semibold capitalize shadow-sm">
                        {field.type || 'text'}
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
              {field.type === "repeater" && (
                <div className="mt-4 pt-4 border-t border-white/30">
                  <div className="flex items-center gap-3 text-sm font-medium">
                    <div className="w-8 h-8 bg-white/40 rounded-lg flex items-center justify-center">
                      <GitBranch className="w-4 h-4" />
                    </div>
                    <span className="text-gray-800">
                      Contains {(field.children && Array.isArray(field.children) ? field.children.length : 0)} nested field{(field.children && Array.isArray(field.children) && field.children.length !== 1) ? 's' : ''}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Children */}
        {hasChildren && (
          <div className="mt-6 relative">
            {/* Horizontal Line for Multiple Children */}
            {field.children.length > 1 && (
              <div className="absolute left-8 top-0 w-0.5 h-6 bg-gradient-to-b from-gray-400 to-gray-300 rounded-full shadow-sm"></div>
            )}
            
            <div className="space-y-6">
              {field.children.map((child, index) => (
                <div key={child.treeId || `child-${index}-${Math.random()}`} className="relative">
                  {renderFieldNode(child, index === field.children.length - 1)}
                </div>
              ))}
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
          {processedFields.length > 0 ? (
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
                  {Array.isArray(processedFields) && processedFields.map((field, index) => {
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
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <GitCommit className="w-16 h-16 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-600 mb-2">No Fields to Display</h3>
              <p className="text-gray-500">Add some nested fields to see the visual structure.</p>
            </div>
          )}
        </div>
      </div>

      {/* Field Edit Popup */}
      {showFieldPopup && editingField && (
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
      )}
    </div>
  )
}

export default FieldVisualTreeModal 