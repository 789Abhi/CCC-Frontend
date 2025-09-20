import React, { useState, useEffect, useRef, useCallback } from 'react';
import TextField from '../fields/Textfield';
import useConditionalLogic from '../hooks/useConditionalLogic';

import logo from '/drag-drop-icon.svg';
import TextareaField from '../fields/TextareaField';
import ImageField from '../fields/ImageField';
import VideoField from '../fields/VideoField';
import OembedField from '../fields/OembedField';
import RelationshipField from '../fields/RelationshipField';
import GalleryField from '../fields/GalleryField';
import WysiwygField from '../fields/WysiwygField';
import SelectField from '../fields/SelectField';
import CheckboxField from '../fields/CheckboxField';
import RadioField from '../fields/RadioField';
import ColorField from '../fields/ColorField';
import LinkField from '../fields/LinkField';
import EmailField from '../fields/EmailField';
import NumberField from '../fields/NumberField';
import PasswordField from '../fields/PasswordField';
import RangeField from '../fields/RangeField';
import FileField from '../fields/FileField';
import RepeaterField from '../fields/RepeaterField';
import UserField from '../fields/UserField';
import ToggleField from '../fields/ToggleField';
import DateField from '../fields/DateField';

const ToggleSwitch = ({ checked, onChange, disabled = false }) => {
  return (
    <button
      type="button"
      className={`relative inline-flex h-6 w-12 items-center rounded-full transition-colors duration-200 focus:outline-none border-2 ${
        disabled 
          ? 'border-gray-300 bg-gray-200 cursor-not-allowed opacity-50' 
          : checked 
            ? 'border-pink-400 bg-green-400' 
            : 'border-pink-400 bg-gray-200'
      }`}
      onClick={disabled ? undefined : onChange}
      aria-pressed={checked}
      disabled={disabled}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-200 ${checked ? 'translate-x-6' : 'translate-x-1'}`}
      />
    </button>
  );
}

const DotMenu = ({ onDelete }) => {
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

const ComponentItem = React.memo(({ component, index, isReadOnly = false, totalComponents, onRemove, onToggleHide, onFieldChange, onValidationChange, fieldValues, listeners, attributes, setNodeRef, style, isExpanded, onToggleExpand, availableComponents, postId }) => {
  const [fields, setFields] = useState([]);
  const [loadingFields, setLoadingFields] = useState(false);

  // Get current field values for this component instance
  const instanceFieldValues = fieldValues?.[component.instance_id] || {};

  // Get all available fields from all components for conditional logic
  const getAllAvailableFields = () => {
    const allFields = [];
    
    // Get fields from the current component
    if (fields && Array.isArray(fields)) {
      allFields.push(...fields);
    }
    
    // Get fields from other components if availableComponents is passed
    if (availableComponents && Array.isArray(availableComponents)) {
      availableComponents.forEach(comp => {
        if (comp.id !== component.id && comp.fields && Array.isArray(comp.fields)) {
          allFields.push(...comp.fields);
        }
      });
    }
    
    return allFields;
  };

  // Use conditional logic hook for React-based field visibility
  const { shouldRenderField } = useConditionalLogic(fields, instanceFieldValues, getAllAvailableFields());

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
          nonce: window.getNonce ? window.getNonce() : (window.cccData?.nonce || ''),
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
                     // Fields loaded successfully
          setFields(fieldArr);
        })
        .catch((error) => {
          console.error('CCC: Error loading fields:', error);
          setFields([]);
        })
        .finally(() => setLoadingFields(false));
    }
  }, [isExpanded, component.id, component.instance_id, postId, fieldValues]);

  // Debug fieldValues changes - only log significant changes
  useEffect(() => {
    // Only log when fieldValues actually change, not on every render
    // Removed excessive logging to prevent console spam
  }, [fieldValues, component.instance_id]);

  const handleFieldChange = useCallback((fieldName, value) => {
    if (onFieldChange) {
      onFieldChange(component.instance_id, fieldName, value);
    }
  }, [onFieldChange, component.instance_id]);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex flex-col border-2 rounded-lg mb-4 transition-all duration-200 ${
        component.isDeleted 
          ? 'border-red-500 bg-red-50' 
          : 'border-pink-400 bg-gray-100'
      } ${component.isPendingDelete ? 'opacity-50 bg-red-50' : ''} ${component.isHidden ? 'opacity-50' : 'opacity-100'}`}
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
          <div className="font-semibold text-gray-800 text-lg flex items-center gap-2">
            {component.name}
            {component.isDeleted && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                Deleted
              </span>
            )}
          </div>
          <div className="text-xs text-gray-500">@{component.handle_name}</div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0" style={{ opacity: 1 }}>
          <ToggleSwitch 
            checked={!component.isHidden} 
            onChange={e => { e.stopPropagation(); onToggleHide(); }} 
            disabled={component.isDeleted}
          />
          <DotMenu onDelete={onRemove} />
        </div>
      </div>
      {isExpanded && (
        <div className="px-8 pb-4 pt-2 bg-gray-50 border-t border-pink-100 text-sm text-gray-700 animate-fade-in">
          {component.isDeleted ? (
            <div className="text-center py-4 text-red-600 bg-red-50 rounded-lg border border-red-200">
              <p className="font-medium">This component has been deleted from the plugin.</p>
              <p className="text-sm text-red-500 mt-1">Fields are no longer available. You can remove this component or restore it from the plugin.</p>
            </div>
          ) : loadingFields ? (
            <div className="text-center text-gray-400 italic">Loading fields...</div>
          ) : fields.length === 0 ? (
            <div className="text-center text-gray-400 italic">No fields for this component</div>
          ) : (
            <div>
              {/* Conditional field rendering using React hook */}
              {(() => {

                return fields
                  .filter(field => shouldRenderField(field.id)) // Only render visible fields
                  .map(field => {
                if (field.type === 'text') {
                  const isRequired = field.required || false;
                  const instanceFieldValues = fieldValues?.[component.instance_id] || {};
                  const value = instanceFieldValues[field.id] !== undefined
                    ? instanceFieldValues[field.id]
                    : (field.value !== undefined && field.value !== null ? field.value : (field.default_value || ''));
                  
                                     // Debug logging removed to prevent console spam
                  
                                     const handleChange = val => {
                     if (onFieldChange) {
                       onFieldChange(component.instance_id, field.id, val);
                     }
                   };
                  
                  return (
                    <div key={field.id} className="mb-4">
                      <TextField
                        label={field.label}
                        value={value}
                        onChange={handleChange}
                        placeholder={field.placeholder}
                        required={isRequired}
                        error={isRequired && !value?.trim()}
                        fieldId={field.id}
                      />
                    </div>
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
                    <div key={field.id} className="mb-4">
                      <TextareaField
                        label={field.label}
                        value={value}
                        onChange={handleChange}
                        placeholder={placeholder}
                        required={isRequired}
                        error={isRequired && !value?.trim()}
                        fieldId={field.id}
                      />
                    </div>
                  );
                }
                if (field.type === 'email') {
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
                    <EmailField
                      key={field.id}
                      label={field.label}
                      fieldName={field.name}
                      fieldConfig={{
                        ...field.config,
                        field_id: field.id,
                        post_id: postId,
                        instance_id: component.instance_id
                      }}
                      fieldValue={value}
                      fieldRequired={isRequired}
                      onChange={handleChange}
                      fieldId={field.id}
                    />
                  );
                }
                if (field.type === 'password') {
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
                    <PasswordField
                      key={field.id}
                      label={field.label}
                      fieldName={field.name}
                      fieldConfig={{
                        ...field.config,
                        field_id: field.id,
                        post_id: postId,
                        instance_id: component.instance_id
                      }}
                      fieldValue={value}
                      fieldRequired={isRequired}
                      onChange={handleChange}
                      fieldId={field.id}
                    />
                  );
                }
                if (field.type === 'user') {
                  const isRequired = field.required || false;
                  const instanceFieldValues = fieldValues?.[component.instance_id] || {};
                  const value = instanceFieldValues[field.id] !== undefined
                    ? instanceFieldValues[field.id]
                    : (field.value !== undefined && field.value !== null ? field.value : (field.default_value || ''));
                  const handleChange = val => {
                    if (onFieldChange) onFieldChange(component.instance_id, field.id, val);
                  };
                  return (
                    <UserField
                      key={field.id}
                      label={field.label}
                      fieldName={field.name}
                      fieldConfig={{
                        ...field.config,
                        field_id: field.id,
                        post_id: postId,
                        instance_id: component.instance_id
                      }}
                      fieldValue={value}
                      fieldRequired={isRequired}
                      onChange={handleChange}
                      fieldId={field.id}
                    />
                  );
                }
                if (field.type === 'number') {
                  const isRequired = field.required || false;
                  const instanceFieldValues = fieldValues?.[component.instance_id] || {};
                  const value = instanceFieldValues[field.id] !== undefined
                    ? instanceFieldValues[field.id]
                    : (field.value !== undefined && field.value !== null ? field.value : (field.default_value || ''));
                  const handleChange = val => {
                    if (onFieldChange) onFieldChange(component.instance_id, field.id, val);
                  };
                  const handleValidationChange = (fieldName, hasErrors) => {
                    // Notify parent about validation state
                    if (onValidationChange) {
                      onValidationChange(component.instance_id, field.id, hasErrors);
                    }
                  };
                  return (
                    <NumberField
                      key={field.id}
                      label={field.label}
                      fieldName={field.name}
                      fieldConfig={{
                        ...field.config,
                        field_id: field.id,
                        post_id: postId,
                        instance_id: component.instance_id
                      }}
                      fieldValue={value}
                      fieldRequired={isRequired}
                      onChange={handleChange}
                      onValidationChange={handleValidationChange}
                      fieldId={field.id}
                    />
                  );
                }
                if (field.type === 'range') {
                  const isRequired = field.required || false;
                  const instanceFieldValues = fieldValues?.[component.instance_id] || {};
                  const value = instanceFieldValues[field.id] !== undefined
                    ? instanceFieldValues[field.id]
                    : (field.value !== undefined && field.value !== null ? field.value : (field.default_value || ''));
                  const handleChange = val => {
                    if (onFieldChange) onFieldChange(component.instance_id, field.id, val);
                  };
                  return (
                    <RangeField
                      key={field.id}
                      label={field.label}
                      fieldName={field.name}
                      fieldConfig={{
                        ...field.config,
                        field_id: field.id,
                        post_id: postId,
                        instance_id: component.instance_id
                      }}
                      fieldValue={value}
                      fieldRequired={isRequired}
                      onChange={handleChange}
                      fieldId={field.id}
                    />
                  );
                }
                if (field.type === 'file') {
                  const isRequired = field.required || false;
                  const instanceFieldValues = fieldValues?.[component.instance_id] || {};
                  const value = instanceFieldValues[field.id] !== undefined
                    ? instanceFieldValues[field.id]
                    : (field.value !== undefined && field.value !== null ? field.value : (field.default_value || ''));
                  const handleChange = val => {
                    if (onFieldChange) onFieldChange(component.instance_id, field.id, val);
                  };
                  return (
                    <FileField
                      key={field.id}
                      label={field.label}
                      fieldName={field.name}
                      fieldConfig={{
                        ...field.config,
                        field_id: field.id,
                        post_id: postId,
                        instance_id: component.instance_id
                      }}
                      fieldValue={value}
                      fieldRequired={isRequired}
                      onChange={handleChange}
                      fieldId={field.id}
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
                      fieldId={field.id}
                    />
                  );
                }
                if (field.type === 'video') {
                  const isRequired = field.required || false;
                  const instanceFieldValues = fieldValues?.[component.instance_id] || {};
                  const value = instanceFieldValues[field.id] !== undefined
                    ? instanceFieldValues[field.id]
                    : (field.value !== undefined && field.value !== null ? field.value : (field.default_value || ''));
                  const handleChange = val => {
                    if (onFieldChange) onFieldChange(component.instance_id, field.id, val);
                  };
                  return (
                    <VideoField
                      key={field.id}
                      label={field.label}
                      value={value}
                      onChange={handleChange}
                      required={isRequired}
                      error={isRequired && !value}
                      config={field.config || {}}
                      fieldId={field.id}
                    />
                  );
                }
                                   if (field.type === 'oembed') {
                   const isRequired = field.required || false;
                   const instanceFieldValues = fieldValues?.[component.instance_id] || {};
                   const value = instanceFieldValues[field.id] !== undefined
                     ? instanceFieldValues[field.id]
                     : (field.value !== undefined && field.value !== null ? field.value : (field.default_value || ''));
                   const handleChange = val => {
                     if (onFieldChange) onFieldChange(component.instance_id, field.id, val);
                   };
                   return (
                     <OembedField
                       key={field.id}
                       field={field}
                       value={value}
                       onChange={handleChange}
                       isSubmitting={false}
                       fieldConfig={{
                         field_id: field.id,
                         post_id: postId,
                         instance_id: component.instance_id
                       }}
                       fieldId={field.id}
                     />
                   );
                 }
                 if (field.type === 'wysiwyg') {
                  const isRequired = field.required || false;
                  const instanceFieldValues = fieldValues?.[component.instance_id] || {};
                  const value = instanceFieldValues[field.id] !== undefined
                    ? instanceFieldValues[field.id]
                    : (field.value !== undefined && field.value !== null ? field.value : (field.default_value || ''));
                  const handleChange = val => {
                    if (onFieldChange) onFieldChange(component.instance_id, field.id, val);
                  };
                  return (
                    <WysiwygField
                      key={field.id}
                      label={field.label}
                      value={value}
                      onChange={handleChange}
                      required={isRequired}
                      error={isRequired && !value}
                      editorId={`wysiwyg_${component.instance_id}_${field.id}`}
                      fieldId={field.id}
                    />
                  );
                }
                if (field.type === 'select') {
                  const isRequired = field.required || false;
                  const instanceFieldValues = fieldValues?.[component.instance_id] || {};
                  const multiple = field.config && field.config.multiple;
                  let value = instanceFieldValues[field.id] !== undefined
                    ? instanceFieldValues[field.id]
                    : (field.value !== undefined && field.value !== null ? field.value : (field.default_value || (multiple ? [] : '')));
                  // Always coerce to unique array for multiple select
                  if (multiple) {
                    if (typeof value === 'string') {
                      value = value ? [value] : [];
                    }
                    if (Array.isArray(value)) {
                      value = Array.from(new Set(value));
                    }
                  }
                  let optionsRaw = field.options || (field.config && field.config.options) || [];
                  let options = [];
                  if (Array.isArray(optionsRaw)) {
                    options = optionsRaw.map(opt => typeof opt === 'string' ? { label: opt, value: opt } : opt);
                  } else if (optionsRaw && typeof optionsRaw === 'object') {
                    options = Object.entries(optionsRaw).map(([value, label]) => ({ label, value }));
                  } else {
                    options = [];
                  }
                  const handleChange = val => {
                    // Always save unique array for multiple
                    if (multiple && Array.isArray(val)) {
                      onFieldChange(component.instance_id, field.id, Array.from(new Set(val)));
                    } else {
                      onFieldChange(component.instance_id, field.id, val);
                    }
                  };
                  return (
                    <SelectField
                      key={field.id}
                      label={field.label}
                      value={value}
                      onChange={handleChange}
                      options={options}
                      multiple={multiple}
                      required={isRequired}
                      error={isRequired && (multiple ? !value?.length : !value)}
                      fieldId={field.id}
                    />
                  );
                }
                if (field.type === 'checkbox') {
                  const isRequired = field.required || false;
                  const instanceFieldValues = fieldValues?.[component.instance_id] || {};
                  let value = instanceFieldValues[field.id] !== undefined
                    ? instanceFieldValues[field.id]
                    : (field.value !== undefined && field.value !== null ? field.value : (field.default_value || []));
                  // Always ensure value is an array for checkboxes
                  if (typeof value === 'string') {
                    value = value ? [value] : [];
                  }
                  if (Array.isArray(value)) {
                    value = Array.from(new Set(value));
                  } else {
                    value = [];
                  }
                  let optionsRaw = field.options || (field.config && field.config.options) || [];
                  let options = [];
                  if (Array.isArray(optionsRaw)) {
                    options = optionsRaw.map(opt => typeof opt === 'string' ? { label: opt, value: opt } : opt);
                  } else if (optionsRaw && typeof optionsRaw === 'object') {
                    options = Object.entries(optionsRaw).map(([value, label]) => ({ label, value }));
                  } else {
                    options = [];
                  }
                  const handleChange = val => {
                    // Always save unique array for checkboxes
                    if (Array.isArray(val)) {
                      onFieldChange(component.instance_id, field.id, Array.from(new Set(val)));
                    } else {
                      onFieldChange(component.instance_id, field.id, []);
                    }
                  };
                  return (
                    <CheckboxField
                      key={field.id}
                      label={field.label}
                      value={value}
                      onChange={handleChange}
                      options={options}
                      required={isRequired}
                      error={isRequired && !value?.length}
                      fieldId={field.id}
                    />
                  );
                }
                                 if (field.type === 'radio') {
                   const isRequired = field.required || false;
                   const instanceFieldValues = fieldValues?.[component.instance_id] || {};
                   let value = instanceFieldValues[field.id] !== undefined
                     ? instanceFieldValues[field.id]
                     : (field.value !== undefined && field.value !== null ? field.value : (field.default_value || ''));
                   // Radio fields are always single selection
                   if (Array.isArray(value)) {
                     value = value[0] || '';
                   }
                   let optionsRaw = field.options || (field.config && field.config.options) || [];
                   let options = [];
                   if (Array.isArray(optionsRaw)) {
                     options = optionsRaw.map(opt => typeof opt === 'string' ? { label: opt, value: opt } : opt);
                   } else if (optionsRaw && typeof optionsRaw === 'object') {
                     options = Object.entries(optionsRaw).map(([value, label]) => ({ label, value }));
                   } else {
                     options = [];
                   }
                   const handleChange = val => {
                     // Radio fields save single value
                     onFieldChange(component.instance_id, field.id, val);
                   };
                   return (
                     <RadioField
                       key={field.id}
                       label={field.label}
                       value={value}
                       onChange={handleChange}
                       options={options}
                       required={isRequired}
                       error={isRequired && !value}
                       fieldId={field.id}
                     />
                   );
                 }
                 if (field.type === 'relationship') {
                   const isRequired = field.required || false;
                   const instanceFieldValues = fieldValues?.[component.instance_id] || {};
                   const value = instanceFieldValues[field.id] !== undefined
                     ? instanceFieldValues[field.id]
                     : (field.value !== undefined && field.value !== null ? field.value : (field.default_value || ''));
                   const handleChange = val => {
                     if (onFieldChange) onFieldChange(component.instance_id, field.id, val);
                   };
                   return (
                     <RelationshipField
                       key={field.id}
                       label={field.label}
                       fieldName={field.name}
                       fieldConfig={{
                         ...field.config,
                         field_id: field.id,
                         post_id: postId,
                         instance_id: component.instance_id
                       }}
                       fieldValue={value}
                       fieldRequired={isRequired}
                       onChange={handleChange}
                       fieldId={field.id}
                     />
                   );
                 }
                 if (field.type === 'gallery') {
                   const isRequired = field.required || false;
                   const instanceFieldValues = fieldValues?.[component.instance_id] || {};
                   let value = instanceFieldValues[field.id] !== undefined
                     ? instanceFieldValues[field.id]
                     : (field.value !== undefined && field.value !== null ? field.value : (field.default_value || []));
                   
                   // Parse gallery value if it's a JSON string
                   if (typeof value === 'string' && value) {
                     try {
                       const parsed = JSON.parse(value);
                       value = Array.isArray(parsed) ? parsed : [];
                     } catch (e) {
                       value = [];
                     }
                   } else if (!Array.isArray(value)) {
                     value = [];
                   }
                   
                   const handleChange = val => {
                     if (onFieldChange) onFieldChange(component.instance_id, field.id, val);
                   };
                   return (
                     <GalleryField
                       key={field.id}
                       field={field}
                       value={value}
                       onChange={handleChange}
                       fieldConfig={{
                         ...field.config,
                         field_id: field.id,
                         post_id: postId,
                         instance_id: component.instance_id
                       }}
                       isRequired={isRequired}
                       fieldId={field.id}
                     />
                   );
                 }
                 if (field.type === 'link') {
                   const isRequired = field.required || false;
                   const instanceFieldValues = fieldValues?.[component.instance_id] || {};
                   const value = instanceFieldValues[field.id] !== undefined
                     ? instanceFieldValues[field.id]
                     : (field.value !== undefined && field.value !== null ? field.value : (field.default_value || ''));
                   const handleChange = val => {
                     if (onFieldChange) onFieldChange(component.instance_id, field.id, val);
                   };
                   return (
                     <LinkField
                       key={field.id}
                       field={field}
                       value={value}
                       onChange={handleChange}
                       isSubmitting={false}
                       fieldConfig={{
                         field_id: field.id,
                         post_id: postId,
                         instance_id: component.instance_id
                       }}
                       fieldId={field.id}
                     />
                   );
                 }
                if (field.type === 'color') {
                  const isRequired = field.required || false;
                  const instanceFieldValues = fieldValues?.[component.instance_id] || {};
                  let value = instanceFieldValues[field.id] !== undefined
                    ? instanceFieldValues[field.id]
                    : (field.value !== undefined && field.value !== null ? field.value : (field.default_value || ''));
                  // Color fields are always single hex value
                  if (Array.isArray(value)) {
                    value = value[0] || '';
                  }
                  
                  // Handle enhanced color data structure
                  let colorData = { main: '', adjusted: '', hover: '' };
                  if (typeof value === 'string' && value.startsWith('{') && value.endsWith('}')) {
                    try {
                      const parsed = JSON.parse(value);
                      // Check for double-encoded JSON
                      if (parsed.main && typeof parsed.main === 'string' && parsed.main.startsWith('{')) {
                        try {
                          const nestedParsed = JSON.parse(parsed.main);
                          colorData = {
                            main: nestedParsed.main || '',
                            adjusted: nestedParsed.adjusted || nestedParsed.main || '',
                            hover: parsed.hover || ''
                          };
                        } catch (e) {
                          colorData = {
                            main: parsed.main,
                            adjusted: parsed.adjusted || parsed.main,
                            hover: parsed.hover || ''
                          };
                        }
                      } else {
                        colorData = {
                          main: parsed.main || '',
                          adjusted: parsed.adjusted || parsed.main || '',
                          hover: parsed.hover || ''
                        };
                      }
                    } catch (e) {
                      colorData = { main: value, adjusted: value, hover: '' };
                    }
                  } else if (typeof value === 'string' && value !== '') {
                    colorData = { main: value, adjusted: value, hover: '' };
                  }
                  
                  const handleChange = (colorDataString) => {
                    // Save the complete color data structure
                    onFieldChange(component.instance_id, field.id, colorDataString);
                  };
                  
                  return (
                    <ColorField
                      key={field.id}
                      label={field.label}
                      value={JSON.stringify(colorData)}
                      onChange={handleChange}
                      required={isRequired}
                      error={isRequired && !colorData.main}
                      fieldId={field.id}
                    />
                  );
                }
                if (field.type === 'repeater') {
                  const isRequired = field.required || false;
                  const instanceFieldValues = fieldValues?.[component.instance_id] || {};
                  let value = instanceFieldValues[field.id] !== undefined
                    ? instanceFieldValues[field.id]
                    : (field.value !== undefined && field.value !== null ? field.value : '[]');
                  
                  // Parse repeater value
                  let repeaterValue = [];
                  if (typeof value === 'string' && value) {
                    try {
                      const parsed = JSON.parse(value);
                      repeaterValue = Array.isArray(parsed) ? parsed : [];
                    } catch (e) {
                      repeaterValue = [];
                    }
                  } else if (Array.isArray(value)) {
                    repeaterValue = value;
                  }
                  
                  const handleChange = (repeaterDataString) => {
                    onFieldChange(component.instance_id, field.id, repeaterDataString);
                  };
                  
                  return (
                    <RepeaterField
                      key={field.id}
                      label={field.label}
                      value={repeaterValue}
                      onChange={handleChange}
                      required={isRequired}
                      error={isRequired && (!repeaterValue || repeaterValue.length === 0)}
                      config={field.config || {}}
                      fieldId={field.id}
                      instanceId={component.instance_id}
                      children={field.children || []}
                      mainComponentFields={getAllAvailableFields()}
                      mainComponentFieldValues={instanceFieldValues}
                    />
                  );
                }
                                 if (field.type === 'user') {
                   const isRequired = field.required || false;
                   const instanceFieldValues = fieldValues?.[component.instance_id] || {};
                   const multiple = field.config && field.config.multiple;
                   let value = instanceFieldValues[field.id] !== undefined
                     ? instanceFieldValues[field.id]
                     : (field.value !== undefined && field.value !== null ? field.value : (field.default_value || (multiple ? [] : '')));
                   
                   // Handle multiple user selection
                   if (multiple && typeof value === 'string' && value) {
                     value = value.split(',').map(id => id.trim()).filter(id => id);
                   }
                  
                  const handleChange = val => {
                    if (onFieldChange) onFieldChange(component.instance_id, field.id, val);
                  };
                  
                  return (
                                         <UserField
                       key={field.id}
                       label={field.label}
                       value={value}
                       onChange={handleChange}
                       multiple={multiple}
                       required={isRequired}
                       error={isRequired && (multiple ? !value?.length : !value)}
                       roleFilter={field.config?.role_filter || []}
                       returnType={field.config?.return_type || 'id'}
                       fieldId={field.id}
                     />
                  );
                }
                if (field.type === 'toggle') {
                  const isRequired = field.required || false;
                  const instanceFieldValues = fieldValues?.[component.instance_id] || {};
                  let value = instanceFieldValues[field.id] !== undefined
                    ? instanceFieldValues[field.id]
                    : (field.value !== undefined && field.value !== null ? field.value : (field.config?.default_value || false));
                  
                  const handleChange = (val) => {
                    if (onFieldChange) onFieldChange(component.instance_id, field.id, val);
                  };
                  
                  // Get all available fields from all components for conditional logic
                  const getAllAvailableFields = () => {
                    const allFields = [];
                    
                    // Get fields from the current component
                    if (component.fields && Array.isArray(component.fields)) {
                      allFields.push(...component.fields);
                    }
                    
                    // Get fields from other components if availableComponents is passed
                    if (availableComponents && Array.isArray(availableComponents)) {
                      availableComponents.forEach(comp => {
                        if (comp.id !== component.id && comp.fields && Array.isArray(comp.fields)) {
                          allFields.push(...comp.fields);
                        }
                      });
                    }
                    
                    return allFields;
                  };
                  
                  return (
                    <ToggleField
                      key={field.id}
                      field={field}
                      value={value}
                      onChange={handleChange}
                      onValidationChange={onValidationChange}
                      instanceId={component.instance_id}
                      fieldId={field.id}
                      availableFields={getAllAvailableFields()}
                    />
                  );
                }
                if (field.type === 'date') {
                  const isRequired = field.required || false;
                  const instanceFieldValues = fieldValues?.[component.instance_id] || {};
                  const value = instanceFieldValues[field.id] !== undefined
                    ? instanceFieldValues[field.id]
                    : (field.value !== undefined && field.value !== null ? field.value : '');
                  
                  const handleChange = (val) => {
                    console.log('CCC ComponentItem: DateField handleChange called with val:', val);
                    console.log('CCC ComponentItem: instance_id:', component.instance_id, 'field.id:', field.id);
                    if (onFieldChange) {
                      console.log('CCC ComponentItem: calling onFieldChange');
                      onFieldChange(component.instance_id, field.id, val);
                    }
                  };
                  
                  return (
                    <DateField
                      key={field.id}
                      field={field}
                      value={value}
                      onChange={handleChange}
                      fieldConfig={field.config || {}}
                      isRequired={isRequired}
                      placeholder={field.placeholder || ''}
                      fieldId={field.id}
                    />
                  );
                }
                // Add more field types here as needed
                return null;
                });
              })()}
            </div>
          )}
        </div>
      )}
    </div>
  );
});

ComponentItem.displayName = 'ComponentItem';

export default ComponentItem;