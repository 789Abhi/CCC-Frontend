import React, { memo, useCallback } from 'react';

const Textfield = memo(({ label, value, onChange, placeholder, required, error }) => {
  const handleChange = useCallback((e) => {
    const newValue = e.target.value;
    console.log('TextField handleChange triggered:', { 
      field: label, 
      oldValue: value, 
      newValue: newValue, 
      length: newValue.length,
      words: newValue.split(' ').length,
      timestamp: new Date().toISOString()
    });
    
    if (onChange) {
      console.log('TextField calling onChange with:', newValue);
      onChange(newValue);
    } else {
      console.warn('TextField onChange is not defined!');
    }
  }, [onChange, label, value]);

  console.log('TextField render:', {
    label,
    value,
    valueType: typeof value,
    valueLength: value?.length || 0,
    onChangeDefined: !!onChange,
    timestamp: new Date().toISOString()
  });

  return (
    <div className="mb-4">
      {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}{required && <span className="text-red-500 ml-1">*</span>}</label>}
      <input
        type="text"
        className={`mt-2 block w-full border rounded-md !shadow-sm focus:ring focus:ring-opacity-50 px-3 py-2 text-base ${error ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-blue-400'}`}
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
      {/* Debug info */}
      {window.CCC_DEBUG_COMPONENTS && (
        <div className="text-xs text-gray-500 mt-1">
          Debug: Value length: {value?.length || 0}, Words: {value?.split(' ').length || 0}
        </div>
      )}
    </div>
  );
});

Textfield.displayName = 'Textfield';

export default Textfield;
