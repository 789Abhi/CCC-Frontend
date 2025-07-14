import React from 'react';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, arrayMove, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function ComponentItem({ component, index, isReadOnly, totalComponents, onRemove, onUndoDelete, onToggleHide, listeners, attributes, setNodeRef, style }) {
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white transition-all duration-200 ${component.isPendingDelete ? 'opacity-50 bg-red-50' : ''}`}
    >
      <div className="flex items-center gap-3">
        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-100 rounded transition-colors mr-2">
          <svg className="w-5 h-5 text-gray-400 hover:text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="8" y1="12" x2="16" y2="12" />
            <line x1="12" y1="8" x2="12" y2="16" />
          </svg>
        </div>
        <div>
          <div className="font-semibold text-gray-800 text-lg">{component.name}</div>
          <div className="text-xs text-gray-400">@{component.handle_name}</div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700"
          onClick={onToggleHide}
          type="button"
          title={component.isHidden ? 'Show' : 'Hide'}
        >
          {component.isHidden ? (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3.5" /><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" /></svg>
          ) : (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3.5" /><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" /></svg>
          )}
        </button>
        {component.isPendingDelete ? (
          <button
            className="p-1 rounded hover:bg-green-100 text-green-600 hover:text-green-800"
            onClick={onUndoDelete}
            type="button"
            title="Undo Delete"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 14l-4-4 4-4" /><path d="M5 10h12a4 4 0 1 1 0 8h-1" /></svg>
          </button>
        ) : (
          <button
            className="p-1 rounded hover:bg-red-100 text-red-600 hover:text-red-800"
            onClick={onRemove}
            type="button"
            title="Delete"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg>
          </button>
        )}
      </div>
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
  } = useSortable({ id: component.instance_id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 100 : 'auto',
  };
  return <ComponentItem {...rest} component={component} listeners={listeners} attributes={attributes} setNodeRef={setNodeRef} style={style} />;
}

function ComponentList({ components, isReadOnly = false, onAdd, onRemove, onUndoDelete, onToggleHide, onReorder }) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

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