import React, { useState, useEffect, useRef } from 'react';

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
  const [logicOperator, setLogicOperator] = useState('AND'); // AND or OR
  
  // Ref to store the conditional logic handler instance
  const conditionalLogicRef = useRef(null);

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
    
    // Load logic operator
    if (field?.config?.logic_operator) {
      setLogicOperator(field.config.logic_operator);
    }

    // Initialize conditional logic handler
    initializeConditionalLogic();
  }, [value, field]);

  // Initialize conditional logic functionality
  const initializeConditionalLogic = () => {
    if (!conditionalLogicRef.current) {
      conditionalLogicRef.current = new ConditionalLogicHandler();
      conditionalLogicRef.current.init();
    }
  };

  // Conditional Logic Handler Class
  class ConditionalLogicHandler {
    constructor() {
      this.rules = new Map(); // Store rules by toggle field ID
      this.fieldStates = new Map(); // Store current field states
      this.initialized = false;
    }

    init() {
      if (this.initialized) return;
      
      // Process existing toggle fields
      this.processExistingToggleFields();
      
      this.initialized = true;
      console.log('CCC: Conditional Logic Handler initialized');
    }

    processExistingToggleFields() {
      const toggleFields = document.querySelectorAll('.ccc-field-toggle');
      toggleFields.forEach(field => this.processToggleField(field));
    }

    processToggleField(toggleField) {
      // Check if this field has conditional logic data
      const conditionalData = toggleField.getAttribute('data-conditional-logic');
      if (!conditionalData) return;

      try {
        const logic = JSON.parse(conditionalData);
        if (!logic || !Array.isArray(logic)) return;

        const toggleInput = toggleField.querySelector('input[type="checkbox"], input[type="hidden"]');
        if (!toggleInput) return;

        const fieldId = toggleInput.id || toggleInput.name;
        if (!fieldId) return;

        // Store the rules for this toggle field
        this.rules.set(fieldId, logic);

        // Set up event listener for toggle changes
        this.setupToggleListener(toggleField, toggleInput, fieldId);

        // Apply initial logic
        this.applyConditionalLogic(fieldId);

      } catch (error) {
        console.error('CCC: Error processing conditional logic:', error);
      }
    }

    setupToggleListener(toggleField, toggleInput, fieldId) {
      const handleChange = () => {
        this.applyConditionalLogic(fieldId);
      };

      // Remove existing listener if any
      toggleInput.removeEventListener('change', handleChange);
      
      // Add new listener
      toggleInput.addEventListener('change', handleChange);

      // Also listen for custom events (for button-style toggles)
      toggleField.addEventListener('toggleChanged', handleChange);
    }

    applyConditionalLogic(toggleFieldId) {
      const rules = this.rules.get(toggleFieldId);
      if (!rules || !Array.isArray(rules)) return;

      const toggleField = document.querySelector(`[id*="${toggleFieldId}"], [name*="${toggleFieldId}"]`)?.closest('.ccc-field-toggle');
      if (!toggleField) return;

      const toggleInput = toggleField.querySelector('input[type="checkbox"], input[type="hidden"]');
      if (!toggleInput) return;

      const isEnabled = this.isToggleEnabled(toggleInput);
      
      // Process each rule
      rules.forEach(rule => {
        this.processRule(rule, isEnabled, toggleField);
      });
    }

    isToggleEnabled(toggleInput) {
      if (toggleInput.type === 'checkbox') {
        return toggleInput.checked;
      } else if (toggleInput.type === 'hidden') {
        return toggleInput.value === '1';
      }
      return false;
    }

    processRule(rule, toggleEnabled, toggleField) {
      const { target_field, action, condition, value, logic_operator = 'AND' } = rule;
      
      if (!target_field) return;

      // Find target field(s)
      const targetFields = this.findTargetFields(target_field);
      
      targetFields.forEach(targetField => {
        // Determine if the condition is met
        const conditionMet = this.evaluateCondition(rule, toggleEnabled, targetField);
        
        // Apply the action
        if (conditionMet) {
          this.applyAction(action, targetField, true);
        } else {
          this.applyAction(action, targetField, false);
        }
      });
    }

    findTargetFields(targetFieldName) {
      const targetFields = [];
      
      // Try to find by name attribute
      const byName = document.querySelectorAll(`[name*="${targetFieldName}"]`);
      byName.forEach(field => {
        const fieldContainer = field.closest('.ccc-field');
        if (fieldContainer) {
          targetFields.push(fieldContainer);
        }
      });

      // Try to find by ID attribute
      const byId = document.querySelectorAll(`[id*="${targetFieldName}"]`);
      byId.forEach(field => {
        const fieldContainer = field.closest('.ccc-field');
        if (fieldContainer && !targetFields.includes(fieldContainer)) {
          targetFields.push(fieldContainer);
        }
      });

      return targetFields;
    }

    evaluateCondition(rule, toggleEnabled, targetField) {
      const { condition, value } = rule;

      switch (condition) {
        case 'when_toggle_is':
          return toggleEnabled === (value === '1');
        
        case 'when_field_equals':
          return this.getFieldValue(targetField) === value;
        
        case 'when_field_not_equals':
          return this.getFieldValue(targetField) !== value;
        
        case 'when_field_contains':
          const fieldValue = this.getFieldValue(targetField);
          return typeof fieldValue === 'string' && fieldValue.includes(value);
        
        case 'when_field_not_contains':
          const fieldValue2 = this.getFieldValue(targetField);
          return typeof fieldValue2 === 'string' && !fieldValue2.includes(value);
        
        default:
          return false;
      }
    }

    getFieldValue(fieldContainer) {
      const input = fieldContainer.querySelector('input, select, textarea');
      if (!input) return '';

      if (input.type === 'checkbox') {
        return input.checked ? '1' : '0';
      } else if (input.type === 'radio') {
        const checkedRadio = fieldContainer.querySelector('input[type="radio"]:checked');
        return checkedRadio ? checkedRadio.value : '';
      } else {
        return input.value || '';
      }
    }

    applyAction(action, targetField, conditionMet) {
      const inputs = targetField.querySelectorAll('input, select, textarea, button');
      
      switch (action) {
        case 'show':
          if (conditionMet) {
            targetField.style.display = '';
            targetField.classList.remove('ccc-field-hidden');
          } else {
            targetField.style.display = 'none';
            targetField.classList.add('ccc-field-hidden');
          }
          break;
        
        case 'hide':
          if (conditionMet) {
            targetField.style.display = 'none';
            targetField.classList.add('ccc-field-hidden');
          } else {
            targetField.style.display = '';
            targetField.classList.remove('ccc-field-hidden');
          }
          break;
        
        case 'enable':
          inputs.forEach(input => {
            input.disabled = !conditionMet;
            if (conditionMet) {
              input.classList.remove('ccc-field-disabled');
            } else {
              input.classList.add('ccc-field-disabled');
            }
          });
          break;
        
        case 'disable':
          inputs.forEach(input => {
            input.disabled = conditionMet;
            if (conditionMet) {
              input.classList.add('ccc-field-disabled');
            } else {
              input.classList.remove('ccc-field-disabled');
            }
          });
          break;
      }
    }

    addRules(toggleFieldId, rules) {
      this.rules.set(toggleFieldId, rules);
      this.applyConditionalLogic(toggleFieldId);
    }

    removeRules(toggleFieldId) {
      this.rules.delete(toggleFieldId);
    }

    getAllRules() {
      return Object.fromEntries(this.rules);
    }

    clearAllRules() {
      this.rules.clear();
    }
  }

  const handleToggleChange = (newValue) => {
    setIsEnabled(newValue);
    onChange(newValue ? '1' : '0');
    
    // Trigger validation change
    if (onValidationChange) {
      onValidationChange(fieldId, newValue ? '1' : '0', true);
    }

    // Apply conditional logic when toggle changes
    if (conditionalLogicRef.current && field?.config?.conditional_logic) {
      conditionalLogicRef.current.applyConditionalLogic(`toggle-${fieldId}`);
    }
  };

  const handleConditionalLogicChange = (newLogic) => {
    setConditionalLogic(newLogic);
    
    // Update field config
    if (field && onChange) {
      const updatedConfig = {
        ...field.config,
        conditional_logic: newLogic,
        logic_operator: logicOperator
      };
      
      // Save the updated config
      const updatedField = {
        ...field,
        config: updatedConfig
      };
      
      // Call onChange with the updated field config
      onChange(updatedField);
      
      // Apply conditional logic to the DOM
      applyConditionalLogicToDOM(updatedField);
    }
  };

  const handleLogicOperatorChange = (newOperator) => {
    setLogicOperator(newOperator);
    
    // Update field config
    if (field && onChange) {
      const updatedConfig = {
        ...field.config,
        conditional_logic: conditionalLogic,
        logic_operator: newOperator
      };
      
      // Save the updated config
      const updatedField = {
        ...field,
        config: updatedConfig
      };
      
      // Call onChange with the updated field config
      onChange(updatedField);
      
      // Apply conditional logic to the DOM
      applyConditionalLogicToDOM(updatedField);
    }
  };

  const addConditionalRule = () => {
    const newRule = {
      id: Date.now(),
      target_field: '',
      action: 'show', // show, hide, enable, disable
      operator: 'equals', // equals, not_equals, contains, not_contains
      value: '1',
      condition: 'when_toggle_is' // when_toggle_is, when_field_equals, when_field_not_equals
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

  // Filter available fields to exclude the current toggle field and get all fields from all components
  const getAllAvailableFields = () => {
    const allFields = [];
    
    // Get fields from the current component
    if (availableFields && Array.isArray(availableFields)) {
      allFields.push(...availableFields);
    }
    
    // Also get fields from other components if available
    // This would need to be passed down from the parent component
    // For now, we'll use the availableFields parameter
    
    return allFields.filter(f => 
      f.id !== fieldId && f.type !== 'toggle'
    );
  };

  const availableTargetFields = getAllAvailableFields();

  // Method to apply conditional logic to the DOM
  const applyConditionalLogicToDOM = (updatedField) => {
    if (conditionalLogicRef.current && updatedField.config?.conditional_logic) {
      // Add data attribute to the toggle field for the conditional logic handler
      const toggleFieldElement = document.querySelector(`[id*="toggle-${fieldId}"]`)?.closest('.ccc-field-toggle');
      if (toggleFieldElement) {
        toggleFieldElement.setAttribute('data-conditional-logic', JSON.stringify(updatedField.config.conditional_logic));
        
        // Add rules to the conditional logic handler
        conditionalLogicRef.current.addRules(`toggle-${fieldId}`, updatedField.config.conditional_logic);
      }
    }
  };

  // Apply conditional logic when component mounts or field config changes
  useEffect(() => {
    if (field?.config?.conditional_logic && conditionalLogicRef.current) {
      applyConditionalLogicToDOM(field);
    }
  }, [field?.config?.conditional_logic]);

  return (
    <div 
      className="ccc-field ccc-field-toggle"
      data-conditional-logic={field?.config?.conditional_logic ? JSON.stringify(field.config.conditional_logic) : ''}
      data-toggle-field-id={fieldId}
    >
      <div className="flex items-center justify-between mb-3">
        <label className="ccc-field-label text-sm font-medium text-gray-700">
          {field?.label || 'Toggle Field'}
          {field?.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        
        <button
          type="button"
          onClick={() => setShowConditionalConfig(!showConditionalConfig)}
          className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1 px-3 py-1 rounded-md hover:bg-blue-50 transition-colors"
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
        <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-medium text-gray-700">
              Conditional Logic Rules
            </h4>
            
            {/* Logic Operator Selection */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Logic:</span>
              <select
                value={logicOperator}
                onChange={(e) => handleLogicOperatorChange(e.target.value)}
                className="text-xs border border-gray-300 rounded px-2 py-1 bg-white"
              >
                <option value="AND">AND</option>
                <option value="OR">OR</option>
              </select>
            </div>
          </div>
          
          {conditionalLogic.length === 0 ? (
            <div className="text-center py-6">
              <div className="w-12 h-12 mx-auto mb-3 text-gray-300">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-sm text-gray-500 mb-3">
                No conditional rules set. Add rules to control other fields based on this toggle.
              </p>
              <button
                type="button"
                onClick={addConditionalRule}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                + Add First Rule
              </button>
            </div>
          ) : (
            <div className="space-y-3 mb-4">
              {/* Logic Operator Display */}
              <div className="text-xs text-gray-500 text-center py-2 bg-white rounded border">
                Rules will be combined using <strong>{logicOperator}</strong> logic
              </div>
              
              {conditionalLogic.map((rule, index) => (
                <div key={rule.id} className="bg-white rounded-lg border border-gray-200 p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded">
                      Rule {index + 1}
                    </span>
                    {index < conditionalLogic.length - 1 && (
                      <span className="text-xs text-gray-400 font-medium">
                        {logicOperator}
                      </span>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
                    {/* Target Field Selection */}
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Target Field</label>
                      <select
                        value={rule.target_field}
                        onChange={(e) => updateConditionalRule(rule.id, 'target_field', e.target.value)}
                        className="w-full text-sm border border-gray-300 rounded px-2 py-1"
                      >
                        <option value="">Select target field</option>
                        {availableTargetFields.map((targetField) => (
                          <option key={targetField.id} value={targetField.name}>
                            {targetField.label} ({targetField.type})
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    {/* Action Selection */}
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Action</label>
                      <select
                        value={rule.action}
                        onChange={(e) => updateConditionalRule(rule.id, 'action', e.target.value)}
                        className="w-full text-sm border border-gray-300 rounded px-2 py-1"
                      >
                        <option value="show">Show</option>
                        <option value="hide">Hide</option>
                        <option value="enable">Enable</option>
                        <option value="disable">Disable</option>
                      </select>
                    </div>
                    
                    {/* Condition Type */}
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Condition</label>
                      <select
                        value={rule.condition}
                        onChange={(e) => updateConditionalRule(rule.id, 'condition', e.target.value)}
                        className="w-full text-sm border border-gray-300 rounded px-2 py-1"
                      >
                        <option value="when_toggle_is">When toggle is</option>
                        <option value="when_field_equals">When field equals</option>
                        <option value="when_field_not_equals">When field not equals</option>
                        <option value="when_field_contains">When field contains</option>
                        <option value="when_field_not_contains">When field not contains</option>
                      </select>
                    </div>
                    
                    {/* Value/Operator */}
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Value</label>
                      {rule.condition === 'when_toggle_is' ? (
                        <select
                          value={rule.value}
                          onChange={(e) => updateConditionalRule(rule.id, 'value', e.target.value)}
                          className="w-full text-sm border border-gray-300 rounded px-2 py-1"
                        >
                          <option value="1">Enabled</option>
                          <option value="0">Disabled</option>
                        </select>
                      ) : (
                        <input
                          type="text"
                          value={rule.value}
                          onChange={(e) => updateConditionalRule(rule.id, 'value', e.target.value)}
                          placeholder="Enter value"
                          className="w-full text-sm border border-gray-300 rounded px-2 py-1"
                        />
                      )}
                    </div>
                  </div>
                  
                  {/* Remove Rule Button */}
                  <div className="flex justify-end mt-2">
                    <button
                      type="button"
                      onClick={() => removeConditionalRule(rule.id)}
                      className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50 transition-colors"
                      title="Remove rule"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Add Rule Button */}
          {conditionalLogic.length > 0 && (
            <button
              type="button"
              onClick={addConditionalRule}
              className="w-full text-sm text-blue-600 hover:text-blue-800 flex items-center justify-center gap-2 py-2 border border-dashed border-blue-300 rounded-lg hover:bg-blue-50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Another Rule
            </button>
          )}
          
          {/* Help Text */}
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <h5 className="text-xs font-medium text-blue-800 mb-2">How it works:</h5>
            <div className="text-xs text-blue-700 space-y-1">
              <p><strong>AND Logic:</strong> All rules must be true for the action to execute</p>
              <p><strong>OR Logic:</strong> Any rule being true will execute the action</p>
              <p><strong>Show/Hide:</strong> Controls field visibility</p>
              <p><strong>Enable/Disable:</strong> Controls field interaction</p>
            </div>
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
