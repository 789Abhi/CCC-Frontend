import React, { useEffect } from 'react';
import { fieldAccessService } from '../hooks/useFieldAccess';

/**
 * Component that preloads field access data when the app first loads
 * This ensures field access data is available immediately when popups open
 */
const FieldAccessPreloader = () => {
  useEffect(() => {
    // Preload field access data immediately when component mounts
    console.log('FieldAccessPreloader: Preloading field access data...');
    fieldAccessService.loadData().then(() => {
      console.log('FieldAccessPreloader: Field access data preloaded successfully');
    }).catch((error) => {
      console.error('FieldAccessPreloader: Failed to preload field access data:', error);
    });
  }, []);

  // This component doesn't render anything
  return null;
};

export default FieldAccessPreloader;
