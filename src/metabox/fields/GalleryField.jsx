import React, { useState, useEffect, useRef } from 'react';
import { Plus, X, Image as ImageIcon, Search, Filter, RefreshCw, Eye, Trash2 } from 'lucide-react';

const GalleryField = ({ 
  field, 
  value = [], 
  onChange, 
  fieldConfig = {},
  isRequired = false,
  placeholder = '',
  className = ''
}) => {
  const [localValue, setLocalValue] = useState([]);
  const [availableImages, setAvailableImages] = useState([]);
  const [selectedImages, setSelectedImages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMimeType, setSelectedMimeType] = useState('');
  const [showSearchInput, setShowSearchInput] = useState(false);
  const [mediaFrame, setMediaFrame] = useState(null);

  // Configuration from field
  const {
    max_images = 0,
    min_images = 0,
    allowed_types = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    show_preview = true,
    preview_size = 'medium'
  } = fieldConfig;

  const searchTimeoutRef = useRef(null);

  // Initialize local value
  useEffect(() => {
    if (Array.isArray(value)) {
      setLocalValue(value);
      setSelectedImages(value);
    }
  }, [value]);

  // Fetch available images from WordPress media library
  const fetchImages = async (search = '', mimeType = '') => {
    setIsLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('action', 'ccc_get_gallery_media');
      formData.append('nonce', window.getNonce ? window.getNonce() : (window.cccData?.nonce || ''));
      formData.append('search', search);
      formData.append('mime_type', mimeType);
      formData.append('per_page', '50');
      formData.append('allowed_types', JSON.stringify(allowed_types));

      const response = await fetch(window.cccData?.ajaxUrl || window.ajaxurl, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        const images = data.data || [];
        setAvailableImages(images);
        console.log('GalleryField: Fetched images:', images.length);
      } else {
        setError(data.data || 'Failed to fetch images');
        setAvailableImages([]);
      }
    } catch (err) {
      setError('Network error occurred');
      setAvailableImages([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle search with debounce
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      fetchImages(value, selectedMimeType);
    }, 300);
  };

  // Handle mime type filter change
  const handleMimeTypeChange = (value) => {
    setSelectedMimeType(value);
    fetchImages(searchTerm, value);
  };

  // Handle adding image to gallery
  const handleAddImage = (image) => {
    const isAlreadySelected = localValue.some(selected => 
      (typeof selected === 'object' ? selected.id : selected) === image.id
    );

    if (isAlreadySelected) {
      return;
    }

    if (max_images > 0 && localValue.length >= max_images) {
      setError(`Maximum ${max_images} images allowed`);
      return;
    }

    const newValue = [...localValue, image];
    setLocalValue(newValue);
    setSelectedImages(newValue);
    onChange(newValue);
    setError('');
  };

  // Handle removing image from gallery
  const handleRemoveImage = (imageId) => {
    const newValue = localValue.filter(item => 
      (typeof item === 'object' ? item.id : item) !== imageId
    );
    setLocalValue(newValue);
    setSelectedImages(newValue);
    onChange(newValue);
    setError('');
  };

  // Handle reordering images (drag and drop)
  const handleReorderImages = (fromIndex, toIndex) => {
    const newValue = [...localValue];
    const [movedItem] = newValue.splice(fromIndex, 1);
    newValue.splice(toIndex, 0, movedItem);
    setLocalValue(newValue);
    setSelectedImages(newValue);
    onChange(newValue);
  };

  // Open WordPress media library
  const openMediaLibrary = () => {
    if (typeof wp === 'undefined' || !wp.media) {
      setError('WordPress media library not available');
      return;
    }

    const frame = wp.media({
      title: 'Select Images for Gallery',
      multiple: true,
      library: {
        type: allowed_types
      }
    });

    frame.on('select', () => {
      const selection = frame.state().get('selection');
      const selectedMedia = selection.map(item => item.toJSON());
      
      // Add new images to gallery
      const newImages = selectedMedia.filter(media => 
        !localValue.some(existing => 
          (typeof existing === 'object' ? existing.id : existing) === media.id
        )
      );

      if (max_images > 0 && localValue.length + newImages.length > max_images) {
        setError(`Maximum ${max_images} images allowed. Can only add ${max_images - localValue.length} more.`);
        return;
      }

      const newValue = [...localValue, ...newImages];
      setLocalValue(newValue);
      setSelectedImages(newValue);
      onChange(newValue);
      setError('');
    });

    frame.open();
    setMediaFrame(frame);
  };

  // Get available mime types for filter
  const getAvailableMimeTypes = () => {
    const types = [...new Set(availableImages.map(img => img.mime_type))];
    return types.map(type => ({
      value: type,
      label: type.split('/')[1].toUpperCase()
    }));
  };

  // Initialize on mount
  useEffect(() => {
    fetchImages();
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      if (mediaFrame) {
        mediaFrame.close();
      }
    };
  }, [mediaFrame]);

  return (
    <div className={`ccc-field ccc-gallery-field ${className}`}>
      <div className="ccc-gallery-header">
        <div className="ccc-gallery-title">
          <ImageIcon className="ccc-icon" />
          <span>{field?.label || 'Gallery'}</span>
          {isRequired && <span className="ccc-required">*</span>}
        </div>
        
        <div className="ccc-gallery-actions">
          <button
            type="button"
            onClick={openMediaLibrary}
            className="ccc-btn ccc-btn-primary ccc-btn-sm"
            disabled={max_images > 0 && localValue.length >= max_images}
          >
            <Plus className="ccc-icon" />
            Add Images
          </button>
          
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className="ccc-btn ccc-btn-secondary ccc-btn-sm"
          >
            <Filter className="ccc-icon" />
          </button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="ccc-gallery-filters">
          <div className="ccc-search-container">
            <div className="ccc-search-input-wrapper">
              <Search className="ccc-search-icon" />
              <input
                type="text"
                placeholder="Search images..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="ccc-search-input"
              />
            </div>
          </div>
          
          <div className="ccc-filter-dropdown">
            <select
              value={selectedMimeType}
              onChange={(e) => handleMimeTypeChange(e.target.value)}
              className="ccc-filter-select"
            >
              <option value="">All Types</option>
              {getAvailableMimeTypes().map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="ccc-error-message">
          {error}
        </div>
      )}

      {/* Gallery Preview */}
      {localValue.length > 0 && (
        <div className="ccc-gallery-preview">
          <div className="ccc-gallery-header-info">
            <span className="ccc-gallery-count">
              {localValue.length} image{localValue.length !== 1 ? 's' : ''} selected
            </span>
            {min_images > 0 && (
              <span className="ccc-gallery-requirement">
                (Minimum: {min_images}, Maximum: {max_images || 'Unlimited'})
              </span>
            )}
          </div>
          
          <div className="ccc-gallery-grid">
            {localValue.map((image, index) => (
              <div key={typeof image === 'object' ? image.id : image} className="ccc-gallery-item">
                <div className="ccc-gallery-item-content">
                  {show_preview && image.url && (
                    <img
                      src={image.url}
                      alt={image.alt || 'Gallery image'}
                      className="ccc-gallery-thumbnail"
                    />
                  )}
                  
                  <div className="ccc-gallery-item-overlay">
                    <div className="ccc-gallery-item-info">
                      <span className="ccc-gallery-item-title">
                        {image.title || image.filename || `Image ${index + 1}`}
                      </span>
                      <span className="ccc-gallery-item-size">
                        {image.filesizeHumanReadable || 'Unknown size'}
                      </span>
                    </div>
                    
                    <div className="ccc-gallery-item-actions">
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(typeof image === 'object' ? image.id : image)}
                        className="ccc-gallery-remove-btn"
                        title="Remove from gallery"
                      >
                        <X className="ccc-icon" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Available Images (for reference) */}
      {availableImages.length > 0 && (
        <div className="ccc-gallery-available">
          <div className="ccc-gallery-section-title">
            Available Images ({availableImages.length})
          </div>
          
          {isLoading ? (
            <div className="ccc-loading">Loading images...</div>
          ) : (
            <div className="ccc-gallery-grid">
              {availableImages.map((image) => {
                const isSelected = localValue.some(selected => 
                  (typeof selected === 'object' ? selected.id : selected) === image.id
                );
                
                return (
                  <div 
                    key={image.id} 
                    className={`ccc-gallery-item ${isSelected ? 'ccc-gallery-item-selected' : ''}`}
                    onClick={isSelected ? undefined : () => handleAddImage(image)}
                    style={{ 
                      cursor: isSelected ? 'not-allowed' : 'pointer',
                      opacity: isSelected ? 0.5 : 1
                    }}
                    title={isSelected ? "Image already in gallery" : "Click to add to gallery"}
                  >
                    <div className="ccc-gallery-item-content">
                      <img
                        src={image.url}
                        alt={image.alt || 'Available image'}
                        className="ccc-gallery-thumbnail"
                      />
                      
                      <div className="ccc-gallery-item-overlay">
                        <div className="ccc-gallery-item-info">
                          <span className="ccc-gallery-item-title">
                            {image.title || image.filename}
                          </span>
                          <span className="ccc-gallery-item-size">
                            {image.filesizeHumanReadable}
                          </span>
                        </div>
                        
                        <div className="ccc-gallery-item-actions">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!isSelected) {
                                handleAddImage(image);
                              }
                            }}
                            className="ccc-gallery-add-btn"
                            disabled={isSelected || (max_images > 0 && localValue.length >= max_images)}
                            title={
                              isSelected ? "Image already in gallery" :
                              max_images > 0 && localValue.length >= max_images ? `Maximum ${max_images} images allowed` : 
                              "Click to add to gallery"
                            }
                          >
                            <Plus className="ccc-icon" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {localValue.length === 0 && !isLoading && (
        <div className="ccc-gallery-empty">
          <ImageIcon className="ccc-empty-icon" />
          <p>No images selected</p>
          <button
            type="button"
            onClick={openMediaLibrary}
            className="ccc-btn ccc-btn-primary"
          >
            <Plus className="ccc-icon" />
            Add Images
          </button>
        </div>
      )}

      {/* Hidden input for form submission */}
      <input
        type="hidden"
        name={field?.name || 'gallery'}
        value={JSON.stringify(localValue)}
      />
    </div>
  );
};

export default GalleryField;
