import React, { useState, useEffect } from 'react';
import { ExternalLink, Eye, EyeOff, Settings } from 'lucide-react';

const OembedField = ({ field, value, onChange, isSubmitting }) => {
  const [iframeCode, setIframeCode] = useState(value || '');
  const [showSettings, setShowSettings] = useState(false);
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

  useEffect(() => {
    if (onChange) {
      onChange(iframeCode);
    }
  }, [iframeCode, onChange]);

  const handleIframeCodeChange = (e) => {
    const newCode = e.target.value;
    setIframeCode(newCode);
    setError('');
  };

  const extractIframeSrc = (iframeCode) => {
    const srcMatch = iframeCode.match(/src=["']([^"']+)["']/);
    return srcMatch ? srcMatch[1] : null;
  };

  const extractIframeTitle = (iframeCode) => {
    const titleMatch = iframeCode.match(/title=["']([^"']+)["']/);
    return titleMatch ? titleMatch[1] : null;
  };

  const getPreviewStyle = () => ({
    width: width === '100%' ? '100%' : `${width}px`,
    height: height === '400px' ? '400px' : `${height}px`,
    border: '1px solid #ddd',
    borderRadius: '4px',
    overflow: 'hidden'
  });

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
    return code.trim().startsWith('<iframe') && code.includes('src=');
  };

  return (
    <div className="ccc-field ccc-oembed-field">
      <div className="ccc-field-header">
        <label className="ccc-field-label">
          {field.label}
          {field.required && <span className="required">*</span>}
        </label>
        <div className="ccc-field-actions">
          <button
            type="button"
            className="ccc-field-action-btn"
            onClick={() => setShowSettings(!showSettings)}
            title="Settings"
          >
            <Settings size={16} />
          </button>
          {iframeCode && isValidIframeCode(iframeCode) && (
            <button
              type="button"
              className="ccc-field-action-btn"
              onClick={() => setShowPreview(!showPreview)}
              title={showPreview ? "Hide Preview" : "Show Preview"}
            >
              {showPreview ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          )}
        </div>
      </div>
      
      <div className="ccc-oembed-input-container">
        <textarea
          value={iframeCode}
          onChange={handleIframeCodeChange}
          placeholder="Paste your iframe code here (e.g., Google Maps, YouTube, Vimeo embed code)"
          className="ccc-field-textarea ccc-oembed-iframe-textarea"
          rows={4}
          disabled={isSubmitting}
        />
      </div>
      
      {error && (
        <div className="ccc-field-error">
          {error}
        </div>
      )}
      
      {iframeCode && !isValidIframeCode(iframeCode) && (
        <div className="ccc-field-warning">
          Please enter a valid iframe code starting with &lt;iframe
        </div>
      )}
      
      {showSettings && (
        <div className="ccc-oembed-settings">
          <div className="ccc-oembed-setting-row">
            <div className="ccc-oembed-setting">
              <label>Width:</label>
              <input
                type="text"
                defaultValue={width}
                placeholder="100%"
                className="ccc-field-input ccc-oembed-width"
              />
            </div>
            <div className="ccc-oembed-setting">
              <label>Height:</label>
              <input
                type="text"
                defaultValue={height}
                placeholder="400px"
                className="ccc-field-input ccc-oembed-height"
              />
            </div>
          </div>
        </div>
      )}
      
      {showPreview && iframeCode && isValidIframeCode(iframeCode) && (
        <div className="ccc-oembed-preview" style={getPreviewStyle()}>
          <div
            className="ccc-oembed-preview-content"
            dangerouslySetInnerHTML={{ __html: getProcessedIframeCode() }}
          />
        </div>
      )}
      
      {iframeCode && isValidIframeCode(iframeCode) && show_title && extractIframeTitle(iframeCode) && (
        <div className="ccc-oembed-info">
          <h4>{extractIframeTitle(iframeCode)}</h4>
          {extractIframeSrc(iframeCode) && (
            <p className="ccc-oembed-src">
              Source: <a href={extractIframeSrc(iframeCode)} target="_blank" rel="noopener noreferrer">
                {extractIframeSrc(iframeCode)}
              </a>
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default OembedField; 