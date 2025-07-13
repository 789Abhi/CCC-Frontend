import React, { useState, useEffect } from 'react';
import ComponentList from './components/ComponentList';
import ComponentSelector from './components/ComponentSelector';

function MetaboxApp() {
  const [components, setComponents] = useState([]); // Components assigned to this page
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

  // Load assigned components for this post from backend
  const loadAssignedComponents = async () => {
    try {
      setIsLoading(true);
      const postId = getPostId();
      if (!postId) {
        setComponents([]);
        setIsLoading(false);
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
      if (data.success && Array.isArray(data.data?.components)) {
        // Add isHidden property for UI
        setComponents(data.data.components.map(c => ({ ...c, isHidden: false })));
      } else {
        setComponents([]);
      }
    } catch (error) {
      setComponents([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAvailableComponents();
    loadAssignedComponents();
  }, []);

  // Add a new component (from selector)
  const addComponent = (component) => {
    if (!component || !component.id) return;
    const newComponent = {
      ...component,
      instance_id: `instance_${Date.now()}_${Math.floor(Math.random()*10000)}`,
      order: components.length,
      isHidden: false
    };
    setComponents(prev => [...prev, newComponent]);
    setShowSelector(false);
  };

  // Remove a component
  const removeComponent = (instance_id) => {
    setComponents(prev => prev.filter(c => c.instance_id !== instance_id));
  };

  // Toggle hide/show for a component (UI only)
  const toggleHideComponent = (instance_id) => {
    setComponents(prev => prev.map(c =>
      c.instance_id === instance_id ? { ...c, isHidden: !c.isHidden } : c
    ));
  };

  // Metabox is read-only - no need to update hidden inputs

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
        isReadOnly={true}
        onAdd={() => {}} // Disabled
        onRemove={() => {}} // Disabled
        onToggleHide={() => {}} // Disabled
      />
      {/* Component selector is disabled in read-only mode */}
    </div>
  );
}

export default MetaboxApp; 