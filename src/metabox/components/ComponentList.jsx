import React from 'react';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, arrayMove, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import logo from "/drag-drop-icon.svg"

function ComponentItem({ component, index, isReadOnly, totalComponents, onRemove, onUndoDelete, onToggleHide, listeners, attributes, setNodeRef, style, isExpanded, onToggleExpand }) {
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex flex-col border-b border-gray-100 bg-white transition-all duration-200 ${component.isPendingDelete ? 'opacity-50 bg-red-50' : ''}`}
      onClick={e => {
        // Only toggle expand if not clicking drag handle or action buttons
        if (!e.target.closest('.ccc-drag-handle') && !e.target.closest('.ccc-action-btn')) {
          onToggleExpand(component.instance_id);
        }
      }}
    >
      <div className="flex items-center justify-between px-6 py-4 group cursor-pointer">
        <div className="flex items-center gap-3 flex-1">
          <button
            className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-pink-400 mr-2"
            onClick={e => { e.stopPropagation(); onToggleExpand(component.instance_id); }}
            tabIndex={0}
            aria-label={isExpanded ? 'Collapse' : 'Expand'}
            type="button"
          >
            {isExpanded ? (
              <svg className="w-5 h-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 8 10 12 14 8" /></svg>
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="8 6 12 10 8 14" /></svg>
            )}
          </button>
          <div {...attributes} {...listeners} className="ccc-drag-handle cursor-grab active:cursor-grabbing p-1 hover:bg-pink-100 rounded transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-pink-400 mr-2" style={{ background: '#f9fafb' }}>
           <img className='w-5 h-5 object-contain' src={logo} alt="" />
          </div>
          <div>
            <div className="font-semibold text-gray-800 text-lg flex items-center gap-2">
              {component.name}
            </div>
            <div className="text-xs text-gray-400">@{component.handle_name}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700 ccc-action-btn"
            onClick={e => { e.stopPropagation(); onToggleHide(); }}
            type="button"
            title={component.isHidden ? 'Show' : 'Hide'}
          >
            {component.isHidden ? (
              // Eye icon for show
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12C1 12 5 5 12 5s11 7 11 7-4 7-11 7S1 12 1 12z"/><circle cx="12" cy="12" r="3"/></svg>
            ) : (
              // Eye-off icon for hide
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-7 0-11-7-11-7a21.77 21.77 0 0 1 5.06-6.06M1 1l22 22"/><circle cx="12" cy="12" r="3"/></svg>
            )}
          </button>
          {component.isPendingDelete ? (
            <button
              className="p-1 rounded hover:bg-green-100 text-green-600 hover:text-green-800 ccc-action-btn"
              onClick={e => { e.stopPropagation(); onUndoDelete(); }}
              type="button"
              title="Undo Delete"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 14l-4-4 4-4" /><path d="M5 10h12a4 4 0 1 1 0 8h-1" /></svg>
            </button>
          ) : (
            <button
              className="p-1 rounded hover:bg-red-100 text-red-600 hover:text-red-800 ccc-action-btn"
              onClick={e => { e.stopPropagation(); onRemove(); }}
              type="button"
              title="Delete"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg>
            </button>
          )}
        </div>
      </div>
      {/* Expanded details */}
      {isExpanded && (
        <div className="px-8 pb-4 pt-2 bg-gray-50 border-t border-gray-100 text-sm text-gray-700 animate-fade-in">
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
    scale: isDragging ? 1.03 : 1,
  };
  return <ComponentItem {...rest} component={component} listeners={listeners} attributes={attributes} setNodeRef={setNodeRef} style={style} />;
}

function ComponentList({ components, isReadOnly = false, onAdd, onRemove, onUndoDelete, onToggleHide, onReorder, expandedComponentIds = [], onToggleExpand, dropdownOpen, setDropdownOpen, availableComponents, addComponent }) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 2 } })
  );

  // Multi-select state for dropdown
  const [selectedIds, setSelectedIds] = React.useState([]);
  React.useEffect(() => {
    if (!dropdownOpen) setSelectedIds([]);
  }, [dropdownOpen]);

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
    selectedComponents.forEach(comp => addComponent(comp));
    setDropdownOpen(false);
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
        <h3 className="text-lg font-semibold text-gray-800">Custom Components</h3>
        <div className="relative w-[200px]">
          <button
            className="flex items-center w-full text-base font-semibold gap-2 px-4 py-2 bg-pink-500 text-white rounded-md hover:bg-pink-600 transition shadow focus:outline-none focus:ring-2 focus:ring-pink-400"
            onClick={handleDropdownToggle}
            type="button"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Add Component
          </button>
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-[200px] bg-white border border-pink-200 rounded-lg shadow-lg z-20 animate-fade-in">
              <ul className="max-h-60 overflow-y-auto py-2">
                {availableComponents.length === 0 ? (
                  <li className="px-4 py-2 text-gray-400">No components available</li>
                ) : (
                  availableComponents.map((component) => (
                    <li key={component.id} className="px-4 py-2 hover:bg-pink-50 cursor-pointer text-gray-800 flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(component.id)}
                        onChange={() => handleDropdownSelect(component)}
                        className="accent-pink-500"
                      />
                      <span className="flex-1 min-w-0 text-gray-800 font-medium truncate text-base">{component.name}</span>
                    </li>
                  ))
                )}
              </ul>
              <div className="px-4 py-2 border-t border-pink-100 bg-white flex justify-end">
                <button
                  className="px-3 py-1.5 bg-pink-500 text-white rounded hover:bg-pink-600 focus:outline-none focus:ring-2 focus:ring-pink-400 text-sm font-semibold shadow disabled:opacity-50"
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
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={components.map(c => c.instance_id)} strategy={verticalListSortingStrategy}>
              {components.map((component, index) => (
                <SortableComponentItem
                  key={component.instance_id}
                  component={component}
                  index={index}
                  isReadOnly={isReadOnly}
                  totalComponents={components.length}
                  onRemove={() => onRemove(component.instance_id)}
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