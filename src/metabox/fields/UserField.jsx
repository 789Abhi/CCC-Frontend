import React, { useState, useEffect } from 'react';

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
  
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Load users from WordPress
  useEffect(() => {
    const loadUsers = async () => {
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
    };

    loadUsers();
  }, [roleFilter]);

  // If cccData is not available, show error message
  if (typeof cccData === 'undefined') {
    return (
      <div className="mb-4">
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <div className="text-sm text-red-500 p-2 bg-red-100 rounded border border-red-300">
          User field not available - cccData missing. Please refresh the page.
        </div>
      </div>
    );
  }

  return (
    <div className="mb-4" key={`userfield-${value || 'empty'}`}>
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
      ) : (
        <select
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          value={value || ''}
          onChange={(e) => {
            const newValue = e.target.value;
            console.log('UserField: Selection changed to:', newValue);
            console.log('UserField: Previous value was:', value);
            onChange(newValue);
          }}
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
        Debug: {users.length} users loaded, Role Filter: {roleFilter.join(', ') || 'none'}
      </div>
    </div>
  );
}

export default UserField; 