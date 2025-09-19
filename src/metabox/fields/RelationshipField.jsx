import React, { useState, useEffect, useRef } from 'react';
import { Search, ChevronDown, X, Plus, Trash2, Filter, FileText, Calendar, Tag, RefreshCw } from 'lucide-react';


const RelationshipField = ({ 
  label, 
  fieldName, 
  fieldConfig = {}, 
  fieldValue = '', 
  fieldRequired = false, 
  onChange 
}) => {
  const {
    filter_post_types = [],
    filter_post_status = [],
    filter_taxonomy = '',
    filters = ['search'],
    min_posts = 0,
    max_posts = 0,
    return_format = 'object',
    multiple = true
  } = fieldConfig;

  const [localValue, setLocalValue] = useState([]);
  const [availablePosts, setAvailablePosts] = useState([]);
  const [allPostsCache, setAllPostsCache] = useState([]); // Cache all posts for selected items
  const [allAvailablePostTypes, setAllAvailablePostTypes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPostType, setSelectedPostType] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedTaxonomies, setSelectedTaxonomies] = useState({});
  const [availableTaxonomies, setAvailableTaxonomies] = useState([]);
  const [showFilters, setShowFilters] = useState(true);
  const [error, setError] = useState('');

  const dropdownRef = useRef(null);
  const isFetchingRef = useRef(false);
  const searchTimeoutRef = useRef(null);

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
  const fetchPosts = async (postType = selectedPostType, status = selectedStatus, taxonomies = selectedTaxonomies) => {
    // Prevent multiple simultaneous requests
    if (isFetchingRef.current) {
      console.log('RelationshipField: Request already in progress, skipping');
      return;
    }

    isFetchingRef.current = true;
    setIsLoading(true);
    setError('');

      console.log('RelationshipField: Starting fetchPosts');
      console.log('RelationshipField: Using postType param:', postType);
      console.log('RelationshipField: Using status param:', status);
      console.log('RelationshipField: Using taxonomies param:', taxonomies);
      console.log('RelationshipField: selectedPostType state:', selectedPostType);
      console.log('RelationshipField: filter_post_types:', filter_post_types);
      console.log('RelationshipField: selectedStatus state:', selectedStatus);
      console.log('RelationshipField: selectedTaxonomies state:', selectedTaxonomies);
    
    if (!window.cccData || !window.cccData.ajaxUrl) {
      console.error('RelationshipField: cccData not available');
      setError('AJAX configuration not available');
      setIsLoading(false);
      isFetchingRef.current = false;
      return;
    }

    try {
      // Build the request data
      const requestData = {
        action: 'ccc_get_relationship_posts',
        nonce: window.getNonce ? window.getNonce() : (window.cccData?.nonce || ''),
        per_page: '50'
      };
      
      // Add filters from fieldConfig (only if not overridden by current filters)
      if (postType) {
        // If a specific post type is selected in the filter, use only that
        requestData.post_types = JSON.stringify([postType]);
      } else if (filter_post_types.length > 0) {
        // Otherwise use configured post types
        requestData.post_types = JSON.stringify(filter_post_types);
      }
      
      if (status) {
        // If a specific status is selected in the filter, use only that
        requestData.post_status = JSON.stringify([status]);
      } else if (filter_post_status.length > 0) {
        // Otherwise use configured post statuses
        requestData.post_status = JSON.stringify(filter_post_status);
      }
      
      if (Object.keys(taxonomies).length > 0) {
        // If specific taxonomies are selected in the filter, use those
        requestData.taxonomy_filters = JSON.stringify(taxonomies);
      } else if (filter_taxonomy) {
        // Otherwise use configured taxonomy
        requestData.taxonomy_filters = JSON.stringify([{ taxonomy: filter_taxonomy, terms: [] }]);
      }
      
      // Add search term
      if (searchTerm) {
        requestData.search = searchTerm;
      }
      
      // Exclude already selected posts to prevent duplicate selection
      if (localValue.length > 0) {
        requestData.exclude = JSON.stringify(localValue);
      }

      // Debug: Log what we're sending
      console.log('RelationshipField: Sending request data:', requestData);

      // Convert to FormData for sending
      const formData = new FormData();
      for (const [key, value] of Object.entries(requestData)) {
        formData.append(key, value);
      }

      const response = await fetch(window.cccData?.ajaxUrl || window.ajaxurl, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        const posts = data.data || [];
        setAvailablePosts(posts);
        
        // Only update cache and post types when fetching all posts (no specific filter)
        if (!postType && !status && Object.keys(taxonomies).length === 0 && !searchTerm) {
          const postTypes = [...new Set(posts.map(p => p.post_type))].filter(type => type !== 'attachment');
          setAllAvailablePostTypes(postTypes);
          setAllPostsCache(posts); // Cache all posts for selected items
          console.log('RelationshipField: Updated all available post types:', postTypes);
          console.log('RelationshipField: Cached all posts for selected items:', posts.length, 'posts');
        } else {
          console.log('RelationshipField: Not updating cache due to filters - postType:', postType, 'status:', status, 'taxonomies:', Object.keys(taxonomies).length, 'searchTerm:', searchTerm);
        }
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

  // Load posts and taxonomies only once on mount
  useEffect(() => {
    // Only fetch posts once on mount if we have the necessary configuration
    if (window.cccData && window.cccData.ajaxUrl && (window.getNonce || window.cccData?.nonce)) {
      fetchPosts();
      // Fetch initial taxonomies (all taxonomies since no specific filter is selected)
      fetchTaxonomiesForPostType('all');
    } else {
      console.warn('RelationshipField: Cannot fetch posts - missing AJAX configuration');
      setError('AJAX configuration not available');
    }
  }, []); // Empty dependency array - only run once on mount

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Manual trigger functions for filter changes
  const handleSearchChange = (value) => {
    setSearchTerm(value);
    // Debounce search to prevent rapid requests
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      fetchPosts();
    }, 300);
  };

  const handlePostTypeChange = (value) => {
    console.log('RelationshipField: handlePostTypeChange called with:', value);
    setSelectedPostType(value);
    // Fetch taxonomies for the selected post type
    fetchTaxonomiesForPostType(value);
    // Clear selected taxonomies when post type changes
    setSelectedTaxonomies({});
    // Fetch posts immediately with the new value
    console.log('RelationshipField: About to fetchPosts with selectedPostType:', value);
    fetchPosts(value, selectedStatus, {});
  };

  const handleStatusChange = (value) => {
    console.log('RelationshipField: handleStatusChange called with:', value);
    setSelectedStatus(value);
    // Fetch posts immediately with the new value
    console.log('RelationshipField: About to fetchPosts with selectedStatus:', value);
    fetchPosts(selectedPostType, value, selectedTaxonomies);
  };

  const handleTaxonomyChange = (value) => {
    console.log('RelationshipField: handleTaxonomyChange called with:', value);
    setSelectedTaxonomies(value);
    // Fetch posts immediately with the new value
    console.log('RelationshipField: About to fetchPosts with selectedTaxonomies:', value);
    fetchPosts(selectedPostType, selectedStatus, value);
  };

  // Fetch taxonomies for the selected post type
  const fetchTaxonomiesForPostType = async (postType) => {
    try {
      console.log('RelationshipField: Fetching taxonomies for post type:', postType);
      
      // Set empty array immediately to show "No taxonomies available" if none exist
      setAvailableTaxonomies([]);
      
      const formData = new FormData();
      formData.append('action', 'ccc_get_taxonomies_for_post_type');
      formData.append('nonce', window.getNonce ? window.getNonce() : (window.cccData?.nonce || ''));
      
      // Use the passed postType directly
      formData.append('post_type', postType || 'all');
      
      const response = await fetch(window.cccData?.ajaxUrl || window.ajaxurl, {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      
      if (data.success) {
        setAvailableTaxonomies(data.data || []);
        console.log('RelationshipField: Available taxonomies:', data.data);
      } else {
        console.error('RelationshipField: Failed to fetch taxonomies:', data.data);
        setAvailableTaxonomies([]);
      }
    } catch (error) {
      console.error('RelationshipField: Error fetching taxonomies:', error);
      setAvailableTaxonomies([]);
    }
  };

  // Handle toggling a post (add if not selected, remove if selected)
  const handleTogglePost = (post) => {
    const isSelected = localValue.includes(post.ID);
    
    if (isSelected) {
      // Remove the post
      const newValue = localValue.filter(id => id !== post.ID);
      setLocalValue(newValue);
      onChange(newValue);
      setError('');
      
      // Refresh available posts to show the removed post again
      setTimeout(() => {
        fetchPosts();
      }, 100);
    } else {
      // Add the post
      const newValue = [...localValue, post.ID];
      
      // Check max posts limit
      if (max_posts > 0 && newValue.length > max_posts) {
        setError(`Maximum ${max_posts} posts allowed`);
        return;
      }

      setLocalValue(newValue);
      onChange(newValue);
      setError('');
      
      // Refresh available posts to remove the selected one
      setTimeout(() => {
        fetchPosts();
      }, 100);
    }
  };

  // Handle removing a post (for the remove button)
  const handleRemovePost = (postId) => {
    const newValue = localValue.filter(id => id !== postId);
    setLocalValue(newValue);
    onChange(newValue);
    setError('');
    
    // Refresh available posts to show the removed post again
    setTimeout(() => {
      fetchPosts();
    }, 100);
  };

  // Get selected posts for display
  const getSelectedPosts = () => {
    console.log('RelationshipField: getSelectedPosts called with localValue:', localValue);
    console.log('RelationshipField: allPostsCache has', allPostsCache.length, 'posts');
    console.log('RelationshipField: availablePosts has', availablePosts.length, 'posts');
    
    return localValue.map(postId => {
      // First try to find in available posts (current filtered results)
      let post = availablePosts.find(p => p.ID === postId);
      if (!post) {
        // If not found in filtered results, try the cache of all posts
        post = allPostsCache.find(p => p.ID === postId);
        console.log(`RelationshipField: Post ${postId} not found in availablePosts, checking cache:`, post ? 'Found' : 'Not found');
        if (post) {
          console.log('RelationshipField: Found post in cache:', post.post_title);
        } else {
          console.log('RelationshipField: Cache contains post IDs:', allPostsCache.map(p => p.ID));
        }
      }
      if (!post) {
        // If still not found, create a basic object as fallback
        console.log(`RelationshipField: Post ${postId} not found anywhere, creating fallback`);
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
    // Use the stored list of all available post types, fallback to current results
    const postTypesToUse = allAvailablePostTypes.length > 0 ? allAvailablePostTypes : 
      [...new Set(availablePosts.map(p => p.post_type))].filter(type => type !== 'attachment');
    
    return postTypesToUse.map(type => ({
      value: type,
      label: getPostTypeLabel(type)
    }));
  };

  // Get available statuses for filter
  const getAvailableStatuses = () => {
    // Always show all available statuses from the fetched posts for filtering
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

      {/* Two Column Layout */}
      <div className="ccc-relationship-columns">
        {/* Left Column - Available Posts */}
        <div className="ccc-column ccc-available-column">
          <div className="ccc-available-posts">
            <div className="ccc-available-header">
              <h4>Available Posts</h4>
              <div className="ccc-header-actions">
                {filters.includes('search') && (
                  <button
                    type="button"
                    onClick={() => setShowFilters(!showFilters)}
                    className={`ccc-search-toggle ${showFilters ? 'active' : ''}`}
                    title="Toggle search"
                  >
                    <Search className="ccc-icon" />
                  </button>
                )}
                {filters.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowFilters(!showFilters)}
                    className={`ccc-filter-toggle ${showFilters ? 'active' : ''}`}
                    title="Toggle filters"
                  >
                    <Filter className="ccc-icon" />
                  </button>
                )}
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

                {filters.includes('status') && (
                  <div className="ccc-filter-group">
                    <Calendar className="ccc-icon" />
                    <select
                      value={selectedStatus}
                      onChange={(e) => handleStatusChange(e.target.value)}
                      className="ccc-filter-select"
                    >
                      <option value="">All Statuses</option>
                      {getAvailableStatuses().map(status => (
                        <option key={status.value} value={status.value}>
                          {status.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {filters.includes('taxonomy') && availableTaxonomies.length > 0 && (
                  <div className="ccc-filter-group">
                    <Tag className="ccc-icon" />
                    <select
                      className="ccc-filter-select"
                      onChange={(e) => {
                        const taxonomy = e.target.value;
                        if (taxonomy) {
                          handleTaxonomyChange({ [taxonomy]: [] });
                        } else {
                          handleTaxonomyChange({});
                        }
                      }}
                    >
                      <option value="">All Taxonomies</option>
                      {availableTaxonomies.map(taxonomy => (
                        <option key={taxonomy.value} value={taxonomy.value}>
                          {taxonomy.label}
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
                  <button onClick={fetchPosts} className="ccc-retry-btn">
                    Retry
                  </button>
                </div>
              ) : availablePosts.length === 0 ? (
                <div className="ccc-no-posts">
                  <FileText className="ccc-icon" />
                  <p>No posts found</p>
                  <small>Try adjusting your filters or search terms</small>
                  <button onClick={fetchPosts} className="ccc-retry-btn">
                    Refresh
                  </button>
                </div>
              ) : (
                <div className="ccc-posts-list">
                  {Object.entries(groupedPosts).map(([postType, posts]) => (
                    <div key={postType} className="ccc-post-group">
                      <div className="ccc-group-header">
                        <h5>{getPostTypeLabel(postType)} ({posts.length})</h5>
                      </div>
                      <div className="ccc-group-posts">
                        {posts.map((post) => {
                          const isSelected = localValue.some(selected => 
                            (typeof selected === 'object' ? selected.ID : selected) === post.ID
                          );
                          return (
                            <div 
                              key={post.ID} 
                              className={`ccc-post-item ${isSelected ? 'ccc-post-item-selected' : ''}`}
                              onClick={isSelected ? undefined : () => handleTogglePost(post)}
                              style={{ 
                                cursor: isSelected ? 'not-allowed' : 'pointer',
                                opacity: isSelected ? 0.5 : 1
                              }}
                              title={isSelected ? "Post already selected" : "Click to select post"}
                            >
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
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!isSelected) {
                                  handleTogglePost(post);
                                }
                              }}
                              className="ccc-add-btn"
                              disabled={isSelected || (max_posts > 0 && localValue.length >= max_posts)}
                              title={
                                isSelected ? "Post already selected" :
                                max_posts > 0 && localValue.length >= max_posts ? `Maximum ${max_posts} posts allowed` : 
                                "Click to select post"
                              }
                            >
                              <Plus className="ccc-icon" />
                            </button>
                          </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Selected Posts */}
        <div className="ccc-column ccc-selected-column">
          <div className="ccc-selected-posts">
            <div className="ccc-selected-header">
              <h4>Selected Posts ({selectedPosts.length})</h4>
              {min_posts > 0 && (
                <span className="ccc-min-posts">
                  Min: {min_posts}
                </span>
              )}
              {max_posts > 0 && (
                <span className="ccc-max-posts">
                  Max: {max_posts}
                </span>
              )}
            </div>

            {selectedPosts.length === 0 ? (
              <div className="ccc-no-selection">
                <FileText className="ccc-icon" />
                <p>No posts selected</p>
                <small>Select posts from the left panel</small>
              </div>
            ) : (
              <div className="ccc-selected-list">
                {selectedPosts.map((post) => (
                  <div 
                    key={post.ID} 
                    className="ccc-selected-item"
                    onClick={() => handleTogglePost(post)}
                    style={{ cursor: 'pointer' }}
                    title="Click to deselect post"
                  >
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
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTogglePost(post);
                      }}
                      className="ccc-remove-btn"
                      title="Click to deselect post"
                    >
                      <X className="ccc-icon" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
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
          gap: 16px;
          max-width: 100%;
        }

        .ccc-field-label {
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 8px;
          display: block;
          font-size: 14px;
        }

        .ccc-required {
          color: #ef4444;
          margin-left: 4px;
        }

        /* Two Column Layout */
        .ccc-relationship-columns {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          min-height: 500px;
        }

        .ccc-column {
          display: flex;
          flex-direction: column;
          min-height: 500px;
        }

        .ccc-selected-column {
          background: #f8fafc;
          border-radius: 8px;
          padding: 16px;
        }

        .ccc-available-column {
          background: #ffffff;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          overflow: hidden;
        }

        .ccc-selected-posts {
          height: 100%;
          display: flex;
          flex-direction: column;
        }

        .ccc-available-posts {
          height: 100%;
          display: flex;
          flex-direction: column;
        }

        .ccc-selected-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 2px solid #e5e7eb;
        }

        .ccc-available-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px;
          border-bottom: 1px solid #e5e7eb;
          background: #f9fafb;
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

        .ccc-filter-toggle {
          padding: 8px 12px;
          background: #ffffff;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          display: flex;
          align-items: center;
          gap: 6px;
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

        .ccc-filters {
          padding: 16px;
          border-bottom: 1px solid #e5e7eb;
          display: flex;
          flex-direction: column;
          gap: 12px;
          background: #f9fafb;
        }

        .ccc-filter-group {
          display: flex;
          align-items: center;
          gap: 8px;
          min-width: 200px;
        }

        .ccc-search-input {
          flex: 1;
          padding: 8px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 14px;
        }

        .ccc-filter-select {
          flex: 1;
          padding: 8px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 14px;
          background: white;
        }

        .ccc-retry-btn {
          margin-top: 12px;
          padding: 8px 16px;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          transition: background 0.2s;
        }

        .ccc-retry-btn:hover {
          background: #2563eb;
        }

        .ccc-no-selection,
        .ccc-no-posts {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
          color: #6b7280;
          text-align: center;
          flex: 1;
        }

        .ccc-no-selection .ccc-icon,
        .ccc-no-posts .ccc-icon {
          width: 48px;
          height: 48px;
          margin-bottom: 12px;
          opacity: 0.5;
        }

        .ccc-no-selection small,
        .ccc-no-posts small {
          margin-top: 8px;
          font-size: 12px;
          color: #9ca3af;
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

        .ccc-post-item-selected {
          background-color: #f3f4f6;
          color: #9ca3af;
        }

        .ccc-post-item-selected .ccc-post-title {
          color: #9ca3af;
        }

        .ccc-post-item-selected .ccc-post-meta {
          color: #9ca3af;
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

        /* Responsive adjustments */
        @media (max-width: 1200px) {
          .ccc-relationship-columns {
            grid-template-columns: 1fr;
            gap: 16px;
          }
          
          .ccc-column {
            min-height: 300px;
          }
        }

        @media (max-width: 768px) {
          .ccc-relationship-columns {
            gap: 12px;
          }
          
          .ccc-selected-column {
            padding: 12px;
          }
          
          .ccc-filters {
            flex-direction: column;
            gap: 12px;
          }
          
          .ccc-filter-group {
            min-width: auto;
          }
        }
      `}</style>
    </div>
  );
};

export default RelationshipField;
