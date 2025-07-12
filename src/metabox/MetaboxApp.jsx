import React, { useState, useEffect } from 'react';
import ComponentList from './components/ComponentList';

function MetaboxApp() {
  const [components, setComponents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Get post ID from WordPress
  const getPostId = () => {
    // Try to get from cccData first
    if (typeof cccData !== 'undefined' && cccData.postId) {
      return cccData.postId;
    }
    
    // Try to get from data attribute
    const metaboxRoot = document.getElementById('ccc-metabox-root');
    if (metaboxRoot && metaboxRoot.dataset.postId) {
      return parseInt(metaboxRoot.dataset.postId);
    }
    
    return 0;
  };

  // Load assigned components for this post
  const loadAssignedComponents = async () => {
    try {
      setIsLoading(true);
      const postId = getPostId();
      
      if (!postId) {
        setComponents([]);
        return;
      }

      const response = await fetch(cccData.ajaxUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          action: 'ccc_get_posts_with_components',
          nonce: cccData.nonce,
          post_id: postId
        })
      });

      const data = await response.json();
      
      // Ensure we always have an array
      if (data.success && Array.isArray(data.data?.components)) {
        setComponents(data.data.components);
      } else {
        console.warn('CCC Metabox: Components data is not an array:', data);
        setComponents([]);
      }
    } catch (error) {
      console.error('CCC Metabox: Error loading components:', error);
      setComponents([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAssignedComponents();
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin mb-4"></div>
        <p className="text-gray-600">Loading components...</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-0">
      <ComponentList 
        components={components}
        isReadOnly={true}
      />
    </div>
  );
}

export default MetaboxApp; 