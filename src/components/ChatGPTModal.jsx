import React, { useState } from "react";
import { Bot } from "lucide-react";
import axios from "axios";

const ChatGPTModal = ({ isOpen, onClose, onComponentCreated }) => {
  const [chatGPTJson, setChatGPTJson] = useState("");
  const [isProcessingChatGPT, setIsProcessingChatGPT] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [parsedComponent, setParsedComponent] = useState(null);
  const [processingStep, setProcessingStep] = useState("");
  const [processingProgress, setProcessingProgress] = useState(0);
  const [contextPrompt, setContextPrompt] = useState("");
  const [hasRepeater, setHasRepeater] = useState(false);

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

Available field types: text, textarea, image, video, color, select, checkbox, radio, wysiwyg
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

    // Copy prompt to clipboard
    copyToClipboard(prompt);

    // Open ChatGPT
    window.open("https://chat.openai.com", "_blank");
  };

  const openChatGPTManually = () => {
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
      ];
      const fieldTypeMapping = {
        number: "text",
        email: "text",
        url: "text",
        tel: "text",
        password: "text",
        file: "image",
        image: "image",
        video: "video",
        color: "color",
        select: "select",
        dropdown: "select",
        checkbox: "checkbox",
        radio: "radio",
        wysiwyg: "wysiwyg",
        editor: "wysiwyg",
        repeater: "repeater",
        repeat: "repeater",
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
        } else if (normalizedField.type === "repeater" && field.children) {
          // Handle repeater field with nested children from ChatGPT
          normalizedField.children = field.children.map(
            (child, childIndex) => ({
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
            })
          );
        }

        // Handle additional field properties
        if (field.return_format) {
          normalizedField.config.return_format = field.return_format;
        }

        return normalizedField;
      });

      const finalComponentData = {
        component: normalizedComponent,
        fields: normalizedFields,
      };

      setParsedComponent(finalComponentData);
      setShowConfirmation(true);
      return true;
    } catch (error) {
      showMessage("Please check your JSON format and try again", "error");
      return false;
    }
  };

  const handleChatGPTJsonSubmit = async () => {
    if (!parsedComponent) {
      showMessage("No valid component data to create", "error");
      return;
    }

    setIsProcessingChatGPT(true);
    setProcessingStep("Initializing component creation...");
    setProcessingProgress(10);

    try {
      // Step 1: Create component
      setProcessingStep("Creating component...");
      setProcessingProgress(30);

      const componentPayload = {
        name: parsedComponent.component.name,
        handle_name: parsedComponent.component.handle,
        description: parsedComponent.component.description || "",
        status: "active",
      };

      console.log("Creating component with payload:", componentPayload); // Debug log

      const componentResponse = await axios.post(
        "/wp-json/ccc/v1/components",
        componentPayload
      );
      console.log("Component creation result:", componentResponse.data); // Debug log

      if (!componentResponse.data.success) {
        throw new Error(
          componentResponse.data.message || "Failed to create component"
        );
      }

      const componentId = componentResponse.data.data.id;
      setProcessingStep("Component created successfully!");
      setProcessingProgress(50);

      // Step 2: Create fields
      setProcessingStep("Creating fields...");
      setProcessingProgress(60);

      let fieldsCreated = 0;
      const totalFields = parsedComponent.fields.length;

      console.log("Creating fields:", parsedComponent.fields); // Debug log

      for (const fieldData of parsedComponent.fields) {
        try {
          setProcessingStep(
            `Creating field ${fieldsCreated + 1} of ${totalFields}: ${
              fieldData.label
            }`
          );
          setProcessingProgress(60 + ((fieldsCreated + 1) / totalFields) * 30);

          const fieldPayload = {
            component_id: componentId,
            label: fieldData.label,
            name: fieldData.name,
            type: fieldData.type,
            required: fieldData.required || false,
            placeholder: fieldData.placeholder || "",
            config: fieldData.config ? JSON.stringify(fieldData.config) : "{}",
            order: fieldsCreated + 1,
          };

          console.log("Creating field with payload:", fieldPayload); // Debug log

          const fieldResponse = await axios.post(
            "/wp-json/ccc/v1/fields",
            fieldPayload
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
                    Create Component with ChatGPT
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

                             {/* Action Buttons - Right after input */}
               <div className="mt-4">
                 <div className="flex gap-3 mb-2">
                   <button
                     onClick={openChatGPT}
                     disabled={!contextPrompt.trim()}
                     className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
                   >
                     <Bot className="h-5 w-5" />
                     Copy AI Prompt & Open ChatGPT
                   </button>
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
                   💡 <strong>AI Prompt:</strong> Copies generated prompt to clipboard. <strong>Manual:</strong> Opens ChatGPT with blank page.
                 </p>
               </div>

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
                      <p className="text-gray-600 text-sm">
                        Will you need to add multiple instances of this
                        component? (e.g., multiple testimonials, team members,
                        etc.)
                      </p>
                    </div>
                  </div>
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={hasRepeater}
                      onChange={(e) => setHasRepeater(e.target.checked)}
                      className="h-5 w-5 rounded border-gray-300 text-green-600 focus:ring-green-500"
                    />
                    <span className="text-gray-900 font-medium">
                      Yes, use repeater field
                    </span>
                  </label>
                </div>
              </div>

              <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-gray-900 font-medium mb-2">💡 Examples:</p>
                <ul className="text-gray-700 text-sm space-y-1">
                  <li>
                    • "Testimonials with customer name, content, photo, company,
                    and rating"
                  </li>
                  <li>
                    • "Team members with name, position, bio, photo, and social
                    links"
                  </li>
                  <li>
                    • "Portfolio items with title, description, image, category,
                    and link"
                  </li>
                  <li>• "FAQ section with question, answer, and category"</li>
                </ul>
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-8 w-8 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-full flex items-center justify-center">
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
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 text-lg">
                  Next Steps
                </h3>
              </div>
              <ol className="text-gray-700 space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="bg-gray-200 text-gray-700 rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium mt-0.5">
                    1
                  </span>
                  <span>Describe your component in the textarea above</span>
                </li>
                                 <li className="flex items-start gap-2">
                   <span className="bg-gray-200 text-gray-700 rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium mt-0.5">
                     2
                   </span>
                   <span>
                     Click "Copy AI Prompt & Open ChatGPT" for AI-generated prompts or "Open ChatGPT Manually" for blank page
                   </span>
                 </li>
                 <li className="flex items-start gap-2">
                   <span className="bg-gray-200 text-gray-700 rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium mt-0.5">
                     3
                   </span>
                   <span>
                     For AI prompt: Paste the copied prompt (Ctrl+V) in ChatGPT. For manual: Type your own prompt.
                   </span>
                 </li>
                <li className="flex items-start gap-2">
                  <span className="bg-gray-200 text-gray-700 rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium mt-0.5">
                    4
                  </span>
                  <span>
                    Check "repeater field" if you need multiple instances
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="bg-gray-200 text-gray-700 rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium mt-0.5">
                    5
                  </span>
                  <span>Copy the JSON response from ChatGPT</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="bg-gray-200 text-gray-700 rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium mt-0.5">
                    6
                  </span>
                  <span>Paste it in the textarea below and click "Update"</span>
                </li>
              </ol>
            </div>

            {/* JSON Input */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-8 w-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
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
                  Paste ChatGPT JSON Response
                </h3>
              </div>
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
                className="w-full h-64 p-4 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none bg-gray-50"
              />
            </div>
          </div>

          {/* Footer - Fixed */}
          <div className="flex justify-end gap-3 p-6 bg-white border-t border-gray-200 flex-shrink-0 shadow-lg">
            <button
              onClick={handleClose}
              className="px-6 py-3 text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={validateAndParseChatGPTJson}
              disabled={isProcessingChatGPT || !chatGPTJson.trim()}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
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
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
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
                  <svg
                    className="h-6 w-6 text-green-600"
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
                </div>
                <h2 className="text-xl font-bold text-gray-900">
                  Confirm Component Creations
                </h2>
              </div>
            </div>

            <div className="p-6">
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-2">
                  Component Details:
                </h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div>
                    <strong>Name:</strong> {parsedComponent.component.name}
                  </div>
                  <div>
                    <strong>Handle:</strong> {parsedComponent.component.handle}
                  </div>
                  <div>
                    <strong>Description:</strong>{" "}
                    {parsedComponent.component.description || "No description"}
                  </div>
                  <div>
                    <strong>Fields:</strong> {parsedComponent.fields.length}{" "}
                    field(s)
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-2">
                  Fields Preview:
                </h3>
                <div className="max-h-48 overflow-y-auto space-y-2">
                  {parsedComponent.fields.map((field, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between bg-gray-50 rounded-lg p-3"
                    >
                      <div className="flex items-center gap-3">
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                          {field.type}
                        </span>
                        <span className="font-medium">{field.label}</span>
                        {field.required && (
                          <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs">
                            Required
                          </span>
                        )}
                      </div>
                      <span className="text-gray-500 text-sm">
                        {field.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <svg
                    className="h-5 w-5 text-yellow-600 mt-0.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                  <div>
                    <p className="text-yellow-800 font-medium">
                      Ready to Create
                    </p>
                    <p className="text-yellow-700 text-sm mt-1">
                      This will create a new component with{" "}
                      {parsedComponent.fields.length} fields. You can edit them
                      later in the component list.
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
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Processing...
                </h3>
                <p className="text-gray-600 text-sm">{processingStep}</p>
              </div>

              {/* Loading Animation */}
              <div className="flex justify-center space-x-1">
                <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce"></div>
                <div
                  className="w-2 h-2 bg-green-600 rounded-full animate-bounce"
                  style={{ animationDelay: "0.1s" }}
                ></div>
                <div
                  className="w-2 h-2 bg-green-600 rounded-full animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatGPTModal;
