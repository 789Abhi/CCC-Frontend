import React, { useState, useEffect } from "react";
import axios from "axios";
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
  const [selectedPage, setSelectedPage] = useState("");
  const [pages, setPages] = useState([]);
  const [fieldValues, setFieldValues] = useState({});

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

  const fetchPages = async () => {
    try {
      const response = await axios.post(window.cccData.ajaxUrl, {
        action: "ccc_get_pages",
        nonce: window.cccData.nonce,
      });
      if (response.data.success) {
        setPages(response.data.data.pages);
      }
    } catch (err) {
      console.error("Error fetching pages:", err);
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

  const openFieldPopup = (componentId) => {
    console.log("Opening field popup for component ID:", componentId);
    setSelectedComponentId(componentId);
    setShowFieldPopup(true);
  };

  const handleFieldValueChange = (fieldId, value) => {
    setFieldValues((prev) => ({
      ...prev,
      [fieldId]: value,
    }));
  };

  const saveFieldValues = async () => {
    for (const [fieldId, value] of Object.entries(fieldValues)) {
      try {
        const response = await axios.post(window.cccData.ajaxUrl, {
          action: "ccc_save_field_value",
          nonce: window.cccData.nonce,
          field_id: fieldId,
          post_id: selectedPage,
          value: value,
        });

        if (!response.data.success) {
          console.error("Failed to save field value:", response.data.data?.message);
        }
      } catch (err) {
        console.error("Error saving field value:", err);
      }
    }
    setFieldValues({});
  };

  useEffect(() => {
    fetchComponents();
    fetchPages();
  }, []);

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
                  <button
                    onClick={() => openFieldPopup(comp.id)}
                    className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition"
                  >
                    Add Field
                  </button>
                </div>

                {/* Display Fields for the Component */}
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-600 mb-2">Fields</h4>
                  {comp.fields && comp.fields.length > 0 ? (
                    <div>
                      {comp.fields.map((field) => (
                        <div key={field.id} className="mb-2">
                          <label className="block text-gray-700">{field.label}</label>
                          <input
                            type="text"
                            placeholder={`Enter ${field.label}`}
                            value={fieldValues[field.id] || ""}
                            onChange={(e) => handleFieldValueChange(field.id, e.target.value)}
                            className="w-full border border-gray-300 rounded p-2"
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p>No fields added yet.</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-2">Assign Component to Page/Post</h3>
        <select
          value={selectedPage}
          onChange={(e) => setSelectedPage(e.target.value)}
          className="border border-gray-300 rounded p-2 mb-4"
        >
          <option value="">Select a Page/Post</option>
          {pages.map((page) => (
            <option key={page.id} value={page.id}>
              {page.title}
            </option>
          ))}
        </select>
        <button
          onClick={saveFieldValues}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
        >
          Save Field Values
        </button>
      </div>

      {showPopup && (
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
