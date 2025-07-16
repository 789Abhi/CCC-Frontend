import React, { useState, useRef } from 'react';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, arrayMove, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import logo from "/drag-drop-icon.svg";

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
  React.useEffect(() => {
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

function ComponentItem({ component, index, isReadOnly, totalComponents, onRemove, onUndoDelete, onToggleHide, listeners, attributes, setNodeRef, style, isExpanded, onToggleExpand }) {
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex flex-col border-2 border-pink-400 rounded-lg mb-4 bg-gray-100 transition-all duration-200 ${component.isPendingDelete ? 'opacity-50 bg-red-50' : ''}`}
      onClick={e => {
        if (!e.target.closest('.ccc-drag-handle') && !e.target.closest('.ccc-action-btn') && !e.target.closest('.ccc-dot-menu')) {
          onToggleExpand(component.instance_id);
        }
      }}
    >
      <div className="flex items-center px-4 py-3">
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
        <div className="flex items-center gap-3 flex-shrink-0">
          <ToggleSwitch checked={!component.isHidden} onChange={e => { e.stopPropagation(); onToggleHide(); }} />
          <DotMenu onDelete={onRemove} />
        </div>
      </div>
      {isExpanded && (
        <div className="px-8 pb-4 pt-2 bg-gray-50 border-t border-pink-100 text-sm text-gray-700 animate-fade-in">
          <div><span className="font-semibold">Component Handle:</span> @{component.handle_name}</div>
          <div><span className="font-semibold">Order:</span> {index + 1} of {totalComponents}</div>
        </div>
      )}
    </div>
  );
}

function SortableComponentItem(props) {
  const { component, ...rest } = props;
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: component.instance_id, transition: { duration: 200, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' } });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.7 : 1,
    zIndex: isDragging ? 100 : 'auto',
    boxShadow: isDragging ? '0 8px 24px 0 rgba(236, 72, 153, 0.15)' : undefined,
  };
  return <ComponentItem {...rest} component={component} listeners={listeners} attributes={attributes} setNodeRef={setNodeRef} style={style} />;
}

function ComponentList({ components, isReadOnly = false, onAdd, onRemove, onUndoDelete, onToggleHide, onReorder, expandedComponentIds = [], onToggleExpand, dropdownOpen, setDropdownOpen, availableComponents, addComponent }) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 2 } })
  );

  // Multi-select state for dropdown
  const [selectedIds, setSelectedIds] = React.useState([]);
  const [searchTerm, setSearchTerm] = React.useState('');
  const searchInputRef = React.useRef(null);
  React.useEffect(() => {
    if (!dropdownOpen) setSelectedIds([]);
    if (dropdownOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [dropdownOpen]);

  const filteredComponents = availableComponents.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleDropdownToggle = () => {
    setDropdownOpen((open) => !open);
  };

  const handleDropdownSelect = (component) => {
    setSelectedIds((prev) =>
      prev.includes(component.id)
        ? prev.filter(id => id !== component.id)
        : [...prev, component.id]
    );
  };

  const handleAddSelected = () => {
    const selectedComponents = availableComponents.filter(c => selectedIds.includes(c.id));
    if (selectedComponents.length > 0) {
      addComponent(selectedComponents);
    }
    setDropdownOpen(false);
  };

  // Remove component from UI immediately
  const handleRemove = (instance_id) => {
    onRemove(instance_id);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active && over && active.id !== over.id) {
      const oldIndex = components.findIndex(c => c.instance_id === active.id);
      const newIndex = components.findIndex(c => c.instance_id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        const newOrder = arrayMove(components, oldIndex, newIndex);
        onReorder(newOrder);
      }
    }
  };

  return (
    <div>
      {/* Header with Add Dropdown */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-pink-50 to-blue-50 relative">
        <h3 className="text-lg font-bold text-gray-800">Components</h3>
        <div className="relative w-[300px]">
          <button
            className="flex items-center w-full text-base font-semibold gap-2 px-4 py-2 bg-white border-2 border-pink-400 text-pink-600 rounded-md hover:bg-pink-50 transition shadow focus:outline-none focus:ring-2 focus:ring-pink-400"
            onClick={handleDropdownToggle}
            type="button"
          >
          <svg class="w-5 h-5 text-pink-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>
            Add Component
          </button>
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-[300px] bg-white border-2 border-pink-400 rounded-lg shadow-lg z-20 animate-fade-in p-2">
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search Component"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full mb-2 px-3 py-2 border border-pink-300 rounded focus:outline-none focus:ring-2 focus:ring-pink-400 text-base"
              />
              <ul className="max-h-60 overflow-y-auto">
                {filteredComponents.length === 0 ? (
                  <li className="px-4 py-2 text-gray-400">No components available</li>
                ) : (
                  filteredComponents.map((component) => (
                    <li
                      key={component.id}
                      className="flex items-center gap-2 px-3 py-2 mb-2 rounded bg-gray-100 border border-pink-200 hover:bg-pink-50 transition text-left shadow-sm cursor-pointer"
                      onClick={() => handleDropdownSelect(component)}
                    >
                      <svg className="w-5 h-5 text-pink-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" /></svg>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(component.id)}
                        onChange={e => { e.stopPropagation(); handleDropdownSelect(component); }}
                        className="accent-pink-500"
                      />
                      <span className="flex-1 min-w-0 text-gray-800 font-medium truncate text-base">{component.name}</span>
                    </li>
                  ))
                )}
              </ul>
              <div className="px-2 pt-2 flex justify-end">
                <button
                  className="px-4 py-2 bg-pink-500 text-white rounded hover:bg-pink-600 focus:outline-none focus:ring-2 focus:ring-pink-400 text-base font-semibold shadow disabled:opacity-50"
                  onClick={handleAddSelected}
                  disabled={selectedIds.length === 0}
                  type="button"
                >
                  Add Selected
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Components List */}
      <div className="min-h-[80px] mt-6">
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
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={components.map(c => c.instance_id)} strategy={verticalListSortingStrategy}>
              {components.map((component, index) => (
                <SortableComponentItem
                  key={component.instance_id}
                  component={component}
                  index={index}
                  isReadOnly={isReadOnly}
                  totalComponents={components.length}
                  onRemove={() => handleRemove(component.instance_id)}
                  onUndoDelete={() => onUndoDelete(component.instance_id)}
                  onToggleHide={() => onToggleHide(component.instance_id)}
                  isExpanded={expandedComponentIds.includes(component.instance_id)}
                  onToggleExpand={onToggleExpand}
                />
              ))}
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  );
}

export default ComponentList; 