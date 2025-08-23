import React from 'react';

function SelectField({ label, value, onChange, options = [], multiple = false, required = false, error }) {
  // Validate and normalize props
  const safeOptions = Array.isArray(options) ? options : [];
  const safeValue = value !== undefined && value !== null ? value : (multiple ? [] : '');
  
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
    let newValue = Array.isArray(safeValue) ? [...safeValue] : [];
    if (newValue.includes(optionValue)) {
      newValue = newValue.filter(v => v !== optionValue);
    } else {
      newValue.push(optionValue);
    }
    // Always ensure unique values
    newValue = Array.from(new Set(newValue));
    onChange(newValue);
  };

  // Ensure options have the required structure
  const normalizedOptions = safeOptions.map(opt => {
    if (typeof opt === 'string') {
      return { label: opt, value: opt };
    } else if (opt && typeof opt === 'object' && opt.value !== undefined) {
      return { label: opt.label || opt.value, value: opt.value };
    } else {
      return { label: 'Invalid Option', value: '' };
    }
  }).filter(opt => opt.value !== '');

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
          {normalizedOptions.map(opt => (
            <label key={opt.value} className={`flex items-center gap-2 px-3 py-2 rounded border ${Array.isArray(safeValue) && safeValue.includes(opt.value) ? 'bg-pink-50 border-pink-400 font-semibold' : 'border-gray-300'}`}>
              <input
                type="checkbox"
                checked={Array.isArray(safeValue) && safeValue.includes(opt.value)}
                onChange={() => handleCheckboxChange(opt.value)}
                className="h-4 w-4 text-pink-600 border-gray-300 rounded focus:ring-pink-400"
              />
              <span>{opt.label}</span>
            </label>
          ))}
          {Array.isArray(safeValue) && safeValue.length > 0 && (
            <div className="mt-2 text-xs text-gray-600">
              Selected: {normalizedOptions.filter(opt => safeValue.includes(opt.value)).map(opt => opt.label).join(', ')}
            </div>
          )}
        </div>
      ) : (
        <select
          className="w-full border border-gray-300 rounded-lg shadow-sm"
          value={safeValue}
          onChange={handleChange}
          required={required}
        >
          <option value="">-- Select --</option>
          {normalizedOptions.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      )}
      {error && <div className="text-xs text-red-500 mt-1">This field is required.</div>}
    </div>
  );
}

export default SelectField; 