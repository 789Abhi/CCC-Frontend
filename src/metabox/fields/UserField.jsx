import React from 'react';

function UserField({ 
  label, 
  value, 
  onChange, 
  multiple = false, 
  required = false, 
  error,
  roleFilter = [],
  returnType = 'id'
}) {
  console.log('UserField: Component rendered with props:', { label, value, multiple, required, roleFilter, returnType });
  
  // For now, just show a simple message to test if the component renders
  return (
    <div className="mb-4">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="text-sm text-gray-500 p-2 bg-blue-100 rounded border border-blue-300">
        User Field Component Loaded Successfully!
        <br />
        Label: {label}
        <br />
        Value: {value || 'none'}
        <br />
        Multiple: {multiple ? 'Yes' : 'No'}
        <br />
        Required: {required ? 'Yes' : 'No'}
        <br />
        Role Filter: {roleFilter.join(', ') || 'none'}
        <br />
        Return Type: {returnType}
      </div>
      
      {error && <div className="text-xs text-red-500 mt-1">This field is required.</div>}
    </div>
  );
}

export default UserField; 