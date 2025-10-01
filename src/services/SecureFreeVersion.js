/**
 * Secure Free Version Service
 * This version contains NO PRO code and requires server validation
 */
class SecureFreeVersion {
  constructor() {
    this.validationCache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    this.serverUrl = process.env.REACT_APP_API_URL || 'https://custom-craft-component-backend.vercel.app/api';
  }

  /**
   * Get available field types for free version
   * NO PRO FIELDS INCLUDED - they must be loaded from server
   */
  getAvailableFieldTypes() {
    // ONLY free fields - no PRO code embedded
    return {
      text: {
        name: 'Text Field',
        description: 'Single line text input',
        icon: '📝',
        category: 'basic',
        order: 1,
        isPro: false,
        available: true,
        requiredPlan: 'free'
      },
      textarea: {
        name: 'Textarea Field',
        description: 'Multi-line text input',
        icon: '📄',
        category: 'basic',
        order: 2,
        isPro: false,
        available: true,
        requiredPlan: 'free'
      },
      email: {
        name: 'Email Field',
        description: 'Email input with validation',
        icon: '📧',
        category: 'basic',
        order: 3,
        isPro: false,
        available: true,
        requiredPlan: 'free'
      },
      number: {
        name: 'Number Field',
        description: 'Numeric input',
        icon: '🔢',
        category: 'basic',
        order: 4,
        isPro: false,
        available: true,
        requiredPlan: 'free'
      },
      link: {
        name: 'Link Field',
        description: 'URL input',
        icon: '🔗',
        category: 'basic',
        order: 5,
        isPro: false,
        available: true,
        requiredPlan: 'free'
      },
      select: {
        name: 'Select Field',
        description: 'Dropdown selection',
        icon: '📋',
        category: 'basic',
        order: 6,
        isPro: false,
        available: true,
        requiredPlan: 'free'
      },
      checkbox: {
        name: 'Checkbox Field',
        description: 'Multiple checkbox options',
        icon: '☑️',
        category: 'basic',
        order: 7,
        isPro: false,
        available: true,
        requiredPlan: 'free'
      },
      radio: {
        name: 'Radio Field',
        description: 'Single choice options',
        icon: '🔘',
        category: 'basic',
        order: 8,
        isPro: false,
        available: true,
        requiredPlan: 'free'
      },
      toggle: {
        name: 'Toggle Field',
        description: 'On/off switch',
        icon: '🔄',
        category: 'basic',
        order: 9,
        isPro: false,
        available: true,
        requiredPlan: 'free'
      },
      color: {
        name: 'Color Field',
        description: 'Color picker',
        icon: '🎨',
        category: 'basic',
        order: 10,
        isPro: false,
        available: true,
        requiredPlan: 'free'
      },
      range: {
        name: 'Range Field',
        description: 'Slider input',
        icon: '📊',
        category: 'basic',
        order: 11,
        isPro: false,
        available: true,
        requiredPlan: 'free'
      },
      date: {
        name: 'Date Field',
        description: 'Date picker',
        icon: '📅',
        category: 'basic',
        order: 12,
        isPro: false,
        available: true,
        requiredPlan: 'free'
      },
      file: {
        name: 'File Field',
        description: 'File upload',
        icon: '📁',
        category: 'basic',
        order: 13,
        isPro: false,
        available: true,
        requiredPlan: 'free'
      },
      wysiwyg: {
        name: 'WYSIWYG Field',
        description: 'Rich text editor',
        icon: '✏️',
        category: 'advanced',
        order: 14,
        isPro: false,
        available: true,
        requiredPlan: 'free'
      },
      oembed: {
        name: 'OEmbed Field',
        description: 'Embed external content',
        icon: '🎬',
        category: 'advanced',
        order: 15,
        isPro: false,
        available: true,
        requiredPlan: 'free'
      },
      relationship: {
        name: 'Relationship Field',
        description: 'Link to other posts',
        icon: '🔗',
        category: 'advanced',
        order: 16,
        isPro: false,
        available: true,
        requiredPlan: 'free'
      },
      image: {
        name: 'Image Field',
        description: 'Single image upload',
        icon: '🖼️',
        category: 'media',
        order: 17,
        isPro: false,
        available: true,
        requiredPlan: 'free'
      },
      video: {
        name: 'Video Field',
        description: 'Video upload',
        icon: '🎥',
        category: 'media',
        order: 18,
        isPro: false,
        available: true,
        requiredPlan: 'free'
      },
      password: {
        name: 'Password Field',
        description: 'Password input',
        icon: '🔒',
        category: 'basic',
        order: 19,
        isPro: false,
        available: true,
        requiredPlan: 'free'
      },
      taxonomy_term: {
        name: 'Taxonomy Term Field',
        description: 'Select taxonomy terms',
        icon: '🏷️',
        category: 'advanced',
        order: 20,
        isPro: false,
        available: true,
        requiredPlan: 'free'
      }
    };
  }

  /**
   * Validate license with payment verification
   */
  async validateLicenseWithPayment(licenseKey, siteUrl) {
    const cacheKey = `license_${licenseKey}_${siteUrl}`;
    
    // Check cache first
    if (this.validationCache.has(cacheKey)) {
      const cached = this.validationCache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
    }

    try {
      const response = await fetch(`${this.serverUrl}/pro-features/payment-verified`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          licenseKey,
          siteUrl,
          siteName: document.title || 'Unknown Site'
        })
      });

      const result = await response.json();
      
      if (result.success && result.data.paymentVerified) {
        const validationResult = {
          valid: true,
          features: result.data.features || [],
          plan: result.data.plan,
          isPro: result.data.isPro,
          paymentVerified: true,
          secureToken: result.data.secureToken
        };

        // Cache the result
        this.validationCache.set(cacheKey, {
          data: validationResult,
          timestamp: Date.now()
        });

        return validationResult;
      }

      return {
        valid: false,
        features: [],
        plan: 'free',
        isPro: false,
        paymentVerified: false,
        error: result.message || 'License validation failed'
      };

    } catch (error) {
      console.error('License validation error:', error);
      return {
        valid: false,
        features: [],
        plan: 'free',
        isPro: false,
        paymentVerified: false,
        error: 'Network error during validation'
      };
    }
  }

  /**
   * Load PRO fields dynamically from server (only if license is valid)
   */
  async loadProFields(licenseKey, siteUrl) {
    const validation = await this.validateLicenseWithPayment(licenseKey, siteUrl);
    
    if (!validation.valid || !validation.paymentVerified) {
      return {
        success: false,
        fields: {},
        error: 'Valid PRO license required to load PRO fields'
      };
    }

    try {
      const response = await fetch(`${this.serverUrl}/pro-features/load-fields`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          licenseKey,
          siteUrl,
          secureToken: validation.secureToken
        })
      });

      const result = await response.json();
      
      if (result.success) {
        return {
          success: true,
          fields: result.data.fields,
          features: result.data.features
        };
      }

      return {
        success: false,
        fields: {},
        error: result.message || 'Failed to load PRO fields'
      };

    } catch (error) {
      console.error('PRO fields loading error:', error);
      return {
        success: false,
        fields: {},
        error: 'Network error loading PRO fields'
      };
    }
  }

  /**
   * Check if user can access a specific field type
   */
  async canAccessFieldType(fieldType, licenseKey, siteUrl) {
    // Free fields are always accessible
    const freeFields = Object.keys(this.getAvailableFieldTypes());
    if (freeFields.includes(fieldType)) {
      return {
        canAccess: true,
        isPro: false,
        message: 'Free field - access granted'
      };
    }

    // PRO fields require server validation
    const validation = await this.validateLicenseWithPayment(licenseKey, siteUrl);
    
    if (!validation.valid || !validation.paymentVerified) {
      return {
        canAccess: false,
        isPro: true,
        message: 'Valid PRO license required',
        error: validation.error
      };
    }

    const hasFeature = validation.features.includes(fieldType);
    
    return {
      canAccess: hasFeature,
      isPro: true,
      message: hasFeature ? 'PRO feature access granted' : 'Feature not available in your plan',
      plan: validation.plan
    };
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.validationCache.clear();
  }
}

// Export singleton instance
export const secureFreeVersion = new SecureFreeVersion();
