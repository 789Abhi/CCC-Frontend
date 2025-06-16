"use client"

import { useState } from "react"
import axios from "axios"

function FieldPopup({ componentId, onClose, onFieldAdded }) {
  const [label, setLabel] = useState("")
  const [name, setName] = useState("")
  const [type, setType] = useState("text")
  const [maxSets, setMaxSets] = useState("")
  const [allowedFields, setAllowedFields] = useState(["text", "textarea", "image"])
  const [imageReturnType, setImageReturnType] = useState("url")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [options, setOptions] = useState([{ label: "", value: "" }])
  const [groupFields, setGroupFields] = useState([{ type: "text", label: "", name: "", required: false }])

  const availableFieldTypes = [
    "text",
    "textarea",
    "image",
    "repeater",
    "color",
    "wysiwyg",
    "checkbox",
    "radio",
    "group"
  ]

  const generateHandle = (inputLabel) => {
    return inputLabel
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/[^\w_]+/g, "")
  }

  const handleAllowedFieldChange = (fieldType, checked) => {
    if (checked) {
      setAllowedFields([...allowedFields, fieldType])
    } else {
      setAllowedFields(allowedFields.filter((f) => f !== fieldType))
    }
  }

  const handleOptionChange = (index, field, value) => {
    const newOptions = [...options]
    newOptions[index] = { ...newOptions[index], [field]: value }
    setOptions(newOptions)
  }

  const addOption = () => {
    setOptions([...options, { label: "", value: "" }])
  }

  const removeOption = (index) => {
    setOptions(options.filter((_, i) => i !== index))
  }

  const handleGroupFieldChange = (index, field, value) => {
    const newFields = [...groupFields]
    newFields[index] = { ...newFields[index], [field]: value }
    setGroupFields(newFields)
  }

  const addGroupField = () => {
    setGroupFields([...groupFields, { type: "text", label: "", name: "", required: false }])
  }

  const removeGroupField = (index) => {
    setGroupFields(groupFields.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    if (!label) {
      setError("Please enter a display label")
      return
    }

    if (type === "repeater" && allowedFields.length === 0) {
      setError("Please select at least one allowed field type for the repeater")
      return
    }

    if ((type === "checkbox" || type === "radio") && options.some(opt => !opt.label || !opt.value)) {
      setError("Please fill in all option labels and values")
      return
    }

    if (type === "group" && groupFields.some(field => !field.label || !field.name)) {
      setError("Please fill in all group field labels and names")
      return
    }

    setIsSubmitting(true)
    setError("")

    try {
      const fieldName = name || generateHandle(label)

      const formData = new FormData()
      formData.append("action", "ccc_add_field")
      formData.append("nonce", window.cccData.nonce)
      formData.append("label", label)
      formData.append("name", fieldName)
      formData.append("type", type)
      formData.append("component_id", componentId)

      // Add type-specific configurations
      if (type === "repeater") {
        formData.append("max_sets", maxSets || "0")
        formData.append("allowed_fields", JSON.stringify(allowedFields))
      } else if (type === "image") {
        formData.append("return_type", imageReturnType)
      } else if (type === "checkbox" || type === "radio") {
        formData.append("field_config", JSON.stringify({ options }))
      } else if (type === "group") {
        formData.append("field_config", JSON.stringify({ fields: groupFields }))
      }

      const response = await axios.post(window.cccData.ajaxUrl, formData)

      if (response.data.success) {
        onFieldAdded()
        onClose()
      } else {
        setError(response.data.message || "Failed to add field")
      }
    } catch (error) {
      console.error("Error adding field:", error)
      setError("Failed to connect to server. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-semibold mb-4 text-gray-800">Add New Field</h3>

        {error && <div className="mb-4 px-4 py-2 rounded bg-red-100 text-red-800">{error}</div>}

        <div className="mb-3">
          <label className="block text-gray-700 mb-1">Display Label</label>
          <input
            type="text"
            value={label}
            placeholder="Display Label"
            onChange={(e) => {
              const value = e.target.value
              setLabel(value)
              if (!name || name === generateHandle(label)) {
                setName(generateHandle(value))
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
            <option value="image">Image</option>
            <option value="repeater">Repeater</option>
            <option value="color">Color Picker</option>
            <option value="wysiwyg">WYSIWYG Editor</option>
            <option value="checkbox">Checkbox</option>
            <option value="radio">Radio Buttons</option>
            <option value="group">Field Group</option>
          </select>
        </div>

        {type === "image" && (
          <div className="mb-4">
            <label className="block text-gray-700 mb-1">Return Type</label>
            <select
              value={imageReturnType}
              onChange={(e) => setImageReturnType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isSubmitting}
            >
              <option value="url">URL Only</option>
              <option value="array">Full Image Data (ID, URL, Alt, etc.)</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Choose whether to return just the image URL or complete image data including ID, alt text, etc.
            </p>
          </div>
        )}

        {(type === "checkbox" || type === "radio") && (
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Options</label>
            {options.map((option, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={option.label}
                  onChange={(e) => handleOptionChange(index, "label", e.target.value)}
                  placeholder="Option Label"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isSubmitting}
                />
                <input
                  type="text"
                  value={option.value}
                  onChange={(e) => handleOptionChange(index, "value", e.target.value)}
                  placeholder="Option Value"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => removeOption(index)}
                  className="px-2 py-1 text-red-600 hover:text-red-800"
                  disabled={isSubmitting}
                >
                  ×
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addOption}
              className="mt-2 px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded"
              disabled={isSubmitting}
            >
              Add Option
            </button>
          </div>
        )}

        {type === "group" && (
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Group Fields</label>
            {groupFields.map((field, index) => (
              <div key={index} className="mb-4 p-3 border border-gray-200 rounded">
                <div className="flex gap-2 mb-2">
                  <select
                    value={field.type}
                    onChange={(e) => handleGroupFieldChange(index, "type", e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isSubmitting}
                  >
                    <option value="text">Text</option>
                    <option value="text-area">Textarea</option>
                    <option value="image">Image</option>
                    <option value="color">Color Picker</option>
                    <option value="wysiwyg">WYSIWYG Editor</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => removeGroupField(index)}
                    className="px-2 py-1 text-red-600 hover:text-red-800"
                    disabled={isSubmitting}
                  >
                    ×
                  </button>
                </div>
                <input
                  type="text"
                  value={field.label}
                  onChange={(e) => handleGroupFieldChange(index, "label", e.target.value)}
                  placeholder="Field Label"
                  className="w-full mb-2 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isSubmitting}
                />
                <input
                  type="text"
                  value={field.name}
                  onChange={(e) => handleGroupFieldChange(index, "name", e.target.value)}
                  placeholder="Field Name"
                  className="w-full mb-2 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isSubmitting}
                />
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={field.required}
                    onChange={(e) => handleGroupFieldChange(index, "required", e.target.checked)}
                    className="mr-2"
                    disabled={isSubmitting}
                  />
                  Required
                </label>
              </div>
            ))}
            <button
              type="button"
              onClick={addGroupField}
              className="mt-2 px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded"
              disabled={isSubmitting}
            >
              Add Field to Group
            </button>
          </div>
        )}

        {type === "repeater" && (
          <>
            <div className="mb-4">
              <label className="block text-gray-700 mb-1">Maximum Sets (leave empty for unlimited)</label>
              <input
                type="number"
                value={maxSets}
                onChange={(e) => setMaxSets(e.target.value)}
                placeholder="Optional"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isSubmitting}
              />
              <p className="text-xs text-gray-500 mt-1">
                Limit how many items can be added to this repeater field. Leave empty for unlimited.
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Allowed Field Types</label>
              <div className="space-y-2">
                {availableFieldTypes
                  .filter((t) => t !== "repeater" && t !== "group")
                  .map((fieldType) => (
                    <label key={fieldType} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={allowedFields.includes(fieldType)}
                        onChange={(e) => handleAllowedFieldChange(fieldType, e.target.checked)}
                        className="mr-2"
                        disabled={isSubmitting}
                      />
                      <span className="capitalize">{fieldType.replace(/-/g, " ")}</span>
                    </label>
                  ))}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Select which field types can be added inside this repeater field.
              </p>
            </div>
          </>
        )}

        <div className="flex justify-end space-x-2">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={`px-4 py-2 rounded transition ${
              isSubmitting ? "bg-gray-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700 text-white"
            }`}
          >
            {isSubmitting ? "Saving..." : "Save"}
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
  )
}

export default FieldPopup
