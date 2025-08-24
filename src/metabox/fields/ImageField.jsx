import React, { useRef } from 'react';

function ImageField({ label, value, onChange, required, error, fieldId }) {
  const inputRef = useRef();

  // Open WP Media Library
  const openMediaLibrary = (e) => {
    e.preventDefault();
    
    // Close any existing media frames to prevent conflicts
    if (window.wp && window.wp.media && window.wp.media.frames) {
      Object.keys(window.wp.media.frames).forEach(key => {
        if (window.wp.media.frames[key] && typeof window.wp.media.frames[key].close === 'function') {
          window.wp.media.frames[key].close();
        }
      });
    }
    
    if (window.wp && window.wp.media) {
      const frameId = 'image-field-' + Date.now() + '-' + Math.random();
      const frame = window.wp.media({
        id: frameId,
        title: 'Select or Upload Image',
        button: { text: 'Use this image' },
        multiple: false,
        library: { type: 'image' }
      });
      
      frame.on('select', () => {
        const attachment = frame.state().get('selection').first().toJSON();
        if (onChange) onChange(attachment.url);
      });
      
      frame.on('close', () => {
        // Clean up
      });
      
      frame.open();
    } else {
      // fallback: open file input
      inputRef.current && inputRef.current.click();
    }
  };

  // Fallback for direct file upload (not recommended, but for completeness)
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // You may want to upload the file via AJAX here and get the URL
      // For now, just show a local preview
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (onChange) onChange(ev.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="mb-4 ccc-field" data-field-id={fieldId}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="border border-pink-400 rounded px-4 py-2 font-semibold flex items-center gap-2 hover:bg-pink-50 transition"
          onClick={openMediaLibrary}
        >
          <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21,15 16,10 5,21" />
          </svg>
          Browse
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
        {value && (
          <img src={value} alt="Selected" className="h-12 w-12 object-cover rounded border border-gray-300 ml-2" />
        )}
      </div>
      {value && (
        <div className="text-xs text-gray-500 mt-1 break-all">{value}</div>
      )}
      {error && <div className="text-xs text-red-500 mt-1">This field is required.</div>}
    </div>
  );
}

export default ImageField; 