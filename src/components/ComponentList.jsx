import React, { useState } from 'react';
import axios from 'axios';

const ComponentList = () => {
  const [showPopup, setShowPopup] = useState(false);
  const [componentName, setComponentName] = useState('');
  const [handle, setHandle] = useState('');

  const generateHandle = (name) => {
    return name.toLowerCase().replace(/\s+/g, '_').replace(/[^\w_]+/g, '');
  };

  const handleSubmit = async () => {
    if (!componentName) return;

    const payload = {
      action: 'ccc_create_component',
      name: componentName,
      handle: generateHandle(componentName),
      nonce: cccData.nonce,
    };

    try {
      const response = await axios.post(cccData.ajaxUrl, new URLSearchParams(payload));
      alert(response.data.message);
      setShowPopup(false);
      setComponentName('');
    } catch (error) {
      alert('Error creating component.');
    }
  };

  return (
    <div className="p-6">
      <button
        onClick={() => setShowPopup(true)}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
      >
        Add New Component
      </button>

      {showPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4 text-gray-800">Create New Component</h3>
            <input
              type="text"
              value={componentName}
              placeholder="Component Name"
              onChange={(e) => {
                setComponentName(e.target.value);
                setHandle(generateHandle(e.target.value));
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
            />
            <p className="text-sm text-gray-600 mb-4">Handle: <span className="font-mono text-black">{handle}</span></p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={handleSubmit}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
              >
                Save
              </button>
              <button
                onClick={() => setShowPopup(false)}
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComponentList;
