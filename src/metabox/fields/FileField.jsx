import React, { useState, useEffect, useRef } from 'react';
import { Upload, File, Image, Video, Music, Archive, Download, Trash2, X, Plus, FileText } from 'lucide-react';

const FileField = ({ label, fieldName, fieldConfig, fieldValue, fieldRequired, onChange }) => {
    const [files, setFiles] = useState([]);
    const [isUploading, setIsUploading] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const [error, setError] = useState('');
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

    useEffect(() => {
        if (fieldValue) {
            try {
                let parsedValue = fieldValue;
                if (typeof fieldValue === 'string') {
                    parsedValue = JSON.parse(fieldValue);
                }
                
                if (Array.isArray(parsedValue)) {
                    setFiles(parsedValue);
                } else if (parsedValue) {
                    setFiles([parsedValue]);
                }
            } catch (error) {
                console.error('Error parsing file field value:', error);
                setFiles([]);
            }
        } else {
            setFiles([]);
        }
    }, [fieldValue]);

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
            setError(errors.join(', '));
            setIsUploading(false);
            return;
        }

        try {
            // Simulate file upload - in real implementation, you'd upload to server
            const uploadedFileData = validFiles.map(file => ({
                id: Date.now() + Math.random(),
                name: file.name,
                type: file.type,
                size: file.size,
                size_formatted: formatFileSize(file.size),
                url: URL.createObjectURL(file),
                is_uploaded: true,
                file: file // Keep reference for actual upload
            }));

            if (multiple) {
                setFiles(prev => [...prev, ...uploadedFileData]);
            } else {
                setFiles(uploadedFileData);
            }

            // Notify parent component
            const newValue = multiple ? [...files, ...uploadedFileData] : uploadedFileData;
            onChange(newValue);

        } catch (error) {
            setError('Upload failed: ' + error.message);
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
        const updatedFiles = files.filter(file => file.id !== fileId);
        setFiles(updatedFiles);
        onChange(updatedFiles);
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

    const openFileModal = () => {
        fileInputRef.current?.click();
    };

    const renderFilePreview = (file) => {
        if (file.type.startsWith('image/')) {
            return (
                <div className="relative group">
                    <img 
                        src={file.url} 
                        alt={file.name}
                        className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                    />
                    {show_delete && (
                        <button
                            onClick={() => removeFile(file.id)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <X size={12} />
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
                        className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                        controls
                    />
                    {show_delete && (
                        <button
                            onClick={() => removeFile(file.id)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <X size={12} />
                        </button>
                    )}
                </div>
            );
        }

        return (
            <div className="relative group">
                <div className="w-20 h-20 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center">
                    {getFileIcon(file.type)}
                </div>
                {show_delete && (
                    <button
                        onClick={() => removeFile(file.id)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <X size={12} />
                    </button>
                )}
            </div>
        );
    };

    return (
        <div className="w-full">
            {label && (
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    {label}
                    {fieldRequired && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}
            
            <div className="space-y-4">
                {/* File Upload Area */}
                <div
                    ref={dropZoneRef}
                    className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                        dragActive 
                            ? 'border-blue-400 bg-blue-50' 
                            : 'border-gray-300 hover:border-gray-400'
                    }`}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                >
                    <Upload size={24} className="mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600 mb-2">
                        Drag and drop files here, or{' '}
                        <button
                            type="button"
                            onClick={openFileModal}
                            className="text-blue-600 hover:text-blue-700 font-medium"
                        >
                            browse files
                        </button>
                    </p>
                    <p className="text-xs text-gray-500">
                        Allowed types: {allowed_types.join(', ')} • Max size: {max_file_size}MB
                    </p>
                    
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
                    <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                        {error}
                    </div>
                )}

                {/* Upload Progress */}
                {isUploading && (
                    <div className="text-sm text-blue-600 bg-blue-50 p-3 rounded-lg">
                        Uploading files...
                    </div>
                )}

                {/* File List */}
                {files.length > 0 && (
                    <div className="space-y-3">
                        <h4 className="text-sm font-medium text-gray-700">
                            {multiple ? 'Uploaded Files' : 'Uploaded File'} ({files.length})
                        </h4>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {files.map((file) => (
                                <div key={file.id} className="bg-gray-50 rounded-lg p-4 space-y-3">
                                    {/* File Preview */}
                                    {show_preview && (
                                        <div className="flex justify-center">
                                            {renderFilePreview(file)}
                                        </div>
                                    )}
                                    
                                    {/* File Info */}
                                    <div className="text-center space-y-1">
                                        <p className="text-sm font-medium text-gray-900 truncate" title={file.name}>
                                            {file.name}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {file.size_formatted}
                                        </p>
                                    </div>
                                    
                                    {/* File Actions */}
                                    <div className="flex justify-center space-x-2">
                                        {show_download && (
                                            <button
                                                type="button"
                                                onClick={() => downloadFile(file)}
                                                className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                title="Download file"
                                            >
                                                <Download size={16} />
                                            </button>
                                        )}
                                        
                                        {show_delete && (
                                            <button
                                                type="button"
                                                onClick={() => removeFile(file.id)}
                                                className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Remove file"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </div>
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