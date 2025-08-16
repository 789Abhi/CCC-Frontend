import React, { useState, useEffect, useCallback, useRef } from 'react';

const UserField = ({ 
  label, 
  value, 
  onChange, 
  multiple = false, 
  required = false, 
  error = null, 
  roleFilter = [], 
  returnType = 'id' 
}) => {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);
  
  // Get cccData from window object
  const cccData = window.cccData;

  // Initialize localValue with proper JSON parsing for multiple selection
  const [localValue, setLocalValue] = useState(() => {
    console.log('UserField: Initializing localValue with value:', value);
    console.log('UserField: Value type:', typeof value);
    console.log('UserField: Multiple:', multiple);
    
    if (multiple) {
      // Handle case where value might be a JSON string
      if (typeof value === 'string' && value.startsWith('[') && value.endsWith(']')) {
        try {
          const parsed = JSON.parse(value);
          console.log('UserField: Parsed JSON value:', parsed);
          return Array.isArray(parsed) ? parsed : [];
        } catch (e) {
          console.warn('UserField: Failed to parse JSON value:', value, e);
          return [];
        }
      }
      // If value is already an array, use it directly
      if (Array.isArray(value)) {
        console.log('UserField: Value is already an array:', value);
        return value;
      }
      // If value is a single number/string, convert to array
      if (value && value !== '') {
        console.log('UserField: Converting single value to array:', value);
        return [value];
      }
      console.log('UserField: No value, returning empty array');
      return [];
    }
    return value || '';
  });

  // Update local value when prop changes
  useEffect(() => {
    console.log('UserField: useEffect triggered - value changed:', value);
    console.log('UserField: New value type:', typeof value);
    console.log('UserField: Multiple:', multiple);
    
    if (multiple) {
      let newValue;
      if (typeof value === 'string' && value.startsWith('[') && value.endsWith(']')) {
        try {
          const parsed = JSON.parse(value);
          newValue = Array.isArray(parsed) ? parsed : [];
          console.log('UserField: Parsed new value:', newValue);
        } catch (e) {
          console.warn('UserField: Failed to parse new JSON value:', value, e);
          newValue = [];
        }
      } else if (Array.isArray(value)) {
        newValue = value;
        console.log('UserField: New value is already array:', newValue);
      } else if (value && value !== '') {
        newValue = [value];
        console.log('UserField: Converting new single value to array:', newValue);
      } else {
        newValue = [];
        console.log('UserField: New value is empty, setting empty array');
      }
      
      console.log('UserField: Setting localValue to:', newValue);
      setLocalValue(newValue);
    } else {
      console.log('UserField: Single selection, setting localValue to:', value || '');
      setLocalValue(value || '');
    }
  }, [value, multiple]);

  // Load users from WordPress
  const loadUsers = useCallback(async () => {
    console.log('UserField: loadUsers called');
    console.log('UserField: cccData available:', !!cccData);
    console.log('UserField: cccData.ajaxUrl:', cccData?.ajaxUrl);
    console.log('UserField: cccData.nonce:', cccData?.nonce);
    
    if (!cccData || !cccData.ajaxUrl || !cccData.nonce) {
      console.error('UserField: cccData not available');
      return;
    }

    setIsLoading(true);
    try {
      const requestBody = new URLSearchParams({
        action: 'ccc_get_users',
        nonce: cccData.nonce,
        role_filter: JSON.stringify(roleFilter)
      });

      console.log('UserField: Making AJAX request with body:', requestBody.toString());

      const response = await fetch(cccData.ajaxUrl, {
        method: 'POST',
        body: requestBody,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      const data = await response.json();
      console.log('UserField: AJAX response received:', data);
      console.log('UserField: Response success:', data.success);
      console.log('UserField: Response data:', data.data);
      console.log('UserField: Response data is array:', Array.isArray(data.data));
      console.log('UserField: Response data.data:', data.data?.data);
      console.log('UserField: Response data.data is array:', Array.isArray(data.data?.data));
      
      // Handle WordPress's nested response structure
      let usersArray = null;
      if (data.success && data.data && Array.isArray(data.data)) {
        // Direct array structure
        usersArray = data.data;
      } else if (data.success && data.data && data.data.data && Array.isArray(data.data.data)) {
        // Nested structure: data.data.data
        usersArray = data.data.data;
      }
      
      if (usersArray) {
        console.log('UserField: Setting users state with:', usersArray);
        setUsers(usersArray);
        console.log('UserField: Users state set, length:', usersArray.length);
      } else {
        console.error('UserField: Failed to load users - unexpected response structure:', data);
      }
    } catch (error) {
      console.error('UserField: Error loading users:', error);
    } finally {
      setIsLoading(false);
    }
  }, [roleFilter, cccData]);

  // Load users when component mounts
  useEffect(() => {
    console.log('UserField: useEffect triggered, cccData available:', !!cccData);
    if (cccData) {
      loadUsers();
    }
  }, [loadUsers]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle single selection change
  const handleSingleSelectionChange = (e) => {
    const selectedValue = e.target.value;
    console.log('UserField: Single selection changed to:', selectedValue);
    setLocalValue(selectedValue);
    onChange(selectedValue);
  };

  // Handle checkbox change for multiple selection
  const handleCheckboxChange = (userId, checked) => {
    if (multiple) {
      let newValues;
      if (checked) {
        // Add user to selection
        newValues = [...localValue, userId];
      } else {
        // Remove user from selection
        newValues = localValue.filter(id => id != userId); // Use != for loose comparison
      }
      console.log('UserField: Checkbox selection changed:', { 
        userId, 
        checked, 
        newValues, 
        currentLocalValue: localValue,
        userIdType: typeof userId,
        localValueTypes: localValue.map(v => typeof v)
      });
      
      // Update local state first
      setLocalValue(newValues);
      
      // Then call the parent onChange
      console.log('UserField: Calling onChange with:', newValues);
      onChange(newValues);
    }
  };

  // Helper function to check if a user is selected
  const isUserSelected = (userId) => {
    const selected = localValue.some(id => id == userId); // Use == for loose comparison
    console.log('UserField: Checking if user selected:', { userId, localValue, selected });
    return selected;
  };

  // Filter users based on search term
  const filteredUsers = users.filter(user => 
    user.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.user_email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get selected count for dropdown button
  const selectedCount = multiple ? localValue.length : 0;

  console.log('UserField: Component render - users length:', users.length);
  console.log('UserField: Component render - users:', users);
  console.log('UserField: Component render - isLoading:', isLoading);
  console.log('UserField: Component render - multiple:', multiple);

  // If cccData is not available yet, show loading state
  if (!cccData) {
    return (
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <div className="text-sm text-gray-500 p-2 bg-gray-100 rounded border border-gray-300">
          Loading user field configuration...
        </div>
      </div>
    );
  }

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      {error && (
        <div className="text-red-500 text-sm mb-2">{error}</div>
      )}

      {!multiple ? (
        // Single selection interface
        <select
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          value={localValue}
          onChange={handleSingleSelectionChange}
          required={required}
        >
          <option value="">Select a user...</option>
          {users.map(user => (
            <option key={user.ID} value={user.ID}>
              {user.display_name} ({user.user_email})
            </option>
          ))}
        </select>
      ) : (
        // Multiple selection interface with dropdown and checkboxes
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-left bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {selectedCount > 0 ? `${selectedCount} user(s) selected` : 'Select users...'}
            <span className="absolute right-2 top-1/2 transform -translate-y-1/2">
              ▼
            </span>
          </button>
          
          {isDropdownOpen && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {/* Search input */}
              <div className="p-2 border-b border-gray-200">
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              {/* User checkboxes */}
              <div className="p-2">
                {filteredUsers.length > 0 ? (
                  filteredUsers.map(user => (
                    <label key={user.ID} className="flex items-center p-2 hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isUserSelected(user.ID)}
                        onChange={(e) => handleCheckboxChange(user.ID, e.target.checked)}
                        className="mr-2 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm">
                        {user.display_name} ({user.user_email})
                      </span>
                    </label>
                  ))
                ) : (
                  <div className="text-gray-500 text-sm p-2 text-center">
                    {searchTerm ? 'No users found' : 'No users available'}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
      
      {isLoading && (
        <div className="text-sm text-gray-500 mt-1">Loading users...</div>
      )}

      {/* Debug info */}
      <div className="text-xs text-gray-400 mt-2 p-2 bg-gray-50 rounded">
        Debug: {users.length} users loaded, Role Filter: {roleFilter.join(', ') || 'none'}, 
        Local Value: {JSON.stringify(localValue)}, Prop Value: {JSON.stringify(value)}, 
        Multiple: {multiple ? 'Yes' : 'No'}, Loading: {isLoading ? 'Yes' : 'No'}
      </div>
    </div>
  );
};

export default UserField; 