import React, { useState, useEffect } from "react";
import axios from "axios";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import FieldPopup from "./FieldPopup";

const ComponentList = () => {
  const [showPopup, setShowPopup] = useState(false);
  const [componentName, setComponentName] = useState("");
  const [handle, setHandle] = useState("");
  const [components, setComponents] = useState([]);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [showFieldPopup, setShowFieldPopup] = useState(false);
  const [selectedComponentId, setSelectedComponentId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [postType, setPostType] = useState("page");
  const [posts, setPosts] = useState([]);
  const [selectedPostId, setSelectedPostId] = useState("");
  const [selectedComponents, setSelectedComponents] = useState([]);
  const [fieldValues, setFieldValues] = useState({});

  const isEditor = !!document.getElementById('ccc-component-selector');
  const postId = document.getElementById('ccc-component-selector')?.dataset.postId || '';

  const generateHandle = (name) => {
    return name.toLowerCase().replace(/\s+/g, "_").replace(/[^\w_]+/g, "");
  };

  const fetchComponents = async () => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("action", "ccc_get_components");
      formData.append("nonce", window.cccData.nonce);

      const response = await axios.post(window.cccData.ajaxUrl, formData);

      if (response.data.success && Array.isArray(response.data.data?.components)) {
        setComponents(response.data.data.components);
        setError("");
        if (isEditor) {
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
        }
      } else {
        setComponents([]);
        setError("Failed to fetch components. Invalid response format.");
        console.error("Invalid response format:", response.data);
      }
    } catch (err) {
      setError("Failed to connect to server. Please refresh and try again.");
      console.error("Failed to fetch components", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPosts = async (type) => {
    try {
      const formData = new FormData();
      formData.append("action", "ccc_get_posts");
      formData.append("post_type", type);
      formData.append("nonce", window.cccData.nonce);

      const response = await axios.post(window.cccData.ajaxUrl, formData);

      if (response.data.success && Array.isArray(response.data.data?.posts)) {
        setPosts(response.data.data.posts);
      } else {
        setPosts([]);
        setError("Failed to fetch posts.");
      }
    } catch (err) {
      setError("Failed to fetch posts. Please try again.");
      console.error("Failed to fetch posts", err);
    }
  };

  const handleSubmit = async () => {
    if (!componentName) {
      setMessage("Please enter a component name");
      setMessageType("error");
      return;
    }

    const formData = new FormData();
    formData.append("action", "ccc_create_component");
    formData.append("name", componentName);
    formData.append("handle", handle || generateHandle(componentName));
    formData.append("nonce", window.cccData.nonce);

    try {
      const response = await axios.post(window.cccData.ajaxUrl, formData);

      if (response.data.success) {
        setMessage(response.data.message || "Component created successfully.");
        setMessageType("success");
        fetchComponents();
        setShowPopup(false);
        setComponentName("");
        setHandle("");
      } else {
        setMessage(response.data.message || "Failed to create component.");
        setMessageType("error");
      }
    } catch (error) {
      console.error("Error creating component:", error);
      setMessage("Error connecting to server. Please try again.");
      setMessageType("error");
    }

    setTimeout(() => {
      setMessage("");
      setMessageType("");
    }, 5000);
  };

  const handleDeleteComponent = async (componentId) => {
    if (!window.confirm('Are you sure you want to delete this component?')) return;

    try {
      const formData = new FormData();
      formData.append("action", "ccc_delete_component");
      formData.append("component_id", componentId);
      formData.append("nonce", window.cccData.nonce);

      const response = await axios.post(window.cccData.ajaxUrl, formData);

      if (response.data.success) {
        setMessage("Component deleted successfully.");
        setMessageType("success");
        fetchComponents();
      } else {
        setMessage(response.data.message || "Failed to delete component.");
        setMessageType("error");
      }
    } catch (error) {
      console.error("Error deleting component:", error);
      setMessage("Error connecting to server. Please try again.");
      setMessageType("error");
    }

    setTimeout(() => setMessage(""), 5000);
  };

  const handleDeleteField = async (fieldId) => {
    if (!window.confirm('Are you sure you want to delete this field?')) return;

    try {
      const formData = new FormData();
      formData.append("action", "ccc_delete_field");
      formData.append("field_id", fieldId);
      formData.append("nonce", window.cccData.nonce);

      const response = await axios.post(window.cccData.ajaxUrl, formData);

      if (response.data.success) {
        setMessage("Field deleted successfully.");
        setMessageType("success");
        fetchComponents();
      } else {
        setMessage(response.data.message || "Failed to delete field.");
        setMessageType("error");
      }
    } catch (error) {
      console.error("Error deleting field:", error);
      setMessage("Error connecting to server. Please try again.");
      setMessageType("error");
    }

    setTimeout(() => setMessage(""), 5000);
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
      value
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

  useEffect(() => {
    if (!isEditor && postType !== "all_pages") {
      fetchPosts(postType);
      setSelectedComponents([]);
      setFieldValues({});
    } else if (!isEditor && postType === "all_pages") {
      setPosts([]);
      setSelectedPostId("");
      setSelectedComponents(components.map(comp => ({ id: comp.id, name: comp.name })));
    }
  }, [postType, components]);

  const openFieldPopup = (componentId) => {
    setSelectedComponentId(componentId);
    setShowFieldPopup(true);
  };

  if (isEditor) {
    return (
      <div className="p-4">
        {message && (
          <div
            className={`mb-4 px-4 py-2 rounded ${
              messageType === "success"
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
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
                                  onChange={() => {
                                    setSelectedComponents(selectedComponents.filter((c) => c.id !== comp.id));
                                  }}
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
                          {field.type === "text" ? (
                            <input
                              type="text"
                              value={fieldValues[field.id] || ""}
                              onChange={(e) =>
                                setFieldValues({ ...fieldValues, [field.id]: e.target.value })
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          ) : (
                            <textarea
                              value={fieldValues[field.id] || ""}
                              onChange={(e) =>
                                setFieldValues({ ...fieldValues, [field.id]: e.target.value })
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
  }

  return (
    <div className="p-6">
      {message && (
        <div
          className={`mb-4 px-4 py-2 rounded ${
            messageType === "success"
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {message}
        </div>
      )}

      <button
        onClick={() => {
          setShowPopup(true);
          setComponentName("");
          setHandle("");
        }}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
      >
        Add New Component
      </button>

      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-2">Existing Components</h3>

        {loading ? (
          <p className="text-gray-500">Loading components...</p>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : components.length === 0 ? (
          <p>No components found. Create your first component above.</p>
        ) : (
          <ul className="space-y-3">
            {components.map((comp) => (
              <li key={comp.id} className="bg-white p-4 rounded shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <strong>{comp.name}</strong>{" "}
                    <span className="text-gray-500">—</span>{" "}
                    <code className="bg-gray-100 px-1 rounded">{comp.handle_name}</code>
                  </div>
                  <div className="space-x-2">
                    <button
                      onClick={() => openFieldPopup(comp.id)}
                      className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition"
                    >
                      Add Field
                    </button>
                    <button
                      onClick={() => handleDeleteComponent(comp.id)}
                      className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                {comp.fields && comp.fields.length > 0 ? (
                  <div className="mt-3">
                    <h4 className="text-sm font-medium text-gray-700">Fields:</h4>
                    <ul className="mt-2 space-y-2">
                      {comp.fields.map((field) => (
                        <li
                          key={field.id}
                          className="border-l-4 border-blue-500 pl-3 py-2 bg-gray-50 rounded flex justify-between items-center"
                        >
                          <div>
                            <span className="font-medium">{field.label}</span>{" "}
                            <span className="text-gray-500">—</span>{" "}
                            <code className="bg-gray-100 px-1 rounded">{field.name}</code>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-gray-600 text-sm capitalize">{field.type}</span>
                            <button
                              onClick={() => handleDeleteField(field.id)}
                              className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 transition"
                            >
                              Delete
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p className="mt-2 text-gray-500 text-sm">No fields added yet.</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-2">Assign Components to Content</h3>
        <div className="flex space-x-4 mb-4">
          <div>
            <label className="block text-gray-700 mb-1">Content Type</label>
            <select
              value={postType}
              onChange={(e) => setPostType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="page">Pages</option>
              <option value="post">Posts</option>
              <option value="all_pages">All Pages</option>
            </select>
          </div>
          {postType !== "all_pages" && (
            <div>
              <label className="block text-gray-700 mb-1">Select {postType === "page" ? "Page" : "Post"}</label>
              <select
                value={selectedPostId}
                onChange={(e) => setSelectedPostId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a {postType}</option>
                {posts.map((post) => (
                  <option key={post.id} value={post.id}>{post.title}</option>
                ))}
              </select>
            </div>
          )}
        </div>
        <button
          className="mt-4 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
        >
          Save
        </button>
      </div>

      {showPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">Create New Component</h3>
            <input
              type="text"
              value={componentName}
              placeholder="Component Name"
              onChange={(e) => {
                const value = e.target.value;
                setComponentName(value);
                if (!handle || handle === generateHandle(componentName)) {
                  setHandle(generateHandle(value));
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
            />
            <p className="text-sm text-gray-600 mb-4">
              Handle: <span className="font-mono">{handle}</span>
            </p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={handleSubmit}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setShowPopup(false);
                  setComponentName("");
                  setHandle("");
                }}
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showFieldPopup && (
        <FieldPopup
          componentId={selectedComponentId}
          onClose={() => {
            setShowFieldPopup(false);
            setSelectedComponentId(null);
          }}
          onFieldAdded={fetchComponents}
        />
      )}
    </div>
  );
};

export default ComponentList;