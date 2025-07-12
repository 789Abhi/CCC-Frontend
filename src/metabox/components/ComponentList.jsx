import React from 'react';
import ComponentItem from './ComponentItem';

function ComponentList({ components, isReadOnly = false }) {
  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
        <h3 className="text-lg font-semibold text-gray-800">Custom Components</h3>
        {isReadOnly && (
          <div className="text-sm text-gray-500 italic">
            Manage components from the main plugin interface
          </div>
        )}
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
            <p className="font-medium text-gray-700 mb-1">No components assigned</p>
            <p className="text-sm text-gray-400">Components can be assigned from the main plugin interface</p>
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
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ComponentList; 