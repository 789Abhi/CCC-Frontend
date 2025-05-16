import React, { useState } from 'react';
import axios from 'axios';

function FieldPopup({ componentId, onClose, onFieldAdded }) {
  const [label, setLabel] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState('text');

  const handleSubmit = async () => {
    try {
      const formData = new FormData();
      formData.append('action', 'ccc_add_field');
      formData.append('nonce', window.cccData.nonce);
      formData.append('label', label);
      formData.append('name', name);
      formData.append('type', type);
      formData.append('component_id', componentId);

      const response = await axios.post(window.cccData.ajaxUrl, formData);

      if (response.data.success) {
        onFieldAdded();
        onClose();
      } else {
        alert(response.data.message || 'Failed to add field.');
      }
    } catch (error) {
      console.error('Error adding field:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        <h3 className="text-xl font-semibold mb-4 text-gray-800">Add New Field</h3>
        <input
          type="text"
          value={label}
          placeholder="Display Label"
          onChange={(e) => setLabel(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded mb-3"
        />
        <input
          type="text"
          value={name}
          placeholder="Handle"
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded mb-3"
        />
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded mb-3"
        >
          <option value="text">Text</option>
          <option value="textarea">Textarea</option>
        </select>
        <div className="flex justify-end space-x-2">
          <button
            onClick={handleSubmit}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Save
          </button>
          <button
            onClick={onClose}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default FieldPopup;
