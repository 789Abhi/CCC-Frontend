# Toggle Field Conditional Logic

This document explains how to use the conditional logic functionality for toggle fields in the Custom Craft Component metabox.

## Overview

The conditional logic system allows you to control the visibility and interaction state of other fields based on the state of a toggle field. You can create complex rules using AND/OR logic to show/hide/enable/disable fields dynamically.

## Features

- **Show/Hide Fields**: Control field visibility based on toggle state
- **Enable/Disable Fields**: Control field interaction based on toggle state
- **AND/OR Logic**: Combine multiple rules with logical operators
- **Multiple Conditions**: Support for various condition types
- **Real-time Updates**: Fields update immediately when toggle state changes
- **Persistent Configuration**: Rules are saved with the field configuration

## How It Works

1. **Toggle Field**: A field with type "toggle" that can be enabled/disabled
2. **Conditional Rules**: Rules that define what happens to target fields
3. **Target Fields**: Fields that are affected by the conditional logic
4. **Actions**: What happens to the target field (show, hide, enable, disable)
5. **Conditions**: When the action should be applied

## Setting Up Conditional Logic

### 1. Create a Toggle Field

In your component, add a field with type "toggle":

```json
{
  "id": "toggle_field_1",
  "type": "toggle",
  "label": "Enable Advanced Options",
  "name": "enable_advanced",
  "config": {
    "default_value": false,
    "conditional_logic": [],
    "logic_operator": "AND"
  }
}
```

### 2. Add Conditional Rules

Click the "Conditional Logic" button on your toggle field to open the configuration panel.

#### Rule Structure

Each rule has the following properties:

- **Target Field**: The field that will be affected
- **Action**: What action to take (show, hide, enable, disable)
- **Condition**: When to apply the action
- **Value**: The value to compare against

#### Available Actions

- `show`: Make the target field visible
- `hide`: Make the target field invisible
- `enable`: Allow interaction with the target field
- `disable`: Prevent interaction with the target field

#### Available Conditions

- `when_toggle_is`: When the toggle field has a specific value
- `when_field_equals`: When another field equals a specific value
- `when_field_not_equals`: When another field doesn't equal a specific value
- `when_field_contains`: When another field contains specific text
- `when_field_not_contains`: When another field doesn't contain specific text

### 3. Configure Logic Operator

Choose between:
- **AND**: All rules must be true for actions to execute
- **OR**: Any rule being true will execute actions

## Example Configurations

### Simple Show/Hide

```json
{
  "conditional_logic": [
    {
      "id": 1,
      "target_field": "advanced_field",
      "action": "show",
      "condition": "when_toggle_is",
      "value": "1"
    }
  ],
  "logic_operator": "AND"
}
```

**Result**: When the toggle is enabled, the `advanced_field` will be shown.

### Multiple Rules with AND Logic

```json
{
  "conditional_logic": [
    {
      "id": 1,
      "target_field": "field1",
      "action": "show",
      "condition": "when_toggle_is",
      "value": "1"
    },
    {
      "id": 2,
      "target_field": "field2",
      "action": "hide",
      "condition": "when_toggle_is",
      "value": "1"
    }
  ],
  "logic_operator": "AND"
}
```

**Result**: When the toggle is enabled, `field1` will be shown AND `field2` will be hidden.

### Complex Field Dependencies

```json
{
  "conditional_logic": [
    {
      "id": 1,
      "target_field": "dependent_field",
      "action": "enable",
      "condition": "when_field_equals",
      "value": "required_value"
    }
  ],
  "logic_operator": "AND"
}
```

**Result**: When another field equals "required_value", the `dependent_field` will be enabled.

## Technical Implementation

### Frontend Components

- **ToggleField.jsx**: React component for the toggle field with conditional logic configuration
- **conditionalLogic.js**: JavaScript handler that executes conditional logic rules
- **MetaboxApp.jsx**: Main metabox application that includes the conditional logic handler

### Data Flow

1. User configures conditional logic rules in the ToggleField component
2. Rules are saved to the field configuration
3. Rules are applied to the DOM via data attributes
4. The conditional logic handler monitors toggle changes
5. When a toggle changes, all applicable rules are evaluated
6. Actions are applied to target fields based on rule evaluation

### DOM Structure

Toggle fields include data attributes for the conditional logic handler:

```html
<div class="ccc-field ccc-field-toggle" 
     data-conditional-logic='[{"id":1,"target_field":"field1","action":"show","condition":"when_toggle_is","value":"1"}]'
     data-toggle-field-id="toggle_field_1">
  <!-- Toggle field content -->
</div>
```

## Testing

Use the `test-conditional-logic.html` file to test the conditional logic functionality:

1. Open the test file in a web browser
2. Toggle the switches to see fields show/hide/enable/disable
3. Check the browser console for execution logs
4. Verify that the logic works as expected

## Troubleshooting

### Common Issues

1. **Fields not updating**: Check that the conditional logic handler is loaded
2. **Rules not saving**: Verify that the field configuration is being updated
3. **Target fields not found**: Ensure target field names match exactly

### Debug Information

The conditional logic handler provides debug information in the browser console:

```javascript
// Check if handler is available
console.log(window.cccConditionalLogic);

// View current rules
console.log(window.cccConditionalLogic.getAllRules());

// Check field states
console.log(window.cccConditionalLogic.fieldStates);
```

## Best Practices

1. **Use descriptive field names** for easier rule configuration
2. **Test rules thoroughly** before deploying to production
3. **Keep rules simple** - complex logic can be hard to maintain
4. **Document your rules** for future reference
5. **Use consistent naming conventions** for fields and rules

## Future Enhancements

Planned improvements include:

- **Nested Conditions**: Support for more complex logical expressions
- **Field Groups**: Apply actions to multiple fields at once
- **Conditional Validation**: Show validation errors based on field states
- **Visual Rule Builder**: Drag-and-drop interface for creating rules
- **Rule Templates**: Pre-built rule sets for common scenarios
