import React, { useState, useEffect } from 'react';
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

// Sortable Repeater Item Component
const SortableRepeaterItem = ({ item, index, nestedFields, onUpdateItem, onRemoveItem, instanceId, fieldId }) => {
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
    opacity: isDragging ? 0.7 : 1,
    zIndex: isDragging ? 100 : 'auto',
    boxShadow: isDragging ? '0 8px 24px 0 rgba(236, 72, 153, 0.15)' : undefined,
  };

  const renderNestedField = (field, itemValue, itemIndex) => {
    const fieldValue = itemValue[field.name] || '';
    const isRequired = field.required || false;
    const fieldError = isRequired && !fieldValue;

    const handleChange = (value) => {
      onUpdateItem(itemIndex, field.name, value);
    };

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

      default:
        return (
          <TextField
            key={`${field.name}_${itemIndex}`}
            label={field.label}
            value={fieldValue}
            onChange={handleChange}
            placeholder={field.placeholder}
            required={isRequired}
            error={fieldError}
          />
        );
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm"
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
          <span className="text-sm font-medium text-gray-700">
            Item {index + 1}
          </span>
        </div>
        <button
          type="button"
          onClick={() => onRemoveItem(index)}
          className="p-1 text-red-400 hover:text-red-600 transition-colors"
          title="Remove item"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>

      <div className="space-y-4">
        {nestedFields.map(field => renderNestedField(field, item, index))}
      </div>
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
  isHidden = false, // Add hidden state prop
  onToggleHide = null // Add toggle function prop
}) => {
  const [items, setItems] = useState([]);
  const [isExpanded, setIsExpanded] = useState(true); // Default expanded
  const maxSets = config.max_sets || 0; // 0 means unlimited
  // Use children if available, otherwise fall back to config.nested_fields
  const nestedFields = children.length > 0 ? children : (config.nested_fields || []);

  // Initialize items from value or empty array
  useEffect(() => {
    console.log('CCC DEBUG: RepeaterField initializing with value:', value);
    if (Array.isArray(value)) {
      setItems(value);
    } else if (typeof value === 'string' && value) {
      try {
        const parsed = JSON.parse(value);
        setItems(Array.isArray(parsed) ? parsed : []);
      } catch (e) {
        console.error('CCC DEBUG: RepeaterField failed to parse value:', e);
        setItems([]);
      }
    } else {
      setItems([]);
    }
  }, [value]);

  // Update parent when items change
  useEffect(() => {
    if (onChange) {
      console.log('CCC DEBUG: RepeaterField updating parent with items:', items);
      const jsonString = JSON.stringify(items);
      console.log('CCC DEBUG: RepeaterField JSON string:', jsonString);
      onChange(jsonString);
    }
  }, [items, onChange]);

  const addItem = () => {
    if (maxSets > 0 && items.length >= maxSets) {
      alert(`Maximum ${maxSets} items allowed.`);
      return;
    }
    
    if (nestedFields.length === 0) {
      alert('This repeater field has no nested fields configured. Please add nested fields to the component first.');
      return;
    }
    
    const newItem = {};
    nestedFields.forEach(field => {
      newItem[field.name] = field.type === 'checkbox' ? [] : '';
    });
    
    setItems([...items, newItem]);
  };

  const removeItem = (index) => {
    if (confirm('Are you sure you want to remove this item?')) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index, fieldName, fieldValue) => {
    console.log('CCC DEBUG: RepeaterField updateItem called:', { index, fieldName, fieldValue });
    const updatedItems = [...items];
    updatedItems[index] = {
      ...updatedItems[index],
      [fieldName]: fieldValue
    };
    console.log('CCC DEBUG: RepeaterField updatedItems:', updatedItems);
    setItems(updatedItems);
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 2 } })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active && over && active.id !== over.id) {
      const activeIndex = parseInt(active.id.replace('repeater-item-', ''));
      const overIndex = parseInt(over.id.replace('repeater-item-', ''));
      if (!isNaN(activeIndex) && !isNaN(overIndex)) {
        const newOrder = arrayMove(items, activeIndex, overIndex);
        setItems(newOrder);
      }
    }
  };

    return (
    <div className={`mb-6 ${isHidden ? 'opacity-50' : ''}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            title={isExpanded ? "Collapse" : "Expand"}
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
        
        {/* Toggle Hide/Show Button */}
        {onToggleHide && (
          <button
            type="button"
            onClick={onToggleHide}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            title={isHidden ? "Show field" : "Hide field"}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isHidden ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
              )}
            </svg>
          </button>
        )}
      </div>

            {error && (
        <div className="text-red-500 text-sm mb-2">
          This field is required
        </div>
      )}

      {/* Collapsible Content */}
      {isExpanded && (
        <>
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
                      instanceId={instanceId}
                      fieldId={fieldId}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </>
      )}

             {/* Add Item Button - Bottom of Repeater Field */}
       {isExpanded && nestedFields.length > 0 && (
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
  );
};

export default RepeaterField; 