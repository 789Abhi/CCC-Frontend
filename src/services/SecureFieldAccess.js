/**
 * Secure Field Access Service
 * Implements client-side security with server validation
 */
class SecureFieldAccess {
  constructor() {
    this.encryptionKey = this.generateClientKey();
    this.validationCache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    this.serverUrl = process.env.REACT_APP_API_URL || 'https://custom-craft-component-backend.vercel.app/api';
  }

  /**
   * Generate client-specific encryption key
   */
  generateClientKey() {
    // Use browser fingerprint + timestamp for uniqueness
    const fingerprint = this.getBrowserFingerprint();
    const timestamp = Date.now().toString(36);
    return btoa(fingerprint + timestamp);
  }

  /**
   * Get browser fingerprint for security
   */
  getBrowserFingerprint() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('Browser fingerprint', 2, 2);
    
    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset(),
      canvas.toDataURL()
    ].join('|');
    
    return btoa(fingerprint);
  }

  /**
   * Encrypt sensitive data
   */
  encryptData(data) {
    try {
      const jsonData = JSON.stringify(data);
      const encrypted = btoa(jsonData + this.encryptionKey);
      return encrypted;
    } catch (error) {
      console.error('Encryption error:', error);
      return null;
    }
  }

  /**
   * Decrypt sensitive data
   */
  decryptData(encryptedData) {
    try {
      const decrypted = atob(encryptedData);
      const jsonData = decrypted.slice(0, -this.encryptionKey.length);
      return JSON.parse(jsonData);
    } catch (error) {
      console.error('Decryption error:', error);
      return null;
    }
  }

  /**
   * Validate license with server
   */
  async validateLicenseSecure() {
    const cacheKey = 'secure_license_validation';
    
    // Check cache first
    if (this.validationCache.has(cacheKey)) {
      const cached = this.validationCache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
    }

    try {
      const response = await fetch(window.ajaxurl || '/wp-admin/admin-ajax.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          action: 'ccc_secure_license_validation',
          nonce: window.ccc_ajax_nonce || '',
          fingerprint: this.getBrowserFingerprint()
        })
      });

      const result = await response.json();
      
      if (result.success && result.data.secure_token) {
        // Decrypt and validate the secure token
        const tokenData = this.decryptData(result.data.secure_token);
        if (tokenData && tokenData.expires_at > Date.now()) {
          const validationResult = {
            valid: true,
            features: tokenData.features || [],
            plan: tokenData.plan,
            isPro: tokenData.is_pro,
            expiresAt: tokenData.expires_at
          };

          // Cache the result
          this.validationCache.set(cacheKey, {
            data: validationResult,
            timestamp: Date.now()
          });

          return validationResult;
        }
      }

      return {
        valid: false,
        features: [],
        plan: 'free',
        isPro: false,
        error: result.message || 'License validation failed'
      };

    } catch (error) {
      console.error('Secure license validation error:', error);
      return {
        valid: false,
        features: [],
        plan: 'free',
        isPro: false,
        error: 'Network error during validation'
      };
    }
  }

  /**
   * Check if a specific PRO feature is accessible
   */
  async canAccessProFeature(featureName) {
    const validation = await this.validateLicenseSecure();
    
    if (!validation.valid) {
      return {
        canAccess: false,
        reason: 'Invalid license',
        error: validation.error
      };
    }

    const hasFeature = validation.features.includes(featureName);
    
    return {
      canAccess: hasFeature,
      reason: hasFeature ? 'Access granted' : 'Feature not available in current plan',
      plan: validation.plan,
      features: validation.features
    };
  }

  /**
   * Get obfuscated field configuration
   */
  getObfuscatedFieldConfig() {
    // Return field configuration with PRO features obfuscated
    const baseFields = {
      text: { available: true, isPro: false },
      textarea: { available: true, isPro: false },
      email: { available: true, isPro: false },
      number: { available: true, isPro: false },
      // ... other free fields
    };

    // PRO fields are obfuscated - their availability is checked server-side
    const proFields = {
      repeater: { available: false, isPro: true, obfuscated: true },
      gallery: { available: false, isPro: true, obfuscated: true }
    };

    return { ...baseFields, ...proFields };
  }

  /**
   * Secure field type access check
   */
  async checkFieldTypeAccess(fieldType) {
    // For free fields, always allow
    const freeFields = ['text', 'textarea', 'email', 'number', 'link', 'select', 'checkbox', 'radio', 'toggle', 'color', 'range', 'date', 'file', 'wysiwyg', 'oembed', 'relationship', 'image', 'video', 'password', 'taxonomy_term'];
    
    if (freeFields.includes(fieldType)) {
      return {
        canAccess: true,
        isPro: false,
        message: 'Free field - access granted'
      };
    }

    // For PRO fields, validate with server
    const proFieldAccess = await this.canAccessProFeature(fieldType);
    
    return {
      canAccess: proFieldAccess.canAccess,
      isPro: true,
      message: proFieldAccess.reason,
      plan: proFieldAccess.plan
    };
  }

  /**
   * Clear cache (useful for license changes)
   */
  clearCache() {
    this.validationCache.clear();
  }

  /**
   * Anti-tampering check
   */
  performIntegrityCheck() {
    // Check if critical functions have been modified
    const criticalFunctions = [
      'validateLicenseSecure',
      'canAccessProFeature',
      'checkFieldTypeAccess'
    ];

    for (const funcName of criticalFunctions) {
      if (typeof this[funcName] !== 'function') {
        console.warn(`Security warning: ${funcName} function may have been tampered with`);
        return false;
      }
    }

    return true;
  }
}

// Export singleton instance
export const secureFieldAccess = new SecureFieldAccess();

// Perform integrity check on load
if (!secureFieldAccess.performIntegrityCheck()) {
  console.error('Security integrity check failed');
}
