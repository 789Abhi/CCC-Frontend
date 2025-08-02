import React, { useState } from 'react'
import { Bot, Code, Copy, Check } from 'lucide-react'
import axios from 'axios'

const DesignChatGPTModal = ({ isOpen, onClose, component }) => {
  const [generatedDesign, setGeneratedDesign] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [copied, setCopied] = useState(false)
  const [generationStep, setGenerationStep] = useState("")

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
    
    component.fields.forEach(field => {
      const fieldName = field.name
      const fieldType = field.type
      const fieldLabel = field.label
      
      examples += `// ${fieldLabel} (${fieldType})\n`
      examples += `$${fieldName} = get_ccc_field('${fieldName}');\n`
      
      // Add type-specific examples
      if (fieldType === 'image') {
        examples += `// For image field, you can also get:\n`
        examples += `// $${fieldName}_url = get_ccc_field('${fieldName}', 'url');\n`
        examples += `// $${fieldName}_id = get_ccc_field('${fieldName}', 'id');\n`
      } else if (fieldType === 'textarea' || fieldType === 'wysiwyg') {
        examples += `// For ${fieldType} field:\n`
        examples += `// echo wp_kses_post($${fieldName}); // Safe HTML output\n`
      } else if (fieldType === 'select') {
        examples += `// For select field:\n`
        examples += `// $${fieldName}_label = get_ccc_field('${fieldName}', 'label');\n`
      }
      examples += "\n"
    })
    
    return examples
  }

  const generateChatGPTPrompt = () => {
    if (!component || !component.fields) return ""
    
    const fieldList = component.fields.map(field => 
      `- ${field.label} (${field.type}): ${field.name}`
    ).join('\n')
    
    const fieldExamples = generateFieldExamples()
    
    return `Create a modern, responsive HTML/CSS design for a WordPress component called "${component.name}".

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
9. Make it work well in WordPress themes

Please provide the complete HTML and CSS code that I can directly use in the WordPress component template.`
  }

  const openChatGPT = () => {
    const prompt = generateChatGPTPrompt()
    const encodedPrompt = encodeURIComponent(prompt)
    window.open(`https://chat.openai.com/?prompt=${encodedPrompt}`, '_blank')
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
              <li>1. Click "Open ChatGPT with Design Prompt" to go to ChatGPT with a pre-filled design request</li>
              <li>2. ChatGPT will generate HTML/CSS code based on your component's fields</li>
              <li>3. Copy the generated code and paste it into your component template file</li>
              <li>4. The template file is located at: <code className="bg-yellow-100 px-1 rounded">your-theme/ccc-templates/{component.handle_name}.php</code></li>
              <li>5. Use the PHP examples above to fetch your field data in the template</li>
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