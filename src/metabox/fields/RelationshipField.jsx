import React, { useState, useEffect, useRef } from 'react';
import { Search, X, ChevronDown, ChevronUp, ArrowRight, ArrowLeft } from 'lucide-react';

const RelationshipField = ({ field, value, onChange, isSubmitting }) => {
  const [selectedPosts, setSelectedPosts] = useState([]);
  const [availablePosts, setAvailablePosts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [postTypeFilter, setPostTypeFilter] = useState('');
  const [taxonomyFilter, setTaxonomyFilter] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const searchTimeoutRef = useRef(null);

  // Parse field config
  const config = field.config ? (typeof field.config === 'string' ? JSON.parse(field.config) : field.config) : {};
  const {
    filter_post_types = [],
    filter_post_status = [],
    filter_taxonomy = '',
    filters = ['search', 'post_type'],
    max_posts = 0,
    return_format = 'object'
  } = config;

  // Load available posts on component mount
  useEffect(() => {
    loadAvailablePosts();
  }, []);

  // Load available posts when filters change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadAvailablePosts();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, postTypeFilter, taxonomyFilter]);

  // Initialize selected posts from value
  useEffect(() => {
    if (value) {
      const postIds = typeof value === 'string' ? value.split(',').filter(id => id.trim()) : value;
      if (postIds.length > 0) {
        // Fetch post details for selected IDs
        fetchPostDetails(postIds);
      }
    }
  }, [value]);

  // Update parent when selected posts change
  useEffect(() => {
    if (onChange) {
      const postIds = selectedPosts.map(post => post.id);
      const valueToSend = return_format === 'id' ? postIds : postIds.join(',');
      onChange(valueToSend);
    }
  }, [selectedPosts, onChange, return_format]);

  const fetchPostDetails = async (postIds) => {
    try {
      const response = await fetch(cccData.ajaxUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          action: 'ccc_get_posts_by_ids',
          nonce: cccData.nonce,
          post_ids: postIds.join(',')
        })
      });
      
      const data = await response.json();
      if (data.success && data.data) {
        setSelectedPosts(data.data);
      }
    } catch (error) {
      console.error('Error fetching post details:', error);
    }
  };

  const loadAvailablePosts = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(cccData.ajaxUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          action: 'ccc_search_posts',
          nonce: cccData.nonce,
          search: searchTerm,
          post_type: postTypeFilter,
          taxonomy: taxonomyFilter,
          filter_post_types: filter_post_types.join(','),
          filter_post_status: filter_post_status.join(','),
          filter_taxonomy: filter_taxonomy
        })
      });
      
      const data = await response.json();
      if (data.success && data.data) {
        // Filter out already selected posts
        const filteredPosts = data.data.filter(post => 
          !selectedPosts.some(selected => selected.id === post.id)
        );
        setAvailablePosts(filteredPosts);
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



  const addPost = (post) => {
    // Check if already selected
    if (selectedPosts.some(p => p.id === post.id)) {
      return;
    }
    
    // Check max posts limit
    if (max_posts > 0 && selectedPosts.length >= max_posts) {
      return;
    }
    
    setSelectedPosts(prev => [...prev, post]);
    // Remove from available posts
    setAvailablePosts(prev => prev.filter(p => p.id !== post.id));
  };

  const removePost = (postId) => {
    const removedPost = selectedPosts.find(post => post.id === postId);
    setSelectedPosts(prev => prev.filter(post => post.id !== postId));
    
    // Add back to available posts if it exists
    if (removedPost) {
      setAvailablePosts(prev => [...prev, removedPost]);
    }
  };

  const getPostTypeLabel = (postType) => {
    const postTypes = {
      post: 'Post',
      page: 'Page',
      // Add more as needed
    };
    return postTypes[postType] || postType;
  };

  const getStatusLabel = (status) => {
    const statuses = {
      publish: 'Published',
      draft: 'Draft',
      pending: 'Pending',
      private: 'Private'
    };
    return statuses[status] || status;
  };

  return (
    <div className="ccc-field ccc-relationship-field">
      <div className="ccc-field-header">
        <label className="ccc-field-label">
          {field.label}
          {field.required && <span className="required">*</span>}
        </label>
      </div>
      
      <div className="ccc-relationship-container">
        {/* Search and Filters */}
        <div className="ccc-relationship-filters">
          {filters.includes('search') && (
            <div className="ccc-relationship-search-container">
              <Search size={16} className="ccc-search-icon" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search posts..."
                className="ccc-field-input ccc-relationship-search"
                disabled={isSubmitting}
              />
            </div>
          )}
          
          {filters.includes('post_type') && (
            <select
              value={postTypeFilter}
              onChange={(e) => setPostTypeFilter(e.target.value)}
              className="ccc-field-input ccc-relationship-post-type-filter"
              disabled={isSubmitting}
            >
              <option value="">All post types</option>
              <option value="post">Post</option>
              <option value="page">Page</option>
            </select>
          )}
          
          {filters.includes('taxonomy') && (
            <select
              value={taxonomyFilter}
              onChange={(e) => setTaxonomyFilter(e.target.value)}
              className="ccc-field-input ccc-relationship-taxonomy-filter"
              disabled={isSubmitting}
            >
              <option value="">All taxonomies</option>
              <option value="category">Category</option>
              <option value="post_tag">Tag</option>
            </select>
          )}
        </div>

        {/* Two Column Layout */}
        <div className="ccc-relationship-columns">
          {/* Available Posts Column */}
          <div className="ccc-relationship-available">
            <h4>Available Posts ({availablePosts.length})</h4>
            <div className="ccc-relationship-available-items">
              {isLoading ? (
                <div className="ccc-relationship-loading">Loading posts...</div>
              ) : availablePosts.length === 0 ? (
                <div className="ccc-relationship-empty">No posts available</div>
              ) : (
                availablePosts.map(post => (
                  <div
                    key={post.id}
                    className="ccc-relationship-available-item"
                    onClick={() => addPost(post)}
                  >
                    <div className="ccc-relationship-available-content">
                      <div className="ccc-relationship-available-title">{post.title}</div>
                      <div className="ccc-relationship-available-meta">
                        <span className="ccc-relationship-available-type">{getPostTypeLabel(post.type)}</span>
                        <span className="ccc-relationship-available-status">({getStatusLabel(post.status)})</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="ccc-relationship-add-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        addPost(post);
                      }}
                      disabled={max_posts > 0 && selectedPosts.length >= max_posts}
                    >
                      <ArrowRight size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Selected Posts Column */}
          <div className="ccc-relationship-selected">
            <h4>Selected Posts ({selectedPosts.length}{max_posts > 0 ? `/${max_posts}` : ''})</h4>
            <div className="ccc-relationship-selected-items">
              {selectedPosts.length === 0 ? (
                <div className="ccc-relationship-empty">No posts selected</div>
              ) : (
                selectedPosts.map(post => (
                  <div key={post.id} className="ccc-relationship-selected-item">
                    <div className="ccc-relationship-selected-content">
                      <div className="ccc-relationship-selected-title">{post.title}</div>
                      <div className="ccc-relationship-selected-meta">
                        <span className="ccc-relationship-selected-type">{getPostTypeLabel(post.type)}</span>
                        <span className="ccc-relationship-selected-status">({getStatusLabel(post.status)})</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="ccc-relationship-remove-btn"
                      onClick={() => removePost(post.id)}
                      disabled={isSubmitting}
                    >
                      <ArrowLeft size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RelationshipField; 