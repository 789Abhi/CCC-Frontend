"use client";

import { useState, useEffect } from "react";
import axios from "axios";

const ComponentEditNameModal = ({ isOpen, component, onClose, onSave }) => {
  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [showWarning, setShowWarning] = useState(false);
  const [warningData, setWarningData] = useState(null);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    if (isOpen && component) {
      setName(component.name);
      setHandle(component.handle_name);
      setMessage("");
      setMessageType("");
      setShowWarning(false);
      setWarningData(null);
    }
  }, [isOpen, component]);

  const generateHandle = (name) => {
    return name
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/[^a-z0-9_]+/g, "");
  };

  const showMessage = (msg, type) => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => {
      setMessage("");
      setMessageType("");
    }, 5000);
  };

  const checkTemplateContent = async () => {
    if (!name || !component) return;

    const newHandle = handle || generateHandle(name);
    
    // Don't check if handle hasn't changed
    if (newHandle === component.handle_name) {
      return false;
    }

    setIsChecking(true);
    
    try {
      const formData = new FormData();
      formData.append("action", "ccc_check_template_content");
      formData.append("component_id", component.id);
      formData.append("new_handle", newHandle);
      formData.append("nonce", window.cccData.nonce);

      const response = await axios.post(window.cccData.ajaxUrl, formData);

      if (response.data.success && response.data.has_custom_content) {
        setWarningData(response.data);
        setShowWarning(true);
        return true; // Has custom content, show warning
      }
    } catch (error) {
      console.error("Error checking template content:", error);
    } finally {
      setIsChecking(false);
    }

    return false; // No custom content or error
  };

  const handleSubmit = async () => {
    if (!name) {
      showMessage("Please enter a component name", "error");
      return;
    }

    // Check if template has custom content before proceeding
    const hasCustomContent = await checkTemplateContent();
    if (hasCustomContent) {
      return; // Warning modal will handle the submission
    }

    // Proceed with update if no custom content
    await performUpdate();
  };

  const performUpdate = async () => {
    const formData = new FormData();
    formData.append("action", "ccc_update_component_name");
    formData.append("component_id", component.id);
    formData.append("name", name);
    formData.append("handle", handle || generateHandle(name));
    formData.append("nonce", window.cccData.nonce);

    try {
      const response = await axios.post(window.cccData.ajaxUrl, formData);

      if (response.data.success) {
        showMessage(response.data.message || "Component updated successfully.", "success");
        onSave();
        onClose();
      } else {
        showMessage(response.data.message || "Failed to update component.", "error");
      }
    } catch (error) {
      console.error("Error updating component:", error);
      showMessage("Error connecting to server. Please try again.", "error");
    }
  };

  const handleWarningConfirm = async () => {
    setShowWarning(false);
    setWarningData(null);
    await performUpdate();
  };

  const handleWarningCancel = () => {
    setShowWarning(false);
    setWarningData(null);
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all duration-300">
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-6 rounded-t-2xl text-white">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold">Edit Component</h3>
              <button
                onClick={onClose}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/20 transition-all duration-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {message && (
              <div
                className={`mb-4 p-3 rounded-lg border-l-4 ${
                  messageType === "success"
                    ? "bg-green-50 border-green-400 text-green-800"
                    : "bg-red-50 border-red-400 text-red-800"
                }`}
              >
                <p className="font-medium">{message}</p>
              </div>
            )}

            <div>
              <label htmlFor="editComponentName" className="block text-sm font-medium text-gray-700 mb-2">
                Component Name *
              </label>
              <input
                id="editComponentName"
                type="text"
                value={name}
                onChange={(e) => {
                  const value = e.target.value;
                  setName(value);

                  if (handle === generateHandle(component.name)) {
                    setHandle(generateHandle(value));
                  }
                }}
                placeholder="e.g., Hero Section"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
              />
            </div>

            <div>
              <label htmlFor="editHandle" className="block text-sm font-medium text-gray-700 mb-2">
                Handle (Auto-generated)
              </label>
              <input
                id="editHandle"
                type="text"
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                placeholder="e.g., hero_section"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-600 focus:outline-none"
                disabled={true}
              />
              <p className="text-xs text-gray-500 mt-2">This handle will be used in templates and code.</p>
            </div>
          </div>

          <div className="flex justify-end gap-3 p-6 bg-gray-50 rounded-b-2xl">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-100 transition-all duration-200 font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isChecking}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isChecking ? "Checking..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>

      {/* Warning Modal for Custom Template Content */}
      {showWarning && warningData && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl transform transition-all duration-300">
            <div className="bg-gradient-to-r from-yellow-500 to-orange-500 p-6 rounded-t-2xl text-white">
              <div className="flex items-center gap-3">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <h3 className="text-xl font-bold">Template File Update Warning</h3>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-yellow-800 font-medium">
                  ⚠️ This component's template file contains custom content that will be affected by the name change.
                </p>
                <p className="text-yellow-700 text-sm mt-2">
                  The template file <code className="bg-yellow-100 px-1 rounded">{warningData.current_handle}.php</code> will be renamed to <code className="bg-yellow-100 px-1 rounded">{warningData.new_handle}.php</code>.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-gray-800 mb-2">Current Template Content:</h4>
                <div className="bg-gray-100 rounded-lg p-4 max-h-64 overflow-y-auto">
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap">{warningData.existing_content}</pre>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  <strong>Good news:</strong> All your custom content will be automatically preserved in the new template file!
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-800 text-sm">
                  <strong>What happens:</strong> The system will create a new template file with the updated component information while preserving all your custom HTML, PHP code, and styling.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 p-6 bg-gray-50 rounded-b-2xl">
              <button
                type="button"
                onClick={handleWarningCancel}
                className="px-6 py-3 text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-100 transition-all duration-200 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleWarningConfirm}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl font-medium"
              >
                Continue & Preserve Content
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ComponentEditNameModal;
