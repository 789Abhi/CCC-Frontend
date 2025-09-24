import React, { useState, useEffect, useRef, useCallback } from 'react';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, arrayMove, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import TextField from './Textfield';
import TextareaField from './TextareaField';
import ImageField from './ImageField';
import VideoField from './VideoField';
import WysiwygField from './WysiwygField';
import SelectField from './SelectField';
import CheckboxField from './CheckboxField';
import RadioField from './RadioField';
import ColorField from './ColorField';
import ToggleField from './ToggleField';
import OembedField from './OembedField';
import LinkField from './LinkField';
import EmailField from './EmailField';
import NumberField from './NumberField';
import PasswordField from './PasswordField';
import RangeField from './RangeField';
import RelationshipField from './RelationshipField';
import GalleryField from './GalleryField';
import UniversalFieldWrapper from './UniversalFieldWrapper';
import useConditionalLogic from '../hooks/useConditionalLogic';

// Sortable Repeater Item Component
const SortableRepeaterItem = ({ item, index, nestedFields, onUpdateItem, onRemoveItem, onToggleHidden, instanceId, fieldId, mainComponentFields = [], mainComponentFieldValues = {} }) => {
  const [isExpanded, setIsExpanded] = useState(true); // Default expanded
  const [isHidden, setIsHidden] = useState(item._hidden || false); // Get hidden state from item
  const [isDropdownOpen, setIsDropdownOpen] = useState(false); // Dropdown menu state
  
  // Transform item data from field names to field IDs for conditional logic
  const itemValuesByFieldId = {};
  nestedFields.forEach(field => {
    if (field.name && item[field.name] !== undefined) {
      itemValuesByFieldId[field.id] = item[field.name];
    }
  });
  
  // Fix field ID references in conditional logic to match current field IDs
  const fieldsWithFixedConditionalLogic = nestedFields.map(field => {
    if (field.config && field.config.conditional_logic && Array.isArray(field.config.conditional_logic)) {
      const fixedConditionalLogic = field.config.conditional_logic.map(rule => {
        // Find the target field by checking if any field references the old ID
        let targetField = nestedFields.find(f => f.id === rule.target_field);
        
        // If not found by ID, try to find by name (more reliable for nested fields)
        if (!targetField) {
          targetField = nestedFields.find(f => f.name === rule.target_field);
        }
        
        // If still not found, try to find by logical inference
        if (!targetField) {
          // For toggle-based conditional logic, look for toggle fields
          if (rule.condition === 'when_toggle_is') {
            targetField = nestedFields.find(f => f.type === 'toggle' && f.name !== field.name);
          }
          
          // If still not found, try to find by matching field type and position
          // For simple cases like toggle->image, assume the target is the other field
          if (!targetField) {
            const otherFields = nestedFields.filter(f => f.name !== field.name);
            if (otherFields.length === 1) {
              targetField = otherFields[0];
            }
          }
        }
        
        // Update the target_field to use the stable field name if available, otherwise use the ID
        if (targetField) {
          const newTargetField = targetField.name || targetField.id;
          if (newTargetField !== rule.target_field) {
            return {
              ...rule,
              target_field: newTargetField
            };
          }
        }
        return rule;
      });
      
      return {
        ...field,
        config: {
          ...field.config,
          conditional_logic: fixedConditionalLogic
        }
      };
    }
    return field;
  });
  
  // Use conditional logic for nested fields within this repeater item
  const { shouldRenderField } = useConditionalLogic(fieldsWithFixedConditionalLogic, itemValuesByFieldId, mainComponentFields, mainComponentFieldValues);
  

  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isDropdownOpen && !event.target.closest('.dropdown-container')) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: `repeater-item-${index}`,
    transition: { duration: 200, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.7 : (isHidden ? 0.5 : 1),
    zIndex: isDragging ? 100 : 'auto',
    boxShadow: isDragging ? '0 8px 24px 0 rgba(236, 72, 153, 0.15)' : undefined,
  };

  const handleToggleHidden = () => {
    const newHiddenState = !isHidden;
    setIsHidden(newHiddenState);
    onToggleHidden(index, newHiddenState);
  };

  const renderNestedField = (field, itemValue, itemIndex) => {
    const fieldValue = itemValue[field.name] || '';
    const isRequired = field.required || false;
    const fieldError = isRequired && !fieldValue;

    const handleChange = (value) => {
      onUpdateItem(itemIndex, field.name, value);
    };

    // Temporary debug log to check field types
    console.log('RepeaterField renderNestedField:', {
      fieldType: field.type,
      fieldName: field.name,
      fieldValue,
      field
    });

    switch (field.type) {
      case 'text':
        return (
          <TextField
            key={`${field.name}_${itemIndex}`}
            label={field.label}
            value={fieldValue}
            onChange={handleChange}
            placeholder={field.placeholder}
            required={isRequired}
            error={fieldError}
            fieldId={`${field.name}_${itemIndex}`}
          />
        );

      case 'textarea':
        return (
          <TextareaField
            key={`${field.name}_${itemIndex}`}
            label={field.label}
            value={fieldValue}
            onChange={handleChange}
            placeholder={field.placeholder}
            required={isRequired}
            error={fieldError}
            fieldId={`${field.name}_${itemIndex}`}
          />
        );

      case 'image':
        return (
          <ImageField
            key={`${field.name}_${itemIndex}`}
            label={field.label}
            value={fieldValue}
            onChange={handleChange}
            required={isRequired}
            error={fieldError}
          />
        );

      case 'video':
        return (
          <VideoField
            key={`${field.name}_${itemIndex}`}
            label={field.label}
            value={fieldValue}
            onChange={handleChange}
            required={isRequired}
            error={fieldError}
            config={field.config || {}}
          />
        );

      case 'wysiwyg':
        return (
          <WysiwygField
            key={`${field.name}_${itemIndex}`}
            label={field.label}
            value={fieldValue}
            onChange={handleChange}
            required={isRequired}
            error={fieldError}
            editorId={`wysiwyg_${instanceId}_${fieldId}_${itemIndex}_${field.name}`}
          />
        );

      case 'select':
        const multiple = field.config && field.config.multiple;
        let selectValue = fieldValue;
        if (multiple && typeof selectValue === 'string') {
          selectValue = selectValue ? [selectValue] : [];
        }
        if (multiple && Array.isArray(selectValue)) {
          selectValue = Array.from(new Set(selectValue));
        }

        let options = [];
        if (field.config && field.config.options) {
          if (Array.isArray(field.config.options)) {
            options = field.config.options.map(opt => 
              typeof opt === 'string' ? { label: opt, value: opt } : opt
            );
          } else if (typeof field.config.options === 'object') {
            options = Object.entries(field.config.options).map(([value, label]) => ({ label, value }));
          }
        }

        return (
          <SelectField
            key={`${field.name}_${itemIndex}`}
            label={field.label}
            value={selectValue}
            onChange={handleChange}
            options={options}
            multiple={multiple}
            required={isRequired}
            error={fieldError}
          />
        );

      case 'checkbox':
        let checkboxValue = fieldValue;
        if (typeof checkboxValue === 'string') {
          checkboxValue = checkboxValue ? [checkboxValue] : [];
        }
        if (Array.isArray(checkboxValue)) {
          checkboxValue = Array.from(new Set(checkboxValue));
        } else {
          checkboxValue = [];
        }

        let checkboxOptions = [];
        if (field.config && field.config.options) {
          if (Array.isArray(field.config.options)) {
            checkboxOptions = field.config.options.map(opt => 
              typeof opt === 'string' ? { label: opt, value: opt } : opt
            );
          } else if (typeof field.config.options === 'object') {
            checkboxOptions = Object.entries(field.config.options).map(([value, label]) => ({ label, value }));
          }
        }

        return (
          <CheckboxField
            key={`${field.name}_${itemIndex}`}
            label={field.label}
            value={checkboxValue}
            onChange={handleChange}
            options={checkboxOptions}
            required={isRequired}
            error={fieldError}
          />
        );

      case 'radio':
        let radioValue = fieldValue;
        if (Array.isArray(radioValue)) {
          radioValue = radioValue[0] || '';
        }

        let radioOptions = [];
        if (field.config && field.config.options) {
          if (Array.isArray(field.config.options)) {
            radioOptions = field.config.options.map(opt => 
              typeof opt === 'string' ? { label: opt, value: opt } : opt
            );
          } else if (typeof field.config.options === 'object') {
            radioOptions = Object.entries(field.config.options).map(([value, label]) => ({ label, value }));
          }
        }

        return (
          <RadioField
            key={`${field.name}_${itemIndex}`}
            label={field.label}
            value={radioValue}
            onChange={handleChange}
            options={radioOptions}
            required={isRequired}
            error={fieldError}
          />
        );

      case 'color':
        let colorValue = fieldValue;
        if (Array.isArray(colorValue)) {
          colorValue = colorValue[0] || '';
        }

        let colorData = { main: '', adjusted: '', hover: '' };
        if (typeof colorValue === 'string' && colorValue.startsWith('{') && colorValue.endsWith('}')) {
          try {
            const parsed = JSON.parse(colorValue);
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
            colorData = { main: colorValue, adjusted: colorValue, hover: '' };
          }
        } else if (typeof colorValue === 'string' && colorValue !== '') {
          colorData = { main: colorValue, adjusted: colorValue, hover: '' };
        }

        return (
          <ColorField
            key={`${field.name}_${itemIndex}`}
            label={field.label}
            value={JSON.stringify(colorData)}
            onChange={handleChange}
            required={isRequired}
            error={fieldError}
          />
        );

      case 'toggle':
        let toggleValue = fieldValue;
        if (typeof toggleValue === 'string') {
          toggleValue = toggleValue === '1' || toggleValue === 'true';
        }
        
        return (
          <ToggleField
            key={`${field.name}_${itemIndex}`}
            field={field}
            value={toggleValue}
            onChange={handleChange}
            onValidationChange={() => {}}
            instanceId={instanceId}
            fieldId={fieldId}
            availableFields={nestedFields || []}
          />
        );

      case 'oembed':
        return (
          <OembedField
            key={`${field.name}_${itemIndex}`}
            field={field}
            value={fieldValue}
            onChange={handleChange}
            isSubmitting={false}
            fieldConfig={field.config || {}}
            fieldId={`${field.name}_${itemIndex}`}
          />
        );

      case 'link':
        return (
          <LinkField
            key={`${field.name}_${itemIndex}`}
            field={field}
            value={fieldValue}
            onChange={handleChange}
            isSubmitting={false}
            fieldConfig={field.config || {}}
            fieldId={`${field.name}_${itemIndex}`}
          />
        );

      case 'email':
        return (
          <EmailField
            key={`${field.name}_${itemIndex}`}
            field={field}
            value={fieldValue}
            onChange={handleChange}
            isSubmitting={false}
            fieldConfig={field.config || {}}
            fieldId={`${field.name}_${itemIndex}`}
          />
        );

      case 'password':
        return (
          <PasswordField
            key={`${field.name}_${itemIndex}`}
            label={field.label}
            fieldName={field.name}
            fieldConfig={field.config || {}}
            fieldValue={fieldValue}
            fieldRequired={isRequired}
            onChange={handleChange}
            fieldId={`${field.name}_${itemIndex}`}
          />
        );

      case 'user':
        return (
          <UserField
            key={`${field.name}_${itemIndex}`}
            label={field.label}
            fieldName={field.name}
            fieldConfig={field.config || {}}
            fieldValue={fieldValue}
            fieldRequired={isRequired}
            onChange={handleChange}
            fieldId={`${field.name}_${itemIndex}`}
          />
        );

      case 'number':
        return (
          <NumberField
            key={`${field.name}_${itemIndex}`}
            field={field}
            value={fieldValue}
            onChange={handleChange}
            isSubmitting={false}
            fieldConfig={field.config || {}}
            fieldId={`${field.name}_${itemIndex}`}
          />
        );

      case 'range':
        return (
          <RangeField
            key={`${field.name}_${itemIndex}`}
            field={field}
            value={fieldValue}
            onChange={handleChange}
            isSubmitting={false}
            fieldConfig={field.config || {}}
            fieldId={`${field.name}_${itemIndex}`}
          />
        );

      case 'repeater':
        return (
          <RepeaterField
            key={`${field.name}_${itemIndex}`}
            label={field.label}
            value={fieldValue}
            onChange={handleChange}
            required={isRequired}
            error={fieldError}
            config={field.config || {}}
            fieldId={`${field.name}_${itemIndex}`}
            instanceId={`${instanceId}_${itemIndex}`}
            children={field.children || field.config?.nested_fields || []}
            mainComponentFields={mainComponentFields}
            mainComponentFieldValues={mainComponentFieldValues}
          />
        );

      case 'relationship':
        return (
          <RelationshipField
            key={`${field.name}_${itemIndex}`}
            label={field.label}
            fieldName={field.name}
            fieldConfig={field.config || {}}
            fieldValue={fieldValue}
            fieldRequired={isRequired}
            onChange={handleChange}
            fieldId={`${field.name}_${itemIndex}`}
          />
        );

      case 'gallery':
        // Parse gallery value if it's a JSON string
        let galleryValue = fieldValue;
        if (typeof galleryValue === 'string' && galleryValue) {
          try {
            const parsed = JSON.parse(galleryValue);
            galleryValue = Array.isArray(parsed) ? parsed : [];
          } catch (e) {
            galleryValue = [];
          }
        } else if (!Array.isArray(galleryValue)) {
          galleryValue = [];
        }
        
        return (
          <GalleryField
            key={`${field.name}_${itemIndex}`}
            field={field}
            value={galleryValue}
            onChange={handleChange}
            fieldConfig={field.config || {}}
            isRequired={isRequired}
            fieldId={`${field.name}_${itemIndex}`}
          />
        );

      default:
        return (
          <div className="p-3 border border-red-300 bg-red-50 rounded-md">
            <p className="text-red-600 text-sm">
              Unknown field type: <strong>{field.type}</strong> for field: <strong>{field.name}</strong>
            </p>
            <p className="text-red-500 text-xs mt-1">
              This field type is not supported in the repeater. Please check the field configuration.
            </p>
          </div>
        );
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`border border-gray-200 rounded-lg p-4 bg-white shadow-sm ${isHidden ? 'opacity-50' : ''}`}
    >
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-1 rounded focus:outline-none focus:ring-2 focus:ring-pink-400 hover:bg-gray-50"
            style={{ background: '#f9fafb' }}
          >
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
            </svg>
          </div>
          
          {/* Expand/Collapse Button for this item */}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            title={isExpanded ? "Collapse item" : "Expand item"}
          >
            <svg 
              className={`w-4 h-4 transform transition-transform ${isExpanded ? 'rotate-90' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          
                            <span className="text-sm font-medium text-gray-700">
                    Item {index + 1}
                    {isHidden && (
                      <span className="ml-2 text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
                        Hidden
                      </span>
                    )}
                  </span>
        </div>
        
                 <div className="flex items-center gap-2">
           {/* Toggle Switch for Hide/Show */}
           <div className="flex items-center gap-2">
             <span className="text-xs text-gray-500">Hide</span>
                           <button
                type="button"
                onClick={handleToggleHidden}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-pink-400 focus:ring-offset-2 ${
                  isHidden ? 'bg-gray-200' : 'bg-green-500'
                }`}
                title={isHidden ? "Show item" : "Hide item"}
              >
               <span
                 className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                   isHidden ? 'translate-x-1' : 'translate-x-5'
                 }`}
               />
             </button>
             <span className="text-xs text-gray-500">Show</span>
           </div>
           
           {/* Dropdown Menu */}
           <div className="relative dropdown-container">
             <button
               type="button"
               onClick={() => setIsDropdownOpen(!isDropdownOpen)}
               className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
               title="More options"
             >
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
               </svg>
             </button>
             
             {/* Dropdown Menu */}
             {isDropdownOpen && (
               <div className="absolute right-0 top-6 z-50 w-32 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5">
                 <div className="py-1">
                   <button
                     type="button"
                     onClick={() => {
                       onRemoveItem(index);
                       setIsDropdownOpen(false);
                     }}
                     className="flex w-full items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                   >
                     <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                     </svg>
                     Delete
                   </button>
                 </div>
               </div>
             )}
           </div>
         </div>
      </div>

      {/* Collapsible Content for this item */}
      {isExpanded && (
        <div className="space-y-4">
          {nestedFields.map(field => {
            // Check if field should be visible based on conditional logic
            if (!shouldRenderField(field.id)) {
              return null;
            }
            return renderNestedField(field, item, index);
          })}
        </div>
      )}
    </div>
  );
};

const RepeaterField = ({ 
  label, 
  value = [], 
  onChange, 
  required = false, 
  error = false,
  config = {},
  fieldId,
  instanceId,
  children = [], // Add children prop for nested fields
  mainComponentFields = [], // Add main component fields for conditional logic evaluation
  mainComponentFieldValues = {}, // Add main component field values for conditional logic evaluation
  licenseKey = '', // Add license key prop
  apiUrl = 'https://custom-craft-component-backend.vercel.app/api/pro-features/check' // Add API URL prop
}) => {
  const [items, setItems] = useState([]);
  const isInternalUpdate = useRef(false); // Track if update is from internal state change
  const maxSets = config.max_sets || 0; // 0 means unlimited
  // Use children if available, otherwise fall back to config.nested_fields
  const nestedFields = children.length > 0 ? children : (config.nested_fields || []);

  // Initialize items from value or empty array
  useEffect(() => {
    // Skip update if it's from our own internal state change
    if (isInternalUpdate.current) {
      isInternalUpdate.current = false;
      return;
    }
    

    if (Array.isArray(value)) {
      // Ensure all items have _hidden property
      const itemsWithHiddenState = value.map(item => ({
        ...item,
        _hidden: item._hidden || false
      }));
      setItems(itemsWithHiddenState);
    } else if (typeof value === 'string' && value) {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) {
          // Ensure all items have _hidden property
          const itemsWithHiddenState = parsed.map(item => ({
            ...item,
            _hidden: item._hidden || false
          }));
          setItems(itemsWithHiddenState);
        } else {
          setItems([]);
        }
             } catch (e) {
         setItems([]);
       }
    } else {
      setItems([]);
    }
  }, [value]);

  // Update parent when items change - save ALL items to database (including hidden ones)
  const handleItemsChange = useCallback((newItems) => {
    if (onChange) {
      // Save ALL items to database (including hidden ones) so they persist
      const allItems = newItems.map(item => ({
        ...item,
        _hidden: item._hidden || false
      }));
      
      const jsonString = JSON.stringify(allItems);
      
      // Mark this as an internal update to prevent re-initialization
      isInternalUpdate.current = true;
      onChange(jsonString);
    }
  }, [onChange]);

  useEffect(() => {
    handleItemsChange(items);
  }, [items, handleItemsChange]);

  const addItem = useCallback(() => {
    if (maxSets > 0 && items.length >= maxSets) {
      alert(`Maximum ${maxSets} items allowed.`);
      return;
    }
    
    if (nestedFields.length === 0) {
      alert('This repeater field has no nested fields configured. Please add nested fields to the component first.');
      return;
    }
    
    const newItem = {
      _hidden: false // New items are visible by default
    };
    nestedFields.forEach(field => {
      newItem[field.name] = field.type === 'checkbox' ? [] : '';
    });
    
    setItems([...items, newItem]);
  }, [items, maxSets, nestedFields]);

  const removeItem = useCallback((index) => {
    if (confirm('Are you sure you want to remove this item?')) {
      setItems(items.filter((_, i) => i !== index));
    }
  }, [items]);

  const updateItem = useCallback((index, fieldName, fieldValue) => {
    const updatedItems = [...items];
    updatedItems[index] = {
      ...updatedItems[index],
      [fieldName]: fieldValue
    };
    setItems(updatedItems);
  }, [items]);

  const toggleItemHidden = useCallback((index, hidden) => {
    const updatedItems = [...items];
    updatedItems[index] = {
      ...updatedItems[index],
      _hidden: hidden
    };
    setItems(updatedItems);
  }, [items]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 2 } })
  );

  const handleDragEnd = useCallback((event) => {
    const { active, over } = event;
    if (active && over && active.id !== over.id) {
      const activeIndex = parseInt(active.id.replace('repeater-item-', ''));
      const overIndex = parseInt(over.id.replace('repeater-item-', ''));
      if (!isNaN(activeIndex) && !isNaN(overIndex)) {
        const newOrder = arrayMove(items, activeIndex, overIndex);
        setItems(newOrder);
      }
    }
  }, [items]);

            return (
              <UniversalFieldWrapper 
                fieldType="repeater" 
                fieldLabel={label}
                licenseKey={licenseKey}
                apiUrl={apiUrl}
              >
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <label className="block text-sm font-medium text-gray-700">
                {label}
                {required && <span className="text-red-500 ml-1">*</span>}
              </label>
              {maxSets > 0 && (
                <span className="text-xs text-gray-500">
                  {items.length}/{maxSets}
                </span>
              )}
            </div>
          </div>

          {error && (
            <div className="text-red-500 text-sm mb-2">
              This field is required
            </div>
          )}

          {/* Content */}
          {items.length === 0 ? (
            <div className="text-center py-8 text-gray-400 border-2 border-dashed border-gray-300 rounded-lg">
              {nestedFields.length === 0 ? (
                <>
                  <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <p className="text-sm font-medium text-red-600">No nested fields configured</p>
                  <p className="text-xs">This repeater field has no nested fields. Please configure nested fields in the component first.</p>
                </>
              ) : (
                <>
                  <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-sm">No items added yet</p>
                  <p className="text-xs">Click "Add Item" to get started</p>
                </>
              )}
            </div>
          ) : (
            <DndContext 
              sensors={sensors} 
              collisionDetection={closestCenter} 
              onDragEnd={handleDragEnd}
            >
              <SortableContext 
                items={items.map((_, index) => `repeater-item-${index}`)} 
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-4">
                  {items.map((item, index) => (
                    <SortableRepeaterItem
                      key={`repeater-item-${index}`}
                      item={item}
                      index={index}
                      nestedFields={nestedFields}
                      onUpdateItem={updateItem}
                      onRemoveItem={removeItem}
                      onToggleHidden={toggleItemHidden}
                      instanceId={instanceId}
                      fieldId={fieldId}
                      mainComponentFields={mainComponentFields}
                      mainComponentFieldValues={mainComponentFieldValues}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}

          {/* Add Item Button - Bottom of Repeater Field */}
          {nestedFields.length > 0 && (
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={addItem}
                disabled={maxSets > 0 && items.length >= maxSets}
                className="flex items-center gap-2 px-4 py-2 bg-pink-500 text-white text-sm rounded-lg hover:bg-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                title={maxSets > 0 && items.length >= maxSets ? `Maximum ${maxSets} items allowed` : "Add new item"}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Item
              </button>
            </div>
          )}
        </div>
              </UniversalFieldWrapper>
    );
};

export default RepeaterField; 