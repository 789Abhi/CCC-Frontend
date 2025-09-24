import React, { useState, useEffect } from 'react';

/**
 * PRO Field Access Wrapper Component
 * Wraps field components to check PRO access and show upgrade notices
 */
const ProFieldWrapper = ({ 
  fieldType, 
  fieldLabel, 
  children, 
  licenseKey = '', 
  apiUrl = 'https://custom-craft-component-backend.vercel.app/api/pro-features/check',
  onAccessChange = () => {}
}) => {
  const [accessCheck, setAccessCheck] = useState({
    canAccess: false,
    loading: true,
    message: '',
    userPlan: 'free',
    requiredPlan: 'free'
  });

  useEffect(() => {
    checkFieldAccess();
  }, [fieldType, licenseKey]);

  const checkFieldAccess = async () => {
    if (!licenseKey) {
      setAccessCheck({
        canAccess: false,
        loading: false,
        message: 'No license key found. This field requires a PRO license.',
        userPlan: 'free',
        requiredPlan: 'free'
      });
      onAccessChange(false);
      return;
    }

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          licenseKey: licenseKey,
          siteUrl: window.location.origin,
          siteName: document.title
        })
      });

      const data = await response.json();

      if (data.success && data.proFeatures) {
        const fieldTypes = data.proFeatures.fieldTypes;
        
        if (fieldTypes[fieldType]) {
          const fieldAvailability = fieldTypes[fieldType];
          
          setAccessCheck({
            canAccess: fieldAvailability.available,
            loading: false,
            message: fieldAvailability.available ? 'Access granted' : `This field requires a ${fieldAvailability.requiredPlan} plan or higher`,
            userPlan: data.license.plan,
            requiredPlan: fieldAvailability.requiredPlan
          });
          
          onAccessChange(fieldAvailability.available);
        } else {
          // Field not found in PRO features, assume it's free
          setAccessCheck({
            canAccess: true,
            loading: false,
            message: 'Field is available',
            userPlan: data.license.plan,
            requiredPlan: 'free'
          });
          onAccessChange(true);
        }
      } else {
        setAccessCheck({
          canAccess: false,
          loading: false,
          message: data.message || 'License validation failed',
          userPlan: 'free',
          requiredPlan: 'free'
        });
        onAccessChange(false);
      }
    } catch (error) {
      console.error('Error checking field access:', error);
      setAccessCheck({
        canAccess: false,
        loading: false,
        message: 'Connection error: ' + error.message,
        userPlan: 'free',
        requiredPlan: 'free'
      });
      onAccessChange(false);
    }
  };

  const renderProUpgradeNotice = () => {
    const fieldNames = {
      'repeater': 'Repeater Field',
      'gallery': 'Gallery Field',
      'date_range': 'Date Range Field',
      'time_range': 'Time Range Field',
      'ai_generator': 'AI Component Generator',
      'conditional_logic': 'Conditional Logic',
      'custom_validation': 'Custom Validation',
      'api_integration': 'API Integration'
    };

    const fieldName = fieldLabel || fieldNames[fieldType] || fieldType.charAt(0).toUpperCase() + fieldType.slice(1);

    return (
      <div className="ccc-pro-field-notice">
        <div className="ccc-pro-badge">PRO</div>
        <h4>{fieldName}</h4>
        <p>This field requires a PRO license. <a href="#" className="ccc-upgrade-link">Upgrade now</a></p>
        
        <style jsx>{`
          .ccc-pro-field-notice {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border: 2px solid #667eea;
            border-radius: 12px;
            padding: 20px;
            margin: 15px 0;
            text-align: center;
            position: relative;
            overflow: hidden;
          }
          
          .ccc-pro-field-notice::before {
            content: '';
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: linear-gradient(45deg, transparent, rgba(255,255,255,0.1), transparent);
            animation: shimmer 2s infinite;
          }
          
          @keyframes shimmer {
            0% { transform: translateX(-100%) translateY(-100%) rotate(45deg); }
            100% { transform: translateX(100%) translateY(100%) rotate(45deg); }
          }
          
          .ccc-pro-badge {
            background: #ff6b6b;
            color: white;
            font-weight: bold;
            font-size: 12px;
            padding: 4px 12px;
            border-radius: 20px;
            display: inline-block;
            margin-bottom: 10px;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          
          .ccc-pro-field-notice h4 {
            color: white;
            margin: 0 0 10px 0;
            font-size: 18px;
            font-weight: 600;
          }
          
          .ccc-pro-field-notice p {
            color: rgba(255, 255, 255, 0.9);
            margin: 0;
            font-size: 14px;
          }
          
          .ccc-upgrade-link {
            color: #ffd93d;
            text-decoration: none;
            font-weight: bold;
            border-bottom: 1px solid #ffd93d;
            transition: all 0.3s ease;
          }
          
          .ccc-upgrade-link:hover {
            color: white;
            border-bottom-color: white;
          }
        `}</style>
      </div>
    );
  };

  if (accessCheck.loading) {
    return (
      <div className="ccc-field-loading">
        <div className="animate-pulse bg-gray-200 h-8 rounded"></div>
        <p className="text-sm text-gray-500 mt-2">Checking field access...</p>
      </div>
    );
  }

  if (!accessCheck.canAccess) {
    return renderProUpgradeNotice();
  }

  return <>{children}</>;
};

export default ProFieldWrapper;
