import React from 'react';

function SelectField({ label, value, onChange, options = [], multiple = false, required = false, error }) {
  const handleChange = (e) => {
    if (multiple) {
      const selected = Array.from(e.target.selectedOptions).map(opt => opt.value);
      onChange(selected);
    } else {
      onChange(e.target.value);
    }
  };
  return (
    <div className="mb-4">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <select
        className="w-full border border-gray-300 rounded-lg shadow-sm"
        value={value}
        onChange={handleChange}
        multiple={multiple}
        required={required}
      >
        {!multiple && <option value="">-- Select --</option>}
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {error && <div className="text-xs text-red-500 mt-1">This field is required.</div>}
    </div>
  );
}

export default SelectField; 