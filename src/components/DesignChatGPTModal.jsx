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
  const [selectedCSSLibrary, setSelectedCSSLibrary] = useState("custom") // New state for CSS library selection
  const [showHowToUse, setShowHowToUse] = useState(false)

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
    
    // Debug logging
    console.log("DesignChatGPTModal: Component data:", component)
    console.log("DesignChatGPTModal: Fields:", component.fields)
    
    let examples = "// Complete PHP Template Example for Component: " + component.name + "\n"
    examples += "// Copy this code to your template file: your-theme/ccc-templates/" + (component.handle_name || 'component') + ".php\n\n"
    
    examples += "<?php\n"
    examples += "// Fetch all component fields\n"
    
    const processField = (field, prefix = '') => {
      const fieldName = field.name
      const fieldType = field.type
      const fieldLabel = field.label
      
      examples += `// ${fieldLabel} (${fieldType})\n`
      
      // Basic field fetching
      if (fieldType === 'toggle' || fieldType === 'checkbox') {
        examples += `$${fieldName} = get_ccc_field('${fieldName}');\n`
        examples += `$${fieldName}_string = get_ccc_select_values('${fieldName}', null, null, 'string');\n`
        examples += `$${fieldName}_list = get_ccc_select_values('${fieldName}', null, null, 'list');\n`
      } else if (fieldType === 'image') {
        examples += `$${fieldName} = get_ccc_field('${fieldName}'); // Returns image URL\n`
        examples += `$${fieldName}_id = get_ccc_field('${fieldName}', 'id'); // Get attachment ID\n`
      } else if (fieldType === 'link') {
        examples += `$${fieldName} = get_ccc_field('${fieldName}'); // Returns link URL\n`
        examples += `$${fieldName}_target = get_ccc_field_target('${fieldName}'); // Returns array with url, target, title\n`
      } else if (fieldType === 'color') {
        examples += `$${fieldName} = get_ccc_field('${fieldName}'); // Returns color value\n`
        examples += `$${fieldName}_main = get_ccc_field_color('${fieldName}'); // Returns main color\n`
        examples += `$${fieldName}_hover = get_ccc_field_hover_color('${fieldName}'); // Returns hover color\n`
        examples += `$${fieldName}_adjusted = get_ccc_field_adjusted_color('${fieldName}'); // Returns adjusted color\n`
      } else if (fieldType === 'select') {
        examples += `$${fieldName} = get_ccc_field('${fieldName}'); // Returns selected value(s)\n`
        examples += `$${fieldName}_string = get_ccc_select_values('${fieldName}', null, null, 'string');\n`
        examples += `$${fieldName}_list = get_ccc_select_values('${fieldName}', null, null, 'list');\n`
      } else if (fieldType === 'gallery' || fieldType === 'repeater') {
        examples += `$${fieldName} = get_ccc_field('${fieldName}'); // Returns array of items\n`
      } else {
        examples += `$${fieldName} = get_ccc_field('${fieldName}');\n`
      }
      
      examples += "\n"
      
      // Process nested fields if this is a repeater
      if (fieldType === 'repeater' && field.config && field.config.nested_fields) {
        console.log(`DesignChatGPTModal: Found nested fields in ${fieldLabel}:`, field.config.nested_fields)
        examples += `// Nested fields in ${fieldLabel} repeater:\n`
        field.config.nested_fields.forEach(nestedField => {
          examples += `// - ${nestedField.label} (${nestedField.type}): $item['${nestedField.name}']\n`
        })
        examples += "\n"
      } else if (fieldType === 'repeater' && field.children && field.children.length > 0) {
        console.log(`DesignChatGPTModal: Found children in ${fieldLabel}:`, field.children)
        examples += `// Nested fields in ${fieldLabel} repeater:\n`
        field.children.forEach(nestedField => {
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
        let fieldInfo = `${field.label} (${field.type}): ${field.name}`
        
        // Add nested fields for repeater
        if (field.type === 'repeater' && field.config && field.config.nested_fields) {
          fieldInfo += ` [nested: ${field.config.nested_fields.map(nf => nf.name).join(', ')}]`
        } else if (field.type === 'repeater' && field.children && field.children.length > 0) {
          fieldInfo += ` [nested: ${field.children.map(nf => nf.name).join(', ')}]`
        }
        
        return fieldInfo
      }).join('\n')
    }
    
    const fieldList = generateFieldList(component.fields)
    
    // CSS Library specific instructions (condensed)
    let cssInstructions = ""
    if (selectedCSSLibrary === "tailwind") {
      cssInstructions = "Use ONLY Tailwind CSS utility classes, mobile-first design, responsive prefixes (sm:, md:, lg:)"
    } else if (selectedCSSLibrary === "bootstrap") {
      cssInstructions = "Use Bootstrap 5 classes extensively, grid system, responsive classes (col-sm, col-md, col-lg)"
    } else {
      cssInstructions = "Create custom CSS with modern features, Flexbox/Grid, CSS variables, mobile-first approach"
    }
    
    let prompt = `Create a modern responsive HTML/CSS layout for WordPress component "${component.name}".

Fields: ${fieldList}

CSS: ${cssInstructions}

PHP Data Fetching: Use ONLY these functions to get field values:
- get_ccc_field('field_name') - for basic field values (text, image, video, file, email, number, range, gallery, checkbox, radio, oembed)
- get_ccc_field_target('field_name') - for link fields (returns array with url, target, title)
- get_ccc_field_color('field_name') - for color fields (returns main color)
- get_ccc_field_hover_color('field_name') - for hover colors
- get_ccc_field_adjusted_color('field_name') - for adjusted colors
- get_ccc_select_values('field_name', null, null, 'string') - for select/toggle/checkbox fields (string format)
- get_ccc_select_values('field_name', null, null, 'list') - for select/toggle/checkbox fields (list format)

IMPORTANT TEMPLATE STRUCTURE:
1. First: Initialize all variables and fetch field values using the functions above
2. Second: Create the HTML section structure with proper semantic markup
3. Third: Add the CSS styling section at the end

Follow this exact order: Variables → HTML → CSS. Create a professional layout that ChatGPT thinks would work best for this component type.`


    
    return prompt
  }

  const openChatGPT = () => {
    const prompt = generateChatGPTPrompt()
    
    // Try to open ChatGPT with URL parameters first
    try {
      // Use the correct ChatGPT URL format that actually works
      const chatGPTUrl = 'https://chat.openai.com/?prompt=' + encodeURIComponent(prompt)
      
      // Check if URL is too long (ChatGPT has limits around 2000-3000 chars)
      if (chatGPTUrl.length > 2500) {
        // URL too long, try to optimize the prompt
        const optimizedPrompt = generateOptimizedPrompt()
        const optimizedUrl = 'https://chat.openai.com/?prompt=' + encodeURIComponent(optimizedPrompt)
        
        if (optimizedUrl.length <= 2500) {
          // Optimized prompt fits, use it
          window.open(optimizedUrl, '_blank')
          showMessage('Opening ChatGPT with optimized prompt pre-filled!', 'success')
        } else {
          // Even optimized is too long, fall back to clipboard method
          copyToClipboard(prompt)
          showMessage('Prompt copied to clipboard! Opening ChatGPT...', 'success')
          window.open('https://chat.openai.com', '_blank')
        }
      } else {
        // URL is fine, open with prompt pre-filled
        window.open(chatGPTUrl, '_blank')
        showMessage('Opening ChatGPT with your prompt pre-filled!', 'success')
      }
    } catch (error) {
      // Fallback to clipboard method
      copyToClipboard(prompt)
      showMessage('Prompt copied to clipboard! Opening ChatGPT...', 'success')
      window.open('https://chat.openai.com', '_blank')
    }
  }

  const generateOptimizedPrompt = () => {
    if (!component || !component.fields) return ""
    
    // Create a more concise prompt that still includes all essential information
    const fieldList = component.fields.map(field => {
      let fieldInfo = `${field.label} (${field.type}): ${field.name}`
      
      // Add nested fields for repeater (condensed)
      if (field.type === 'repeater' && field.config && field.config.nested_fields) {
        fieldInfo += ` [nested: ${field.config.nested_fields.map(nf => nf.name).join(', ')}]`
      } else if (field.type === 'repeater' && field.children && field.children.length > 0) {
        fieldInfo += ` [nested: ${field.children.map(nf => nf.name).join(', ')}]`
      }
      
      return fieldInfo
    }).join('\n')
    
    // CSS Library specific instructions (condensed)
    let cssInstructions = ""
    if (selectedCSSLibrary === "tailwind") {
      cssInstructions = "Use ONLY Tailwind CSS utility classes, mobile-first design, responsive prefixes (sm:, md:, lg:)"
    } else if (selectedCSSLibrary === "bootstrap") {
      cssInstructions = "Use Bootstrap 5 classes extensively, grid system, responsive classes (col-sm, col-md, col-lg)"
    } else {
      cssInstructions = "Create custom CSS with modern features, Flexbox/Grid, CSS variables, mobile-first approach"
    }
    
    let optimizedPrompt = `Create modern responsive HTML/CSS for WordPress component "${component.name}".

Fields: ${fieldList}

CSS: ${cssInstructions}

PHP Data Fetching: Use ONLY these functions to get field values:
- get_ccc_field('field_name') - for basic field values (text, image, video, file, email, number, range, gallery, checkbox, radio, oembed)
- get_ccc_field_target('field_name') - for link fields (returns array with url, target, title)
- get_ccc_field_color('field_name') - for color fields (returns main color)
- get_ccc_field_hover_color('field_name') - for hover colors
- get_ccc_field_adjusted_color('field_name') - for adjusted colors
- get_ccc_select_values('field_name', null, null, 'string') - for select/toggle/checkbox fields (string format)
- get_ccc_select_values('field_name', null, null, 'list') - for select/toggle/checkbox fields (list format)

TEMPLATE STRUCTURE: Variables → HTML → CSS. First fetch all field values, then create HTML structure, then add CSS styling.

Include complete HTML/CSS code with field names: ${component.fields.map(f => f.name).join(', ')}`


    
    return optimizedPrompt
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
    setSelectedCSSLibrary("custom") // Reset CSS library selection
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
                 <button
                   onClick={() => setShowHowToUse(true)}
                   className="mt-2 text-sm text-purple-600 hover:text-purple-700 underline"
                 >
                   How to Use
                 </button>
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
                   {(field.type === 'repeater' && field.config && field.config.nested_fields) || 
                    (field.type === 'repeater' && field.children && field.children.length > 0) ? (
                     <div className="mt-2 pt-2 border-t border-blue-100">
                       <p className="text-xs text-blue-700 font-medium mb-1">Nested Fields:</p>
                       {(field.config?.nested_fields || field.children || []).map((nestedField, nestedIndex) => (
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
                   ) : null}
                </div>
              ))}
            </div>
          </div>



            {/* CSS Library Selection */}
            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
              <h3 className="font-semibold text-indigo-900 mb-3">CSS Framework Selection</h3>
              <p className="text-indigo-800 text-sm mb-3">
                Choose your preferred CSS framework to generate designs that work with your existing setup.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Tailwind CSS Option */}
                <label className="relative cursor-pointer">
                  <input
                    type="radio"
                    name="css-library"
                    value="tailwind"
                    checked={selectedCSSLibrary === "tailwind"}
                    onChange={(e) => setSelectedCSSLibrary(e.target.value)}
                    className="sr-only"
                  />
                  <div className={`p-4 rounded-lg border-2 transition-all ${
                    selectedCSSLibrary === "tailwind" 
                      ? "border-indigo-500 bg-indigo-100" 
                      : "border-indigo-200 bg-white hover:border-indigo-300"
                  }`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        selectedCSSLibrary === "tailwind" 
                          ? "border-indigo-500 bg-indigo-500" 
                          : "border-indigo-300"
                      }`}>
                        {selectedCSSLibrary === "tailwind" && (
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">Tailwind CSS</div>
                        <div className="text-sm text-gray-600">Utility-first CSS framework</div>
                      </div>
                    </div>
                  </div>
                </label>

                {/* Bootstrap Option */}
                <label className="relative cursor-pointer">
                  <input
                    type="radio"
                    name="css-library"
                    value="bootstrap"
                    checked={selectedCSSLibrary === "bootstrap"}
                    onChange={(e) => setSelectedCSSLibrary(e.target.value)}
                    className="sr-only"
                  />
                  <div className={`p-4 rounded-lg border-2 transition-all ${
                    selectedCSSLibrary === "bootstrap" 
                      ? "border-indigo-500 bg-indigo-100" 
                      : "border-indigo-200 bg-white hover:border-indigo-300"
                  }`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        selectedCSSLibrary === "bootstrap" 
                          ? "border-indigo-500 bg-indigo-500" 
                          : "border-indigo-300"
                      }`}>
                        {selectedCSSLibrary === "bootstrap" && (
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">Bootstrap</div>
                        <div className="text-sm text-gray-600">Component-based CSS framework</div>
                      </div>
                    </div>
                  </div>
                </label>

                {/* Custom CSS Option */}
                <label className="relative cursor-pointer">
                  <input
                    type="radio"
                    name="css-library"
                    value="custom"
                    checked={selectedCSSLibrary === "custom"}
                    onChange={(e) => setSelectedCSSLibrary(e.target.value)}
                    className="sr-only"
                  />
                  <div className={`p-4 rounded-lg border-2 transition-all ${
                    selectedCSSLibrary === "custom" 
                      ? "border-indigo-500 bg-indigo-100" 
                      : "border-indigo-200 bg-white hover:border-indigo-300"
                  }`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        selectedCSSLibrary === "custom" 
                          ? "border-indigo-500 bg-indigo-500" 
                          : "border-indigo-300"
                      }`}>
                        {selectedCSSLibrary === "custom" && (
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">Custom CSS</div>
                        <div className="text-sm text-gray-600">Vanilla CSS with modern features</div>
                      </div>
                    </div>
                  </div>
                </label>
              </div>
              
              <div className="mt-3 p-3 bg-indigo-100 rounded-lg">
                <p className="text-sm text-indigo-800">
                  <strong>Selected:</strong> {selectedCSSLibrary === "tailwind" ? "Tailwind CSS - Will generate utility classes" : 
                                           selectedCSSLibrary === "bootstrap" ? "Bootstrap - Will generate Bootstrap classes and components" : 
                                           "Custom CSS - Will generate vanilla CSS with modern features"}
                </p>
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
            
                                                   {/* Clipboard Note */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> The prompt will automatically appear in ChatGPT when opened. For very long prompts, an optimized version will be used. If still too long, it will be copied to your clipboard as a fallback.
                </p>
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

       {/* How to Use Modal */}
       {showHowToUse && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
           <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
             {/* Header */}
             <div className="p-6 border-b border-gray-200 flex-shrink-0">
               <div className="flex items-center justify-between">
                 <h2 className="text-2xl font-bold text-gray-900">How to Use Design with ChatGPT</h2>
                 <button
                   onClick={() => setShowHowToUse(false)}
                   className="text-gray-400 hover:text-gray-600 transition-colors"
                 >
                   <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                   </svg>
                 </button>
               </div>
             </div>

             {/* Content */}
             <div className="flex-1 overflow-y-auto p-6">
               <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                 <ol className="text-yellow-800 space-y-3 text-sm">
                   <li className="flex items-start gap-3">
                     <span className="bg-yellow-200 text-yellow-800 px-2 py-1 rounded-full text-xs font-bold min-w-[20px] text-center">1</span>
                     <span>Select your preferred CSS framework (Tailwind, Bootstrap, or Custom CSS)</span>
                   </li>
                   <li className="flex items-start gap-3">
                     <span className="bg-yellow-200 text-yellow-800 px-2 py-1 rounded-full text-xs font-bold min-w-[20px] text-center">2</span>
                     <span>Click "Open ChatGPT with Design Prompt" to go to ChatGPT</span>
                   </li>
                   <li className="flex items-start gap-3">
                     <span className="bg-yellow-200 text-yellow-800 px-2 py-1 rounded-full text-xs font-bold min-w-[20px] text-center">3</span>
                     <span>The prompt will automatically appear in ChatGPT input field (optimized version used if needed)</span>
                   </li>
                   <li className="flex items-start gap-3">
                     <span className="bg-yellow-200 text-yellow-800 px-2 py-1 rounded-full text-xs font-bold min-w-[20px] text-center">4</span>
                     <span>ChatGPT will generate HTML/CSS code based on your component's fields and selected CSS framework</span>
                   </li>
                   <li className="flex items-start gap-3">
                     <span className="bg-yellow-200 text-yellow-800 px-2 py-1 rounded-full text-xs font-bold min-w-[20px] text-center">5</span>
                     <span>Copy the generated code and paste it into your component template file</span>
                   </li>
                   <li className="flex items-start gap-3">
                     <span className="bg-yellow-200 text-yellow-800 px-2 py-1 rounded-full text-xs font-bold min-w-[20px] text-center">6</span>
                     <span>The template file is located at: <code className="bg-yellow-100 px-1 rounded">your-theme/ccc-templates/{component.handle_name}.php</code></span>
                   </li>
                   <li className="flex items-start gap-3">
                     <span className="bg-yellow-200 text-yellow-800 px-2 py-1 rounded-full text-xs font-bold min-w-[20px] text-center">7</span>
                     <span>ChatGPT will provide PHP code examples for data fetching in the generated response</span>
                   </li>
                   <li className="flex items-start gap-3">
                     <span className="bg-yellow-200 text-yellow-800 px-2 py-1 rounded-full text-xs font-bold min-w-[20px] text-center">8</span>
                     <span>The generated PHP code will include proper escaping, conditional logic, and field-specific handling</span>
                   </li>
                   <li className="flex items-start gap-3">
                     <span className="bg-yellow-200 text-yellow-800 px-2 py-1 rounded-full text-xs font-bold min-w-[20px] text-center">9</span>
                     <span>Use the field names exactly as shown in the examples for your specific component</span>
                   </li>
                   <li className="flex items-start gap-3">
                     <span className="bg-yellow-200 text-yellow-800 px-2 py-1 rounded-full text-xs font-bold min-w-[20px] text-center">10</span>
                     <span>The generated CSS will be compatible with your selected framework</span>
                   </li>
                 </ol>
               </div>
             </div>

             {/* Footer */}
             <div className="flex justify-end gap-3 p-6 bg-gray-50 border-t border-gray-200 flex-shrink-0">
               <button
                 onClick={() => setShowHowToUse(false)}
                 className="px-6 py-3 text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
               >
                 Close
               </button>
             </div>
           </div>
         </div>
       )}
     </div>
   )
 }

export default DesignChatGPTModal 