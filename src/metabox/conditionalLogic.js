/**
 * Conditional Logic Handler for Toggle Fields
 * This file handles the execution of conditional logic rules
 * to show/hide/enable/disable fields based on toggle field states
 */

class ConditionalLogicHandler {
  constructor() {
    this.rules = new Map(); // Store rules by toggle field ID
    this.fieldStates = new Map(); // Store current field states
    this.initialized = false;
  }

  /**
   * Initialize the conditional logic handler
   */
  init() {
    if (this.initialized) return;
    
    // Listen for DOM changes to detect new toggle fields
    this.observeDOMChanges();
    
    // Process existing toggle fields
    this.processExistingToggleFields();
    
    this.initialized = true;
    console.log('CCC: Conditional Logic Handler initialized');
  }

  /**
   * Observe DOM changes to detect new toggle fields
   */
  observeDOMChanges() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              this.processToggleField(node);
              // Also check child elements
              const toggleFields = node.querySelectorAll('.ccc-field-toggle');
              toggleFields.forEach(field => this.processToggleField(field));
            }
          });
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  /**
   * Process existing toggle fields in the DOM
   */
  processExistingToggleFields() {
    const toggleFields = document.querySelectorAll('.ccc-field-toggle');
    toggleFields.forEach(field => this.processToggleField(field));
  }

  /**
   * Process a toggle field and set up conditional logic
   */
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

  /**
   * Set up event listener for toggle field changes
   */
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

  /**
   * Apply conditional logic for a specific toggle field
   */
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

  /**
   * Check if a toggle field is enabled
   */
  isToggleEnabled(toggleInput) {
    if (toggleInput.type === 'checkbox') {
      return toggleInput.checked;
    } else if (toggleInput.type === 'hidden') {
      return toggleInput.value === '1';
    }
    return false;
  }

  /**
   * Process a single conditional rule
   */
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

  /**
   * Find target fields by name or ID
   */
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

  /**
   * Evaluate if a condition is met
   */
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

  /**
   * Get the current value of a field
   */
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

  /**
   * Apply an action to a target field
   */
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

  /**
   * Add conditional logic rules for a toggle field
   */
  addRules(toggleFieldId, rules) {
    this.rules.set(toggleFieldId, rules);
    this.applyConditionalLogic(toggleFieldId);
  }

  /**
   * Remove conditional logic rules for a toggle field
   */
  removeRules(toggleFieldId) {
    this.rules.delete(toggleFieldId);
  }

  /**
   * Get all current rules
   */
  getAllRules() {
    return Object.fromEntries(this.rules);
  }

  /**
   * Clear all rules
   */
  clearAllRules() {
    this.rules.clear();
  }
}

// Create global instance
window.cccConditionalLogic = new ConditionalLogicHandler();

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.cccConditionalLogic.init();
  });
} else {
  window.cccConditionalLogic.init();
}

// Export for module systems
export default window.cccConditionalLogic;
