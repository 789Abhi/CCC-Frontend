import React, { useState, useEffect, useRef, memo, useCallback, useMemo } from 'react';
import { Search, X, ChevronDown, ChevronUp, ArrowRight, ArrowLeft } from 'lucide-react';

const RelationshipField = memo(({ field, value, onChange, isSubmitting, fieldId }) => {
  const [selectedPosts, setSelectedPosts] = useState([]);
  const [availablePosts, setAvailablePosts] = useState([]);
  const [availablePostTypes, setAvailablePostTypes] = useState([]);
  const [availableTaxonomies, setAvailableTaxonomies] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [postTypeFilter, setPostTypeFilter] = useState('');
  const [taxonomyFilter, setTaxonomyFilter] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const searchTimeoutRef = useRef(null);
  const selectedPostsRef = useRef([]);

  // Keep ref in sync with state
  useEffect(() => {
    selectedPostsRef.current = selectedPosts;
  }, [selectedPosts]);

  // Parse field config - memoized to prevent recreation
  const config = useMemo(() => {
    return field.config ? (typeof field.config === 'string' ? JSON.parse(field.config) : field.config) : {};
  }, [field.config]);

  const {
    filter_post_types = Array.isArray(config.filter_post_types) ? config.filter_post_types : [],
    filter_post_status = Array.isArray(config.filter_post_status) ? config.filter_post_status : [],
    filter_taxonomy = config.filter_taxonomy || '',
    filters = Array.isArray(config.filters) ? config.filters : ['search', 'post_type'],
    max_posts = parseInt(config.max_posts) || 0,
    return_format = config.return_format || 'object'
  } = config;

  // Memoize the fetch functions to prevent recreation
  const fetchAvailablePostTypes = useCallback(async () => {
    try {
      console.log('RelationshipField: fetchAvailablePostTypes called');
      
      if (typeof cccData === 'undefined') {
        console.error('RelationshipField: cccData is not defined for fetchAvailablePostTypes');
        setAvailablePostTypes([]);
        return;
      }

      console.log('RelationshipField: Making AJAX call to fetch post types');
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
      
      let postTypesArray = null;
      if (data.success && data.data) {
        if (Array.isArray(data.data)) {
          postTypesArray = data.data;
        } else if (data.data.data && Array.isArray(data.data.data)) {
          postTypesArray = data.data.data;
        }
      }

      if (postTypesArray && Array.isArray(postTypesArray)) {
        let filteredPostTypes = postTypesArray.filter(postType => postType.value !== 'attachment');
        
        if (Array.isArray(filter_post_types) && filter_post_types.length > 0) {
          filteredPostTypes = filteredPostTypes.filter(postType => filter_post_types.includes(postType.value));
        }
        
        setAvailablePostTypes(filteredPostTypes);
      } else {
        setAvailablePostTypes([]);
      }
    } catch (error) {
      console.error('Error fetching available post types:', error);
      setAvailablePostTypes([]);
    }
  }, [filter_post_types]);

  const fetchAvailableTaxonomies = useCallback(async () => {
    try {
      if (typeof cccData === 'undefined') {
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
        setAvailableTaxonomies([]);
      }
    } catch (error) {
      setAvailableTaxonomies([]);
    }
  }, []);

  const fetchTaxonomiesForPostType = useCallback(async (postType) => {
    try {
      if (typeof cccData === 'undefined') {
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
      }
    } catch (error) {
      // Silently handle error
    }
  }, []);

  const fetchPostDetails = useCallback(async (postIds) => {
    try {
      if (typeof cccData === 'undefined') {
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
  }, []);

  const loadAvailablePosts = useCallback(async () => {
    // Prevent multiple simultaneous calls
    if (isLoading) {
      console.log('RelationshipField: Already loading, skipping duplicate call');
      return;
    }
    
    setIsLoading(true);
    try {
      if (typeof cccData === 'undefined') {
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
          taxonomy: taxonomyFilter || '',
          filter_post_types: Array.isArray(filter_post_types) && filter_post_types.length > 0 ? filter_post_types.join(',') : '',
          filter_post_status: Array.isArray(filter_post_status) ? filter_post_status.join(',') : '',
          filter_taxonomy: filter_taxonomy || ''
        })
      });
      
      const data = await response.json();
      let postsArray = null;
      if (data.success && data.data) {
        if (Array.isArray(data.data)) {
          postsArray = data.data;
        } else if (data.data.data && Array.isArray(data.data.data)) {
          postsArray = data.data.data;
        }
      }

      if (postsArray) {
        // Use ref to get current selectedPosts to avoid dependency issues
        const currentSelectedPosts = selectedPostsRef.current;
        const filteredPosts = postsArray.filter(post => 
          !Array.isArray(currentSelectedPosts) || !currentSelectedPosts.some(selected => selected.id === post.id)
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
  }, [searchTerm, postTypeFilter, taxonomyFilter, filter_post_types, filter_post_status, filter_taxonomy, isLoading]); // Add isLoading to prevent multiple calls

  const addPost = useCallback((post) => {
    const currentSelectedPosts = selectedPostsRef.current;
    if (Array.isArray(currentSelectedPosts) && currentSelectedPosts.some(p => p.id === post.id)) {
      return;
    }
    
    if (max_posts > 0 && Array.isArray(currentSelectedPosts) && currentSelectedPosts.length >= max_posts) {
      return;
    }
    
    setSelectedPosts(prev => Array.isArray(prev) ? [...prev, post] : [post]);
    setAvailablePosts(prev => Array.isArray(prev) ? prev.filter(p => p.id !== post.id) : []);
  }, [max_posts]); // Remove selectedPosts dependency

  const removePost = useCallback((postId) => {
    const currentSelectedPosts = selectedPostsRef.current;
    const removedPost = Array.isArray(currentSelectedPosts) ? currentSelectedPosts.find(post => post.id === postId) : null;
    setSelectedPosts(prev => Array.isArray(prev) ? prev.filter(post => post.id !== postId) : []);
    
    if (removedPost) {
      setAvailablePosts(prev => Array.isArray(prev) ? [...prev, removedPost] : []);
    }
  }, []); // Remove selectedPosts dependency

  const getPostTypeLabel = useCallback((postType) => {
    const postTypes = {
      post: 'Post',
      page: 'Page',
    };
    return postTypes[postType] || postType;
  }, []);

  const getStatusLabel = useCallback((status) => {
    const statuses = {
      publish: 'Published',
      draft: 'Draft',
      pending: 'Pending',
      private: 'Private'
    };
    return statuses[status] || status;
  }, []);

  // Load available posts on component mount - only once
  useEffect(() => {
    console.log('RelationshipField: Component mounted, calling fetchAvailablePostTypes');
    fetchAvailablePostTypes();
    fetchAvailableTaxonomies();
    loadAvailablePosts();
  }, []); // Empty dependency array - only run once

  // Load available posts when filters change - debounced
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      // Only load if we're not already loading
      if (!isLoading) {
        loadAvailablePosts();
      }
    }, 500); // Increased debounce time

    return () => clearTimeout(timeoutId);
  }, [searchTerm, postTypeFilter, taxonomyFilter, isLoading]); // Add isLoading to prevent calls while loading

  // Update taxonomies when post type changes
  useEffect(() => {
    if (postTypeFilter) {
      fetchTaxonomiesForPostType(postTypeFilter);
    } else {
      fetchAvailableTaxonomies();
    }
    setTaxonomyFilter('');
  }, [postTypeFilter]); // Remove fetchTaxonomiesForPostType and fetchAvailableTaxonomies from deps

  // Initialize selected posts from value - only when value changes
  useEffect(() => {
    if (value && typeof value === 'string' && value.trim()) {
      const postIds = value.split(',').filter(id => id.trim());
      if (postIds.length > 0) {
        fetchPostDetails(postIds);
      }
    }
  }, [value]); // Remove fetchPostDetails from deps

  // Update parent when selected posts change - debounced to prevent loops
  useEffect(() => {
    if (onChange) {
      const timeoutId = setTimeout(() => {
        const postIds = Array.isArray(selectedPosts) ? selectedPosts.map(post => post.id) : [];
        const valueToSend = return_format === 'id' ? postIds : postIds.join(',');
        
        // Only call onChange if the value has actually changed and is not empty
        if (valueToSend !== value && valueToSend !== '') {
          console.log('RelationshipField: Calling onChange with new value:', valueToSend);
          onChange(valueToSend);
        }
      }, 200); // Increased debounce time

      return () => clearTimeout(timeoutId);
    }
  }, [selectedPosts, onChange, return_format, value]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Memoize the render to prevent unnecessary re-renders
  const renderContent = useMemo(() => {
    // Only log when there are significant changes to reduce noise
    if (availablePosts.length > 0 || selectedPosts.length > 0) {
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
    }

    return (
      <div className="mb-4 ccc-field" data-field-id={fieldId}>
        <div className="mb-2">
          <label className="block text-sm font-medium text-gray-700">
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        </div>
        
        <div className="border-2 border-gray-200 rounded-xl p-6 bg-gradient-to-br from-gray-50 to-gray-100 shadow-lg hover:border-blue-300 hover:shadow-xl transition-all duration-300">
          {/* Search and Filters */}
          <div className="flex flex-wrap gap-4 mb-6 p-4 bg-white/80 backdrop-blur-sm rounded-lg border border-white/20">
            {filters.includes('search') && (
              <div className="relative flex-1 min-w-[250px]">
                <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 z-10" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search posts..."
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg text-sm bg-white shadow-sm focus:outline-none focus:ring-3 focus:ring-blue-100 focus:border-blue-500 hover:-translate-y-0.5 transition-all duration-300"
                  disabled={isSubmitting}
                />
              </div>
            )}
            
            {filters.includes('post_type') && (
              <div className="relative min-w-[160px]">
                <select
                  value={postTypeFilter}
                  onChange={(e) => setPostTypeFilter(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-sm bg-white shadow-sm focus:outline-none focus:ring-3 focus:ring-blue-100 focus:border-blue-500 hover:-translate-y-0.5 transition-all duration-300"
                  disabled={isSubmitting}
                >
                  <option value="">All post types</option>
                  {Array.isArray(availablePostTypes) && availablePostTypes.length > 0 ? (
                    availablePostTypes.map((postType) => (
                      <option key={postType.value} value={postType.value}>
                        {postType.label}
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>Loading post types...</option>
                  )}
                </select>
                {isLoading && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-blue-600 font-medium animate-pulse">
                    Loading...
                  </div>
                )}
              </div>
            )}
            
            {filters.includes('taxonomy') && (
              <select
                value={taxonomyFilter}
                onChange={(e) => setTaxonomyFilter(e.target.value)}
                className="min-w-[160px] px-4 py-3 border-2 border-gray-200 rounded-lg text-sm bg-white shadow-sm focus:outline-none focus:ring-3 focus:ring-blue-100 focus:border-blue-500 hover:-translate-y-0.5 transition-all duration-300"
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[350px]">
            {/* Available Posts Column */}
            <div className="border-2 border-gray-200 rounded-xl bg-white shadow-lg hover:border-emerald-300 hover:-translate-y-1 hover:shadow-xl transition-all duration-300 overflow-hidden">
              <h4 className="m-0 px-5 py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-sm font-semibold">
                Available Posts ({Array.isArray(availablePosts) ? availablePosts.length : 0})
              </h4>
              <div className="flex-1 max-h-[280px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                {isLoading ? (
                  <div className="p-8 text-center text-gray-500 italic bg-gradient-to-br from-blue-50 to-cyan-50 m-4 rounded-lg border-2 border-dashed border-blue-200 animate-pulse">
                    Loading posts...
                  </div>
                ) : !Array.isArray(availablePosts) || availablePosts.length === 0 ? (
                  <div className="p-8 text-center text-gray-500 italic bg-gradient-to-br from-gray-50 to-gray-100 m-4 rounded-lg border-2 border-dashed border-gray-300">
                    No posts available
                  </div>
                ) : (
                  availablePosts.map(post => {
                    const isSelected = Array.isArray(selectedPosts) && selectedPosts.some(selected => selected.id === post.id);
                    return (
                      <div
                        key={post.id}
                        className={`flex items-center justify-between p-4 border-b border-gray-100 transition-all duration-300 cursor-pointer relative ${
                          isSelected 
                            ? 'opacity-50 bg-gray-100 cursor-default' 
                            : 'hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 hover:translate-x-1'
                        } last:border-b-0`}
                        onClick={() => !isSelected && addPost(post)}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-gray-800 mb-2 leading-tight truncate">
                            {post.title}
                          </div>
                          <div className="flex gap-3 text-xs text-gray-500 items-center">
                            <span className="bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 px-3 py-1 rounded-full font-medium capitalize">
                              {getPostTypeLabel(post.type)}
                            </span>
                            <span className="italic">({getStatusLabel(post.status)})</span>
                          </div>
                        </div>
                        {isSelected ? (
                          <div className="absolute top-1/2 right-4 transform -translate-y-1/2 bg-emerald-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                            ✓ Added
                          </div>
                        ) : (
                          <button
                            type="button"
                            className="p-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg hover:from-emerald-600 hover:to-emerald-700 hover:-translate-y-0.5 hover:shadow-lg shadow-emerald-500/30 transition-all duration-300 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
                            onClick={(e) => {
                              e.stopPropagation();
                              addPost(post);
                            }}
                            disabled={max_posts > 0 && Array.isArray(selectedPosts) && selectedPosts.length >= max_posts}
                          >
                            <ArrowRight size={14} />
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Selected Posts Column */}
            <div className="border-2 border-gray-200 rounded-xl bg-white shadow-lg hover:border-red-300 hover:-translate-y-1 hover:shadow-xl transition-all duration-300 overflow-hidden">
              <h4 className="m-0 px-5 py-4 bg-gradient-to-r from-red-500 to-red-600 text-white text-sm font-semibold">
                Selected Posts ({Array.isArray(selectedPosts) ? selectedPosts.length : 0}{max_posts > 0 ? `/${max_posts}` : ''})
              </h4>
              <div className="flex-1 max-h-[280px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                {!Array.isArray(selectedPosts) || selectedPosts.length === 0 ? (
                  <div className="p-8 text-center text-gray-500 italic bg-gradient-to-br from-gray-50 to-gray-100 m-4 rounded-lg border-2 border-dashed border-gray-300">
                    No posts selected
                  </div>
                ) : (
                  selectedPosts.map(post => (
                    <div 
                      key={post.id} 
                      className="flex items-center justify-between p-4 border-b border-gray-100 transition-all duration-300 bg-white hover:bg-gradient-to-r hover:from-red-50 hover:to-pink-50 hover:-translate-x-1 last:border-b-0"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-800 leading-tight truncate">
                          {post.title}
                        </div>
                      </div>
                      <button
                        type="button"
                        className="p-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 hover:-translate-y-0.5 hover:shadow-lg shadow-red-500/30 transition-all duration-300 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
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
      </div>
    );
  }, [availablePosts, availablePostTypes, availableTaxonomies, selectedPosts, isLoading, searchTerm, postTypeFilter, taxonomyFilter, filters, field.label, field.required, isSubmitting, max_posts, addPost, removePost, getPostTypeLabel, getStatusLabel]);

  return renderContent;
});

RelationshipField.displayName = 'RelationshipField';

export default RelationshipField; 