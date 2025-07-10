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
  
  const trackPageView = useCallback(() => {
    if (!isReady) return;
    
    // Use simple event key format as per official SDK documentation
    trackEvent('page_view');
    lastTrackedPath.current = pagePath;
    
    logPersonalizeEvent('PAGE_VIEW_TRACKED', { pagePath, pageTitle });
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

// Hook for component-specific personalization
export const useComponentPersonalization = (componentName: string) => {
  const personalizeContext = usePersonalize();
  
  // Memoize the current variant parameter to prevent unnecessary re-renders
  const variantParam = useMemo(() => {
    return personalizeContext?.getVariantParam() || null;
  }, [personalizeContext]);
  
  // Create stable tracking functions with memoization
  const trackComponentView = useCallback(async () => {
    if (!personalizeContext?.isReady) return;
    
    try {
      // Track component view event (simple event key as per official SDK)
      await personalizeContext.trackEvent('component_view');
      
      const currentVariantParam = personalizeContext.getVariantParam();
      logPersonalizeEvent('COMPONENT_VIEW_TRACKED', { componentName, variantParam: currentVariantParam });
    } catch (error) {
      logPersonalizeEvent('COMPONENT_VIEW_TRACKING_FAILED', { componentName, error }, 'error');
    }
  }, [personalizeContext, componentName]); // Remove variantParam to prevent re-creation
  
  const trackComponentInteraction = useCallback(async (interactionType: string, data?: Record<string, any>) => {
    if (!personalizeContext?.isReady) return;
    
    try {
      // Track component interaction event (simple event key as per official SDK)
      await personalizeContext.trackEvent('component_interaction');
      
      logPersonalizeEvent('COMPONENT_INTERACTION_TRACKED', { componentName, interactionType, data });
    } catch (error) {
      logPersonalizeEvent('COMPONENT_INTERACTION_TRACKING_FAILED', { componentName, interactionType, data, error }, 'error');
    }
  }, [personalizeContext, componentName]);
  
  // Memoize the returned object to ensure stable references
  return useMemo(() => ({
    variantParam,
    trackComponentView,
    trackComponentInteraction,
  }), [variantParam, trackComponentView, trackComponentInteraction]);
};

export default usePersonalize;