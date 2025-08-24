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
    const targetField = fields.find(f => f.id === fieldId);
    
    console.log(`📄 Getting value for field ${fieldId} (${targetField?.type}): raw value =`, value);
    
    // Handle different field types
    if (Array.isArray(value)) {
      const result = value.length > 0 ? value.join(',') : '';
      console.log(`  Array field result: "${result}"`);
      return result;
    }
    
    // Convert to string and handle boolean values
    const stringValue = String(value || '');
    
    // For toggle fields, convert "1"/"0" to boolean
    if (targetField?.type === 'toggle') {
      const boolResult = stringValue === '1' || stringValue === 'true';
      console.log(`  Toggle field result: ${boolResult} (from "${stringValue}")`);
      return boolResult;
    }
    
    console.log(`  String field result: "${stringValue}"`);
    return stringValue;
  }, [fieldValues, fields]);

  // Evaluate a single conditional rule
  const evaluateRule = useCallback((rule) => {
    const targetValue = getFieldValue(rule.target_field);
    const targetField = fields.find(f => f.id === rule.target_field);
    
    console.log(`🔄 Evaluating rule: field ${rule.target_field} (${targetField?.type}), condition=${rule.condition}, expected="${rule.value}", actual=`, targetValue);
    
    let result = false;
    
    switch (rule.condition) {
      case 'when_toggle_is':
        const expectedToggleValue = rule.value === '1' ? true : false;
        result = targetValue === expectedToggleValue;
        console.log(`  Toggle comparison: expected=${expectedToggleValue}, actual=${targetValue}, result=${result}`);
        break;
        
      case 'when_field_equals':
        result = targetValue == rule.value;
        console.log(`  Equals comparison: "${targetValue}" == "${rule.value}", result=${result}`);
        break;
        
      case 'when_field_not_equals':
        result = targetValue != rule.value;
        console.log(`  Not equals comparison: "${targetValue}" != "${rule.value}", result=${result}`);
        break;
        
      case 'when_field_contains':
        // Special handling for different field types
        if (targetField?.type === 'checkbox') {
          // For checkbox fields, check if the value is selected
          if (rule.value === '') {
            result = targetValue === '';
          } else {
            // Check if the target value contains the expected value (for multi-select checkboxes)
            const targetStr = String(targetValue);
            const expectedStr = String(rule.value);
            result = targetStr.includes(expectedStr) || targetStr === expectedStr;
          }
          console.log(`  Checkbox contains: "${targetValue}" contains "${rule.value}", result=${result}`);
        } else {
          // For other field types
          if (rule.value === '') {
            result = targetValue === '';
          } else {
            result = String(targetValue).includes(String(rule.value));
          }
          console.log(`  String contains: "${targetValue}" contains "${rule.value}", result=${result}`);
        }
        break;
        
      case 'when_field_not_contains':
        // For checkbox fields
        if (targetField?.type === 'checkbox') {
          if (rule.value === '') {
            result = targetValue !== '';
          } else {
            const targetStr = String(targetValue);
            const expectedStr = String(rule.value);
            result = !targetStr.includes(expectedStr) && targetStr !== expectedStr;
          }
          console.log(`  Checkbox not contains: "${targetValue}" not contains "${rule.value}", result=${result}`);
        } else {
          // For other field types
          if (rule.value === '') {
            result = targetValue !== '';
          } else {
            result = !String(targetValue).includes(String(rule.value));
          }
          console.log(`  String not contains: "${targetValue}" not contains "${rule.value}", result=${result}`);
        }
        break;
        
      default:
        console.warn(`Unknown condition: ${rule.condition}`);
        result = false;
    }
    
    console.log(`  Final rule result: ${result}`);
    return result;
  }, [getFieldValue, fields]);

  // Evaluate conditional logic for a field
  const evaluateConditionalLogic = useCallback((config, fieldId = null) => {
    if (!config.conditional_logic || config.conditional_logic.length === 0) {
      return true;
    }

    console.log(`🔍 Evaluating conditional logic for field ${fieldId}:`);
    console.log('Config:', config);
    console.log('Current field values:', fieldValues);

    const results = config.conditional_logic.map((rule, index) => {
      const result = evaluateRule(rule);
      console.log(`Rule ${index + 1}: target=${rule.target_field}, condition=${rule.condition}, expected="${rule.value}", result=${result}`);
      return result;
    });
    
    // Apply logic operator
    const operator = config.logic_operator || 'OR';
    
    let finalResult;
    if (operator === 'AND') {
      finalResult = results.every(result => result === true);
      console.log(`AND logic: [${results.join(', ')}] = ${finalResult}`);
    } else {
      finalResult = results.some(result => result === true);
      console.log(`OR logic: [${results.join(', ')}] = ${finalResult}`);
    }
    
    return finalResult;
  }, [evaluateRule, fieldValues]);

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
      const shouldShow = evaluateConditionalLogic(config, fieldId);
      
      console.log(`Field ${fieldId}: condition="${config.field_condition}", shouldShow=${shouldShow}`);
      
      if (config.field_condition === 'show_when') {
        if (shouldShow) {
          visible.add(fieldId);
          console.log(`✅ Field ${fieldId} ADDED to visible set`);
        } else {
          console.log(`❌ Field ${fieldId} NOT added to visible set`);
        }
      } else if (config.field_condition === 'hide_when') {
        if (!shouldShow) {
          visible.add(fieldId);
          console.log(`✅ Field ${fieldId} ADDED to visible set (hide_when)`);
        } else {
          console.log(`❌ Field ${fieldId} NOT added to visible set (hide_when)`);
        }
      }
    });
    
    return visible;
  }, [fields, fieldsWithConditionalLogic, evaluateConditionalLogic]);

  // Update visible fields when dependencies change
  useEffect(() => {
    const newVisibleFields = calculateVisibleFields();
    setVisibleFields(newVisibleFields);
    console.log(`📊 Visible fields updated:`, Array.from(newVisibleFields));
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
