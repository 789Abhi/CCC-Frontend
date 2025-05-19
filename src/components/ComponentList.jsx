import React, { useState, useEffect } from "react";
import axios from "axios";
import FieldPopup from "./FieldPopup"; // Assumes FieldPopup is a modal component for field creation

const ComponentList = () => {
  const [showPopup, setShowPopup] = useState(false);
  const [componentName, setComponentName] = useState("");
  const [handle, setHandle] = useState("");
  const [components, setComponents] = useState([]);
  const [selectedComponentId, setSelectedComponentId] = useState(null);

  const fetchComponents = async () => {
    try {
      const response = await axios.post(cccData.ajaxUrl, {
        action: "ccc_get_components",
        nonce: cccData.nonce,
      });
      if (response.data.success) {
        setComponents(response.data.components);
      } else {
        console.error(response.data.message);
      }
    } catch (error) {
      console.error("Error fetching components:", error);
    }
  };

  const handleCreateComponent = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(cccData.ajaxUrl, {
        action: "ccc_create_component",
        nonce: cccData.nonce,
        name: componentName,
        handle: handle || componentName,
      });

      if (response.data.success) {
        setComponentName("");
        setHandle("");
        fetchComponents();
      } else {
        console.error(response.data.message);
      }
    } catch (error) {
      console.error("Component creation failed:", error);
    }
  };

  const openPopup = (componentId) => {
    setSelectedComponentId(componentId);
    setShowPopup(true);
  };

  const closePopup = () => {
    setSelectedComponentId(null);
    setShowPopup(false);
    fetchComponents(); // refresh components after new field added
  };

  useEffect(() => {
    fetchComponents();
  }, []);

  return (
    <div className="component-list">
      <h2>Create New Component</h2>
      <form onSubmit={handleCreateComponent}>
        <input
          type="text"
          placeholder="Component Name"
          value={componentName}
          onChange={(e) => setComponentName(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Handle (optional)"
          value={handle}
          onChange={(e) => setHandle(e.target.value)}
        />
        <button type="submit">Create Component</button>
      </form>

      <h3>Existing Components</h3>
      {components.length === 0 ? (
        <p>No components found.</p>
      ) : (
        <ul>
          {components.map((component) => (
            <li key={component.id}>
              <strong>{component.name}</strong> ({component.handle_name})
              <button onClick={() => openPopup(component.id)}>+ Add Field</button>
              {component.fields && component.fields.length > 0 && (
                <ul>
                  {component.fields.map((field) => (
                    <li key={field.id}>
                      {field.label} ({field.type})
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}

      {showPopup && (
        <FieldPopup
          componentId={selectedComponentId}
          onClose={closePopup}
        />
      )}
    </div>
  );
};

export default ComponentList;
