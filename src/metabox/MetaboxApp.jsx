import React, { useState, useEffect } from 'react';
import ComponentList from './components/ComponentList';
import ComponentSelector from './components/ComponentSelector';

function MetaboxApp() {
  const [components, setComponents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showSelector, setShowSelector] = useState(false);

  // Get post ID from WordPress
  const getPostId = () => {
    // Try to get from cccData first
    if (typeof cccData !== 'undefined' && cccData.postId) {
      return cccData.postId;
    }
    
    // Try to get from data attribute
    const metaboxRoot = document.getElementById('ccc-metabox-root');
    if (metaboxRoot && metaboxRoot.dataset.postId) {
      return parseInt(metaboxRoot.dataset.postId);
    }
    
    return 0;
  };

  // Load assigned components for this post
  const loadAssignedComponents = async () => {
    try {
      setIsLoading(true);
      const postId = getPostId();
      
      if (!postId) {
        setComponents([]);
        return;
      }

      const response = await fetch(cccData.ajaxUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          action: 'ccc_get_posts_with_components',
          nonce: cccData.nonce,
          post_id: postId
        })
      });

      const data = await response.json();
      
      if (data.success && data.data.components) {
        setComponents(data.data.components);
      } else {
        setComponents([]);
      }
    } catch (error) {
      setComponents([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Add a new component
  const addComponent = (component) => {
    const newComponent = {
      ...component,
      instance_id: `instance_${Date.now()}`,
      order: components.length
    };
    
    setComponents(prev => [...prev, newComponent]);
    setShowSelector(false);
    saveComponents([...components, newComponent]);
  };

  // Save components to backend
  const saveComponents = async (componentsToSave) => {
    try {
      const postId = getPostId();
      await fetch(cccData.ajaxUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          action: 'ccc_save_component_assignments',
          nonce: cccData.nonce,
          post_id: postId,
          components: JSON.stringify(componentsToSave)
        })
      });
    } catch (error) {}
  };

  // Remove a component
  const removeComponent = (index) => {
    const updatedComponents = components.filter((_, i) => i !== index);
    setComponents(updatedComponents);
    saveComponents(updatedComponents);
  };

  // Reorder components (for drag and drop)
  const reorderComponents = (newOrder) => {
    const reorderedComponents = newOrder.map((id, index) => {
      const component = components.find(c => c.instance_id === id);
      return { ...component, order: index };
    });
    setComponents(reorderedComponents);
    saveComponents(reorderedComponents);
  };

  useEffect(() => {
    loadAssignedComponents();
  }, []);

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
        onRemove={removeComponent}
        onReorder={reorderComponents}
        onAdd={() => setShowSelector(true)}
      />
      {showSelector && (
        <ComponentSelector
          onSelect={addComponent}
          onClose={() => setShowSelector(false)}
        />
      )}
    </div>
  );
}

export default MetaboxApp; 