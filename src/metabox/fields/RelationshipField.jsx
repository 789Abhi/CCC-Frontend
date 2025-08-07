import React, { useState, useEffect, useRef } from 'react';
import { Search, X, ChevronDown, ChevronUp, ArrowRight, ArrowLeft } from 'lucide-react';

const RelationshipField = ({ field, value, onChange, isSubmitting }) => {
  const [selectedPosts, setSelectedPosts] = useState([]);
  const [availablePosts, setAvailablePosts] = useState([]);
  const [availablePostTypes, setAvailablePostTypes] = useState([]);
  const [availableTaxonomies, setAvailableTaxonomies] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [postTypeFilter, setPostTypeFilter] = useState('');
  const [taxonomyFilter, setTaxonomyFilter] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const searchTimeoutRef = useRef(null);

  // Parse field config
  const config = field.config ? (typeof field.config === 'string' ? JSON.parse(field.config) : field.config) : {};
  const {
    filter_post_types = Array.isArray(config.filter_post_types) ? config.filter_post_types : [],
    filter_post_status = Array.isArray(config.filter_post_status) ? config.filter_post_status : [],
    filter_taxonomy = config.filter_taxonomy || '',
    filters = Array.isArray(config.filters) ? config.filters : ['search', 'post_type'],
    max_posts = parseInt(config.max_posts) || 0,
    return_format = config.return_format || 'object'
  } = config;

  // Load available posts on component mount
  useEffect(() => {
    fetchAvailablePostTypes();
    fetchAvailableTaxonomies();
    loadAvailablePosts();
  }, []);

  // Load available posts when filters change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadAvailablePosts();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, postTypeFilter, taxonomyFilter]);

  // Update taxonomies when post type changes
  useEffect(() => {
    if (postTypeFilter) {
      fetchTaxonomiesForPostType(postTypeFilter);
    } else {
      // Reset to all taxonomies when no post type is selected
      fetchAvailableTaxonomies();
    }
    // Reset taxonomy filter when post type changes
    setTaxonomyFilter('');
  }, [postTypeFilter]);

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
      const postIds = Array.isArray(selectedPosts) ? selectedPosts.map(post => post.id) : [];
      const valueToSend = return_format === 'id' ? postIds : postIds.join(',');
      onChange(valueToSend);
    }
  }, [selectedPosts, onChange, return_format]);

  const fetchAvailablePostTypes = async () => {
    try {
      // Check if cccData is available
      if (typeof cccData === 'undefined') {
        console.error('RelationshipField: cccData is not defined for fetchAvailablePostTypes');
        setAvailablePostTypes([]);
        return;
      }

      const response = await fetch(cccData.ajaxUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          action: 'ccc_get_available_post_types',
          nonce: cccData.nonce
        })
      });
      
      const data = await response.json();
      console.log('RelationshipField: Post types data received:', data);
      console.log('RelationshipField: Post types data structure:', {
        success: data.success,
        hasData: !!data.data,
        dataType: typeof data.data,
        isArray: Array.isArray(data.data),
        dataLength: data.data ? data.data.length : 0
      });
      
      // Handle nested data structure
      let postTypesArray = null;
      if (data.success && data.data) {
        if (Array.isArray(data.data)) {
          postTypesArray = data.data;
        } else if (data.data.data && Array.isArray(data.data.data)) {
          postTypesArray = data.data.data;
        }
      }

      if (postTypesArray) {
        console.log('RelationshipField: Setting available post types:', postTypesArray);
        setAvailablePostTypes(postTypesArray);
      } else {
        console.warn('Invalid post types data received:', data);
        setAvailablePostTypes([]);
      }
    } catch (error) {
      console.error('Error fetching available post types:', error);
      setAvailablePostTypes([]);
    }
  };

  const fetchAvailableTaxonomies = async () => {
    try {
      // Check if cccData is available
      if (typeof cccData === 'undefined') {
        console.error('RelationshipField: cccData is not defined for fetchAvailableTaxonomies');
        setAvailableTaxonomies([]);
        return;
      }

      const response = await fetch(cccData.ajaxUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          action: 'ccc_get_available_taxonomies',
          nonce: cccData.nonce
        })
      });
      
      const data = await response.json();
      console.log('RelationshipField: Taxonomies data received:', data);
      // Handle nested data structure
      let taxonomiesArray = null;
      if (data.success && data.data) {
        if (Array.isArray(data.data)) {
          taxonomiesArray = data.data;
        } else if (data.data.data && Array.isArray(data.data.data)) {
          taxonomiesArray = data.data.data;
        }
      }

      if (taxonomiesArray) {
        setAvailableTaxonomies(taxonomiesArray);
      } else {
        console.warn('Invalid taxonomies data received:', data);
        setAvailableTaxonomies([]);
      }
    } catch (error) {
      console.error('Error fetching available taxonomies:', error);
      setAvailableTaxonomies([]);
    }
  };

  const fetchTaxonomiesForPostType = async (postType) => {
    try {
      // Check if cccData is available
      if (typeof cccData === 'undefined') {
        console.error('RelationshipField: cccData is not defined for fetchTaxonomiesForPostType');
        setAvailableTaxonomies([]);
        return;
      }

      const response = await fetch(cccData.ajaxUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          action: 'ccc_get_taxonomies_for_post_type',
          nonce: cccData.nonce,
          post_type: postType
        })
      });
      
      const data = await response.json();
      console.log('RelationshipField: Taxonomies for post type data received:', data);
      // Handle nested data structure
      let taxonomiesArray = null;
      if (data.success && data.data) {
        if (Array.isArray(data.data)) {
          taxonomiesArray = data.data;
        } else if (data.data.data && Array.isArray(data.data.data)) {
          taxonomiesArray = data.data.data;
        }
      }

      if (taxonomiesArray) {
        setAvailableTaxonomies(taxonomiesArray);
      } else {
        console.warn('Invalid taxonomies for post type data received:', data);
        setAvailableTaxonomies([]);
      }
    } catch (error) {
      console.error('Error fetching taxonomies for post type:', error);
      setAvailableTaxonomies([]);
    }
  };

  const fetchPostDetails = async (postIds) => {
    try {
      // Check if cccData is available
      if (typeof cccData === 'undefined') {
        console.error('RelationshipField: cccData is not defined for fetchPostDetails');
        return;
      }

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
        setSelectedPosts(postsArray);
      }
    } catch (error) {
      console.error('Error fetching post details:', error);
    }
  };

  const loadAvailablePosts = async () => {
    setIsLoading(true);
    try {
      console.log('RelationshipField: Loading posts with filters:', {
        searchTerm,
        postTypeFilter,
        taxonomyFilter,
        filter_post_types,
        filter_post_status,
        filter_taxonomy
      });

      // Check if cccData is available
      if (typeof cccData === 'undefined') {
        console.error('RelationshipField: cccData is not defined');
        setAvailablePosts([]);
        return;
      }

      console.log('RelationshipField: cccData available:', {
        ajaxUrl: cccData.ajaxUrl,
        nonce: cccData.nonce ? 'present' : 'missing'
      });

      const response = await fetch(cccData.ajaxUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          action: 'ccc_search_posts',
          nonce: cccData.nonce,
          search: searchTerm || '', // Always send search parameter, even if empty
          post_type: postTypeFilter || '', // Send empty string to show all posts by default
          taxonomy: taxonomyFilter || '', // Send taxonomy filter if selected
          filter_post_types: '', // Don't filter by post types - show all posts
          filter_post_status: Array.isArray(filter_post_status) ? filter_post_status.join(',') : '',
          filter_taxonomy: filter_taxonomy || '' // Ensure empty string if undefined
        })
      });
      
      const data = await response.json();
      console.log('RelationshipField: Posts data received:', data);
      console.log('RelationshipField: Data structure:', {
        success: data.success,
        hasData: !!data.data,
        dataType: typeof data.data,
        isArray: Array.isArray(data.data),
        dataLength: data.data ? data.data.length : 0
      });

      // Handle nested data structure: {data: {data: Array(5)}}
      let postsArray = null;
      if (data.success && data.data) {
        if (Array.isArray(data.data)) {
          // Direct array: {data: Array(5)}
          postsArray = data.data;
        } else if (data.data.data && Array.isArray(data.data.data)) {
          // Nested structure: {data: {data: Array(5)}}
          postsArray = data.data.data;
        }
      }

      if (postsArray) {
        console.log('RelationshipField: Processing posts data:', postsArray);
        // Filter out already selected posts
        const filteredPosts = postsArray.filter(post => 
          !Array.isArray(selectedPosts) || !selectedPosts.some(selected => selected.id === post.id)
        );
        console.log('RelationshipField: Available posts after filtering:', filteredPosts);
        setAvailablePosts(filteredPosts);

        // Log post types found
        const postTypesFound = [...new Set(postsArray.map(post => post.type))];
        console.log('RelationshipField: Post types found in response:', postTypesFound);
      } else {
        console.warn('Invalid posts data received:', data);
        console.warn('RelationshipField: Could not find posts array in data structure');
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
    if (Array.isArray(selectedPosts) && selectedPosts.some(p => p.id === post.id)) {
      return;
    }
    
    // Check max posts limit
    if (max_posts > 0 && Array.isArray(selectedPosts) && selectedPosts.length >= max_posts) {
      return;
    }
    
    setSelectedPosts(prev => Array.isArray(prev) ? [...prev, post] : [post]);
    // Remove from available posts
    setAvailablePosts(prev => Array.isArray(prev) ? prev.filter(p => p.id !== post.id) : []);
  };

  const removePost = (postId) => {
    const removedPost = Array.isArray(selectedPosts) ? selectedPosts.find(post => post.id === postId) : null;
    setSelectedPosts(prev => Array.isArray(prev) ? prev.filter(post => post.id !== postId) : []);
    
    // Add back to available posts if it exists
    if (removedPost) {
      setAvailablePosts(prev => Array.isArray(prev) ? [...prev, removedPost] : [removedPost]);
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

  // Debug logging for render
  console.log('RelationshipField: Rendering with state:', {
    availablePosts: availablePosts.length,
    availablePostTypes: availablePostTypes.length,
    availableTaxonomies: availableTaxonomies.length,
    selectedPosts: selectedPosts.length,
    isLoading,
    searchTerm,
    postTypeFilter,
    taxonomyFilter
  });

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
             <div className="ccc-relationship-filter-container">
               <select
                 value={postTypeFilter}
                 onChange={(e) => {
                   console.log('RelationshipField: Post type filter changed to:', e.target.value);
                   setPostTypeFilter(e.target.value);
                 }}
                 className="ccc-field-input ccc-relationship-post-type-filter"
                 disabled={isSubmitting}
               >
                 <option value="">All post types</option>
                 {Array.isArray(availablePostTypes) && availablePostTypes.map((postType) => (
                   <option key={postType.value} value={postType.value}>
                     {postType.label}
                   </option>
                 ))}
               </select>
               {isLoading && (
                 <div className="ccc-relationship-filter-loading">Loading...</div>
               )}
             </div>
           )}
          
                     {filters.includes('taxonomy') && (
             <select
               value={taxonomyFilter}
               onChange={(e) => {
                 console.log('RelationshipField: Taxonomy filter changed to:', e.target.value);
                 setTaxonomyFilter(e.target.value);
               }}
               className="ccc-field-input ccc-relationship-taxonomy-filter"
               disabled={isSubmitting}
             >
               <option value="">All taxonomies</option>
               {Array.isArray(availableTaxonomies) && availableTaxonomies.map((taxonomy) => (
                 <option key={taxonomy.value} value={taxonomy.value}>
                   {taxonomy.label}
                 </option>
               ))}
             </select>
           )}
        </div>

        {/* Two Column Layout */}
        <div className="ccc-relationship-columns">
          {/* Available Posts Column */}
          <div className="ccc-relationship-available">
                         <h4>Available Posts ({Array.isArray(availablePosts) ? availablePosts.length : 0})</h4>
            <div className="ccc-relationship-available-items">
              {isLoading ? (
                <div className="ccc-relationship-loading">Loading posts...</div>
                             ) : !Array.isArray(availablePosts) || availablePosts.length === 0 ? (
                <div className="ccc-relationship-empty">No posts available</div>
              ) : (
                                 (Array.isArray(availablePosts) ? availablePosts : []).map(post => (
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
                        {post.date && (
                          <span className="ccc-relationship-available-date">{post.date}</span>
                        )}
                      </div>
                      {/* Show excerpt if available */}
                      {post.excerpt && (
                        <div className="ccc-relationship-available-excerpt">
                          {post.excerpt}
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      className="ccc-relationship-add-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        addPost(post);
                      }}
                      disabled={max_posts > 0 && Array.isArray(selectedPosts) && selectedPosts.length >= max_posts}
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
            <h4>Selected Posts ({Array.isArray(selectedPosts) ? selectedPosts.length : 0}{max_posts > 0 ? `/${max_posts}` : ''})</h4>
            <div className="ccc-relationship-selected-items">
              {!Array.isArray(selectedPosts) || selectedPosts.length === 0 ? (
                <div className="ccc-relationship-empty">No posts selected</div>
              ) : (
                (Array.isArray(selectedPosts) ? selectedPosts : []).map(post => (
                  <div key={post.id} className="ccc-relationship-selected-item">
                    <div className="ccc-relationship-selected-content">
                      <div className="ccc-relationship-selected-title">{post.title}</div>
                      <div className="ccc-relationship-selected-meta">
                        <span className="ccc-relationship-selected-type">{getPostTypeLabel(post.type)}</span>
                        <span className="ccc-relationship-selected-status">({getStatusLabel(post.status)})</span>
                      </div>
                      {/* Show post URL if available */}
                      {post.url && (
                        <div className="ccc-relationship-selected-url">
                          <a href={post.url} target="_blank" rel="noopener noreferrer" className="ccc-relationship-post-link">
                            View Post
                          </a>
                        </div>
                      )}
                      {/* Show post excerpt if available */}
                      {post.excerpt && (
                        <div className="ccc-relationship-selected-excerpt">
                          {post.excerpt}
                        </div>
                      )}
                      {/* Show post date and author if available */}
                      {(post.date || post.author) && (
                        <div className="ccc-relationship-selected-meta">
                          {post.date && (
                            <span className="ccc-relationship-selected-date">
                              {post.date}
                            </span>
                          )}
                          {post.author && (
                            <span className="ccc-relationship-selected-author">
                              by {post.author}
                            </span>
                          )}
                        </div>
                      )}
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