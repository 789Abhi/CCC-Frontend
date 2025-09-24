import { useState, useEffect } from 'react';

// Global field access service singleton
class FieldAccessService {
  constructor() {
    this.data = null;
    this.loading = false;
    this.error = null;
    this.listeners = new Set();
    this.cacheKey = 'ccc_field_access_data';
    this.cacheDuration = 5 * 60 * 1000; // 5 minutes
  }

  // Check if cached data is still valid
  isCacheValid() {
    const cached = localStorage.getItem(this.cacheKey);
    if (!cached) return false;
    
    try {
      const { timestamp } = JSON.parse(cached);
      return Date.now() - timestamp < this.cacheDuration;
    } catch {
      return false;
    }
  }

  // Get cached data
  getCachedData() {
    const cached = localStorage.getItem(this.cacheKey);
    if (!cached) return null;
    
    try {
      const { data } = JSON.parse(cached);
      return data;
    } catch {
      return null;
    }
  }

  // Cache data
  setCachedData(data) {
    const cacheData = {
      data,
      timestamp: Date.now()
    };
    localStorage.setItem(this.cacheKey, JSON.stringify(cacheData));
  }

  // Load field access data
  async loadData() {
    // Return cached data if valid
    if (this.isCacheValid()) {
      this.data = this.getCachedData();
      this.notifyListeners();
      return this.data;
    }

    // If already loading, wait for it
    if (this.loading) {
      return new Promise((resolve) => {
        const checkLoading = () => {
          if (!this.loading) {
            resolve(this.data);
          } else {
            setTimeout(checkLoading, 50);
          }
        };
        checkLoading();
      });
    }

    this.loading = true;
    this.error = null;

    try {
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

      const result = await response.json();
      
      if (result.success) {
        this.data = result.data;
        this.setCachedData(this.data);
        console.log('Field access data loaded and cached:', this.data);
      } else {
        this.error = result.message || 'Failed to load field access data';
        console.error('Failed to load field access data:', result);
      }
    } catch (err) {
      this.error = 'Error loading field access data: ' + err.message;
      console.error('Error loading field access data:', err);
    } finally {
      this.loading = false;
      this.notifyListeners();
    }

    return this.data;
  }

  // Subscribe to data changes
  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // Notify all listeners
  notifyListeners() {
    this.listeners.forEach(listener => listener({
      data: this.data,
      loading: this.loading,
      error: this.error
    }));
  }

  // Clear cache and reload
  async refresh() {
    localStorage.removeItem(this.cacheKey);
    return this.loadData();
  }
}

// Global instance
const fieldAccessService = new FieldAccessService();

/**
 * Hook to fetch and manage field access data for PRO features
 */
export const useFieldAccess = () => {
  const [fieldAccessData, setFieldAccessData] = useState(fieldAccessService.data);
  const [loading, setLoading] = useState(fieldAccessService.loading);
  const [error, setError] = useState(fieldAccessService.error);

  useEffect(() => {
    // Subscribe to service updates
    const unsubscribe = fieldAccessService.subscribe(({ data, loading, error }) => {
      setFieldAccessData(data);
      setLoading(loading);
      setError(error);
    });

    // Load data if not already loaded
    if (!fieldAccessService.data && !fieldAccessService.loading) {
      fieldAccessService.loadData();
    }

    return unsubscribe;
  }, []);

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
      userPlan: fieldInfo.user_plan,
      name: fieldInfo.name,
      description: fieldInfo.description,
      icon: fieldInfo.icon,
      category: fieldInfo.category,
      order: fieldInfo.order
    };
  };

  const refreshFieldAccessData = () => {
    fieldAccessService.refresh();
  };

  return {
    fieldAccessData,
    loading,
    error,
    canAccessField,
    refreshFieldAccessData
  };
};

// Export the service for direct access if needed
export { fieldAccessService };
