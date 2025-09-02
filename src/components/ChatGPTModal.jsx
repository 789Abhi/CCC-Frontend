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
  const [apiKey, setApiKey] = useState(""); // API key from plugin settings
  const [useAutoGeneration, setUseAutoGeneration] = useState(false);
  const [showApiKeySettings, setShowApiKeySettings] = useState(false);
  const [isSavingApiKey, setIsSavingApiKey] = useState(false);
  const [showManualSection, setShowManualSection] = useState(false);
  const [isUsingCachedStructure, setIsUsingCachedStructure] = useState(false);

  // API Configuration
  const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
  
     // Persistent cache for component patterns to reduce API costs
   const getComponentCache = () => {
     try {
       const cached = localStorage.getItem('ccc_component_cache');
       return cached ? JSON.parse(cached) : {
                   // Basic default patterns - common component types
          patterns: {
            testimonial: {
              name: "Testimonial",
              handle: "testimonial", 
              description: "Customer testimonial with photo and rating",
              fields: [
                { label: "Customer Name", name: "customer_name", type: "text", required: true },
                { label: "Testimonial Content", name: "testimonial_content", type: "textarea", required: true },
                { label: "Customer Photo", name: "customer_photo", type: "image", required: false },
                { label: "Company Name", name: "company_name", type: "text", required: false },
                { label: "Rating", name: "rating", type: "select", required: false, options: ["1", "2", "3", "4", "5"] }
              ]
            },
            hero: {
              name: "Hero Section",
              handle: "hero_section",
              description: "Hero section with background image, heading, and call-to-action",
              fields: [
                { label: "Background Image", name: "background_image", type: "image", required: true },
                { label: "Heading", name: "heading", type: "text", required: true },
                { label: "Subtitle", name: "subtitle", type: "text", required: false },
                { label: "Description", name: "description", type: "textarea", required: false },
                { label: "Button Text", name: "button_text", type: "text", required: true },
                { label: "Button Link", name: "button_link", type: "link", required: true },
                { label: "Button Color", name: "button_color", type: "color", required: false }
              ]
            },
            contact: {
              name: "Contact Form",
              handle: "contact_form",
              description: "Contact form with name, email, and message fields",
              fields: [
                { label: "Name", name: "name", type: "text", required: true },
                { label: "Email", name: "email", type: "email", required: true },
                { label: "Phone", name: "phone", type: "number", required: false },
                { label: "Message", name: "message", type: "textarea", required: true },
                { label: "Subject", name: "subject", type: "text", required: false }
              ]
            },
            gallery: {
              name: "Image Gallery",
              handle: "image_gallery",
              description: "Image gallery with title and multiple images",
              fields: [
                { label: "Gallery Title", name: "gallery_title", type: "text", required: true },
                { label: "Gallery Description", name: "gallery_description", type: "textarea", required: false },
                { label: "Images", name: "images", type: "repeater", required: true },
                { label: "Background Color", name: "background_color", type: "color", required: false }
              ]
            },
            pricing: {
              name: "Pricing Table",
              handle: "pricing_table",
              description: "Pricing table with multiple pricing plans",
              fields: [
                { label: "Section Title", name: "section_title", type: "text", required: true },
                { label: "Section Description", name: "section_description", type: "textarea", required: false },
                { label: "Pricing Plans", name: "pricing_plans", type: "repeater", required: true },
                { label: "Background Color", name: "background_color", type: "color", required: false }
              ]
            },
            timeline: {
              name: "History Timeline",
              handle: "history_timeline",
              description: "Timeline component with events, dates, and visual elements",
              fields: [
                { label: "Timeline Items", name: "timeline_items", type: "repeater", required: true },
                { label: "Background Color", name: "background_color", type: "color", required: false },
                { label: "Overlay", name: "overlay", type: "color", required: false }
              ]
            },
            team: {
              name: "Team Members",
              handle: "team_members",
              description: "Team members section with photos and details",
              fields: [
                { label: "Section Title", name: "section_title", type: "text", required: true },
                { label: "Section Description", name: "section_description", type: "textarea", required: false },
                { label: "Team Members", name: "team_members", type: "repeater", required: true },
                { label: "Background Color", name: "background_color", type: "color", required: false }
              ]
            },
            services: {
              name: "Services Section",
              handle: "services_section",
              description: "Services section with icons and descriptions",
              fields: [
                { label: "Section Title", name: "section_title", type: "text", required: true },
                { label: "Section Description", name: "section_description", type: "textarea", required: false },
                { label: "Services", name: "services", type: "repeater", required: true },
                { label: "Background Color", name: "background_color", type: "color", required: false }
              ]
            }
          },
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

  // Load API key from localStorage and WordPress options on component mount
  React.useEffect(() => {
    // First try to load from localStorage
    const savedApiKey = localStorage.getItem('ccc_openai_api_key');
    if (savedApiKey) {
      setApiKey(savedApiKey);
    } else {
      // If not in localStorage, try to load from WordPress options
      const loadApiKeyFromWordPress = async () => {
        try {
          const formData = new FormData();
          formData.append("action", "ccc_get_api_key");
          formData.append("nonce", window.cccData.nonce);

          const response = await axios.post(window.cccData.ajaxUrl, formData);
          
          if (response.data.success && response.data.data.has_key) {
            // We can't get the full key for security, but we can show it's configured
            // The actual key will be retrieved from WordPress options when needed
            setApiKey("***configured***"); // Placeholder to show it's configured
          }
        } catch (error) {
          console.error("Error loading API key from WordPress:", error);
        }
      };
      
      loadApiKeyFromWordPress();
    }
  }, []);

  // Save API key to localStorage
  const saveApiKey = async () => {
    if (!apiKey.trim()) {
      showMessage("Please enter your OpenAI API key", "error");
      return;
    }

    setIsSavingApiKey(true);
    try {
      // Save to localStorage
      localStorage.setItem('ccc_openai_api_key', apiKey.trim());
      
      // Also save to WordPress options via AJAX
      const formData = new FormData();
      formData.append("action", "ccc_save_api_key");
      formData.append("api_key", apiKey.trim());
      formData.append("nonce", window.cccData.nonce);

      await axios.post(window.cccData.ajaxUrl, formData);
      
      showMessage("API key saved successfully!", "success");
      setShowApiKeySettings(false);
    } catch (error) {
      console.error("Error saving API key:", error);
      showMessage("Failed to save API key. Please try again.", "error");
    } finally {
      setIsSavingApiKey(false);
    }
  };

  // Get the current API key (from localStorage, WordPress options, or environment)
  const getCurrentApiKey = async () => {
    // First check localStorage
    if (apiKey && apiKey !== "***configured***") {
      return apiKey;
    }
    
    // Then check environment variable
    if (process.env.REACT_APP_OPENAI_API_KEY) {
      return process.env.REACT_APP_OPENAI_API_KEY;
    }
    
    // Finally, try to get from WordPress options
    try {
      const formData = new FormData();
      formData.append("action", "ccc_get_api_key");
      formData.append("nonce", window.cccData.nonce);

      const response = await axios.post(window.cccData.ajaxUrl, formData);
      
      if (response.data.success && response.data.data.has_key) {
        // For security, we need to get the actual key from WordPress
        // This would require a separate endpoint that returns the full key
        // For now, we'll use a placeholder and handle it in the generation function
        return "***wordpress_stored***";
      }
    } catch (error) {
      console.error("Error getting API key from WordPress:", error);
    }
    
    return "";
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
     const cache = getComponentCache();
     const lowerPrompt = prompt.toLowerCase().trim();
     
     // First check user-created patterns (exact matches and similar patterns)
     for (const [hash, userPattern] of Object.entries(cache.userPatterns)) {
       // Exact match
       if (userPattern.prompt === lowerPrompt) {
         return { type: 'user', hash, pattern: userPattern };
       }
       
       // Similar pattern match (check if keywords match)
       const userKeywords = userPattern.prompt.split(' ');
       const promptKeywords = lowerPrompt.split(' ');
       const commonKeywords = userKeywords.filter(keyword => 
         promptKeywords.some(promptKeyword => 
           promptKeyword.includes(keyword) || keyword.includes(promptKeyword)
         )
       );
       
       // If more than 50% of keywords match, use this pattern
       if (commonKeywords.length >= Math.min(userKeywords.length, promptKeywords.length) * 0.5) {
         return { type: 'user', hash, pattern: userPattern };
       }
     }
     
           // Then check basic default patterns (common ones)
      if (lowerPrompt.includes('testimonial') || lowerPrompt.includes('review') || lowerPrompt.includes('customer feedback')) {
        return { type: 'default', pattern: 'testimonial' };
      }
      if (lowerPrompt.includes('hero') || lowerPrompt.includes('banner') || lowerPrompt.includes('header section')) {
        return { type: 'default', pattern: 'hero' };
      }
      if (lowerPrompt.includes('contact') || lowerPrompt.includes('form') || lowerPrompt.includes('email')) {
        return { type: 'default', pattern: 'contact' };
      }
      if (lowerPrompt.includes('gallery') || lowerPrompt.includes('images') || lowerPrompt.includes('photo gallery')) {
        return { type: 'default', pattern: 'gallery' };
      }
      if (lowerPrompt.includes('pricing') || lowerPrompt.includes('price') || lowerPrompt.includes('plans')) {
        return { type: 'default', pattern: 'pricing' };
      }
      if (lowerPrompt.includes('timeline') || lowerPrompt.includes('history') || lowerPrompt.includes('events') || lowerPrompt.includes('chronological')) {
        return { type: 'default', pattern: 'timeline' };
      }
      if (lowerPrompt.includes('team') || lowerPrompt.includes('members') || lowerPrompt.includes('staff')) {
        return { type: 'default', pattern: 'team' };
      }
      if (lowerPrompt.includes('services') || lowerPrompt.includes('service') || lowerPrompt.includes('offerings')) {
        return { type: 'default', pattern: 'services' };
      }
     
     // For everything else, use AI generation
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

    return `Create a WordPress component based on this description: ${contextPrompt}

Please generate a JSON response with the following structure:
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

${hasRepeater ? 'IMPORTANT: This component needs to support multiple instances (repeater field). Please include a repeater field with nested children fields.' : ''}

Please return ONLY the JSON response, no additional text or explanations.`;
  };

  // Auto-generation function using proxy API system
  const generateComponentWithAI = async () => {
    if (!contextPrompt.trim()) {
      showMessage("Please describe what component you want to create", "error");
      return;
    }

    // Get or generate proxy key
    let proxyKey = localStorage.getItem('ccc_proxy_key');
    
    if (!proxyKey) {
      try {
        const formData = new FormData();
        formData.append("action", "ccc_generate_proxy_key");
        formData.append("nonce", window.cccData.nonce);

        const response = await axios.post(window.cccData.ajaxUrl, formData);
        
        if (response.data.success) {
          proxyKey = response.data.data.proxy_key;
          localStorage.setItem('ccc_proxy_key', proxyKey);
        } else {
          showMessage("Failed to generate proxy key. Please contact administrator.", "error");
          return;
        }
      } catch (error) {
        console.error("Error generating proxy key:", error);
        showMessage("Failed to generate proxy key. Please contact administrator.", "error");
        return;
      }
    }

    setIsAutoGenerating(true);
    setAutoGenerationStep("Analyzing component requirements...");
    setAutoGenerationProgress(10);

    try {
      // First, try to detect if this is a common component pattern
      const detectedPattern = detectComponentPattern(contextPrompt);
      
      if (detectedPattern) {
        // Use cached structure for common patterns (cost optimization)
        setIsUsingCachedStructure(true);
        setAutoGenerationStep("Using optimized cached structure...");
        setAutoGenerationProgress(30);
        
        const cachedComponent = generateCachedComponent(detectedPattern);
        
        setAutoGenerationStep("Validating cached component...");
        setAutoGenerationProgress(60);
        
        // Directly use the cached component data instead of going through validation
        setParsedComponent(cachedComponent);
        
                 if (cachedComponent && cachedComponent.component && cachedComponent.fields) {
           setAutoGenerationStep("Creating component in WordPress...");
           setAutoGenerationProgress(80);
           
           // Auto-create the component - pass the data directly to avoid async state issues
           await processChatGPTJson(cachedComponent);
           
           setAutoGenerationStep("Component created successfully!");
           setAutoGenerationProgress(100);
         } else {
          throw new Error("Invalid cached component structure");
        }
      } else {
        // Use AI for custom components
        setIsUsingCachedStructure(false);
        setAutoGenerationStep("Generating custom component with AI...");
        setAutoGenerationProgress(20);
        
        // Create the prompt for AI generation
        const aiPrompt = generateAutoGenerationPrompt();

                setAutoGenerationStep("Sending request to OpenAI...");
        setAutoGenerationProgress(40);

        // Call OpenAI API through proxy
        const proxyFormData = new FormData();
        proxyFormData.append("action", "ccc_proxy_openai_request");
        proxyFormData.append("proxy_key", proxyKey);
        proxyFormData.append("prompt", aiPrompt);
        proxyFormData.append("model", "gpt-4o-mini");
        proxyFormData.append("nonce", window.cccData.nonce);

        const response = await axios.post(window.cccData.ajaxUrl, proxyFormData);

        setAutoGenerationStep("Processing AI response...");
        setAutoGenerationProgress(60);

        // Extract the JSON from the response
        const aiResponse = response.data.data?.response;
        
        if (!aiResponse) {
          throw new Error("No response received from AI");
        }

        // Try to extract JSON from the response (AI might add extra text)
        let jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error("Invalid JSON response from AI");
        }

        const aiGeneratedJson = jsonMatch[0];
        
        setAutoGenerationStep("Validating generated component...");
        setAutoGenerationProgress(80);
        
        // Validate and parse the AI-generated JSON automatically
        setChatGPTJson(aiGeneratedJson);
        
                 // Validate the JSON
         const validationResult = validateAndParseChatGPTJson();
         
         if (validationResult.isValid && validationResult.data) {
           setAutoGenerationStep("Creating component in WordPress...");
           setAutoGenerationProgress(90);
           
           // Auto-create the component with the validated data
           await processChatGPTJson(validationResult.data);
           
           // Save this successful generation as a user pattern for future use
           addUserPattern(contextPrompt, validationResult.data);
          
          setAutoGenerationStep("Component created successfully!");
          setAutoGenerationProgress(100);
        } else {
          throw new Error("Generated component validation failed");
        }
      }

    } catch (error) {
      console.error("AI generation error:", error);
      showMessage(`AI generation failed: ${error.message}`, "error");
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

  const validateAndParseChatGPTJson = () => {
    if (!chatGPTJson.trim()) {
      showMessage("Please paste the ChatGPT JSON response", "error");
      return false;
    }

    try {
      // Parse JSON to validate
      let componentData = JSON.parse(chatGPTJson);

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
          config: {},
        };

        // Map field type to valid type
        const originalType = normalizedField.type.toLowerCase();
        if (fieldTypeMapping[originalType]) {
          normalizedField.type = fieldTypeMapping[originalType];
        } else if (!validFieldTypes.includes(originalType)) {
          normalizedField.type = "text"; // Default fallback
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
                 } else if (normalizedField.type === "repeater") {
           // Handle repeater field - if it has children, use them as nested fields
           if (field.children && Array.isArray(field.children)) {
             const nestedFields = field.children.map((child, childIndex) => {
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

               // Handle nested number field configuration
               if (nestedField.type === "number") {
                 nestedField.config = {
                   number_type: child.number_type || child.phone ? "phone" : "normal",
                   min: child.min || child.minimum,
                   max: child.max || child.maximum,
                   step: child.step || child.increment,
                 };
               }

               return nestedField;
             });

             // Store nested fields in the config for the repeater field
             normalizedField.config = {
               nested_fields: nestedFields,
             };
           } else {
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

          // Handle field configuration
          if (Object.keys(fieldData.config).length > 0) {
            fieldFormData.append("field_config", JSON.stringify(fieldData.config));
          }

          // Handle repeater fields with nested fields
          if (fieldData.type === "repeater" && fieldData.config.nested_fields) {
            fieldFormData.append("nested_field_definitions", JSON.stringify(fieldData.config.nested_fields));
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
    setIsUsingCachedStructure(false);
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
                                                   {/* Proxy Key Status */}
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
                        Secure AI Access
                      </h3>
                      <p className="text-xs text-gray-600">
                        Proxy key for AI generation
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowApiKeySettings(!showApiKeySettings)}
                    className="text-xs text-pink-600 hover:text-pink-700 transition-colors px-2 py-1 rounded hover:bg-pink-100"
                  >
                    {showApiKeySettings ? "Hide" : "Manage"}
                  </button>
                </div>

                {/* Proxy Key Status */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span className="text-xs text-gray-700">
                    Secure proxy system active
                  </span>
                  {localStorage.getItem('ccc_proxy_key') && (
                    <span className="text-xs text-gray-500">
                      (Proxy key: {localStorage.getItem('ccc_proxy_key').substring(0, 12)}...)
                    </span>
                  )}
                </div>

                {/* Proxy Key Management */}
                {showApiKeySettings && (
                  <div className="space-y-3 p-3 bg-pink-100 rounded border-2 border-pink-300">
                    <div>
                      <p className="text-xs text-gray-700 mb-2">
                        <strong>How it works:</strong> Your requests are securely proxied through our server. 
                        The real API key is never exposed to your browser.
                      </p>
                      {localStorage.getItem('ccc_proxy_key') ? (
                        <div className="p-2 bg-white rounded border border-pink-300">
                          <p className="text-xs text-gray-600 mb-1">Current Proxy Key:</p>
                          <p className="text-xs font-mono text-gray-800">
                            {localStorage.getItem('ccc_proxy_key')}
                          </p>
                        </div>
                      ) : (
                        <p className="text-xs text-gray-600">
                          No proxy key generated yet. One will be created automatically when you first use AI generation.
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={async () => {
                          try {
                            const formData = new FormData();
                            formData.append("action", "ccc_generate_proxy_key");
                            formData.append("nonce", window.cccData.nonce);

                            const response = await axios.post(window.cccData.ajaxUrl, formData);
                            
                            if (response.data.success) {
                              const newProxyKey = response.data.data.proxy_key;
                              localStorage.setItem('ccc_proxy_key', newProxyKey);
                              showMessage("New proxy key generated!", "success");
                              setShowApiKeySettings(false);
                              setShowApiKeySettings(true); // Force re-render
                            }
                          } catch (error) {
                            showMessage("Failed to generate new proxy key", "error");
                          }
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 bg-pink-600 text-white rounded text-xs hover:bg-pink-700 transition-colors"
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
                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                          />
                        </svg>
                        Generate New Key
                      </button>
                      <button
                        onClick={() => {
                          localStorage.removeItem('ccc_proxy_key');
                          showMessage("Proxy key cleared", "success");
                          setShowApiKeySettings(false);
                          setShowApiKeySettings(true); // Force re-render
                        }}
                        className="px-3 py-1.5 bg-gray-400 text-gray-700 rounded text-xs hover:bg-gray-500 transition-colors"
                      >
                        Clear Key
                      </button>
                    </div>
                  </div>
                               )}
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
                         <div className="w-full bg-pink-200 rounded-full h-1.5 mt-2">
                           <div
                             className="bg-pink-500 h-1.5 rounded-full transition-all duration-500"
                             style={{ width: `${autoGenerationProgress}%` }}
                           ></div>
                         </div>
                       </div>
                       <div className="text-right">
                         <div className="text-lg font-semibold text-pink-600">
                           {autoGenerationProgress}%
                         </div>
                       </div>
                     </div>
                     
                     {isUsingCachedStructure && (
                       <div className="flex items-center gap-2 p-2 bg-pink-200 rounded border border-pink-400">
                         <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                         <span className="text-xs text-gray-700">
                           Using cached component (no API cost)
                         </span>
                       </div>
                     )}
                   </div>
                 )}

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
               <div className="mt-3 flex gap-2">
                 <button
                   onClick={validateAndParseChatGPTJson}
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
                   onClick={processChatGPTJson}
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
       </div>
     </>
   );
 };

export default ChatGPTModal;
