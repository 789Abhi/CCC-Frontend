import React, { useState } from "react";
import { Bot, Zap, Loader2 } from "lucide-react";
import axios from "axios";

const ChatGPTModal = ({ isOpen, onClose, onComponentCreated }) => {
  const [chatGPTJson, setChatGPTJson] = useState("");
  const [isProcessingChatGPT, setIsProcessingChatGPT] = useState(false);
  const [isAutoGenerating, setIsAutoGenerating] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [parsedComponent, setParsedComponent] = useState(null);
  const [processingStep, setProcessingStep] = useState("");
  const [processingProgress, setProcessingProgress] = useState(0);
  const [contextPrompt, setContextPrompt] = useState("");
  const [hasRepeater, setHasRepeater] = useState(false);
  
  // Auto-generation state
  const [autoGenerationStep, setAutoGenerationStep] = useState("");
  const [autoGenerationProgress, setAutoGenerationProgress] = useState(0);
  const [useAutoGeneration, setUseAutoGeneration] = useState(false);
  const [showManualSection, setShowManualSection] = useState(false);
  const [isUsingCachedStructure, setIsUsingCachedStructure] = useState(false);
  const [licenseKey, setLicenseKey] = useState(""); // License key for AI generation

  // API Configuration
  const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
  
     // Persistent cache for component patterns to reduce API costs
   const getComponentCache = () => {
     try {
       const cached = localStorage.getItem('ccc_component_cache');
       return cached ? JSON.parse(cached) : {
                   // Empty patterns - no default components
          patterns: {},
         // User-created patterns (saved from successful AI generations)
         userPatterns: {}
       };
     } catch (error) {
       console.error("Error loading component cache:", error);
       return { patterns: {}, userPatterns: {} };
     }
   };

  const saveComponentCache = (cache) => {
    try {
      localStorage.setItem('ccc_component_cache', JSON.stringify(cache));
    } catch (error) {
      console.error("Error saving component cache:", error);
    }
  };

  const addUserPattern = (prompt, componentData) => {
    const cache = getComponentCache();
    const promptHash = btoa(prompt.toLowerCase().trim()).substring(0, 20); // Simple hash
    
    cache.userPatterns[promptHash] = {
      prompt: prompt.toLowerCase().trim(),
      component: componentData.component,
      fields: componentData.fields,
      created: new Date().toISOString()
    };
    
    saveComponentCache(cache);
  };

    // Load license key for AI generation
  React.useEffect(() => {
    // Clear any existing component cache to force API usage
    localStorage.removeItem('ccc_component_cache');
    
    // Load license key from WordPress options
    const loadLicenseKey = async () => {
      try {
        const formData = new FormData();
        formData.append("action", "ccc_get_license_key");
        formData.append("nonce", window.cccData.nonce);

        const response = await axios.post(window.cccData.ajaxUrl, formData);
        
        if (response.data.success && response.data.data.license_key) {
          setLicenseKey(response.data.data.license_key);
        }
      } catch (error) {
        console.error("Error loading license key:", error);
      }
    };
    
    loadLicenseKey();
  }, []);


  // Progress bar animation functions
  const startProgressAnimation = (targetProgress, duration = 2000) => {
    setIsProgressAnimating(true);
    const startProgress = autoGenerationProgress;
    const progressIncrement = (targetProgress - startProgress) / (duration / 50); // Update every 50ms
    let currentProgress = startProgress;
    
    const interval = setInterval(() => {
      currentProgress += progressIncrement;
      if (currentProgress >= targetProgress) {
        setAutoGenerationProgress(targetProgress);
        clearInterval(interval);
        setIsProgressAnimating(false);
      } else {
        setAutoGenerationProgress(currentProgress);
      }
    }, 50);
    
    setProgressInterval(interval);
  };

  const stopProgressAnimation = () => {
    if (progressInterval) {
      clearInterval(progressInterval);
      setProgressInterval(null);
    }
    setIsProgressAnimating(false);
  };

  const resetProgress = () => {
    stopProgressAnimation();
    setAutoGenerationProgress(0);
    setAutoGenerationStep("");
  };

  // Simple animated progress function
  const animateProgress = (from, to, duration = 1000) => {
    return new Promise((resolve) => {
      const startTime = Date.now();
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const currentValue = from + (to - from) * progress;
        
        setAutoGenerationProgress(currentValue);
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          resolve();
        }
      };
      animate();
    });
  };


  const showMessage = (message, type = "info") => {
    // You can implement your own toast/notification system here
    console.log(`${type.toUpperCase()}: ${message}`);
    if (type === "success") {
      alert(`✅ ${message}`);
    } else if (type === "error") {
      alert(`❌ ${message}`);
    } else if (type === "info") {
      alert(`ℹ️ ${message}`);
    }
  };

           // Detect component patterns (both default and user-created)
    const detectComponentPattern = (prompt) => {
      // Always return null to force API usage - no cache detection
      return null;
    };

  // Generate cached component structure
  const generateCachedComponent = (detection) => {
    const cache = getComponentCache();
    
    if (detection.type === 'user') {
      return {
        component: detection.pattern.component,
        fields: detection.pattern.fields
      };
    } else if (detection.type === 'default') {
      const pattern = cache.patterns[detection.pattern];
      
      // Format fields to match the expected structure
      const formattedFields = pattern.fields.map(field => {
        const formattedField = {
          label: field.label,
          name: field.name,
          type: field.type,
          required: field.required,
          placeholder: field.placeholder || "",
          config: {}
        };
        
        // Handle select fields with options
        if (field.type === 'select' && field.options) {
          formattedField.config.options = field.options;
        }
        
        // Handle number fields
        if (field.type === 'number') {
          formattedField.config = {
            number_type: field.number_type || "normal",
            min: field.min,
            max: field.max,
            step: field.step
          };
        }
        
        // Handle email fields
        if (field.type === 'email') {
          formattedField.config = {};
        }
        
        // Handle password fields
        if (field.type === 'password') {
          formattedField.config = {};
        }
        
        // Handle file fields
        if (field.type === 'file') {
          formattedField.config = {
            allowed_types: ['image', 'video', 'document', 'audio', 'archive'],
            max_file_size: 25,
            return_type: 'url',
            show_preview: true,
            show_download: true,
            show_delete: true
          };
        }
        
        // Handle link fields
        if (field.type === 'link') {
          formattedField.config = {
            link_types: ['internal', 'external'],
            default_type: 'internal',
            post_types: ['post', 'page'],
            show_target: true,
            show_title: true
          };
        }
        
        // Handle image fields
        if (field.type === 'image') {
          formattedField.config = {
            return_type: 'url'
          };
        }
        
        // Handle video fields
        if (field.type === 'video') {
          formattedField.config = {
            return_type: 'url',
            sources: ['file', 'youtube', 'vimeo', 'url'],
            player_options: {
              controls: true,
              autoplay: false,
              muted: false,
              loop: false,
              download: true
            }
          };
        }
        
        // Handle wysiwyg fields
        if (field.type === 'wysiwyg') {
          formattedField.config = {
            editor_settings: {
              media_buttons: true,
              teeny: false,
              textarea_rows: 10
            }
          };
        }
        
        // Handle checkbox fields
        if (field.type === 'checkbox') {
          formattedField.config = {
            options: field.options || [],
            multiple: true
          };
        }
        
        // Handle radio fields
        if (field.type === 'radio') {
          formattedField.config = {
            options: field.options || [],
            multiple: false
          };
        }
        
        // Handle range fields
        if (field.type === 'range') {
          formattedField.config = {
            min_value: field.min || 0,
            max_value: field.max || 100,
            prepend: field.prepend || '',
            append: field.append || ''
          };
        }
        
                 // Handle color fields
         if (field.type === 'color') {
           formattedField.config = {
             default_value: field.default_value || '#000000',
             enable_opacity: field.enable_opacity || false,
             return_format: field.return_format || 'hex'
           };
         }
         
         // Handle oembed fields
         if (field.type === 'oembed') {
           formattedField.config = {};
         }
         
         return formattedField;
      });
      
      return {
        component: {
          name: pattern.name,
          handle: pattern.handle,
          description: pattern.description
        },
        fields: formattedFields
      };
    }
    
    return null;
  };

  // Generate the auto-generation prompt (for debugging)
  const generateAutoGenerationPrompt = () => {
    if (!contextPrompt.trim()) {
      return "Please describe what component you want to create";
    }

    // Check if this is a map-related request and provide a specific prompt
    const lowerPrompt = contextPrompt.toLowerCase();
    if (lowerPrompt.includes('map') || lowerPrompt.includes('location') || lowerPrompt.includes('address')) {
      return `Create a WordPress component for a map section with contact information.

Based on this description: ${contextPrompt}

Please generate a JSON response with the following EXACT structure:
{
  "component": {
    "name": "Map Section",
    "handle": "map_section",
    "description": "Map section with contact information and embedded map"
  },
  "fields": [
    {
      "label": "Heading",
      "name": "heading",
      "type": "text",
      "required": true,
      "placeholder": "Enter section heading"
    },
    {
      "label": "Description",
      "name": "description",
      "type": "textarea",
      "required": false,
      "placeholder": "Enter section description"
    },
    {
      "label": "Phone Number",
      "name": "phone_number",
      "type": "number",
      "required": true,
      "placeholder": "Enter phone number"
    },
    {
      "label": "Email Address",
      "name": "email_address",
      "type": "email",
      "required": true,
      "placeholder": "Enter email address"
    },
    {
      "label": "Address",
      "name": "address",
      "type": "textarea",
      "required": true,
      "placeholder": "Enter full address"
    },
    {
      "label": "Map Embed",
      "name": "map_embed",
      "type": "oembed",
      "required": true,
      "placeholder": "Enter Google Maps embed code or URL"
    }
  ]
}

IMPORTANT: 
- Return ONLY the JSON response, no additional text or explanations
- Use the EXACT structure shown above
- Do not include any extra fields like "export_date", "version", "components" array, etc.
- The response should be a single component object, not an array of components

Please return ONLY the JSON response, no additional text or explanations.`;
    }

    return `Create a WordPress component based on this description: ${contextPrompt}

Please generate a JSON response with the following EXACT structure:
{
  "component": {
    "name": "Component Name",
    "handle": "component_handle",
    "description": "Component description"
  },
  "fields": [
    {
      "label": "Field Label",
      "name": "field_name",
      "type": "field_type",
      "required": true/false,
      "placeholder": "Placeholder text"
    }
  ]
}

Available field types: text, textarea, image, video, color, select, checkbox, radio, wysiwyg, link, repeater, oembed, email, number, password, file, range

IMPORTANT: 
- Return ONLY the JSON response, no additional text or explanations
- Use the EXACT structure shown above
- Do not include any extra fields like "export_date", "version", "components" array, etc.
- The response should be a single component object, not an array of components

${hasRepeater ? 'IMPORTANT: This component needs to support multiple instances (repeater field). Please include a repeater field with nested children fields.' : ''}

Please return ONLY the JSON response, no additional text or explanations.`;
  };

  // Auto-generation function using backend API
  const generateComponentWithAI = async () => {
    if (!contextPrompt.trim()) {
      showMessage("Please describe what component you want to create", "error");
      return;
    }

    // Check if license key is available
    if (!licenseKey) {
      showMessage("Please configure your license key first", "error");
      return;
    }

    setIsAutoGenerating(true);
    setAutoGenerationStep("Analyzing component requirements...");
    setAutoGenerationProgress(10);

    try {
      setAutoGenerationStep("Generating component with AI...");
      setAutoGenerationProgress(20);
      
      setAutoGenerationStep("Sending request to AI service...");
      setAutoGenerationProgress(40);

      // Call WordPress AJAX to get OpenAI key and generate component
      const response = await axios.post(window.cccData.ajaxUrl, new URLSearchParams({
        action: 'ccc_generate_component_with_ai',
        nonce: window.cccData.nonce,
        prompt: contextPrompt,
        site_url: window.location.origin
      }), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        }
      });

      setAutoGenerationStep("Processing AI response...");
      setAutoGenerationProgress(60);

      if (!response.data.success) {
        throw new Error(response.data.message || "AI generation failed");
      }

      setAutoGenerationStep("Parsing AI response...");
      setAutoGenerationProgress(70);

      // Get the component data from response
      const jsonData = response.data.data.component;
      
      if (!jsonData || !jsonData.component || !jsonData.fields || !Array.isArray(jsonData.fields)) {
        throw new Error("Invalid component structure received from AI");
      }

      console.log("=== DEBUG: AI Response Before Normalization ===");
      console.log("Raw AI response:", jsonData);
      console.log("==========================================");

      setParsedComponent(jsonData);

      setAutoGenerationStep("Validating component structure...");
      setAutoGenerationProgress(80);

      // Auto-create the component - but first normalize the data
      const normalizedData = validateAndParseChatGPTJson(jsonData);
      if (!normalizedData.isValid) {
        throw new Error("Failed to normalize component data");
      }
      
      console.log("=== DEBUG: Normalized Data Before Processing ===");
      console.log("Normalized data:", normalizedData.data);
      console.log("==========================================");
      
      setAutoGenerationStep("Creating component in WordPress...");
      setAutoGenerationProgress(90);
      
      await processChatGPTJson(normalizedData.data);

      setAutoGenerationStep("Component created successfully!");
      setAutoGenerationProgress(100);

      showMessage("Component generated and created successfully!", "success");
    } catch (error) {
      console.error("AI generation error:", error);
      
      if (error.response?.status === 401) {
        showMessage("Invalid license key. Please check your license key.", "error");
      } else if (error.response?.status === 503) {
        showMessage("AI service not configured by administrator. Please contact support.", "error");
      } else if (error.response?.status === 429) {
        showMessage("Rate limit exceeded. Please try again later.", "error");
      } else if (error.response?.status === 402) {
        showMessage("Insufficient AI credits. Please contact administrator.", "error");
      } else if (error.message.includes("No response received from AI")) {
        showMessage("AI service temporarily unavailable. Please try again later.", "error");
      } else {
        showMessage(`AI generation failed: ${error.message}`, "error");
      }
    } finally {
      setIsAutoGenerating(false);
      setAutoGenerationStep("");
      setAutoGenerationProgress(0);
    }
  };

  const generateChatGPTPrompt = () => {
    if (!contextPrompt.trim()) {
      showMessage("Please describe what component you want to create", "error");
      return null;
    }

    let prompt = `Create a WordPress component for: ${contextPrompt}

Please create a JSON response with the following structure:
{
  "component": {
    "name": "Component Name",
    "handle": "component_handle",
    "description": "Component description"
  },
  "fields": [
    {
      "label": "Field Label",
      "name": "field_name",
      "type": "field_type",
      "required": true/false,
      "placeholder": "Placeholder text"
    }
  ]
}`;

    if (hasRepeater) {
      prompt += `

IMPORTANT: This component needs to support multiple instances (repeater field). Please include a repeater field with nested children fields. The structure should be:
{
  "label": "Component Name",
  "name": "component_name",
  "type": "repeater",
  "children": [
    {
      "label": "Nested Field Label",
      "name": "nested_field_name",
      "type": "field_type",
      "required": true/false
    }
  ]
}

Make sure to include all the necessary fields as children of the repeater field.`;
    }

    prompt += `

Available field types: text, textarea, image, video, color, select, checkbox, radio, wysiwyg, link, repeater, oembed, email, number, password, file, range
Please return ONLY the JSON response, no additional text.`;

    return prompt;
  };

  const copyToClipboard = async (text) => {
    try {
      // Try modern clipboard API first
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        showMessage("Prompt copied to clipboard!", "success");
        return;
      }

      // Fallback for older browsers or non-secure contexts
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      textArea.style.top = "-999999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();

      try {
        document.execCommand("copy");
        showMessage("Prompt copied to clipboard!", "success");
      } catch (err) {
        // If execCommand fails, show the text in an alert for manual copy
        showMessage(`Please copy this prompt manually:\n\n${text}`, "info");
      }

      document.body.removeChild(textArea);
    } catch (err) {
      // Final fallback - show text in alert
      showMessage(`Please copy this prompt manually:\n\n${text}`, "info");
    }
  };

  const openChatGPT = () => {
    const prompt = generateChatGPTPrompt();
    if (!prompt) return;

    // Show manual section
    setShowManualSection(true);

    // Encode the prompt for URL
    const encodedPrompt = encodeURIComponent(prompt);

    // Open ChatGPT with pre-filled prompt
    window.open(`https://chat.openai.com/?prompt=${encodedPrompt}`, "_blank");
  };

  const openChatGPTManually = () => {
    // Show manual section
    setShowManualSection(true);
    
    // Just open ChatGPT with blank page - no copying
    window.open("https://chat.openai.com", "_blank");
  };

  const validateAndParseChatGPTJson = (jsonData = null) => {
    // Use passed jsonData or fall back to state
    const dataToValidate = jsonData || chatGPTJson;
    
    if (!dataToValidate) {
      showMessage("Please paste the ChatGPT JSON response", "error");
      return { isValid: false, data: null };
    }

    try {
      // Parse JSON to validate
      let componentData;
      
      if (typeof dataToValidate === 'string') {
        componentData = JSON.parse(dataToValidate);
      } else {
        componentData = dataToValidate;
      }

      // Handle different JSON formats
      if (!componentData.component && !componentData.component_name) {
        throw new Error("JSON must contain component information");
      }

      // Normalize component data
      const normalizedComponent = {
        name:
          componentData.component?.name ||
          componentData.component_name ||
          "Generated Component",
        handle:
          componentData.component?.handle ||
          componentData.handle ||
          "generated_component",
        description:
          componentData.component?.description ||
          componentData.description ||
          "",
      };

      // Handle different field formats
      if (
        !componentData.fields ||
        !Array.isArray(componentData.fields) ||
        componentData.fields.length === 0
      ) {
        throw new Error("Component must have at least one field");
      }

      // Normalize and validate fields
      const validFieldTypes = [
        "text",
        "textarea",
        "image",
        "video",
        "color",
        "select",
        "checkbox",
        "radio",
        "wysiwyg",
        "repeater",
        "link",
        "number",
        "email",
        "password",
        "file",
        "range",
        "oembed",
      ];
             const fieldTypeMapping = {
         // Number fields
         number: "number",
         phone: "number",
         phone_number: "number",
         telephone: "number",
         tel: "number",
         
         // Email fields
         email: "email",
         e_mail: "email",
         
         // Password fields
         password: "password",
         pass: "password",
         
         // URL/Link fields
         url: "link",
         link: "link",
         Link: "link",
         website: "link",
         web: "link",
         
         // File fields
         file: "file",
         upload: "file",
         attachment: "file",
         
         // Image fields
         image: "image",
         img: "image",
         photo: "image",
         picture: "image",
         
         // Video fields
         video: "video",
         movie: "video",
         
         // Color fields
         color: "color",
         colour: "color",
         
         // Select fields
         select: "select",
         dropdown: "select",
         choice: "select",
         
         // Checkbox fields
         checkbox: "checkbox",
         check: "checkbox",
         
         // Radio fields
         radio: "radio",
         radio_button: "radio",
         
         // WYSIWYG fields
         wysiwyg: "wysiwyg",
         editor: "wysiwyg",
         rich_text: "wysiwyg",
         content: "wysiwyg",
         page_content: "wysiwyg",
         body: "wysiwyg",
         main_content: "wysiwyg",
         article_content: "wysiwyg",
         post_content: "wysiwyg",
         text_content: "wysiwyg",
         
         // Repeater fields
         repeater: "repeater",
         repeat: "repeater",
         repeatable: "repeater",
         
         // Range fields
         range: "range",
         slider: "range",
         
         // oEmbed fields
         oembed: "oembed",
         o_embed: "oembed",
         embed: "oembed",
         embedded: "oembed",
         
         // Text fields (fallback)
         text: "text",
         string: "text",
         input: "text",
       };

      const normalizedFields = componentData.fields.map((field, index) => {
        // Ensure required properties exist
        const normalizedField = {
          label: field.label || field.name || `Field ${index + 1}`,
          name:
            field.name ||
            field.label?.toLowerCase().replace(/\s+/g, "_") ||
            `field_${index + 1}`,
          type: field.type || "text",
          required: field.required || false,
          placeholder: field.placeholder || "",
          config: field.config || {}, // Ensure config always exists
        };

                 // Map field type to valid type
         const originalType = normalizedField.type.toLowerCase();
         if (fieldTypeMapping[originalType]) {
           normalizedField.type = fieldTypeMapping[originalType];
         } else if (!validFieldTypes.includes(originalType)) {
           normalizedField.type = "text"; // Default fallback
         }

         // Intelligent field type detection based on field name and context
         const fieldName = normalizedField.name.toLowerCase();
         const fieldLabel = normalizedField.label.toLowerCase();
         
         // Map description fields to textarea
         if (fieldName.includes('description') || fieldLabel.includes('description')) {
           normalizedField.type = "textarea";
         }
         
         // Map content fields to WYSIWYG editor
         if (fieldName.includes('content') || fieldLabel.includes('content') ||
             fieldName.includes('body') || fieldLabel.includes('body') ||
             fieldName.includes('article') || fieldLabel.includes('article') ||
             fieldName.includes('post') || fieldLabel.includes('post') ||
             fieldName.includes('main') || fieldLabel.includes('main')) {
           normalizedField.type = "wysiwyg";
         }
         
         // Map long text fields to textarea (if placeholder suggests long content)
         if (normalizedField.placeholder && normalizedField.placeholder.length > 50) {
           if (normalizedField.type === "text") {
             normalizedField.type = "textarea";
           }
         }

        // Handle special field configurations
        if (normalizedField.type === "select" && field.options) {
          normalizedField.config = { options: field.options };
        } else if (
          normalizedField.type === "select" &&
          (field.min || field.max)
        ) {
          // Convert number range to select options
          const min = field.min || 1;
          const max = field.max || 5;
          const step = field.step || 1;
          const options = [];
          for (let i = min; i <= max; i += step) {
            options.push({ value: i.toString(), label: i.toString() });
          }
          normalizedField.config = { options };
        } else if (normalizedField.type === "number") {
          // Handle number field configuration (including phone number)
          normalizedField.config = {
            number_type: field.number_type || field.phone ? "phone" : "normal",
            min: field.min || field.minimum,
            max: field.max || field.maximum,
            step: field.step || field.increment,
          };
        } else if (normalizedField.type === "video") {
          // Handle video field configuration
          normalizedField.config = {
            return_type: 'url',
            sources: ['file', 'youtube', 'vimeo', 'url'],
            player_options: {
              controls: true,
              autoplay: false,
              muted: false,
              loop: false,
              download: true
            }
          };
        } else if (normalizedField.type === "color") {
          // Handle color field configuration
          normalizedField.config = {
            default_value: field.default_value || '#000000',
            enable_opacity: field.enable_opacity || false,
            return_format: field.return_format || 'hex'
          };
        } else if (normalizedField.type === "link") {
          // Handle link field configuration
          normalizedField.config = {
            link_types: ['internal', 'external'],
            default_type: 'internal',
            post_types: ['post', 'page'],
            show_target: true,
            show_title: true
          };
                 } else if (normalizedField.type === "repeater") {
           // Handle repeater field - if it has children or fields, use them as nested fields
           const nestedFieldArray = field.children || field.fields;
           if (nestedFieldArray && Array.isArray(nestedFieldArray)) {
             console.log("=== DEBUG: Processing Repeater Nested Fields ===");
             console.log("Original field:", field);
             console.log("Nested field array:", nestedFieldArray);
             
             const nestedFields = nestedFieldArray.map((child, childIndex) => {
               const nestedField = {
                 label:
                   child.label || child.name || `Nested Field ${childIndex + 1}`,
                 name:
                   child.name ||
                   child.label?.toLowerCase().replace(/\s+/g, "_") ||
                   `nested_field_${childIndex + 1}`,
                 type: fieldTypeMapping[child.type?.toLowerCase()] || "text",
                 required: child.required || false,
                 placeholder: child.placeholder || "",
                 config: {},
               };

               // Intelligent field type detection for nested fields
               const nestedFieldName = nestedField.name.toLowerCase();
               const nestedFieldLabel = nestedField.label.toLowerCase();
               
               // Map description fields to textarea
               if (nestedFieldName.includes('description') || nestedFieldLabel.includes('description')) {
                 nestedField.type = "textarea";
               }
               
               // Map content fields to WYSIWYG editor
               if (nestedFieldName.includes('content') || nestedFieldLabel.includes('content') ||
                   nestedFieldName.includes('body') || nestedFieldLabel.includes('body') ||
                   nestedFieldName.includes('article') || nestedFieldLabel.includes('article') ||
                   nestedFieldName.includes('post') || nestedFieldLabel.includes('post') ||
                   nestedFieldName.includes('main') || nestedFieldLabel.includes('main')) {
                 nestedField.type = "wysiwyg";
               }
               
               // Map long text fields to textarea (if placeholder suggests long content)
               if (nestedField.placeholder && nestedField.placeholder.length > 50) {
                 if (nestedField.type === "text") {
                   nestedField.type = "textarea";
                 }
               }

               // Handle nested field configurations
               if (nestedField.type === "number") {
                 nestedField.config = {
                   number_type: child.number_type || child.phone ? "phone" : "normal",
                   min: child.min || child.minimum,
                   max: child.max || child.maximum,
                   step: child.step || child.increment,
                 };
               } else if (nestedField.type === "image") {
                 nestedField.config = {
                   return_type: 'url'
                 };
               } else if (nestedField.type === "color") {
                 nestedField.config = {
                   default_value: child.default_value || '#000000',
                   enable_opacity: child.enable_opacity || false,
                   return_format: child.return_format || 'hex'
                 };
               } else if (nestedField.type === "link") {
                 nestedField.config = {
                   link_types: ['internal', 'external'],
                   default_type: 'internal',
                   post_types: ['post', 'page'],
                   show_target: true,
                   show_title: true
                 };
               } else if (nestedField.type === "wysiwyg") {
                 nestedField.config = {
                   editor_settings: {
                     media_buttons: true,
                     teeny: false,
                     textarea_rows: 10,
                     toolbar: 'full',
                     plugins: 'wordcount,wpemoji,wplink,wptextpattern,wpautoresize'
                   }
                 };
               }

               console.log(`Nested field ${childIndex + 1}:`, nestedField);
               return nestedField;
             });

             // Store nested fields in the config for the repeater field
             normalizedField.config = {
               nested_fields: nestedFields,
             };
             
             console.log("Final normalized field config:", normalizedField.config);
             console.log("==========================================");
           } else {
             console.log("=== DEBUG: No Nested Fields Found ===");
             console.log("Original field:", field);
             console.log("No children or fields array found");
             console.log("==========================================");
             // If no children specified, create default nested fields based on the component context
             normalizedField.config = {
               nested_fields: [
                 {
                   label: "Image",
                   name: "image",
                   type: "image",
                   required: false,
                   placeholder: "Upload an image",
                   config: { return_type: 'url' }
                 },
                 {
                   label: "Heading",
                   name: "heading",
                   type: "text",
                   required: true,
                   placeholder: "Enter heading",
                   config: {}
                 },
                 {
                   label: "Description",
                   name: "description",
                   type: "textarea",
                   required: true,
                   placeholder: "Enter description",
                   config: {}
                 },
                 {
                   label: "Year",
                   name: "year",
                   type: "text",
                   required: true,
                   placeholder: "Enter year",
                   config: {}
                 },
                 {
                   label: "Background Color",
                   name: "background_color",
                   type: "color",
                   required: false,
                   placeholder: "Select background color",
                   config: {
                     default_value: '#000000',
                     enable_opacity: false,
                     return_format: 'hex'
                   }
                 },
                 {
                   label: "Overlay",
                   name: "overlay",
                   type: "color",
                   required: false,
                   placeholder: "Select overlay color",
                   config: {
                     default_value: '#000000',
                     enable_opacity: true,
                     return_format: 'hex'
                   }
                 }
               ]
             };
           }
         }

        // Handle additional field properties
        if (field.return_format) {
          normalizedField.config.return_format = field.return_format;
        }

        return normalizedField;
      });

                    // Store the parsed component data
       const parsedData = {
         component: normalizedComponent,
         fields: normalizedFields,
       };
       setParsedComponent(parsedData);

       console.log("=== DEBUG: Validation Complete ===");
       console.log("Normalized component:", normalizedComponent);
       console.log("Normalized fields:", normalizedFields);
       console.log("Final parsed data:", parsedData);
       console.log("==========================================");

       return { isValid: true, data: parsedData };
     } catch (error) {
       console.error("JSON validation error:", error);
       showMessage("Please check your JSON format and try again", "error");
       return { isValid: false, data: null };
    }
  };

  const processChatGPTJson = async (componentData = null) => {
    // Use passed componentData or fall back to state
    const currentParsedComponent = componentData || parsedComponent;
    
    console.log("=== DEBUG: processChatGPTJson Called ===");
    console.log("Component data passed:", componentData);
    console.log("Current parsed component:", currentParsedComponent);
    console.log("==========================================");
    
    if (!currentParsedComponent) {
      showMessage("No valid component data to create", "error");
      return;
    }

    setIsProcessingChatGPT(true);
    setProcessingStep("Creating component...");
    setProcessingProgress(10);

    try {
      // Step 1: Create the component
      setProcessingStep("Creating component...");
      setProcessingProgress(20);

             const componentFormData = new FormData();
       componentFormData.append("action", "ccc_create_component");
       componentFormData.append("name", currentParsedComponent.component.name);
       componentFormData.append("handle", currentParsedComponent.component.handle);
      componentFormData.append("nonce", window.cccData.nonce);

      const componentResponse = await axios.post(
        window.cccData.ajaxUrl,
        componentFormData
      );

      if (!componentResponse.data.success) {
        throw new Error(
          componentResponse.data.message || "Failed to create component"
        );
      }

      // Get the component ID
      let componentId = null;
      if (componentResponse.data.data && componentResponse.data.data.id) {
        componentId = componentResponse.data.data.id;
      } else if (componentResponse.data.id) {
        componentId = componentResponse.data.id;
      } else if (componentResponse.data.component_id) {
        componentId = componentResponse.data.component_id;
      } else {
        // Fallback: try to get the component ID by querying for the component we just created
        try {
          const searchFormData = new FormData();
          searchFormData.append("action", "ccc_get_components");
          searchFormData.append("nonce", window.cccData.nonce);

          const searchResponse = await axios.post(
            window.cccData.ajaxUrl,
            searchFormData
          );
                     if (searchResponse.data.success && searchResponse.data.data) {
             const foundComponent = searchResponse.data.data.find(
               (comp) =>
                 comp.name === currentParsedComponent.component.name ||
                 comp.label === currentParsedComponent.component.name
             );
            if (foundComponent) {
              componentId = foundComponent.id;
            }
          }
        } catch (searchError) {
          console.error("Error searching for component:", searchError);
        }

        if (!componentId) {
          throw new Error("Component created but no ID returned from server");
        }
      }

      setProcessingStep("Creating fields...");
      setProcessingProgress(50);

             // Step 2: Create fields
       let fieldsCreated = 0;
       for (const fieldData of currentParsedComponent.fields) {
         console.log("=== DEBUG: Processing Field ===");
         console.log("Field data:", fieldData);
         console.log("Field type:", fieldData.type);
         console.log("Field config:", fieldData.config);
         console.log("==========================================");
         
         setProcessingStep(`Creating field: ${fieldData.label}...`);
         setProcessingProgress(50 + (fieldsCreated / currentParsedComponent.fields.length) * 40);

                 try {
           const fieldFormData = new FormData();
           fieldFormData.append("action", "ccc_add_field");
           fieldFormData.append("component_id", componentId);
           fieldFormData.append("label", fieldData.label);
           fieldFormData.append("name", fieldData.name);
           fieldFormData.append("type", fieldData.type);
           fieldFormData.append("required", fieldData.required ? "1" : "0");
           fieldFormData.append("placeholder", fieldData.placeholder || "");
           fieldFormData.append("nonce", window.cccData.nonce);

           // Ensure fieldData has config property
           if (!fieldData.config) {
             fieldData.config = {};
           }

           // Handle field configuration
           if (fieldData.config && Object.keys(fieldData.config).length > 0) {
             fieldFormData.append("field_config", JSON.stringify(fieldData.config));
           }

                     // Handle repeater fields with nested fields
           if (fieldData.type === "repeater" && fieldData.config && fieldData.config.nested_fields) {
             console.log("=== DEBUG: Repeater Field Nested Fields ===");
             console.log("Field data:", fieldData);
             console.log("Nested fields:", fieldData.config.nested_fields);
             fieldFormData.append("nested_field_definitions", JSON.stringify(fieldData.config.nested_fields));
             console.log("Nested field definitions appended to form data");
             console.log("==========================================");
           } else if (fieldData.type === "repeater") {
             console.log("=== DEBUG: Repeater Field Missing Nested Fields ===");
             console.log("Field data:", fieldData);
             console.log("Field config:", fieldData.config);
             console.log("Nested fields property:", fieldData.config?.nested_fields);
             console.log("==========================================");
           }

          const fieldResponse = await axios.post(
            window.cccData.ajaxUrl,
            fieldFormData
          );
          console.log("Field creation result:", fieldResponse.data); // Debug log

          if (fieldResponse.data.success) {
            fieldsCreated++;
            console.log(`Field "${fieldData.label}" created successfully`);
          } else {
            console.error(
              `Failed to create field "${fieldData.label}":`,
              fieldResponse.data
            );
          }
        } catch (fieldError) {
          console.error("Error creating field:", fieldError);
          console.error("Field data that failed:", fieldData);
        }
      }

      setProcessingStep("Finalizing...");
      setProcessingProgress(95);

      // Step 3: Success
      setProcessingStep("Component created successfully!");
      setProcessingProgress(100);

      // Wait a moment to show completion
      await new Promise((resolve) => setTimeout(resolve, 1000));

             showMessage(
         `Component "${currentParsedComponent.component.name}" created successfully with ${fieldsCreated} fields!`,
         "success"
       );
      handleClose();

      // Notify parent component to refresh
      if (onComponentCreated) {
        onComponentCreated();
      }
    } catch (error) {
      console.error("ChatGPT JSON processing error:", error);
      showMessage(error.message || "Failed to process ChatGPT JSON", "error");
    } finally {
      setIsProcessingChatGPT(false);
      setProcessingStep("");
      setProcessingProgress(0);
    }
  };

  const handleClose = () => {
    setShowConfirmation(false);
    setChatGPTJson("");
    setParsedComponent(null);
    setProcessingStep("");
    setProcessingProgress(0);
    setContextPrompt("");
    setHasRepeater(false);
    setIsAutoGenerating(false);
    setAutoGenerationStep("");
    setAutoGenerationProgress(0);
    setShowManualSection(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
             {/* Main ChatGPT Modal */}
       <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
         <div className="bg-white rounded-lg w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl border-2 border-pink-500">
                      {/* Header - Fixed */}
            <div className="p-4 border-b-2 border-pink-500 flex-shrink-0 bg-pink-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 bg-pink-500 rounded-full flex items-center justify-center">
                    <Bot className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-800">
                      Create Component with AI
                    </h2>
                    <p className="text-sm text-gray-600">
                      AI-powered component generation
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  className="text-gray-600 hover:text-gray-800 transition-colors p-2 rounded-lg hover:bg-pink-100"
                >
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

           {/* Content - Scrollable */}
           <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white">
                                                   {/* License Key Status */}
              <div className="bg-pink-50 border-2 border-pink-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-6 w-6 bg-pink-500 rounded-full flex items-center justify-center">
                      <svg
                        className="h-3 w-3 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-800 text-sm">
                        AI Component Generation
                      </h3>
                      <p className="text-xs text-gray-600">
                        Generate components using AI (requires valid license)
                      </p>
                    </div>
                  </div>
                </div>

                {/* License Key Status */}
                <div className="flex items-center gap-2 mb-3">
                  {licenseKey ? (
                    <>
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      <span className="text-xs text-gray-700">
                        License key configured
                      </span>
                      <span className="text-xs text-gray-500">
                        (Key: {licenseKey.substring(0, 12)}...)
                      </span>
                    </>
                  ) : (
                    <>
                      <div className="w-2 h-2 rounded-full bg-red-500"></div>
                      <span className="text-xs text-gray-700">
                        No license key configured
                      </span>
                    </>
                  )}
                </div>

                <div className="p-3 bg-pink-100 rounded border-2 border-pink-300">
                  <p className="text-xs text-gray-700 mb-2">
                    <strong>AI Generation:</strong> The AI component generation feature uses OpenAI's API through our secure backend. No API key configuration needed - just a valid license key!
                  </p>
                  <p className="text-xs text-gray-600">
                    Your license key is automatically used to authenticate with our AI service.
                  </p>
                </div>
               </div>
             
                           {/* Context Prompt Input */}
             <div className="bg-pink-50 border-2 border-pink-200 rounded-lg p-4">
               <div className="flex items-center gap-3 mb-3">
                 <div className="h-6 w-6 bg-pink-500 rounded-full flex items-center justify-center">
                   <svg
                     className="h-3 w-3 text-white"
                     fill="none"
                     viewBox="0 0 24 24"
                     stroke="currentColor"
                   >
                     <path
                       strokeLinecap="round"
                       strokeLinejoin="round"
                       strokeWidth={2}
                       d="M13 10V3L4 14h7v7l9-11h-7z"
                     />
                   </svg>
                 </div>
                 <h3 className="font-medium text-gray-800 text-sm">
                   Describe Your Component
                 </h3>
               </div>
               <p className="text-gray-600 text-xs mb-3">
                 Tell us what component you want to create. Be specific about the
                 fields and functionality you need.
               </p>
               <textarea
                 value={contextPrompt}
                 onChange={(e) => setContextPrompt(e.target.value)}
                 placeholder="Example: I want to create a testimonials component with customer name, testimonial content, customer photo, company name, and rating. The component should be visually appealing and professional."
                 className="w-full h-20 p-3 bg-white border border-pink-300 rounded text-black placeholder-gray-500 focus:ring-1 focus:ring-pink-500 focus:border-pink-500 resize-none"
               />

                                                           {/* Action Buttons - Enhanced with Auto Generation */}
                <div className="mt-3">
                                    <div className="flex gap-2 mb-2">
                     {/* Auto Generation Button */}
                     <button
                       onClick={generateComponentWithAI}
                       disabled={!contextPrompt.trim() || isAutoGenerating}
                       className="flex items-center gap-2 px-4 py-2 bg-pink-600 text-white rounded hover:bg-pink-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm"
                     >
                       {isAutoGenerating ? (
                         <Loader2 className="h-4 w-4 animate-spin" />
                       ) : (
                         <Zap className="h-4 w-4" />
                       )}
                       <span className="font-medium">
                         {isAutoGenerating ? "Building..." : "Auto Generate"}
                       </span>
                     </button>
                     
                     {/* Manual ChatGPT Button */}
                     <button
                       onClick={openChatGPT}
                       disabled={!contextPrompt.trim()}
                       className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm"
                     >
                       <Bot className="h-4 w-4" />
                       <span className="font-medium">Generate with ChatGPT</span>
                     </button>
                     
                     {/* Manual ChatGPT Button */}
                     <button
                       onClick={openChatGPTManually}
                       disabled={contextPrompt.trim()}
                       className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm"
                     >
                       <svg
                         className="h-4 w-4"
                         fill="none"
                         viewBox="0 0 24 24"
                         stroke="currentColor"
                       >
                         <path
                           strokeLinecap="round"
                           strokeLinejoin="round"
                           strokeWidth={2}
                           d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                         />
                       </svg>
                       <span className="font-medium">Open ChatGPT Manually</span>
                     </button>
                   </div>
                                    <p className="text-xs text-gray-600">
                     💡 <strong>Auto Generate:</strong> Fully automatic AI component creation. <strong>Generate with ChatGPT:</strong> Opens ChatGPT with pre-filled prompt. <strong>Manual:</strong> Opens ChatGPT with blank page.
                   </p>
                </div>

               

                                                                                           {/* Enhanced Auto Generation Progress */}
                 {isAutoGenerating && (
                   <div className="mt-4 p-4 bg-pink-100 border-2 border-pink-300 rounded-lg">
                     <div className="flex items-center gap-3 mb-3">
                       <Loader2 className="h-5 w-5 text-pink-500 animate-spin" />
                       <div className="flex-1">
                         <p className="text-sm text-gray-700 font-medium">
                           {autoGenerationStep}
                         </p>
                         <div className="w-full bg-pink-200 rounded-full h-2 mt-2 overflow-hidden">
                           <div
                             className="bg-gradient-to-r from-pink-500 to-pink-600 h-2 rounded-full transition-all duration-700 ease-out relative"
                             style={{ 
                               width: `${autoGenerationProgress}%`,
                               boxShadow: autoGenerationProgress > 0 ? '0 0 10px rgba(236, 72, 153, 0.3)' : 'none'
                             }}
                           >
                             {/* Animated shimmer effect */}
                             {autoGenerationProgress > 0 && autoGenerationProgress < 100 && (
                               <div 
                                 className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"
                                 style={{
                                   animation: 'shimmer 2s infinite'
                                 }}
                               />
                             )}
                           </div>
                         </div>
                       </div>
                       <div className="text-right">
                         <div className="text-lg font-semibold text-pink-600 animate-pulse">
                           {Math.round(autoGenerationProgress)}%
                         </div>
                       </div>
                     </div>
                     
                     {/* Cache usage indicator removed */}
                   </div>
                 )}
               </div>

                             {/* Repeater Option */}
               <div className="bg-pink-50 border-2 border-pink-200 rounded-lg p-4">
                 <div className="flex items-center justify-between">
                   <div className="flex items-center gap-3">
                     <div className="h-6 w-6 bg-pink-500 rounded-full flex items-center justify-center">
                       <svg
                         className="h-3 w-3 text-white"
                         fill="none"
                         viewBox="0 0 24 24"
                         stroke="currentColor"
                       >
                         <path
                           strokeLinecap="round"
                           strokeLinejoin="round"
                           strokeWidth={2}
                           d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                         />
                       </svg>
                     </div>
                     <div>
                       <h3 className="font-medium text-gray-800 text-sm">
                         Multiple Instances
                       </h3>
                       <p className="text-xs text-gray-600">
                         Enable if this component should support multiple instances
                       </p>
                     </div>
                   </div>
                   <label className="relative inline-flex items-center cursor-pointer">
                     <input
                       type="checkbox"
                       checked={hasRepeater}
                       onChange={(e) => setHasRepeater(e.target.checked)}
                       className="sr-only peer"
                     />
                     <div className="w-9 h-5 bg-gray-400 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-pink-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-pink-600"></div>
                   </label>
                 </div>
               </div>
            </div>

                                                   {/* ChatGPT JSON Input - Only show for manual mode */}
              {showManualSection && (
                <div className="bg-pink-50 border-2 border-pink-200 rounded-lg p-4">
               <div className="flex items-center gap-3 mb-3">
                 <div className="h-6 w-6 bg-pink-500 rounded-full flex items-center justify-center">
                   <svg
                     className="h-3 w-3 text-white"
                     fill="none"
                     viewBox="0 0 24 24"
                     stroke="currentColor"
                   >
                     <path
                       strokeLinecap="round"
                       strokeLinejoin="round"
                       strokeWidth={2}
                       d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                     />
                   </svg>
                 </div>
                 <h3 className="font-medium text-gray-800 text-sm">
                   Paste ChatGPT Response
                 </h3>
               </div>
               <p className="text-gray-600 text-xs mb-3">
                 Paste the JSON response from ChatGPT here to create your component.
               </p>
                               <textarea
                  value={chatGPTJson}
                  onChange={(e) => setChatGPTJson(e.target.value)}
                  placeholder={`{
   "component": {
     "name": "Example Component",
     "handle": "example_component",
     "description": "A sample component"
   },
   "fields": [
     {
       "label": "Title",
       "name": "title",
       "type": "text",
       "required": true,
       "placeholder": "Enter title"
     }
   ]
 }`}
                  className="w-full h-32 p-3 bg-white border border-pink-300 rounded text-black placeholder-gray-500 focus:ring-1 focus:ring-pink-500 focus:border-pink-500 resize-none font-mono text-xs"
                />

               {/* Processing Progress */}
               {isProcessingChatGPT && (
                 <div className="mt-3 p-3 bg-pink-100 border border-pink-300 rounded">
                   <div className="flex items-center gap-2 mb-2">
                     <Loader2 className="h-4 w-4 text-pink-500 animate-spin" />
                     <span className="text-xs font-medium text-gray-700">
                       {processingStep}
                     </span>
                   </div>
                   <div className="w-full bg-pink-200 rounded-full h-1.5">
                     <div
                       className="bg-pink-500 h-1.5 rounded-full transition-all duration-300"
                       style={{ width: `${processingProgress}%` }}
                     ></div>
                   </div>
                 </div>
               )}

               {/* Action Buttons */}
               <div className="mt-4 flex gap-2">
                                   <button
                    onClick={() => {
                      const result = validateAndParseChatGPTJson();
                      if (result.isValid) {
                        showMessage("JSON validated successfully!", "success");
                      }
                    }}
                    disabled={!chatGPTJson.trim() || isProcessingChatGPT}
                    className="flex items-center gap-1 px-3 py-1.5 bg-pink-600 text-white rounded text-xs hover:bg-pink-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                   <svg
                     className="h-3 w-3"
                     fill="none"
                     viewBox="0 0 24 24"
                     stroke="currentColor"
                   >
                     <path
                       strokeLinecap="round"
                       strokeLinejoin="round"
                       strokeWidth={2}
                       d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                     />
                   </svg>
                   Validate JSON
                 </button>
                                   <button
                    onClick={() => {
                      const result = validateAndParseChatGPTJson();
                      if (result.isValid) {
                        processChatGPTJson(result.data);
                      }
                    }}
                    disabled={!parsedComponent || isProcessingChatGPT}
                    className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded text-xs hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                   <svg
                     className="h-3 w-3"
                     fill="none"
                     viewBox="0 0 24 24"
                     stroke="currentColor"
                   >
                     <path
                       strokeLinecap="round"
                       strokeLinejoin="round"
                       strokeWidth={2}
                       d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                     />
                   </svg>
                   Create Component
                 </button>
               </div>

               {/* Validation Status */}
               {parsedComponent && (
                 <div className="mt-3 p-3 bg-pink-100 border border-pink-300 rounded">
                   <div className="flex items-center gap-2">
                     <svg
                       className="h-4 w-4 text-green-500"
                       fill="none"
                       viewBox="0 0 24 24"
                       stroke="currentColor"
                     >
                       <path
                         strokeLinecap="round"
                         strokeLinejoin="round"
                         strokeWidth={2}
                         d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                       />
                     </svg>
                     <div>
                       <p className="text-xs font-medium text-gray-700">
                         JSON Validated Successfully!
                       </p>
                       <p className="text-xs text-gray-600">
                         Component: {parsedComponent.component.name} with{" "}
                         {parsedComponent.fields.length} fields
                       </p>
                     </div>
                   </div>
                 </div>
                  )}
              </div>
            )}
           </div>
         </div>
     </>
   );
 };

export default ChatGPTModal;
