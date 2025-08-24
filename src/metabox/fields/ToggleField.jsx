import React, { useState, useEffect } from 'react';

const ToggleField = ({ 
  field, 
  value, 
  onChange, 
  onValidationChange, 
  instanceId, 
  fieldId,
  availableFields = [] // For conditional logic
}) => {
  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    // Parse initial value
    if (value !== undefined && value !== '') {
      setIsEnabled(value === '1' || value === true || value === 1);
    } else if (field?.config?.default_value !== undefined) {
      setIsEnabled(field.config.default_value);
    }
  }, [value, field]);

  const handleToggleChange = (newValue) => {
    setIsEnabled(newValue);
    onChange(newValue ? '1' : '0');
    
    // Trigger validation change
    if (onValidationChange) {
      onValidationChange(fieldId, newValue ? '1' : '0', true);
    }
  };

  return (
    <div 
      className="ccc-field ccc-field-toggle"
      data-conditional-logic={field?.config ? JSON.stringify(field.config) : ''}
      data-field-id={fieldId}
    >
      <div className="flex items-center justify-between mb-3">
        <label className="ccc-field-label text-sm font-medium text-gray-700">
          {field?.label || 'Toggle Field'}
          {field?.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      </div>

      {/* Toggle Switch */}
      <div className="flex items-center">
        <button
          type="button"
          className={`relative inline-flex h-6 w-12 items-center rounded-full transition-colors duration-200 focus:outline-none border-2 border-pink-400 ${
            isEnabled ? 'bg-green-400' : 'bg-gray-200'
          }`}
          onClick={() => handleToggleChange(!isEnabled)}
          aria-pressed={isEnabled}
        >
          <span
            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-200 ${
              isEnabled ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {/* Field Description */}
      {field?.placeholder && (
        <p className="mt-2 text-sm text-gray-500">{field.placeholder}</p>
      )}
    </div>
  );
};

export default ToggleField;
