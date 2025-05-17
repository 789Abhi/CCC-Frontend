import React, { useState } from 'react';
import axios from 'axios';

function FieldPopup({ componentId, onClose, onFieldAdded }) {
  const [label, setLabel] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState('text');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Generate a handle from the label
  const generateHandle = (inputLabel) => {
    return inputLabel.toLowerCase().replace(/\s+/g, '_').replace(/[^\w_]+/g, '');
  };

  const handleSubmit = async () => {
    // Validate form
    if (!label) {
      setError('Please enter a display label');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      // Use a handle generated from the label if none is provided
      const fieldName = name || generateHandle(label);
      
      const formData = new FormData();
      formData.append('action', 'ccc_add_field');
      formData.append('nonce', window.cccData.nonce);
      formData.append('label', label);
      formData.append('name', fieldName);
      formData.append('type', type);
      formData.append('component_id', componentId);

      // Log data for debugging
      console.log('Submitting field:', {
        label,
        name: fieldName,
        type,
        componentId
      });

      const response = await axios.post(window.cccData.ajaxUrl, formData);
      
      console.log('Response:', response.data);

      if (response.data.success) {
        onFieldAdded();
        onClose();
      } else {
        setError(response.data.data?.message || 'Failed to add field');
      }
    } catch (error) {
      console.error('Error adding field:', error);
      
      // Provide detailed error information
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
        setError(`Server error (${error.response.status}): ${error.message}`);
      } else if (error.request) {
        // The request was made but no response was received
        setError('No response from server. Please try again.');
      } else {
        // Something happened in setting up the request that triggered an Error
        setError(`Error: ${error.message}`);
      }
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