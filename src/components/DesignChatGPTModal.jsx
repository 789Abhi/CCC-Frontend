import React, { useState } from 'react'
import { Bot, Code, Copy, Check } from 'lucide-react'
import axios from 'axios'

const DesignChatGPTModal = ({ isOpen, onClose, component }) => {
  const [generatedDesign, setGeneratedDesign] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [copied, setCopied] = useState(false)
  const [generationStep, setGenerationStep] = useState("")
  const [referenceImage, setReferenceImage] = useState(null)
  const [imagePreview, setImagePreview] = useState("")

  const showMessage = (message, type = 'info') => {
    console.log(`${type.toUpperCase()}: ${message}`)
    if (type === 'success') {
      alert(`✅ ${message}`)
    } else if (type === 'error') {
      alert(`❌ ${message}`)
    }
  }

  const generateFieldExamples = () => {
    if (!component || !component.fields) return ""
    
    let examples = "// Example to Fetch component fields data\n"
    examples += `// Component: ${component.name}\n`
    examples += "// Available fields:\n"
    
    const processField = (field, prefix = '') => {
      const fieldName = field.name
      const fieldType = field.type
      const fieldLabel = field.label
      
      examples += `// ${fieldLabel} (${fieldType})\n`
      examples += `$${fieldName} = get_ccc_field('${fieldName}');\n`
      
      // Add type-specific examples
      if (fieldType === 'image') {
        examples += `// For image field:\n`
        examples += `// $${fieldName} = get_ccc_field('${fieldName}'); // Returns image URL by default\n`
        examples += `// $${fieldName}_id = get_ccc_field('${fieldName}', 'id'); // Get attachment ID\n`
      } else if (fieldType === 'textarea' || fieldType === 'wysiwyg') {
        examples += `// For ${fieldType} field:\n`
        examples += `// echo wp_kses_post($${fieldName}); // Safe HTML output\n`
      } else if (fieldType === 'select') {
        examples += `// For select field:\n`
        examples += `// $${fieldName}_label = get_ccc_field('${fieldName}', 'label');\n`
      } else if (fieldType === 'repeater') {
        examples += `// For repeater field:\n`
        examples += `// $${fieldName} = get_ccc_field('${fieldName}'); // Returns array of items\n`
        examples += `// foreach ($${fieldName} as $item) {\n`
        examples += `//   echo $item['nested_field_name'];\n`
        examples += `// }\n`
      }
      examples += "\n"
      
      // Process nested fields if this is a repeater
      if (fieldType === 'repeater' && field.config && field.config.nested_fields) {
        examples += `// Nested fields in ${fieldLabel} repeater:\n`
        field.config.nested_fields.forEach(nestedField => {
          examples += `// - ${nestedField.label} (${nestedField.type}): $item['${nestedField.name}']\n`
        })
        examples += "\n"
      }
    }
    
    component.fields.forEach(field => {
      processField(field)
    })
    
    return examples
  }

  const generateChatGPTPrompt = () => {
    if (!component || !component.fields) return ""
    
    const generateFieldList = (fields) => {
      return fields.map(field => {
        let fieldInfo = `- ${field.label} (${field.type}): ${field.name}`
        
        // Add nested fields for repeater
        if (field.type === 'repeater' && field.config && field.config.nested_fields) {
          fieldInfo += '\n  Nested fields:'
          field.config.nested_fields.forEach(nestedField => {
            fieldInfo += `\n    • ${nestedField.label} (${nestedField.type}): ${nestedField.name}`
          })
        }
        
        return fieldInfo
      }).join('\n')
    }
    
    const fieldList = generateFieldList(component.fields)
    const fieldExamples = generateFieldExamples()
    
    let prompt = `Create a modern, responsive HTML/CSS design for a WordPress component called "${component.name}".

Component Description: ${component.description || 'A custom WordPress component'}

Available Fields:
${fieldList}

PHP Data Fetching Examples:
${fieldExamples}

Requirements:
1. Create a complete HTML structure with proper semantic markup
2. Include modern CSS with responsive design (mobile-first approach)
3. Use the PHP field data examples provided above
4. Make it visually appealing and professional
5. Include hover effects and smooth transitions
6. Use modern CSS features like Flexbox/Grid
7. Ensure accessibility (proper ARIA labels, semantic HTML)
8. Add comments explaining the structure
9. Make it work well in WordPress themes`

    // Add reference image instruction if image is uploaded
    if (referenceImage) {
      prompt += `\n\nDesign Reference: I have uploaded a reference image that shows the desired design style and layout. Please create a design that closely matches the visual style, layout structure, and overall aesthetic shown in the reference image.`
    }

    prompt += `\n\nPlease provide the complete HTML and CSS code that I can directly use in the WordPress component template.`
    
    return prompt
  }

  const openChatGPT = () => {
    const prompt = generateChatGPTPrompt()
    
    if (referenceImage) {
      // If there's a reference image, we need to copy the prompt to clipboard
      // since ChatGPT URL doesn't support file uploads
      copyToClipboard(prompt)
      showMessage('Prompt copied to clipboard! Please paste it in ChatGPT and upload your reference image manually.', 'info')
      // Still open ChatGPT but without the prompt
      window.open('https://chat.openai.com', '_blank')
    } else {
      // No image, can use URL parameter
      const encodedPrompt = encodeURIComponent(prompt)
      window.open(`https://chat.openai.com/?prompt=${encodedPrompt}`, '_blank')
    }
  }

  const handleImageUpload = (event) => {
    const file = event.target.files[0]
    if (file) {
      if (file.type.startsWith('image/')) {
        setReferenceImage(file)
        const reader = new FileReader()
        reader.onload = (e) => {
          setImagePreview(e.target.result)
        }
        reader.readAsDataURL(file)
        showMessage('Reference image uploaded successfully!', 'success')
      } else {
        showMessage('Please select a valid image file.', 'error')
      }
    }
  }

  const removeReferenceImage = () => {
    setReferenceImage(null)
    setImagePreview("")
  }

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      showMessage('Design code copied to clipboard!', 'success')
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = text
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      showMessage('Design code copied to clipboard!', 'success')
    }
  }

  const handleClose = () => {
    setGeneratedDesign("")
    setIsGenerating(false)
    setGenerationStep("")
    setCopied(false)
    setReferenceImage(null)
    setImagePreview("")
    onClose()
  }

  if (!isOpen || !component) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center">
                <Code className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Design with ChatGPT</h2>
                <p className="text-gray-600">Generate HTML/CSS layout for "{component.name}"</p>
              </div>
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Component Info */}
          <div className="bg-gray-50 rounded-xl p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Component Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p><strong>Name:</strong> {component.name}</p>
                <p><strong>Handle:</strong> {component.handle_name}</p>
                <p><strong>Fields:</strong> {component.fields?.length || 0} field(s)</p>
              </div>
              <div>
                <p><strong>Description:</strong> {component.description || 'No description'}</p>
              </div>
            </div>
          </div>

          {/* Field List */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <h3 className="font-semibold text-blue-900 mb-3">Available Fields</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {component.fields?.map((field, index) => (
                <div key={index} className="bg-white rounded-lg p-3 border border-blue-200">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                      {field.type}
                    </span>
                    {field.required && (
                      <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs">Required</span>
                    )}
                  </div>
                  <p className="font-medium text-gray-900">{field.label}</p>
                  <p className="text-sm text-gray-600">Field name: {field.name}</p>
                  
                  {/* Show nested fields for repeater */}
                  {field.type === 'repeater' && field.config && field.config.nested_fields && (
                    <div className="mt-2 pt-2 border-t border-blue-100">
                      <p className="text-xs text-blue-700 font-medium mb-1">Nested Fields:</p>
                      {field.config.nested_fields.map((nestedField, nestedIndex) => (
                        <div key={nestedIndex} className="ml-2 mb-1">
                          <div className="flex items-center gap-1">
                            <span className="bg-green-100 text-green-800 px-1 py-0.5 rounded text-xs">
                              {nestedField.type}
                            </span>
                            {nestedField.required && (
                              <span className="bg-red-100 text-red-800 px-1 py-0.5 rounded text-xs">Required</span>
                            )}
                          </div>
                          <p className="text-xs text-gray-700">{nestedField.label}</p>
                          <p className="text-xs text-gray-500">Field name: {nestedField.name}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

                     {/* PHP Examples */}
           <div className="bg-green-50 border border-green-200 rounded-xl p-4">
             <h3 className="font-semibold text-green-900 mb-3">PHP Data Fetching Examples</h3>
             <div className="bg-white rounded-lg p-4 border border-green-200">
               <pre className="text-sm text-green-800 overflow-x-auto">
                 <code>{generateFieldExamples()}</code>
               </pre>
             </div>
           </div>

           {/* Reference Image Upload */}
           <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
             <h3 className="font-semibold text-orange-900 mb-3">Design Reference Image (Optional)</h3>
             <p className="text-orange-800 text-sm mb-3">
               Upload a reference image to help ChatGPT create a design that matches your desired style and layout.
             </p>
             
             {!imagePreview ? (
               <div className="border-2 border-dashed border-orange-300 rounded-lg p-6 text-center">
                 <input
                   type="file"
                   accept="image/*"
                   onChange={handleImageUpload}
                   className="hidden"
                   id="reference-image-upload"
                 />
                 <label
                   htmlFor="reference-image-upload"
                   className="cursor-pointer flex flex-col items-center gap-2"
                 >
                   <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                     <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                     </svg>
                   </div>
                   <span className="text-orange-700 font-medium">Click to upload reference image</span>
                   <span className="text-orange-600 text-sm">PNG, JPG, GIF up to 5MB</span>
                 </label>
               </div>
             ) : (
               <div className="relative">
                 <img
                   src={imagePreview}
                   alt="Reference design"
                   className="w-full max-w-md mx-auto rounded-lg border border-orange-200"
                 />
                 <button
                   onClick={removeReferenceImage}
                   className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-600 transition-colors"
                   title="Remove image"
                 >
                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                   </svg>
                 </button>
               </div>
             )}
           </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={openChatGPT}
              className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors"
            >
              <Bot className="h-5 w-5" />
              Open ChatGPT with Design Prompt
            </button>
            <button
              onClick={() => copyToClipboard(generateChatGPTPrompt())}
              className="flex items-center gap-2 px-6 py-3 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-colors"
            >
              {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
              {copied ? 'Copied!' : 'Copy Prompt'}
            </button>
          </div>

                     {/* Instructions */}
           <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
             <h3 className="font-semibold text-yellow-900 mb-2">How to Use</h3>
             <ol className="text-yellow-800 space-y-1 text-sm">
               <li>1. (Optional) Upload a reference image to match your desired design style</li>
               <li>2. Click "Open ChatGPT with Design Prompt" to go to ChatGPT</li>
               <li>3. If you uploaded an image: Paste the copied prompt and upload your reference image manually</li>
               <li>4. If no image: The prompt will be pre-filled automatically</li>
               <li>5. ChatGPT will generate HTML/CSS code based on your component's fields and reference image</li>
               <li>6. Copy the generated code and paste it into your component template file</li>
               <li>7. The template file is located at: <code className="bg-yellow-100 px-1 rounded">your-theme/ccc-templates/{component.handle_name}.php</code></li>
               <li>8. Use the PHP examples above to fetch your field data in the template</li>
             </ol>
           </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 bg-gray-50 border-t border-gray-200 flex-shrink-0">
          <button
            onClick={handleClose}
            className="px-6 py-3 text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default DesignChatGPTModal 