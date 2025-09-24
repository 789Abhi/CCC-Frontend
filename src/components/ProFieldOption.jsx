import React from 'react';

/**
 * PRO Field Option Component
 * Renders a field type option with PRO restrictions and tags
 */
const ProFieldOption = ({ 
  fieldType, 
  label, 
  isPro, 
  canAccess, 
  message, 
  requiredPlan, 
  userPlan,
  name,
  icon,
  onUpgradeClick 
}) => {
  const handleClick = (e) => {
    if (!canAccess) {
      e.preventDefault();
      e.stopPropagation();
      if (onUpgradeClick) {
        onUpgradeClick(fieldType, requiredPlan, userPlan);
      }
    }
  };

  const handleMouseEnter = (e) => {
    if (!canAccess) {
      e.target.style.cursor = 'not-allowed';
    }
  };

  // Use the name from backend API if available, otherwise use the label
  const displayName = name || label;

  return (
    <option 
      value={fieldType}
      disabled={!canAccess}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      style={{
        opacity: canAccess ? 1 : 0.5,
        backgroundColor: canAccess ? 'white' : '#f9fafb',
        color: canAccess ? '#374151' : '#9ca3af'
      }}
    >
      {icon && `${icon} `}{displayName}
      {isPro && !canAccess && ' (PRO - Upgrade Required)'}
      {isPro && canAccess && ' (PRO)'}
    </option>
  );
};

export default ProFieldOption;
