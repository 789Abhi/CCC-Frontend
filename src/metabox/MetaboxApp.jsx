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
    
    // Auto-expand newly added components
    const newInstanceIds = newComponents.map(c => c.instance_id);
    setExpandedComponentIds(prev => [...prev, ...newInstanceIds]);
    
    setComponents([...components, ...newComponents]);
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
  useEffect(() => {
    const form = document.querySelector('form#post');
    if (!form) return;
    const handleSubmit = async (e) => {
      // Force update hidden input with current components (excluding deleted)
      const input = document.getElementById('ccc_components_data');
      if (input) {
        const toSave = components.filter(c => !c.isPendingDelete).map(({ isPendingDelete, ...rest }) => rest);
        input.value = JSON.stringify(toSave);
      }
      // Validate required fields before save
      let hasError = false;
      const requiredFields = [];
      
      console.log('CCC DEBUG: Starting validation with fieldValuesByInstance:', fieldValuesByInstance);
      
      // Check each component for required fields
      for (const comp of components) {
        if (comp.isPendingDelete) continue; // Skip deleted components
        
        // Get field values for this component instance
        const instanceFields = fieldValuesByInstance[comp.instance_id] || {};
        console.log(`CCC DEBUG: Component ${comp.name} (${comp.instance_id}) has fields:`, instanceFields);
        
        // We need to fetch the actual fields for this component to check required status
        try {
          const response = await fetch(cccData.ajaxUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
              action: 'ccc_get_component_fields',
              nonce: cccData.nonce,
              component_id: comp.id,
              post_id: getPostId(),
              instance_id: comp.instance_id
            })
          });
          const data = await response.json();
          
          if (data.success && Array.isArray(data.fields)) {
            data.fields.forEach(field => {
              if (field.required) {
                // Use the current field value from the form, not the server value
                const currentValue = instanceFields[field.name] || '';
                console.log(`CCC DEBUG: Required field ${field.name} has value: "${currentValue}"`);
                requiredFields.push({
                  instance_id: comp.instance_id,
                  field_name: field.name,
                  label: field.label,
                  value: currentValue
                });
              }
            });
          }
        } catch (error) {
          console.error('CCC: Error fetching fields for validation:', error);
        }
      }
      
      console.log('CCC DEBUG: All required fields found:', requiredFields);
      const missing = requiredFields.filter(f => !f.value.trim());
      console.log('CCC DEBUG: Missing required fields:', missing);
      
      if (missing.length > 0) {
        hasError = true;
        const missingLabels = missing.map(f => f.label).join(', ');
        toast.error(`Please fill all required fields before saving: ${missingLabels}`);
      }
      
      if (hasError) {
        e.preventDefault(); // Prevent form submission
      } else {
        // If no errors, proceed with saving
        const form = document.querySelector('form#post');
        if (form) {
          const input = document.getElementById('ccc_components_data');
          if (input) {
            const toSave = components.filter(c => !c.isPendingDelete).map(({ isPendingDelete, ...rest }) => rest);
            input.value = JSON.stringify(toSave);
          }
          // Save field values
          const fieldValuesInput = document.getElementById('ccc_field_values_data');
          if (fieldValuesInput) {
            const fieldValuesToSave = Object.entries(fieldValuesByInstance).map(([instance_id, values]) => ({
              instance_id,
              field_values: JSON.stringify(values)
            }));
            fieldValuesInput.value = JSON.stringify(fieldValuesToSave);
          }
          // Trigger the save action
          const saveButton = document.querySelector('button[type="submit"]');
          if (saveButton) {
            saveButton.click();
          }
        }
      }
    };
    form.addEventListener('submit', handleSubmit);
    return () => form.removeEventListener('submit', handleSubmit);
  }, [components, fieldValuesByInstance]);

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