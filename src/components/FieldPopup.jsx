import React, { useState } from 'react';
import axios from 'axios';

function FieldPopup({ componentId, onClose, onFieldAdded }) {
  const [label, setLabel] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState('text');
  const [error, setError] = useState('');

  // Generate handle from label
  const generateHandle = (inputLabel) => {
    return inputLabel.toLowerCase().replace(/\s+/g, '_').replace(/[^\w_]+/g, '');
  };

  const handleSubmit = async () => {
    if (!label) {
      setError('Please enter a display label');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('action', 'ccc_add_field');
      formData.append('nonce', window.cccData.nonce);
      formData.append('label', label);
      formData.append('name', name || generateHandle(label));
      formData.append('type', type);
      formData.append('component_id', componentId);

      const response = await axios.post(window.cccData.ajaxUrl, formData);

      if (response.data.success) {
        onFieldAdded();
        onClose();
      } else {
        setError(response.data.data?.message || 'Failed to add field.');
      }
    } catch (error) {
      console.error('Error adding field:', error);
      setError('Error connecting to server. Please try again.');
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
              setLabel(e.target.value);
              // Auto-generate the handle if not manually modified
              if (!name || name === generateHandle(label)) {
                setName(generateHandle(e.target.value));
              }
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 mb-1">Field Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="text">Text</option>
            <option value="text-area">Textarea</option>
          </select>
        </div>
        
        <div className="flex justify-end space-x-2">
          <button
            onClick={handleSubmit}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
          >
            Save
          </button>
          <button
            onClick={onClose}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default FieldPopup;