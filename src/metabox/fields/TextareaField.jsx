import React from 'react';

function TextareaField({ label, value, onChange, placeholder, required, error, fieldId }) {
  return (
    <div className="mb-4 ccc-field" data-field-id={fieldId}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <textarea
        className={`mt-2 block w-full border rounded-md !shadow-sm focus:ring focus:ring-opacity-50 px-3 py-2 text-base ${
          error ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-blue-400'
        }`}
        placeholder={placeholder}
        value={value || ''}
        onChange={e => onChange && onChange(e.target.value)}
        required={required}
        aria-invalid={error ? 'true' : undefined}
        rows={4}
      />
      {error && <div className="text-xs text-red-500 mt-1">This field is required.</div>}
    </div>
  );
}

export default TextareaField; 