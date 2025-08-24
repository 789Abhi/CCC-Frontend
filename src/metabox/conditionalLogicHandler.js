/**
 * Conditional Logic Handler for Toggle Fields
 * Handles the execution of conditional logic rules in the metabox
 */

class ConditionalLogicHandler {
  constructor() {
    this.toggleFields = new Map();
    this.targetFields = new Map();
    this.init();
  }

  init() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setup());
    } else {
      this.setup();
    }
  }

  setup() {
    this.processExistingToggleFields();
    this.setupMutationObserver();
  }

  processExistingToggleFields() {
    // Find all toggle fields with conditional logic
    const toggleFields = document.querySelectorAll('.ccc-field-toggle[data-conditional-logic]');
    toggleFields.forEach(toggleField => this.processToggleField(toggleField));
  }

  setupMutationObserver() {
    // Watch for new toggle fields being added to the DOM
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            // Check if the added node is a toggle field
            if (node.classList && node.classList.contains('ccc-field-toggle')) {
              this.processToggleField(node);
            }
            // Check if any toggle fields were added within the node
            const toggleFields = node.querySelectorAll && node.querySelectorAll('.ccc-field-toggle[data-conditional-logic]');
            if (toggleFields) {
              toggleFields.forEach(toggleField => this.processToggleField(toggleField));
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

  processToggleField(toggleField) {
    const toggleFieldId = toggleField.getAttribute('data-toggle-field-id');
    const conditionalLogicData = toggleField.getAttribute('data-conditional-logic');

    if (!toggleFieldId || !conditionalLogicData) return;

    try {
      const conditionalLogic = JSON.parse(conditionalLogicData);
      
      // Store toggle field reference
      this.toggleFields.set(toggleFieldId, {
        element: toggleField,
        config: conditionalLogic
      });

      // Find the toggle input
      const toggleInput = toggleField.querySelector('input[type="checkbox"]');
      if (toggleInput) {
        // Set up event listener for toggle changes
        toggleInput.addEventListener('change', (e) => {
          this.handleToggleChange(toggleFieldId, e.target.checked);
        });

        // Apply initial state
        this.handleToggleChange(toggleFieldId, toggleInput.checked);
      }

      // Process target fields
      this.processTargetFields(conditionalLogic);
    } catch (error) {
      console.error('Error processing toggle field:', error);
    }
  }

  processTargetFields(conditionalLogic) {
    if (!conditionalLogic.conditional_logic || !Array.isArray(conditionalLogic.conditional_logic)) return;

    conditionalLogic.conditional_logic.forEach(rule => {
      if (rule.target_field) {
        const targetField = document.querySelector(`[data-field-id="${rule.target_field}"]`);
        if (targetField && !this.targetFields.has(rule.target_field)) {
          this.targetFields.set(rule.target_field, targetField);
        }
      }
    });
  }

  handleToggleChange(toggleFieldId, isChecked) {
    const toggleField = this.toggleFields.get(toggleFieldId);
    if (!toggleField) return;

    const { config } = toggleField;
    
    // Handle overall field condition
    if (config.field_condition === 'always_show') {
      // Field is always visible, no conditional logic needed
      return;
    }

    // Apply conditional logic based on field condition
    if (config.field_condition === 'show_when' || config.field_condition === 'hide_when') {
      const shouldShow = this.evaluateConditionalLogic(config, isChecked);
      
      if (config.field_condition === 'show_when') {
        this.applyFieldVisibility(toggleField.element, shouldShow);
      } else if (config.field_condition === 'hide_when') {
        this.applyFieldVisibility(toggleField.element, !shouldShow);
      }
    }

    // Apply rules to target fields
    if (config.conditional_logic && Array.isArray(config.conditional_logic)) {
      config.conditional_logic.forEach(rule => {
        this.applyRule(rule, isChecked);
      });
    }
  }

  evaluateConditionalLogic(config, toggleValue) {
    if (!config.conditional_logic || config.conditional_logic.length === 0) {
      return true;
    }

    const results = config.conditional_logic.map(rule => this.evaluateRule(rule, toggleValue));
    
    if (config.logic_operator === 'AND') {
      return results.every(result => result === true);
    } else {
      return results.some(result => result === true);
    }
  }

  evaluateRule(rule, toggleValue) {
    if (rule.condition === 'when_toggle_is') {
      const expectedValue = rule.value === '1' ? true : false;
      return toggleValue === expectedValue;
    }

    // Get target field value for comparison
    const targetField = this.targetFields.get(rule.target_field) || 
                       document.querySelector(`[data-field-id="${rule.target_field}"]`);
    
    if (!targetField) return false;
    
    const targetValue = this.getFieldValue(targetField);
    
    switch (rule.condition) {
      case 'when_field_equals':
        return targetValue == rule.value;
      case 'when_field_not_equals':
        return targetValue != rule.value;
      case 'when_field_contains':
        return String(targetValue).includes(String(rule.value));
      case 'when_field_not_contains':
        return !String(targetValue).includes(String(rule.value));
      case 'when_field_greater_than':
        return parseFloat(targetValue) > parseFloat(rule.value);
      case 'when_field_less_than':
        return parseFloat(targetValue) < parseFloat(rule.value);
      case 'when_field_greater_equal':
        return parseFloat(targetValue) >= parseFloat(rule.value);
      case 'when_field_less_equal':
        return parseFloat(targetValue) <= parseFloat(rule.value);
      default:
        return false;
    }
  }

  applyRule(rule, toggleValue) {
    if (!rule.target_field) return;

    const targetField = this.targetFields.get(rule.target_field) || 
                       document.querySelector(`[data-field-id="${rule.target_field}"]`);
    
    if (!targetField) return;

    const shouldExecute = this.evaluateRule(rule, toggleValue);
    
    if (shouldExecute) {
      // Action is determined by field_condition, not by individual rules
      // This method is called for each rule, but the actual action is applied at the field level
      // in handleToggleChange based on field_condition
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
    if (shouldShow) {
      fieldElement.classList.remove('ccc-field-hidden');
    } else {
      fieldElement.classList.add('ccc-field-hidden');
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
    // Get the value from various input types
    const input = fieldElement.querySelector('input, select, textarea');
    if (!input) return '';
    
    switch (input.type) {
      case 'checkbox':
        return input.checked;
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
    this.toggleFields.forEach((toggleField, toggleFieldId) => {
      const toggleInput = toggleField.element.querySelector('input[type="checkbox"]');
      if (toggleInput) {
        this.handleToggleChange(toggleFieldId, toggleInput.checked);
      }
    });
  }

  // Public method to add a new toggle field
  addToggleField(toggleFieldElement) {
    this.processToggleField(toggleFieldElement);
  }

  // Public method to remove a toggle field
  removeToggleField(toggleFieldId) {
    this.toggleFields.delete(toggleFieldId);
  }
}

// Initialize the handler when the script loads
const conditionalLogicHandler = new ConditionalLogicHandler();

// Make it available globally for debugging and manual control
window.conditionalLogicHandler = conditionalLogicHandler;

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ConditionalLogicHandler;
}
