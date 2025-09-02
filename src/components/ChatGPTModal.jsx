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
  const [showCacheManager, setShowCacheManager] = useState(false);

  // API Configuration
  const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
  
  // Persistent cache for component patterns to reduce API costs
  const getComponentCache = () => {
    try {
      const cached = localStorage.getItem('ccc_component_cache');
      return cached ? JSON.parse(cached) : {
        // Default patterns
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
            description: "Hero section with title, subtitle, and call-to-action",
            fields: [
              { label: "Title", name: "title", type: "text", required: true },
              { label: "Subtitle", name: "subtitle", type: "text", required: false },
              { label: "Background Image", name: "background_image", type: "image", required: false },
              { label: "Button Text", name: "button_text", type: "text", required: false },
              { label: "Button Link", name: "button_link", type: "link", required: false }
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
            description: "Image gallery with multiple images and layout options",
            fields: [
              { label: "Gallery Title", name: "gallery_title", type: "text", required: false },
              { label: "Images", name: "images", type: "image", required: true },
              { label: "Description", name: "description", type: "textarea", required: false },
              { label: "Layout", name: "layout", type: "select", required: false, options: ["grid", "masonry", "slider"] }
            ]
          },
          pricing: {
            name: "Pricing Table",
            handle: "pricing_table",
            description: "Pricing table with plans, features, and call-to-action",
            fields: [
              { label: "Plan Name", name: "plan_name", type: "text", required: true },
              { label: "Price", name: "price", type: "text", required: true },
              { label: "Features", name: "features", type: "textarea", required: true },
              { label: "Button Text", name: "button_text", type: "text", required: false },
              { label: "Button Link", name: "button_link", type: "link", required: false },
              { label: "Popular", name: "popular", type: "checkbox", required: false }
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
    
    // First check user-created patterns (exact matches)
    for (const [hash, userPattern] of Object.entries(cache.userPatterns)) {
      if (userPattern.prompt === lowerPrompt) {
        return { type: 'user', hash, pattern: userPattern };
      }
    }
    
    // Then check default patterns (keyword matches)
    if (lowerPrompt.includes('testimonial') || lowerPrompt.includes('review') || lowerPrompt.includes('customer feedback')) {
      return { type: 'default', pattern: 'testimonial' };
    }
    if (lowerPrompt.includes('hero') || lowerPrompt.includes('banner') || lowerPrompt.includes('header section')) {
      return { type: 'default', pattern: 'hero' };
    }
    if (lowerPrompt.includes('contact') || lowerPrompt.includes('form') || lowerPrompt.includes('email')) {
      return { type: 'default', pattern: 'contact' };
    }
    if (lowerPrompt.includes('gallery') || lowerPrompt.includes('images') || lowerPrompt.includes('photos')) {
      return { type: 'default', pattern: 'gallery' };
    }
    if (lowerPrompt.includes('pricing') || lowerPrompt.includes('price') || lowerPrompt.includes('plans')) {
      return { type: 'default', pattern: 'pricing' };
    }
    
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

  // Auto-generation function using GPT-4.1-mini
  const generateComponentWithAI = async () => {
    if (!contextPrompt.trim()) {
      showMessage("Please describe what component you want to create", "error");
      return;
    }

    // Get the API key
    let currentApiKey = "";
    
    // First check localStorage
    if (apiKey && apiKey !== "***configured***") {
      currentApiKey = apiKey;
    } else if (process.env.REACT_APP_OPENAI_API_KEY) {
      // Then check environment variable
      currentApiKey = process.env.REACT_APP_OPENAI_API_KEY;
    } else {
      // Finally, try to get from WordPress options
      try {
        const formData = new FormData();
        formData.append("action", "ccc_get_api_key_for_use");
        formData.append("nonce", window.cccData.nonce);

        const response = await axios.post(window.cccData.ajaxUrl, formData);
        
        if (response.data.success) {
          currentApiKey = response.data.data.api_key;
        }
      } catch (error) {
        console.error("Error getting API key from WordPress:", error);
      }
    }

    if (!currentApiKey) {
      showMessage("OpenAI API key not configured. Please add your API key in the settings.", "error");
      setShowApiKeySettings(true);
      return;
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
          
          // Auto-create the component
          await processChatGPTJson();
          
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

        // Call OpenAI API
        const response = await axios.post(
          OPENAI_API_URL,
          {
            model: "gpt-4o-mini", // Using GPT-4.1-mini
            messages: [
              {
                role: "system",
                content: "You are a WordPress component generator. Generate valid JSON responses only."
              },
              {
                role: "user",
                content: aiPrompt
              }
            ],
            temperature: 0.7,
            max_tokens: 2000
          },
          {
            headers: {
              "Authorization": `Bearer ${currentApiKey}`,
              "Content-Type": "application/json"
            }
          }
        );

        setAutoGenerationStep("Processing AI response...");
        setAutoGenerationProgress(60);

        // Extract the JSON from the response
        const aiResponse = response.data.choices[0]?.message?.content;
        
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
        const isValid = validateAndParseChatGPTJson();
        
        if (isValid) {
          setAutoGenerationStep("Creating component in WordPress...");
          setAutoGenerationProgress(90);
          
          // Auto-create the component
          await processChatGPTJson();
          
          // Save this successful generation as a user pattern for future use
          addUserPattern(contextPrompt, parsedComponent);
          
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
        } else if (normalizedField.type === "repeater" && field.children) {
          // Handle repeater field with nested children from ChatGPT
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
        }

        // Handle additional field properties
        if (field.return_format) {
          normalizedField.config.return_format = field.return_format;
        }

        return normalizedField;
      });

      // Store the parsed component data
      setParsedComponent({
        component: normalizedComponent,
        fields: normalizedFields,
      });

      return true;
    } catch (error) {
      console.error("JSON validation error:", error);
      showMessage("Please check your JSON format and try again", "error");
      return false;
    }
  };

  const processChatGPTJson = async () => {
    if (!parsedComponent) {
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
      componentFormData.append("name", parsedComponent.component.name);
      componentFormData.append("handle", parsedComponent.component.handle);
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
                comp.name === parsedComponent.component.name ||
                comp.label === parsedComponent.component.name
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
      for (const fieldData of parsedComponent.fields) {
        setProcessingStep(`Creating field: ${fieldData.label}...`);
        setProcessingProgress(50 + (fieldsCreated / parsedComponent.fields.length) * 40);

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
        `Component "${parsedComponent.component.name}" created successfully with ${fieldsCreated} fields!`,
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
        <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl">
          {/* Header - Fixed */}
          <div className="p-6 border-b border-gray-200 flex-shrink-0 bg-gradient-to-r from-green-50 to-blue-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-gradient-to-r from-green-500 to-blue-600 rounded-full flex items-center justify-center">
                  <Bot className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Create Component with AI
                  </h2>
                  <p className="text-sm text-gray-600">
                    AI-powered component generation
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-full hover:bg-gray-100"
              >
                <svg
                  className="h-6 w-6"
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
          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50">
            {/* API Key Settings */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 bg-gradient-to-r from-orange-500 to-red-600 rounded-full flex items-center justify-center">
                    <svg
                      className="h-4 w-4 text-white"
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
                    <h3 className="font-semibold text-gray-900 text-lg">
                      OpenAI API Key
                    </h3>
                    <p className="text-sm text-gray-600">
                      Required for auto-generation feature
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowApiKeySettings(!showApiKeySettings)}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
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
                      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  {showApiKeySettings ? "Hide" : "Configure"}
                </button>
              </div>

              {/* API Key Status */}
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-3 h-3 rounded-full ${(apiKey && apiKey !== "***configured***") || process.env.REACT_APP_OPENAI_API_KEY ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-sm font-medium">
                  {(apiKey && apiKey !== "***configured***") || process.env.REACT_APP_OPENAI_API_KEY ? "API Key Configured" : "API Key Not Configured"}
                </span>
                {(apiKey && apiKey !== "***configured***") && (
                  <span className="text-xs text-gray-500">
                    (Key: {apiKey.substring(0, 8)}...{apiKey.substring(apiKey.length - 4)})
                  </span>
                )}
                {process.env.REACT_APP_OPENAI_API_KEY && !apiKey && (
                  <span className="text-xs text-gray-500">
                    (Using environment variable)
                  </span>
                )}
              </div>

              {/* API Key Input */}
              {showApiKeySettings && (
                <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      OpenAI API Key
                    </label>
                    <input
                      type="password"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="sk-..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      Get your API key from{" "}
                      <a
                        href="https://platform.openai.com/api-keys"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-orange-600 hover:text-orange-700 underline"
                      >
                        OpenAI Platform
                      </a>
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={saveApiKey}
                      disabled={!apiKey.trim() || isSavingApiKey}
                      className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                    >
                      {isSavingApiKey ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
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
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                      {isSavingApiKey ? "Saving..." : "Save API Key"}
                    </button>
                    <button
                      onClick={() => {
                        setApiKey("");
                        localStorage.removeItem('ccc_openai_api_key');
                        showMessage("API key cleared", "success");
                      }}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      Clear
                    </button>
                  </div>
                </div>
                             )}
             </div>
             
             {/* Cache Management */}
             <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
               <div className="flex items-center justify-between mb-4">
                 <div className="flex items-center gap-3">
                   <div className="h-8 w-8 bg-gradient-to-r from-green-500 to-blue-600 rounded-full flex items-center justify-center">
                     <svg
                       className="h-4 w-4 text-white"
                       fill="none"
                       viewBox="0 0 24 24"
                       stroke="currentColor"
                     >
                       <path
                         strokeLinecap="round"
                         strokeLinejoin="round"
                         strokeWidth={2}
                         d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"
                       />
                     </svg>
                   </div>
                   <div>
                     <h3 className="font-semibold text-gray-900 text-lg">
                       Component Cache
                     </h3>
                     <p className="text-sm text-gray-600">
                       Saved patterns for cost optimization
                     </p>
                   </div>
                 </div>
                 <button
                   onClick={() => setShowCacheManager(!showCacheManager)}
                   className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
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
                       d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                     />
                   </svg>
                   {showCacheManager ? "Hide" : "Manage"}
                 </button>
               </div>

               {/* Cache Status */}
               <div className="flex items-center gap-3 mb-4">
                 <div className="w-3 h-3 rounded-full bg-green-500"></div>
                 <span className="text-sm font-medium">
                   Cache Active - Saving you money on repeated components
                 </span>
               </div>

               {/* Cache Manager */}
               {showCacheManager && (
                 <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                   <div>
                     <h4 className="font-medium text-gray-900 mb-2">Your Saved Patterns</h4>
                     <div className="space-y-2">
                       {(() => {
                         const cache = getComponentCache();
                         const userPatterns = Object.entries(cache.userPatterns);
                         
                         if (userPatterns.length === 0) {
                           return (
                             <div className="text-sm text-gray-500 italic">
                               No saved patterns yet. Create components with AI to automatically save them here!
                             </div>
                           );
                         }
                         
                         return userPatterns.map(([hash, pattern]) => (
                           <div key={hash} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                             <div className="flex-1">
                               <div className="font-medium text-gray-900">{pattern.component.name}</div>
                               <div className="text-sm text-gray-600">{pattern.prompt}</div>
                               <div className="text-xs text-gray-500">
                                 {pattern.fields.length} fields • Created {new Date(pattern.created).toLocaleDateString()}
                               </div>
                             </div>
                             <button
                               onClick={() => {
                                 const newCache = getComponentCache();
                                 delete newCache.userPatterns[hash];
                                 saveComponentCache(newCache);
                                 setShowCacheManager(false);
                                 setShowCacheManager(true); // Force re-render
                               }}
                               className="text-red-500 hover:text-red-700 p-1"
                             >
                               <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                               </svg>
                             </button>
                           </div>
                         ));
                       })()}
                     </div>
                   </div>
                   
                   <div className="pt-2 border-t border-gray-200">
                     <button
                       onClick={() => {
                         localStorage.removeItem('ccc_component_cache');
                         setShowCacheManager(false);
                         setShowCacheManager(true); // Force re-render
                       }}
                       className="text-sm text-red-600 hover:text-red-800"
                     >
                       Clear All Cached Patterns
                     </button>
                   </div>
                 </div>
               )}
             </div>
             
             {/* Context Prompt Input */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-8 w-8 bg-gradient-to-r from-green-500 to-blue-600 rounded-full flex items-center justify-center">
                  <svg
                    className="h-4 w-4 text-white"
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
                <h3 className="font-semibold text-gray-900 text-lg">
                  Describe Your Component
                </h3>
              </div>
              <p className="text-gray-600 text-sm mb-4">
                Tell us what component you want to create. Be specific about the
                fields and functionality you need.
              </p>
              <textarea
                value={contextPrompt}
                onChange={(e) => setContextPrompt(e.target.value)}
                placeholder="Example: I want to create a testimonials component with customer name, testimonial content, customer photo, company name, and rating. The component should be visually appealing and professional."
                className="w-full h-24 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none bg-white"
              />

                             {/* Action Buttons - Enhanced with Auto Generation */}
               <div className="mt-4">
                 <div className="flex gap-3 mb-2">
                   {/* Auto Generation Button */}
                   <button
                     onClick={generateComponentWithAI}
                     disabled={!contextPrompt.trim() || isAutoGenerating}
                     className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl hover:from-purple-600 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
                   >
                     {isAutoGenerating ? (
                       <Loader2 className="h-5 w-5 animate-spin" />
                     ) : (
                       <Zap className="h-5 w-5" />
                     )}
                     {isAutoGenerating ? "Generating..." : "Auto Generate"}
                   </button>
                   
                   {/* Manual ChatGPT Button */}
                   <button
                     onClick={openChatGPT}
                     disabled={!contextPrompt.trim()}
                     className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
                   >
                     <Bot className="h-5 w-5" />
                     Generate with ChatGPT
                   </button>
                   
                   {/* Manual ChatGPT Button */}
                   <button
                     onClick={openChatGPTManually}
                     disabled={contextPrompt.trim()}
                     className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-xl hover:from-gray-600 hover:to-gray-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
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
                         d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                       />
                     </svg>
                     Open ChatGPT Manually
                   </button>
                 </div>
                                   <p className="text-xs text-gray-600">
                    💡 <strong>Auto Generate:</strong> Fully automatic AI component creation - just click and your component will be ready! <strong>Generate with ChatGPT:</strong> Opens ChatGPT with pre-filled prompt for manual copy-paste. <strong>Manual:</strong> Opens ChatGPT with blank page.
                  </p>
               </div>

               

                             {/* Enhanced Auto Generation Progress */}
               {isAutoGenerating && (
                 <div className="mt-6 p-6 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-xl shadow-lg">
                   <div className="flex items-center gap-4 mb-4">
                     <div className="relative">
                       <div className="h-12 w-12 bg-gradient-to-r from-purple-500 to-blue-600 rounded-full flex items-center justify-center">
                         <Loader2 className="h-6 w-6 text-white animate-spin" />
                       </div>
                       <div className="absolute -top-1 -right-1 h-4 w-4 bg-green-500 rounded-full animate-pulse"></div>
                     </div>
                     <div className="flex-1">
                       <h4 className="text-lg font-semibold text-gray-900 mb-1">
                         AI Component Generation
                       </h4>
                       <p className="text-sm text-gray-600">
                         {autoGenerationStep}
                       </p>
                     </div>
                     <div className="text-right">
                       <div className="text-2xl font-bold text-purple-600">
                         {autoGenerationProgress}%
                       </div>
                     </div>
                   </div>
                   
                   {/* Enhanced Progress Bar */}
                   <div className="relative">
                     <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                       <div
                         className="bg-gradient-to-r from-purple-500 via-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500 ease-out shadow-lg"
                         style={{ width: `${autoGenerationProgress}%` }}
                       ></div>
                     </div>
                     {/* Animated dots */}
                     <div className="flex justify-center mt-3 space-x-1">
                       <div className={`h-2 w-2 rounded-full transition-all duration-300 ${autoGenerationProgress >= 20 ? 'bg-purple-500' : 'bg-gray-300'}`}></div>
                       <div className={`h-2 w-2 rounded-full transition-all duration-300 ${autoGenerationProgress >= 40 ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                       <div className={`h-2 w-2 rounded-full transition-all duration-300 ${autoGenerationProgress >= 60 ? 'bg-purple-500' : 'bg-gray-300'}`}></div>
                       <div className={`h-2 w-2 rounded-full transition-all duration-300 ${autoGenerationProgress >= 80 ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                       <div className={`h-2 w-2 rounded-full transition-all duration-300 ${autoGenerationProgress >= 100 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                     </div>
                   </div>
                   
                                       {/* AI Status Messages */}
                    <div className="mt-4 p-3 bg-white rounded-lg border border-purple-100">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-xs text-gray-600 font-medium">
                          {isUsingCachedStructure ? 
                            "Using optimized cached structure for faster generation and cost savings..." :
                            "AI is analyzing your requirements and generating the perfect component structure..."
                          }
                        </span>
                      </div>
                      {isUsingCachedStructure && (
                        <div className="mt-2 flex items-center gap-2">
                          <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                          <span className="text-xs text-blue-600 font-medium">
                            💰 Cost optimized: Using cached structure (saved from previous generation)
                          </span>
                        </div>
                      )}
                    </div>
                 </div>
               )}

              {/* Repeater Option */}
              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
                      <svg
                        className="h-4 w-4 text-white"
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
                      <h3 className="font-semibold text-gray-900 text-lg">
                        Multiple Instances
                      </h3>
                      <p className="text-sm text-gray-600">
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
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>
              </div>
            </div>

                         {/* ChatGPT JSON Input - Only show for manual mode */}
             {showManualSection && (
               <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-8 w-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <svg
                    className="h-4 w-4 text-white"
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
                <h3 className="font-semibold text-gray-900 text-lg">
                  Paste ChatGPT Response
                </h3>
              </div>
              <p className="text-gray-600 text-sm mb-4">
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
                className="w-full h-48 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-white font-mono text-sm"
              />

              {/* Processing Progress */}
              {isProcessingChatGPT && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
                    <span className="text-sm font-medium text-blue-800">
                      {processingStep}
                    </span>
                  </div>
                  <div className="w-full bg-blue-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${processingProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="mt-4 flex gap-3">
                <button
                  onClick={validateAndParseChatGPTJson}
                  disabled={!chatGPTJson.trim() || isProcessingChatGPT}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
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
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Validate JSON
                </button>
                <button
                  onClick={processChatGPTJson}
                  disabled={!parsedComponent || isProcessingChatGPT}
                  className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
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
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                  Create Component
                </button>
              </div>

              {/* Validation Status */}
              {parsedComponent && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <svg
                      className="h-5 w-5 text-green-600"
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
                      <p className="text-sm font-medium text-green-800">
                        JSON Validated Successfully!
                      </p>
                      <p className="text-xs text-green-600">
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
