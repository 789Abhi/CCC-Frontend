import React, { useState, useEffect, memo } from 'react';
import { Plus, X, HelpCircle } from 'lucide-react';

const ConditionalLogicTab = ({ 
  fieldConfig, 
  onConfigChange, 
  availableFields, 
  isSubmitting = false,
  fieldType = 'field' // to customize labels if needed
}) => {
  const [config, setConfig] = useState({
    field_condition: fieldConfig?.field_condition || 'always_show',
    logic_operator: fieldConfig?.logic_operator || 'AND',
    conditional_logic: fieldConfig?.conditional_logic || []
  });



  // Update local state when prop changes
  useEffect(() => {
    if (fieldConfig) {
      setConfig({
        field_condition: fieldConfig.field_condition || 'always_show',
        logic_operator: fieldConfig.logic_operator || 'AND',
        conditional_logic: fieldConfig.conditional_logic || []
      });
    }
  }, [fieldConfig]);

  // Notify parent of config changes (only when config actually changes)
  useEffect(() => {
    // Call onConfigChange, but don't include it in dependencies to avoid render loops
    onConfigChange(config);
  }, [config]); // Removed onConfigChange dependency to prevent unnecessary calls

  const addRule = () => {
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
  };

  const removeRule = (ruleId) => {
    setConfig(prev => ({
      ...prev,
      conditional_logic: prev.conditional_logic.filter(rule => rule.id !== ruleId)
    }));
  };

  const updateRule = (ruleId, field, value) => {
    setConfig(prev => ({
      ...prev,
      conditional_logic: prev.conditional_logic.map(rule =>
        rule.id === ruleId ? { ...rule, [field]: value } : rule
      )
    }));
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
          onChange={(e) => setConfig(prev => ({ ...prev, field_condition: e.target.value }))}
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
              onChange={(e) => setConfig(prev => ({ ...prev, logic_operator: e.target.value }))}
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
                        <option value="">Select a field</option>
                        {availableFields.map(field => (
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
                        value={rule.condition}
                        onChange={(e) => updateRule(rule.id, 'condition', e.target.value)}
                        className="w-full text-sm border border-gray-300 rounded px-2 py-1 bg-white"
                        disabled={isSubmitting}
                      >
                        <option value="when_toggle_is">When toggle is</option>
                        <option value="when_field_equals">When field equals</option>
                        <option value="when_field_not_equals">When field not equals</option>
                        <option value="when_field_contains">When field contains</option>
                        <option value="when_field_not_contains">When field not contains</option>
                        <option value="when_field_greater_than">When field greater than</option>
                        <option value="when_field_less_than">When field less than</option>
                        <option value="when_field_greater_equal">When field greater than or equal</option>
                        <option value="when_field_less_equal">When field less than or equal</option>
                      </select>
                    </div>

                    {/* Value */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Value
                      </label>
                      <select
                        value={rule.value}
                        onChange={(e) => updateRule(rule.id, 'value', e.target.value)}
                        className="w-full text-sm border border-gray-300 rounded px-2 py-1 bg-white"
                        disabled={isSubmitting}
                      >
                        <option value="1">Enabled</option>
                        <option value="0">Disabled</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500">
              No rules added yet. Add your first rule below.
          </div>
          )}

          {/* Add Rule Button */}
          <button
            type="button"
            onClick={addRule}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            disabled={isSubmitting}
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
