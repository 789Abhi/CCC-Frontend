import React, { useState, useEffect } from 'react';

function ComponentSelector({ onSelect, onClose }) {
  const [components, setComponents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Load available components
  const loadComponents = async () => {
    try {
      setIsLoading(true);
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
      
      // Ensure we always have an array
      if (data.success && Array.isArray(data.data)) {
        setComponents(data.data);
      } else {
        setComponents([]);
      }
    } catch (error) {
      console.error('CCC Metabox: Error loading components:', error);
      setComponents([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter components based on search - ensure components is always an array
  const filteredComponents = Array.isArray(components) 
    ? components.filter(component =>
        component && 
        component.name && 
        component.handle_name &&
        (component.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
         component.handle_name.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : [];

  const handleSelect = (component) => {
    onSelect(component);
  };

  useEffect(() => { 
    loadComponents(); 
  }, []);
  
  useEffect(() => {
    const handleEscape = (e) => { 
      if (e.key === 'Escape') onClose(); 
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[80vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">Add Component</h3>
          <button className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700" onClick={onClose} type="button">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        {/* Search */}
        <div className="px-6 py-3 border-b border-gray-100">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
              </svg>
            </span>
            <input
              type="text"
              placeholder="Search components..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
        </div>
        {/* Components List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-10 text-gray-500">
              <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin mb-4"></div>
              <p>Loading components...</p>
            </div>
          ) : filteredComponents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-gray-400">
              <div className="w-10 h-10 mb-2">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-full h-full">
                  <circle cx="11" cy="11" r="8"></circle>
                  <path d="m21 21-4.35-4.35"></path>
                </svg>
              </div>
              <p className="text-sm">
                {searchTerm ? 'No components found matching your search' : 'No components available'}
              </p>
            </div>
          ) : (
            <div>
              {filteredComponents.map((component) => (
                <button
                  key={component.id}
                  className="w-full flex items-center justify-between px-6 py-4 border-b border-gray-100 hover:bg-gray-50 transition text-left"
                  onClick={() => handleSelect(component)}
                  type="button"
                >
                  <div className="flex-1 min-w-0">
                    <h4 className="text-base font-medium text-gray-800 truncate">{component.name}</h4>
                    <span className="text-xs text-gray-500 font-mono">@{component.handle_name}</span>
                  </div>
                  <span className="text-gray-300">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                      <polyline points="9,18 15,12 9,6"></polyline>
                    </svg>
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ComponentSelector; 