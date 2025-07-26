import React from 'react';

function CheckboxField({ label, value, onChange, options = [], required = false, error }) {
  // Checkbox fields are always multiple by default
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
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="flex flex-col gap-3">
        {options.map(opt => (
          <label 
            key={opt.value} 
            className={`flex items-center gap-3 px-4 py-3 rounded-lg border-2 transition-all duration-200 cursor-pointer hover:shadow-md ${
              Array.isArray(value) && value.includes(opt.value) 
                ? 'bg-green-50 border-green-400 shadow-green-100' 
                : 'bg-white border-gray-200 hover:border-gray-300'
            }`}
          >
            <input
              type="checkbox"
              checked={Array.isArray(value) && value.includes(opt.value)}
              onChange={() => handleCheckboxChange(opt.value)}
              className="h-5 w-5 text-green-600 border-gray-300 rounded focus:ring-green-500 focus:ring-2 transition-colors"
            />
            <span className={`font-medium ${
              Array.isArray(value) && value.includes(opt.value) 
                ? 'text-green-800' 
                : 'text-gray-700'
            }`}>
              {opt.label}
            </span>
            {Array.isArray(value) && value.includes(opt.value) && (
              <svg className="w-5 h-5 text-green-600 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            )}
          </label>
        ))}
      </div>
      
      {/* Selected items summary */}
      {Array.isArray(value) && value.length > 0 && (
        <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-medium text-green-800">Selected Items:</span>
          </div>
          <div className="text-sm text-green-700">
            {options.filter(opt => value.includes(opt.value)).map(opt => opt.label).join(', ')}
          </div>
        </div>
      )}
      
      {/* Empty state */}
      {(!Array.isArray(value) || value.length === 0) && (
        <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="text-sm text-gray-500 text-center">
            No items selected
          </div>
        </div>
      )}
      
      {error && <div className="text-xs text-red-500 mt-2">This field is required.</div>}
    </div>
  );
}

export default CheckboxField; 