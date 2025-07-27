import React, { useState, useRef, useEffect } from 'react';

function VideoField({ label, value, onChange, required = false, error, config = {} }) {
  const [videoData, setVideoData] = useState({
    url: '',
    type: 'url', // 'file', 'youtube', 'vimeo', 'url'
    title: '',
    description: ''
  });
  const [activeTab, setActiveTab] = useState('url');
  const [isOpen, setIsOpen] = useState(false);
  const fileInputRef = useRef(null);
  const mediaFrameRef = useRef(null);

  // Parse video sources from config
  const allowedSources = config.sources || ['file', 'youtube', 'vimeo', 'url'];

  // Load saved video data when component mounts or value changes
  useEffect(() => {
    if (value) {
      try {
        const savedData = typeof value === 'string' ? JSON.parse(value) : value;
        if (savedData && typeof savedData === 'object') {
          setVideoData({
            url: savedData.url || '',
            type: savedData.type || 'url',
            title: savedData.title || '',
            description: savedData.description || ''
          });
        } else {
          // If value is just a string, treat it as URL
          setVideoData({
            url: value,
            type: 'url',
            title: '',
            description: ''
          });
        }
      } catch (e) {
        // If parsing fails, treat as simple URL
        setVideoData({
          url: value,
          type: 'url',
          title: '',
          description: ''
        });
      }
    } else {
      setVideoData({
        url: '',
        type: 'url',
        title: '',
        description: ''
      });
    }
  }, [value]);

  const handleVideoDataChange = (newData) => {
    const updatedData = { ...videoData, ...newData };
    setVideoData(updatedData);
    
    // Determine return type based on config
    const returnType = config.return_type || 'url';
    
    if (returnType === 'url') {
      // Return just the URL
      onChange(updatedData.url);
    } else {
      // Return full video data
      onChange(JSON.stringify(updatedData));
    }
  };

  const handleFileUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Create a temporary URL for the file
      const fileUrl = URL.createObjectURL(file);
      handleVideoDataChange({
        url: fileUrl,
        type: 'file',
        title: file.name,
        description: `File: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`
      });
    }
  };

  const openMediaLibrary = () => {
    if (window.wp && window.wp.media) {
      const frame = window.wp.media({
        title: 'Select Video',
        button: {
          text: 'Use this video'
        },
        multiple: false,
        library: {
          type: 'video'
        }
      });

      frame.on('select', () => {
        const attachment = frame.state().get('selection').first().toJSON();
        handleVideoDataChange({
          url: attachment.url,
          type: 'file',
          title: attachment.title || attachment.filename,
          description: `File: ${attachment.filename} (${(attachment.filesize / 1024 / 1024).toFixed(2)} MB)`
        });
      });

      frame.open();
      mediaFrameRef.current = frame;
    }
  };

  const extractVideoId = (url, platform) => {
    if (platform === 'youtube') {
      const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
      return match ? match[1] : null;
    } else if (platform === 'vimeo') {
      const match = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
      return match ? match[1] : null;
    }
    return null;
  };

  const handleUrlChange = (e) => {
    const url = e.target.value;
    let type = 'url';
    let title = '';
    let description = '';

    // Auto-detect video platform
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      type = 'youtube';
      const videoId = extractVideoId(url, 'youtube');
      if (videoId) {
        title = `YouTube Video (${videoId})`;
        description = `YouTube: https://www.youtube.com/watch?v=${videoId}`;
      }
    } else if (url.includes('vimeo.com')) {
      type = 'vimeo';
      const videoId = extractVideoId(url, 'vimeo');
      if (videoId) {
        title = `Vimeo Video (${videoId})`;
        description = `Vimeo: https://vimeo.com/${videoId}`;
      }
    }

    handleVideoDataChange({ url, type, title, description });
  };

  const getVideoPreview = () => {
    if (!videoData.url) return null;

    switch (videoData.type) {
      case 'youtube':
        const youtubeId = extractVideoId(videoData.url, 'youtube');
        if (youtubeId) {
          return (
            <iframe
              width="100%"
              height="200"
              src={`https://www.youtube.com/embed/${youtubeId}`}
              title="YouTube video"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              style={{ border: 'none' }}
            />
          );
        }
        break;
      case 'vimeo':
        const vimeoId = extractVideoId(videoData.url, 'vimeo');
        if (vimeoId) {
          return (
            <iframe
              width="100%"
              height="200"
              src={`https://player.vimeo.com/video/${vimeoId}`}
              title="Vimeo video"
              frameBorder="0"
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
              style={{ border: 'none' }}
            />
          );
        }
        break;
      case 'file':
        return (
          <video
            width="100%"
            height="200"
            controls
            className="rounded-lg"
            style={{ border: 'none' }}
          >
            <source src={videoData.url} type="video/mp4" />
            <source src={videoData.url} type="video/webm" />
            <source src={videoData.url} type="video/ogg" />
            Your browser does not support the video tag.
          </video>
        );
      default:
        return (
          <div className="p-4 bg-gray-100 rounded-lg text-center">
            <p className="text-sm text-gray-600">Video URL: {videoData.url}</p>
          </div>
        );
    }
  };

  return (
    <div className="mb-4">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="space-y-3">
        {/* Video Source Tabs */}
        <div className="flex border-b border-gray-200">
          {allowedSources.includes('url') && (
            <button
              type="button"
              onClick={() => setActiveTab('url')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'url'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              URL
            </button>
          )}
          {allowedSources.includes('youtube') && (
            <button
              type="button"
              onClick={() => setActiveTab('youtube')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'youtube'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              YouTube
            </button>
          )}
          {allowedSources.includes('vimeo') && (
            <button
              type="button"
              onClick={() => setActiveTab('vimeo')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'vimeo'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Vimeo
            </button>
          )}
          {allowedSources.includes('file') && (
            <button
              type="button"
              onClick={() => setActiveTab('file')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'file'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              File Upload
            </button>
          )}
        </div>

        {/* URL Input */}
        {(activeTab === 'url' || activeTab === 'youtube' || activeTab === 'vimeo') && (
          <div className="space-y-2">
            <input
              type="url"
              value={videoData.url}
              onChange={handleUrlChange}
              placeholder={
                activeTab === 'youtube' ? 'https://www.youtube.com/watch?v=...' :
                activeTab === 'vimeo' ? 'https://vimeo.com/...' :
                'https://example.com/video.mp4'
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
            <p className="text-xs text-gray-500">
              {activeTab === 'youtube' ? 'Enter YouTube video URL' :
               activeTab === 'vimeo' ? 'Enter Vimeo video URL' :
               'Enter direct video URL'}
            </p>
          </div>
        )}

        {/* File Upload */}
        {activeTab === 'file' && (
          <div className="space-y-2">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={openMediaLibrary}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              >
                Choose from Media Library
              </button>
              <button
                type="button"
                onClick={handleFileUpload}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
              >
                Upload File
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <p className="text-xs text-gray-500">
              Choose from WordPress media library or upload a new video file
            </p>
          </div>
        )}

        {/* Video Preview */}
        {videoData.url && (
          <div className="mt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Preview</h4>
            <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
              {getVideoPreview()}
            </div>
            {videoData.title && (
              <p className="text-sm text-gray-600 mt-2">
                <strong>Title:</strong> {videoData.title}
              </p>
            )}
            {videoData.description && (
              <p className="text-xs text-gray-500 mt-1">
                {videoData.description}
              </p>
            )}
          </div>
        )}

        {/* Clear Button */}
        {videoData.url && (
          <button
            type="button"
            onClick={() => handleVideoDataChange({
              url: '',
              type: 'url',
              title: '',
              description: ''
            })}
            className="px-3 py-1 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
          >
            Clear Video
          </button>
        )}
      </div>
      
      {error && <div className="text-xs text-red-500 mt-2">{error}</div>}
    </div>
  );
}

export default VideoField; 