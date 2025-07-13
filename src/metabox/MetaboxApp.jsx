import React, { useState, useEffect } from 'react';
import ComponentList from './components/ComponentList';
import ComponentSelector from './components/ComponentSelector';
import toast from 'react-hot-toast';

function MetaboxApp() {
  const [components, setComponents] = useState([]); // Components assigned to this page
  const [isLoading, setIsLoading] = useState(true);
  const [showSelector, setShowSelector] = useState(false);
  const [availableComponents, setAvailableComponents] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

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

  // Save components via Ajax
  const saveComponents = async (componentsToSave) => {
    try {
      setIsSaving(true);
      const postId = getPostId();
      if (!postId) {
        console.error('CCC Metabox: No post ID available for saving');
        return false;
      }

      // Prepare components data (remove UI-only properties)
      const componentsData = componentsToSave.map(({ isHidden, ...rest }) => rest);

      const response = await fetch(cccData.ajaxUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          action: 'ccc_save_metabox_components',
          nonce: cccData.nonce,
          post_id: postId,
          components: JSON.stringify(componentsData)
        })
      });

      const data = await response.json();
      if (data.success) {
        console.log('CCC Metabox: Components saved successfully');
        return true;
      } else {
        console.error('CCC Metabox: Failed to save components:', data.message);
        toast.error('Failed to save components: ' + (data.message || 'Unknown error'));
        return false;
      }
    } catch (error) {
      console.error('CCC Metabox: Error saving components:', error);
      toast.error('Error saving components: ' + error.message);
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    loadAvailableComponents();
    loadAssignedComponents();
  }, []);

  // Add a new component (from selector) - ONLY via explicit selection
  const addComponent = async (component) => {
    if (!component || !component.id) {
      toast.error('Invalid component selected');
      return;
    }
    
    // Check if component is already added
    const existingComponent = components.find(c => c.id === component.id);
    if (existingComponent) {
      toast.error('This component is already added to this page');
      return;
    }
    
    const newComponent = {
      ...component,
      instance_id: `instance_${Date.now()}_${Math.floor(Math.random()*10000)}`,
      order: components.length,
      isHidden: false
    };
    const newComponents = [...components, newComponent];
    setComponents(newComponents);
    setShowSelector(false);
    
    // Save immediately
    const success = await saveComponents(newComponents);
    if (success) {
      toast.success(`Component "${component.name}" added successfully`);
    }
  };

  // Remove a component
  const removeComponent = async (instance_id) => {
    const componentToRemove = components.find(c => c.instance_id === instance_id);
    const newComponents = components.filter(c => c.instance_id !== instance_id);
    setComponents(newComponents);
    
    // Log the removal for debugging
    console.log('CCC Metabox: Removed component with instance_id:', instance_id);
    
    // Save immediately
    const success = await saveComponents(newComponents);
    if (success && componentToRemove) {
      toast.success(`Component "${componentToRemove.name}" removed successfully`);
    }
  };

  // Toggle hide/show for a component (UI only)
  const toggleHideComponent = (instance_id) => {
    setComponents(prev => prev.map(c =>
      c.instance_id === instance_id ? { ...c, isHidden: !c.isHidden } : c
    ));
  };

  // Update hidden input for backend save - but don't trigger automatic save
  useEffect(() => {
    const input = document.getElementById('ccc_components_data');
    if (input) {
      // Save all component data except isHidden (which is UI only)
      const toSave = components.map(({ isHidden, ...rest }) => rest);
      input.value = JSON.stringify(toSave);
      
      // Log for debugging
      console.log('CCC Metabox: Updated hidden input with', toSave.length, 'components for post', getPostId());
    }
  }, [components]);

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
      {/* Hidden input for backend save */}
      <input type="hidden" id="ccc_components_data" name="ccc_components_data" />
      {isSaving && (
        <div className="bg-blue-50 border-b border-blue-200 px-4 py-2 text-sm text-blue-700">
          Saving changes...
        </div>
      )}
      <ComponentList
        components={components}
        isReadOnly={false}
        onAdd={() => setShowSelector(true)}
        onRemove={removeComponent}
        onToggleHide={toggleHideComponent}
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