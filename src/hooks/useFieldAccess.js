import { useState, useEffect } from 'react';

/**
 * Hook to fetch and manage field access data for PRO features
 */
export const useFieldAccess = () => {
  const [fieldAccessData, setFieldAccessData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchFieldAccessData();
  }, []);

  const fetchFieldAccessData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(window.ajaxurl || '/wp-admin/admin-ajax.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          action: 'ccc_get_field_access_data',
          nonce: window.ccc_ajax_nonce || ''
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setFieldAccessData(data.data);
        console.log('Field access data loaded:', data.data);
      } else {
        setError(data.message || 'Failed to load field access data');
        console.error('Failed to load field access data:', data);
      }
    } catch (err) {
      setError('Error loading field access data: ' + err.message);
      console.error('Error loading field access data:', err);
    } finally {
      setLoading(false);
    }
  };

  const canAccessField = (fieldType) => {
    if (!fieldAccessData || !fieldAccessData.fieldTypes) {
      return { canAccess: true, isPro: false, message: 'Loading...' };
    }

    const fieldInfo = fieldAccessData.fieldTypes[fieldType];
    if (!fieldInfo) {
      return { canAccess: true, isPro: false, message: 'Field not found' };
    }

    return {
      canAccess: fieldInfo.available,
      isPro: fieldInfo.is_pro,
      message: fieldInfo.message,
      requiredPlan: fieldInfo.required_plan,
      userPlan: fieldInfo.user_plan
    };
  };

  const refreshFieldAccessData = () => {
    fetchFieldAccessData();
  };

  return {
    fieldAccessData,
    loading,
    error,
    canAccessField,
    refreshFieldAccessData
  };
};
