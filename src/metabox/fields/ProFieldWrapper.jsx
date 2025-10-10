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

      // If license server is down (>=500), fail-open to avoid breaking editor UX
      if (!response.ok && response.status >= 500) {
        setAccessCheck({
          canAccess: true,
          loading: false,
          message: 'Temporary license server outage - allowing editing',
          userPlan: 'unknown',
          requiredPlan: 'free'
        });
        onAccessChange(true);
        return;
      }

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
      // Network/CORS/timeout: fail-open so fields render in metabox
      setAccessCheck({
        canAccess: true,
        loading: false,
        message: 'Temporary connection issue - allowing editing',
        userPlan: 'unknown',
        requiredPlan: 'free'
      });
      onAccessChange(true);
    }
  };

  const renderProFieldDisabled = () => {
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
      <div className="ccc-field ccc-pro-field-disabled" data-field-type={fieldType}>
        <div className="ccc-field-header">
          <label className="ccc-field-label">
            {fieldName}
            <span className="ccc-pro-tag">PRO</span>
          </label>
          <div className="ccc-pro-overlay">
            <div className="ccc-pro-overlay-content">
              <div className="ccc-pro-icon">🔒</div>
              <p>This field requires a PRO license</p>
              <a href="#" className="ccc-upgrade-button">Upgrade Now</a>
            </div>
          </div>
        </div>
        <div className="ccc-field-content">
          {children}
        </div>
        
        <style jsx>{`
          .ccc-pro-field-disabled {
            position: relative;
            opacity: 0.5;
            pointer-events: none;
            border: 2px dashed #e5e7eb;
            border-radius: 8px;
            padding: 15px;
            margin: 10px 0;
            background: #f9fafb;
          }
          
          .ccc-field-header {
            position: relative;
            margin-bottom: 10px;
          }
          
          .ccc-field-label {
            font-weight: 600;
            color: #374151;
            display: flex;
            align-items: center;
            gap: 8px;
          }
          
          .ccc-pro-tag {
            background: linear-gradient(135deg, #ff6b6b, #ee5a24);
            color: white;
            font-size: 10px;
            font-weight: bold;
            padding: 2px 8px;
            border-radius: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            box-shadow: 0 2px 4px rgba(255, 107, 107, 0.3);
          }
          
          .ccc-pro-overlay {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(255, 255, 255, 0.9);
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 8px;
            backdrop-filter: blur(2px);
          }
          
          .ccc-pro-overlay-content {
            text-align: center;
            padding: 20px;
          }
          
          .ccc-pro-icon {
            font-size: 24px;
            margin-bottom: 8px;
          }
          
          .ccc-pro-overlay-content p {
            margin: 0 0 12px 0;
            color: #6b7280;
            font-size: 14px;
          }
          
          .ccc-upgrade-button {
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            padding: 8px 16px;
            border-radius: 6px;
            text-decoration: none;
            font-size: 12px;
            font-weight: 600;
            transition: all 0.3s ease;
            box-shadow: 0 2px 4px rgba(102, 126, 234, 0.3);
          }
          
          .ccc-upgrade-button:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 8px rgba(102, 126, 234, 0.4);
          }
          
          .ccc-field-content {
            opacity: 0.3;
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
    return renderProFieldDisabled();
  }

  return <>{children}</>;
};

export default ProFieldWrapper;
