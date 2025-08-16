import React, { useState, useEffect, useRef, useCallback } from 'react';

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
  const [isLoading, setIsLoading] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);

  // Initialize localValue with proper parsing
  const [localValue, setLocalValue] = useState(() => {
    if (multiple) {
      // For multiple selection, ensure we always have a clean array of integers
      if (typeof value === 'string' && value.startsWith('[') && value.endsWith(']')) {
        try {
          const parsed = JSON.parse(value);
          return Array.isArray(parsed) ? parsed.filter(v => Number.isInteger(Number(v))).map(Number) : [];
        } catch (e) {
          return [];
        }
      }
      if (Array.isArray(value)) {
        return value.filter(v => Number.isInteger(Number(v))).map(Number);
      }
      return [];
    }
    // For single selection, ensure we have a single integer or empty string
    if (value && Number.isInteger(Number(value))) {
      return Number(value);
    }
    return '';
  });

  // Update local value when prop changes
  useEffect(() => {
    if (multiple) {
      if (typeof value === 'string' && value.startsWith('[') && value.endsWith(']')) {
        try {
          const parsed = JSON.parse(value);
          const cleanArray = Array.isArray(parsed) ? parsed.filter(v => Number.isInteger(Number(v))).map(Number) : [];
          setLocalValue(cleanArray);
        } catch (e) {
          setLocalValue([]);
        }
      } else if (Array.isArray(value)) {
        const cleanArray = value.filter(v => Number.isInteger(Number(v))).map(Number);
        setLocalValue(cleanArray);
      } else {
        setLocalValue([]);
      }
    } else {
      if (value && Number.isInteger(Number(value))) {
        setLocalValue(Number(value));
      } else {
        setLocalValue('');
      }
    }
  }, [value, multiple]);

  // Load users from WordPress
  const loadUsers = useCallback(async () => {
    console.log('UserField: loadUsers called');
    console.log('UserField: window.cccData available:', !!window.cccData);
    console.log('UserField: window.cccData:', window.cccData);
    
    if (!window.cccData || !window.cccData.ajaxUrl) {
      console.error('UserField: cccData not available');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('action', 'ccc_get_users');
      formData.append('nonce', window.cccData.nonce);
      formData.append('role_filter', JSON.stringify(roleFilter));

      console.log('UserField: Making AJAX request to:', window.cccData.ajaxUrl);
      console.log('UserField: Request data:', {
        action: 'ccc_get_users',
        nonce: window.cccData.nonce,
        role_filter: JSON.stringify(roleFilter)
      });

      const response = await fetch(window.cccData.ajaxUrl, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      console.log('UserField: Raw response:', data);
      console.log('UserField: Response success:', data.success);
      console.log('UserField: Response data:', data.data);
      console.log('UserField: Response data type:', typeof data.data);
      console.log('UserField: Response data is array:', Array.isArray(data.data));
      
      if (data.success && data.data && Array.isArray(data.data)) {
        console.log('UserField: Setting users state with:', data.data);
        setUsers(data.data);
      } else {
        console.error('UserField: Failed to load users:', data);
      }
    } catch (error) {
      console.error('UserField: Error loading users:', error);
    } finally {
      setIsLoading(false);
    }
  }, [roleFilter]);

  // Load users on component mount
  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle checkbox change for multiple selection
  const handleCheckboxChange = (userId, checked) => {
    if (multiple) {
      let newValues;
      if (checked) {
        // Add user to selection
        newValues = [...localValue, userId];
      } else {
        // Remove user from selection
        newValues = localValue.filter(id => id !== userId);
      }
      
      // Ensure we only have clean integers
      newValues = newValues.filter(v => Number.isInteger(v)).sort((a, b) => a - b);
      
      setLocalValue(newValues);
      onChange(newValues);
    }
  };

  // Helper function to check if a user is selected
  const isUserSelected = (userId) => {
    return localValue.includes(userId);
  };

  // Filter users based on search term
  const filteredUsers = users.filter(user => 
    user.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.user_email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get display text for dropdown button
  const getDropdownText = () => {
    if (multiple) {
      if (localValue.length === 0) {
        return 'Select users...';
      }
      if (localValue.length === 1) {
        return '1 user selected';
      }
      return `${localValue.length} users selected`;
    }
    return 'Select user...';
  };

  if (isLoading) {
    return <div className="mb-4">Loading users...</div>;
  }

  console.log('UserField: Rendering with users:', users);
  console.log('UserField: Rendering with localValue:', localValue);
  console.log('UserField: Rendering with multiple:', multiple);

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      {/* Debug info */}
      <div className="text-xs text-gray-400 mb-2 p-2 bg-gray-50 rounded">
        Debug: {users.length} users loaded, Local Value: {JSON.stringify(localValue)}, Multiple: {multiple ? 'Yes' : 'No'}
      </div>
      
      {multiple ? (
        <div className="relative" ref={dropdownRef}>
          {/* Dropdown Button */}
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {getDropdownText()}
          </button>

          {/* Dropdown Content */}
          {isDropdownOpen && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
              {/* Search Input */}
              <div className="p-2 border-b border-gray-200">
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* User List */}
              <div className="py-1">
                {filteredUsers.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-gray-500">No users found</div>
                ) : (
                  filteredUsers.map(user => (
                    <label
                      key={user.ID}
                      className="flex items-center px-3 py-2 hover:bg-gray-100 cursor-pointer"
                    >
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
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        <select
          value={localValue || ''}
          onChange={(e) => {
            const newValue = e.target.value ? Number(e.target.value) : '';
            setLocalValue(newValue);
            onChange(newValue);
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Select a user...</option>
          {users.map(user => (
            <option key={user.ID} value={user.ID}>
              {user.display_name} ({user.user_email})
            </option>
          ))}
        </select>
      )}

      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};

export default UserField; 