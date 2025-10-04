import React, { useEffect } from 'react';
import { fieldAccessService } from '../hooks/useFieldAccess';

/**
 * Component that preloads field access data when the app first loads
 * This ensures field access data is available immediately when popups open
 */
const FieldAccessPreloader = () => {
  useEffect(() => {
    // Preload field access data immediately when component mounts
    // console.log('FieldAccessPreloader: Preloading field access data...');
    fieldAccessService.loadData().then(() => {
      // console.log('FieldAccessPreloader: Field access data preloaded successfully');
    }).catch((error) => {
      console.error('FieldAccessPreloader: Failed to preload field access data:', error);
    });

    // Check for license changes periodically
    const licenseCheckInterval = setInterval(() => {
      fieldAccessService.checkLicenseChange();
    }, 5000); // Check every 5 seconds

    // Cleanup interval on unmount
    return () => {
      clearInterval(licenseCheckInterval);
    };
  }, []);

  // This component doesn't render anything
  return null;
};

export default FieldAccessPreloader;
