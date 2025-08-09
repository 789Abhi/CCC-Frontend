import React, { useState, useEffect, useRef } from 'react';
import { Search, ExternalLink, Link, X, ChevronDown } from 'lucide-react';

const LinkField = ({ field, value, onChange, isSubmitting }) => {
  const [linkData, setLinkData] = useState({
    type: 'internal',
    url: '',
    post_id: '',
    title: '',
    target: '_self'
  });
  
  const [availablePosts, setAvailablePosts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [postTypeFilter, setPostTypeFilter] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPostSearch, setShowPostSearch] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const searchTimeoutRef = useRef(null);
  const isInitializing = useRef(true);

  // Parse field config
  const config = field.config ? (typeof field.config === 'string' ? JSON.parse(field.config) : field.config) : {};
  const {
    link_types = ['internal', 'external'],
    default_type = 'internal',
    post_types = ['post', 'page'],
    show_target = true,
    show_title = true
  } = config;

  // Initialize from value
  useEffect(() => {
    console.log('LinkField: Initializing with value:', value);
    if (value) {
      try {
        const parsedValue = typeof value === 'string' ? JSON.parse(value) : value;
        console.log('LinkField: Parsed value:', parsedValue);
        if (parsedValue && typeof parsedValue === 'object') {
          setLinkData(prev => ({
            ...prev,
            ...parsedValue
          }));
          
          // If internal link with post_id, fetch post details
          if (parsedValue.type === 'internal' && parsedValue.post_id) {
            console.log('LinkField: Fetching post details for post_id:', parsedValue.post_id);
            fetchPostDetails(parsedValue.post_id);
          }
        }
      } catch (error) {
        console.error('Error parsing link field value:', error);
      }
    }
    
    // Mark initialization as complete
    const timer = setTimeout(() => {
      isInitializing.current = false;
    }, 100);
    
    return () => clearTimeout(timer);
  }, [value]);

  // Update parent when linkData changes (but not during initialization)
  useEffect(() => {
    if (onChange && !isInitializing.current) {
      onChange(JSON.stringify(linkData));
    }
  }, [linkData, onChange]);

  // Debounced search for posts
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (linkData.type === 'internal' && showPostSearch) {
      searchTimeoutRef.current = setTimeout(() => {
        loadAvailablePosts();
      }, 300);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm, postTypeFilter, linkData.type, showPostSearch]);

  const fetchPostDetails = async (postId) => {
    console.log('LinkField: fetchPostDetails called with postId:', postId);
    try {
      if (typeof cccData === 'undefined') {
        console.error('LinkField: cccData not available');
        return;
      }

      const response = await fetch(cccData.ajaxUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          action: 'ccc_get_posts_by_ids',
          nonce: cccData.nonce,
          post_ids: postId
        })
      });

      const data = await response.json();
      console.log('LinkField: fetchPostDetails response:', data);
      if (data.success && data.data && data.data.length > 0) {
        const post = data.data[0];
        console.log('LinkField: Setting selectedPost:', post);
        setSelectedPost(post);
      } else {
        console.warn('LinkField: No post found for ID:', postId);
      }
    } catch (error) {
      console.error('Error fetching post details:', error);
    }
  };

  const loadAvailablePosts = async () => {
    setIsLoading(true);
    try {
      if (typeof cccData === 'undefined') {
        console.error('LinkField: cccData not available');
        setAvailablePosts([]);
        return;
      }

      const response = await fetch(cccData.ajaxUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          action: 'ccc_search_posts',
          nonce: cccData.nonce,
          search: searchTerm || '',
          post_type: postTypeFilter || '',
          filter_post_types: post_types.join(','),
          filter_post_status: 'publish'
        })
      });

      const data = await response.json();
      
      // Handle nested data structure
      let postsArray = null;
      if (data.success && data.data) {
        if (Array.isArray(data.data)) {
          postsArray = data.data;
        } else if (data.data.data && Array.isArray(data.data.data)) {
          postsArray = data.data.data;
        }
      }

      if (postsArray) {
        setAvailablePosts(postsArray);
      } else {
        setAvailablePosts([]);
      }
    } catch (error) {
      console.error('Error loading available posts:', error);
      setAvailablePosts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const selectPost = (post) => {
    setLinkData(prev => ({
      ...prev,
      post_id: post.id,
      title: prev.title || post.title // Only set title if not already set
    }));
    setSelectedPost(post);
    setShowPostSearch(false);
    setSearchTerm('');
  };

  const clearSelectedPost = () => {
    setLinkData(prev => ({
      ...prev,
      post_id: '',
      title: ''
    }));
    setSelectedPost(null);
  };

  const getPostTypeLabel = (type) => {
    const labels = {
      'post': 'Post',
      'page': 'Page',
      'attachment': 'Media'
    };
    return labels[type] || type.charAt(0).toUpperCase() + type.slice(1);
  };

  return (
    <div className="mb-4">
      <div className="mb-2">
        <label className="block text-sm font-medium text-gray-700">
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      </div>

      <div className="border-2 border-gray-200 rounded-xl p-6 bg-gradient-to-br from-gray-50 to-gray-100 shadow-lg hover:border-blue-300 hover:shadow-xl transition-all duration-300">
        
        {/* Link Type Selection */}
        {link_types.length > 1 && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-600 mb-2">Link Type</label>
            <div className="flex gap-4">
              {link_types.includes('internal') && (
                <button
                  type="button"
                  onClick={() => {
                    setLinkData(prev => ({ ...prev, type: 'internal', url: '' }));
                    setShowPostSearch(false);
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all duration-300 ${
                    linkData.type === 'internal'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 bg-white text-gray-600 hover:border-blue-300'
                  }`}
                  disabled={isSubmitting}
                >
                  <Link size={16} />
                  Internal Link
                </button>
              )}
              {link_types.includes('external') && (
                <button
                  type="button"
                  onClick={() => {
                    setLinkData(prev => ({ ...prev, type: 'external', post_id: '' }));
                    setSelectedPost(null);
                    setShowPostSearch(false);
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all duration-300 ${
                    linkData.type === 'external'
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                      : 'border-gray-300 bg-white text-gray-600 hover:border-emerald-300'
                  }`}
                  disabled={isSubmitting}
                >
                  <ExternalLink size={16} />
                  External Link
                </button>
              )}
            </div>
          </div>
        )}

        {/* Internal Link Section */}
        {linkData.type === 'internal' && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-600 mb-2">Select Page/Post</label>
            
            {selectedPost ? (
              <div className="p-4 bg-white border-2 border-blue-200 rounded-lg flex items-center justify-between">
                <div className="flex-1">
                  <div className="font-semibold text-gray-800">{selectedPost.title}</div>
                  <div className="text-sm text-gray-500 flex items-center gap-2">
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium capitalize">
                      {getPostTypeLabel(selectedPost.type)}
                    </span>
                    {selectedPost.url && (
                      <a href={selectedPost.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        View
                      </a>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={clearSelectedPost}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  disabled={isSubmitting}
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowPostSearch(!showPostSearch);
                    if (!showPostSearch) {
                      loadAvailablePosts();
                    }
                  }}
                  className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-300 hover:text-blue-600 transition-all duration-300 flex items-center justify-center gap-2"
                  disabled={isSubmitting}
                >
                  <Search size={16} />
                  {showPostSearch ? 'Hide Post Selection' : 'Select Page/Post'}
                  <ChevronDown size={16} className={`transform transition-transform ${showPostSearch ? 'rotate-180' : ''}`} />
                </button>

                {showPostSearch && (
                  <div className="border-2 border-gray-200 rounded-lg bg-white overflow-hidden">
                    {/* Search Filters */}
                    <div className="p-4 bg-gray-50 border-b border-gray-200">
                      <div className="flex gap-4">
                        <div className="relative flex-1">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={16} />
                          <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search posts..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            disabled={isSubmitting}
                          />
                        </div>
                        <select
                          value={postTypeFilter}
                          onChange={(e) => setPostTypeFilter(e.target.value)}
                          className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          disabled={isSubmitting}
                        >
                          <option value="">All Types</option>
                          {post_types.map((type) => (
                            <option key={type} value={type}>
                              {getPostTypeLabel(type)}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Posts List */}
                    <div className="max-h-64 overflow-y-auto">
                      {isLoading ? (
                        <div className="p-8 text-center text-gray-500 animate-pulse">
                          Loading posts...
                        </div>
                      ) : availablePosts.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                          No posts found
                        </div>
                      ) : (
                        availablePosts.map((post) => (
                          <div
                            key={post.id}
                            onClick={() => selectPost(post)}
                            className="p-4 border-b border-gray-100 hover:bg-blue-50 cursor-pointer transition-colors last:border-b-0"
                          >
                            <div className="font-medium text-gray-800">{post.title}</div>
                            <div className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                              <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs capitalize">
                                {getPostTypeLabel(post.type)}
                              </span>
                              <span>({post.status})</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* External Link Section */}
        {linkData.type === 'external' && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-600 mb-2">External URL</label>
            <input
              type="url"
              value={linkData.url}
              onChange={(e) => setLinkData(prev => ({ ...prev, url: e.target.value }))}
              placeholder="https://example.com"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-3 focus:ring-emerald-100 focus:border-emerald-500 transition-all duration-300"
              disabled={isSubmitting}
            />
          </div>
        )}

        {/* Link Title */}
        {show_title && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-600 mb-2">
              Link Title <span className="text-gray-400">(optional)</span>
            </label>
            <input
              type="text"
              value={linkData.title}
              onChange={(e) => setLinkData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Custom link text"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-3 focus:ring-blue-100 focus:border-blue-500 transition-all duration-300"
              disabled={isSubmitting}
            />
          </div>
        )}

        {/* Link Target */}
        {show_target && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-600 mb-2">Open Link In</label>
            <select
              value={linkData.target}
              onChange={(e) => setLinkData(prev => ({ ...prev, target: e.target.value }))}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-3 focus:ring-blue-100 focus:border-blue-500 transition-all duration-300"
              disabled={isSubmitting}
            >
              <option value="_self">Same Window</option>
              <option value="_blank">New Window/Tab</option>
              <option value="_parent">Parent Frame</option>
              <option value="_top">Full Window</option>
            </select>
          </div>
        )}

        {/* Preview */}
        {(
          (linkData.type === 'internal' && selectedPost) ||
          (linkData.type === 'external' && linkData.url)
        ) && (
          <div className="mt-6 p-4 bg-white border-2 border-gray-200 rounded-lg">
            <div className="text-sm font-medium text-gray-600 mb-2">Preview:</div>
            <div className="flex items-center gap-2">
              {linkData.type === 'internal' ? <Link size={16} className="text-blue-500" /> : <ExternalLink size={16} className="text-emerald-500" />}
              <span className="text-blue-600 underline">
                {linkData.title || (linkData.type === 'internal' ? selectedPost?.title : linkData.url)}
              </span>
              <span className="text-gray-400 text-xs">
                (opens in {linkData.target === '_blank' ? 'new window' : 'same window'})
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LinkField;