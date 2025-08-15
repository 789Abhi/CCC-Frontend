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
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Initialize selected users from value prop
  useEffect(() => {
    if (value) {
      if (multiple && Array.isArray(value)) {
        setSelectedUsers(value);
      } else if (!multiple && !Array.isArray(value)) {
        setSelectedUsers([value]);
      } else {
        setSelectedUsers([]);
      }
    } else {
      setSelectedUsers([]);
    }
  }, [value, multiple]);

  // Load users from WordPress
  useEffect(() => {
    const loadUsers = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(cccData.ajaxUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            action: 'ccc_get_users',
            nonce: cccData.nonce,
            role_filter: JSON.stringify(roleFilter)
          })
        });
        
        const data = await response.json();
        if (data.success && Array.isArray(data.data)) {
          setUsers(data.data);
        }
      } catch (error) {
        console.error('Error loading users:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUsers();
  }, [roleFilter]);

  const handleUserSelect = (userId) => {
    if (!userId) return;

    let newSelectedUsers;
    
    if (multiple) {
      if (selectedUsers.includes(userId)) {
        newSelectedUsers = selectedUsers.filter(id => id !== userId);
      } else {
        newSelectedUsers = [...selectedUsers, userId];
      }
    } else {
      newSelectedUsers = [userId];
    }

    setSelectedUsers(newSelectedUsers);
    
    // Call onChange with appropriate format
    if (multiple) {
      onChange(newSelectedUsers);
    } else {
      onChange(userId);
    }
  };

  const handleUserRemove = (userId) => {
    const newSelectedUsers = selectedUsers.filter(id => id !== userId);
    setSelectedUsers(newSelectedUsers);
    
    if (multiple) {
      onChange(newSelectedUsers);
    } else {
      onChange('');
    }
  };

  const filteredUsers = users.filter(user => 
    user.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.user_email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getUserById = (userId) => {
    return users.find(user => user.ID === userId);
  };

  return (
    <div className="mb-4">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      {multiple ? (
        <div className="space-y-3">
          {/* Selected Users Display */}
          {selectedUsers.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedUsers.map(userId => {
                const user = getUserById(userId);
                if (!user) return null;
                
                return (
                  <div key={userId} className="flex items-center gap-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                    <span>{user.display_name}</span>
                    <button
                      type="button"
                      onClick={() => handleUserRemove(userId)}
                      className="text-blue-600 hover:text-blue-800 font-bold text-lg leading-none"
                    >
                      ×
                    </button>
                  </div>
                );
              })}
            </div>
          )}
          
          {/* User Selection */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            
            {searchTerm && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {filteredUsers.length > 0 ? (
                  filteredUsers.map(user => (
                    <button
                      key={user.ID}
                      type="button"
                      onClick={() => {
                        handleUserSelect(user.ID);
                        setSearchTerm('');
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                      disabled={selectedUsers.includes(user.ID)}
                    >
                      <div className="font-medium">{user.display_name}</div>
                      <div className="text-sm text-gray-600">{user.user_email}</div>
                    </button>
                  ))
                ) : (
                  <div className="px-3 py-2 text-gray-500">No users found</div>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Single User Selection */
        <div className="relative">
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          
          {/* Selected User Display */}
          {selectedUsers.length > 0 && (
            <div className="mt-2">
              {selectedUsers.map(userId => {
                const user = getUserById(userId);
                if (!user) return null;
                
                return (
                  <div key={userId} className="flex items-center gap-2 bg-blue-100 text-blue-800 px-3 py-2 rounded-lg">
                    <span className="font-medium">{user.display_name}</span>
                    <span className="text-sm">({user.user_email})</span>
                    <button
                      type="button"
                      onClick={() => handleUserRemove(userId)}
                      className="text-blue-600 hover:text-blue-800 font-bold text-lg leading-none ml-auto"
                    >
                      ×
                    </button>
                  </div>
                );
              })}
            </div>
          )}
          
          {/* User Dropdown */}
          {searchTerm && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {filteredUsers.length > 0 ? (
                filteredUsers.map(user => (
                  <button
                    key={user.ID}
                    type="button"
                    onClick={() => {
                      handleUserSelect(user.ID);
                      setSearchTerm('');
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                    disabled={selectedUsers.includes(user.ID)}
                  >
                    <div className="font-medium">{user.display_name}</div>
                    <div className="text-sm text-gray-600">{user.user_email}</div>
                  </button>
                ))
              ) : (
                <div className="px-3 py-2 text-gray-500">No users found</div>
              )}
            </div>
          )}
        </div>
      )}
      
      {error && <div className="text-xs text-red-500 mt-1">This field is required.</div>}
      
      {isLoading && (
        <div className="text-sm text-gray-500 mt-1">Loading users...</div>
      )}
    </div>
  );
}

export default UserField; 