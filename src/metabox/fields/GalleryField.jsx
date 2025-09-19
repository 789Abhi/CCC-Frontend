import React, { useState, useEffect, useRef } from 'react';
import { Plus, X, Image as ImageIcon, Upload, Trash2, Edit3, GripVertical, Eye, EyeOff } from 'lucide-react';

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

  // Initialize local value with enhanced image objects
  useEffect(() => {
    if (Array.isArray(value)) {
      // Ensure each image has toggle state and unique key for drag and drop
      const enhancedValue = value.map((item, index) => {
        if (typeof item === 'object') {
          return {
            ...item,
            enabled: item.enabled !== undefined ? item.enabled : true,
            dragKey: item.dragKey || `${item.id}_${Date.now()}_${index}`
          };
        } else {
          return {
            id: item,
            enabled: true,
            dragKey: `${item}_${Date.now()}_${index}`
          };
        }
      });
      setLocalValue(enhancedValue);
    } else if (typeof value === 'string' && value) {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) {
          const enhancedValue = parsed.map((item, index) => {
            if (typeof item === 'object') {
              return {
                ...item,
                enabled: item.enabled !== undefined ? item.enabled : true,
                dragKey: item.dragKey || `${item.id}_${Date.now()}_${index}`
              };
            } else {
              return {
                id: item,
                enabled: true,
                dragKey: `${item}_${Date.now()}_${index}`
              };
            }
          });
          setLocalValue(enhancedValue);
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
  const handleRemoveImage = (dragKey) => {
    const newValue = localValue.filter(item => item.dragKey !== dragKey);
    setLocalValue(newValue);
    onChange(newValue);
    setError('');
  };

  // Handle toggle image visibility
  const handleToggleImage = (dragKey) => {
    const newValue = localValue.map(item => 
      item.dragKey === dragKey ? { ...item, enabled: !item.enabled } : item
    );
    setLocalValue(newValue);
    onChange(newValue);
  };

  // Handle drag and drop reordering
  const handleDragStart = (e, dragKey) => {
    e.dataTransfer.setData('text/plain', dragKey);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, targetDragKey) => {
    e.preventDefault();
    const draggedKey = e.dataTransfer.getData('text/plain');
    
    if (draggedKey === targetDragKey) return;
    
    const draggedIndex = localValue.findIndex(item => item.dragKey === draggedKey);
    const targetIndex = localValue.findIndex(item => item.dragKey === targetDragKey);
    
    if (draggedIndex === -1 || targetIndex === -1) return;
    
    const newValue = [...localValue];
    const [draggedItem] = newValue.splice(draggedIndex, 1);
    newValue.splice(targetIndex, 0, draggedItem);
    
    setLocalValue(newValue);
    onChange(newValue);
  };

  // Get only enabled images for fetching/display purposes
  const getEnabledImages = () => {
    return localValue.filter(image => image.enabled);
  };

  // Get all images (including disabled ones)
  const getAllImages = () => {
    return localValue;
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
      
      // Add new images to gallery (allow duplicates)
      const newImages = selectedMedia.map(media => ({
        ...media,
        enabled: true,
        dragKey: `${media.id}_${Date.now()}_${Math.random()}`
      }));

      // Note: Removed duplicate check and max_images limit to allow unlimited duplicates
      // if (max_images > 0 && localValue.length + newImages.length > max_images) {
      //   setError(`Maximum ${max_images} images allowed. Can only add ${max_images - localValue.length} more.`);
      //   return;
      // }

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
      
      // Note: Removed max_images limit to allow unlimited images
      // if (max_images > 0 && selectedMedia.length > max_images) {
      //   setError(`Maximum ${max_images} images allowed.`);
      //   return;
      // }

      const enhancedMedia = selectedMedia.map((media, index) => ({
        ...media,
        enabled: true,
        dragKey: media.dragKey || `${media.id}_${Date.now()}_${index}`
      }));
      
      setLocalValue(enhancedMedia);
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
            {getEnabledImages().length} of {localValue.length} image{localValue.length !== 1 ? 's' : ''} enabled
          </span>
          {getEnabledImages().length !== localValue.length && (
            <span className="ccc-gallery-disabled-count">
              ({localValue.length - getEnabledImages().length} hidden)
            </span>
          )}
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
              <div 
                key={image.dragKey} 
                className={`ccc-gallery-item ${!image.enabled ? 'ccc-gallery-item-disabled' : ''}`}
                draggable={true}
                onDragStart={(e) => handleDragStart(e, image.dragKey)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, image.dragKey)}
              >
                <div className="ccc-gallery-item-content">
                  {/* Drag Handle */}
                  <div className="ccc-gallery-drag-handle">
                    <GripVertical className="ccc-icon" />
                  </div>
                  
                  {/* Toggle Switch */}
                  <div className="ccc-gallery-toggle-container">
                    <label className="ccc-toggle-switch">
                      <input
                        type="checkbox"
                        checked={image.enabled}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleToggleImage(image.dragKey);
                        }}
                      />
                      <span className="ccc-toggle-slider"></span>
                    </label>
                  </div>
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
                            handleRemoveImage(image.dragKey);
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
                    <div className="ccc-gallery-item-status">
                      <span className={`ccc-status-indicator ${image.enabled ? 'ccc-status-enabled' : 'ccc-status-disabled'}`}>
                        {image.enabled ? 'Visible' : 'Hidden'}
                      </span>
                    </div>
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

      {/* Hidden inputs for form submission */}
      <input
        type="hidden"
        name={field?.name || 'gallery'}
        value={JSON.stringify(getEnabledImages())}
      />
      <input
        type="hidden"
        name={`${field?.name || 'gallery'}_all`}
        value={JSON.stringify(getAllImages())}
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
  
  .ccc-gallery-disabled-count {
    font-size: 12px;
    color: #9ca3af;
    margin-left: 4px;
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
    cursor: move;
    position: relative;
  }
  
  .ccc-gallery-item:hover {
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    border-color: #d1d5db;
  }
  
  .ccc-gallery-item-disabled {
    opacity: 0.6;
    border-color: #f3f4f6;
  }
  
  .ccc-gallery-item-disabled:hover {
    box-shadow: none;
    border-color: #f3f4f6;
  }
  
  .ccc-gallery-item-content {
    position: relative;
  }
  
  .ccc-gallery-drag-handle {
    position: absolute;
    top: 4px;
    left: 4px;
    background-color: rgba(0, 0, 0, 0.7);
    color: white;
    padding: 4px;
    border-radius: 4px;
    opacity: 0;
    transition: opacity 0.2s ease;
    z-index: 10;
  }
  
  .ccc-gallery-item:hover .ccc-gallery-drag-handle {
    opacity: 1;
  }
  
  .ccc-gallery-drag-handle .ccc-icon {
    width: 12px;
    height: 12px;
  }
  
  .ccc-gallery-toggle-container {
    position: absolute;
    top: 4px;
    right: 4px;
    opacity: 0;
    transition: opacity 0.2s ease;
    z-index: 10;
  }
  
  .ccc-gallery-item:hover .ccc-gallery-toggle-container {
    opacity: 1;
  }
  
  .ccc-toggle-switch {
    position: relative;
    display: inline-block;
    width: 32px;
    height: 18px;
    cursor: pointer;
  }
  
  .ccc-toggle-switch input {
    opacity: 0;
    width: 0;
    height: 0;
  }
  
  .ccc-toggle-slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #ccc;
    transition: 0.3s;
    border-radius: 18px;
    border: 1px solid #ff69b4;
  }
  
  .ccc-toggle-slider:before {
    position: absolute;
    content: "";
    height: 14px;
    width: 14px;
    left: 1px;
    bottom: 1px;
    background-color: white;
    transition: 0.3s;
    border-radius: 50%;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  }
  
  .ccc-toggle-switch input:checked + .ccc-toggle-slider {
    background-color: #22c55e;
  }
  
  .ccc-toggle-switch input:checked + .ccc-toggle-slider:before {
    transform: translateX(14px);
  }
  
  .ccc-toggle-switch:hover .ccc-toggle-slider {
    box-shadow: 0 0 8px rgba(0, 0, 0, 0.2);
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
  
  .ccc-gallery-item-status {
    margin-top: 4px;
  }
  
  .ccc-status-indicator {
    display: inline-block;
    padding: 2px 6px;
    border-radius: 12px;
    font-size: 10px;
    font-weight: 500;
    text-transform: uppercase;
  }
  
  .ccc-status-enabled {
    background-color: #d1fae5;
    color: #065f46;
  }
  
  .ccc-status-disabled {
    background-color: #f3f4f6;
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
