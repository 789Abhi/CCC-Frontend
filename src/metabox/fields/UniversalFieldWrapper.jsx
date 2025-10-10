import React, { useState, useEffect } from 'react';

/**
 * Universal Field Wrapper Component
 * Works with ALL field types dynamically from API
 */
const UniversalFieldWrapper = ({ 
  fieldType, 
  fieldLabel, 
  children, 
  licenseKey = '', 
  apiUrl = 'https://custom-craft-component-backend.vercel.app/api/pro-features/check' 
}) => {
  // Metabox policy: always allow field access for existing components
  // No PRO gating in metabox - fields should always render normally
  return <>{children}</>;
};

export default UniversalFieldWrapper;
