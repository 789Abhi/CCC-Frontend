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
            id: `${field.name}-${level}-${index}`,
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
    setEditingField(field)
    setEditingPath(field.path)
    setShowFieldPopup(true)
  }

  const handleFieldUpdate = (updatedField) => {
    // Update the field in the processed fields structure
    const updateFieldInStructure = (fields, path, updatedField) => {
      const [currentIndex, ...remainingPath] = path
      
      if (remainingPath.length === 0) {
        // Update at current level
        return fields.map((f, i) => (i === currentIndex ? { ...f, ...updatedField } : f))
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
    
    setProcessedFields(prev => updateFieldInStructure(prev, editingPath, updatedField))
    
    // Call the parent update function
    onFieldUpdate(editingPath, updatedField)
    
    setShowFieldPopup(false)
    setEditingField(null)
    setEditingPath([])
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
        return "bg-blue-50 border-blue-200 text-blue-800"
      case "textarea":
        return "bg-green-50 border-green-200 text-green-800"
      case "image":
        return "bg-purple-50 border-purple-200 text-purple-800"
      case "repeater":
        return "bg-orange-50 border-orange-200 text-orange-800"
      case "wysiwyg":
        return "bg-indigo-50 border-indigo-200 text-indigo-800"
      case "color":
        return "bg-pink-50 border-pink-200 text-pink-800"
      case "select":
        return "bg-teal-50 border-teal-200 text-teal-800"
      case "checkbox":
        return "bg-yellow-50 border-yellow-200 text-yellow-800"
      case "radio":
        return "bg-red-50 border-red-200 text-red-800"
      default:
        return "bg-gray-50 border-gray-200 text-gray-800"
    }
  }

  const renderFieldNode = (field, isLast = false) => {
    const hasChildren = field.children && field.children.length > 0
    
    return (
      <div key={field.id} className="relative">
        {/* Field Box */}
        <div className={`relative group ${field.level > 0 ? 'ml-8' : ''}`}>
          {/* Connecting Line */}
          {field.level > 0 && (
            <div className="absolute left-0 top-1/2 w-6 h-px bg-gray-300 transform -translate-y-1/2"></div>
          )}
          
          {/* Vertical Line for Children */}
          {hasChildren && (
            <div className="absolute left-6 top-full w-px h-4 bg-gray-300"></div>
          )}
          
          {/* Field Card */}
          <div className={`relative border-2 rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-200 ${getFieldColor(field.type)}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{getFieldIcon(field.type)}</span>
                <div>
                  <h4 className="font-semibold text-gray-900">{field.label}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <code className="bg-white/50 px-2 py-1 rounded text-xs font-mono">{field.name}</code>
                    <span className="bg-white/50 px-2 py-1 rounded text-xs capitalize">{field.type}</span>
                  </div>
                </div>
              </div>
              
              <button
                onClick={() => handleEditField(field)}
                className="opacity-0 group-hover:opacity-100 p-2 text-gray-600 hover:text-blue-600 hover:bg-white/50 rounded-lg transition-all duration-200"
                title="Edit field"
              >
                <Edit className="w-4 h-4" />
              </button>
            </div>
            
            {/* Repeater Indicator */}
            {field.type === "repeater" && (
              <div className="mt-3 pt-3 border-t border-current/20">
                <div className="flex items-center gap-2 text-sm">
                  <GitBranch className="w-4 h-4" />
                  <span>Contains {field.children?.length || 0} nested fields</span>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Children */}
        {hasChildren && (
          <div className="mt-4 relative">
            {/* Horizontal Line for Multiple Children */}
            {field.children.length > 1 && (
              <div className="absolute left-6 top-0 w-px h-4 bg-gray-300"></div>
            )}
            
            <div className="space-y-4">
              {field.children.map((child, index) => (
                <div key={child.id} className="relative">
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
        <div className="p-6 h-[calc(90vh-120px)] overflow-y-auto">
          {processedFields.length > 0 ? (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg p-4 border border-emerald-200">
                <h4 className="text-sm font-medium text-emerald-800 mb-2">Field Hierarchy</h4>
                <p className="text-xs text-emerald-700">
                  Hover over any field card and click the edit icon to modify it directly. 
                  The visual structure shows the relationship between fields.
                </p>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <div className="space-y-6">
                  {processedFields.map((field, index) => (
                    <div key={field.id}>
                      {renderFieldNode(field, index === processedFields.length - 1)}
                    </div>
                  ))}
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