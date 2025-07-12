import React, { useState, useEffect } from 'react';
import ComponentList from './components/ComponentList';
import ComponentSelector from './components/ComponentSelector';

function MetaboxApp() {
  const [components, setComponents] = useState([]); // Only user-added components
  const [isLoading, setIsLoading] = useState(true);
  const [showSelector, setShowSelector] = useState(false);
  const [availableComponents, setAvailableComponents] = useState([]);

  // Get post ID from WordPress
  const getPostId = () => {
    if (typeof cccData !== 'undefined' && cccData.postId) {
      return cccData.postId;
    }
    const metaboxRoot = document.getElementById('ccc-metabox-root');
    if (metaboxRoot && metaboxRoot.dataset.postId) {
      return parseInt(metaboxRoot.dataset.postId);
    }
    return 0;
  };

  // Load all available components from the plugin (not assigned, but all created)
  const loadAvailableComponents = async () => {
    try {
      const response = await fetch(cccData.ajaxUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          action: 'ccc_get_components',
          nonce: cccData.nonce
        })
      });
      const data = await response.json();
      if (data.success && Array.isArray(data.data)) {
        setAvailableComponents(data.data);
      } else {
        setAvailableComponents([]);
      }
    } catch (error) {
      setAvailableComponents([]);
    }
  };

  useEffect(() => {
    setIsLoading(false);
    loadAvailableComponents();
  }, []);

  // Add a new component (from selector)
  const addComponent = (component) => {
    if (!component || !component.id) return;
    const newComponent = {
      ...component,
      instance_id: `instance_${Date.now()}`,
      order: components.length
    };
    setComponents(prev => [...prev, newComponent]);
    setShowSelector(false);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin mb-4"></div>
        <p className="text-gray-600">Loading components...</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-0">
      <ComponentList 
        components={components}
        isReadOnly={false}
        onAdd={() => setShowSelector(true)}
      />
      {showSelector && (
        <ComponentSelector
          availableComponents={availableComponents}
          onSelect={addComponent}
          onClose={() => setShowSelector(false)}
        />
      )}
    </div>
  );
}

export default MetaboxApp; 