import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

const ComponentSelector = () => {
  const [components, setComponents] = useState([]);
  const [selectedComponents, setSelectedComponents] = useState([]);
  const [fieldValues, setFieldValues] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  const postId = document.getElementById('ccc-component-selector')?.dataset.postId;

  const fetchComponents = async () => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('action', 'ccc_get_components');
      formData.append('nonce', window.cccData.nonce);

      const response = await axios.post(window.cccData.ajaxUrl, formData);

      if (response.data.success && Array.isArray(response.data.data?.components)) {
        setComponents(response.data.data.components);
        setError('');

        const savedComponents = wp.data.select('core/editor')?.getEditedPostAttribute('meta')?._ccc_components || [];
        setSelectedComponents(savedComponents);

        const initialFieldValues = {};
        response.data.data.components.forEach((comp) => {
          comp.fields.forEach((field) => {
            field.values.forEach((value) => {
              if (value.post_id === postId) {
                initialFieldValues[`${field.id}`] = value.value;
              }
            });
          });
        });
        setFieldValues(initialFieldValues);
      } else {
        setComponents([]);
        setError('Failed to fetch components. Invalid response format.');
      }
    } catch (err) {
      setError('Failed to connect to server. Please refresh and try again.');
      console.error('Failed to fetch components', err);
    } finally {
      setLoading(false);
    }
  };

  const onDragEnd = (result) => {
    if (!result.destination) return;

    const reorderedComponents = Array.from(selectedComponents);
    const [movedComponent] = reorderedComponents.splice(result.source.index, 1);
    reorderedComponents.splice(result.destination.index, 0, movedComponent);

    setSelectedComponents(reorderedComponents);
  };

  const handleSave = () => {
    const values = Object.entries(fieldValues).map(([field_id, value]) => ({
      field_id,
      value,
    }));

    const metaInput = document.createElement('input');
    metaInput.type = 'hidden';
    metaInput.name = 'ccc_components';
    metaInput.value = JSON.stringify(selectedComponents);
    document.getElementById('post').appendChild(metaInput);

    const valuesInput = document.createElement('input');
    valuesInput.type = 'hidden';
    valuesInput.name = 'ccc_field_values';
    valuesInput.value = JSON.stringify(values);
    document.getElementById('post').appendChild(valuesInput);

    setMessage('Changes will be saved when you update the post.');
    setMessageType('success');

    setTimeout(() => setMessage(''), 5000);
  };

  useEffect(() => {
    fetchComponents();
  }, []);

  return (
    <div className="p-4">
      {message && (
        <div className={`mb-4 px-4 py-2 rounded ${messageType === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {message}
        </div>
      )}

      {loading ? (
        <p className="text-gray-500">Loading components...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : (
        <>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Select Components</h4>
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="components">
              {(provided) => (
                <ul className="space-y-2" {...provided.droppableProps} ref={provided.innerRef}>
                  {selectedComponents.map((comp, index) => (
                    <Draggable key={comp.id} draggableId={comp.id.toString()} index={index}>
                      {(provided) => (
                        <li
                          className="bg-gray-50 p-2 rounded flex justify-between items-center"
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                        >
                          <div>
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                checked
                                onChange={() =>
                                  setSelectedComponents(selectedComponents.filter((c) => c.id !== comp.id))
                                }
                                className="mr-2"
                              />
                              {comp.name}
                            </label>
                          </div>
                          <span className="text-gray-500">Drag to reorder</span>
                        </li>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </ul>
              )}
            </Droppable>
          </DragDropContext>

          <div className="mt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Available Components</h4>
            <ul className="space-y-2">
              {components
                .filter((comp) => !selectedComponents.some((c) => c.id === comp.id))
                .map((comp) => (
                  <li key={comp.id} className="bg-gray-50 p-2 rounded">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedComponents([...selectedComponents, { id: comp.id, name: comp.name }]);
                          }
                        }}
                        className="mr-2"
                      />
                      {comp.name}
                    </label>
                  </li>
                ))}
            </ul>
          </div>

          {selectedComponents.length > 0 && (
            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Field Values</h4>
              {selectedComponents.map((comp) => {
                const component = components.find((c) => c.id === comp.id);
                return (
                  <div key={comp.id} className="mb-4">
                    <h5 className="font-medium">{comp.name}</h5>
                    {component.fields.map((field) => (
                      <div key={field.id} className="mt-2">
                        <label className="block text-gray-700 mb-1">{field.label}</label>
                        {field.type === 'text' ? (
                          <input
                            type="text"
                            value={fieldValues[field.id] || ''}
                            onChange={(e) =>
                              setFieldValues({
                                ...fieldValues,
                                [field.id]: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        ) : (
                          <textarea
                            value={fieldValues[field.id] || ''}
                            onChange={(e) =>
                              setFieldValues({
                                ...fieldValues,
                                [field.id]: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            rows="4"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          )}

          <button
            onClick={handleSave}
            className="mt-4 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
          >
            Save Changes
          </button>
        </>
      )}
    </div>
  );
};

export default ComponentSelector;
