import React, { useState, useEffect, useRef } from 'react';
import { Plus, X, Image as ImageIcon, Upload, Trash2, Edit3 } from 'lucide-react';

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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [mediaFrame, setMediaFrame] = useState(null);

  // Configuration from field
  const {
    max_images = 0,
    min_images = 0,
    allowed_types = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    show_preview = true,
    preview_size = 'medium'
  } = fieldConfig;

  // Debug logging
  useEffect(() => {
    console.log('GalleryField: fieldConfig received:', fieldConfig);
    console.log('GalleryField: max_images:', max_images);
    console.log('GalleryField: min_images:', min_images);
    console.log('GalleryField: allowed_types:', allowed_types);
    console.log('GalleryField: show_preview:', show_preview);
    console.log('GalleryField: preview_size:', preview_size);
  }, [fieldConfig, max_images, min_images, allowed_types, show_preview, preview_size]);

  // Initialize local value
  useEffect(() => {
    if (Array.isArray(value)) {
      setLocalValue(value);
    } else if (typeof value === 'string' && value) {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) {
          setLocalValue(parsed);
        }
      } catch (e) {
        console.error('GalleryField: Failed to parse value:', e);
        setLocalValue([]);
      }
    } else {
      setLocalValue([]);
    }
  }, [value]);

  // Handle removing image from gallery
  const handleRemoveImage = (imageId) => {
    const newValue = localValue.filter(item => 
      (typeof item === 'object' ? item.id : item) !== imageId
    );
    setLocalValue(newValue);
    onChange(newValue);
    setError('');
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
      onChange(newValue);
      setError('');
    });

    frame.open();
    setMediaFrame(frame);
  };

  // Open media library to edit existing gallery
  const editGallery = () => {
    if (typeof wp === 'undefined' || !wp.media) {
      setError('WordPress media library not available');
      return;
    }

    const frame = wp.media({
      title: 'Edit Gallery',
      multiple: true,
      library: {
        type: allowed_types
      },
      frame: 'select'
    });

    // Pre-select current images
    frame.on('open', () => {
      const selection = frame.state().get('selection');
      localValue.forEach(image => {
        const attachment = wp.media.attachment(image.id);
        attachment.fetch();
        selection.add(attachment);
      });
    });

    frame.on('select', () => {
      const selection = frame.state().get('selection');
      const selectedMedia = selection.map(item => item.toJSON());
      
      if (max_images > 0 && selectedMedia.length > max_images) {
        setError(`Maximum ${max_images} images allowed.`);
        return;
      }

      setLocalValue(selectedMedia);
      onChange(selectedMedia);
      setError('');
    });

    frame.open();
    setMediaFrame(frame);
  };

  // Cleanup
  useEffect(() => {
    return () => {
      if (mediaFrame) {
        mediaFrame.close();
      }
    };
  }, [mediaFrame]);

  return (
    <div className={`ccc-field ccc-gallery-field ${className}`}>
      {/* Field Header */}
      <div className="ccc-gallery-header">
        <div className="ccc-gallery-title">
          <ImageIcon className="ccc-icon" />
          <span>{field?.label || 'Gallery'}</span>
          {isRequired && <span className="ccc-required">*</span>}
        </div>
        
        <div className="ccc-gallery-actions">
          {localValue.length > 0 && (
            <button
              type="button"
              onClick={editGallery}
              className="ccc-btn ccc-btn-secondary ccc-btn-sm"
              title="Edit gallery"
            >
              <Edit3 className="ccc-icon" />
              Edit
            </button>
          )}
          
          <button
            type="button"
            onClick={openMediaLibrary}
            className="ccc-btn ccc-btn-primary ccc-btn-sm"
            disabled={max_images > 0 && localValue.length >= max_images}
            title={max_images > 0 && localValue.length >= max_images ? `Maximum ${max_images} images allowed` : "Add images to gallery"}
          >
            <Plus className="ccc-icon" />
            {localValue.length > 0 ? 'Add More' : 'Add Images'}
          </button>
        </div>
      </div>

      {/* Gallery Info */}
      {localValue.length > 0 && (
        <div className="ccc-gallery-info">
          <span className="ccc-gallery-count">
            {localValue.length} image{localValue.length !== 1 ? 's' : ''} selected
          </span>
          {(min_images > 0 || max_images > 0) && (
            <span className="ccc-gallery-limits">
              {min_images > 0 && `Min: ${min_images}`}
              {min_images > 0 && max_images > 0 && ' • '}
              {max_images > 0 && `Max: ${max_images}`}
            </span>
          )}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="ccc-error-message">
          <X className="ccc-icon" />
          {error}
        </div>
      )}

      {/* Gallery Preview */}
      {localValue.length > 0 && (
        <div className="ccc-gallery-preview">
          <div className="ccc-gallery-grid">
            {localValue.map((image, index) => (
              <div key={typeof image === 'object' ? image.id : image} className="ccc-gallery-item">
                <div className="ccc-gallery-item-content">
                  {show_preview && image.url && (
                    <div className="ccc-gallery-thumbnail-container">
                      <img
                        src={image.url}
                        alt={image.alt || 'Gallery image'}
                        className="ccc-gallery-thumbnail"
                      />
                      <div className="ccc-gallery-item-overlay">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveImage(typeof image === 'object' ? image.id : image);
                          }}
                          className="ccc-gallery-remove-btn"
                          title="Remove from gallery"
                        >
                          <Trash2 className="ccc-icon" />
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {!show_preview && (
                    <div className="ccc-gallery-no-preview">
                      <ImageIcon className="ccc-icon" />
                      <span>Preview disabled</span>
                    </div>
                  )}
                  
                  <div className="ccc-gallery-item-info">
                    <span className="ccc-gallery-item-title" title={image.title || image.filename}>
                      {image.title || image.filename || `Image ${index + 1}`}
                    </span>
                    {image.filesizeHumanReadable && (
                      <span className="ccc-gallery-item-size">
                        {image.filesizeHumanReadable}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {localValue.length === 0 && (
        <div className="ccc-gallery-empty">
          <div className="ccc-gallery-empty-content">
            <div className="ccc-gallery-empty-icon">
              <ImageIcon className="ccc-icon" />
            </div>
            <h4>No images selected</h4>
            <p>Click "Add Images" to select images from your media library</p>
            <button
              type="button"
              onClick={openMediaLibrary}
              className="ccc-btn ccc-btn-primary"
            >
              <Plus className="ccc-icon" />
              Add Images
            </button>
          </div>
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

// CSS Styles for Gallery Field
const galleryFieldStyles = `
  .ccc-gallery-field {
    margin-bottom: 20px;
  }
  
  .ccc-gallery-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
    padding-bottom: 8px;
    border-bottom: 1px solid #e5e7eb;
  }
  
  .ccc-gallery-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 600;
    color: #374151;
  }
  
  .ccc-gallery-title .ccc-icon {
    width: 18px;
    height: 18px;
    color: #6b7280;
  }
  
  .ccc-gallery-actions {
    display: flex;
    gap: 8px;
  }
  
  .ccc-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 500;
    text-decoration: none;
    border: none;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .ccc-btn-primary {
    background-color: #3b82f6;
    color: white;
  }
  
  .ccc-btn-primary:hover:not(:disabled) {
    background-color: #2563eb;
  }
  
  .ccc-btn-secondary {
    background-color: #f3f4f6;
    color: #374151;
    border: 1px solid #d1d5db;
  }
  
  .ccc-btn-secondary:hover:not(:disabled) {
    background-color: #e5e7eb;
  }
  
  .ccc-btn-sm {
    padding: 6px 12px;
    font-size: 13px;
  }
  
  .ccc-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .ccc-gallery-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
    font-size: 14px;
    color: #6b7280;
  }
  
  .ccc-gallery-count {
    font-weight: 500;
  }
  
  .ccc-gallery-limits {
    font-size: 12px;
    color: #9ca3af;
  }
  
  .ccc-error-message {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px;
    background-color: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 6px;
    color: #dc2626;
    font-size: 14px;
    margin-bottom: 12px;
  }
  
  .ccc-error-message .ccc-icon {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
  }
  
  .ccc-gallery-preview {
    margin-bottom: 16px;
  }
  
  .ccc-gallery-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 12px;
  }
  
  .ccc-gallery-item {
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    overflow: hidden;
    background-color: white;
    transition: all 0.2s ease;
  }
  
  .ccc-gallery-item:hover {
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    border-color: #d1d5db;
  }
  
  .ccc-gallery-item-content {
    position: relative;
  }
  
  .ccc-gallery-thumbnail-container {
    position: relative;
    width: 100%;
    height: 100px;
    overflow: hidden;
  }
  
  .ccc-gallery-no-preview {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100px;
    background-color: #f3f4f6;
    color: #6b7280;
    font-size: 12px;
  }
  
  .ccc-gallery-no-preview .ccc-icon {
    width: 24px;
    height: 24px;
    margin-bottom: 4px;
    color: #9ca3af;
  }
  
  .ccc-gallery-thumbnail {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.2s ease;
  }
  
  .ccc-gallery-item:hover .ccc-gallery-thumbnail {
    transform: scale(1.05);
  }
  
  .ccc-gallery-item-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.2s ease;
  }
  
  .ccc-gallery-item:hover .ccc-gallery-item-overlay {
    opacity: 1;
  }
  
  .ccc-gallery-remove-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    background-color: #dc2626;
    color: white;
    border: none;
    border-radius: 50%;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .ccc-gallery-remove-btn:hover {
    background-color: #b91c1c;
    transform: scale(1.1);
  }
  
  .ccc-gallery-remove-btn .ccc-icon {
    width: 16px;
    height: 16px;
  }
  
  .ccc-gallery-item-info {
    padding: 8px;
  }
  
  .ccc-gallery-item-title {
    display: block;
    font-size: 12px;
    font-weight: 500;
    color: #374151;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-bottom: 4px;
  }
  
  .ccc-gallery-item-size {
    display: block;
    font-size: 11px;
    color: #6b7280;
  }
  
  .ccc-gallery-empty {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 200px;
    border: 2px dashed #d1d5db;
    border-radius: 8px;
    background-color: #f9fafb;
    text-align: center;
  }
  
  .ccc-gallery-empty-content {
    max-width: 300px;
  }
  
  .ccc-gallery-empty-icon {
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .ccc-gallery-empty-icon .ccc-icon {
    width: 48px;
    height: 48px;
    color: #9ca3af;
  }
  
  .ccc-gallery-empty h4 {
    margin: 0 0 8px 0;
    font-size: 18px;
    font-weight: 600;
    color: #374151;
  }
  
  .ccc-gallery-empty p {
    margin: 0 0 16px 0;
    color: #6b7280;
    line-height: 1.5;
  }
  
  .ccc-required {
    color: #dc2626;
    margin-left: 4px;
  }
  
  .ccc-icon {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
  }
`;

// Inject styles into the document
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = galleryFieldStyles;
  document.head.appendChild(styleSheet);
}
