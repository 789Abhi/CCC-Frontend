import { useState, useEffect } from 'react';
import { secureFreeVersion } from '../services/SecureFreeVersion';

// Global field access service singleton
class FieldAccessService {
  constructor() {
    this.data = null;
    this.loading = false;
    this.error = null;
    this.listeners = new Set();
    this.cacheKey = 'ccc_field_access_data';
    this.cacheDuration = 5 * 60 * 1000; // 5 minutes
    this.debounceTimer = null;
    this.debounceDelay = 1000; // 1 second debounce
    this.lastLicenseKey = null;
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

  // Load field access data with secure validation
  async loadData() {
    const currentLicenseKey = window.cccData?.licenseKey || window.ccc_license_key || '';
    
    // Check if license key has changed - if so, clear cache immediately
    if (currentLicenseKey !== this.lastLicenseKey) {
      console.log('🔄 License key changed, clearing all caches');
      this.clearAllCaches();
      this.lastLicenseKey = currentLicenseKey;
    }
    
    // Return cached data if valid and license hasn't changed
    if (this.isCacheValid() && currentLicenseKey === this.lastLicenseKey) {
      console.log('📦 Using cached field access data');
      this.data = this.getCachedData();
      this.notifyListeners();
      return this.data;
    }

    console.log('🔄 Cache expired or missing - fetching fresh field access data');

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
      const siteUrl = window.location.origin || '';

      console.log('🔑 License Key Check:', {
        licenseKey: currentLicenseKey,
        licenseKeyLength: currentLicenseKey.length,
        cccDataExists: !!window.cccData,
        cccLicenseKeyExists: !!window.cccData?.licenseKey,
        fallbackLicenseExists: !!window.ccc_license_key
      });

      if (!currentLicenseKey) {
        // console.log('🚫 No license key found - using free version with disabled PRO fields');
        // No license key - return free version with disabled PRO fields
        this.data = {
          fieldTypes: this.getFreeVersionWithDisabledProFields(),
          paymentVerified: false,
          plan: 'free',
          isPro: false,
          licenseKey: currentLicenseKey // Store current license key
        };
        
        this.setCachedData(this.data);
        this.loading = false;
        this.notifyListeners();
        return this.data;
      }

      // console.log('🔑 License key found - validating...', currentLicenseKey);
      
      // Validate license with payment verification
      const validation = await secureFreeVersion.validateLicenseWithPayment(currentLicenseKey, siteUrl);
      
      if (validation.valid && validation.paymentVerified) {
        // Valid PRO license - load PRO fields
        const proFieldsResult = await secureFreeVersion.loadProFields(currentLicenseKey, siteUrl);
        
        if (proFieldsResult.success) {
          // Combine free and PRO fields
          const freeFields = secureFreeVersion.getAvailableFieldTypes();
          const proFields = proFieldsResult.fields;
          
          // console.log('🔄 Free fields:', Object.keys(freeFields));
          // console.log('🔄 PRO fields from result:', Object.keys(proFields));
          // console.log('🔄 Combined fields:', Object.keys({ ...freeFields, ...proFields }));
          
          this.data = {
            fieldTypes: { ...freeFields, ...proFields },
            paymentVerified: true,
            plan: validation.plan,
            isPro: validation.isPro,
            features: validation.features,
            secureToken: validation.secureToken,
            licenseKey: currentLicenseKey // Store current license key
          };
        } else {
          // PRO fields loading failed - fallback to free with disabled PRO fields
          this.data = {
            fieldTypes: this.getFreeVersionWithDisabledProFields(),
            paymentVerified: false,
            plan: 'free',
            isPro: false,
            error: proFieldsResult.error,
            licenseKey: currentLicenseKey
          };
        }
      } else {
        // Invalid license or network error - return free version with disabled PRO fields
        this.data = {
          fieldTypes: this.getFreeVersionWithDisabledProFields(),
          paymentVerified: false,
          plan: 'free',
          isPro: false,
          error: validation.error,
          fallbackToFree: validation.fallbackToFree || false,
          licenseKey: currentLicenseKey
        };
      }

      this.setCachedData(this.data);
      // console.log('Secure field access data loaded:', {
      //   fieldCount: Object.keys(this.data.fieldTypes).length,
      //   paymentVerified: this.data.paymentVerified,
      //   plan: this.data.plan,
      //   licenseKey: this.data.licenseKey
      // });

    } catch (err) {
      this.error = 'Error loading secure field access data: ' + err.message;
      console.error('Error loading secure field access data:', err);
      
      // Fallback to free version on error
      this.data = {
        fieldTypes: this.getFreeVersionWithDisabledProFields(),
        paymentVerified: false,
        plan: 'free',
        isPro: false,
        licenseKey: currentLicenseKey
      };
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

  // Force refresh field access data (useful when license changes)
  async refreshData() {
    console.log('🔄 Force refresh field access data requested');
    // Clear cache to force fresh data fetch
    localStorage.removeItem(this.cacheKey);
    this.data = null;
    this.loading = false;
    return this.loadData();
  }

  // Check if license key has changed and refresh if needed (with debouncing)
  checkLicenseChange() {
    const currentLicenseKey = window.cccData?.licenseKey || window.ccc_license_key || '';
    
    // Clear any existing debounce timer
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    
    // If license key hasn't changed, don't do anything
    if (currentLicenseKey === this.lastLicenseKey) {
      return false;
    }
    
    // console.log('🔍 License change detected:', {
    //   current: currentLicenseKey,
    //   previous: this.lastLicenseKey,
    //   changed: currentLicenseKey !== this.lastLicenseKey,
    //   currentLength: currentLicenseKey.length,
    //   previousLength: this.lastLicenseKey?.length || 0
    // });
    
    // If license key was removed (went from having a key to empty), clear immediately
    if (this.lastLicenseKey && this.lastLicenseKey.length > 0 && currentLicenseKey.length === 0) {
      // console.log('🚫 License key removed - immediately updating to free version with disabled PRO fields');
      this.clearAllCaches();
      this.lastLicenseKey = currentLicenseKey;
      // Force immediate update to free version with disabled PRO fields
      this.data = {
        fieldTypes: this.getFreeVersionWithDisabledProFields(),
        paymentVerified: false,
        plan: 'free',
        isPro: false,
        licenseKey: currentLicenseKey
      };
      this.setCachedData(this.data);
      this.notifyListeners();
      return true;
    }
    
    // Debounce the license change handling for adding/changing license
    this.debounceTimer = setTimeout(() => {
      // console.log('🔄 License key changed - clearing cache and refreshing');
      // Clear all caches immediately
      this.clearAllCaches();
      this.lastLicenseKey = currentLicenseKey;
      this.refreshData();
    }, this.debounceDelay);
    
    return true;
  }

  // Get free version with disabled PRO fields (shows PRO fields but disabled)
  getFreeVersionWithDisabledProFields() {
    const freeFields = secureFreeVersion.getAvailableFieldTypes();
    
    // Add PRO fields but mark them as disabled
    const proFields = {
      repeater: {
        name: 'Repeater',
        description: 'Repeatable field group',
        icon: '🔄',
        category: 'pro',
        order: 21,
        isPro: true,
        available: false, // Disabled
        requiredPlan: 'basic',
        disabled: true
      },
      gallery: {
        name: 'Gallery',
        description: 'Multiple image uploads',
        icon: '🖼️',
        category: 'pro',
        order: 22,
        isPro: true,
        available: false, // Disabled
        requiredPlan: 'basic',
        disabled: true
      }
    };
    
    return { ...freeFields, ...proFields };
  }

  // Clear all caches including validation cache
  clearAllCaches() {
    localStorage.removeItem(this.cacheKey);
    // Also clear the validation cache in SecureFreeVersion
    if (window.secureFreeVersion) {
      window.secureFreeVersion.clearCache();
    }
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

  // Start periodic license checking
  startLicenseMonitoring() {
    // Check for license changes every 2 seconds for more responsive updates
    this.licenseCheckInterval = setInterval(() => {
      this.checkLicenseChange();
    }, 2000);
  }

  // Manual license check (can be called from settings page)
  manualLicenseCheck() {
    // console.log('🔍 Manual license check triggered');
    // Force refresh the license data from WordPress
    this.refreshLicenseDataFromBackend();
    this.checkLicenseChange();
  }

  // Refresh license data from WordPress backend
  async refreshLicenseDataFromBackend() {
    try {
      // console.log('🔄 Refreshing license data from WordPress backend...');
      const response = await fetch(window.cccData?.ajaxUrl || '/wp-admin/admin-ajax.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          action: 'ccc_get_license_info',
          nonce: window.cccData?.nonce || ''
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data.license_key) {
          // Update the global cccData with the latest license key
          if (window.cccData) {
            window.cccData.licenseKey = data.data.license_key;
          }
          // console.log('✅ License data refreshed from backend:', data.data.license_key);
        }
      }
    } catch (error) {
      console.error('❌ Error refreshing license data from backend:', error);
    }
  }

  // Stop periodic license checking
  stopLicenseMonitoring() {
    if (this.licenseCheckInterval) {
      clearInterval(this.licenseCheckInterval);
      this.licenseCheckInterval = null;
    }
  }
}

// Global instance
const fieldAccessService = new FieldAccessService();

// Make it globally available for manual license checking
if (typeof window !== 'undefined') {
  window.cccFieldAccessService = fieldAccessService;
  
  // Add global method for manual license checking
  window.checkCCCLicense = () => {
    fieldAccessService.manualLicenseCheck();
  };
  
  window.addEventListener('beforeunload', () => {
    fieldAccessService.stopLicenseMonitoring();
  });
}

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

    // Start monitoring for license changes
    fieldAccessService.startLicenseMonitoring();

    return () => {
      unsubscribe();
      // Note: We don't stop monitoring here as other components might be using it
      // The monitoring will be stopped when the page unloads
    };
  }, []);

  const canAccessField = (fieldType) => {
    if (!fieldAccessData || !fieldAccessData.fieldTypes) {
      return { canAccess: true, isPro: false, message: 'Loading...' };
    }

    const fieldInfo = fieldAccessData.fieldTypes[fieldType];
    if (!fieldInfo) {
      return { canAccess: true, isPro: false, message: 'Field not found' };
    }

    // For PRO fields that are disabled, show them but mark as not accessible
    const isDisabled = fieldInfo.disabled || (fieldInfo.is_pro && !fieldInfo.available);
    
    return {
      canAccess: fieldInfo.available && !isDisabled,
      isPro: fieldInfo.is_pro,
      message: isDisabled ? 'PRO field - License required' : fieldInfo.message,
      requiredPlan: fieldInfo.required_plan,
      userPlan: fieldInfo.user_plan,
      name: fieldInfo.name,
      description: fieldInfo.description,
      icon: fieldInfo.icon,
      category: fieldInfo.category,
      order: fieldInfo.order,
      disabled: isDisabled
    };
  };

  const refreshFieldAccessData = () => {
    fieldAccessService.refresh();
  };

  const manualLicenseCheck = () => {
    fieldAccessService.manualLicenseCheck();
  };

  return {
    fieldAccessData,
    loading,
    error,
    canAccessField,
    refreshFieldAccessData,
    manualLicenseCheck
  };
};

// Export the service for direct access if needed
export { fieldAccessService };
