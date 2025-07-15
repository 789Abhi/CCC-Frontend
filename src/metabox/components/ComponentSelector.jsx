import React, { useState, useEffect } from 'react';

function ComponentSelector({ availableComponents = [], onSelect, onClose }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);

  const filteredComponents = Array.isArray(availableComponents)
    ? availableComponents.filter(component =>
        component &&
        component.name &&
        component.handle_name &&
        (component.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
         component.handle_name.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : [];

  const handleToggle = (component) => {
    setSelectedIds((prev) =>
      prev.includes(component.id)
        ? prev.filter(id => id !== component.id)
        : [...prev, component.id]
    );
  };

  const handleAddSelected = () => {
    const selectedComponents = filteredComponents.filter(c => selectedIds.includes(c.id));
    if (selectedComponents.length > 0) {
      onSelect(selectedComponents);
    }
    onClose();
  };

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-2xl border-2 border-pink-400 w-full max-w-sm flex flex-col overflow-hidden animate-fade-in"
        style={{ minWidth: 340 }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center px-4 py-3 border-b border-pink-300 bg-gradient-to-r from-pink-50 to-blue-50">
          <span className="font-semibold text-gray-800 text-lg flex-1">Select Components</span>
          <button className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-pink-400" onClick={onClose} type="button">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        {/* Search */}
        <div className="px-4 py-3 border-b border-pink-200 bg-white">
          <input
            type="text"
            placeholder="Search Component"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-pink-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400 text-base shadow-sm"
          />
        </div>
        {/* Components List */}
        <div className="flex-1 overflow-y-auto bg-gray-50 px-3 py-3" style={{ maxHeight: 260 }}>
          {filteredComponents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-gray-400">
              <div className="w-10 h-10 mb-2">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-full h-full">
                  <circle cx="11" cy="11" r="8"></circle>
                  <path d="m21 21-4.35-4.35"></path>
                </svg>
              </div>
              <p className="text-base">
                {searchTerm ? 'No components found' : 'No components available'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredComponents.map((component) => (
                <label
                  key={component.id}
                  className={`w-full flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-pink-200 hover:bg-pink-50 transition text-left shadow-sm cursor-pointer ${selectedIds.includes(component.id) ? 'bg-pink-100 border-pink-400' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(component.id)}
                    onChange={() => handleToggle(component)}
                    className="accent-pink-500"
                  />
                  <span className="flex-1 min-w-0 text-gray-800 font-medium truncate text-base">{component.name}</span>
                </label>
              ))}
            </div>
          )}
        </div>
        {/* Add Selected Button */}
        <div className="px-4 py-3 border-t border-pink-200 bg-white flex justify-end">
          <button
            className="px-5 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 focus:outline-none focus:ring-2 focus:ring-pink-400 text-base font-semibold shadow disabled:opacity-50"
            onClick={handleAddSelected}
            disabled={selectedIds.length === 0}
            type="button"
          >
            Add Selected
          </button>
        </div>
      </div>
    </div>
  );
}

export default ComponentSelector; 