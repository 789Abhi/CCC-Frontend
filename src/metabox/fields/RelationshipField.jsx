import React, { useState, useEffect, useRef } from 'react';
import { Search, ChevronDown, X, Plus, Trash2, Filter, FileText, Calendar, Tag } from 'lucide-react';


const RelationshipField = ({ 
  label, 
  fieldName, 
  fieldConfig = {}, 
  fieldValue = '', 
  fieldRequired = false, 
  onChange 
}) => {
  const {
    post_types = [],
    post_status = [],
    taxonomy_filters = [],
    filters = ['search'],
    min_posts = 0,
    max_posts = 0,
    return_format = 'object',
    multiple = true
  } = fieldConfig;

  const [localValue, setLocalValue] = useState([]);
  const [availablePosts, setAvailablePosts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPostType, setSelectedPostType] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedTaxonomies, setSelectedTaxonomies] = useState({});
  const [showFilters, setShowFilters] = useState(false);
  const [error, setError] = useState('');

  const dropdownRef = useRef(null);
  const isFetchingRef = useRef(false);

  // Initialize local value from fieldValue prop
  useEffect(() => {
    if (fieldValue) {
      try {
        const parsed = typeof fieldValue === 'string' 
          ? (fieldValue.startsWith('[') ? JSON.parse(fieldValue) : fieldValue.split(',').map(Number))
          : fieldValue;
        setLocalValue(Array.isArray(parsed) ? parsed : [parsed]);
      } catch (e) {
        setLocalValue([]);
      }
    } else {
      setLocalValue([]);
    }
  }, [fieldValue]);

  // Fetch available posts - only called manually
  const fetchPosts = async () => {
    // Prevent multiple simultaneous requests
    if (isFetchingRef.current) {
      console.log('RelationshipField: Request already in progress, skipping');
      return;
    }

    isFetchingRef.current = true;
    setIsLoading(true);
    setError('');

    console.log('RelationshipField: Starting fetchPosts');
    
    if (!window.cccData || !window.cccData.ajaxUrl) {
      console.error('RelationshipField: cccData not available');
      setError('AJAX configuration not available');
      setIsLoading(false);
      isFetchingRef.current = false;
      return;
    }

    try {
      const formData = new FormData();
      formData.append('action', 'ccc_get_relationship_posts');
      formData.append('nonce', window.getNonce ? window.getNonce() : (window.cccData?.nonce || ''));
      formData.append('post_types', post_types.join(','));
      formData.append('post_status', post_status.join(','));
      formData.append('search', searchTerm || '');
      formData.append('post_type_filter', selectedPostType || '');
      formData.append('status_filter', selectedStatus || '');
      formData.append('taxonomy_filters', JSON.stringify(selectedTaxonomies));
      formData.append('exclude', localValue.join(','));
      formData.append('per_page', '50');

      const response = await fetch(window.cccData?.ajaxUrl || window.ajaxurl, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        setAvailablePosts(data.data || []);
      } else {
        setError(data.data || 'Failed to fetch posts');
        setAvailablePosts([]);
      }
    } catch (err) {
      setError('Network error occurred');
      setAvailablePosts([]);
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  };

  // Load posts only once on mount
  useEffect(() => {
    // Only fetch posts once on mount if we have the necessary configuration
    if (window.cccData && window.cccData.ajaxUrl && (window.getNonce || window.cccData?.nonce)) {
      fetchPosts();
    } else {
      console.warn('RelationshipField: Cannot fetch posts - missing AJAX configuration');
      setError('AJAX configuration not available');
    }
  }, []); // Empty dependency array - only run once on mount

  // Manual trigger functions for filter changes
  const handleSearchChange = (value) => {
    setSearchTerm(value);
    // Debounce the search
    setTimeout(() => {
      fetchPosts();
    }, 300);
  };

  const handlePostTypeChange = (value) => {
    setSelectedPostType(value);
    fetchPosts();
  };

  const handleStatusChange = (value) => {
    setSelectedStatus(value);
    fetchPosts();
  };

  const handleTaxonomyChange = (value) => {
    setSelectedTaxonomies(value);
    fetchPosts();
  };

  // Handle adding a post
  const handleAddPost = (post) => {
    const newValue = [...localValue, post.ID];
    
    // Check max posts limit
    if (max_posts > 0 && newValue.length > max_posts) {
      setError(`Maximum ${max_posts} posts allowed`);
      return;
    }

    setLocalValue(newValue);
    onChange(newValue);
    setError('');
  };

  // Handle removing a post
  const handleRemovePost = (postId) => {
    const newValue = localValue.filter(id => id !== postId);
    setLocalValue(newValue);
    onChange(newValue);
    setError('');
  };

  // Get selected posts for display
  const getSelectedPosts = () => {
    return localValue.map(postId => {
      // Try to find in available posts first
      let post = availablePosts.find(p => p.ID === postId);
      if (!post) {
        // If not found in available posts, create a basic object
        post = { ID: postId, post_title: `Post #${postId}`, post_type: 'unknown' };
      }
      return post;
    }).filter(Boolean);
  };

  // Get grouped posts by post type
  const getGroupedPosts = () => {
    const grouped = {};
    
    availablePosts.forEach(post => {
      const postType = post.post_type || 'unknown';
      if (!grouped[postType]) {
        grouped[postType] = [];
      }
      grouped[postType].push(post);
    });

    // Sort post types and posts within each group
    const sortedGroups = {};
    Object.keys(grouped).sort().forEach(postType => {
      sortedGroups[postType] = grouped[postType].sort((a, b) => 
        a.post_title.localeCompare(b.post_title)
      );
    });

    return sortedGroups;
  };

  // Get post type label
  const getPostTypeLabel = (postType) => {
    const labels = {
      'post': 'Posts',
      'page': 'Pages',
      'attachment': 'Media'
    };
    return labels[postType] || postType.charAt(0).toUpperCase() + postType.slice(1);
  };


  // Get available post types for filter
  const getAvailablePostTypes = () => {
    const types = [...new Set(availablePosts.map(p => p.post_type))];
    return types.map(type => ({
      value: type,
      label: getPostTypeLabel(type)
    }));
  };

  // Get available statuses for filter
  const getAvailableStatuses = () => {
    const statuses = [...new Set(availablePosts.map(p => p.post_status))];
    return statuses.map(status => ({
      value: status,
      label: status.charAt(0).toUpperCase() + status.slice(1)
    }));
  };

  const selectedPosts = getSelectedPosts();
  const groupedPosts = getGroupedPosts();

  return (
    <div className="ccc-relationship-field">
      {label && (
        <label className="ccc-field-label">
          {label}
          {fieldRequired && <span className="ccc-required">*</span>}
        </label>
      )}

      {/* Selected Posts */}
      <div className="ccc-selected-posts">
        <div className="ccc-selected-header">
          <h4>Selected Posts ({selectedPosts.length})</h4>
          {min_posts > 0 && (
            <span className="ccc-min-posts">
              Minimum: {min_posts}
            </span>
          )}
          {max_posts > 0 && (
            <span className="ccc-max-posts">
              Maximum: {max_posts}
            </span>
          )}
        </div>

        {selectedPosts.length === 0 ? (
          <div className="ccc-no-selection">
            <FileText className="ccc-icon" />
            <p>No posts selected</p>
          </div>
        ) : (
          <div className="ccc-selected-list">
            {selectedPosts.map((post) => (
              <div key={post.ID} className="ccc-selected-item">
                <div className="ccc-post-info">
                  {post.featured_image && (
                    <img 
                      src={post.featured_image} 
                      alt={post.post_title}
                      className="ccc-post-thumbnail"
                    />
                  )}
                  <div className="ccc-post-details">
                    <h5 className="ccc-post-title">{post.post_title}</h5>
                    <div className="ccc-post-meta">
                      <span className="ccc-post-type">
                        {getPostTypeLabel(post.post_type)}
                      </span>
                      <span className="ccc-post-status">
                        {post.post_status}
                      </span>
                      <span className="ccc-post-date">
                        {new Date(post.post_date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemovePost(post.ID)}
                  className="ccc-remove-btn"
                  title="Remove post"
                >
                  <X className="ccc-icon" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Available Posts */}
      <div className="ccc-available-posts">
        <div className="ccc-available-header">
          <h4>Available Posts</h4>
          <div className="ccc-header-actions">
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`ccc-filter-toggle ${showFilters ? 'active' : ''}`}
            >
              <Filter className="ccc-icon" />
              Filters
            </button>
            <button
              type="button"
              onClick={fetchPosts}
              className="ccc-refresh-btn"
              title="Refresh posts"
            >
              <Search className="ccc-icon" />
            </button>
          </div>
        </div>

        {/* Filters */}
        {showFilters && filters.length > 0 && (
          <div className="ccc-filters">
            {filters.includes('search') && (
              <div className="ccc-filter-group">
                <Search className="ccc-icon" />
                <input
                  type="text"
                  placeholder="Search posts..."
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="ccc-search-input"
                />
              </div>
            )}

            {filters.includes('post_type') && (
              <div className="ccc-filter-group">
                <FileText className="ccc-icon" />
                <select
                  value={selectedPostType}
                  onChange={(e) => handlePostTypeChange(e.target.value)}
                  className="ccc-filter-select"
                >
                  <option value="">All Post Types</option>
                  {getAvailablePostTypes().map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {filters.includes('taxonomy') && taxonomy_filters.length > 0 && (
              <div className="ccc-filter-group">
                <Tag className="ccc-icon" />
                <select
                  className="ccc-filter-select"
                  onChange={(e) => {
                    const taxonomy = e.target.value;
                    if (taxonomy) {
                      // Handle taxonomy filtering
                      setSelectedTaxonomies(prev => ({
                        ...prev,
                        [taxonomy]: []
                      }));
                    }
                  }}
                >
                  <option value="">All Taxonomies</option>
                  {taxonomy_filters.map(filter => (
                    <option key={filter.taxonomy} value={filter.taxonomy}>
                      {filter.taxonomy}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}

        {/* Posts List */}
        <div className="ccc-posts-container">
          {isLoading ? (
            <div className="ccc-loading">
              <div className="ccc-spinner"></div>
              <p>Loading posts...</p>
            </div>
          ) : error ? (
            <div className="ccc-error">
              <p>{error}</p>
            </div>
          ) : availablePosts.length === 0 ? (
            <div className="ccc-no-posts">
              <FileText className="ccc-icon" />
              <p>No posts found</p>
            </div>
          ) : (
            <div className="ccc-posts-list">
              {Object.entries(groupedPosts).map(([postType, posts]) => (
                <div key={postType} className="ccc-post-group">
                  <div className="ccc-group-header">
                    <h5>{getPostTypeLabel(postType)} ({posts.length})</h5>
                  </div>
                  <div className="ccc-group-posts">
                    {posts.map((post) => (
                      <div key={post.ID} className="ccc-post-item">
                        <div className="ccc-post-content">
                          {post.featured_image && (
                            <img 
                              src={post.featured_image} 
                              alt={post.post_title}
                              className="ccc-post-thumbnail"
                            />
                          )}
                          <div className="ccc-post-details">
                            <h6 className="ccc-post-title">{post.post_title}</h6>
                            <div className="ccc-post-meta">
                              <span className="ccc-post-status">
                                {post.post_status}
                              </span>
                              <span className="ccc-post-date">
                                {new Date(post.post_date).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleAddPost(post)}
                          className="ccc-add-btn"
                          disabled={max_posts > 0 && localValue.length >= max_posts}
                          title="Add post"
                        >
                          <Plus className="ccc-icon" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="ccc-error-message">
          <p>{error}</p>
        </div>
      )}

      {/* Validation Messages */}
      {fieldRequired && localValue.length === 0 && (
        <div className="ccc-validation-error">
          <p>This field is required.</p>
        </div>
      )}

      {min_posts > 0 && localValue.length < min_posts && (
        <div className="ccc-validation-error">
          <p>Please select at least {min_posts} post(s).</p>
        </div>
      )}

      <style jsx>{`
        .ccc-relationship-field {
          display: flex;
          flex-direction: column;
          gap: 20px;
          max-width: 100%;
        }

        .ccc-field-label {
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 8px;
          display: block;
        }

        .ccc-required {
          color: #ef4444;
          margin-left: 4px;
        }

        .ccc-selected-posts,
        .ccc-available-posts {
          border: 1px solid #d1d5db;
          border-radius: 8px;
          background: #ffffff;
        }

        .ccc-selected-header,
        .ccc-available-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px;
          border-bottom: 1px solid #e5e7eb;
          background: #f9fafb;
          border-radius: 8px 8px 0 0;
        }

        .ccc-header-actions {
          display: flex;
          gap: 8px;
        }

        .ccc-selected-header h4,
        .ccc-available-header h4 {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
          color: #1f2937;
        }

        .ccc-min-posts,
        .ccc-max-posts {
          font-size: 12px;
          color: #6b7280;
          background: #f3f4f6;
          padding: 4px 8px;
          border-radius: 4px;
        }

        .ccc-filter-toggle {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 12px;
          background: #ffffff;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.2s;
        }

        .ccc-filter-toggle:hover {
          background: #f3f4f6;
        }

        .ccc-filter-toggle.active {
          background: #3b82f6;
          color: white;
          border-color: #3b82f6;
        }

        .ccc-refresh-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 12px;
          background: #ffffff;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.2s;
        }

        .ccc-refresh-btn:hover {
          background: #f3f4f6;
        }

        .ccc-no-selection,
        .ccc-no-posts {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
          color: #6b7280;
        }

        .ccc-no-selection .ccc-icon,
        .ccc-no-posts .ccc-icon {
          width: 48px;
          height: 48px;
          margin-bottom: 12px;
          opacity: 0.5;
        }

        .ccc-filters {
          padding: 16px;
          border-bottom: 1px solid #e5e7eb;
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          background: #f9fafb;
        }

        .ccc-filter-group {
          display: flex;
          align-items: center;
          gap: 8px;
          min-width: 200px;
        }

        .ccc-search-input,
        .ccc-filter-select {
          flex: 1;
          padding: 8px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 14px;
          background: white;
        }

        .ccc-search-input:focus,
        .ccc-filter-select:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .ccc-selected-list {
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          max-height: 300px;
          overflow-y: auto;
        }

        .ccc-selected-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          background: #f9fafb;
        }

        .ccc-post-info {
          display: flex;
          align-items: center;
          gap: 12px;
          flex: 1;
        }

        .ccc-post-thumbnail {
          width: 40px;
          height: 40px;
          object-fit: cover;
          border-radius: 4px;
          background: #f3f4f6;
        }

        .ccc-post-details {
          flex: 1;
        }

        .ccc-post-title {
          margin: 0 0 4px 0;
          font-size: 14px;
          font-weight: 600;
          color: #1f2937;
        }

        .ccc-post-meta {
          display: flex;
          gap: 12px;
          font-size: 12px;
          color: #6b7280;
        }

        .ccc-remove-btn {
          padding: 6px;
          background: #ef4444;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s;
        }

        .ccc-remove-btn:hover {
          background: #dc2626;
        }

        .ccc-remove-btn .ccc-icon {
          width: 16px;
          height: 16px;
        }

        .ccc-posts-container {
          padding: 16px;
          max-height: 400px;
          overflow-y: auto;
        }

        .ccc-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
          color: #6b7280;
        }

        .ccc-spinner {
          width: 32px;
          height: 32px;
          border: 3px solid #e5e7eb;
          border-top: 3px solid #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 12px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .ccc-error {
          padding: 16px;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 6px;
          color: #dc2626;
        }

        .ccc-posts-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .ccc-post-group {
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          overflow: hidden;
        }

        .ccc-group-header {
          padding: 12px 16px;
          background: #f3f4f6;
          border-bottom: 1px solid #e5e7eb;
        }

        .ccc-group-header h5 {
          margin: 0;
          font-size: 14px;
          font-weight: 600;
          color: #374151;
        }

        .ccc-group-posts {
          display: flex;
          flex-direction: column;
        }

        .ccc-post-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          border-bottom: 1px solid #f3f4f6;
        }

        .ccc-post-item:last-child {
          border-bottom: none;
        }

        .ccc-post-content {
          display: flex;
          align-items: center;
          gap: 12px;
          flex: 1;
        }

        .ccc-post-item .ccc-post-title {
          font-size: 13px;
          margin-bottom: 2px;
        }

        .ccc-add-btn {
          padding: 6px;
          background: #10b981;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s;
        }

        .ccc-add-btn:hover:not(:disabled) {
          background: #059669;
        }

        .ccc-add-btn:disabled {
          background: #9ca3af;
          cursor: not-allowed;
        }

        .ccc-add-btn .ccc-icon {
          width: 16px;
          height: 16px;
        }

        .ccc-icon {
          width: 20px;
          height: 20px;
          color: #6b7280;
        }

        .ccc-error-message,
        .ccc-validation-error {
          padding: 12px;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 6px;
          color: #dc2626;
          font-size: 14px;
        }

        .ccc-validation-error {
          background: #fffbeb;
          border-color: #fed7aa;
          color: #d97706;
        }
      `}</style>
    </div>
  );
};

export default RelationshipField;
