import React, { useState, useRef, useEffect } from 'react';

function ColorField({ label, value, onChange, required = false, error }) {
  const [isOpen, setIsOpen] = useState(false);
  const [showAdjustments, setShowAdjustments] = useState(false);
  const [percentage, setPercentage] = useState(0);
  const [hoverColor, setHoverColor] = useState('');
  const [activeTab, setActiveTab] = useState('main'); // 'main' or 'hover'
  const colorPickerRef = useRef(null);

  // Close color picker when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (colorPickerRef.current && !colorPickerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Load saved color data when component mounts or value changes
  useEffect(() => {
    if (value) {
      // Try to parse the value as JSON to get saved color data
      try {
        const savedData = JSON.parse(value);
        if (savedData && typeof savedData === 'object') {
          // Load saved hover color
          if (savedData.hover) {
            setHoverColor(savedData.hover);
          }
          
          // Calculate percentage from adjusted color
          if (savedData.adjusted && savedData.main && savedData.adjusted !== savedData.main) {
            // Calculate the percentage difference
            const mainHex = savedData.main.replace('#', '');
            const adjustedHex = savedData.adjusted.replace('#', '');
            
            const mainR = parseInt(mainHex.substr(0, 2), 16);
            const mainG = parseInt(mainHex.substr(2, 2), 16);
            const mainB = parseInt(mainHex.substr(4, 2), 16);
            
            const adjustedR = parseInt(adjustedHex.substr(0, 2), 16);
            const adjustedG = parseInt(adjustedHex.substr(2, 2), 16);
            const adjustedB = parseInt(adjustedHex.substr(4, 2), 16);
            
            // Calculate average percentage change
            const rPercent = ((adjustedR / mainR) - 1) * 100;
            const gPercent = ((adjustedG / mainG) - 1) * 100;
            const bPercent = ((adjustedB / mainB) - 1) * 100;
            
            const avgPercent = Math.round((rPercent + gPercent + bPercent) / 3);
            setPercentage(avgPercent);
          } else {
            setPercentage(0);
          }
        } else {
          setPercentage(0);
        }
      } catch (e) {
        // If not JSON, treat as simple color value
        setPercentage(0);
      }
    } else {
      setPercentage(0);
      setHoverColor('');
    }
  }, [value]);

  const handleColorChange = (e) => {
    const newColor = e.target.value;
    if (activeTab === 'main') {
      // Update main color and save complete data structure
      const colorData = {
        main: newColor,
        adjusted: adjustColorByPercentage(newColor, percentage),
        hover: hoverColor
      };
      onChange(JSON.stringify(colorData));
    } else if (activeTab === 'hover') {
      setHoverColor(newColor);
      // Save complete data structure with updated hover color
      const colorData = {
        main: value,
        adjusted: adjustColorByPercentage(value, percentage),
        hover: newColor
      };
      onChange(JSON.stringify(colorData));
    }
  };

  const handleInputChange = (e) => {
    const inputValue = e.target.value;
    // Validate hex color format
    if (/^#[0-9A-F]{6}$/i.test(inputValue) || inputValue === '') {
      if (activeTab === 'main') {
        // Update main color and save complete data structure
        const colorData = {
          main: inputValue,
          adjusted: adjustColorByPercentage(inputValue, percentage),
          hover: hoverColor
        };
        onChange(JSON.stringify(colorData));
      } else if (activeTab === 'hover') {
        setHoverColor(inputValue);
        // Save complete data structure with updated hover color
        const colorData = {
          main: value,
          adjusted: adjustColorByPercentage(value, percentage),
          hover: inputValue
        };
        onChange(JSON.stringify(colorData));
      }
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

  const adjustColorByPercentage = (hexColor, percentage) => {
    if (!hexColor || !isValidColor(hexColor) || percentage === 0) return hexColor;
    
    // Remove the # if present
    const hex = hexColor.replace('#', '');
    
    // Convert to RGB
    let r = parseInt(hex.substr(0, 2), 16);
    let g = parseInt(hex.substr(2, 2), 16);
    let b = parseInt(hex.substr(4, 2), 16);
    
    // Apply percentage adjustment
    const multiplier = 1 + (percentage / 100);
    r = Math.min(255, Math.max(0, Math.round(r * multiplier)));
    g = Math.min(255, Math.max(0, Math.round(g * multiplier)));
    b = Math.min(255, Math.max(0, Math.round(b * multiplier)));
    
    // Convert back to hex
    const toHex = (c) => {
      const hex = c.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  };

  // Extract main color from JSON string for display
  const getMainColor = () => {
    if (!value) return '';
    try {
      const colorData = JSON.parse(value);
      return colorData.main || '';
    } catch (e) {
      return value;
    }
  };

  const mainColor = getMainColor();
  const adjustedColor = mainColor ? adjustColorByPercentage(mainColor, percentage) : '';

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
                isValidColor(mainColor) ? '' : 'bg-gray-100'
              }`}
              style={{
                backgroundColor: isValidColor(mainColor) ? mainColor : '#f3f4f6',
                backgroundImage: isValidColor(mainColor) ? 'none' : 'repeating-conic-gradient(#e5e7eb 0% 25%, transparent 0% 50%) 50% / 4px 4px'
              }}
            >
              {!isValidColor(mainColor) && (
                <svg className="w-6 h-6 mx-auto text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                </svg>
              )}
            </button>
            
            {/* Color Picker Popup */}
            {isOpen && (
              <div 
                ref={colorPickerRef}
                className="absolute top-full left-0 mt-2 p-4 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-80"
              >
                {/* Tabs */}
                <div className="flex border-b border-gray-200 mb-4">
                  <button
                    type="button"
                    onClick={() => setActiveTab('main')}
                    className={`px-4 py-2 text-sm font-medium transition-colors ${
                      activeTab === 'main'
                        ? 'text-blue-600 border-b-2 border-blue-600'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Main Color
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('hover')}
                    className={`px-4 py-2 text-sm font-medium transition-colors ${
                      activeTab === 'hover'
                        ? 'text-blue-600 border-b-2 border-blue-600'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Hover Color
                  </button>
                </div>

                {/* Color Picker */}
                <input
                  type="color"
                  value={activeTab === 'main' ? (mainColor || '#000000') : (hoverColor || '#000000')}
                  onChange={handleColorChange}
                  className="w-full h-10 border border-gray-300 rounded cursor-pointer"
                />
                
                {/* Color Input */}
                <div className="mt-3">
                  <input
                    type="text"
                    value={activeTab === 'main' ? (mainColor || '') : (hoverColor || '')}
                    onChange={handleInputChange}
                    placeholder="#000000"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    maxLength="7"
                  />
                </div>

                <div className="mt-3 text-xs text-gray-500">
                  {activeTab === 'main' ? 'Click to pick main color' : 'Click to pick hover color'}
                </div>
              </div>
            )}
          </div>
          
          {/* Color Input */}
          <div className="flex-1">
            <input
              type="text"
              value={mainColor || ''}
              onChange={(e) => {
                const inputValue = e.target.value;
                if (/^#[0-9A-F]{6}$/i.test(inputValue) || inputValue === '') {
                  // Update main color and save complete data structure
                  const colorData = {
                    main: inputValue,
                    adjusted: adjustColorByPercentage(inputValue, percentage),
                    hover: hoverColor
                  };
                  onChange(JSON.stringify(colorData));
                }
              }}
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
        {isValidColor(mainColor) && (
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Color Adjustment</span>
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
                {/* Percentage Slider */}
                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    Adjust Color: {percentage > 0 ? '+' : ''}{percentage}%
                  </label>
                  <input
                    type="range"
                    min="-50"
                    max="50"
                    value={percentage}
                    onChange={(e) => {
                      const newPercentage = parseInt(e.target.value);
                      setPercentage(newPercentage);
                      // Save complete data structure with updated adjusted color
                      const colorData = {
                        main: mainColor,
                        adjusted: adjustColorByPercentage(mainColor, newPercentage),
                        hover: hoverColor
                      };
                      onChange(JSON.stringify(colorData));
                    }}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>-50% (Darker)</span>
                    <span>0% (Original)</span>
                    <span>+50% (Lighter)</span>
                  </div>
                </div>
                
                {/* Adjusted Color Preview */}
                {percentage !== 0 && (
                  <div className="flex items-center gap-2 p-2 bg-white rounded border">
                    <span className="text-xs text-gray-600">Adjusted:</span>
                    <div 
                      className="w-6 h-6 rounded border border-gray-300"
                      style={{ backgroundColor: adjustedColor }}
                    ></div>
                    <span className="text-xs font-mono">{adjustedColor}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Hover Color Display */}
        {isValidColor(hoverColor) && (
          <div className="bg-blue-50 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Hover Color:</span>
              <div 
                className="w-6 h-6 rounded border border-gray-300"
                style={{ backgroundColor: hoverColor }}
              ></div>
              <span className="text-sm font-mono">{hoverColor}</span>
            </div>
          </div>
        )}
      </div>
      
      {/* Color Information */}
      {isValidColor(mainColor) && (
        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
          <div className="text-xs text-gray-600">
            <div className="flex items-center gap-2 mb-2">
              <span>Color Preview:</span>
              <span 
                className="inline-block w-4 h-4 rounded border border-gray-300"
                style={{ backgroundColor: mainColor }}
              ></span>
              <span className="font-mono">{mainColor}</span>
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
      {!mainColor && (
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