import React from 'react';

function RadioField({ label, value, onChange, options = [], required = false, error, fieldId }) {
  // Radio fields are always single selection
  const handleRadioChange = (optionValue) => {
    onChange(optionValue);
  };

  return (
    <div className="mb-4 ccc-field" data-field-id={fieldId}>
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
              value === opt.value
                ? 'bg-blue-50 border-blue-400 shadow-blue-100' 
                : 'bg-white border-gray-200 hover:border-gray-300'
            }`}
          >
            <input
              type="radio"
              name={`radio_${label?.replace(/\s+/g, '_').toLowerCase()}`}
              value={opt.value}
              checked={value === opt.value}
              onChange={() => handleRadioChange(opt.value)}
              className="h-5 w-5 text-blue-600 border-gray-300 focus:ring-blue-500 focus:ring-2 transition-colors"
            />
            <span className={`font-medium ${
              value === opt.value
                ? 'text-blue-800' 
                : 'text-gray-700'
            }`}>
              {opt.label}
            </span>
            {value === opt.value && (
              <svg className="w-5 h-5 text-blue-600 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            )}
          </label>
        ))}
      </div>
      
      {/* Selected item summary */}
      {value && (
        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-medium text-blue-800">Selected Option:</span>
          </div>
          <div className="text-sm text-blue-700">
            {options.find(opt => opt.value === value)?.label || value}
          </div>
        </div>
      )}
      
      {/* Empty state */}
      {!value && (
        <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="text-sm text-gray-500 text-center">
            No option selected
          </div>
        </div>
      )}
      
      {error && <div className="text-xs text-red-500 mt-2">This field is required.</div>}
    </div>
  );
}

export default RadioField; 