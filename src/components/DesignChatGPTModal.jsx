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
    
    // Add comprehensive usage examples
    examples += "\n// ===== USAGE EXAMPLES =====\n\n"
    
    examples += "// Toggle/Checkbox fields\n"
    examples += "<?php if ($${component.fields.find(f => f.type === 'toggle')?.name || 'enable_title'}): ?>\n"
    examples += "    <h1><?php echo esc_html(${component.fields.find(f => f.type === 'text')?.name || 'title'}); ?></h1>\n"
    examples += "<?php endif; ?>\n\n"
    
    examples += "// Text and textarea fields\n"
    examples += "<h1><?php echo esc_html(${component.fields.find(f => f.type === 'textarea')?.name || 'text_area'}); ?></h1>\n\n"
    
    examples += "// Image field\n"
    examples += "<img src=\"<?php echo esc_url(${component.fields.find(f => f.type === 'image')?.name || 'image'}); ?>\" \n"
    examples += "     alt=\"<?php echo esc_attr(${component.fields.find(f => f.type === 'text')?.name || 'title'}); ?>\">\n\n"
    
    examples += "// Video field\n"
    examples += "<video controls>\n"
    examples += "    <source src=\"<?php echo esc_url(${component.fields.find(f => f.type === 'video')?.name || 'video'}); ?>\" type=\"video/mp4\">\n"
    examples += "    Your browser does not support the video tag.\n"
    examples += "</video>\n\n"
    
    examples += "// Oembed field\n"
    examples += "<div><?php echo ${component.fields.find(f => f.type === 'oembed')?.name || 'oembed'}; ?></div>\n\n"
    
    examples += "// Link fields\n"
    examples += "<!-- Normal link -->\n"
    examples += "<a href=\"<?php echo esc_url(${component.fields.find(f => f.type === 'link')?.name || 'link'}); ?>\">Link Text</a>\n\n"
    
    examples += "<!-- Link with target (opens in new tab) -->\n"
    examples += "<a href=\"<?php echo esc_url(${component.fields.find(f => f.type === 'link')?.name || 'link'}_target['url']); ?>\" \n"
    examples += "   <?php echo ${component.fields.find(f => f.type === 'link')?.name || 'link'}_target['target']; ?>>Link with Target</a>\n\n"
    
    examples += "// Email field\n"
    examples += "<a href=\"mailto:<?php echo esc_attr(${component.fields.find(f => f.type === 'email')?.name || 'email'}); ?>\">Email Us</a>\n\n"
    
    examples += "// Number and range fields\n"
    examples += "<a style=\"font-size:<?php echo esc_attr(${component.fields.find(f => f.type === 'range')?.name || 'range'}); ?>px\" \n"
    examples += "   href=\"tel:<?php echo esc_attr(${component.fields.find(f => f.type === 'number')?.name || 'number'}); ?>\">Call Us</a>\n\n"
    
    examples += "// File field\n"
    examples += "<a class=\"download-link\" target=\"_blank\" \n"
    examples += "   href=\"<?php echo esc_url(${component.fields.find(f => f.type === 'file')?.name || 'file'}); ?>\">Download File</a>\n\n"
    
    examples += "// Color field\n"
    examples += "<a style=\"color:<?php echo esc_attr(${component.fields.find(f => f.type === 'color')?.name || 'color'}_hover); ?>;\" \n"
    examples += "   target=\"_blank\" href=\"<?php echo esc_url(${component.fields.find(f => f.type === 'file')?.name || 'file'}); ?>\">Styled Download</a>\n\n"
    
    examples += "// Select field\n"
    examples += "<div>Select value: <?php echo esc_html(${component.fields.find(f => f.type === 'select')?.name || 'select'}); ?></div>\n"
    examples += "<div>Select string: <?php echo esc_html(${component.fields.find(f => f.type === 'select')?.name || 'select'}_string); ?></div>\n"
    examples += "<div>Select list: <?php echo ${component.fields.find(f => f.type === 'select')?.name || 'select'}_list; ?></div>\n\n"
    
    examples += "// Select field as array\n"
    examples += "<?php if (is_array(${component.fields.find(f => f.type === 'select')?.name || 'select'})): ?>\n"
    examples += "    <?php foreach (${component.fields.find(f => f.type === 'select')?.name || 'select'} as $value): ?>\n"
    examples += "        <?php echo esc_html($value) . ' '; ?>\n"
    examples += "    <?php endforeach; ?>\n"
    examples += "<?php else: ?>\n"
    examples += "    <?php echo esc_html(${component.fields.find(f => f.type === 'select')?.name || 'select'}); ?>\n"
    examples += "<?php endif; ?>\n\n"
    
    examples += "// Select field as list\n"
    examples += "<ul>\n"
    examples += "    <?php foreach (${component.fields.find(f => f.type === 'select')?.name || 'select'} as $value): ?>\n"
    examples += "        <li><?php echo esc_html($value); ?></li>\n"
    examples += "    <?php endforeach; ?>\n"
    examples += "</ul>\n\n"
    
    examples += "// Checkbox field\n"
    examples += "<ul>\n"
    examples += "    <?php foreach (${component.fields.find(f => f.type === 'checkbox')?.name || 'checkbox'} as $values): ?>\n"
    examples += "        <li><?php echo esc_html($values); ?></li>\n"
    examples += "    <?php endforeach; ?>\n"
    examples += "</ul>\n\n"
    
    examples += "// Radio field\n"
    examples += "<div><?php echo esc_html(${component.fields.find(f => f.type === 'radio')?.name || 'radio'}); ?></div>\n\n"
    
    examples += "// Gallery/Repeater field\n"
    examples += "<div class=\"gallery\">\n"
    examples += "    <?php if (${component.fields.find(f => f.type === 'gallery' || f.type === 'repeater')?.name || 'gallery'} && is_array(${component.fields.find(f => f.type === 'gallery' || f.type === 'repeater')?.name || 'gallery'})): ?>\n"
    examples += "        <?php foreach (${component.fields.find(f => f.type === 'gallery' || f.type === 'repeater')?.name || 'gallery'} as $gallery_item): ?>\n"
    examples += "            <?php \n"
    examples += "            // Fetch nested fields from each gallery item\n"
    examples += "            // Note: show is \"1\" or \"0\" (string), not boolean\n"
    examples += "            $show_image = isset($gallery_item['show']) && $gallery_item['show'] === \"1\";\n"
    examples += "            $image_url = isset($gallery_item['image']) ? $gallery_item['image'] : null;\n"
    examples += "            ?>\n"
    examples += "            <?php if ($show_image && $image_url): ?>\n"
    examples += "                <div class=\"gallery-item\">\n"
    examples += "                    <img src=\"<?php echo esc_url($image_url); ?>\" alt=\"Gallery Image\">\n"
    examples += "                </div>\n"
    examples += "            <?php endif; ?>\n"
    examples += "        <?php endforeach; ?>\n"
    examples += "    <?php else: ?>\n"
    examples += "        <p>No gallery data available</p>\n"
    examples += "    <?php endif; ?>\n"
    examples += "</div>\n\n"
    
    examples += "// Alternative gallery loop\n"
    examples += "<div class=\"gallery-grid\">\n"
    examples += "    <?php foreach(${component.fields.find(f => f.type === 'gallery' || f.type === 'repeater')?.name || 'gallery'} as $idx): ?>\n"
    examples += "        <div class=\"gallery-item\">\n"
    examples += "            <img src=\"<?php echo esc_url($idx['image']); ?>\" alt=\"Gallery Image\">\n"
    examples += "        </div>\n"
    examples += "    <?php endforeach; ?>\n"
    examples += "</div>\n\n"
    
    examples += "?>\n\n"
    
    examples += "<!-- HTML Structure Example -->\n"
    examples += "<div class=\"component-${component.handle_name || 'component'}\">\n"
    examples += "    <!-- Your HTML structure here using the PHP variables above -->\n"
    examples += "    <!-- Remember to use proper escaping: esc_html(), esc_url(), esc_attr() -->\n"
    examples += "    <!-- For HTML content, use wp_kses_post() instead of esc_html() -->\n"
    examples += "</div>\n"
    
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
        } else if (field.type === 'repeater' && field.children && field.children.length > 0) {
          fieldInfo += '\n  Nested fields:'
          field.children.forEach(nestedField => {
            fieldInfo += `\n    • ${nestedField.label} (${nestedField.type}): ${nestedField.name}`
          })
        }
        
        return fieldInfo
      }).join('\n')
    }
    
    const fieldList = generateFieldList(component.fields)
    
    // CSS Library specific instructions
    let cssLibraryInstructions = ""
    if (selectedCSSLibrary === "tailwind") {
      cssLibraryInstructions = `
CSS FRAMEWORK REQUIREMENTS - TAILWIND CSS:
- Use ONLY Tailwind CSS utility classes for styling
- Do NOT include any custom CSS unless absolutely necessary
- Use Tailwind's responsive prefixes (sm:, md:, lg:, xl:) for mobile-first design
- Utilize Tailwind's color palette, spacing, and typography utilities
- Include proper Tailwind classes for hover states, transitions, and animations
- Make sure all styling is done through Tailwind utility classes
- The design should work immediately with Tailwind CSS installed`
    } else if (selectedCSSLibrary === "bootstrap") {
      cssLibraryInstructions = `
CSS FRAMEWORK REQUIREMENTS - BOOTSTRAP:
- Use Bootstrap 5 classes and components extensively
- Utilize Bootstrap's grid system, utilities, and component classes
- Include proper Bootstrap responsive classes (col-sm, col-md, col-lg, col-xl)
- Use Bootstrap's built-in components like cards, buttons, alerts, etc.
- Apply Bootstrap's utility classes for spacing, colors, and typography
- Include Bootstrap's JavaScript components if needed (collapse, modal, etc.)
- The design should work immediately with Bootstrap CSS and JS included`
    } else {
      cssLibraryInstructions = `
CSS FRAMEWORK REQUIREMENTS - CUSTOM CSS:
- Create custom CSS using modern CSS features
- Use CSS Grid and Flexbox for layouts
- Include CSS custom properties (variables) for consistent theming
- Use modern CSS features like clamp(), min(), max() for responsive values
- Include proper CSS animations and transitions
- Use a mobile-first approach with media queries
- Ensure the CSS is self-contained and doesn't conflict with other styles`
    }
    
    let prompt = `Create a modern, responsive HTML/CSS design for a WordPress component called "${component.name}".

Component Description: ${component.description || 'A custom WordPress component'}

Available Fields:
${fieldList}

IMPORTANT REQUIREMENTS:
1. Create a complete HTML structure with proper semantic markup
2. Include modern CSS with responsive design (mobile-first approach)
3. Make it visually appealing and professional
4. Include hover effects and smooth transitions
5. Use modern CSS features like Flexbox/Grid
6. Ensure accessibility (proper ARIA labels, semantic HTML)
7. Add comments explaining the structure
8. Make it work well in WordPress themes
9. Make the design responsive and mobile-friendly
10. Use the exact field names from the component configuration

${cssLibraryInstructions}

Please provide the complete HTML and CSS code that I can directly use in the WordPress component template. Focus on creating beautiful, responsive HTML/CSS that works with the field names provided above.`

    // Add reference image instruction if image is uploaded
    if (referenceImage) {
      prompt += `\n\nDesign Reference: I have uploaded a reference image that shows the desired design style and layout. Please create a design that closely matches the visual style, layout structure, and overall aesthetic shown in the reference image.`
    }

    prompt += `\n\nPlease provide the complete HTML and CSS code that I can directly use in the WordPress component template.`
    
    return prompt
  }

  const openChatGPT = () => {
    const prompt = generateChatGPTPrompt()
    
    // Try to open ChatGPT with URL parameters first
    try {
      const chatGPTUrl = 'https://chat.openai.com?prompt=' + encodeURIComponent(prompt)
      
      // Check if URL is too long (browsers have limits)
      if (chatGPTUrl.length > 2000) {
        // URL too long, fall back to clipboard method
        copyToClipboard(prompt)
        showMessage('Prompt copied to clipboard! Opening ChatGPT...', 'success')
        window.open('https://chat.openai.com', '_blank')
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
                 <strong>Note:</strong> The prompt will automatically appear in ChatGPT when opened. If the prompt is too long, it will be copied to your clipboard as a fallback.
               </p>
             </div>

                     {/* Instructions */}
           <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
             <h3 className="font-semibold text-yellow-900 mb-2">How to Use</h3>
             <ol className="text-yellow-800 space-y-1 text-sm">
               <li>1. (Optional) Upload a reference image to match your desired design style</li>
               <li>2. Select your preferred CSS framework (Tailwind, Bootstrap, or Custom CSS)</li>
               <li>3. Click "Open ChatGPT with Design Prompt" to go to ChatGPT</li>
               <li>4. The prompt will automatically appear in ChatGPT (or be copied to clipboard if too long)</li>
               <li>5. Upload your reference image in ChatGPT if you have one</li>
               <li>6. ChatGPT will generate HTML/CSS code based on your component's fields, reference image, and selected CSS framework</li>
               <li>7. Copy the generated code and paste it into your component template file</li>
               <li>8. The template file is located at: <code className="bg-yellow-100 px-1 rounded">your-theme/ccc-templates/{component.handle_name}.php</code></li>
               <li>9. Use the PHP examples in the green box above for data fetching</li>
               <li>10. The examples include proper escaping, conditional logic, and field-specific handling</li>
               <li>11. Use the field names exactly as shown in the examples for your specific component</li>
               <li>12. The generated CSS will be compatible with your selected framework</li>
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