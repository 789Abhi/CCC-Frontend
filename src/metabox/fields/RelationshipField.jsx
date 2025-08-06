import React, { useState, useEffect, useRef } from 'react';
import { Search, X, ChevronDown, ChevronUp } from 'lucide-react';

const RelationshipField = ({ field, value, onChange, isSubmitting }) => {
  const [selectedPosts, setSelectedPosts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [postTypeFilter, setPostTypeFilter] = useState('');
  const [taxonomyFilter, setTaxonomyFilter] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
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

  const searchPosts = async () => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
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
        setSearchResults(data.data);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Error searching posts:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      searchPosts();
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm, postTypeFilter, taxonomyFilter]);

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
    setSearchTerm('');
    setSearchResults([]);
    setShowResults(false);
  };

  const removePost = (postId) => {
    setSelectedPosts(prev => prev.filter(post => post.id !== postId));
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
                onFocus={() => setShowResults(true)}
                placeholder="Search..."
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
              <option value="">Select post type</option>
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
              <option value="">Select taxonomy</option>
              <option value="category">Category</option>
              <option value="post_tag">Tag</option>
            </select>
          )}
        </div>

        {/* Search Results */}
        {showResults && (searchResults.length > 0 || isSearching) && (
          <div className="ccc-relationship-results">
            {isSearching ? (
              <div className="ccc-relationship-loading">Searching...</div>
            ) : (
              searchResults.map(post => (
                <div
                  key={post.id}
                  className="ccc-relationship-result-item"
                  onClick={() => addPost(post)}
                >
                  <div className="ccc-relationship-result-content">
                    <div className="ccc-relationship-result-title">{post.title}</div>
                    <div className="ccc-relationship-result-meta">
                      <span className="ccc-relationship-result-type">{getPostTypeLabel(post.type)}</span>
                      <span className="ccc-relationship-result-status">({getStatusLabel(post.status)})</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="ccc-relationship-add-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      addPost(post);
                    }}
                  >
                    +
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {/* Selected Items */}
        <div className="ccc-relationship-selected">
          <h4>Selected Items ({selectedPosts.length}{max_posts > 0 ? `/${max_posts}` : ''})</h4>
          <div className="ccc-relationship-selected-items">
            {selectedPosts.length === 0 ? (
              <div className="ccc-relationship-empty">No items selected</div>
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
                    <X size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RelationshipField; 