import React, { useState, useEffect, useCallback } from 'react';
import { ExternalLink, Eye, EyeOff } from 'lucide-react';

const OembedField = React.memo(({ field, value, onChange, isSubmitting, fieldConfig }) => {
  const [iframeCode, setIframeCode] = useState(value || '');
  const [showPreview, setShowPreview] = useState(false);
  const [error, setError] = useState('');

  // Parse field config
  const config = field.config ? (typeof field.config === 'string' ? JSON.parse(field.config) : field.config) : {};
  const {
    width = '100%',
    height = '400px',
    show_title = true,
    show_author = false,
    show_related = false
  } = config;

  // Sync iframeCode state with value prop when it changes (only when value changes from parent)
  useEffect(() => {
    if (value !== iframeCode) {
      setIframeCode(value || '');
      // Reset preview state when value changes
      if (!value) {
        setShowPreview(false);
      }
    }
  }, [value]); // Remove iframeCode from dependencies to prevent infinite loop

  const handleIframeCodeChange = useCallback((e) => {
    const newCode = e.target.value;
    setIframeCode(newCode);
    setError('');
    
    // Call onChange only when user actually changes the input
    if (onChange) {
      onChange(newCode);
    }
  }, [onChange]);

  const handlePreviewToggle = useCallback(() => {
    setShowPreview(prev => !prev);
  }, []);

  const extractIframeSrc = (iframeCode) => {
    const srcMatch = iframeCode.match(/src=["']([^"']+)["']/);
    return srcMatch ? srcMatch[1] : null;
  };

  const extractIframeTitle = (iframeCode) => {
    const titleMatch = iframeCode.match(/title=["']([^"']+)["']/);
    return titleMatch ? titleMatch[1] : null;
  };

  const getProcessedIframeCode = () => {
    if (!iframeCode) return null;
    
    // Replace width and height attributes if they exist
    let processedCode = iframeCode;
    
    // Replace width attribute
    processedCode = processedCode.replace(/width=["']([^"']*)["']/g, `width="${width}"`);
    
    // Replace height attribute
    processedCode = processedCode.replace(/height=["']([^"']*)["']/g, `height="${height}"`);
    
    // If width/height attributes don't exist, add them
    if (!processedCode.includes('width=')) {
      processedCode = processedCode.replace('<iframe', `<iframe width="${width}"`);
    }
    if (!processedCode.includes('height=')) {
      processedCode = processedCode.replace('<iframe', `<iframe height="${height}"`);
    }
    
    return processedCode;
  };

  const isValidIframeCode = (code) => {
    if (!code || typeof code !== 'string') return false;
    const trimmed = code.trim();
    return trimmed.startsWith('<iframe') && 
           trimmed.includes('src=') && 
           trimmed.includes('</iframe>');
  };

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-medium text-gray-700">
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <div className="flex items-center gap-2">
          {iframeCode && isValidIframeCode(iframeCode) && (
            <button
              type="button"
              className="inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
              onClick={handlePreviewToggle}
              title={showPreview ? "Hide Preview" : "Show Preview"}
            >
              {showPreview ? <EyeOff size={16} /> : <Eye size={16} />}
              <span>
                {showPreview ? "Hide Preview" : "Show Preview"}
              </span>
            </button>
          )}
        </div>
      </div>
      
      <div className="mb-2">
        <textarea
          value={iframeCode}
          onChange={handleIframeCodeChange}
          placeholder="Paste your iframe code here (e.g., Google Maps, YouTube, Vimeo embed code)"
          className="w-full px-3 py-3 border border-gray-300 rounded-lg text-sm font-mono resize-y min-h-[120px] focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-text"
          rows={4}
          disabled={isSubmitting}
        />
      </div>
      
      {error && (
        <div className="text-red-600 text-xs mt-1">
          {error}
        </div>
      )}
      
      {iframeCode && !isValidIframeCode(iframeCode) && (
        <div className="text-amber-600 text-xs mt-1 bg-amber-50 px-2 py-1 rounded">
          Please enter a valid iframe code starting with &lt;iframe
        </div>
      )}
      

      
      {showPreview && iframeCode && isValidIframeCode(iframeCode) && (
        <div className="mt-4 bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
          <div className="flex justify-between items-center px-4 py-3 bg-gray-50 border-b border-gray-200">
            <h4 className="text-sm font-semibold text-gray-700">Preview</h4>
            <div className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded font-mono">
              {width} × {height}
            </div>
          </div>
          <div className="bg-gray-50 p-4">
            <div
              className="w-full"
              style={{ minHeight: '400px' }}
              dangerouslySetInnerHTML={{ __html: getProcessedIframeCode() || iframeCode }}
            />
          </div>
        </div>
      )}
      
      {iframeCode && isValidIframeCode(iframeCode) && show_title && extractIframeTitle(iframeCode) && (
        <div className="mt-2 p-2 bg-gray-100 rounded">
          <h4 className="text-sm font-semibold text-gray-700 mb-1">{extractIframeTitle(iframeCode)}</h4>
          {extractIframeSrc(iframeCode) && (
            <p className="text-xs text-gray-500">
              Source: <a href={extractIframeSrc(iframeCode)} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                {extractIframeSrc(iframeCode)}
              </a>
            </p>
          )}
        </div>
      )}
    </div>
  );
});

OembedField.displayName = 'OembedField';

export default OembedField; 