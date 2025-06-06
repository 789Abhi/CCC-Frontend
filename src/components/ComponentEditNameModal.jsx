"use client"

import { useState, useEffect } from "react"

const ComponentEditNameModal = ({ component, onClose, onSave, showMessage }) => {
  const [name, setName] = useState(component?.name || "")
  const [handle, setHandle] = useState(component?.handle_name || "")

  useEffect(() => {
    if (component) {
      setName(component.name)
      setHandle(component.handle_name)
    }
  }, [component])

  const generateHandle = (inputName) => {
    return inputName
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/[^\w_]+/g, "")
  }

  const handleSubmit = () => {
    if (!name || !handle) {
      showMessage("Component name and handle are required.", "error")
      return
    }
    onSave({ ...component, name, handle_name: handle })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md transform transition-all duration-300 scale-100">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Edit Component Name</h2>
        <div className="mb-4">
          <label htmlFor="editComponentName" className="block text-sm font-medium text-gray-700 mb-2">
            Component Name
          </label>
          <input
            type="text"
            id="editComponentName"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              setHandle(generateHandle(e.target.value))
            }}
            placeholder="e.g., Hero Section"
          />
        </div>
        <div className="mb-6">
          <label htmlFor="editComponentHandle" className="block text-sm font-medium text-gray-700 mb-2">
            Handle (auto-generated)
          </label>
          <input
            type="text"
            id="editComponentHandle"
            className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-50 cursor-not-allowed"
            value={handle}
            readOnly
          />
        </div>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-5 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-5 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  )
}

export default ComponentEditNameModal
