import React, { useState, useEffect, memo, useRef } from 'react';
import { Plus, X, HelpCircle } from 'lucide-react';

const ConditionalLogicTab = ({ 
  fieldConfig, 
  onConfigChange, 
  availableFields, 
  isSubmitting = false,
  fieldType = 'field', // to customize labels if needed
  currentFieldId = null // ID of the current field being edited (to exclude from target selection)
}) => {
  const [config, setConfig] = useState({
    field_condition: fieldConfig?.field_condition || 'always_show',
    logic_operator: fieldConfig?.logic_operator || 'AND',
    conditional_logic: fieldConfig?.conditional_logic || []
  });

  const isUserInteracting = useRef(false);

  // Filter available fields to exclude the current field being edited
  const filteredAvailableFields = availableFields.filter(field => 
    currentFieldId ? field.id !== currentFieldId : true
  );

  // Update local state when prop changes (but not during user interactions)
  useEffect(() => {
    if (fieldConfig && !isUserInteracting.current) {
      const newConfig = {
        field_condition: fieldConfig.field_condition || 'always_show',
        logic_operator: fieldConfig.logic_operator || 'AND',
        conditional_logic: fieldConfig.conditional_logic || []
      };
      
      // Only update if the config is actually different
      setConfig(prevConfig => {
        if (prevConfig.field_condition === newConfig.field_condition &&
            prevConfig.logic_operator === newConfig.logic_operator &&
            JSON.stringify(prevConfig.conditional_logic) === JSON.stringify(newConfig.conditional_logic)) {
          return prevConfig; // No change needed
        }
        return newConfig;
      });
    }
  }, [fieldConfig]);

  // Notify parent of config changes (only when config actually changes)
  useEffect(() => {
    // Call onConfigChange, but don't include it in dependencies to avoid render loops
    onConfigChange(config);
  }, [config]); // Removed onConfigChange dependency to prevent unnecessary calls

  // Clean up orphaned rules when available fields change
  useEffect(() => {
    if (config.conditional_logic && config.conditional_logic.length > 0) {
      const availableFieldIds = new Set(filteredAvailableFields.map(f => f.id));
      const cleanedRules = config.conditional_logic.filter(rule => {
        // Keep rules that target existing fields
        return availableFieldIds.has(rule.target_field);
      });

      // If some rules were removed, update the config
      if (cleanedRules.length !== config.conditional_logic.length) {
        const removedCount = config.conditional_logic.length - cleanedRules.length;
        console.warn(`Cleaned up ${removedCount} orphaned conditional logic rule(s) that referenced deleted fields`);
        
        setConfig(prev => ({
          ...prev,
          conditional_logic: cleanedRules,
          // If all rules were removed, reset to always show
          field_condition: cleanedRules.length === 0 ? 'always_show' : prev.field_condition
        }));
      }
    }
  }, [filteredAvailableFields, config.conditional_logic]);

  const addRule = () => {
    isUserInteracting.current = true;
    const newRule = {
      id: Date.now(),
      target_field: '',
      condition: 'when_toggle_is',
      value: '1'
    };

    setConfig(prev => ({
      ...prev,
      conditional_logic: [...prev.conditional_logic, newRule]
    }));
    setTimeout(() => {
      isUserInteracting.current = false;
    }, 100);
  };

  const removeRule = (ruleId) => {
    isUserInteracting.current = true;
    setConfig(prev => ({
      ...prev,
      conditional_logic: prev.conditional_logic.filter(rule => rule.id !== ruleId)
    }));
    setTimeout(() => {
      isUserInteracting.current = false;
    }, 100);
  };

  const updateRule = (ruleId, field, value) => {
    isUserInteracting.current = true;
    setConfig(prev => {
      const newConfig = {
        ...prev,
        conditional_logic: prev.conditional_logic.map(rule => {
          if (rule.id === ruleId) {
            const updatedRule = { ...rule, [field]: value };
            
            // Reset condition and value when target field changes
            if (field === 'target_field') {
              const targetField = filteredAvailableFields.find(f => f.id === value);
              if (targetField) {
                // Reset if this is a new rule, incomplete rule, OR if the field type changed
                const prevTargetField = filteredAvailableFields.find(f => f.id === rule.target_field);
                const fieldTypeChanged = !prevTargetField || prevTargetField.type !== targetField.type;
                const shouldReset = !rule.condition || rule.condition === '' || !rule.target_field || fieldTypeChanged;
                
                if (shouldReset) {
                  updatedRule.condition = getDefaultConditionForFieldType(targetField.type);
                  updatedRule.value = getDefaultValueForFieldType(targetField.type, value);
                }
              }
            }
            
            return updatedRule;
          }
          return rule;
        })
      };
      
      return newConfig;
    });
    
    setTimeout(() => {
      isUserInteracting.current = false;
    }, 100);
  };

  // Get default condition based on field type
  const getDefaultConditionForFieldType = (fieldType) => {
    switch (fieldType) {
      case 'toggle':
        return 'when_toggle_is';
      case 'select':
      case 'radio':
        return 'when_field_equals';
      case 'checkbox':
        return 'when_field_contains';
      case 'text':
      case 'textarea':
      case 'email':
        return 'when_field_equals';
      case 'number':
      case 'range':
        return 'when_field_greater_than';
      default:
        return 'when_field_equals';
    }
  };

  // Get default value based on field type
  const getDefaultValueForFieldType = (fieldType, targetFieldId = null) => {
    switch (fieldType) {
      case 'toggle':
        return '1';
      case 'number':
      case 'range':
        return '0';
      case 'checkbox':
      case 'select':
      case 'radio':
        // For fields with options, try to get the first available option
        if (targetFieldId) {
          const availableValues = getAvailableValues(targetFieldId, 'when_field_contains');
          if (availableValues.length > 0) {
            return availableValues[0].value;
          }
        }
        return '';
      default:
        return '';
    }
  };

  // Get available conditions based on target field type
  const getAvailableConditions = (targetFieldId) => {
    const targetField = filteredAvailableFields.find(f => f.id === targetFieldId);
    if (!targetField) {
      return [
        { value: 'when_field_equals', label: 'When field equals' }
      ];
    }

    switch (targetField.type) {
      case 'toggle':
        return [
          { value: 'when_toggle_is', label: 'When toggle is' }
        ];
      case 'select':
      case 'radio':
        return [
          { value: 'when_field_equals', label: 'When field equals' },
          { value: 'when_field_not_equals', label: 'When field not equals' }
        ];
      case 'checkbox':
        return [
          { value: 'when_field_contains', label: 'When field contains' },
          { value: 'when_field_not_contains', label: 'When field not contains' }
        ];
      case 'text':
      case 'textarea':
      case 'email':
        return [
          { value: 'when_field_equals', label: 'When field equals' },
          { value: 'when_field_not_equals', label: 'When field not equals' },
          { value: 'when_field_contains', label: 'When field contains' },
          { value: 'when_field_not_contains', label: 'When field not contains' }
        ];
      case 'number':
      case 'range':
        return [
          { value: 'when_field_equals', label: 'When field equals' },
          { value: 'when_field_not_equals', label: 'When field not equals' },
          { value: 'when_field_greater_than', label: 'When field greater than' },
          { value: 'when_field_less_than', label: 'When field less than' },
          { value: 'when_field_greater_equal', label: 'When field greater than or equal' },
          { value: 'when_field_less_equal', label: 'When field less than or equal' }
        ];
      default:
        return [
          { value: 'when_field_equals', label: 'When field equals' },
          { value: 'when_field_not_equals', label: 'When field not equals' }
        ];
    }
  };

  // Get available values based on target field type and condition
  const getAvailableValues = (targetFieldId, condition) => {
    const targetField = filteredAvailableFields.find(f => f.id === targetFieldId);
    if (!targetField) return [];

    switch (targetField.type) {
      case 'toggle':
        return [
          { value: '1', label: 'Enabled' },
          { value: '0', label: 'Disabled' }
        ];
      case 'select':
      case 'radio':
        // Return the options from the field config
        if (targetField.config && targetField.config.options) {
          return Object.entries(targetField.config.options).map(([value, label]) => ({
            value: value,
            label: label
          }));
        }
        return [];
      case 'checkbox':
        // Return the options from the field config for checkbox fields
        if (targetField.config && targetField.config.options) {
          return Object.entries(targetField.config.options).map(([value, label]) => ({
            value: value,
            label: label
          }));
        }
        return [];
      default:
        return []; // For text fields, number fields etc, user types the value
    }
  };

  const getConditionLabel = (condition) => {
    const labels = {
      when_toggle_is: 'When toggle is',
      when_field_equals: 'When field equals',
      when_field_not_equals: 'When field not equals',
      when_field_contains: 'When field contains',
      when_field_not_contains: 'When field not contains',
      when_field_greater_than: 'When field greater than',
      when_field_less_than: 'When field less than',
      when_field_greater_equal: 'When field greater than or equal',
      when_field_less_equal: 'When field less than or equal'
    };
    return labels[condition] || condition;
  };

  return (
    <div className="space-y-4">
      <div className="border-b border-gray-200 pb-4">
        <h3 className="text-lg font-medium text-gray-900">Conditional Logic</h3>
        <p className="text-sm text-gray-600 mt-1">
          Control when this {fieldType} is visible based on other field values
        </p>
      </div>

      {/* Overall Field Condition */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Overall Field Condition
        </label>
        <select
          value={config.field_condition}
          onChange={(e) => {
            isUserInteracting.current = true;
            setConfig(prev => ({ ...prev, field_condition: e.target.value }));
            // Reset the interaction flag after a short delay
            setTimeout(() => {
              isUserInteracting.current = false;
            }, 100);
          }}
          className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          disabled={isSubmitting}
        >
          <option value="always_show">Always show</option>
          <option value="show_when">Show when</option>
          <option value="hide_when">Hide when</option>
        </select>
      </div>

      {/* Conditional Rules Section */}
      {(config.field_condition === 'show_when' || config.field_condition === 'hide_when') && (
        <>
          {/* Logic Operator Selection */}
          <div className="flex items-center gap-2 p-2 bg-white rounded border">
            <span className="text-xs text-gray-500">Logic:</span>
            <select
              value={config.logic_operator}
              onChange={(e) => {
                isUserInteracting.current = true;
                setConfig(prev => ({ ...prev, logic_operator: e.target.value }));
                setTimeout(() => {
                  isUserInteracting.current = false;
                }, 100);
              }}
              className="text-xs border border-gray-300 rounded px-2 py-1 bg-white"
              disabled={isSubmitting}
            >
              <option value="AND">All of the conditions pass</option>
              <option value="OR">Any of the following conditions pass</option>
            </select>
            <span className="text-xs text-gray-500">Rules will be combined using this logic</span>
          </div>

          {/* Rules List */}
          {config.conditional_logic && config.conditional_logic.length > 0 ? (
            <div className="space-y-3">
              {config.conditional_logic.map((rule, index) => (
                <div key={rule.id} className="p-3 bg-gray-50 rounded-lg border">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-700">Rule {index + 1}</span>
                    <button
                      type="button"
                      onClick={() => removeRule(rule.id)}
                      className="text-red-500 hover:text-red-700 p-1"
                      disabled={isSubmitting}
                    >
                      <X size={16} />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {/* Target Field */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Target Field
                      </label>
                      <select
                        value={rule.target_field}
                        onChange={(e) => updateRule(rule.id, 'target_field', e.target.value)}
                        className="w-full text-sm border border-gray-300 rounded px-2 py-1 bg-white"
                        disabled={isSubmitting}
                      >
                        <option value="">
                          {filteredAvailableFields.length === 0 
                            ? "No other fields available" 
                            : "Select a field"
                          }
                        </option>
                        {filteredAvailableFields.map(field => (
                          <option key={field.id} value={field.id}>
                            {field.label || field.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Condition */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Condition
                      </label>
                      <select
                        value={(() => {
                          const availableConditions = getAvailableConditions(rule.target_field);
                          const conditionExists = availableConditions.some(c => c.value === rule.condition);

                          
                          // If current condition doesn't exist in available options, use the first available one
                          if (!conditionExists && availableConditions.length > 0) {
                            const defaultCondition = availableConditions[0].value;

                            // Update the rule with the correct condition
                            setTimeout(() => updateRule(rule.id, 'condition', defaultCondition), 0);
                            return defaultCondition;
                          }
                          
                          return rule.condition;
                        })()}
                        onChange={(e) => {

                          updateRule(rule.id, 'condition', e.target.value);
                        }}
                        className="w-full text-sm border border-gray-300 rounded px-2 py-1 bg-white"
                        disabled={isSubmitting}
                      >
                        {(() => {
                          const availableConditions = getAvailableConditions(rule.target_field);

                          return availableConditions.map(condition => (
                            <option key={condition.value} value={condition.value}>
                              {condition.label}
                            </option>
                          ));
                        })()}
                      </select>
                    </div>

                    {/* Value */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Value
                      </label>
                      {(() => {
                        const availableValues = getAvailableValues(rule.target_field, rule.condition);
                        if (availableValues.length > 0) {
                          // Show dropdown for fields with predefined options
                          return (
                            <select
                              value={(() => {
                                // If value is empty and we have available options, auto-select the first one
                                if ((!rule.value || rule.value === '') && availableValues.length > 0) {
                                  const defaultValue = availableValues[0].value;

                                  // Update the rule with the default value
                                  setTimeout(() => updateRule(rule.id, 'value', defaultValue), 0);
                                  return defaultValue;
                                }
                                return rule.value;
                              })()}
                              onChange={(e) => {

                                updateRule(rule.id, 'value', e.target.value);
                              }}
                              className="w-full text-sm border border-gray-300 rounded px-2 py-1 bg-white"
                              disabled={isSubmitting}
                            >
                              {availableValues.map(option => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          );
                        } else {
                          // Show text input for fields without predefined options
                          return (
                            <input
                              type="text"
                              value={rule.value}
                              onChange={(e) => updateRule(rule.id, 'value', e.target.value)}
                              className="w-full text-sm border border-gray-300 rounded px-2 py-1 bg-white"
                              placeholder="Enter value..."
                              disabled={isSubmitting}
                            />
                          );
                        }
                      })()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500">
              {filteredAvailableFields.length === 0 
                ? "No other fields are available to create conditional logic rules. Add more fields to this component first."
                : "No rules added yet. Add your first rule below."
              }
            </div>
          )}

          {/* Add Rule Button */}
          <button
            type="button"
            onClick={addRule}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            disabled={isSubmitting || filteredAvailableFields.length === 0}
            title={filteredAvailableFields.length === 0 ? "No other fields available to create conditions" : "Add a new rule"}
          >
            <Plus size={16} />
            Add Rule
          </button>
        </>
      )}

      {/* Help Text */}
      <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
        <HelpCircle size={16} className="text-blue-600 mt-0.5 flex-shrink-0" />
        <div className="text-sm text-blue-800">
          <p className="font-medium mb-1">How conditional logic works:</p>
          <ul className="list-disc list-inside space-y-1 text-xs">
            <li><strong>Always show:</strong> Field is always visible</li>
            <li><strong>Show when:</strong> Field only appears when conditions are met</li>
            <li><strong>Hide when:</strong> Field is hidden when conditions are met</li>
            <li><strong>All conditions pass (AND):</strong> All rules must be true</li>
            <li><strong>Any condition passes (OR):</strong> At least one rule must be true</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default memo(ConditionalLogicTab);
