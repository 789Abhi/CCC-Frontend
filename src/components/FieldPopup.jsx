import React, { useState } from "react";
import axios from "axios";

const FieldPopup = ({ componentId, onClose, onFieldAdded }) => {
  const [label, setLabel] = useState("");
  const [name, setName] = useState("");
  const [type, setType] = useState("text");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const generateFieldName = (label) => {
    return label.toLowerCase().replace(/\s+/g, "_").replace(/[^\w_]+/g, "");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!label.trim()) {
      setError("Please enter a field label");
      setLoading(false);
      return;
    }

    if (!name.trim()) {
      setError("Please enter a field name");
      setLoading(false);
      return;
    }

    if (!type) {
      setError("Please select a field type");
      setLoading(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append("action", "ccc_add_field");
      formData.append("nonce", window.cccData.nonce);
      formData.append("label", label);
      formData.append("name", name);
      formData.append("type", type);
      formData.append("component_id", componentId);

      const response = await axios.post(window.cccData.ajaxUrl, formData);

      if (response.data.success) {
        onFieldAdded && onFieldAdded();
        onClose();
      } else {
        setError(response.data.data?.message || "Failed to add field");
      }
    } catch (err) {
      console.error("Error adding field:", err);
      setError("Failed to connect to server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        <h3 className="text-xl font-semibold mb-4">Add New Field</h3>
        
        {error && (
          <div className="mb-4 px-3 py-2 bg-red-100 text-red-800 rounded">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="block text-gray-700 text-sm font-medium mb-1">
              Label
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => {
                const value = e.target.value;
                setLabel(value);
                // Auto-generate name if not manually modified
                if (!name || name === generateFieldName(label)) {
                  setName(generateFieldName(value));
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Field Label"
            />
          </div>

          <div className="mb-3">
            <label className="block text-gray-700 text-sm font-medium mb-1">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="field_name"
            />
            <p className="text-xs text-gray-500 mt-1">
              Unique identifier used in code
            </p>
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-medium mb-1">
              Type
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="text">Text</option>
              <option value="textarea">Text Area</option>
              <option value="number">Number</option>
              <option value="select">Select</option>
              <option value="image">Image</option>
              <option value="rich_text">Rich Text Editor</option>
              <option value="post_selector">Post Selector</option>
            </select>
          </div>

          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
              disabled={loading}
            >
              {loading ? "Adding..." : "Add Field"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FieldPopup;