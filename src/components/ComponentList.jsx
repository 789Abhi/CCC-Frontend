import React, { useState, useEffect } from "react";
import axios from "axios";
import FieldPopup from "./FieldPopup"; // import your popup component

const ComponentList = () => {
  const [showPopup, setShowPopup] = useState(false);
  const [componentName, setComponentName] = useState("");
  const [handle, setHandle] = useState("");
  const [components, setComponents] = useState([]);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  const [showFieldPopup, setShowFieldPopup] = useState(false);
  const [selectedComponentId, setSelectedComponentId] = useState(null);

  const generateHandle = (name) => {
    return name.toLowerCase().replace(/\s+/g, "_").replace(/[^\w_]+/g, "");
  };

  const fetchComponents = async () => {
    try {
      if (typeof window.cccData === "undefined") {
        throw new Error("cccData is not defined.");
      }

      const response = await axios.post(
        window.cccData.ajaxUrl,
        new URLSearchParams({
          action: "ccc_get_components",
          nonce: window.cccData.nonce,
        })
      );

      if (
        response.data.success &&
        Array.isArray(response.data.data?.components)
      ) {
        setComponents(response.data.data.components);
      } else {
        setComponents([]);
      }
    } catch (err) {
      console.error("Failed to fetch components", err);
    }
  };

  const handleSubmit = async () => {
    if (!componentName) return;

    if (typeof window.cccData === "undefined") {
      console.error("cccData is not defined.");
      return;
    }

    const payload = {
      action: "ccc_create_component",
      name: componentName,
      handle: generateHandle(componentName),
      nonce: window.cccData.nonce,
    };

    try {
      const response = await axios.post(
        window.cccData.ajaxUrl,
        new URLSearchParams(payload)
      );

      if (response.data.success) {
        setMessage(response.data.message || "Component created.");
        setMessageType("success");
        fetchComponents(); // refresh list
        setShowPopup(false);
        setComponentName("");
        setHandle("");
      } else {
        setMessage(response.data.message || "Failed to create component.");
        setMessageType("error");
      }
    } catch (error) {
      setMessage("Error creating component.");
      setMessageType("error");
    }

    setTimeout(() => {
      setMessage("");
      setMessageType("");
    }, 3000);
  };

  useEffect(() => {
    fetchComponents();
  }, []);

  const openFieldPopup = (componentId) => {
    setSelectedComponentId(componentId);
    setShowFieldPopup(true);
  };

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

      {/* Component List */}
      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-2 text-gray-800">
          Existing Components
        </h3>
        {components.length === 0 ? (
          <p className="text-gray-500">No components found.</p>
        ) : (
          <ul className="space-y-3">
            {components.map((comp, index) => (
              <li key={index} className="text-gray-800">
                <div className="flex items-center justify-between">
                  <div>
                    <strong>{comp.name}</strong> —{" "}
                    <code>{comp.handle_name}</code>
                  </div>
                  <button
                    onClick={() => openFieldPopup(comp.id)}
                    className="bg-blue-500 text-white px-3 py-1 rounded"
                  >
                    Add Field
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Component Creation Popup */}
      {showPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4 text-gray-800">
              Create New Component
            </h3>
            <input
              type="text"
              value={componentName}
              placeholder="Component Name"
              onChange={(e) => {
                const value = e.target.value;
                setComponentName(value);
                setHandle(generateHandle(value));
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
            />
            <p className="text-sm text-gray-600 mb-4">
              Handle: <span className="font-mono text-black">{handle}</span>
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

      {/* FieldPopup */}
      {showFieldPopup && selectedComponentId && (
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
