import React, { useState, useEffect, useRef } from 'react';
import TextField from '../fields/Textfield';

import logo from '/drag-drop-icon.svg';
import TextareaField from '../fields/TextareaField';
import ImageField from '../fields/ImageField';

function ToggleSwitch({ checked, onChange }) {
  return (
    <button
      type="button"
      className={`relative inline-flex h-6 w-12 items-center rounded-full transition-colors duration-200 focus:outline-none border-2 border-pink-400 ${checked ? 'bg-green-400' : 'bg-gray-200'}`}
      onClick={onChange}
      aria-pressed={checked}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-200 ${checked ? 'translate-x-6' : 'translate-x-1'}`}
      />
    </button>
  );
}

function DotMenu({ onDelete }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef();
  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);
  return (
    <div className="relative" ref={menuRef}>
      <button
        className="ccc-action-btn p-1 rounded hover:bg-gray-200 text-gray-500 focus:outline-none"
        onClick={e => { e.stopPropagation(); setOpen(o => !o); }}
        type="button"
        aria-label="More actions"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <circle cx="5" cy="12" r="2" />
          <circle cx="12" cy="12" r="2" />
          <circle cx="19" cy="12" r="2" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-32 bg-white border border-pink-200 rounded shadow-lg z-30 animate-fade-in">
          <button
            className="w-full text-left px-4 py-2 text-red-600 hover:bg-pink-50 font-semibold"
            onClick={e => { e.stopPropagation(); setOpen(false); onDelete(); }}
            type="button"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

function ComponentItem({ component, index, isReadOnly = false, totalComponents, onRemove, onToggleHide, onFieldChange, fieldValues, listeners, attributes, setNodeRef, style, isExpanded, onToggleExpand, availableComponents, postId }) {
  const [fields, setFields] = useState([]);
  const [loadingFields, setLoadingFields] = useState(false);

  // Find required info for fields
  const compDef = availableComponents?.find(c => c.id === component.id);

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
          post_id: postId,
          instance_id: component.instance_id
        })
      })
        .then(res => res.json())
        .then(data => {
          let fieldArr = [];
          if (Array.isArray(data.fields)) {
            fieldArr = data.fields;
          } else if (data.fields && Array.isArray(data.fields.fields)) {
            fieldArr = data.fields.fields;
          } else if (Array.isArray(data.data)) {
            fieldArr = data.data;
          } else if (data.data && Array.isArray(data.data.fields)) {
            fieldArr = data.data.fields;
          }
          console.log('CCC: Fields loaded for component', component.name, fieldArr);
          setFields(fieldArr);
        })
        .catch(() => setFields([]))
        .finally(() => setLoadingFields(false));
    }
  }, [isExpanded, component.id, component.instance_id, postId]);

  const handleFieldChange = (fieldName, value) => {
    if (onFieldChange) {
      onFieldChange(component.instance_id, fieldName, value);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex flex-col border-2 border-pink-400 rounded-lg mb-4 bg-gray-100 transition-all duration-200 ${component.isPendingDelete ? 'opacity-50 bg-red-50' : ''} ${component.isHidden ? 'opacity-50' : 'opacity-100'}`}
    >
      <div className="flex items-center px-4 py-3" onClick={e => {
        if (!e.target.closest('.ccc-drag-handle') && !e.target.closest('.ccc-action-btn') && !e.target.closest('.ccc-dot-menu')) {
          onToggleExpand(component.instance_id);
        }
      }}>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            className="p-1 rounded hover:bg-gray-200 text-gray-500 focus:outline-none"
            onClick={e => { e.stopPropagation(); onToggleExpand(component.instance_id); }}
            tabIndex={0}
            aria-label={isExpanded ? 'Collapse' : 'Expand'}
            type="button"
          >
            {isExpanded ? (
              <svg className="w-6 h-6" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 8 10 12 14 8" /></svg>
            ) : (
              <svg className="w-6 h-6" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="8 6 12 10 8 14" /></svg>
            )}
          </button>
          <div {...attributes} {...listeners} className="ccc-drag-handle cursor-grab active:cursor-grabbing p-1 rounded focus:outline-none focus:ring-2 focus:ring-pink-400" style={{ background: '#fff' }}>
            <img className='w-6 h-6 object-contain' src={logo} alt="Drag" />
          </div>
        </div>
        <div className="flex-1 ml-4">
          <div className="font-semibold text-gray-800 text-lg">{component.name}</div>
          <div className="text-xs text-gray-500">@{component.handle_name}</div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0" style={{ opacity: 1 }}>
          <ToggleSwitch checked={!component.isHidden} onChange={e => { e.stopPropagation(); onToggleHide(); }} />
          <DotMenu onDelete={onRemove} />
        </div>
      </div>
      {isExpanded && (
        <div className="px-8 pb-4 pt-2 bg-gray-50 border-t border-pink-100 text-sm text-gray-700 animate-fade-in">
          {loadingFields ? (
            <div className="text-center text-gray-400 italic">Loading fields...</div>
          ) : fields.length === 0 ? (
            <div className="text-center text-gray-400 italic">No fields for this component</div>
          ) : (
            <div>
              {fields.map(field => {
                if (field.type === 'text') {
                  const isRequired = field.required || false;
                  const value = fieldValues?.[component.instance_id]?.[field.id] ?? field.value ?? '';
                  return (
                    <TextField
                      key={field.id}
                      label={field.label}
                      value={value}
                      onChange={val => handleFieldChange(field.id, val)}
                      placeholder={field.placeholder}
                      required={isRequired}
                      error={isRequired && !value.trim()}
                    />
                  );
                }
                if (field.type === 'textarea') {
                  const isRequired = field.required || false;
                  const instanceFieldValues = fieldValues?.[component.instance_id] || {};
                  const value = instanceFieldValues[field.id] !== undefined
                    ? instanceFieldValues[field.id]
                    : (field.value !== undefined && field.value !== null ? field.value : (field.default_value || ''));
                  const placeholder = field.placeholder || '';
                  const handleChange = val => {
                    if (onFieldChange) onFieldChange(component.instance_id, field.id, val);
                  };
                  return (
                    <TextareaField
                      key={field.id}
                      label={field.label}
                      value={value}
                      onChange={handleChange}
                      placeholder={placeholder}
                      required={isRequired}
                      error={isRequired && !value?.trim()}
                    />
                  );
                }
                if (field.type === 'image') {
                  const isRequired = field.required || false;
                  const instanceFieldValues = fieldValues?.[component.instance_id] || {};
                  const value = instanceFieldValues[field.id] !== undefined
                    ? instanceFieldValues[field.id]
                    : (field.value !== undefined && field.value !== null ? field.value : (field.default_value || ''));
                  const handleChange = val => {
                    if (onFieldChange) onFieldChange(component.instance_id, field.id, val);
                  };
                  return (
                    <ImageField
                      key={field.id}
                      label={field.label}
                      value={value}
                      onChange={handleChange}
                      required={isRequired}
                      error={isRequired && !value}
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