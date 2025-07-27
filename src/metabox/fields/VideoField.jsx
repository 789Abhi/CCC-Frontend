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
        
        // Determine the video type based on the URL
        let videoType = 'file';
        if (attachment.url.includes('youtube.com') || attachment.url.includes('youtu.be')) {
          videoType = 'youtube';
        } else if (attachment.url.includes('vimeo.com')) {
          videoType = 'vimeo';
        }
        
        handleVideoDataChange({
          url: attachment.url,
          type: videoType,
          title: attachment.title || attachment.filename || 'Video',
          description: `File: ${attachment.filename || 'Video'} (${attachment.filesize ? (attachment.filesize / 1024 / 1024).toFixed(2) + ' MB' : 'Unknown size'})`
        });
      });

      frame.open();
    } else {
      // Fallback if WordPress Media Library is not available
      console.warn('WordPress Media Library not available');
      alert('WordPress Media Library is not available. Please ensure you are in the WordPress admin area.');
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

    // Auto-detect video type from URL
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
    } else if (url.includes('dailymotion.com')) {
      type = 'dailymotion';
      title = 'Dailymotion Video';
      description = `Dailymotion: ${url}`;
    } else if (url.includes('facebook.com') && url.includes('/videos/')) {
      type = 'facebook';
      title = 'Facebook Video';
      description = `Facebook: ${url}`;
    } else if (url.includes('twitch.tv')) {
      type = 'twitch';
      title = 'Twitch Video';
      description = `Twitch: ${url}`;
    } else if (url.includes('tiktok.com')) {
      type = 'tiktok';
      title = 'TikTok Video';
      description = `TikTok: ${url}`;
    } else if (url) {
      // For direct video URLs or other platforms, treat as iframe-embeddable
      type = 'iframe';
      title = 'External Video';
      description = `External: ${url}`;
    }

    handleVideoDataChange({ url, type, title, description });
  };

  const getVideoPreview = () => {
    if (!videoData.url) return null;

    // Auto-detect video type from URL if not already set
    let videoType = videoData.type;
    if (!videoType || videoType === 'url') {
      if (videoData.url.includes('youtube.com') || videoData.url.includes('youtu.be')) {
        videoType = 'youtube';
      } else if (videoData.url.includes('vimeo.com')) {
        videoType = 'vimeo';
      } else if (videoData.url.includes('dailymotion.com')) {
        videoType = 'dailymotion';
      } else if (videoData.url.includes('facebook.com') && videoData.url.includes('/videos/')) {
        videoType = 'facebook';
      } else if (videoData.url.includes('twitch.tv')) {
        videoType = 'twitch';
      } else if (videoData.url.includes('tiktok.com')) {
        videoType = 'tiktok';
      } else {
        videoType = 'file';
      }
    }

    switch (videoType) {
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
              height="500"
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
              height="500"
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
      case 'dailymotion':
        // Extract Dailymotion video ID
        const dailymotionMatch = videoData.url.match(/dailymotion\.com\/video\/([a-zA-Z0-9]+)/);
        if (dailymotionMatch) {
          const dailymotionId = dailymotionMatch[1];
          const dailymotionParams = [];
          if (playerOptions.autoplay) dailymotionParams.push('autoplay=1');
          if (playerOptions.muted) dailymotionParams.push('mute=1');
          if (!playerOptions.controls) dailymotionParams.push('controls=0');
          
          const dailymotionUrl = `https://www.dailymotion.com/embed/video/${dailymotionId}${dailymotionParams.length > 0 ? '?' + dailymotionParams.join('&') : ''}`;
          
          return (
            <iframe
              width="100%"
              height="500"
              src={dailymotionUrl}
              title="Dailymotion video"
              frameBorder="0"
              allow="autoplay; fullscreen"
              allowFullScreen
              style={{ border: 'none' }}
            />
          );
        }
        break;
      case 'facebook':
        // Facebook videos need special handling - convert to embed URL
        const facebookMatch = videoData.url.match(/facebook\.com\/[^\/]+\/videos\/(\d+)/);
        if (facebookMatch) {
          const facebookId = facebookMatch[1];
          const facebookUrl = `https://www.facebook.com/plugins/video.php?href=https://www.facebook.com/video.php?v=${facebookId}&show_text=false&width=560&height=315&appId`;
          
          return (
            <iframe
              width="100%"
              height="500"
              src={facebookUrl}
              title="Facebook video"
              frameBorder="0"
              allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
              allowFullScreen
              style={{ border: 'none' }}
            />
          );
        }
        break;
      case 'twitch':
        // Twitch videos need special handling
        const twitchMatch = videoData.url.match(/twitch\.tv\/videos\/(\d+)/);
        if (twitchMatch) {
          const twitchId = twitchMatch[1];
          const twitchUrl = `https://clips.twitch.tv/embed?clip=${twitchId}&parent=${window.location.hostname}`;
          
          return (
            <iframe
              width="100%"
              height="500"
              src={twitchUrl}
              title="Twitch video"
              frameBorder="0"
              allow="autoplay; fullscreen"
              allowFullScreen
              style={{ border: 'none' }}
            />
          );
        }
        break;
      case 'tiktok':
        // TikTok videos need special handling
        const tiktokMatch = videoData.url.match(/tiktok\.com\/@[^\/]+\/video\/(\d+)/);
        if (tiktokMatch) {
          const tiktokId = tiktokMatch[1];
          const tiktokUrl = `https://www.tiktok.com/embed/${tiktokId}`;
          
          return (
            <iframe
              width="100%"
              height="500"
              src={tiktokUrl}
              title="TikTok video"
              frameBorder="0"
              allow="autoplay; fullscreen"
              allowFullScreen
              style={{ border: 'none' }}
            />
          );
        }
        break;
      case 'iframe':
        // For other iframe-embeddable videos, try to embed directly
        return (
          <iframe
            width="100%"
            height="500"
            src={videoData.url}
            title="External video"
            frameBorder="0"
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
            style={{ border: 'none' }}
          />
        );
      case 'file':
      default:
        return (
          <video
            width="100%"
            height="500"
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
    }
  };

  // Only show the input for the selected source
  const renderInput = () => {
    switch (selectedSource) {
      case 'file':
        return (
          <div className="space-y-3">
            {/* WordPress Media Library Button */}
            <div>
              <button 
                type="button" 
                onClick={openMediaLibrary} 
                className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200 flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m-9 0h10m-10 0a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V6a2 2 0 00-2-2" />
                </svg>
                Select from Media Library
              </button>
              <p className="mt-2 text-xs text-gray-500 text-center">
                Choose from existing videos or upload new ones
              </p>
            </div>

            {/* Selected File Display */}
            {videoData.url && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-green-800">
                      {videoData.title || 'Video Selected'}
                    </p>
                    {videoData.description && (
                      <p className="text-xs text-green-600">{videoData.description}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleVideoDataChange({ url: '', type: 'url', title: '', description: '' })}
                    className="text-green-600 hover:text-green-800"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      case 'url':
        return (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Video URL
              </label>
              <input
                type="url"
                value={videoData.url || ''}
                onChange={handleUrlChange}
                placeholder="https://www.youtube.com/watch?v=... or https://vimeo.com/... or any video URL"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isSubmitting}
              />
              <p className="mt-2 text-xs text-gray-500">
                Supports YouTube, Vimeo, and any other video platform that uses iframe embedding
              </p>
            </div>

            {/* Selected URL Display */}
            {videoData.url && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-green-800">
                      {videoData.title || 'Video URL Added'}
                    </p>
                    <p className="text-xs text-green-600 break-all">{videoData.url}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleVideoDataChange({ url: '', type: 'url', title: '', description: '' })}
                    className="text-green-600 hover:text-green-800"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>
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
    <div className="mb-6 p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
      {label && (
        <label className="block text-sm font-semibold text-gray-900 mb-3">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      {/* Autoplay Info Banner */}
      {playerOptions.autoplay && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-blue-800">
              <strong>Autoplay Enabled:</strong> Video will start automatically (muted for browser compatibility)
            </p>
          </div>
        </div>
      )}
      
      <div className="space-y-4">
        {/* Input Section */}
        <div className="bg-gray-50 p-4 rounded-lg">
          {renderInput()}
        </div>
        
        {/* Preview Section */}
        {videoData.url && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Video Preview
            </h4>
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              {getVideoPreview()}
            </div>
          </div>
        )}
      </div>
      
      {error && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-red-800">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default VideoField; 