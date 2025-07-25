import React from 'react';

function SelectField({ label, value, onChange, options = [], multiple = false, required = false, error }) {
  const handleChange = (e) => {
    if (multiple) {
      // Handled by checkbox logic below
      return;
    } else {
      onChange(e.target.value);
    }
  };

  // For multiple, handle checkbox toggling
  const handleCheckboxChange = (optionValue) => {
    let newValue = Array.isArray(value) ? [...value] : [];
    if (newValue.includes(optionValue)) {
      newValue = newValue.filter(v => v !== optionValue);
    } else {
      newValue.push(optionValue);
    }
    // Always ensure unique values
    newValue = Array.from(new Set(newValue));
    onChange(newValue);
  };

  return (
    <div className="mb-4">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      {multiple ? (
        <div className="flex flex-col gap-2">
          {options.map(opt => (
            <label key={opt.value} className={`flex items-center gap-2 px-3 py-2 rounded border ${Array.isArray(value) && value.includes(opt.value) ? 'bg-pink-50 border-pink-400 font-semibold' : 'border-gray-300'}`}>
              <input
                type="checkbox"
                checked={Array.isArray(value) && value.includes(opt.value)}
                onChange={() => handleCheckboxChange(opt.value)}
                className="h-4 w-4 text-pink-600 border-gray-300 rounded focus:ring-pink-400"
              />
              <span>{opt.label}</span>
            </label>
          ))}
          {Array.isArray(value) && value.length > 0 && (
            <div className="mt-2 text-xs text-gray-600">
              Selected: {options.filter(opt => value.includes(opt.value)).map(opt => opt.label).join(', ')}
            </div>
          )}
        </div>
      ) : (
        <select
          className="w-full border border-gray-300 rounded-lg shadow-sm"
          value={value}
          onChange={handleChange}
          required={required}
        >
          <option value="">-- Select --</option>
          {options.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      )}
      {error && <div className="text-xs text-red-500 mt-1">This field is required.</div>}
    </div>
  );
}

export default SelectField; 