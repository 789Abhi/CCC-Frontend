"use client";

import { useState, useEffect } from "react";
import axios from "axios";

const ComponentEditNameModal = ({ isOpen, component, onClose, onSave }) => {
  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  useEffect(() => {
    if (isOpen && component) {
      setName(component.name);
      setHandle(component.handle_name);
      setMessage("");
      setMessageType("");
    }
  }, [isOpen, component]);

  const generateHandle = (name) => {
    return name
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/[^\w_]+/g, "");
  };

  const showMessage = (msg, type) => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => {
      setMessage("");
      setMessageType("");
    }, 5000);
  };

  const handleSubmit = async () => {
    if (!name) {
      showMessage("Please enter a component name", "error");
      return;
    }

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

  if (!isOpen) return null;

  return (
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
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl font-medium"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default ComponentEditNameModal;
