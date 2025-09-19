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
      // Value from database should only contain enabled images
      // But we need to maintain the full state locally for UI purposes
      const enhancedValue = value.map((item, index) => {
        if (typeof item === 'object') {
          return {
            ...item,
            enabled: true, // Images from DB are always enabled
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
                enabled: true, // Images from DB are always enabled
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
    // Only send enabled images to parent component
    const enabledImages = newValue.filter(item => item.enabled);
    onChange(enabledImages);
    setError('');
  };

  // Handle toggle image visibility
  const handleToggleImage = (dragKey) => {
    const newValue = localValue.map(item => 
      item.dragKey === dragKey ? { ...item, enabled: !item.enabled } : item
    );
    setLocalValue(newValue);
    // Keep all images in the UI, but only send enabled images to parent component
    const enabledImages = newValue.filter(item => item.enabled);
    onChange(enabledImages);
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
    // Only send enabled images to parent component
    const enabledImages = newValue.filter(item => item.enabled);
    onChange(enabledImages);
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
      // Only send enabled images to parent component
      const enabledImages = newValue.filter(item => item.enabled);
      onChange(enabledImages);
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
      // Only send enabled images to parent component
      const enabledImages = enhancedMedia.filter(item => item.enabled);
      onChange(enabledImages);
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
    <div className={`mb-5 ${className}`}>
      {/* Field Header */}
      <div className="flex justify-between items-center mb-3 pb-2 border-b border-gray-200">
        <div className="flex items-center gap-2 font-semibold text-gray-700">
          <ImageIcon className="w-4 h-4 text-gray-500" />
          <span>{field?.label || 'Gallery'}</span>
          {isRequired && <span className="text-red-600 ml-1">*</span>}
        </div>
        
        <div className="flex gap-2">
          {localValue.length > 0 && (
            <button
              type="button"
              onClick={editGallery}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 transition-colors"
              title="Edit gallery"
            >
              <Edit3 className="w-4 h-4" />
              Edit
            </button>
          )}
          
          <button
            type="button"
            onClick={openMediaLibrary}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            disabled={max_images > 0 && localValue.length >= max_images}
            title={max_images > 0 && localValue.length >= max_images ? `Maximum ${max_images} images allowed` : "Add images to gallery"}
          >
            <Plus className="w-4 h-4" />
            {localValue.length > 0 ? 'Add More' : 'Add Images'}
          </button>
        </div>
      </div>

      {/* Gallery Info */}
      {localValue.length > 0 && (
        <div className="flex justify-between items-center mb-3 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <span className="font-medium">
              {getEnabledImages().length} of {localValue.length} image{localValue.length !== 1 ? 's' : ''} enabled
            </span>
            {getEnabledImages().length !== localValue.length && (
              <span className="text-xs text-gray-400">
                ({localValue.length - getEnabledImages().length} hidden)
              </span>
            )}
          </div>
          {(min_images > 0 || max_images > 0) && (
            <span className="text-xs text-gray-400">
              {min_images > 0 && `Min: ${min_images}`}
              {min_images > 0 && max_images > 0 && ' • '}
              {max_images > 0 && `Max: ${max_images}`}
            </span>
          )}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm mb-3">
          <X className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Gallery Preview */}
      {localValue.length > 0 && (
        <div className="mb-4">
          <div className="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-3">
            {localValue.map((image, index) => (
              <div 
                key={image.dragKey} 
                className={`relative border border-gray-200 rounded-lg overflow-hidden bg-white transition-all duration-200 cursor-move hover:shadow-md hover:border-gray-300 ${!image.enabled ? 'opacity-60 border-gray-100 hover:shadow-none hover:border-gray-100' : ''}`}
                draggable={true}
                onDragStart={(e) => handleDragStart(e, image.dragKey)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, image.dragKey)}
              >
                <div className="relative">
                  {/* Drag Handle */}
                  <div className="absolute top-1 left-1 bg-black bg-opacity-70 text-white p-1 rounded opacity-0 hover:opacity-100 transition-opacity duration-200 z-10">
                    <GripVertical className="w-3 h-3" />
                  </div>
                  
                  {/* Toggle Switch and Delete Button */}
                  <div className="absolute top-1 right-1 flex gap-2 items-center opacity-0 hover:opacity-100 transition-opacity duration-200 z-10">
                    <label className="relative inline-block w-8 h-4.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={image.enabled}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleToggleImage(image.dragKey);
                        }}
                        className="opacity-0 w-0 h-0"
                      />
                      <span className={`absolute cursor-pointer top-0 left-0 right-0 bottom-0 transition-all duration-300 rounded-full border border-pink-400 ${image.enabled ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                      <span className={`absolute content-[''] h-3.5 w-3.5 bottom-0.5 bg-white transition-all duration-300 rounded-full shadow-sm ${image.enabled ? 'left-3.5' : 'left-0.5'}`}></span>
                    </label>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveImage(image.dragKey);
                      }}
                      className="flex items-center justify-center w-6 h-6 bg-red-600 bg-opacity-90 text-white border-none rounded-full cursor-pointer transition-all duration-200 p-0 hover:bg-opacity-95 hover:scale-110"
                      title="Remove from gallery"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                  {show_preview && image.url && (
                    <div className="relative w-full h-24 overflow-hidden">
                      <img
                        src={image.url}
                        alt={image.alt || 'Gallery image'}
                        className="w-full h-full object-cover transition-transform duration-200 hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-30 opacity-0 hover:opacity-100 transition-opacity duration-200 pointer-events-none"></div>
                    </div>
                  )}
                  
                  {!show_preview && (
                    <div className="flex flex-col items-center justify-center w-full h-24 bg-gray-100 text-gray-500 text-xs">
                      <ImageIcon className="w-6 h-6 mb-1 text-gray-400" />
                      <span>Preview disabled</span>
                    </div>
                  )}
                  
                  <div className="p-2">
                    <span className="block text-xs font-medium text-gray-700 whitespace-nowrap overflow-hidden text-ellipsis mb-1" title={image.title || image.filename}>
                      {image.title || image.filename || `Image ${index + 1}`}
                    </span>
                    {image.filesizeHumanReadable && (
                      <span className="block text-xs text-gray-500">
                        {image.filesizeHumanReadable}
                      </span>
                    )}
                    <div className="mt-1">
                      <span className={`inline-block px-1.5 py-0.5 rounded-full text-xs font-medium uppercase ${image.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
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
        <div className="flex items-center justify-center min-h-[200px] border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 text-center">
          <div className="max-w-xs">
            <div className="flex items-center justify-center mb-4">
              <ImageIcon className="w-12 h-12 text-gray-400" />
            </div>
            <h4 className="text-lg font-semibold text-gray-700 mb-2">No images selected</h4>
            <p className="text-gray-600 mb-4">Click "Add Images" to select images from your media library</p>
            <button
              type="button"
              onClick={openMediaLibrary}
              className="inline-flex items-center gap-2 px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Images
            </button>
          </div>
        </div>
      )}

      {/* Hidden input for form submission - only enabled images */}
      <input
        type="hidden"
        name={field?.name || 'gallery'}
        value={JSON.stringify(getEnabledImages())}
      />
    </div>
  );
};

export default GalleryField;
