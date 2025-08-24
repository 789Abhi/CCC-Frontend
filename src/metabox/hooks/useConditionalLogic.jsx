import { useMemo } from 'react';

/**
 * React hook for handling conditional logic in metabox fields
 * This replaces the old JavaScript-based conditional logic handler
 */
export const useConditionalLogic = (fields = [], fieldValues = {}) => {

  // Calculate visible fields directly with useMemo to avoid re-render issues
  const visibleFields = useMemo(() => {
    const visible = new Set();
    
    // Helper function to get field value
    const getFieldValue = (fieldId) => {
      const value = fieldValues[fieldId];
      const targetField = fields.find(f => f.id === fieldId);
      
      // Handle different field types
      if (Array.isArray(value)) {
        return value.length > 0 ? value.join(',') : '';
      }
      
      const stringValue = String(value || '');
      
      // For toggle fields, convert "1"/"0" to boolean
      if (targetField?.type === 'toggle') {
        return stringValue === '1' || stringValue === 'true';
      }
      
      return stringValue;
    };

    // Helper function to evaluate a single rule
    const evaluateRule = (rule) => {
      const targetValue = getFieldValue(rule.target_field);
      const targetField = fields.find(f => f.id === rule.target_field);
      
      switch (rule.condition) {
        case 'when_toggle_is':
          const expectedToggleValue = rule.value === '1' ? true : false;
          return targetValue === expectedToggleValue;
          
        case 'when_field_equals':
          return targetValue == rule.value;
          
        case 'when_field_not_equals':
          return targetValue != rule.value;
          
        case 'when_field_contains':
          if (targetField?.type === 'checkbox') {
            if (rule.value === '') {
              return targetValue === '';
            } else {
              const targetStr = String(targetValue);
              const expectedStr = String(rule.value);
              return targetStr.includes(expectedStr) || targetStr === expectedStr;
            }
          } else {
            if (rule.value === '') {
              return targetValue === '';
            } else {
              return String(targetValue).includes(String(rule.value));
            }
          }
          
        case 'when_field_not_contains':
          if (targetField?.type === 'checkbox') {
            if (rule.value === '') {
              return targetValue !== '';
            } else {
              const targetStr = String(targetValue);
              const expectedStr = String(rule.value);
              return !targetStr.includes(expectedStr) && targetStr !== expectedStr;
            }
          } else {
            if (rule.value === '') {
              return targetValue !== '';
            } else {
              return !String(targetValue).includes(String(rule.value));
            }
          }
          
        default:
          return false;
      }
    };

    // Helper function to evaluate conditional logic for a field
    const evaluateConditionalLogic = (config) => {
      if (!config.conditional_logic || config.conditional_logic.length === 0) {
        return true;
      }

      const results = config.conditional_logic.map(rule => evaluateRule(rule));
      const operator = config.logic_operator || 'OR';
      
      if (operator === 'AND') {
        return results.every(result => result === true);
      } else {
        return results.some(result => result === true);
      }
    };

    // Process all fields
    fields.forEach(field => {
      try {
        if (field?.config) {
          const configObj = typeof field.config === 'string' 
            ? JSON.parse(field.config) 
            : field.config;
          
          // Check if field has conditional logic
          if (configObj.field_condition && 
              configObj.field_condition !== 'always_show' && 
              configObj.conditional_logic?.length > 0) {
            
            const shouldShow = evaluateConditionalLogic(configObj);
            
            if (configObj.field_condition === 'show_when') {
              if (shouldShow) {
                visible.add(field.id);
              }
            } else if (configObj.field_condition === 'hide_when') {
              if (!shouldShow) {
                visible.add(field.id);
              }
            }
          } else {
            // Fields without conditional logic are always visible
            visible.add(field.id);
          }
        } else {
          // Fields without config are always visible
          visible.add(field.id);
        }
      } catch (error) {
        console.error(`Error processing field ${field.id}:`, error);
        // If there's an error, show the field by default
        visible.add(field.id);
      }
    });
    
    console.log(`📊 Visible fields calculated:`, Array.from(visible));
    return visible;
  }, [fields, fieldValues]);

  // Helper function to check if a field should be rendered
  const shouldRenderField = (fieldId) => {
    return visibleFields.has(fieldId);
  };

  return {
    shouldRenderField,
    visibleFields
  };
};

export default useConditionalLogic;
