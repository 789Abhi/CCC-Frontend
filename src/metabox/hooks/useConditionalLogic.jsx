import { useState, useEffect, useCallback, useMemo } from 'react';

/**
 * React hook for handling conditional logic in metabox fields
 * This replaces the old JavaScript-based conditional logic handler
 */
export const useConditionalLogic = (fields = [], fieldValues = {}) => {
  const [visibleFields, setVisibleFields] = useState(new Set());

  // Parse field configurations and extract conditional logic
  const fieldsWithConditionalLogic = useMemo(() => {
    const result = new Map();
    
    fields.forEach(field => {
      try {
        if (field?.config) {
          const configObj = typeof field.config === 'string' 
            ? JSON.parse(field.config) 
            : field.config;
          
          // Only process fields with conditional logic
          if (configObj.field_condition && 
              configObj.field_condition !== 'always_show' && 
              configObj.conditional_logic?.length > 0) {
            result.set(field.id, {
              fieldId: field.id,
              config: configObj
            });
          }
        }
      } catch (error) {
        console.error(`Error parsing config for field ${field.id}:`, error);
      }
    });
    
    return result;
  }, [fields]);

  // Get current field value helper
  const getFieldValue = useCallback((fieldId) => {
    const value = fieldValues[fieldId];
    
    // Handle different field types
    if (Array.isArray(value)) {
      return value.length > 0 ? value.join(',') : '';
    }
    
    // Convert to string and handle boolean values
    const stringValue = String(value || '');
    
    // For toggle fields, convert "1"/"0" to boolean
    const targetField = fields.find(f => f.id === fieldId);
    if (targetField?.type === 'toggle') {
      return stringValue === '1' || stringValue === 'true';
    }
    
    return stringValue;
  }, [fieldValues, fields]);

  // Evaluate a single conditional rule
  const evaluateRule = useCallback((rule) => {
    const targetValue = getFieldValue(rule.target_field);
    
    switch (rule.condition) {
      case 'when_toggle_is':
        const expectedValue = rule.value === '1' ? true : false;
        return targetValue === expectedValue;
        
      case 'when_field_equals':
        return targetValue == rule.value;
        
      case 'when_field_not_equals':
        return targetValue != rule.value;
        
      case 'when_field_contains':
        // If rule value is empty, check if target field is actually empty
        if (rule.value === '') {
          return targetValue === '';
        }
        return String(targetValue).includes(String(rule.value));
        
      case 'when_field_not_contains':
        // If rule value is empty, check if target field is not empty
        if (rule.value === '') {
          return targetValue !== '';
        }
        return !String(targetValue).includes(String(rule.value));
        
      default:
        console.warn(`Unknown condition: ${rule.condition}`);
        return false;
    }
  }, [getFieldValue]);

  // Evaluate conditional logic for a field
  const evaluateConditionalLogic = useCallback((config) => {
    if (!config.conditional_logic || config.conditional_logic.length === 0) {
      return true;
    }

    const results = config.conditional_logic.map(rule => evaluateRule(rule));
    
    // Apply logic operator
    const operator = config.logic_operator || 'OR';
    
    if (operator === 'AND') {
      return results.every(result => result === true);
    } else {
      return results.some(result => result === true);
    }
  }, [evaluateRule]);

  // Calculate which fields should be visible
  const calculateVisibleFields = useCallback(() => {
    const visible = new Set();
    
    // All fields without conditional logic are always visible
    fields.forEach(field => {
      if (!fieldsWithConditionalLogic.has(field.id)) {
        visible.add(field.id);
      }
    });
    
    // Evaluate conditional logic for fields that have it
    fieldsWithConditionalLogic.forEach(({ fieldId, config }) => {
      const shouldShow = evaluateConditionalLogic(config);
      
      if (config.field_condition === 'show_when') {
        if (shouldShow) {
          visible.add(fieldId);
        }
      } else if (config.field_condition === 'hide_when') {
        if (!shouldShow) {
          visible.add(fieldId);
        }
      }
    });
    
    return visible;
  }, [fields, fieldsWithConditionalLogic, evaluateConditionalLogic]);

  // Update visible fields when dependencies change
  useEffect(() => {
    const newVisibleFields = calculateVisibleFields();
    setVisibleFields(newVisibleFields);
  }, [calculateVisibleFields]);

  // Helper function to check if a field should be rendered
  const shouldRenderField = useCallback((fieldId) => {
    return visibleFields.has(fieldId);
  }, [visibleFields]);

  // Get all target field IDs that other fields depend on
  const targetFieldIds = useMemo(() => {
    const targets = new Set();
    fieldsWithConditionalLogic.forEach(({ config }) => {
      config.conditional_logic?.forEach(rule => {
        if (rule.target_field) {
          targets.add(rule.target_field);
        }
      });
    });
    return targets;
  }, [fieldsWithConditionalLogic]);

  return {
    shouldRenderField,
    visibleFields,
    fieldsWithConditionalLogic,
    targetFieldIds,
    // For debugging
    getFieldValue,
    evaluateConditionalLogic
  };
};

export default useConditionalLogic;
