import React, { memo, useCallback } from 'react';

const Textfield = memo(({ label, value, onChange, placeholder, required, error }) => {
  const handleChange = useCallback((e) => {
    const newValue = e.target.value;
    
    if (onChange) {
      onChange(newValue);
    }
  }, [onChange]);

  return (
    <div className="mb-4">
      {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}{required && <span className="text-red-500 ml-1">*</span>}</label>}
      <input
        type="text"
        className={`mt-2 block w-full border rounded-md !shadow-sm focus:ring focus:ring-opacity-50 px-3 py-2 text-base cursor-text ${error ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-blue-400'}`}
        placeholder={placeholder}
        value={value || ''}
        onChange={handleChange}
        required={required}
        aria-invalid={error ? 'true' : undefined}
        // Ensure no input constraints
        maxLength=""
        minLength=""
        spellCheck="true"
        autoComplete="off"
      />
      {error && <div className="text-xs text-red-500 mt-1">This field is required.</div>}
    </div>
  );
});

Textfield.displayName = 'Textfield';

export default Textfield;
