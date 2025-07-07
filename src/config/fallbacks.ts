/**
 * Centralized fallback values for the mobile phone comparison application
 * 
 * This file contains all default values used throughout the application
 * when CMS content is not available or fails to load.
 */

export const FALLBACK_CONFIG = {
  // Navigation URLs
  NAVIGATION: {
    COMPARE_URL: '/compare',
    BROWSE_URL: '/browse',
    EMPTY_LINK: '#',
  },

  // Phone Information
  PHONES: {
    DEFAULT_PHONE_1: 'iPhone 16 Pro',
    DEFAULT_PHONE_2: 'Google Pixel 9 Pro',
    PHONE_ICON: '📱',
    VS_TEXT: 'VS',
    PLACEHOLDER_EMOJI: '📱',
  },

  // Specifications
  SPECIFICATIONS: {
    CAMERA_LABEL: 'Camera',
    BATTERY_LABEL: 'Battery',
    PRICE_LABEL: 'Price',
    CAMERA_PHONE_1: '48MP',
    CAMERA_PHONE_2: '50MP',
    BATTERY_PHONE_1: '3274mAh',
    BATTERY_PHONE_2: '4700mAh',
    PRICE_PHONE_1: '₹1,34,900',
    PRICE_PHONE_2: '₹1,05,999',
  },

  // UI Text
  TEXT: {
    VIEW_ALL_COMPARISONS: 'View All Comparisons',
    COMPARE_NOW: 'Compare Now',
    UNNAMED_ITEM: 'Unnamed Item',
  },

  // Badge Text
  BADGES: {
    TRENDING: '🔥 Trending',
    HOT: '🌟 Hot',
    POPULAR: '📈 Popular',
  },

  // Shopping Icons
  SHOPPING: {
    CART_ICON: '🛒',
    SHOPPING_ICON: '🛍️',
  },

  // Environment Variables
  ENVIRONMENT: {
    DEFAULT_MOBILE_UID: 'bltffc3e218b0c94c4a',
  },

  // Error Messages
  ERRORS: {
    LOADING_FAILED: 'Failed to load content',
    CONTENT_NOT_FOUND: 'Content not found',
    NAVIGATION_UNAVAILABLE: 'Navigation temporarily unavailable',
  },

  // Loading States
  LOADING: {
    HOME_PAGE_CONTENT: 'Loading home page content...',
    PHONE_DETAILS: 'Loading phone details...',
    COMPARISON_DATA: 'Loading comparison data...',
  },
} as const;

/**
 * Type-safe helper functions for accessing fallback values
 */
export class FallbackHelper {
  /**
   * Get navigation URL with fallback
   */
  static getNavigationUrl(url: string | undefined, fallbackKey: keyof typeof FALLBACK_CONFIG.NAVIGATION): string {
    return url || FALLBACK_CONFIG.NAVIGATION[fallbackKey];
  }

  /**
   * Get phone information with fallback
   */
  static getPhoneInfo(value: string | undefined, fallbackKey: keyof typeof FALLBACK_CONFIG.PHONES): string {
    return value || FALLBACK_CONFIG.PHONES[fallbackKey];
  }

  /**
   * Get specification with fallback
   */
  static getSpecification(value: string | undefined, fallbackKey: keyof typeof FALLBACK_CONFIG.SPECIFICATIONS): string {
    return value || FALLBACK_CONFIG.SPECIFICATIONS[fallbackKey];
  }

  /**
   * Get UI text with fallback
   */
  static getText(value: string | undefined, fallbackKey: keyof typeof FALLBACK_CONFIG.TEXT): string {
    return value || FALLBACK_CONFIG.TEXT[fallbackKey];
  }

  /**
   * Get badge text with fallback
   */
  static getBadgeText(value: string | undefined, fallbackKey: keyof typeof FALLBACK_CONFIG.BADGES): string {
    return value || FALLBACK_CONFIG.BADGES[fallbackKey];
  }

  /**
   * Get shopping icon with fallback
   */
  static getShoppingIcon(value: string | undefined, fallbackKey: keyof typeof FALLBACK_CONFIG.SHOPPING): string {
    return value || FALLBACK_CONFIG.SHOPPING[fallbackKey];
  }
}

/**
 * Commonly used fallback combinations
 */
export const COMMON_FALLBACKS = {
  PHONE_COMPARISON: {
    phone1Name: FALLBACK_CONFIG.PHONES.DEFAULT_PHONE_1,
    phone2Name: FALLBACK_CONFIG.PHONES.DEFAULT_PHONE_2,
    phoneIcon: FALLBACK_CONFIG.PHONES.PHONE_ICON,
    vsText: FALLBACK_CONFIG.PHONES.VS_TEXT,
  },
  
  BADGE_MAPPING: {
    trending: FALLBACK_CONFIG.BADGES.TRENDING,
    hot: FALLBACK_CONFIG.BADGES.HOT,
    popular: FALLBACK_CONFIG.BADGES.POPULAR,
  },
  
  SPECIFICATION_DEFAULTS: {
    camera: {
      label: FALLBACK_CONFIG.SPECIFICATIONS.CAMERA_LABEL,
      phone1: FALLBACK_CONFIG.SPECIFICATIONS.CAMERA_PHONE_1,
      phone2: FALLBACK_CONFIG.SPECIFICATIONS.CAMERA_PHONE_2,
    },
    battery: {
      label: FALLBACK_CONFIG.SPECIFICATIONS.BATTERY_LABEL,
      phone1: FALLBACK_CONFIG.SPECIFICATIONS.BATTERY_PHONE_1,
      phone2: FALLBACK_CONFIG.SPECIFICATIONS.BATTERY_PHONE_2,
    },
    price: {
      label: FALLBACK_CONFIG.SPECIFICATIONS.PRICE_LABEL,
      phone1: FALLBACK_CONFIG.SPECIFICATIONS.PRICE_PHONE_1,
      phone2: FALLBACK_CONFIG.SPECIFICATIONS.PRICE_PHONE_2,
    },
  },
};