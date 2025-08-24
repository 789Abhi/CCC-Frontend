/**
 * Conditional Logic Handler for All Field Types
 * Handles the execution of conditional logic rules in the metabox
 */

class ConditionalLogicHandler {
  constructor() {
    console.log('CCC: Initializing ConditionalLogicHandler constructor');
    this.fieldsWithConditionalLogic = new Map();
    this.targetFields = new Map();
    this.init();
    console.log('CCC: ConditionalLogicHandler setup complete');
  }

  init() {
    // Inject CSS for conditional logic
    this.injectCSS();
    
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setup());
    } else {
      this.setup();
    }
  }

  injectCSS() {
    if (document.getElementById('ccc-conditional-logic-css')) return;
    
    const style = document.createElement('style');
    style.id = 'ccc-conditional-logic-css';
    style.textContent = `
      .ccc-field-hidden {
        display: none !important;
        visibility: hidden !important;
        opacity: 0 !important;
        height: 0 !important;
        overflow: hidden !important;
      }
      .ccc-field-disabled {
        opacity: 0.5;
        pointer-events: none;
      }
      .ccc-field-disabled input,
      .ccc-field-disabled select,
      .ccc-field-disabled textarea,
      .ccc-field-disabled button {
        opacity: 0.5;
        pointer-events: none;
      }
    `;
    document.head.appendChild(style);
  }

  setup() {
    this.processExistingFieldsWithConditionalLogic();
    this.setupMutationObserver();
    
    // Apply initial conditional logic state (multiple attempts for robustness)
    setTimeout(() => {
      this.applyInitialConditionalLogic();
    }, 100);
    
    setTimeout(() => {
      this.applyInitialConditionalLogic();
    }, 500);
    
    setTimeout(() => {
      this.applyInitialConditionalLogic();
    }, 1000);
  }

  applyInitialConditionalLogic() {
    // First, evaluate conditional logic for all fields based on current field values
    this.fieldsWithConditionalLogic.forEach((fieldData, fieldId) => {
      const { config, element } = fieldData;
      
      if (config.field_condition === 'show_when' && config.conditional_logic) {
        const shouldShow = this.evaluateConditionalLogicForField(config);
        this.applyFieldVisibility(element, shouldShow);
      }
    });
    
    // Then trigger change events to ensure all dependent fields are updated
    this.targetFields.forEach((fieldElement, fieldId) => {
      const currentValue = this.getFieldValue(fieldElement);
      this.handleFieldChange(fieldId, currentValue);
    });
  }

  processExistingFieldsWithConditionalLogic() {
    // Find all fields with conditional logic (both .ccc-field and .ccc-field-wrapper)
    const fieldsWithConditionalLogic = document.querySelectorAll('.ccc-field[data-conditional-logic], .ccc-field-wrapper[data-conditional-logic]');
    
    fieldsWithConditionalLogic.forEach(field => {
      this.processFieldWithConditionalLogic(field);
    });
    
    // Also find fields that might be targets of conditional logic
    const allFields = document.querySelectorAll('.ccc-field[data-field-id], .ccc-field-wrapper[data-field-id]');
    
    allFields.forEach(field => {
      const fieldId = field.getAttribute('data-field-id');
      if (fieldId && !this.targetFields.has(fieldId)) {
        this.targetFields.set(fieldId, field);
      }
    });
  }

  setupMutationObserver() {
    // Watch for new fields with conditional logic being added to the DOM
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            // Check if the added node is a field with conditional logic
            if (node.classList && (node.classList.contains('ccc-field') || node.classList.contains('ccc-field-wrapper')) && node.getAttribute('data-conditional-logic')) {
              this.processFieldWithConditionalLogic(node);
            }
            // Check if any fields with conditional logic were added within the node
            const fieldsWithConditionalLogic = node.querySelectorAll && node.querySelectorAll('.ccc-field[data-conditional-logic], .ccc-field-wrapper[data-conditional-logic]');
            if (fieldsWithConditionalLogic) {
              fieldsWithConditionalLogic.forEach(field => this.processFieldWithConditionalLogic(field));
            }
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  processFieldWithConditionalLogic(field) {
    const fieldId = field.getAttribute('data-field-id');
    const conditionalLogicData = field.getAttribute('data-conditional-logic');

    if (!fieldId || !conditionalLogicData) return;

    try {
      const conditionalLogic = JSON.parse(conditionalLogicData);
      
      // Store field reference
      this.fieldsWithConditionalLogic.set(fieldId, {
        element: field,
        config: conditionalLogic
      });

      // Set up event listeners for field changes
      this.setupFieldEventListeners(field, fieldId, conditionalLogic);

      // Process target fields
      this.processTargetFields(conditionalLogic);
    } catch (error) {
      console.error('Error processing field with conditional logic:', error);
    }
  }

  processTargetFields(conditionalLogic) {
    if (!conditionalLogic.conditional_logic || !Array.isArray(conditionalLogic.conditional_logic)) return;

    conditionalLogic.conditional_logic.forEach(rule => {
      if (rule.target_field) {
        const targetField = document.querySelector(`[data-field-id="${rule.target_field}"]`);
        if (targetField && !this.targetFields.has(rule.target_field)) {
          this.targetFields.set(rule.target_field, targetField);
          
          // Also set up event listeners on this target field so changes propagate
          this.setupFieldEventListeners(targetField, rule.target_field, {});
        }
      }
    });
  }

  setupFieldEventListeners(field, fieldId, conditionalLogic) {
    // For toggle fields, listen to button clicks (our toggle uses button, not checkbox)
    if (field.classList.contains('ccc-field-toggle')) {
      const toggleButton = field.querySelector('button[aria-pressed]');
      if (toggleButton) {
        console.log(`Setting up toggle event listener for field ${fieldId}`);
        toggleButton.addEventListener('click', () => {
          // Wait a moment for the aria-pressed to update, then get the new value
          setTimeout(() => {
            const newValue = this.getFieldValue(field);
            console.log(`Toggle ${fieldId} clicked, new value: ${newValue}`);
            this.handleFieldChange(fieldId, newValue);
          }, 10);
        });
        
        // Apply initial state
        this.handleFieldChange(fieldId, this.getFieldValue(field));
      }
    } else {
      // For other field types, listen to various input changes
      const inputs = field.querySelectorAll('input, select, textarea');
      inputs.forEach(input => {
        input.addEventListener('change', (e) => {
          this.handleFieldChange(fieldId, this.getFieldValue(field));
        });
        input.addEventListener('input', (e) => {
          this.handleFieldChange(fieldId, this.getFieldValue(field));
        });
      });
      
      // Apply initial state
      this.handleFieldChange(fieldId, this.getFieldValue(field));
    }
  }

  handleFieldChange(fieldId, fieldValue) {
    
    // When a field changes, we need to:
    // 1. Check all OTHER fields that might have conditional logic depending on this field
    // 2. Apply conditional logic to those fields based on this field's new value
    
    this.fieldsWithConditionalLogic.forEach((targetFieldData, targetFieldId) => {
      const { config, element } = targetFieldData;
      
      // Skip if this field doesn't have conditional logic
      if (config.field_condition === 'always_show') {
        return;
      }
      
      // Check if this target field has rules that depend on the changed field
      if (config.conditional_logic && Array.isArray(config.conditional_logic)) {
        const hasRuleForChangedField = config.conditional_logic.some(rule => 
          rule.target_field === fieldId
        );
        
        if (hasRuleForChangedField) {
          // Evaluate all rules for this target field
          const shouldShow = this.evaluateConditionalLogicForField(config, fieldId, fieldValue);
          
          if (config.field_condition === 'show_when') {
            this.applyFieldVisibility(element, shouldShow);
          } else if (config.field_condition === 'hide_when') {
            this.applyFieldVisibility(element, !shouldShow);
          }
        }
      }
    });
  }

  evaluateConditionalLogic(config, fieldValue) {
    if (!config.conditional_logic || config.conditional_logic.length === 0) {
      return true;
    }

    const results = config.conditional_logic.map(rule => this.evaluateRule(rule, fieldValue));
    
    if (config.logic_operator === 'AND') {
      return results.every(result => result === true);
    } else {
      return results.some(result => result === true);
    }
  }

  evaluateConditionalLogicForField(config, changedFieldId = null, changedFieldValue = null) {
    if (!config.conditional_logic || config.conditional_logic.length === 0) {
      return true;
    }

    console.log(`=== Evaluating ${config.logic_operator} logic for field ===`);
    
    const results = config.conditional_logic.map((rule, index) => {
      let result;
      if (changedFieldId && rule.target_field === changedFieldId) {
        // Use the provided field value for this specific rule
        result = this.evaluateRuleWithValue(rule, changedFieldValue);
        console.log(`Rule ${index + 1}: target=${rule.target_field}, condition=${rule.condition}, expected="${rule.value}", actual=${changedFieldValue}, result=${result}`);
      } else {
        // Get current value for other fields
        result = this.evaluateRule(rule, null);
        console.log(`Rule ${index + 1}: target=${rule.target_field}, condition=${rule.condition}, expected="${rule.value}", result=${result}`);
      }
      return result;
    });
    
    let finalResult;
    if (config.logic_operator === 'AND') {
      finalResult = results.every(result => result === true);
      console.log(`AND logic: [${results.join(', ')}] = ${finalResult}`);
    } else {
      finalResult = results.some(result => result === true);
      console.log(`OR logic: [${results.join(', ')}] = ${finalResult}`);
    }
    
    return finalResult;
  }

  evaluateRule(rule, fieldValue) {
    if (rule.condition === 'when_toggle_is') {
      const expectedValue = rule.value === '1' ? true : false;
      return fieldValue === expectedValue;
    }

    // Get target field value for comparison
    const targetField = this.targetFields.get(rule.target_field) || 
                       document.querySelector(`[data-field-id="${rule.target_field}"]`);
    
    if (!targetField) {
      console.log(`  Target field ${rule.target_field} not found!`);
      return false;
    }
    
    const targetValue = this.getFieldValue(targetField);
    console.log(`  Getting current value for field ${rule.target_field}: "${targetValue}"`);
    
    return this.evaluateRuleWithValue(rule, targetValue);
  }

  evaluateRuleWithValue(rule, targetValue) {
    let result;
    
    switch (rule.condition) {
      case 'when_toggle_is':
        const expectedValue = rule.value === '1' ? true : false;
        result = targetValue === expectedValue;
        console.log(`  Toggle rule: expected=${expectedValue}, actual=${targetValue}, result=${result}`);
        break;
      case 'when_field_equals':
        result = targetValue == rule.value;
        console.log(`  Equals rule: expected="${rule.value}", actual="${targetValue}", result=${result}`);
        break;
      case 'when_field_not_equals':
        result = targetValue != rule.value;
        console.log(`  Not equals rule: expected="${rule.value}", actual="${targetValue}", result=${result}`);
        break;
      case 'when_field_contains':
        if (rule.value === '' || rule.value === null || rule.value === undefined) {
          // If checking for empty value, check if field is actually empty
          result = targetValue === '' || targetValue === null || targetValue === undefined;
          console.log(`  Contains empty rule: field="${targetValue}", checking if empty, result=${result}`);
        } else {
          result = String(targetValue).includes(String(rule.value));
          console.log(`  Contains rule: field="${targetValue}", looking for="${rule.value}", result=${result}`);
        }
        break;
      case 'when_field_not_contains':
        result = !String(targetValue).includes(String(rule.value));
        console.log(`  Not contains rule: field="${targetValue}", looking for="${rule.value}", result=${result}`);
        break;
      case 'when_field_greater_than':
        result = parseFloat(targetValue) > parseFloat(rule.value);
        console.log(`  Greater than rule: ${targetValue} > ${rule.value} = ${result}`);
        break;
      case 'when_field_less_than':
        result = parseFloat(targetValue) < parseFloat(rule.value);
        console.log(`  Less than rule: ${targetValue} < ${rule.value} = ${result}`);
        break;
      case 'when_field_greater_equal':
        result = parseFloat(targetValue) >= parseFloat(rule.value);
        console.log(`  Greater equal rule: ${targetValue} >= ${rule.value} = ${result}`);
        break;
      case 'when_field_less_equal':
        result = parseFloat(targetValue) <= parseFloat(rule.value);
        console.log(`  Less equal rule: ${targetValue} <= ${rule.value} = ${result}`);
        break;
      default:
        result = false;
        console.log(`  Unknown condition: ${rule.condition}, result=${result}`);
        break;
    }
    
    return result;
  }

  applyRule(rule, fieldValue) {
    if (!rule.target_field) return;

    const targetField = this.targetFields.get(rule.target_field) || 
                       document.querySelector(`[data-field-id="${rule.target_field}"]`);
    
    if (!targetField) return;

    const shouldExecute = this.evaluateRule(rule, fieldValue);
    
    if (shouldExecute) {
      // Action is determined by field_condition, not by individual rules
      // This method is called for each rule, but the actual action is applied at the field level
      // in handleFieldChange based on field_condition
    }
  }

  applyAction(targetField, action) {
    switch (action) {
      case 'show':
        targetField.classList.remove('ccc-field-hidden');
        break;
      case 'hide':
        targetField.classList.add('ccc-field-hidden');
        break;
      case 'enable':
        targetField.classList.remove('ccc-field-disabled');
        this.enableFieldInputs(targetField);
        break;
      case 'disable':
        targetField.classList.add('ccc-field-disabled');
        this.disableFieldInputs(targetField);
        break;
    }
  }

  applyFieldVisibility(fieldElement, shouldShow) {
    const fieldId = fieldElement.getAttribute('data-field-id');
    
    if (shouldShow) {
      fieldElement.classList.remove('ccc-field-hidden');
    } else {
      fieldElement.classList.add('ccc-field-hidden');
      
      // Clear validation errors for hidden fields
      if (fieldId && window.cccMetaboxApp && window.cccMetaboxApp.clearValidationErrorsForField) {
        window.cccMetaboxApp.clearValidationErrorsForField(fieldId);
      }
    }
  }

  enableFieldInputs(fieldElement) {
    const inputs = fieldElement.querySelectorAll('input, select, textarea, button');
    inputs.forEach(input => {
      input.disabled = false;
      input.classList.remove('opacity-50', 'cursor-not-allowed');
    });
  }

  disableFieldInputs(fieldElement) {
    const inputs = fieldElement.querySelectorAll('input, select, textarea, button');
    inputs.forEach(input => {
      input.disabled = true;
      input.classList.add('opacity-50', 'cursor-not-allowed');
    });
  }

  getFieldValue(fieldElement) {
    // Check for toggle button first (has aria-pressed attribute)
    const toggleButton = fieldElement.querySelector('button[aria-pressed]');
    if (toggleButton) {
      const isPressed = toggleButton.getAttribute('aria-pressed') === 'true';
      return isPressed;
    }
    
    // Get the value from various input types
    const input = fieldElement.querySelector('input, select, textarea');
    if (!input) {
      return '';
    }
    
    switch (input.type) {
      case 'checkbox':
        // For single checkbox, return checked state
        if (fieldElement.querySelectorAll('input[type="checkbox"]').length === 1) {
          return input.checked;
        } else {
          // For multiple checkboxes (checkbox field), return selected values as comma-separated string
          const checkedBoxes = fieldElement.querySelectorAll('input[type="checkbox"]:checked');
          const values = Array.from(checkedBoxes).map(cb => cb.value);
          return values.join(',');
        }
      case 'radio':
        const checkedRadio = fieldElement.querySelector('input[type="radio"]:checked');
        return checkedRadio ? checkedRadio.value : '';
      case 'file':
        return input.files && input.files.length > 0 ? input.files[0].name : '';
      default:
        return input.value || '';
    }
  }

  // Public method to refresh all conditional logic
  refresh() {
    this.fieldsWithConditionalLogic.forEach((field, fieldId) => {
      this.handleFieldChange(fieldId, this.getFieldValue(field.element));
    });
  }

  // Public method to add a new field with conditional logic
  addField(fieldElement) {
    this.processFieldWithConditionalLogic(fieldElement);
  }

  // Public method to remove a field with conditional logic
  removeField(fieldId) {
    this.fieldsWithConditionalLogic.delete(fieldId);
  }
}

console.log('CCC: Conditional Logic Handler script loaded');

// Initialize the handler when the script loads
const conditionalLogicHandler = new ConditionalLogicHandler();

// Make it available globally for debugging and manual control
window.conditionalLogicHandler = conditionalLogicHandler;

console.log('CCC: Conditional Logic Handler initialized:', conditionalLogicHandler);

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ConditionalLogicHandler;
}
