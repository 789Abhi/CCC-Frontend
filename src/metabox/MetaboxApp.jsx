import React, { useState, useEffect } from 'react';
import ComponentList from './components/ComponentList';
import ComponentSelector from './components/ComponentSelector';
import toast from 'react-hot-toast';

function MetaboxApp() {
  const [components, setComponents] = useState([]); // { ...component, isHidden, isPendingDelete }
  const [isLoading, setIsLoading] = useState(true);
  const [availableComponents, setAvailableComponents] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [expandedComponentIds, setExpandedComponentIds] = useState([]); // for expand/collapse
  const [dropdownOpen, setDropdownOpen] = useState(false); // for add dropdown

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
        // Add isHidden and isPendingDelete property for UI
        setComponents(data.data.components.map(c => ({ ...c, isHidden: false, isPendingDelete: false })));
      } else {
        setComponents([]);
      }
    } catch (error) {
      setComponents([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Save components via Ajax (called only on page update)
  const saveComponents = async (componentsToSave) => {
    try {
      setIsSaving(true);
      const postId = getPostId();
      if (!postId) {
        console.error('CCC Metabox: No post ID available for saving');
        return false;
      }
      // Prepare components data (remove UI-only properties and pending deletes)
      const componentsData = componentsToSave
        .filter(c => !c.isPendingDelete)
        .map(({ isHidden, isPendingDelete, ...rest }) => rest);
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
        setHasUnsavedChanges(false);
        toast.success('Components saved successfully');
        return true;
      } else {
        toast.error('Failed to save components: ' + (data.message || 'Unknown error'));
        return false;
      }
    } catch (error) {
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

  // Add new component (from dropdown)
  const addComponent = (component) => {
    if (!component) return;
    const newComponent = {
      ...component,
      instance_id: `instance_${Date.now()}_${Math.floor(Math.random()*10000)}`,
      order: components.length,
      isHidden: false, // ensure visible by default
      isPendingDelete: false
    };
    setComponents([...components, newComponent]);
    setHasUnsavedChanges(true);
    // Do NOT expand by default
    setDropdownOpen(false);
  };

  // Mark a component for deletion (deferred)
  const markComponentForDelete = (instance_id) => {
    setComponents(prev => prev.map(c =>
      c.instance_id === instance_id ? { ...c, isPendingDelete: true } : c
    ));
    setHasUnsavedChanges(true);
    // Remove from expanded/active if deleted
    setExpandedComponentIds(prev => prev.filter(id => id !== instance_id));
  };

  // Undo delete
  const undoDelete = (instance_id) => {
    setComponents(prev => prev.map(c =>
      c.instance_id === instance_id ? { ...c, isPendingDelete: false } : c
    ));
    setHasUnsavedChanges(true);
  };

  // Drag-and-drop reorder handler
  const reorderComponents = (newOrder) => {
    setComponents(newOrder);
    setHasUnsavedChanges(true);
  };

  // Expand/collapse handler
  const toggleExpand = (instance_id) => {
    setExpandedComponentIds(prev =>
      prev.includes(instance_id)
        ? prev.filter(id => id !== instance_id)
        : [...prev, instance_id]
    );
  };
  // Set active handler
  const setActive = (instance_id) => {
    // This function is no longer needed as there's no active component state
  };

  // Remove component from UI immediately, only delete from DB on save
  const removeComponent = (instance_id) => {
    setComponents(prev => prev.filter(c => c.instance_id !== instance_id));
    setHasUnsavedChanges(true);
  };

  // Save on page update (WordPress save)
  useEffect(() => {
    const form = document.querySelector('form#post');
    if (!form) return;
    const handleSubmit = (e) => {
      // Save only if there are unsaved changes
      if (hasUnsavedChanges) {
        saveComponents(components);
      }
    };
    form.addEventListener('submit', handleSubmit);
    return () => form.removeEventListener('submit', handleSubmit);
  }, [components, hasUnsavedChanges]);

  // Update hidden input for backend save - but don't trigger automatic save
  useEffect(() => {
    const input = document.getElementById('ccc_components_data');
    if (input) {
      // Save all component data except isHidden/isPendingDelete (which are UI only)
      const toSave = components.filter(c => !c.isPendingDelete).map(({ isHidden, isPendingDelete, ...rest }) => rest);
      input.value = JSON.stringify(toSave);
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
        onAdd={() => setDropdownOpen((open) => !open)}
        onRemove={removeComponent}
        onUndoDelete={undoDelete}
        onToggleHide={(instance_id) => {
          setComponents(prev => prev.map(c =>
            c.instance_id === instance_id ? { ...c, isHidden: !c.isHidden } : c
          ));
          setHasUnsavedChanges(true);
        }}
        onReorder={reorderComponents}
        expandedComponentIds={expandedComponentIds}
        onToggleExpand={toggleExpand}
        dropdownOpen={dropdownOpen}
        setDropdownOpen={setDropdownOpen}
        availableComponents={availableComponents}
        addComponent={addComponent}
      />
    </div>
  );
}

export default MetaboxApp; 