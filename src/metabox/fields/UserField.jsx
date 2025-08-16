import React, { useState, useEffect, useCallback } from 'react';

function UserField({ 
  label, 
  value, 
  onChange, 
  multiple = false, 
  required = false, 
  error,
  roleFilter = [],
  returnType = 'id'
}) {
  console.log('UserField: Component rendered with props:', { label, value, multiple, required, roleFilter, returnType });
  console.log('UserField: Current value:', value);
  console.log('UserField: Value type:', typeof value);
  
  // Access global cccData
  const cccData = window.cccData;
  
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [localValue, setLocalValue] = useState(() => {
    if (multiple) {
      // Handle case where value might be a JSON string
      if (typeof value === 'string' && value.startsWith('[') && value.endsWith(']')) {
        try {
          const parsed = JSON.parse(value);
          return Array.isArray(parsed) ? parsed : [];
        } catch (e) {
          console.warn('UserField: Failed to parse JSON value:', value, e);
          return [];
        }
      }
      return Array.isArray(value) ? value : (value ? [value] : []);
    } else {
      return value || '';
    }
  });

  // Update local value when prop changes
  useEffect(() => {
    if (multiple) {
      // Handle case where value might be a JSON string
      if (typeof value === 'string' && value.startsWith('[') && value.endsWith(']')) {
        try {
          const parsed = JSON.parse(value);
          setLocalValue(Array.isArray(parsed) ? parsed : []);
        } catch (e) {
          console.warn('UserField: Failed to parse JSON value:', value, e);
          setLocalValue([]);
        }
      } else {
        setLocalValue(Array.isArray(value) ? value : (value ? [value] : []));
      }
    } else {
      setLocalValue(value || '');
    }
  }, [value, multiple]);

  // Load users from WordPress
  const loadUsers = useCallback(async () => {
    console.log('UserField: Loading users...');
    console.log('UserField: cccData available:', typeof cccData !== 'undefined');
    
    if (typeof cccData === 'undefined') {
      console.error('UserField: cccData is not available');
      setErrorMessage('cccData not available - cannot load users');
      return;
    }
    
    setIsLoading(true);
    setErrorMessage('');
    
    try {
      const requestBody = new URLSearchParams({
        action: 'ccc_get_users',
        nonce: cccData.nonce,
        role_filter: JSON.stringify(roleFilter)
      });
      
      console.log('UserField: Making AJAX request to:', cccData.ajaxUrl);
      console.log('UserField: Request body:', requestBody.toString());
      console.log('UserField: Nonce being sent:', cccData.nonce);
      
      const response = await fetch(cccData.ajaxUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: requestBody
      });
      
      console.log('UserField: Response status:', response.status);
      console.log('UserField: Response headers:', response.headers);
      
      const data = await response.json();
      console.log('UserField: Response data:', data);
      console.log('UserField: Response data type:', typeof data);
      console.log('UserField: Response data.data:', data.data);
      console.log('UserField: Response data.data type:', typeof data.data);
      console.log('UserField: Response data.data is array:', Array.isArray(data.data));
      console.log('UserField: Response data.data.data:', data.data?.data);
      console.log('UserField: Response data.data.data is array:', Array.isArray(data.data?.data));
      
      // Handle nested response structure from WordPress
      let usersArray = null;
      if (data.data && Array.isArray(data.data)) {
        usersArray = data.data;
      } else if (data.data && data.data.data && Array.isArray(data.data.data)) {
        usersArray = data.data.data;
      }
      
      if (usersArray) {
        setUsers(usersArray);
        console.log('UserField: Users loaded successfully:', usersArray.length);
      } else {
        console.error('UserField: Failed to load users - unexpected response structure:', data);
        setErrorMessage('Failed to load users - unexpected response structure');
      }
    } catch (error) {
      console.error('Error loading users:', error);
      setErrorMessage('Error connecting to server');
    } finally {
      setIsLoading(false);
    }
  }, [roleFilter, cccData]);

  useEffect(() => {
    if (cccData) {
      loadUsers();
    }
  }, [loadUsers]);

  // Handle single selection change
  const handleSingleSelectionChange = (e) => {
    const newValue = e.target.value;
    console.log('UserField: Single selection changed to:', newValue);
    console.log('UserField: Previous value was:', localValue);
    
    setLocalValue(newValue);
    onChange(newValue);
  };

  // Handle multiple selection change
  const handleMultipleSelectionChange = (e) => {
    const selectedOptions = Array.from(e.target.selectedOptions).map(option => option.value);
    console.log('UserField: Multiple selection changed to:', selectedOptions);
    console.log('UserField: Previous values were:', localValue);
    
    setLocalValue(selectedOptions);
    onChange(selectedOptions);
  };

  // Remove user from multiple selection
  const removeUser = (userId) => {
    const newValues = localValue.filter(id => id !== userId);
    console.log('UserField: Removing user', userId, 'New values:', newValues);
    
    setLocalValue(newValues);
    onChange(newValues);
  };

  // Get user display info
  const getUserDisplay = (userId) => {
    const user = users.find(u => u.ID == userId);
    if (user) {
      return `${user.display_name} (${user.user_email})`;
    }
    
    // If users are still loading, show loading state
    if (isLoading) {
      return `Loading user ${userId}...`;
    }
    
    return `User ${userId}`;
  };

  // If cccData is not available yet, show loading state
  if (!cccData) {
    return (
      <div className="mb-4">
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <div className="text-sm text-gray-500 p-2 bg-gray-100 rounded border border-gray-300">
          Loading user field configuration...
        </div>
      </div>
    );
  }

  return (
    <div className="mb-4">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      {isLoading ? (
        <div className="text-sm text-gray-500 p-2 bg-gray-100 rounded border border-gray-300">
          Loading users...
        </div>
      ) : errorMessage ? (
        <div className="text-sm text-red-500 p-2 bg-red-100 rounded border border-red-300">
          {errorMessage}
        </div>
      ) : users.length === 0 ? (
        <div className="text-sm text-gray-500 p-2 bg-gray-100 rounded border border-gray-300">
          No users found
        </div>
      ) : multiple ? (
        // Multiple selection interface
        <div>
          <select
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            multiple
            value={localValue}
            onChange={handleMultipleSelectionChange}
            required={required}
            size="4"
          >
            {users.map(user => (
              <option key={user.ID} value={user.ID}>
                {user.display_name} ({user.user_email})
              </option>
            ))}
          </select>
          
          {/* Show selected users as tags */}
          {localValue.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {localValue.map(userId => (
                <span 
                  key={userId}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200"
                >
                  {getUserDisplay(userId)}
                  <button
                    type="button"
                    onClick={() => removeUser(userId)}
                    className="ml-1 text-blue-600 hover:text-blue-800 focus:outline-none"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
          
          <p className="text-xs text-gray-500 mt-1">
            Hold Ctrl (or Cmd on Mac) to select multiple users
          </p>
        </div>
      ) : (
        // Single selection interface
        <select
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          value={localValue}
          onChange={handleSingleSelectionChange}
          required={required}
        >
          <option value="">-- Select User --</option>
          {users.map(user => (
            <option key={user.ID} value={user.ID}>
              {user.display_name} ({user.user_email})
            </option>
          ))}
        </select>
      )}
      
      {error && <div className="text-xs text-red-500 mt-1">This field is required.</div>}
      
      {/* Debug info - remove this in production */}
      <div className="text-xs text-gray-400 mt-2 p-2 bg-gray-50 rounded">
        Debug: {users.length} users loaded, Role Filter: {roleFilter.join(', ') || 'none'}, 
        Local Value: {JSON.stringify(localValue)}, Prop Value: {JSON.stringify(value)}, 
        Multiple: {multiple ? 'Yes' : 'No'}
      </div>
    </div>
  );
}

export default UserField; 