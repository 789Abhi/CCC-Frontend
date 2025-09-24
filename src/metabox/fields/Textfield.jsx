import React, { memo, useCallback } from 'react';
import UniversalFieldWrapper from './UniversalFieldWrapper';

const Textfield = memo(({ label, value, onChange, placeholder, required, error, fieldId, licenseKey = '', apiUrl = 'https://custom-craft-component-backend.vercel.app/api/pro-features/check' }) => {
  const handleChange = useCallback((e) => {
    const newValue = e.target.value;
    
    if (onChange) {
      onChange(newValue);
    }
  }, [onChange]);

  return (
    <UniversalFieldWrapper 
      fieldType="text" 
      fieldLabel={label}
      licenseKey={licenseKey}
      apiUrl={apiUrl}
    >
      <div className="mb-4 ccc-field" data-field-id={fieldId}>
        {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}{required && <span className="text-red-500 ml-1">*</span>}</label>}
        <input
          type="text"
          className={`mt-2 block w-full border rounded-md shadow-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-400 px-3 py-2 text-base cursor-text h-10 leading-tight ${
            error ? 'border-red-500 focus:ring-red-400 focus:border-red-500' : 'border-gray-300'
          }`}
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
    </UniversalFieldWrapper>
  );
});

Textfield.displayName = 'Textfield';

export default Textfield;
