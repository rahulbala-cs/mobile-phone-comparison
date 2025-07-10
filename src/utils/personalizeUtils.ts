/**
 * Contentstack Personalize Utilities
 * 
 * Utility functions for personalization functionality
 */

import { PersonalizeConfig, PersonalizeError, UserAttributes, EventData } from '../types/Personalize';

// Environment configuration
export const getPersonalizeConfig = (): PersonalizeConfig => {
  const projectUid = process.env.REACT_APP_CONTENTSTACK_PERSONALIZE_PROJECT_UID;
  const edgeApiUrl = process.env.REACT_APP_CONTENTSTACK_PERSONALIZE_EDGE_API_URL;
  const environment = process.env.REACT_APP_CONTENTSTACK_ENVIRONMENT || 'production';
  
  if (!projectUid) {
    throw new Error('REACT_APP_CONTENTSTACK_PERSONALIZE_PROJECT_UID is required');
  }
  
  return {
    projectUid,
    edgeApiUrl,
    environment,
    enableLogging: process.env.NODE_ENV === 'development',
    fallbackContent: true,
    cookieOptions: {
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    },
  };
};

// Check if personalization is enabled
export const isPersonalizationEnabled = (): boolean => {
  try {
    const config = getPersonalizeConfig();
    return !!config.projectUid;
  } catch {
    return false;
  }
};

// CRITICAL: Add comprehensive personalization validation
export const validatePersonalizationSetup = (): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} => {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Check required environment variables
  const projectUid = process.env.REACT_APP_CONTENTSTACK_PERSONALIZE_PROJECT_UID;
  if (!projectUid) {
    errors.push('REACT_APP_CONTENTSTACK_PERSONALIZE_PROJECT_UID is required for personalization');
  }
  
  // Check optional but recommended variables
  const edgeApiUrl = process.env.REACT_APP_CONTENTSTACK_PERSONALIZE_EDGE_API_URL;
  if (!edgeApiUrl) {
    warnings.push('REACT_APP_CONTENTSTACK_PERSONALIZE_EDGE_API_URL not set, using default');
  }
  
  // Check Contentstack configuration
  const apiKey = process.env.REACT_APP_CONTENTSTACK_API_KEY;
  const deliveryToken = process.env.REACT_APP_CONTENTSTACK_DELIVERY_TOKEN;
  const environment = process.env.REACT_APP_CONTENTSTACK_ENVIRONMENT;
  
  if (!apiKey) {
    errors.push('REACT_APP_CONTENTSTACK_API_KEY is required for content delivery');
  }
  if (!deliveryToken) {
    errors.push('REACT_APP_CONTENTSTACK_DELIVERY_TOKEN is required for content delivery');
  }
  if (!environment) {
    warnings.push('REACT_APP_CONTENTSTACK_ENVIRONMENT not set, using default');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

// Add SDK initialization status check
export const checkPersonalizationStatus = async (): Promise<{
  isInitialized: boolean;
  hasExperiences: boolean;
  hasVariants: boolean;
  experienceCount: number;
  variantCount: number;
  error?: string;
}> => {
  try {
    // Try to import SDK
    const Personalize = require('@contentstack/personalize-edge-sdk');
    
    // Check initialization status
    const initStatus = Personalize.getInitializationStatus ? Personalize.getInitializationStatus() : false;
    
    if (!initStatus) {
      return {
        isInitialized: false,
        hasExperiences: false,
        hasVariants: false,
        experienceCount: 0,
        variantCount: 0,
        error: 'SDK not initialized'
      };
    }
    
    // If we have an initialized SDK instance, we would need to access it
    // This is a placeholder for when the SDK is actually initialized
    return {
      isInitialized: true,
      hasExperiences: false,
      hasVariants: false,
      experienceCount: 0,
      variantCount: 0
    };
    
  } catch (error: any) {
    return {
      isInitialized: false,
      hasExperiences: false,
      hasVariants: false,
      experienceCount: 0,
      variantCount: 0,
      error: `SDK error: ${error?.message || 'Unknown error'}`
    };
  }
};

// URL parameter handling - using SDK constant
export const getVariantParamFromUrl = (): string | null => {
  if (typeof window === 'undefined') return null;
  
  try {
    // Import SDK to access the constant
    const Personalize = require('@contentstack/personalize-edge-sdk');
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(Personalize.VARIANT_QUERY_PARAM) || null;
  } catch (error) {
    // Fallback to hardcoded parameter name if SDK is not available
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('cs_personalize_variant') || null;
  }
};

export const updateUrlWithVariantParam = (variantParam: string): void => {
  if (typeof window === 'undefined') return;
  
  try {
    // Import SDK to access the constant
    const Personalize = require('@contentstack/personalize-edge-sdk');
    const url = new URL(window.location.href);
    url.searchParams.set(Personalize.VARIANT_QUERY_PARAM, variantParam);
    
    // Update URL without page reload
    window.history.replaceState({}, '', url.toString());
  } catch (error) {
    // Fallback to hardcoded parameter name if SDK is not available
    const url = new URL(window.location.href);
    url.searchParams.set('cs_personalize_variant', variantParam);
    
    // Update URL without page reload
    window.history.replaceState({}, '', url.toString());
  }
};

// User attribute utilities
export const sanitizeUserAttributes = (attributes: Record<string, any>): UserAttributes => {
  const sanitized: UserAttributes = {};
  
  // Only include valid attribute types
  for (const [key, value] of Object.entries(attributes)) {
    if (value !== undefined && value !== null) {
      // Convert to appropriate types
      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        sanitized[key] = value;
      } else if (Array.isArray(value)) {
        sanitized[key] = value;
      } else if (typeof value === 'object') {
        sanitized[key] = JSON.stringify(value);
      }
    }
  }
  
  return sanitized;
};

// Create user attributes from phone interaction
export const createUserAttributesFromPhoneInteraction = (
  phoneData: {
    uid: string;
    title: string;
    brand?: string;
    price?: number;
  }
): UserAttributes => {
  const attributes: UserAttributes = {};
  
  if (phoneData.brand) {
    attributes.preferredBrand = phoneData.brand.toLowerCase();
  }
  
  if (phoneData.price) {
    if (phoneData.price < 300) {
      attributes.priceRange = 'budget';
    } else if (phoneData.price < 800) {
      attributes.priceRange = 'mid-range';
    } else {
      attributes.priceRange = 'premium';
    }
  }
  
  // Update visit tracking
  const now = new Date().toISOString();
  attributes.lastVisit = now;
  attributes.pagesViewed = (attributes.pagesViewed || 0) + 1;
  
  return attributes;
};

// Event data utilities
export const createPageViewEvent = (
  pagePath: string,
  pageTitle: string,
  referrer?: string
): EventData => ({
  page_view: {
    page_path: pagePath,
    page_title: pageTitle,
    referrer: referrer || document.referrer,
  },
});

export const createPhoneViewEvent = (phoneData: {
  uid: string;
  title: string;
  brand?: string;
  price?: number;
}): EventData => ({
  phone_view: {
    phone_uid: phoneData.uid,
    phone_title: phoneData.title,
    phone_brand: phoneData.brand || 'Unknown',
    phone_price: phoneData.price,
  },
});

export const createComparisonEvent = (
  phoneUids: string[],
  eventType: 'started' | 'completed',
  duration?: number
): EventData => {
  const baseEvent = {
    phone_uids: phoneUids,
    comparison_type: 'side-by-side' as const,
  };
  
  if (eventType === 'started') {
    return { comparison_started: baseEvent };
  } else {
    return {
      comparison_completed: {
        ...baseEvent,
        duration: duration || 0,
      },
    };
  }
};

export const createSearchEvent = (
  query: string,
  filters: Record<string, any>,
  resultsCount: number
): EventData => ({
  search_performed: {
    query,
    filters,
    results_count: resultsCount,
  },
});

// Error handling utilities
export const createPersonalizeError = (
  code: string,
  message: string,
  details?: Record<string, any>
): PersonalizeError => ({
  code,
  message,
  details,
});

export const isPersonalizeError = (error: any): error is PersonalizeError => {
  return error && typeof error.code === 'string' && typeof error.message === 'string';
};

// Logging utilities
export const logPersonalizeEvent = (
  eventName: string,
  data: Record<string, any>,
  level: 'info' | 'warn' | 'error' = 'info'
): void => {
  if (process.env.NODE_ENV !== 'development') return;
  
  const message = `[Personalize] ${eventName}`;
  const logData = { ...data, timestamp: new Date().toISOString() };
  
  switch (level) {
    case 'info':
      console.log(message, logData);
      break;
    case 'warn':
      console.warn(message, logData);
      break;
    case 'error':
      console.error(message, logData);
      break;
  }
};

// Content personalization utilities
export const shouldPersonalizeContent = (
  contentType: string,
  enabledContentTypes: string[] = ['home_page', 'mobiles', 'navigation_menu']
): boolean => {
  return enabledContentTypes.includes(contentType);
};

export const extractPersonalizationMetadata = (content: any): {
  experienceUid?: string;
  variantUid?: string;
  isPersonalized: boolean;
} => {
  // Extract personalization metadata from content
  const personalizationData = content?._metadata?.personalization || {};
  
  return {
    experienceUid: personalizationData.experience_uid,
    variantUid: personalizationData.variant_uid,
    isPersonalized: !!(personalizationData.experience_uid && personalizationData.variant_uid),
  };
};

// Cookie and storage utilities
export const getPersonalizeStorageKey = (key: string): string => {
  return `cs_personalize_${key}`;
};

export const setPersonalizeStorage = (key: string, value: any): void => {
  try {
    const storageKey = getPersonalizeStorageKey(key);
    localStorage.setItem(storageKey, JSON.stringify(value));
  } catch (error) {
    console.warn('Failed to set personalize storage:', error);
  }
};

export const getPersonalizeStorage = (key: string): any => {
  try {
    const storageKey = getPersonalizeStorageKey(key);
    const value = localStorage.getItem(storageKey);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    console.warn('Failed to get personalize storage:', error);
    return null;
  }
};

export const clearPersonalizeStorage = (key?: string): void => {
  try {
    if (key) {
      const storageKey = getPersonalizeStorageKey(key);
      localStorage.removeItem(storageKey);
    } else {
      // Clear all personalization storage
      Object.keys(localStorage).forEach(storageKey => {
        if (storageKey.startsWith('cs_personalize_')) {
          localStorage.removeItem(storageKey);
        }
      });
    }
  } catch (error) {
    console.warn('Failed to clear personalize storage:', error);
  }
};

// Validation utilities
export const validatePersonalizeConfig = (config: PersonalizeConfig): boolean => {
  if (!config.projectUid || typeof config.projectUid !== 'string') {
    return false;
  }
  
  if (config.edgeApiUrl && typeof config.edgeApiUrl !== 'string') {
    return false;
  }
  
  return true;
};

export const validateUserAttributes = (attributes: UserAttributes): boolean => {
  if (!attributes || typeof attributes !== 'object') {
    return false;
  }
  
  // Validate common attribute types
  if (attributes.age && (typeof attributes.age !== 'number' || attributes.age < 0)) {
    return false;
  }
  
  if (attributes.gender && !['male', 'female', 'other'].includes(attributes.gender)) {
    return false;
  }
  
  if (attributes.priceRange && !['budget', 'mid-range', 'premium'].includes(attributes.priceRange)) {
    return false;
  }
  
  return true;
};

// Performance utilities
export const debounce = <T extends (...args: any[]) => void>(
  func: T,
  delay: number
): T => {
  let timeoutId: NodeJS.Timeout;
  return ((...args: any[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  }) as T;
};

export const throttle = <T extends (...args: any[]) => void>(
  func: T,
  limit: number
): T => {
  let inThrottle: boolean;
  return ((...args: any[]) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  }) as T;
};

// Analytics integration utilities
export const formatAnalyticsEvent = (
  eventName: string,
  eventData: EventData,
  personalizationMetadata?: {
    experienceUid?: string;
    variantUid?: string;
  }
): Record<string, any> => {
  return {
    event_name: eventName,
    event_data: eventData,
    personalization: personalizationMetadata,
    timestamp: new Date().toISOString(),
    page_url: window.location.href,
    user_agent: navigator.userAgent,
  };
};

// Fallback content utilities
export const createFallbackContent = <T>(
  originalContent: T,
  fallbackData: Partial<T>
): T => {
  return {
    ...originalContent,
    ...fallbackData,
  };
};

export const shouldUseFallback = (
  error: any,
  fallbackEnabled: boolean = true
): boolean => {
  if (!fallbackEnabled) return false;
  
  // Use fallback for network errors, timeout errors, etc.
  const fallbackErrorCodes = [
    'NETWORK_ERROR',
    'TIMEOUT_ERROR',
    'INITIALIZATION_ERROR',
    'SDK_ERROR',
  ];
  
  return isPersonalizeError(error) && fallbackErrorCodes.includes(error.code);
};