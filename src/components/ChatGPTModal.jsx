import React, { useState } from 'react'
import { Bot } from 'lucide-react'

const ChatGPTModal = ({ isOpen, onClose, onComponentCreated }) => {
  const [chatGPTJson, setChatGPTJson] = useState("")
  const [isProcessingChatGPT, setIsProcessingChatGPT] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [parsedComponent, setParsedComponent] = useState(null)
  const [processingStep, setProcessingStep] = useState("")
  const [processingProgress, setProcessingProgress] = useState(0)

  const showMessage = (message, type = 'info') => {
    // You can implement your own toast/notification system here
    console.log(`${type.toUpperCase()}: ${message}`)
    if (type === 'success') {
      alert(`✅ ${message}`)
    } else if (type === 'error') {
      alert(`❌ ${message}`)
    }
  }

  const openChatGPT = () => {
    window.open('https://chat.openai.com', '_blank')
  }

  const validateAndParseChatGPTJson = () => {
    if (!chatGPTJson.trim()) {
      showMessage('Please paste the ChatGPT JSON response', 'error')
      return false
    }

    try {
      // Parse JSON to validate
      let componentData = JSON.parse(chatGPTJson)
      
      // Handle different JSON formats
      if (!componentData.component && !componentData.component_name) {
        throw new Error('JSON must contain component information')
      }

      // Normalize component data
      const normalizedComponent = {
        name: componentData.component?.name || componentData.component_name || 'Generated Component',
        handle: componentData.component?.handle || componentData.handle || 'generated_component',
        description: componentData.component?.description || componentData.description || ''
      }

      // Handle different field formats
      if (!componentData.fields || !Array.isArray(componentData.fields) || componentData.fields.length === 0) {
        throw new Error('Component must have at least one field')
      }

      // Normalize and validate fields
      const validFieldTypes = ['text', 'textarea', 'image', 'video', 'color', 'select', 'checkbox', 'radio', 'wysiwyg', 'repeater']
      const fieldTypeMapping = {
        'number': 'text',
        'email': 'text',
        'url': 'text',
        'tel': 'text',
        'password': 'text',
        'file': 'image',
        'image': 'image',
        'video': 'video',
        'color': 'color',
        'select': 'select',
        'dropdown': 'select',
        'checkbox': 'checkbox',
        'radio': 'radio',
        'wysiwyg': 'wysiwyg',
        'editor': 'wysiwyg',
        'repeater': 'repeater',
        'repeat': 'repeater'
      }

      const normalizedFields = componentData.fields.map((field, index) => {
        // Ensure required properties exist
        const normalizedField = {
          label: field.label || field.name || `Field ${index + 1}`,
          name: field.name || field.label?.toLowerCase().replace(/\s+/g, '_') || `field_${index + 1}`,
          type: field.type || 'text',
          required: field.required || false,
          placeholder: field.placeholder || '',
          config: {}
        }

        // Map field type to valid type
        const originalType = normalizedField.type.toLowerCase()
        if (fieldTypeMapping[originalType]) {
          normalizedField.type = fieldTypeMapping[originalType]
        } else if (!validFieldTypes.includes(originalType)) {
          normalizedField.type = 'text' // Default fallback
        }

        // Handle special field configurations
        if (normalizedField.type === 'select' && field.options) {
          normalizedField.config = { options: field.options }
        } else if (normalizedField.type === 'select' && (field.min || field.max)) {
          // Convert number range to select options
          const min = field.min || 1
          const max = field.max || 5
          const step = field.step || 1
          const options = []
          for (let i = min; i <= max; i += step) {
            options.push({ value: i.toString(), label: i.toString() })
          }
          normalizedField.config = { options }
        }

        // Handle additional field properties
        if (field.return_format) {
          normalizedField.config.return_format = field.return_format
        }

        return normalizedField
      })

      const finalComponentData = {
        component: normalizedComponent,
        fields: normalizedFields
      }

      setParsedComponent(finalComponentData)
      setShowConfirmation(true)
      return true
    } catch (error) {
      showMessage('Please check your JSON format and try again', 'error')
      return false
    }
  }

  const handleChatGPTJsonSubmit = async () => {
    if (!parsedComponent) {
      showMessage('No valid component data to create', 'error')
      return
    }

    setIsProcessingChatGPT(true)
    setProcessingStep("Initializing component creation...")
    setProcessingProgress(10)
    
    try {
      // Step 1: Create component
      setProcessingStep("Creating component...")
      setProcessingProgress(30)
      
      const componentResponse = await fetch('/wp-json/ccc/v1/components', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-WP-Nonce': window.wpApiSettings?.nonce || ''
        },
        body: JSON.stringify({
          name: parsedComponent.component.name,
          handle_name: parsedComponent.component.handle,
          description: parsedComponent.component.description || '',
          status: 'active'
        })
      })

      const componentData = await componentResponse.json()

      if (!componentData.success) {
        throw new Error(componentData.message || 'Failed to create component')
      }

      const componentId = componentData.data.id
      setProcessingStep("Component created successfully!")
      setProcessingProgress(50)
      
      // Step 2: Create fields
      setProcessingStep("Creating fields...")
      setProcessingProgress(60)
      
      let fieldsCreated = 0
      const totalFields = parsedComponent.fields.length
      
      for (const fieldData of parsedComponent.fields) {
        try {
          setProcessingStep(`Creating field ${fieldsCreated + 1} of ${totalFields}: ${fieldData.label}`)
          setProcessingProgress(60 + ((fieldsCreated + 1) / totalFields) * 30)
          
          const fieldResponse = await fetch('/wp-json/ccc/v1/fields', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-WP-Nonce': window.wpApiSettings?.nonce || ''
            },
            body: JSON.stringify({
              component_id: componentId,
              label: fieldData.label,
              name: fieldData.name,
              type: fieldData.type,
              required: fieldData.required || false,
              placeholder: fieldData.placeholder || '',
              config: fieldData.config ? JSON.stringify(fieldData.config) : '{}',
              order: fieldsCreated + 1
            })
          })
          
          const fieldResult = await fieldResponse.json()
          
          if (fieldResult.success) {
            fieldsCreated++
          }
        } catch (fieldError) {
          console.error('Error creating field:', fieldError)
        }
      }

      setProcessingStep("Finalizing...")
      setProcessingProgress(95)
      
      // Step 3: Success
      setProcessingStep("Component created successfully!")
      setProcessingProgress(100)
      
      // Wait a moment to show completion
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      showMessage(`Component "${parsedComponent.component.name}" created successfully with ${fieldsCreated} fields!`, 'success')
      handleClose()
      
      // Notify parent component to refresh
      if (onComponentCreated) {
        onComponentCreated()
      }
      
    } catch (error) {
      console.error('ChatGPT JSON processing error:', error)
      showMessage(error.message || 'Failed to process ChatGPT JSON', 'error')
    } finally {
      setIsProcessingChatGPT(false)
      setProcessingStep("")
      setProcessingProgress(0)
    }
  }

  const handleClose = () => {
    setShowConfirmation(false)
    setChatGPTJson("")
    setParsedComponent(null)
    setProcessingStep("")
    setProcessingProgress(0)
    onClose()
  }

  if (!isOpen) return null

  return (
    <>
      {/* Main ChatGPT Modal */}
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
          {/* Header - Fixed */}
          <div className="p-6 border-b border-gray-200 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bot className="h-8 w-8 text-green-600" />
                <h2 className="text-2xl font-bold text-gray-900">Create Component with ChatGPT</h2>
              </div>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Content - Scrollable */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <h3 className="font-semibold text-blue-900 mb-2">📖 How to Use:</h3>
              <ol className="text-blue-800 space-y-1 text-sm">
                <li>1. Click "Open ChatGPT" to go to ChatGPT in a new tab</li>
                <li>2. Ask: "Create a WordPress component for [your request] with JSON format"</li>
                <li>3. Copy the JSON response from ChatGPT</li>
                <li>4. Paste it in the textarea below</li>
                <li>5. Click "Update" to validate and create the component</li>
              </ol>
              
              <div className="mt-3 p-3 bg-white rounded-lg border border-blue-200">
                <p className="text-blue-900 font-medium mb-1">Example ChatGPT Prompt:</p>
                <p className="text-blue-800 text-sm">
                  "Create a WordPress component for testimonials. Include fields for customer name, testimonial content, customer photo, company name, and rating. Return the response in JSON format with component name, handle, description, and fields array."
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={openChatGPT}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Bot className="h-5 w-5" />
                Open ChatGPT
              </button>
              <a
                href="https://chat.openai.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Open in New Tab
              </a>
            </div>

            {/* JSON Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📋 Paste ChatGPT JSON Response:
              </label>
              <textarea
                value={chatGPTJson}
                onChange={(e) => setChatGPTJson(e.target.value)}
                placeholder={`{
  "component": {
    "name": "Component Name",
    "handle": "component_handle",
    "description": "Component description"
  },
  "fields": [
    {
      "label": "Field Label",
      "name": "field_name",
      "type": "text",
      "required": true,
      "placeholder": "Enter placeholder text"
    }
  ]
}`}
                className="w-full h-64 p-4 border border-gray-300 rounded-xl font-mono text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
              />
            </div>
          </div>

          {/* Footer - Fixed */}
          <div className="flex justify-end gap-3 p-6 bg-gray-50 border-t border-gray-200 flex-shrink-0">
            <button
              onClick={handleClose}
              className="px-6 py-3 text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={validateAndParseChatGPTJson}
              disabled={isProcessingChatGPT || !chatGPTJson.trim()}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Update
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmation && parsedComponent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-gray-900">Confirm Component Creation</h2>
              </div>
            </div>

            <div className="p-6">
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-2">Component Details:</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div><strong>Name:</strong> {parsedComponent.component.name}</div>
                  <div><strong>Handle:</strong> {parsedComponent.component.handle}</div>
                  <div><strong>Description:</strong> {parsedComponent.component.description || 'No description'}</div>
                  <div><strong>Fields:</strong> {parsedComponent.fields.length} field(s)</div>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-2">Fields Preview:</h3>
                <div className="max-h-48 overflow-y-auto space-y-2">
                  {parsedComponent.fields.map((field, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center gap-3">
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                          {field.type}
                        </span>
                        <span className="font-medium">{field.label}</span>
                        {field.required && (
                          <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs">Required</span>
                        )}
                      </div>
                      <span className="text-gray-500 text-sm">{field.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <svg className="h-5 w-5 text-yellow-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <div>
                    <p className="text-yellow-800 font-medium">Ready to Create</p>
                    <p className="text-yellow-700 text-sm mt-1">
                      This will create a new component with {parsedComponent.fields.length} fields. You can edit them later in the component list.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 p-6 bg-gray-50 border-t border-gray-200">
              <button
                onClick={() => setShowConfirmation(false)}
                className="px-6 py-3 text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleChatGPTJsonSubmit}
                className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors"
              >
                <Bot className="h-5 w-5" />
                Accept & Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Processing Modal */}
      {isProcessingChatGPT && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-8">
            <div className="text-center">
              {/* Animated Icon */}
              <div className="mb-6">
                <div className="relative">
                  <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                    <Bot className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="absolute inset-0 h-16 w-16 border-4 border-green-200 border-t-green-600 rounded-full animate-spin"></div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-6">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Creating Component...</span>
                  <span>{processingProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${processingProgress}%` }}
                  ></div>
                </div>
              </div>

              {/* Status Text */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Processing...</h3>
                <p className="text-gray-600 text-sm">{processingStep}</p>
              </div>

              {/* Loading Animation */}
              <div className="flex justify-center space-x-1">
                <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default ChatGPTModal 