import React from 'react';
import ComponentItem from './ComponentItem';

function ComponentList({ components, isReadOnly = false, onAdd, onRemove, onToggleHide }) {
  return (
    <div>
      {/* Header with Add Button */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
        <h3 className="text-lg font-semibold text-gray-800">Custom Components</h3>
        <button 
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
          onClick={onAdd}
          type="button"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Add Component
        </button>
      </div>

      {/* Components List */}
      <div className="min-h-[80px]">
        {components.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center text-gray-500">
            <div className="w-12 h-12 text-gray-300 mb-3">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-full h-full">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                <polyline points="21,15 16,10 5,21"></polyline>
              </svg>
            </div>
            <p className="font-medium text-gray-700 mb-1">No components added yet</p>
            <p className="text-sm text-gray-400">Click "Add Component" to get started</p>
          </div>
        ) : (
          <div>
            {components.map((component, index) => (
              <ComponentItem
                key={component.instance_id}
                component={component}
                index={index}
                isReadOnly={isReadOnly}
                totalComponents={components.length}
                onRemove={() => onRemove(component.instance_id)}
                onToggleHide={() => onToggleHide(component.instance_id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ComponentList; 