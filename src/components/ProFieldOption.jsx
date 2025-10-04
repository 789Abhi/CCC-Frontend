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

  // Use the label directly (simple field type name)
  const displayName = label;

  // Format the display name with (pro) prefix for PRO fields without access
  const formatDisplayName = () => {
    if (isPro && !canAccess) {
      return `(pro) ${displayName}`;
    }
    return displayName;
  };

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
      {formatDisplayName()}
      {isPro && canAccess && ' (PRO)'}
    </option>
  );
};

export default ProFieldOption;
