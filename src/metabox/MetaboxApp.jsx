import React, { useState, useEffect } from 'react';
import ComponentList from './components/ComponentList';
import ComponentSelector from './components/ComponentSelector';
import toast from 'react-hot-toast';

function MetaboxApp() {
  console.log('CCC DEBUG: MetaboxApp function running');
  const [components, setComponents] = useState([]); // { ...component, isHidden, isPendingDelete }
  const [isLoading, setIsLoading] = useState(true);
  const [availableComponents, setAvailableComponents] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [expandedComponentIds, setExpandedComponentIds] = useState([]); // for expand/collapse
  const [dropdownOpen, setDropdownOpen] = useState(false); // for add dropdown
  const [fieldValuesByInstance, setFieldValuesByInstance] = useState({});

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
        // Add isHidden and isPendingDelete property for UI, and sort by order
        const sorted = [...data.data.components].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        setComponents(sorted.map(c => ({ ...c, isHidden: c.isHidden ?? false, isPendingDelete: false })));
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
      // Prepare components data (remove only isPendingDelete, keep isHidden and order)
      const componentsData = componentsToSave
        .filter(c => !c.isPendingDelete)
        .map(({ isPendingDelete, ...rest }) => rest);
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

  // Add new component(s) (from dropdown)
  const addComponent = (componentOrArray) => {
    const toAdd = Array.isArray(componentOrArray) ? componentOrArray : [componentOrArray];
    const newComponents = toAdd.map((component, idx) => ({
      ...component,
      instance_id: `instance_${Date.now()}_${Math.floor(Math.random()*10000)}_${idx}`,
      order: components.length + idx,
      isHidden: false, // ensure visible by default
      isPendingDelete: false
    }));
    setComponents([...components, ...newComponents]);
    setHasUnsavedChanges(true);
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
    // Update the order property to match the new array order
    const reordered = newOrder.map((c, idx) => ({
      ...c,
      order: idx
    }));
    setComponents(reordered);
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

  // Load field values for assigned components
  const loadFieldValues = async (components) => {
    const postId = getPostId();
    if (!postId || !components.length) return;
    const result = {};
    for (const comp of components) {
      // Fetch all fields for this component instance
      const response = await fetch(cccData.ajaxUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          action: 'ccc_get_component_fields',
          nonce: cccData.nonce,
          component_id: comp.id,
          post_id: postId,
          instance_id: comp.instance_id
        })
      });
      const data = await response.json();
      if (data.success && Array.isArray(data.data)) {
        result[comp.instance_id] = {};
        data.data.forEach(field => {
          result[comp.instance_id][field.name] = field.value || '';
        });
      }
    }
    setFieldValuesByInstance(result);
  };

  // After loading assigned components, load their field values
  useEffect(() => {
    if (components.length > 0) {
      loadFieldValues(components);
      // Expand the first component by default
      setExpandedComponentIds([components[0].instance_id]);
    }
  }, [components]);

  // Save on page update (WordPress save)
  useEffect(() => {
    const form = document.querySelector('form#post');
    console.log('CCC DEBUG: useEffect for form submit, form:', form);
    if (!form) return;
    const handleSubmit = (e) => {
      // Save only if there are unsaved changes
      if (hasUnsavedChanges) {
        saveComponents(components);
        // Save field values
        const postId = getPostId();
        if (postId && Object.keys(fieldValuesByInstance).length > 0) {
          console.log('CCC DEBUG: Saving field values payload:', fieldValuesByInstance);
          fetch(cccData.ajaxUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
              action: 'ccc_save_field_values',
              nonce: cccData.nonce,
              post_id: postId,
              ccc_field_values: JSON.stringify(fieldValuesByInstance)
            })
          });
        }
      }
    };
    form.addEventListener('submit', handleSubmit);
    return () => form.removeEventListener('submit', handleSubmit);
  }, [components, hasUnsavedChanges, fieldValuesByInstance]);

  // Update hidden input for backend save - but don't trigger automatic save
  useEffect(() => {
    const input = document.getElementById('ccc_components_data');
    if (input) {
      // Save all component data except isPendingDelete (which is UI only)
      const toSave = components.filter(c => !c.isPendingDelete).map(({ isPendingDelete, ...rest }) => rest);
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
        onFieldValuesChange={setFieldValuesByInstance}
        fieldValuesByInstance={fieldValuesByInstance}
      />
    </div>
  );
}

export default MetaboxApp; 