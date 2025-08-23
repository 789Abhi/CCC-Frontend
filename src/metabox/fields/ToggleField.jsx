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
  const [conditionalLogic, setConditionalLogic] = useState([]);
  const [showConditionalConfig, setShowConditionalConfig] = useState(false);

  useEffect(() => {
    // Parse initial value
    if (value !== undefined && value !== '') {
      setIsEnabled(value === '1' || value === true || value === 1);
    } else if (field?.config?.default_value !== undefined) {
      setIsEnabled(field.config.default_value);
    }
    
    // Load conditional logic from field config
    if (field?.config?.conditional_logic) {
      setConditionalLogic(field.config.conditional_logic);
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

  const handleConditionalLogicChange = (newLogic) => {
    setConditionalLogic(newLogic);
    
    // Update field config
    if (field && onChange) {
      const updatedConfig = {
        ...field.config,
        conditional_logic: newLogic
      };
      
      // This would need to be handled by the parent component
      // For now, we'll just store it locally
      console.log('Conditional logic updated:', newLogic);
    }
  };

  const addConditionalRule = () => {
    const newRule = {
      id: Date.now(),
      target_field: '',
      action: 'show', // show, hide, enable, disable
      operator: 'equals', // equals, not_equals, contains, not_contains
      value: '1'
    };
    setConditionalLogic([...conditionalLogic, newRule]);
  };

  const removeConditionalRule = (ruleId) => {
    setConditionalLogic(conditionalLogic.filter(rule => rule.id !== ruleId));
  };

  const updateConditionalRule = (ruleId, field, newValue) => {
    setConditionalLogic(conditionalLogic.map(rule => 
      rule.id === ruleId ? { ...rule, [field]: newValue } : rule
    ));
  };

  // Filter available fields to exclude the current toggle field
  const availableTargetFields = availableFields.filter(f => 
    f.id !== fieldId && f.type !== 'toggle'
  );

  return (
    <div className="ccc-field ccc-field-toggle">
      <div className="flex items-center justify-between mb-3">
        <label className="ccc-field-label text-sm font-medium text-gray-700">
          {field?.label || 'Toggle Field'}
          {field?.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        
        <button
          type="button"
          onClick={() => setShowConditionalConfig(!showConditionalConfig)}
          className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Conditional Logic
        </button>
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

      {/* Conditional Logic Configuration */}
      {showConditionalConfig && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
          <h4 className="text-sm font-medium text-gray-700 mb-3">
            Conditional Logic Rules
          </h4>
          
          {conditionalLogic.length === 0 ? (
            <p className="text-sm text-gray-500 mb-3">
              No conditional rules set. Add rules to control other fields based on this toggle.
            </p>
          ) : (
            <div className="space-y-3 mb-3">
              {conditionalLogic.map((rule) => (
                <div key={rule.id} className="flex items-center gap-2 p-3 bg-white rounded border">
                  <select
                    value={rule.target_field}
                    onChange={(e) => updateConditionalRule(rule.id, 'target_field', e.target.value)}
                    className="flex-1 text-sm border border-gray-300 rounded px-2 py-1"
                  >
                    <option value="">Select target field</option>
                    {availableTargetFields.map((targetField) => (
                      <option key={targetField.id} value={targetField.name}>
                        {targetField.label}
                      </option>
                    ))}
                  </select>
                  
                  <select
                    value={rule.action}
                    onChange={(e) => updateConditionalRule(rule.id, 'action', e.target.value)}
                    className="text-sm border border-gray-300 rounded px-2 py-1"
                  >
                    <option value="show">Show</option>
                    <option value="hide">Hide</option>
                    <option value="enable">Enable</option>
                    <option value="disable">Disable</option>
                  </select>
                  
                  <span className="text-sm text-gray-500">when toggle is</span>
                  
                  <select
                    value={rule.operator}
                    onChange={(e) => updateConditionalRule(rule.id, 'operator', e.target.value)}
                    className="text-sm border border-gray-300 rounded px-2 py-1"
                  >
                    <option value="equals">Enabled</option>
                    <option value="not_equals">Disabled</option>
                  </select>
                  
                  <button
                    type="button"
                    onClick={() => removeConditionalRule(rule.id)}
                    className="text-red-600 hover:text-red-800 p-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
          
          <button
            type="button"
            onClick={addConditionalRule}
            className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Rule
          </button>
          
          <div className="mt-3 text-xs text-gray-500">
            <p><strong>Show/Hide:</strong> Controls field visibility</p>
            <p><strong>Enable/Disable:</strong> Controls field interaction</p>
          </div>
        </div>
      )}

      {/* Field Description */}
      {field?.placeholder && (
        <p className="mt-2 text-sm text-gray-500">{field.placeholder}</p>
      )}
    </div>
  );
};

export default ToggleField;
