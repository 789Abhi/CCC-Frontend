import React, { useState, useEffect } from 'react';
import { ExternalLink, Eye, EyeOff, Settings } from 'lucide-react';

const OembedField = ({ field, value, onChange, isSubmitting }) => {
  const [url, setUrl] = useState(value || '');
  const [preview, setPreview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [error, setError] = useState('');

  // Parse field config
  const config = field.config ? (typeof field.config === 'string' ? JSON.parse(field.config) : field.config) : {};
  const {
    width = '100%',
    height = '400px',
    autoplay = false,
    allow_fullscreen = true,
    show_title = true,
    show_author = false,
    show_related = false
  } = config;

  useEffect(() => {
    if (onChange) {
      onChange(url);
    }
  }, [url, onChange]);

  const fetchOembed = async (url) => {
    if (!url) {
      setPreview(null);
      setError('');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Use WordPress oEmbed API
      const response = await fetch(`/wp-json/oembed/1.0/proxy?url=${encodeURIComponent(url)}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch embed data');
      }

      const data = await response.json();
      
      if (data.html) {
        setPreview(data);
        setShowPreview(true);
      } else {
        setError('No embed data found for this URL');
      }
    } catch (err) {
      console.error('OEmbed error:', err);
      setError('Failed to load embed preview. Please check the URL.');
      setPreview(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUrlChange = (e) => {
    const newUrl = e.target.value;
    setUrl(newUrl);
    setError('');
    
    // Auto-fetch preview if URL looks valid
    if (newUrl && isValidUrl(newUrl)) {
      // Debounce the fetch
      const timeoutId = setTimeout(() => {
        fetchOembed(newUrl);
      }, 1000);
      
      return () => clearTimeout(timeoutId);
    } else {
      setPreview(null);
    }
  };

  const handlePreviewClick = () => {
    if (url && isValidUrl(url)) {
      fetchOembed(url);
    }
  };

  const isValidUrl = (string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const getEmbedHtml = () => {
    if (!preview || !preview.html) return null;

    let embedHtml = preview.html;

    // Add autoplay parameter for supported platforms
    if (autoplay) {
      if (embedHtml.includes('youtube.com') || embedHtml.includes('youtu.be')) {
        embedHtml = embedHtml.replace('?', '?autoplay=1&muted=1&');
      } else if (embedHtml.includes('vimeo.com')) {
        embedHtml = embedHtml.replace('?', '?autoplay=1&muted=1&');
      }
    }

    // Add fullscreen parameter
    if (!allow_fullscreen) {
      embedHtml = embedHtml.replace('allowfullscreen', '');
    }

    return embedHtml;
  };

  const getPreviewStyle = () => ({
    width: width === '100%' ? '100%' : `${width}px`,
    height: height === '400px' ? '400px' : `${height}px`,
    border: '1px solid #ddd',
    borderRadius: '4px',
    overflow: 'hidden'
  });

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
          {preview && (
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
        <input
          type="url"
          value={url}
          onChange={handleUrlChange}
          placeholder="Enter URL (YouTube, Vimeo, Google Maps, etc.)"
          className="ccc-field-input ccc-oembed-url-input"
          disabled={isSubmitting}
        />
        <button
          type="button"
          onClick={handlePreviewClick}
          disabled={!url || isLoading || isSubmitting}
          className="ccc-field-btn ccc-oembed-preview-btn"
        >
          {isLoading ? 'Loading...' : 'Preview'}
        </button>
      </div>

      {error && (
        <div className="ccc-field-error">
          {error}
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
          <div className="ccc-oembed-setting-row">
            <label className="ccc-checkbox-label">
              <input
                type="checkbox"
                defaultChecked={autoplay}
                className="ccc-checkbox ccc-oembed-autoplay"
              />
              Autoplay
            </label>
            <label className="ccc-checkbox-label">
              <input
                type="checkbox"
                defaultChecked={allow_fullscreen}
                className="ccc-checkbox ccc-oembed-fullscreen"
              />
              Allow Fullscreen
            </label>
          </div>
        </div>
      )}

      {showPreview && preview && (
        <div className="ccc-oembed-preview" style={getPreviewStyle()}>
          <div
            className="ccc-oembed-preview-content"
            dangerouslySetInnerHTML={{ __html: getEmbedHtml() }}
          />
        </div>
      )}

      {preview && preview.title && show_title && (
        <div className="ccc-oembed-info">
          <h4>{preview.title}</h4>
          {show_author && preview.author_name && (
            <p>By: {preview.author_name}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default OembedField; 