import React, { useState, useEffect } from "react";
import axios from "axios";
import FieldPopup from "./FieldPopup";

const ComponentList = () => {
  const [showPopup, setShowPopup] = useState(false);
  const [componentName, setComponentName] = useState("");
  const [handle, setHandle] = useState("");
  const [components, setComponents] = useState([]);
  const [componentFields, setComponentFields] = useState({});
  const [message, setMessageStatus] = useState({ text: "", type: "" });
  const [showFieldPopup, setShowFieldPopup] = useState(false);
  const [selectedComponentId, setSelectedComponentId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedComponents, setExpandedComponents] = useState({});

  const setMessage = (text, type = "error") => {
    setMessageStatus({ text, type });
    setTimeout(() => setMessageStatus({ text: "", type: "" }), 5000);
  };

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

      if (
        response.data.success &&
        Array.isArray(response.data.data?.components)
      ) {
        setComponents(response.data.data.components);
        setError("");
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

  const fetchComponentFields = async (componentId) => {
    try {
      const formData = new FormData();
      formData.append("action", "ccc_get_component_fields");
      formData.append("nonce", window.cccData.nonce);
      formData.append("component_id", componentId);

      const response = await axios.post(window.cccData.ajaxUrl, formData);

      if (response.data.success) {
        setComponentFields(prevFields => ({
          ...prevFields,
          [componentId]: response.data.data.fields || []
        }));
      } else {
        console.error("Failed to fetch fields:", response.data);
      }
    } catch (err) {
      console.error("Error fetching component fields:", err);
    }
  };

  const handleSubmit = async () => {
    if (!componentName) {
      setMessage("Please enter a component name", "error");
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
        setMessage(response.data.data?.message || "Component created successfully.", "success");
        fetchComponents();
        setShowPopup(false);
        setComponentName("");
        setHandle("");
      } else {
        setMessage(response.data.data?.message || "Failed to create component.", "error");
      }
    } catch (error) {
      console.error("Error creating component:", error);
      setMessage("Error connecting to server. Please try again.", "error");
    }
  };

  const toggleComponentExpand = (componentId) => {
    setExpandedComponents(prev => {
      const newState = { 
        ...prev, 
        [componentId]: !prev[componentId] 
      };
      
      // If expanding, fetch fields if we don't have them yet
      if (newState[componentId] && (!componentFields[componentId] || componentFields[componentId].length === 0)) {
        fetchComponentFields(componentId);
      }
      
      return newState;
    });
  };

  useEffect(() => {
    fetchComponents();
  }, []);

  const openFieldPopup = (componentId) => {
    setSelectedComponentId(componentId);
    setShowFieldPopup(true);
  };

  const handleFieldAdded = () => {
    // Refetch fields for the component that had a field added
    if (selectedComponentId) {
      fetchComponentFields(selectedComponentId);
    }
    setMessage("Field added successfully", "success");
  };

  return (
    <div className="p-6">
      {message.text && (
        <div
          className={`mb-4 px-4 py-2 rounded ${
            message.type === "success"
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Component Manager</h2>
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
      </div>

      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-2">Existing Components</h3>
        
        {loading ? (
          <p className="text-gray-500">Loading components...</p>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : components.length === 0 ? (
          <p>No components found. Create your first component above.</p>
        ) : (
          <div className="space-y-4">
            {components.map((comp) => (
              <div key={comp.id} className="bg-white p-4 rounded shadow border-l-4 border-blue-500">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <button 
                      onClick={() => toggleComponentExpand(comp.id)}
                      className="mr-2 text-gray-500 hover:text-gray-800 focus:outline-none"
                    >
                      {expandedComponents[comp.id] ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                    <div>
                      <strong className="text-lg">{comp.name}</strong>{" "}
                      <code className="text-sm bg-gray-100 px-1 rounded ml-2">{comp.handle_name}</code>
                    </div>
                  </div>
                  <button
                    onClick={() => openFieldPopup(comp.id)}
                    className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 transition text-sm"
                  >
                    Add Field
                  </button>
                </div>
                
                {expandedComponents[comp.id] && (
                  <div className="mt-4 pl-7">
                    <h4 className="text-sm font-medium text-gray-600 mb-2">Fields</h4>
                    {componentFields[comp.id]?.length > 0 ? (
                      <div className="bg-gray-50 p-3 rounded-md">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead>
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Label</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {componentFields[comp.id].map((field) => (
                              <tr key={field.id}>
                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{field.label}</td>
                                <td className="px-4 py-2 whitespace-nowrap text-sm font-mono text-gray-600">{field.name}</td>
                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                    {field.type}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No fields added yet</p>
                    )}
                    
                    {/* Post Type Selection */}
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-600 mb-2">Display Component On</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        <button
                          onClick={() => window.location.href = `admin.php?page=custom-craft-component-assign&component_id=${comp.id}`}
                          className="bg-blue-50 hover:bg-blue-100 text-blue-600 text-left px-3 py-2 rounded border border-blue-200 transition-colors flex items-center"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                          Assign to Pages/Posts
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
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
                // Auto-generate handle if not manually modified
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
                onClick={() => {
                  setShowPopup(false);
                  setComponentName("");
                  setHandle("");
                }}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
              >
                Save
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
          onFieldAdded={handleFieldAdded}
        />
      )}
    </div>
  );
};

export default ComponentList;