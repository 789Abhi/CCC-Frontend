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

  // Only allow one source, default to 'file' if not set
  const allowedSources = Array.isArray(config.sources) && config.sources.length > 0 ? config.sources : ['file'];
  const selectedSource = allowedSources[0];

  // Initialize player options from config
  const playerOptions = config.player_options || {
    controls: true,
    autoplay: false,
    muted: false,
    loop: false,
    download: true,
    fullscreen: true,
    pictureInPicture: true
  };

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
          const youtubeParams = [];
          if (playerOptions.autoplay) {
            youtubeParams.push('autoplay=1');
            youtubeParams.push('mute=1'); // Autoplay requires muted
          } else if (playerOptions.muted) {
            youtubeParams.push('mute=1');
          }
          if (playerOptions.loop) youtubeParams.push('loop=1&playlist=' + youtubeId);
          if (!playerOptions.controls) youtubeParams.push('controls=0');
          if (!playerOptions.fullscreen) youtubeParams.push('fs=0');
          
          const youtubeUrl = `https://www.youtube.com/embed/${youtubeId}${youtubeParams.length > 0 ? '?' + youtubeParams.join('&') : ''}`;
          
          return (
            <iframe
              width="100%"
              height="200"
              src={youtubeUrl}
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
          const vimeoParams = [];
          if (playerOptions.autoplay) {
            vimeoParams.push('autoplay=1');
            vimeoParams.push('muted=1'); // Autoplay requires muted
          } else if (playerOptions.muted) {
            vimeoParams.push('muted=1');
          }
          if (playerOptions.loop) vimeoParams.push('loop=1');
          if (!playerOptions.controls) vimeoParams.push('controls=0');
          if (!playerOptions.fullscreen) vimeoParams.push('fullscreen=0');
          
          const vimeoUrl = `https://player.vimeo.com/video/${vimeoId}${vimeoParams.length > 0 ? '?' + vimeoParams.join('&') : ''}`;
          
          return (
            <iframe
              width="100%"
              height="200"
              src={vimeoUrl}
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
            controls={playerOptions.controls}
            autoplay={playerOptions.autoplay}
            muted={playerOptions.autoplay || playerOptions.muted} // Autoplay requires muted
            loop={playerOptions.loop}
            className="rounded-lg ccc-video-preview"
            style={{ border: 'none' }}
            {...(playerOptions.download ? {} : { controlsList: 'nodownload' })}
            {...(playerOptions.fullscreen ? {} : { disablePictureInPicture: !playerOptions.pictureInPicture })}
          >
            <source src={videoData.url} type="video/mp4" />
            <source src={videoData.url} type="video/webm" />
            <source src={videoData.url} type="video/ogg" />
            Your browser does not support the video tag.
          </video>
        );
      default:
        return (
          <video
            width="100%"
            height="200"
            controls={playerOptions.controls}
            autoplay={playerOptions.autoplay}
            muted={playerOptions.autoplay || playerOptions.muted} // Autoplay requires muted
            loop={playerOptions.loop}
            className="ccc-video-preview"
            style={{ border: 'none', display: 'block' }}
            {...(playerOptions.download ? {} : { controlsList: 'nodownload' })}
            {...(playerOptions.fullscreen ? {} : { disablePictureInPicture: !playerOptions.pictureInPicture })}
          >
            <source src={videoData.url} type="video/mp4" />
            <source src={videoData.url} type="video/webm" />
            <source src={videoData.url} type="video/ogg" />
            Your browser does not support the video tag.
          </video>
        );
    }
  };

  // Only show the input for the selected source
  const renderInput = () => {
    switch (selectedSource) {
      case 'file':
        return (
          <div>
            <button type="button" onClick={openMediaLibrary} className="btn btn-secondary mb-2">Select from Media Library</button>
            <input type="file" accept="video/*" onChange={handleFileChange} className="block" />
            {videoData.url && <div className="text-xs text-gray-500 mt-1">Selected: {videoData.url}</div>}
          </div>
        );
      case 'youtube':
        return (
          <input
            type="text"
            placeholder="Enter YouTube URL"
            value={videoData.url || ''}
            onChange={handleUrlChange}
            className="input input-bordered w-full"
          />
        );
      case 'vimeo':
        return (
          <input
            type="text"
            placeholder="Enter Vimeo URL"
            value={videoData.url || ''}
            onChange={handleUrlChange}
            className="input input-bordered w-full"
          />
        );
      case 'url':
        return (
          <input
            type="text"
            placeholder="Enter Direct Video URL"
            value={videoData.url || ''}
            onChange={handleUrlChange}
            className="input input-bordered w-full"
          />
        );
      default:
        return null;
    }
  };

  // Fix autoplay/muted/loop preview for file videos
  React.useEffect(() => {
    if (selectedSource === 'file' && playerOptions.autoplay && videoData.url) {
      const videoEl = document.querySelector('.ccc-video-preview');
      if (videoEl) {
        videoEl.muted = true;
        videoEl.autoplay = true;
        videoEl.loop = !!playerOptions.loop;
        videoEl.load();
        videoEl.play().catch(() => {});
      }
    }
  }, [selectedSource, playerOptions.autoplay, playerOptions.loop, videoData.url]);

  return (
    <div className="mb-4">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      {/* Autoplay Info Banner */}
      {playerOptions.autoplay && (
        <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
          <strong>Autoplay Enabled:</strong> Video will start automatically (muted for browser compatibility)
        </div>
      )}
      
      <div className="space-y-3">
        {/* Only show the input for the selected source */}
        {renderInput()}
        {/* Preview for the selected source */}
        <div className="mt-2">
          {getVideoPreview()}
        </div>
      </div>
      
      {error && <div className="text-red-500 text-xs mt-1">{error}</div>}
    </div>
  );
}

export default VideoField; 