import React, { useState, useRef, useEffect } from 'react';

function ColorField({ label, value, onChange, required = false, error }) {
  const [isOpen, setIsOpen] = useState(false);
  const [showAdjustments, setShowAdjustments] = useState(false);
  const [brightness, setBrightness] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [hoverColor, setHoverColor] = useState('');
  const [showHoverPicker, setShowHoverPicker] = useState(false);
  const colorPickerRef = useRef(null);

  // Close color picker when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (colorPickerRef.current && !colorPickerRef.current.contains(event.target)) {
        setIsOpen(false);
        setShowHoverPicker(false);
      }
    }

    if (isOpen || showHoverPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, showHoverPicker]);

  // Reset adjustments when main color changes
  useEffect(() => {
    if (value) {
      setBrightness(100);
      setSaturation(100);
    }
  }, [value]);

  const handleColorChange = (e) => {
    onChange(e.target.value);
  };

  const handleHoverColorChange = (e) => {
    setHoverColor(e.target.value);
  };

  const handleInputChange = (e) => {
    const inputValue = e.target.value;
    // Validate hex color format
    if (/^#[0-9A-F]{6}$/i.test(inputValue) || inputValue === '') {
      onChange(inputValue);
    }
  };

  const handleHoverInputChange = (e) => {
    const inputValue = e.target.value;
    // Validate hex color format
    if (/^#[0-9A-F]{6}$/i.test(inputValue) || inputValue === '') {
      setHoverColor(inputValue);
    }
  };

  const getContrastColor = (hexColor) => {
    if (!hexColor) return '#000000';
    
    // Remove the # if present
    const hex = hexColor.replace('#', '');
    
    // Convert to RGB
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    // Calculate luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    
    // Return black or white based on luminance
    return luminance > 0.5 ? '#000000' : '#ffffff';
  };

  const isValidColor = (color) => {
    return /^#[0-9A-F]{6}$/i.test(color);
  };

  const adjustColor = (hexColor, brightnessPercent, saturationPercent) => {
    if (!hexColor || !isValidColor(hexColor)) return hexColor;
    
    // Remove the # if present
    const hex = hexColor.replace('#', '');
    
    // Convert to RGB
    let r = parseInt(hex.substr(0, 2), 16);
    let g = parseInt(hex.substr(2, 2), 16);
    let b = parseInt(hex.substr(4, 2), 16);
    
    // Apply brightness adjustment
    const brightnessMultiplier = brightnessPercent / 100;
    r = Math.min(255, Math.max(0, Math.round(r * brightnessMultiplier)));
    g = Math.min(255, Math.max(0, Math.round(g * brightnessMultiplier)));
    b = Math.min(255, Math.max(0, Math.round(b * brightnessMultiplier)));
    
    // Apply saturation adjustment (simplified)
    const saturationMultiplier = saturationPercent / 100;
    const gray = 0.299 * r + 0.587 * g + 0.114 * b;
    r = Math.min(255, Math.max(0, Math.round(gray + (r - gray) * saturationMultiplier)));
    g = Math.min(255, Math.max(0, Math.round(gray + (g - gray) * saturationMultiplier)));
    b = Math.min(255, Math.max(0, Math.round(gray + (b - gray) * saturationMultiplier)));
    
    // Convert back to hex
    const toHex = (c) => {
      const hex = c.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  };

  const adjustedColor = value ? adjustColor(value, brightness, saturation) : '';

  return (
    <div className="mb-4">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="space-y-3">
        {/* Main Color Selection */}
        <div className="flex items-center gap-3">
          {/* Color Preview */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className={`w-12 h-12 rounded-lg border-2 border-gray-300 shadow-sm transition-all duration-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                isValidColor(value) ? '' : 'bg-gray-100'
              }`}
              style={{
                backgroundColor: isValidColor(value) ? value : '#f3f4f6',
                backgroundImage: isValidColor(value) ? 'none' : 'repeating-conic-gradient(#e5e7eb 0% 25%, transparent 0% 50%) 50% / 4px 4px'
              }}
            >
              {!isValidColor(value) && (
                <svg className="w-6 h-6 mx-auto text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                </svg>
              )}
            </button>
            
            {/* Color Picker Popup */}
            {isOpen && (
              <div 
                ref={colorPickerRef}
                className="absolute top-full left-0 mt-2 p-4 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-64"
              >
                <input
                  type="color"
                  value={value || '#000000'}
                  onChange={handleColorChange}
                  className="w-full h-10 border border-gray-300 rounded cursor-pointer"
                />
                <div className="mt-3 text-xs text-gray-500">
                  Click to pick a color
                </div>
              </div>
            )}
          </div>
          
          {/* Color Input */}
          <div className="flex-1">
            <input
              type="text"
              value={value || ''}
              onChange={handleInputChange}
              placeholder="#000000"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              maxLength="7"
            />
          </div>
          
          {/* Color Preview Text */}
          {isValidColor(value) && (
            <div 
              className="px-3 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{
                backgroundColor: value,
                color: getContrastColor(value)
              }}
            >
              {value}
            </div>
          )}
        </div>

        {/* Color Adjustments */}
        {isValidColor(value) && (
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Color Adjustments</span>
              <button
                type="button"
                onClick={() => setShowAdjustments(!showAdjustments)}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                {showAdjustments ? 'Hide' : 'Show'} Adjustments
              </button>
            </div>
            
            {showAdjustments && (
              <div className="space-y-3">
                {/* Brightness Slider */}
                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    Brightness: {brightness}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="200"
                    value={brightness}
                    onChange={(e) => setBrightness(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  />
                </div>
                
                {/* Saturation Slider */}
                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    Saturation: {saturation}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="200"
                    value={saturation}
                    onChange={(e) => setSaturation(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  />
                </div>
                
                {/* Adjusted Color Preview */}
                <div className="flex items-center gap-2 p-2 bg-white rounded border">
                  <span className="text-xs text-gray-600">Adjusted:</span>
                  <div 
                    className="w-6 h-6 rounded border border-gray-300"
                    style={{ backgroundColor: adjustedColor }}
                  ></div>
                  <span className="text-xs font-mono">{adjustedColor}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Hover Color Selection */}
        <div className="bg-blue-50 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Hover Color</span>
            <button
              type="button"
              onClick={() => setShowHoverPicker(!showHoverPicker)}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              {showHoverPicker ? 'Hide' : 'Show'} Hover Picker
            </button>
          </div>
          
          {showHoverPicker && (
            <div className="flex items-center gap-3">
              {/* Hover Color Preview */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowHoverPicker(!showHoverPicker)}
                  className={`w-10 h-10 rounded-lg border-2 border-gray-300 shadow-sm transition-all duration-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    isValidColor(hoverColor) ? '' : 'bg-gray-100'
                  }`}
                  style={{
                    backgroundColor: isValidColor(hoverColor) ? hoverColor : '#f3f4f6',
                    backgroundImage: isValidColor(hoverColor) ? 'none' : 'repeating-conic-gradient(#e5e7eb 0% 25%, transparent 0% 50%) 50% / 4px 4px'
                  }}
                >
                  {!isValidColor(hoverColor) && (
                    <svg className="w-4 h-4 mx-auto text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
                
                {/* Hover Color Picker Popup */}
                {showHoverPicker && (
                  <div 
                    ref={colorPickerRef}
                    className="absolute top-full left-0 mt-2 p-4 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-64"
                  >
                    <input
                      type="color"
                      value={hoverColor || '#000000'}
                      onChange={handleHoverColorChange}
                      className="w-full h-10 border border-gray-300 rounded cursor-pointer"
                    />
                    <div className="mt-3 text-xs text-gray-500">
                      Click to pick hover color
                    </div>
                  </div>
                )}
              </div>
              
              {/* Hover Color Input */}
              <div className="flex-1">
                <input
                  type="text"
                  value={hoverColor || ''}
                  onChange={handleHoverInputChange}
                  placeholder="#000000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
                  maxLength="7"
                />
              </div>
              
              {/* Hover Color Preview Text */}
              {isValidColor(hoverColor) && (
                <div 
                  className="px-2 py-1 rounded text-xs font-medium transition-colors"
                  style={{
                    backgroundColor: hoverColor,
                    color: getContrastColor(hoverColor)
                  }}
                >
                  {hoverColor}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Color Information */}
      {isValidColor(value) && (
        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
          <div className="text-xs text-gray-600">
            <div className="flex items-center gap-2 mb-2">
              <span>Color Preview:</span>
              <span 
                className="inline-block w-4 h-4 rounded border border-gray-300"
                style={{ backgroundColor: value }}
              ></span>
              <span className="font-mono">{value}</span>
            </div>
            {isValidColor(hoverColor) && (
              <div className="flex items-center gap-2">
                <span>Hover Color:</span>
                <span 
                  className="inline-block w-4 h-4 rounded border border-gray-300"
                  style={{ backgroundColor: hoverColor }}
                ></span>
                <span className="font-mono">{hoverColor}</span>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Empty state */}
      {!value && (
        <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="text-xs text-gray-500 text-center">
            No color selected
          </div>
        </div>
      )}
      
      {error && <div className="text-xs text-red-500 mt-2">This field is required.</div>}
      
      {/* Hidden inputs for form submission */}
      <input type="hidden" name={`${label?.replace(/\s+/g, '_').toLowerCase()}_adjusted`} value={adjustedColor} />
      <input type="hidden" name={`${label?.replace(/\s+/g, '_').toLowerCase()}_hover`} value={hoverColor} />
    </div>
  );
}

export default ColorField; 