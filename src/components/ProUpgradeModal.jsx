import React from 'react';
import { X, Lock, Star } from 'lucide-react';

/**
 * PRO Upgrade Modal Component
 * Shows upgrade information for PRO fields
 */
const ProUpgradeModal = ({ 
  isOpen, 
  onClose, 
  fieldType, 
  requiredPlan, 
  userPlan 
}) => {
  if (!isOpen) return null;

  const fieldLabels = {
    'repeater': 'Repeater Field',
    'gallery': 'Gallery Field',
    'date_range': 'Date Range Field',
    'time_range': 'Time Range Field',
    'ai_generator': 'AI Component Generator',
    'conditional_logic': 'Conditional Logic',
    'custom_validation': 'Custom Validation',
    'api_integration': 'API Integration',
    'field_structure': 'View Field Structure'
  };

  const fieldName = fieldLabels[fieldType] || fieldType.charAt(0).toUpperCase() + fieldType.slice(1);


  const handleUpgradeClick = () => {
    // Open upgrade page
    window.open('https://www.customcraftcomponents.com/pricing', '_blank');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <Lock className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Upgrade Required</h3>
              <p className="text-sm text-gray-500">Unlock PRO features</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="text-center mb-6">
            <div className="h-16 w-16 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Star className="h-8 w-8 text-purple-600" />
            </div>
            <h4 className="text-xl font-semibold text-gray-900 mb-2">
              {fieldName}
            </h4>
            <p className="text-gray-600 mb-4">
              This field requires a <span className="font-semibold text-purple-600">{requiredPlan}</span> plan or higher.
              {userPlan !== 'free' && (
                <span className="block text-sm text-gray-500 mt-1">
                  Your current plan: <span className="font-medium">{userPlan}</span>
                </span>
              )}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Maybe Later
            </button>
            <button
              onClick={handleUpgradeClick}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all font-medium shadow-lg hover:shadow-xl"
            >
              Upgrade Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProUpgradeModal;
