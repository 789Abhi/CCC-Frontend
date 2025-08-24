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
      <div className="flex items-center space-x-3">
        <div className="relative">
          <input
            type="checkbox"
            id={`toggle-${fieldId}`}
            className="sr-only"
            checked={isEnabled}
            onChange={(e) => handleToggleChange(e.target.checked)}
          />
          <label
            htmlFor={`toggle-${fieldId}`}
            className={`block w-14 h-8 rounded-full cursor-pointer transition-colors duration-200 ease-in-out ${
              isEnabled ? 'bg-blue-600' : 'bg-gray-300'
            }`}
          >
            <span
              className={`block w-6 h-6 bg-white rounded-full shadow transform transition-transform duration-200 ease-in-out ${
                isEnabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </label>
        </div>
        
        <span className="text-sm font-medium text-gray-700">
          {isEnabled ? 'Enabled' : 'Disabled'}
        </span>
      </div>

      {/* Field Description */}
      {field?.placeholder && (
        <p className="mt-2 text-sm text-gray-500">{field.placeholder}</p>
      )}
    </div>
  );
};

export default ToggleField;
