import React, { useState } from 'react';
import axios from 'axios';

function FieldPopup({ componentId, onClose, onFieldAdded }) {
  const [label, setLabel] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState('text');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const generateHandle = (inputLabel) => {
    return inputLabel.toLowerCase().replace(/\s+/g, '_').replace(/[^\w_]+/g, '');
  };

  const handleSubmit = async () => {
    if (!label) {
      setError('Please enter a display label');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const fieldName = name || generateHandle(label);

      const formData = new FormData();
      formData.append('action', 'ccc_add_field');
      formData.append('nonce', window.cccData.nonce);
      formData.append('label', label);
      formData.append('name', fieldName);
      formData.append('type', type);
      formData.append('component_id', componentId);

      const response = await axios.post(window.cccData.ajaxUrl, formData);

      if (response.data.success) {
        onFieldAdded();
        onClose();
      } else {
        setError(response.data.message || 'Failed to add field');
      }
    } catch (error) {
      console.error('Error adding field:', error);
      setError('Failed to connect to server. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        <h3 className="text-xl font-semibold mb-4 text-gray-800">Add New Field</h3>

        {error && (
          <div className="mb-4 px-4 py-2 rounded bg-red-100 text-red-800">
            {error}
          </div>
        )}

        <div className="mb-3">
          <label className="block text-gray-700 mb-1">Display Label</label>
          <input
            type="text"
            value={label}
            placeholder="Display Label"
            onChange={(e) => {
              const value = e.target.value;
              setLabel(value);
              if (!name || name === generateHandle(label)) {
                setName(generateHandle(value));
              }
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isSubmitting}
          />
        </div>

        <div className="mb-3">
          <label className="block text-gray-700 mb-1">Handle</label>
          <input
            type="text"
            value={name}
            placeholder="Handle (generated automatically)"
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isSubmitting}
          />
          <p className="text-xs text-gray-500 mt-1">
            This will be used in code. Automatically generated from label if left empty.
          </p>
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 mb-1">Field Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isSubmitting}
          >
            <option value="text">Text</option>
            <option value="text-area">Textarea</option>
          </select>
        </div>

        <div className="flex justify-end space-x-2">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={`px-4 py-2 rounded transition ${
              isSubmitting
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {isSubmitting ? 'Saving...' : 'Save'}
          </button>
          <button
            onClick={onClose}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition"
            disabled={isSubmitting}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default FieldPopup;