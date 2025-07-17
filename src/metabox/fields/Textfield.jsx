import React from 'react'

function Textfield() {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700">Text Field</label>
      <input
        type="text"
        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring focus:ring-opacity-50"
        placeholder="Enter text"
      />
    </div>
  )
}

export default Textfield
