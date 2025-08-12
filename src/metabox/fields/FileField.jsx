import React, { useState, useEffect, useRef } from 'react';
import { Upload, File, Image, Video, Music, Archive, Download, Trash2, X, Plus, FileText, FolderOpen } from 'lucide-react';

const FileField = ({ label, fieldName, fieldConfig, fieldValue, fieldRequired, onChange }) => {
    const [files, setFiles] = useState([]);
    const [isUploading, setIsUploading] = useState(false);
    const [isOpeningMedia, setIsOpeningMedia] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [expandedFiles, setExpandedFiles] = useState(new Set());
    const fileInputRef = useRef(null);
    const dropZoneRef = useRef(null);

    const {
        allowed_types = ['image', 'video', 'document', 'audio', 'archive'],
        max_file_size = 10, // MB
        return_type = 'url',
        multiple = false,
        show_preview = true,
        show_download = true,
        show_delete = true
    } = fieldConfig || {};

    // Check if WordPress media library is available
    useEffect(() => {
        const checkMediaLibrary = () => {
            if (typeof wp === 'undefined' || !wp.media) {
                console.warn('WordPress media library not available');
                setError('WordPress media library is not available. Please refresh the page and try again.');
            } else {
                setError('');
            }
        };

        // Check immediately
        checkMediaLibrary();

        // Check again after a short delay to ensure scripts are loaded
        const timer = setTimeout(checkMediaLibrary, 1000);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        console.log('FileField useEffect - fieldValue:', fieldValue);
        if (fieldValue) {
            try {
                let parsedValue = fieldValue;
                if (typeof fieldValue === 'string') {
                    parsedValue = JSON.parse(fieldValue);
                }
                
                console.log('FileField parsed value:', parsedValue);
                
                if (Array.isArray(parsedValue)) {
                    // Handle array of files
                    const processedFiles = parsedValue.map(file => {
                        if (file && typeof file === 'object') {
                            // Check if it's a media library file (has numeric ID)
                            if (file.id && !isNaN(file.id) && file.id > 0) {
                                return {
                                    id: file.id,
                                    name: file.name || file.filename || file.title || 'Unknown File',
                                    type: file.type || file.mime_type || 'application/octet-stream',
                                    size: file.size || file.filesize || 0,
                                    size_formatted: file.size_formatted || formatFileSize(file.size || 0),
                                    url: file.url || file.guid || '',
                                    thumbnail: file.thumbnail || file.medium || file.url || file.guid || '',
                                    is_media_library: true
                                };
                            } else {
                                // It's a temporary uploaded file
                                return {
                                    id: file.temp_id || file.id,
                                    name: file.name || 'Unknown File',
                                    type: file.type || 'application/octet-stream',
                                    size: file.size || 0,
                                    size_formatted: file.size_formatted || formatFileSize(file.size || 0),
                                    url: file.url || '',
                                    is_uploaded: true
                                };
                            }
                        }
                        return file;
                    }).filter(Boolean);
                    
                    console.log('FileField processed files:', processedFiles);
                    setFiles(processedFiles);
                } else if (parsedValue && typeof parsedValue === 'object') {
                    // Handle single file
                    if (parsedValue.id && !isNaN(parsedValue.id) && parsedValue.id > 0) {
                        // It's a media library file
                        const processedFile = {
                            id: parsedValue.id,
                            name: parsedValue.name || parsedValue.filename || parsedValue.title || 'Unknown File',
                            type: parsedValue.type || parsedValue.mime_type || 'application/octet-stream',
                            size: parsedValue.size || parsedValue.filesize || 0,
                            size_formatted: parsedValue.size_formatted || formatFileSize(parsedValue.size || 0),
                            url: parsedValue.url || parsedValue.guid || '',
                            thumbnail: parsedValue.thumbnail || parsedValue.medium || parsedValue.url || parsedValue.guid || '',
                            is_media_library: true
                        };
                        console.log('FileField processed single media library file:', processedFile);
                        setFiles([processedFile]);
                    } else {
                        // It's a temporary uploaded file
                        const processedFile = {
                            id: parsedValue.temp_id || parsedValue.id,
                            name: parsedValue.name || 'Unknown File',
                            type: parsedValue.type || 'application/octet-stream',
                            size: parsedValue.size || 0,
                            size_formatted: parsedValue.size_formatted || formatFileSize(parsedValue.size || 0),
                            url: parsedValue.url || '',
                            is_uploaded: true
                        };
                        console.log('FileField processed single uploaded file:', processedFile);
                        setFiles([processedFile]);
                    }
                }
            } catch (error) {
                console.error('Error parsing file field value:', error);
                setFiles([]);
            }
        } else {
            setFiles([]);
        }
    }, [fieldValue]);

    const showSuccessMessage = (message) => {
        setSuccessMessage(message);
        setError('');
        setTimeout(() => {
            setSuccessMessage('');
        }, 3000);
    };

    const showErrorMessage = (message) => {
        setError(message);
        setSuccessMessage('');
    };

    const getFileIcon = (fileType) => {
        if (fileType.startsWith('image/')) return <Image size={20} className="text-blue-500" />;
        if (fileType.startsWith('video/')) return <Video size={20} className="text-red-500" />;
        if (fileType.startsWith('audio/')) return <Music size={20} className="text-green-500" />;
        if (fileType === 'application/pdf') return <FileText size={20} className="text-red-600" />;
        if (fileType.includes('document') || fileType.includes('word') || fileType.includes('excel')) {
            return <File size={20} className="text-blue-600" />;
        }
        if (fileType.includes('zip') || fileType.includes('rar') || fileType.includes('tar')) {
            return <Archive size={20} className="text-orange-500" />;
        }
        return <File size={20} className="text-gray-500" />;
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const validateFile = (file) => {
        const maxSizeBytes = max_file_size * 1024 * 1024; // Convert MB to bytes
        
        if (file.size > maxSizeBytes) {
            return `File size exceeds ${max_file_size}MB limit`;
        }

        // Check file type based on allowed_types
        const fileType = file.type;
        const fileName = file.name.toLowerCase();
        
        let isAllowed = false;
        
        if (allowed_types.includes('image') && fileType.startsWith('image/')) isAllowed = true;
        if (allowed_types.includes('video') && fileType.startsWith('video/')) isAllowed = true;
        if (allowed_types.includes('audio') && fileType.startsWith('audio/')) isAllowed = true;
        if (allowed_types.includes('document') && (
            fileType === 'application/pdf' ||
            fileType.includes('document') ||
            fileType.includes('word') ||
            fileType.includes('excel') ||
            fileType === 'text/plain'
        )) isAllowed = true;
        if (allowed_types.includes('archive') && (
            fileType.includes('zip') ||
            fileType.includes('rar') ||
            fileType.includes('tar') ||
            fileType.includes('gzip')
        )) isAllowed = true;

        if (!isAllowed) {
            return 'File type not allowed';
        }

        return null; // No error
    };

    const handleFileUpload = async (uploadedFiles) => {
        setIsUploading(true);
        setError('');
        setSuccessMessage('');

        const fileArray = Array.from(uploadedFiles);
        const validFiles = [];
        const errors = [];

        for (const file of fileArray) {
            const validationError = validateFile(file);
            if (validationError) {
                errors.push(`${file.name}: ${validationError}`);
            } else {
                validFiles.push(file);
            }
        }

        if (errors.length > 0) {
            showErrorMessage(errors.join(', '));
            setIsUploading(false);
            return;
        }

        try {
            // Create file data with proper structure for database storage
            const uploadedFileData = validFiles.map(file => ({
                temp_id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                name: file.name,
                type: file.type,
                size: file.size,
                size_formatted: formatFileSize(file.size),
                url: URL.createObjectURL(file), // This creates a blob URL for preview
                is_temp: true,
                file: file // Keep reference for actual upload
            }));

            if (multiple) {
                setFiles(prev => [...prev, ...uploadedFileData]);
            } else {
                setFiles(uploadedFileData);
            }

            // Send data to parent component for database storage
            if (multiple) {
                const filesForDB = uploadedFileData.map(file => ({
                    temp_id: file.temp_id,
                    name: file.name,
                    type: file.type,
                    size: file.size,
                    is_temp: true
                }));
                onChange([...files, ...filesForDB]);
            } else {
                const fileForDB = uploadedFileData[0];
                onChange({
                    temp_id: fileForDB.temp_id,
                    name: fileForDB.name,
                    type: fileForDB.type,
                    size: fileForDB.size,
                    is_temp: true
                });
            }

            // Show success message
            if (validFiles.length > 1) {
                showSuccessMessage(`${validFiles.length} files uploaded successfully.`);
            } else {
                showSuccessMessage('File uploaded successfully.');
            }

        } catch (error) {
            showErrorMessage('Upload failed: ' + error.message);
        } finally {
            setIsUploading(false);
        }
    };

    const handleFileSelect = (event) => {
        const selectedFiles = event.target.files;
        if (selectedFiles.length > 0) {
            handleFileUpload(selectedFiles);
        }
    };

    const handleDrop = (event) => {
        event.preventDefault();
        setDragActive(false);
        
        const droppedFiles = event.dataTransfer.files;
        if (droppedFiles.length > 0) {
            handleFileUpload(droppedFiles);
        }
    };

    const handleDragOver = (event) => {
        event.preventDefault();
        setDragActive(true);
    };

    const handleDragLeave = (event) => {
        event.preventDefault();
        setDragActive(false);
    };

    const removeFile = (fileId) => {
        const fileToRemove = files.find(file => file.id === fileId);
        const updatedFiles = files.filter(file => file.id !== fileId);
        setFiles(updatedFiles);
        
        // Send consistent data structure for database storage
        if (multiple) {
            const filesForDB = updatedFiles.map(file => {
                if (file.is_media_library) {
                    return {
                        id: file.id,
                        url: file.url,
                        type: file.type,
                        name: file.name,
                        size: file.size,
                        size_formatted: file.size_formatted,
                        thumbnail: file.thumbnail,
                        is_media_library: true
                    };
                } else {
                    return {
                        temp_id: file.temp_id,
                        name: file.name,
                        type: file.type,
                        size: file.size,
                        is_temp: true
                    };
                }
            });
            onChange(filesForDB);
        } else {
            if (updatedFiles.length > 0) {
                const file = updatedFiles[0];
                if (file.is_media_library) {
                    onChange({
                        id: file.id,
                        url: file.url,
                        type: file.type,
                        name: file.name,
                        size: file.size,
                        size_formatted: file.size_formatted,
                        thumbnail: file.thumbnail,
                        is_media_library: true
                    });
                } else {
                    onChange({
                        temp_id: file.temp_id,
                        name: file.name,
                        type: file.type,
                        size: file.size,
                        is_temp: true
                    });
                }
            } else {
                onChange('');
            }
        }
        
        if (fileToRemove) {
            showSuccessMessage(`"${fileToRemove.name}" removed successfully.`);
        }
    };

    const downloadFile = (file) => {
        if (file.url) {
            const link = document.createElement('a');
            link.href = file.url;
            link.download = file.name;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    const previewFile = (file) => {
        if (file.url) {
            window.open(file.url, '_blank');
        }
    };

    const openFileModal = () => {
        fileInputRef.current?.click();
    };

    const openMediaLibrary = () => {
        setIsOpeningMedia(true);
        setError('');
        
        console.log('FileField: Opening media library...');
        console.log('FileField: wp available:', typeof wp !== 'undefined');
        console.log('FileField: wp.media available:', typeof wp !== 'undefined' && wp.media);
        
        // Check if WordPress media uploader is available
        if (typeof wp !== 'undefined' && wp.media) {
            console.log('FileField: Creating media frame...');
            const frame = wp.media({
                title: 'Select Files',
                button: {
                    text: 'Use these files'
                },
                multiple: multiple,
                library: {
                    type: allowed_types.map(type => {
                        switch(type) {
                            case 'image': return 'image';
                            case 'video': return 'video';
                            case 'audio': return 'audio';
                            case 'document': return 'application';
                            case 'archive': return 'application';
                            default: return '';
                        }
                    }).filter(Boolean)
                }
            });

            frame.on('select', () => {
                console.log('FileField: Media frame select event triggered');
                const selection = frame.state().get('selection');
                console.log('FileField: Selection:', selection);
                console.log('FileField: Selection count:', selection.length);
                const selectedFiles = [];

                selection.map(attachment => {
                    console.log('FileField: Processing attachment:', attachment);
                    console.log('FileField: Attachment ID:', attachment.id);
                    console.log('FileField: Attachment filename:', attachment.get('filename'));
                    console.log('FileField: Attachment title:', attachment.get('title'));
                    console.log('FileField: Attachment URL:', attachment.get('url'));
                    console.log('FileField: Attachment mime type:', attachment.get('mime_type'));
                    console.log('FileField: Attachment sizes:', attachment.get('sizes'));
                    
                    // Get MIME type - try multiple methods
                    let mimeType = attachment.get('mime_type');
                    if (!mimeType) {
                        // Try to get from attributes
                        mimeType = attachment.attributes.mime_type;
                    }
                    if (!mimeType) {
                        // Try to get from changed attributes
                        mimeType = attachment.changed.mime_type;
                    }
                    if (!mimeType) {
                        // Fallback based on file extension
                        const filename = attachment.get('filename') || '';
                        const ext = filename.split('.').pop().toLowerCase();
                        switch(ext) {
                            case 'jpg':
                            case 'jpeg':
                            case 'png':
                            case 'gif':
                            case 'webp':
                                mimeType = 'image/' + (ext === 'jpg' ? 'jpeg' : ext);
                                break;
                            case 'mp4':
                            case 'avi':
                            case 'mov':
                            case 'wmv':
                                mimeType = 'video/' + ext;
                                break;
                            case 'mp3':
                            case 'wav':
                            case 'ogg':
                                mimeType = 'audio/' + ext;
                                break;
                            case 'pdf':
                                mimeType = 'application/pdf';
                                break;
                            case 'doc':
                            case 'docx':
                                mimeType = 'application/msword';
                                break;
                            case 'xls':
                            case 'xlsx':
                                mimeType = 'application/vnd.ms-excel';
                                break;
                            case 'zip':
                            case 'rar':
                                mimeType = 'application/' + ext;
                                break;
                            default:
                                mimeType = 'application/octet-stream';
                        }
                    }
                    
                    console.log('FileField: Final MIME type:', mimeType);
                    
                    // Validate file type based on allowed_types
                    let isAllowed = false;
                    
                    if (allowed_types.includes('image') && mimeType.startsWith('image/')) isAllowed = true;
                    if (allowed_types.includes('video') && mimeType.startsWith('video/')) isAllowed = true;
                    if (allowed_types.includes('audio') && mimeType.startsWith('audio/')) isAllowed = true;
                    if (allowed_types.includes('document') && (
                        mimeType === 'application/pdf' ||
                        mimeType.includes('document') ||
                        mimeType.includes('word') ||
                        mimeType.includes('excel') ||
                        mimeType === 'text/plain'
                    )) isAllowed = true;
                    if (allowed_types.includes('archive') && (
                        mimeType.includes('zip') ||
                        mimeType.includes('rar') ||
                        mimeType.includes('tar') ||
                        mimeType.includes('gzip')
                    )) isAllowed = true;

                    console.log('FileField: File type allowed:', isAllowed);

                    if (!isAllowed) {
                        showErrorMessage(`File type ${mimeType} is not allowed for this field`);
                        return;
                    }

                    // Get file size - try multiple methods
                    let fileSize = attachment.get('filesizeInBytes') || 0;
                    if (!fileSize) {
                        // Try to get from attributes
                        fileSize = attachment.attributes.filesizeInBytes || 0;
                    }
                    if (!fileSize) {
                        // Try to get from changed attributes
                        fileSize = attachment.changed.filesizeInBytes || 0;
                    }
                    if (!fileSize) {
                        // Try to get from other size properties
                        fileSize = attachment.get('filesize') || 0;
                    }
                    if (!fileSize) {
                        // Try to get from attributes
                        fileSize = attachment.attributes.filesize || 0;
                    }
                    if (!fileSize) {
                        // Try to get from changed attributes
                        fileSize = attachment.changed.filesize || 0;
                    }
                    
                    // If still no file size, try to get from the full size image
                    if (!fileSize && attachment.get('sizes') && attachment.get('sizes').full) {
                        // This is a rough estimate - we'll use a default size
                        fileSize = 1024 * 1024; // 1MB default
                    }
                    
                    console.log('FileField: Final file size:', fileSize);
                    
                    const maxSizeBytes = max_file_size * 1024 * 1024;
                    console.log('FileField: File size:', fileSize, 'Max allowed:', maxSizeBytes);
                    if (fileSize > maxSizeBytes) {
                        showErrorMessage(`File size exceeds ${max_file_size}MB limit`);
                        return;
                    }

                    const fileData = {
                        id: attachment.id,
                        name: attachment.get('filename') || attachment.get('title'),
                        type: mimeType,
                        size: fileSize,
                        size_formatted: attachment.get('filesizeHumanReadable') || formatFileSize(fileSize),
                        url: attachment.get('url'),
                        thumbnail: attachment.get('sizes')?.thumbnail?.url || 
                                  attachment.get('sizes')?.medium?.url || 
                                  attachment.get('sizes')?.small?.url || 
                                  attachment.get('url'),
                        is_media_library: true
                    };
                    
                    console.log('FileField: Created file data:', fileData);
                    selectedFiles.push(fileData);
                });

                console.log('FileField: Final selected files array:', selectedFiles);

                if (selectedFiles.length > 0) {
                    console.log('FileField: Media library files selected:', selectedFiles);
                    if (multiple) {
                        setFiles(prev => [...prev, ...selectedFiles]);
                        // Send complete file data for database storage
                        const filesForDB = selectedFiles.map(file => ({
                            id: file.id,
                            url: file.url,
                            type: file.type,
                            name: file.name,
                            size: file.size,
                            size_formatted: file.size_formatted,
                            thumbnail: file.thumbnail,
                            is_media_library: true
                        }));
                        console.log('FileField: Sending multiple files to onChange:', filesForDB);
                        console.log('FileField: onChange function available:', typeof onChange === 'function');
                        console.log('FileField: Current files state:', files);
                        console.log('FileField: Calling onChange with:', [...files, ...filesForDB]);
                        onChange([...files, ...filesForDB]);
                        showSuccessMessage(`${selectedFiles.length} files added from media library.`);
                    } else {
                        setFiles(selectedFiles);
                        // Send complete file data for database storage
                        const fileForDB = selectedFiles[0];
                        const fileData = {
                            id: fileForDB.id,
                            url: fileForDB.url,
                            type: fileForDB.type,
                            name: fileForDB.name,
                            size: fileForDB.size,
                            size_formatted: fileForDB.size_formatted,
                            thumbnail: fileForDB.thumbnail,
                            is_media_library: true
                        };
                        console.log('FileField: Sending single file to onChange:', fileData);
                        console.log('FileField: onChange function available:', typeof onChange === 'function');
                        console.log('FileField: Calling onChange with:', fileData);
                        onChange(fileData);
                        showSuccessMessage(`1 file added from media library.`);
                    }
                    setError(''); // Clear any previous errors
                } else {
                    console.log('FileField: No valid files selected after processing');
                }
                
                setIsOpeningMedia(false);
            });

            frame.on('close', () => {
                setIsOpeningMedia(false);
            });

            frame.open();
        } else {
            showErrorMessage('WordPress media library is not available. Please refresh the page and try again.');
            setIsOpeningMedia(false);
        }
    };

    const toggleFileExpansion = (fileId) => {
        const newExpanded = new Set(expandedFiles);
        if (newExpanded.has(fileId)) {
            newExpanded.delete(fileId);
        } else {
            newExpanded.add(fileId);
        }
        setExpandedFiles(newExpanded);
    };

    const renderFileDetails = (file) => {
        if (!expandedFiles.has(file.id)) return null;

        return (
            <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200 text-xs text-gray-600 space-y-2">
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <span className="font-medium text-gray-700">Type:</span>
                        <div className="text-gray-600">{file.type}</div>
                    </div>
                    <div>
                        <span className="font-medium text-gray-700">Size:</span>
                        <div className="text-gray-600">{file.size_formatted}</div>
                    </div>
                    {file.is_media_library && (
                        <div>
                            <span className="font-medium text-gray-700">ID:</span>
                            <div className="text-gray-600">{file.id}</div>
                        </div>
                    )}
                    {file.url && (
                        <div className="col-span-2">
                            <span className="font-medium text-gray-700">URL:</span>
                            <div className="truncate text-gray-500 text-xs" title={file.url}>
                                {file.url}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const renderFilePreview = (file) => {
        if (file.type.startsWith('image/')) {
            // Try different image sources for media library files
            let imageSrc = file.url;
            if (file.thumbnail && file.thumbnail !== file.url) {
                imageSrc = file.thumbnail;
            } else if (file.is_media_library && file.url) {
                // For media library files, try to get a smaller size
                imageSrc = file.url;
            }
            
            return (
                <div className="relative group">
                    <img 
                        src={imageSrc} 
                        alt={file.name}
                        className="w-16 h-16 object-cover rounded-lg border border-gray-200 shadow-sm"
                        onError={(e) => {
                            // Fallback to original URL if thumbnail fails
                            if (e.target.src !== file.url) {
                                e.target.src = file.url;
                            }
                        }}
                    />
                    {show_delete && (
                        <button
                            onClick={() => removeFile(file.id)}
                            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                        >
                            <X size={10} />
                        </button>
                    )}
                </div>
            );
        }

        if (file.type.startsWith('video/')) {
            return (
                <div className="relative group">
                    <video 
                        src={file.url}
                        className="w-16 h-16 object-cover rounded-lg border border-gray-200 shadow-sm"
                        controls
                    />
                    {show_delete && (
                        <button
                            onClick={() => removeFile(file.id)}
                            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                        >
                            <X size={10} />
                        </button>
                    )}
                </div>
            );
        }

        if (file.type.startsWith('audio/')) {
            return (
                <div className="relative group">
                    <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-green-200 rounded-lg border border-gray-200 shadow-sm flex items-center justify-center">
                        <Music size={20} className="text-green-600" />
                    </div>
                    {show_delete && (
                        <button
                            onClick={() => removeFile(file.id)}
                            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                        >
                            <X size={10} />
                        </button>
                    )}
                </div>
            );
        }

        return (
            <div className="relative group">
                <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg border border-gray-200 shadow-sm flex items-center justify-center">
                    {getFileIcon(file.type)}
                </div>
                {show_delete && (
                    <button
                        onClick={() => removeFile(file.id)}
                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                    >
                        <X size={10} />
                    </button>
                )}
            </div>
        );
    };

    const truncateFileName = (fileName, maxLength = 20) => {
        if (fileName.length <= maxLength) return fileName;
        const extension = fileName.split('.').pop();
        const nameWithoutExt = fileName.substring(0, fileName.lastIndexOf('.'));
        const truncatedName = nameWithoutExt.substring(0, maxLength - extension.length - 3);
        return `${truncatedName}...${extension}`;
    };

    const getFileSummary = () => {
        if (files.length === 0) return null;

        const totalSize = files.reduce((sum, file) => sum + (file.size || 0), 0);
        const fileTypes = files.reduce((acc, file) => {
            const type = file.type.split('/')[0] || 'unknown';
            acc[type] = (acc[type] || 0) + 1;
            return acc;
        }, {});

        return {
            count: files.length,
            totalSize: formatFileSize(totalSize),
            fileTypes
        };
    };

    const renderFileSummary = () => {
        const summary = getFileSummary();
        if (!summary) return null;

        return (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-3 mb-4">
                <div className="flex justify-between items-center text-sm">
                    <div className="text-blue-800">
                        <span className="font-semibold">{summary.count}</span> file{summary.count !== 1 ? 's' : ''} selected
                    </div>
                    <div className="text-blue-600">
                        Total: <span className="font-semibold">{summary.totalSize}</span>
                    </div>
                </div>
                <div className="mt-2 text-xs text-blue-600">
                    {Object.entries(summary.fileTypes).map(([type, count]) => (
                        <span key={type} className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded mr-2 mb-1">
                            {type}: {count}
                        </span>
                    ))}
                </div>
            </div>
        );
    };

    const renderFileInfo = (file) => {
        return (
            <div className="text-center space-y-1">
                <p className="text-sm font-medium text-gray-900 truncate" title={file.name}>
                    {truncateFileName(file.name)}
                </p>
                <p className="text-xs text-gray-500">
                    {file.size_formatted}
                </p>
                {file.is_media_library && (
                    <p className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
                        Media Library
                    </p>
                )}
                {file.type && (
                    <p className="text-xs text-gray-400">
                        {file.type.split('/')[1]?.toUpperCase() || 'FILE'}
                    </p>
                )}
            </div>
        );
    };

    return (
        <div className="w-full">
            {label && (
                <label className="block text-sm font-medium text-gray-700 mb-3">
                    {label}
                    {fieldRequired && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}
            
            <div className="space-y-4">
                {/* Compact File Upload Area */}
                <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                    <div className="flex items-center space-x-3 mb-3">
                        <div className="flex-shrink-0">
                            <Upload size={18} className="text-gray-400" />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-medium text-gray-700">File Upload</p>
                            <p className="text-xs text-gray-500">
                                Allowed: {allowed_types.join(', ')} • Max: {max_file_size}MB
                            </p>
                        </div>
                    </div>
                    
                    {/* Upload Methods */}
                    <div className="flex space-x-2">
                        <button
                            type="button"
                            onClick={openFileModal}
                            className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-2 rounded-md text-sm font-medium transition-colors border border-blue-200"
                        >
                            Browse Files
                        </button>
                        <button
                            type="button"
                            onClick={openMediaLibrary}
                            disabled={isOpeningMedia}
                            className="flex-1 bg-green-50 hover:bg-green-100 text-green-700 px-3 py-2 rounded-md text-sm font-medium transition-colors border border-green-200 disabled:opacity-50"
                        >
                            {isOpeningMedia ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-400 mr-2"></div>
                                    Loading...
                                </>
                            ) : (
                                <>
                                    <FolderOpen size={16} className="mr-2" />
                                    Media Library
                                </>
                            )}
                        </button>
                    </div>
                    
                    {/* Drag & Drop Zone */}
                    <div
                        ref={dropZoneRef}
                        className={`mt-3 border-2 border-dashed rounded-md p-3 text-center transition-colors ${
                            dragActive 
                                ? 'border-blue-400 bg-blue-50' 
                                : 'border-gray-300 hover:border-gray-400'
                        }`}
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                    >
                        <p className="text-xs text-gray-500">
                            Drag and drop files here
                        </p>
                    </div>
                    
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple={multiple}
                        accept={allowed_types.map(type => {
                            switch(type) {
                                case 'image': return 'image/*';
                                case 'video': return 'video/*';
                                case 'audio': return 'audio/*';
                                case 'document': return '.pdf,.doc,.docx,.txt,.xls,.xlsx';
                                case 'archive': return '.zip,.rar,.tar,.gz';
                                default: return '';
                            }
                        }).filter(Boolean).join(',')}
                        onChange={handleFileSelect}
                        className="hidden"
                    />
                </div>

                {/* Error Message */}
                {error && (
                    <div className="text-sm text-red-600 bg-red-50 border border-red-200 p-3 rounded-lg">
                        {error}
                    </div>
                )}

                {/* Upload Progress */}
                {isUploading && (
                    <div className="text-sm text-blue-600 bg-blue-50 border border-blue-200 p-3 rounded-lg">
                        <div className="flex items-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400 mr-2"></div>
                            Uploading files...
                        </div>
                    </div>
                )}

                {/* Success Message */}
                {successMessage && (
                    <div className="text-sm text-green-600 bg-green-50 border border-green-200 p-3 rounded-lg">
                        {successMessage}
                    </div>
                )}

                {/* File List */}
                {files.length > 0 && (
                    <div className="space-y-3">
                        {/* File Summary */}
                        {renderFileSummary()}
                        
                        <div className="flex justify-between items-center">
                            <h4 className="text-sm font-medium text-gray-700">
                                {multiple ? 'Selected Files' : 'Selected File'} ({files.length})
                            </h4>
                            {multiple && files.length > 1 && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setFiles([]);
                                        onChange([]);
                                        showSuccessMessage('All files cleared successfully.');
                                    }}
                                    className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded transition-colors"
                                >
                                    Clear All
                                </button>
                            )}
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {files.map((file) => (
                                <div key={file.id} className="bg-white border border-gray-200 rounded-lg p-3 space-y-3 shadow-sm hover:shadow-md transition-shadow">
                                    {/* File Preview */}
                                    {show_preview && (
                                        <div className="flex justify-center">
                                            {renderFilePreview(file)}
                                        </div>
                                    )}
                                    
                                    {/* File Info */}
                                    <div className="text-center space-y-1">
                                        {renderFileInfo(file)}
                                    </div>
                                    
                                    {/* File Actions */}
                                    <div className="flex justify-center space-x-1">
                                        <button
                                            type="button"
                                            onClick={() => toggleFileExpansion(file.id)}
                                            className="p-1.5 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
                                            title={expandedFiles.has(file.id) ? "Hide details" : "Show details"}
                                        >
                                            {expandedFiles.has(file.id) ? (
                                                <span className="text-xs">−</span>
                                            ) : (
                                                <span className="text-xs">+</span>
                                            )}
                                        </button>
                                        
                                        {show_preview && (
                                            <button
                                                type="button"
                                                onClick={() => previewFile(file)}
                                                className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                                title="Preview file"
                                            >
                                                <FileText size={14} />
                                            </button>
                                        )}
                                        
                                        {show_download && (
                                            <button
                                                type="button"
                                                onClick={() => downloadFile(file)}
                                                className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                                title="Download file"
                                            >
                                                <Download size={14} />
                                            </button>
                                        )}
                                        
                                        {show_delete && (
                                            <button
                                                type="button"
                                                onClick={() => removeFile(file.id)}
                                                className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                                title="Remove file"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        )}
                                    </div>
                                    
                                    {/* File Details */}
                                    {renderFileDetails(file)}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FileField; 