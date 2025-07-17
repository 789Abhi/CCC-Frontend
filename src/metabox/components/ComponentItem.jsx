import React, { useState, useEffect } from 'react';
import TextField from '../fields/Textfield';

function ComponentItem({ component, index, isReadOnly = false, totalComponents, onRemove, onToggleHide, onFieldChange, fieldValues }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [fields, setFields] = useState([]);
  const [loadingFields, setLoadingFields] = useState(false);

  useEffect(() => {
    if (isExpanded && fields.length === 0 && component.id && component.instance_id) {
      setLoadingFields(true);
      fetch(cccData.ajaxUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          action: 'ccc_get_component_fields',
          nonce: cccData.nonce,
          component_id: component.id,
          post_id: cccData.postId,
          instance_id: component.instance_id
        })
      })
        .then(res => res.json())
        .then(data => {
          if (data.success && Array.isArray(data.data)) {
            setFields(data.data);
          } else {
            setFields([]);
          }
        })
        .catch(() => setFields([]))
        .finally(() => setLoadingFields(false));
    }
  }, [isExpanded, component.id, component.instance_id]);

  const handleFieldChange = (fieldName, value) => {
    if (onFieldChange) {
      onFieldChange(component.instance_id, fieldName, value);
    }
  };

  const toggleExpanded = () => setIsExpanded(!isExpanded);

  return (
    <div
      className={`border-b border-gray-100 transition bg-white ${component.isHidden ? 'opacity-50' : ''}`}
    >
      {/* Component Header */}
      <div className="flex items-center gap-3 px-6 py-5">
        {/* Component Info */}
        <div className="flex-1 min-w-0">
          <h4 className="text-base font-semibold text-gray-800 truncate">{component.name}</h4>
          <span className="text-xs text-gray-500 font-mono">@{component.handle_name}</span>
        </div>
        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Hide/Show Toggle */}
          <button
            className={`p-1 rounded hover:bg-gray-100 ${component.isHidden ? 'text-gray-400' : 'text-blue-600'}`}
            onClick={onToggleHide}
            type="button"
            title={component.isHidden ? 'Show component' : 'Hide component'}
          >
            {component.isHidden ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                <line x1="1" y1="1" x2="23" y2="23"></line>
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
            )}
          </button>
          {/* Delete Button */}
          <button
            className="p-1 rounded text-gray-400 hover:text-red-600 hover:bg-red-50"
            onClick={onRemove}
            type="button"
            title="Remove component"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
              <polyline points="3,6 5,6 21,6"></polyline>
              <path d="M19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"></path>
              <line x1="10" y1="11" x2="10" y2="17"></line>
              <line x1="14" y1="11" x2="14" y2="17"></line>
            </svg>
          </button>
          {/* Expand/Collapse Toggle - Always show */}
          <button
            className={`p-1 rounded hover:bg-gray-100 ${isExpanded ? 'text-blue-600' : 'text-gray-400'}`}
            onClick={toggleExpanded}
            type="button"
            title={isExpanded ? 'Collapse' : 'Expand'}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
              <polyline points="6,9 12,15 18,9"></polyline>
            </svg>
          </button>
        </div>
      </div>
      {/* Component Content (Expandable) */}
      {isExpanded && (
        <div className="border-t border-gray-100 bg-gray-50 px-6 py-5">
          {loadingFields ? (
            <div className="text-center text-gray-400 italic">Loading fields...</div>
          ) : fields.length === 0 ? (
            <div className="text-center text-gray-400 italic">No fields for this component</div>
          ) : (
            <div>
              {fields.map(field => {
                if (field.type === 'text') {
                  return (
                    <TextField
                      key={field.name}
                      label={field.label}
                      value={fieldValues?.[field.name] || ''}
                      onChange={val => handleFieldChange(field.name, val)}
                      placeholder={field.placeholder}
                    />
                  );
                }
                // Add more field types here as needed
                return null;
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ComponentItem; 