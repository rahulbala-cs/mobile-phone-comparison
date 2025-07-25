/**
 * usePersonalize Hook
 * 
 * Custom React hook for accessing personalization functionality
 * Provides a convenient interface for components to use personalization features
 */

import { useCallback, useEffect, useMemo, useRef } from 'react';
import { usePersonalizeContext } from '../contexts/PersonalizeContext';
import { UsePersonalizeReturn, UserAttributes } from '../types/Personalize';
import {
  createUserAttributesFromPhoneInteraction,
  debounce,
  logPersonalizeEvent,
} from '../utils/personalizeUtils';

// Main usePersonalize hook
export const usePersonalize = (): UsePersonalizeReturn => {
  const context = usePersonalizeContext();
  
  // Computed properties
  const isReady = context.isInitialized && !context.isLoading;
  const hasError = context.error !== null;
  
  return {
    ...context,
    isReady,
    hasError,
  };
};

// Hook for page view tracking
export const usePageView = (
  pagePath: string,
  pageTitle: string,
  options: {
    trackOnMount?: boolean;
    trackOnChange?: boolean;
    referrer?: string;
  } = {}
) => {
  const { trackEvent, isReady } = usePersonalize();
  const { trackOnMount = true, trackOnChange = true } = options;
  
  const lastTrackedPath = useRef<string>('');
  
  const trackPageView = useCallback(async () => {
    if (!isReady) return;
    
    try {
      // Use simple event key format as per official SDK documentation
      await trackEvent('page_view');
      lastTrackedPath.current = pagePath;
      
      logPersonalizeEvent('PAGE_VIEW_TRACKED', { pagePath, pageTitle });
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('⚠️ Page view tracking failed (non-critical):', error?.message || error);
        console.warn('ℹ️ Continuing without event tracking - personalization will still work');
      }
      // Fail silently - page view tracking is not critical for app functionality
      logPersonalizeEvent('PAGE_VIEW_TRACKING_FAILED', { pagePath, pageTitle, error: error?.message }, 'error');
    }
  }, [isReady, pagePath, pageTitle, trackEvent]);
  
  // Track on mount
  useEffect(() => {
    if (trackOnMount && isReady) {
      trackPageView();
    }
  }, [trackOnMount, isReady, trackPageView]);
  
  // Track on path change
  useEffect(() => {
    if (trackOnChange && isReady && lastTrackedPath.current !== pagePath) {
      trackPageView();
    }
  }, [trackOnChange, isReady, pagePath, trackPageView]);
  
  return { trackPageView };
};

// Hook for phone interaction tracking
export const usePhoneTracking = () => {
  const { trackEvent, setUserAttributes, isReady } = usePersonalize();
  
  const trackPhoneView = useCallback(async (phoneData: {
    uid: string;
    title: string;
    brand?: string;
    price?: number;
  }) => {
    if (!isReady) return;
    
    try {
      // Track the phone view event (simple event key as per official SDK)
      await trackEvent('phone_view');
      
      // Update user attributes based on phone interaction
      const userAttributes = createUserAttributesFromPhoneInteraction(phoneData);
      await setUserAttributes(userAttributes);
      
      logPersonalizeEvent('PHONE_VIEW_TRACKED', { phoneData, userAttributes });
    } catch (error) {
      logPersonalizeEvent('PHONE_VIEW_TRACKING_FAILED', { phoneData, error }, 'error');
    }
  }, [isReady, trackEvent, setUserAttributes]);
  
  return { trackPhoneView };
};

// Hook for comparison tracking
export const useComparisonTracking = () => {
  const { trackEvent, setUserAttribute, isReady } = usePersonalize();
  
  const trackComparisonStarted = useCallback(async (phoneUids: string[]) => {
    if (!isReady) return;
    
    try {
      // Track comparison started event (simple event key as per official SDK)
      await trackEvent('comparison_started');
      
      // Update user attributes
      await setUserAttribute('comparisonsMade', (prev: number) => (prev || 0) + 1);
      await setUserAttribute('purchaseIntent', 'comparing');
      
      logPersonalizeEvent('COMPARISON_STARTED_TRACKED', { phoneUids });
    } catch (error) {
      logPersonalizeEvent('COMPARISON_STARTED_TRACKING_FAILED', { phoneUids, error }, 'error');
    }
  }, [isReady, trackEvent, setUserAttribute]);
  
  const trackComparisonCompleted = useCallback(async (phoneUids: string[], duration: number) => {
    if (!isReady) return;
    
    try {
      // Track comparison completed event (simple event key as per official SDK)
      await trackEvent('comparison_completed');
      
      // Update user attributes based on comparison behavior
      if (duration > 30000) { // More than 30 seconds
        await setUserAttribute('purchaseIntent', 'ready-to-buy');
      }
      
      logPersonalizeEvent('COMPARISON_COMPLETED_TRACKED', { phoneUids, duration });
    } catch (error) {
      logPersonalizeEvent('COMPARISON_COMPLETED_TRACKING_FAILED', { phoneUids, duration, error }, 'error');
    }
  }, [isReady, trackEvent, setUserAttribute]);
  
  return { trackComparisonStarted, trackComparisonCompleted };
};

// Hook for search tracking
export const useSearchTracking = () => {
  const { trackEvent, setUserAttribute, isReady } = usePersonalize();
  
  // Debounced search tracking to avoid excessive events
  const debouncedTrackSearch = useMemo(
    () => debounce(async (query: string, filters: Record<string, any>, resultsCount: number) => {
      if (!isReady) return;
      
      try {
        // Track search performed event (simple event key as per official SDK)
        await trackEvent('search_performed');
        
        // Update user attributes based on search behavior
        await setUserAttribute('lastSearchQuery', query);
        
        // Extract preferences from search filters
        if (filters.brand) {
          await setUserAttribute('preferredBrand', filters.brand.toLowerCase());
        }
        if (filters.priceRange) {
          await setUserAttribute('priceRange', filters.priceRange);
        }
        
        logPersonalizeEvent('SEARCH_TRACKED', { query, filters, resultsCount });
      } catch (error) {
        logPersonalizeEvent('SEARCH_TRACKING_FAILED', { query, filters, resultsCount, error }, 'error');
      }
    }, 1000),
    [isReady, trackEvent, setUserAttribute]
  );
  
  const trackSearch = useCallback((query: string, filters: Record<string, any>, resultsCount: number) => {
    debouncedTrackSearch(query, filters, resultsCount);
  }, [debouncedTrackSearch]);
  
  return { trackSearch };
};

// Hook for user attribute management
export const useUserAttributes = () => {
  const { setUserAttribute, getUserAttribute, setUserAttributes, userAttributes, isReady } = usePersonalize();
  
  const updatePreferences = useCallback(async (preferences: UserAttributes) => {
    if (!isReady) return;
    
    try {
      await setUserAttributes(preferences);
      logPersonalizeEvent('USER_PREFERENCES_UPDATED', { preferences });
    } catch (error) {
      logPersonalizeEvent('USER_PREFERENCES_UPDATE_FAILED', { preferences, error }, 'error');
    }
  }, [isReady, setUserAttributes]);
  
  const updateDemographics = useCallback(async (demographics: {
    age?: number;
    gender?: 'male' | 'female' | 'other';
    location?: string;
  }) => {
    if (!isReady) return;
    
    try {
      await setUserAttributes(demographics);
      logPersonalizeEvent('USER_DEMOGRAPHICS_UPDATED', { demographics });
    } catch (error) {
      logPersonalizeEvent('USER_DEMOGRAPHICS_UPDATE_FAILED', { demographics, error }, 'error');
    }
  }, [isReady, setUserAttributes]);
  
  const updateBehavior = useCallback(async (behavior: {
    phoneUsage?: 'basic' | 'moderate' | 'heavy';
    purchaseIntent?: 'browsing' | 'comparing' | 'ready-to-buy';
  }) => {
    if (!isReady) return;
    
    try {
      await setUserAttributes(behavior);
      logPersonalizeEvent('USER_BEHAVIOR_UPDATED', { behavior });
    } catch (error) {
      logPersonalizeEvent('USER_BEHAVIOR_UPDATE_FAILED', { behavior, error }, 'error');
    }
  }, [isReady, setUserAttributes]);
  
  return {
    userAttributes,
    updatePreferences,
    updateDemographics,
    updateBehavior,
    setUserAttribute,
    getUserAttribute,
    setUserAttributes,
  };
};

// Hook for impression tracking
export const useImpressionTracking = () => {
  const { trackImpression, isReady } = usePersonalize();
  
  const trackContentImpression = useCallback(async (experienceShortUid: string, variantShortUid?: string) => {
    if (!isReady) return;
    
    try {
      await trackImpression(experienceShortUid, variantShortUid);
      logPersonalizeEvent('IMPRESSION_TRACKED', { experienceShortUid, variantShortUid });
    } catch (error) {
      logPersonalizeEvent('IMPRESSION_TRACKING_FAILED', { experienceShortUid, variantShortUid, error }, 'error');
    }
  }, [isReady, trackImpression]);
  
  return { trackContentImpression };
};

// Hook for custom event tracking
export const useCustomEvents = () => {
  const { trackEvent, isReady } = usePersonalize();
  
  const trackCustomEvent = useCallback(async (eventName: string, eventData?: Record<string, any>) => {
    if (!isReady) return;
    
    try {
      // Track custom event (simple event key as per official SDK)
      await trackEvent(eventName);
      logPersonalizeEvent('CUSTOM_EVENT_TRACKED', { eventName, eventData });
    } catch (error) {
      logPersonalizeEvent('CUSTOM_EVENT_TRACKING_FAILED', { eventName, eventData, error }, 'error');
    }
  }, [isReady, trackEvent]);
  
  const trackEngagement = useCallback(async (action: string, target: string, value?: number) => {
    const eventData = {
      action,
      target,
      value,
      timestamp: new Date().toISOString(),
    };
    
    await trackCustomEvent('engagement', eventData);
  }, [trackCustomEvent]);
  
  const trackConversion = useCallback(async (type: 'lead' | 'sale' | 'signup', value?: number) => {
    const eventData = {
      conversion_type: type,
      value,
      timestamp: new Date().toISOString(),
    };
    
    await trackCustomEvent('conversion', eventData);
  }, [trackCustomEvent]);
  
  return {
    trackCustomEvent,
    trackEngagement,
    trackConversion,
  };
};

// Hook for personalization status
export const usePersonalizationStatus = () => {
  const { isInitialized, isLoading, error, isPersonalizationEnabled } = usePersonalize();
  
  const status = useMemo(() => {
    if (!isPersonalizationEnabled()) return 'disabled';
    if (isLoading) return 'loading';
    if (error) return 'error';
    if (isInitialized) return 'ready';
    return 'initializing';
  }, [isPersonalizationEnabled, isLoading, error, isInitialized]);
  
  return {
    status,
    isDisabled: status === 'disabled',
    isLoading: status === 'loading',
    hasError: status === 'error',
    isReady: status === 'ready',
    isInitializing: status === 'initializing',
  };
};

// Hook for component-specific personalization - STABILIZED to prevent infinite loops
export const useComponentPersonalization = (componentName: string) => {
  const personalizeContext = usePersonalize();
  
  // Memoize the current variant parameter to prevent unnecessary re-renders
  const variantParam = useMemo(() => {
    return personalizeContext?.getVariantParam() || null;
  }, [personalizeContext?.isReady]); // eslint-disable-line react-hooks/exhaustive-deps
  // FIXED: Intentionally excluding personalizeContext to prevent infinite loop
  
  // STABILIZED: Create tracking functions that don't recreate on every render
  const trackComponentView = useCallback(async () => {
    if (!personalizeContext?.isReady) return;
    
    try {
      // Track component view event (simple event key as per official SDK)
      await personalizeContext.trackEvent('component_view');
      
      const currentVariantParam = personalizeContext.getVariantParam();
      logPersonalizeEvent('COMPONENT_VIEW_TRACKED', { componentName, variantParam: currentVariantParam });
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('⚠️ Component view tracking failed (non-critical):', error?.message || error);
      }
      logPersonalizeEvent('COMPONENT_VIEW_TRACKING_FAILED', { componentName, error: error?.message || error }, 'error');
    }
  }, [personalizeContext?.isReady, personalizeContext?.trackEvent, personalizeContext?.getVariantParam, componentName]); // eslint-disable-line react-hooks/exhaustive-deps
  // FIXED: Intentionally excluding personalizeContext to prevent infinite loop
  
  const trackComponentInteraction = useCallback(async (interactionType: string, data?: Record<string, any>) => {
    if (!personalizeContext?.isReady) return;
    
    try {
      // Track component interaction event (simple event key as per official SDK)
      await personalizeContext.trackEvent('component_interaction');
      
      logPersonalizeEvent('COMPONENT_INTERACTION_TRACKED', { componentName, interactionType, data });
    } catch (error) {
      logPersonalizeEvent('COMPONENT_INTERACTION_TRACKING_FAILED', { componentName, interactionType, data, error }, 'error');
    }
  }, [personalizeContext?.isReady, personalizeContext?.trackEvent, componentName]); // eslint-disable-line react-hooks/exhaustive-deps
  // FIXED: Intentionally excluding personalizeContext to prevent infinite loop
  
  // STABILIZED: Memoize the returned object with stable dependencies
  return useMemo(() => ({
    variantParam,
    trackComponentView,
    trackComponentInteraction,
  }), [variantParam, trackComponentView, trackComponentInteraction]);
};

// Hook for comprehensive diagnostic information
export const usePersonalizeDiagnostics = () => {
  const context = usePersonalize();
  
  const getDetailedStatus = useCallback(() => {
    const baseStatus = {
      timestamp: new Date().toISOString(),
      isPersonalizationEnabled: context.isPersonalizationEnabled(),
      isInitialized: context.isInitialized,
      isLoading: context.isLoading,
      isReady: context.isReady,
      hasError: context.hasError,
      error: context.error,
    };
    
    if (!context.isReady) {
      return {
        ...baseStatus,
        experiences: [],
        variantAliases: [],
        variantParam: null,
        userAttributes: {},
        sdkMethods: {}
      };
    }
    
    try {
      const experiences = context.getExperiences();
      const variantAliases = context.getVariantAliases();
      const variantParam = context.getVariantParam();
      
      return {
        ...baseStatus,
        experiences,
        variantAliases,
        variantParam,
        userAttributes: context.userAttributes || {},
        experienceCount: experiences.length,
        variantAliasCount: variantAliases.length,
        hasActiveVariants: variantAliases.length > 0,
        hasActiveExperiences: experiences.length > 0,
        sdkMethods: {
          hasGetExperiences: typeof context.getExperiences === 'function',
          hasGetVariantAliases: typeof context.getVariantAliases === 'function',
          hasGetVariantParam: typeof context.getVariantParam === 'function',
          hasSetUserAttributes: typeof context.setUserAttributes === 'function',
          hasTrackEvent: typeof context.trackEvent === 'function',
          hasTrackImpression: typeof context.trackImpression === 'function',
        }
      };
    } catch (error: any) {
      logPersonalizeEvent('DIAGNOSTIC_ERROR', { error: error.message }, 'error');
      
      return {
        ...baseStatus,
        experiences: [],
        variantAliases: [],
        variantParam: null,
        userAttributes: {},
        diagnosticError: error.message,
        sdkMethods: {}
      };
    }
  }, [context]);
  
  const runQuickDiagnostic = useCallback(async () => {
    const startTime = Date.now();
    logPersonalizeEvent('QUICK_DIAGNOSTIC_STARTED', {});
    
    try {
      const status = getDetailedStatus();
      const issues: string[] = [];
      const warnings: string[] = [];
      
      // Check for common issues
      if (!status.isPersonalizationEnabled) {
        issues.push('Personalization is disabled - check environment variables');
      }
      
      if (!status.isInitialized) {
        issues.push('SDK not initialized - check project configuration');
      }
      
      if (status.isReady && (status as any).experienceCount === 0) {
        warnings.push('No active experiences found - check Contentstack Personalize dashboard');
      }
      
      if (status.isReady && (status as any).variantAliasCount === 0) {
        warnings.push('No variant aliases available - experiences may not be properly configured');
      }
      
      if (status.hasError) {
        issues.push(`SDK error: ${status.error}`);
      }
      
      const endTime = Date.now();
      const result = {
        success: issues.length === 0,
        status,
        issues,
        warnings,
        duration: endTime - startTime,
        timestamp: new Date().toISOString()
      };
      
      logPersonalizeEvent('QUICK_DIAGNOSTIC_COMPLETED', result);
      return result;
      
    } catch (error: any) {
      const result = {
        success: false,
        error: error.message,
        duration: Date.now() - startTime,
        timestamp: new Date().toISOString()
      };
      
      logPersonalizeEvent('QUICK_DIAGNOSTIC_FAILED', result, 'error');
      return result;
    }
  }, [getDetailedStatus]);
  
  const testUserAttributeUpdate = useCallback(async (testAttributes: Record<string, any>) => {
    if (!context.isReady) {
      return { success: false, error: 'SDK not ready' };
    }
    
    try {
      const startTime = Date.now();
      await context.setUserAttributes(testAttributes);
      
      // Wait for propagation
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      const endTime = Date.now();
      const result = {
        success: true,
        attributes: testAttributes,
        duration: endTime - startTime,
        timestamp: new Date().toISOString()
      };
      
      logPersonalizeEvent('TEST_USER_ATTRIBUTES_SUCCESS', result);
      return result;
      
    } catch (error: any) {
      const result = {
        success: false,
        error: error.message,
        attributes: testAttributes,
        timestamp: new Date().toISOString()
      };
      
      logPersonalizeEvent('TEST_USER_ATTRIBUTES_FAILED', result, 'error');
      return result;
    }
  }, [context]);
  
  const validateSdkMethods = useCallback(() => {
    const requiredMethods = [
      'getExperiences',
      'getVariantAliases', 
      'getVariantParam',
      'setUserAttributes',
      'trackEvent',
      'trackImpression'
    ];
    
    const methodStatus = requiredMethods.reduce((acc, method) => {
      acc[method] = {
        exists: typeof (context as any)[method] === 'function',
        callable: false,
        error: null
      };
      
      // Test if method is callable (for critical methods)
      if (acc[method].exists && ['getExperiences', 'getVariantAliases'].includes(method)) {
        try {
          const result = (context as any)[method]();
          acc[method].callable = true;
          acc[method].result = Array.isArray(result) ? result.length : typeof result;
        } catch (error: any) {
          acc[method].error = error.message;
        }
      }
      
      return acc;
    }, {} as Record<string, any>);
    
    const allMethodsAvailable = requiredMethods.every(method => methodStatus[method].exists);
    const criticalMethodsWorking = ['getExperiences', 'getVariantAliases'].every(
      method => methodStatus[method].callable
    );
    
    const result = {
      allMethodsAvailable,
      criticalMethodsWorking,
      methodStatus,
      timestamp: new Date().toISOString()
    };
    
    logPersonalizeEvent('SDK_METHOD_VALIDATION', result);
    return result;
  }, [context]);
  
  return {
    getDetailedStatus,
    runQuickDiagnostic,
    testUserAttributeUpdate,
    validateSdkMethods
  };
};

export default usePersonalize;