import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  
  // Use refs to access current values without causing re-renders
  const componentsRef = useRef(components);
  const fieldValuesRef = useRef(fieldValuesByInstance);
  
  // Keep refs in sync with state
  useEffect(() => {
    componentsRef.current = components;
  }, [components]);
  
  useEffect(() => {
    fieldValuesRef.current = fieldValuesByInstance;
  }, [fieldValuesByInstance]);

  // Ensure unsaved changes are tracked when a field value changes
  const handleFieldValuesChange = (values) => {
    setFieldValuesByInstance(values);
    setHasUnsavedChanges(true);
  };

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

  // Load expanded state from localStorage on mount
  useEffect(() => {
    const postId = getPostId();
    const stored = localStorage.getItem(`ccc_expanded_${postId}`);
    if (stored) {
      try {
        setExpandedComponentIds(JSON.parse(stored));
      } catch (e) {
        console.error('CCC: Failed to parse stored expanded state:', e);
      }
    }
  }, []);

  // Persist expanded state to localStorage on change
  useEffect(() => {
    const postId = getPostId();
    localStorage.setItem(`ccc_expanded_${postId}`, JSON.stringify(expandedComponentIds));
  }, [expandedComponentIds]);

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
        setFieldValuesByInstance({});
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
        const sortedComponents = sorted.map(c => ({ ...c, isHidden: c.isHidden ?? false, isPendingDelete: false }));
    setComponents(sortedComponents);
        
        // Set field values from the response
        if (data.data?.field_values) {
          setFieldValuesByInstance(data.data.field_values);
        }
      } else {
        setComponents([]);
        setFieldValuesByInstance({});
      }
    } catch (error) {
      setComponents([]);
      setFieldValuesByInstance({});
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

  // Save field values to database
  const saveFieldValues = async (fieldValuesData) => {
    try {
      const postId = getPostId();
      const response = await fetch(cccData.ajaxUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          action: 'ccc_save_field_values',
          nonce: cccData.nonce,
          post_id: postId,
          field_values: JSON.stringify(fieldValuesData)
        })
      });

      const data = await response.json();
      if (data.success) {
        console.log('Field values saved successfully');
        return true;
      } else {
        console.error('Failed to save field values:', data.message);
        return false;
      }
    } catch (error) {
      console.error('Error saving field values:', error);
      return false;
    }
  };

  useEffect(() => {
    const initializeData = async () => {
      await loadAvailableComponents();
      await loadAssignedComponents();
    };
    initializeData();
  }, []); // Empty dependency array to run only once

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
    
    // Auto-expand newly added components
    const newInstanceIds = newComponents.map(c => c.instance_id);
    setExpandedComponentIds(prev => [...prev, ...newInstanceIds]);
    
    const updatedComponents = [...components, ...newComponents];
    setComponents(updatedComponents);
    setHasUnsavedChanges(true);
    setDropdownOpen(false);
  };

  // Remove component from UI immediately, only delete from DB on save
  const markComponentForDelete = (instance_id) => {
    setComponents(prev => prev.filter(c => c.instance_id !== instance_id));
    setHasUnsavedChanges(true);
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

  // Remove component from UI immediately, only delete from DB on save
  const removeComponent = (instance_id) => {
    setComponents(prev => prev.filter(c => c.instance_id !== instance_id));
    setHasUnsavedChanges(true);
  };

  // Save on page update (WordPress save)
  const handleFormSubmit = useCallback((e) => {
    // Do NOT call e.preventDefault() here
    // Force TinyMCE to update all textareas
    if (window.tinymce && window.tinymce.triggerSave) {
      window.tinymce.triggerSave();
    }
    // --- Sync all WYSIWYG field values from DOM to local variable ---
    const wysiwygTextareas = document.querySelectorAll('textarea[id^="wysiwyg_"]');
    let fieldValuesToSubmit = fieldValuesRef.current;
    if (wysiwygTextareas.length > 0) {
      const updatedFieldValues = { ...fieldValuesRef.current };
      wysiwygTextareas.forEach(textarea => {
        const idParts = textarea.id.split('_');
        // id format: wysiwyg_{instance_id}_{field_id}
        const instance_id = idParts.slice(1, -1).join('_');
        const field_id = idParts[idParts.length - 1];
        if (!updatedFieldValues[instance_id]) updatedFieldValues[instance_id] = {};
        updatedFieldValues[instance_id][field_id] = textarea.value;
      });
      fieldValuesToSubmit = updatedFieldValues;
    }
    // Build componentsToSubmit from the current UI (not React state)
    let componentsToSubmit = [];
    if (Array.isArray(componentsRef.current)) {
      componentsToSubmit = componentsRef.current.filter(c => !c.isPendingDelete).map(({ isPendingDelete, ...rest }) => rest);
    }
    // Set components hidden input
    const input = document.getElementById('ccc_components_data');
    if (input) {
      input.value = JSON.stringify(componentsToSubmit);
    }
    // Set field values hidden input
    const fieldValuesInput = document.getElementById('ccc_field_values');
    if (fieldValuesInput) {
      fieldValuesInput.value = JSON.stringify(fieldValuesToSubmit);
    }
    // Let the browser handle the form submission as normal
  }, []); // No dependencies needed since we use refs

  useEffect(() => {
    const form = document.querySelector('form#post');
    if (!form) return;
    
    form.addEventListener('submit', handleFormSubmit);
    return () => form.removeEventListener('submit', handleFormSubmit);
  }, [handleFormSubmit]);

  if (isLoading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-8">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="relative">
            <div className="w-12 h-12 border-4 border-gray-200 border-t-pink-500 rounded-full animate-spin mb-6"></div>
            <div className="absolute inset-0 w-12 h-12 border-4 border-transparent border-r-blue-500 rounded-full animate-spin" style={{ animationDelay: '-0.5s' }}></div>
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Loading Components</h3>
          <p className="text-gray-600 text-sm">Please wait while we load your page components...</p>
          <div className="mt-4 flex space-x-1">
            <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-0">
      {/* Hidden input for backend save */}
      <input type="hidden" id="ccc_components_data" name="ccc_components_data" />
      <input type="hidden" id="ccc_field_values" name="ccc_field_values" />
      {isSaving && (
        <div className="bg-blue-50 border-b border-blue-200 px-4 py-2 text-sm text-blue-700 flex items-center">
          <div className="w-4 h-4 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin mr-2"></div>
          Saving changes...
        </div>
      )}
      <ComponentList
        components={components}
        isReadOnly={false}
        onAdd={() => setDropdownOpen((open) => !open)}
        onRemove={markComponentForDelete}
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
        onFieldValuesChange={handleFieldValuesChange}
        fieldValuesByInstance={fieldValuesByInstance}
        postId={getPostId()}
      />
    </div>
  );
}

export default MetaboxApp;