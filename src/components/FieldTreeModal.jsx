"use client"

import { useState, useEffect } from "react"
import { Treebeard } from "react-treebeard"
import { X, Edit, Eye, ChevronRight, ChevronDown } from "lucide-react"
import FieldPopup from "./FieldPopup"

function FieldTreeModal({ isOpen, fields, onClose, onFieldUpdate }) {
  const [treeData, setTreeData] = useState(null)
  const [cursor, setCursor] = useState(null)
  const [showFieldPopup, setShowFieldPopup] = useState(false)
  const [editingField, setEditingField] = useState(null)
  const [editingPath, setEditingPath] = useState([])

  // Convert fields to tree structure
  useEffect(() => {
    if (fields && fields.length > 0) {
      const convertToTree = (fieldList, path = []) => {
        return fieldList.map((field, index) => {
          const currentPath = [...path, index]
          const node = {
            id: field.name + index,
            name: field.label,
            fieldName: field.name,
            type: field.type,
            field: field,
            path: currentPath,
            toggled: false,
            children: []
          }

          // Add children for repeater fields
          if (field.type === "repeater" && field.config?.nested_fields) {
            node.children = convertToTree(field.config.nested_fields, currentPath)
          }

          return node
        })
      }

      const tree = {
        name: "Nested Fields",
        toggled: true,
        children: convertToTree(fields)
      }

      setTreeData(tree)
    }
  }, [fields])

  const onToggle = (node, toggled) => {
    if (cursor) {
      cursor.active = false
    }
    node.active = true
    if (node.children) {
      node.toggled = toggled
    }
    setCursor(node)
    setTreeData(Object.assign({}, treeData))
  }

  const handleEditField = (node) => {
    setEditingField(node.field)
    setEditingPath(node.path)
    setShowFieldPopup(true)
  }

  const handleFieldUpdate = (updatedField) => {
    // Update the field in the tree structure
    const updateFieldInTree = (nodes, path, updatedField) => {
      const [currentIndex, ...remainingPath] = path
      
      if (remainingPath.length === 0) {
        // Update the current level
        nodes[currentIndex] = {
          ...nodes[currentIndex],
          name: updatedField.label,
          fieldName: updatedField.name,
          type: updatedField.type,
          field: updatedField
        }
        
        // Update children if it's a repeater
        if (updatedField.type === "repeater" && updatedField.config?.nested_fields) {
          nodes[currentIndex].children = updatedField.config.nested_fields.map((field, index) => ({
            id: field.name + index,
            name: field.label,
            fieldName: field.name,
            type: field.type,
            field: field,
            path: [...path, index],
            toggled: false,
            children: []
          }))
        }
      } else {
        // Navigate deeper into the tree
        if (nodes[currentIndex].children) {
          updateFieldInTree(nodes[currentIndex].children, remainingPath, updatedField)
        }
      }
    }

    // Update the tree data
    const newTreeData = { ...treeData }
    updateFieldInTree(newTreeData.children, editingPath, updatedField)
    setTreeData(newTreeData)

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

  const customDecorators = {
    Header: ({ style, node }) => {
      const icon = node.children ? (node.toggled ? "📁" : "📂") : getFieldIcon(node.type)
      return (
        <div style={style.base} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
          <div className="flex items-center gap-2">
            <span className="text-lg">{icon}</span>
            <div>
              <div className="font-medium text-gray-800">{node.name}</div>
              <div className="text-xs text-gray-500 flex items-center gap-2">
                <code className="bg-gray-100 px-1 rounded text-xs">{node.fieldName}</code>
                <span className="bg-blue-100 text-blue-800 px-1 rounded text-xs capitalize">{node.type}</span>
              </div>
            </div>
          </div>
          {node.field && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleEditField(node)
              }}
              className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
              title="Edit field"
            >
              <Edit className="w-4 h-4" />
            </button>
          )}
        </div>
      )
    },
    Toggle: ({ style, node }) => {
      if (!node.children) return null
      return (
        <div style={style.base} className="flex items-center justify-center w-6 h-6">
          {node.toggled ? (
            <ChevronDown className="w-4 h-4 text-gray-500" />
          ) : (
            <ChevronRight className="w-4 h-4 text-gray-500" />
          )}
        </div>
      )
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-gray-100">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-6 rounded-t-2xl text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -mr-16 -mt-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full -ml-12 -mb-12"></div>
          </div>
          
          <div className="flex justify-between items-center relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <Eye className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Field Tree Structure</h3>
                <p className="text-sm text-white/80 mt-1">
                  View and edit nested fields in a hierarchical structure
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

        {/* Tree Content */}
        <div className="p-6 h-[calc(90vh-120px)] overflow-y-auto">
          {treeData ? (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Field Hierarchy</h4>
                <p className="text-xs text-gray-500">
                  Click on the edit icon next to any field to modify it directly. 
                  Expand/collapse nodes to see nested fields.
                </p>
              </div>
              
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <Treebeard
                  data={treeData}
                  onToggle={onToggle}
                  decorators={{
                    ...Treebeard.decorators,
                    ...customDecorators
                  }}
                  style={{
                    tree: {
                      base: {
                        listStyle: 'none',
                        backgroundColor: 'white',
                        margin: 0,
                        padding: '10px',
                        color: '#9DA5AB',
                        fontFamily: 'inherit',
                        fontSize: '14px'
                      },
                      node: {
                        base: {
                          position: 'relative'
                        },
                        link: {
                          cursor: 'pointer',
                          position: 'relative',
                          padding: '0px 5px',
                          display: 'block'
                        },
                        activeLink: {
                          background: '#31363F'
                        },
                        toggle: {
                          base: {
                            position: 'relative',
                            display: 'inline-block',
                            verticalAlign: 'top',
                            marginLeft: '-5px',
                            height: '24px',
                            width: '24px'
                          },
                          wrapper: {
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            margin: '-7px 0 0 -7px',
                            height: '14px'
                          },
                          height: 10,
                          width: 10,
                          arrow: {
                            fill: '#7A8087',
                            strokeWidth: 0
                          }
                        },
                        header: {
                          base: {
                            display: 'inline-block',
                            verticalAlign: 'top',
                            color: '#9DA5AB'
                          },
                          connector: {
                            width: '2px',
                            height: '12px',
                            borderLeft: 'solid 2px black',
                            borderBottom: 'solid 2px black',
                            position: 'absolute',
                            top: '0px',
                            left: '-21px'
                          },
                          title: {
                            lineHeight: '24px',
                            verticalAlign: 'middle'
                          }
                        },
                        subtree: {
                          listStyle: 'none',
                          paddingLeft: '19px'
                        },
                        loading: {
                          color: '#E2C089'
                        }
                      }
                    }
                  }}
                />
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <Eye className="w-16 h-16 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-600 mb-2">No Fields to Display</h3>
              <p className="text-gray-500">Add some nested fields to see the tree structure.</p>
            </div>
          )}
        </div>
      </div>

      {/* Field Edit Popup */}
      {showFieldPopup && editingField && (
        <FieldPopup
          componentId={null}
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

export default FieldTreeModal 