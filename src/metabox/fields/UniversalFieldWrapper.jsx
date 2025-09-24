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
  const [accessCheck, setAccessCheck] = useState({
    loading: true,
    canAccess: false,
    message: '',
    userPlan: 'free',
    requiredPlan: 'free'
  });

  useEffect(() => {
    if (licenseKey) {
      fetchLicenseAndProFeatures();
    } else {
      // No license key, check if field is free
      checkFieldAccess();
    }
  }, [licenseKey, fieldType]);

  const checkFieldAccess = async () => {
    try {
      // First check field configuration to see if it's free
      const configResponse = await fetch('https://custom-craft-component-backend.vercel.app/api/pro-features/config');
      const configData = await configResponse.json();
      
      if (configData.success && configData.fieldTypes) {
        const fieldConfig = configData.fieldTypes[fieldType];
        
        if (fieldConfig && !fieldConfig.isPro) {
          setAccessCheck({
            loading: false,
            canAccess: true,
            message: 'Field is available',
            userPlan: 'free',
            requiredPlan: 'free'
          });
        } else {
          setAccessCheck({
            loading: false,
            canAccess: false,
            message: 'No license key found. This field requires a PRO license.',
            userPlan: 'free',
            requiredPlan: fieldConfig?.requiredPlan || 'free'
          });
        }
      } else {
        setAccessCheck({
          loading: false,
          canAccess: false,
          message: 'Failed to check field configuration',
          userPlan: 'free',
          requiredPlan: 'free'
        });
      }
    } catch (error) {
      console.error('Error checking field configuration:', error);
      setAccessCheck({
        loading: false,
        canAccess: false,
        message: 'Failed to check field configuration',
        userPlan: 'free',
        requiredPlan: 'free'
      });
    }
  };

  const fetchLicenseAndProFeatures = async () => {
    try {
      setAccessCheck({ loading: true, canAccess: false, message: '' });
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          licenseKey: licenseKey,
          siteUrl: window.location.origin,
          siteName: document.title || 'WordPress Site'
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success && data.proFeatures) {
        const fieldConfig = data.proFeatures.fieldTypes[fieldType];
        
        if (fieldConfig && fieldConfig.available) {
          setAccessCheck({
            loading: false,
            canAccess: true,
            message: 'Access granted',
            userPlan: data.proFeatures.license?.plan || 'free',
            requiredPlan: fieldConfig.requiredPlan || 'free'
          });
        } else {
          setAccessCheck({
            loading: false,
            canAccess: false,
            message: `This field requires a ${fieldConfig?.requiredPlan || 'PRO'} plan or higher`,
            userPlan: data.proFeatures.license?.plan || 'free',
            requiredPlan: fieldConfig?.requiredPlan || 'free'
          });
        }
      } else {
        setAccessCheck({
          loading: false,
          canAccess: false,
          message: data.message || 'Failed to check PRO features',
          userPlan: 'free',
          requiredPlan: 'free'
        });
      }
    } catch (error) {
      console.error('Error checking PRO features:', error);
      setAccessCheck({
        loading: false,
        canAccess: false,
        message: 'Failed to check PRO features',
        userPlan: 'free',
        requiredPlan: 'free'
      });
    }
  };

  const renderProFieldDisabled = () => {
    const fieldNames = {
      'text': 'Text Field',
      'textarea': 'Text Area Field',
      'image': 'Image Field',
      'video': 'Video Field',
      'oembed': 'O-Embed Field',
      'relationship': 'Relationship Field',
      'link': 'Link Field',
      'email': 'Email Field',
      'number': 'Number Field',
      'range': 'Range Field',
      'file': 'File Field',
      'repeater': 'Repeater Field',
      'wysiwyg': 'WYSIWYG Editor',
      'color': 'Color Field',
      'select': 'Select Field',
      'checkbox': 'Checkbox Field',
      'radio': 'Radio Field',
      'toggle': 'Toggle Field',
      'gallery': 'Gallery Field',
      'date': 'Date Field',
      'date_range': 'Date Range Field',
      'datetime': 'Date Time Field',
      'time': 'Time Field',
      'time_range': 'Time Range Field',
      'ai_generator': 'AI Component Generator',
      'conditional_logic': 'Conditional Logic',
      'custom_validation': 'Custom Validation',
      'api_integration': 'API Integration',
      'password': 'Password Field',
      'user': 'User Field',
      'taxonomy_term': 'Taxonomy Term Field'
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
        <div className="ccc-loading-spinner"></div>
        <p>Checking field access...</p>
        <style jsx>{`
          .ccc-field-loading {
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 20px;
            color: #6b7280;
          }
          .ccc-loading-spinner {
            width: 20px;
            height: 20px;
            border: 2px solid #e5e7eb;
            border-top: 2px solid #3b82f6;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-bottom: 10px;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (!accessCheck.canAccess) {
    return renderProFieldDisabled();
  }

  return <>{children}</>;
};

export default UniversalFieldWrapper;
