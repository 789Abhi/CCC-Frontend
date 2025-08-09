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
    console.log('RelationshipField: Component mounted, calling fetchAvailablePostTypes');
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
      console.log('RelationshipField: fetchAvailablePostTypes called');
      
      // Check if cccData is available
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
          console.log('RelationshipField: Found direct array in data.data');
        } else if (data.data.data && Array.isArray(data.data.data)) {
          postTypesArray = data.data.data;
          console.log('RelationshipField: Found nested array in data.data.data');
        } else {
          console.log('RelationshipField: No valid array found in data structure');
        }
      }

      if (postTypesArray && Array.isArray(postTypesArray)) {
        // Filter out 'attachment' post type (Media)
        let filteredPostTypes = postTypesArray.filter(postType => postType.value !== 'attachment');
        
        // If specific post types are configured in field settings, only show those
        if (Array.isArray(filter_post_types) && filter_post_types.length > 0) {
          filteredPostTypes = filteredPostTypes.filter(postType => filter_post_types.includes(postType.value));
          console.log('RelationshipField: Filtering post types based on configuration:', filter_post_types);
        }
        
        console.log('RelationshipField: Setting available post types:', filteredPostTypes);
        console.log('RelationshipField: Filtered post types length:', filteredPostTypes.length);
        setAvailablePostTypes(filteredPostTypes);
      } else {
        console.warn('Invalid post types data received:', data);
        console.warn('RelationshipField: postTypesArray is not an array:', postTypesArray);
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
          filter_post_types: Array.isArray(filter_post_types) && filter_post_types.length > 0 ? filter_post_types.join(',') : '', // Use configured post types
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
  console.log('RelationshipField: Available post types for rendering:', availablePostTypes);

  return (
    <div className="mb-4">
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
                 onChange={(e) => {
                   console.log('RelationshipField: Post type filter changed to:', e.target.value);
                   setPostTypeFilter(e.target.value);
                 }}
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
               onChange={(e) => {
                 console.log('RelationshipField: Taxonomy filter changed to:', e.target.value);
                 setTaxonomyFilter(e.target.value);
               }}
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
                (Array.isArray(availablePosts) ? availablePosts : []).map(post => {
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
                (Array.isArray(selectedPosts) ? selectedPosts : []).map(post => (
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
};

export default RelationshipField; 