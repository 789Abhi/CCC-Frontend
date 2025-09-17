import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronDown, X, Search, User } from 'lucide-react';

const UserField = ({ 
  label, 
  fieldName,
  fieldConfig,
  fieldValue,
  fieldRequired,
  onChange,
  fieldId
}) => {
  // Extract configuration
  const multiple = fieldConfig?.multiple || false;
  const roleFilter = fieldConfig?.role_filter || [];
  const returnType = fieldConfig?.return_type || 'id';
  const required = fieldRequired || false;
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);

  // Initialize localValue with proper parsing
  const [localValue, setLocalValue] = useState(() => {
    if (multiple) {
      // For multiple selection, ensure we always have a clean array of integers
      if (typeof fieldValue === 'string' && fieldValue.startsWith('[') && fieldValue.endsWith(']')) {
        try {
          const parsed = JSON.parse(fieldValue);
          return Array.isArray(parsed) ? parsed.map(Number) : [];
        } catch (e) {
          return [];
        }
      }
      if (Array.isArray(fieldValue)) {
        return fieldValue.map(Number);
      }
      return [];
    }
    // For single selection, ensure we have a single integer or empty string
    if (fieldValue && Number.isInteger(Number(fieldValue))) {
      return Number(fieldValue);
    }
    return '';
  });

  // Update local value when prop changes
  useEffect(() => {
    if (multiple) {
      let newValue;
      if (typeof fieldValue === 'string' && fieldValue.startsWith('[') && fieldValue.endsWith(']')) {
        try {
          const parsed = JSON.parse(fieldValue);
          newValue = Array.isArray(parsed) ? parsed.map(Number) : [];
        } catch (e) {
          newValue = [];
        }
      } else if (Array.isArray(fieldValue)) {
        newValue = fieldValue.map(Number);
      } else if (fieldValue && fieldValue !== '') {
        newValue = [Number(fieldValue)];
      } else {
        newValue = [];
      }
      
      setLocalValue(newValue);
    } else {
      if (fieldValue && Number.isInteger(Number(fieldValue))) {
        setLocalValue(Number(fieldValue));
      } else {
        setLocalValue('');
      }
    }
  }, [fieldValue, multiple]);

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
              formData.append('nonce', window.getNonce ? window.getNonce() : (window.cccData?.nonce || ''));
      formData.append('role_filter', JSON.stringify(roleFilter));

      console.log('UserField: Making AJAX request to:', window.cccData.ajaxUrl);
      console.log('UserField: Request data:', {
        action: 'ccc_get_users',
        nonce: window.getNonce ? window.getNonce() : (window.cccData?.nonce || ''),
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
      } else {
        console.error('UserField: Failed to load users - unexpected response structure:', data);
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
      const idNum = Number(userId);
      let newValues;
      if (checked) {
        // Add user to selection
        newValues = [...localValue, idNum];
      } else {
        // Remove user from selection
        newValues = localValue.filter(id => Number(id) !== idNum);
      }

      // Normalize to unique integers, keep only valid numbers
      newValues = Array.from(new Set(newValues.map(n => Number(n)))).filter(n => Number.isInteger(n)).sort((a, b) => a - b);

      setLocalValue(newValues);
      onChange(newValues);
    }
  };

  // Helper function to check if a user is selected
  const isUserSelected = (userId) => {
    const idNum = Number(userId);
    return localValue.some(v => Number(v) === idNum);
  };

  // Group users by role and filter based on search term
  const getGroupedUsers = () => {
    const filtered = users.filter(user => 
      user.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.user_email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Group users by their primary role
    const grouped = {};
    filtered.forEach(user => {
      const role = user.roles && user.roles[0] ? user.roles[0] : 'subscriber';
      const roleLabel = getRoleLabel(role);
      
      if (!grouped[roleLabel]) {
        grouped[roleLabel] = [];
      }
      grouped[roleLabel].push(user);
    });

    // Sort groups by role hierarchy and users within groups alphabetically
    const roleOrder = ['Administrator', 'Editor', 'Author', 'Contributor', 'Subscriber'];
    const sortedGroups = {};
    
    roleOrder.forEach(role => {
      if (grouped[role]) {
        sortedGroups[role] = grouped[role].sort((a, b) => 
          a.display_name.localeCompare(b.display_name)
        );
      }
    });

    // Add any remaining roles not in the standard hierarchy
    Object.keys(grouped).forEach(role => {
      if (!roleOrder.includes(role)) {
        sortedGroups[role] = grouped[role].sort((a, b) => 
          a.display_name.localeCompare(b.display_name)
        );
      }
    });

    return sortedGroups;
  };

  // Helper function to get role display label
  const getRoleLabel = (role) => {
    const roleLabels = {
      'administrator': 'Administrator',
      'editor': 'Editor', 
      'author': 'Author',
      'contributor': 'Contributor',
      'subscriber': 'Subscriber'
    };
    return roleLabels[role] || role.charAt(0).toUpperCase() + role.slice(1);
  };

  // Get display text for dropdown button
  const getDropdownText = () => {
    if (multiple) {
      if (localValue.length === 0) {
        return 'Select users...';
      }
      if (localValue.length === 1) {
        const selectedUser = users.find(u => Number(u.ID) === localValue[0]);
        return selectedUser ? selectedUser.display_name : '1 user selected';
      }
      return `${localValue.length} users selected`;
    } else {
      if (localValue) {
        const selectedUser = users.find(u => Number(u.ID) === localValue);
        return selectedUser ? selectedUser.display_name : 'Select user...';
      }
      return 'Select user...';
    }
  };

  // Get selected users for display
  const getSelectedUsers = () => {
    if (!multiple) return [];
    return localValue.map(userId => {
      const user = users.find(u => Number(u.ID) === userId);
      return user;
    }).filter(Boolean);
  };

  if (isLoading) {
    return (
      <div className="w-full ccc-field" data-field-id={fieldId}>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label || 'User'}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <div className="flex items-center justify-center py-8 text-gray-500">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500 mr-2"></div>
          Loading users...
        </div>
      </div>
    );
  }

  const groupedUsers = getGroupedUsers();
  const selectedUsers = getSelectedUsers();

  return (
    <div className="w-full ccc-field" data-field-id={fieldId}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label || 'User'}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      {/* Selected users display for multiple selection */}
      {multiple && selectedUsers.length > 0 && (
        <div className="mb-3">
          <div className="flex flex-wrap gap-2">
            {selectedUsers.map(user => (
              <div key={user.ID} className="inline-flex items-center bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full">
                <User size={14} className="mr-1" />
                <span>{user.display_name}</span>
                <button
                  type="button"
                  onClick={() => handleCheckboxChange(user.ID, false)}
                  className="ml-2 text-blue-600 hover:text-blue-800 focus:outline-none"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="relative" ref={dropdownRef}>
        {/* Dropdown Button */}
        <button
          type="button"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg bg-white text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-gray-400 transition-colors duration-200 flex items-center justify-between"
        >
          <span className="text-gray-700">{getDropdownText()}</span>
          <ChevronDown 
            size={20} 
            className={`text-gray-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} 
          />
        </button>

        {/* Dropdown Content */}
        {isDropdownOpen && (
          <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-xl max-h-80 overflow-hidden">
            {/* Search Input */}
            <div className="p-3 border-b border-gray-100 bg-gray-50">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* User List - Grouped by Role */}
            <div className="overflow-y-auto max-h-64">
              {Object.keys(groupedUsers).length === 0 ? (
                <div className="px-4 py-6 text-center text-gray-500">
                  <User size={24} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No users found</p>
                </div>
              ) : (
                Object.entries(groupedUsers).map(([role, roleUsers]) => (
                  <div key={role} className="border-b border-gray-100 last:border-b-0">
                    {/* Role Header */}
                    <div className="px-4 py-2 bg-gray-50 text-xs font-medium text-gray-600 uppercase tracking-wide border-b border-gray-100">
                      {role}
                    </div>
                    
                    {/* Users in Role */}
                    <div className="py-1">
                      {roleUsers.map(user => (
                        <label
                          key={user.ID}
                          className="flex items-center px-4 py-2 hover:bg-blue-50 cursor-pointer transition-colors duration-150"
                        >
                          {multiple ? (
                            <input
                              type="checkbox"
                              checked={isUserSelected(user.ID)}
                              onChange={(e) => handleCheckboxChange(user.ID, e.target.checked)}
                              className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                          ) : (
                            <input
                              type="radio"
                              name={`user-${fieldId}`}
                              checked={localValue === Number(user.ID)}
                              onChange={() => {
                                setLocalValue(Number(user.ID));
                                onChange(Number(user.ID));
                                setIsDropdownOpen(false);
                              }}
                              className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                            />
                          )}
                          <div className="flex items-center min-w-0 flex-1">
                            <User size={16} className="text-gray-400 mr-2 flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-medium text-gray-900 truncate">
                                {user.display_name}
                              </div>
                              <div className="text-xs text-gray-500 truncate">
                                {user.user_email}
                              </div>
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Validation Messages */}
      {required && !localValue && (!multiple || localValue.length === 0) && (
        <div className="mt-2">
          <div className="flex items-center gap-2 text-red-600 text-sm">
            <span>User selection is required</span>
          </div>
        </div>
      )}

      {fieldConfig?.description && (
        <div className="mt-2 text-xs text-gray-600">
          <p>{fieldConfig.description}</p>
        </div>
      )}
    </div>
  );
};

export default UserField; 