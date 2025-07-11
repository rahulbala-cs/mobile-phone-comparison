/**
 * Contentstack Personalize Context
 * 
 * React Context following official documentation patterns
 * Based on: https://www.contentstack.com/docs/personalize/setup-nextjs-website-with-personalize-launch
 */

'use client';
import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import Personalize from '@contentstack/personalize-edge-sdk';
import { PersonalizeSDK } from '../types/Personalize';

// Create context for the SDK instance with ready state
interface PersonalizeContextValue {
  sdk: PersonalizeSDK | null;
  isInitializing: boolean;
  initializationComplete: boolean;
  isReady: boolean;
}

const PersonalizeContext = createContext<PersonalizeContextValue | null>(null);

// PersonalizeProvider component - follows official documentation pattern with ready state
export function PersonalizeProvider({ children }: { children: ReactNode }) {
  const [sdk, setSdk] = useState<PersonalizeSDK | null>(null);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const [initializationComplete, setInitializationComplete] = useState<boolean>(false);
  
  useEffect(() => {
    const initializeSdk = async () => {
      setIsInitializing(true);
      
      let sdkInstance: PersonalizeSDK | null = null;
      
      try {
        sdkInstance = await getPersonalizeInstance();
        setSdk(sdkInstance);
      } catch (error) {
        console.error('❌ SDK initialization failed:', error);
        setSdk(null);
        sdkInstance = null;
      } finally {
        setIsInitializing(false);
        setInitializationComplete(true);
      }
    };
    
    initializeSdk();
  }, []);
  
  const contextValue = useMemo(() => ({
    sdk,
    isInitializing,
    initializationComplete,
    isReady: initializationComplete && !isInitializing
  }), [sdk, isInitializing, initializationComplete]);
  
  return (
    <PersonalizeContext.Provider value={contextValue}>
      {children}
    </PersonalizeContext.Provider>
  );
}

// Hook to use the PersonalizeContext
export function usePersonalize() {
  const context = useContext(PersonalizeContext);
  if (!context) {
    throw new Error('usePersonalize must be used within a PersonalizeProvider');
  }
  return context.sdk;
}

// Hook to get the full context including ready state
export function usePersonalizeState() {
  const context = useContext(PersonalizeContext);
  if (!context) {
    throw new Error('usePersonalizeState must be used within a PersonalizeProvider');
  }
  return context;
}

// Store the initialized SDK instance globally to prevent re-initialization
let globalSdkInstance: PersonalizeSDK | null = null;
let initializationPromise: Promise<PersonalizeSDK | null> | null = null;
let isInitializing = false;

// Initialize Personalize SDK - SINGLETON PATTERN to prevent double initialization
async function getPersonalizeInstance(): Promise<PersonalizeSDK | null> {
  try {
    // Return existing instance if already initialized
    if (globalSdkInstance) {
      return globalSdkInstance;
    }
    
    // If already initializing, return the existing promise
    if (initializationPromise) {
      return await initializationPromise;
    }
    
    // Prevent double initialization
    if (isInitializing) {
      return null;
    }
    
    isInitializing = true;
    
    // Create and store the initialization promise
    initializationPromise = (async () => {
      try {
        // CRITICAL: Validate setup before initialization
        const { validatePersonalizationSetup } = await import('../utils/personalizeUtils');
        const validation = validatePersonalizationSetup();
        
        if (!validation.isValid) {
          console.error('❌ Personalization setup validation failed:', validation.errors);
          return null;
        }
        
        const projectUid = process.env.REACT_APP_CONTENTSTACK_PERSONALIZE_PROJECT_UID;
        
        if (!projectUid) {
          return null;
        }

        // Set custom Edge API URL if configured
        const edgeApiUrl = process.env.REACT_APP_CONTENTSTACK_PERSONALIZE_EDGE_API_URL;
        if (edgeApiUrl) {
          Personalize.setEdgeApiUrl(edgeApiUrl);
        }

        // Initialize the SDK - only once globally
        const sdk = await Personalize.init(projectUid);
        
        if (sdk) {
          // Store the SDK instance globally
          globalSdkInstance = sdk;
          return sdk;
        }
        
        return null;
        
      } catch (error: any) {
        console.error('❌ Failed to initialize Personalize SDK:', error);
        return null;
      } finally {
        isInitializing = false;
        initializationPromise = null;
      }
    })();
    
    return await initializationPromise;
    
  } catch (error: any) {
    isInitializing = false;
    initializationPromise = null;
    console.error('❌ SDK initialization failed completely:', error);
    return null;
  }
}

// Legacy hook for backward compatibility
export const usePersonalizeContext = () => {
  const context = useContext(PersonalizeContext);
  if (!context) {
    throw new Error('usePersonalizeContext must be used within a PersonalizeProvider');
  }
  const { sdk } = context;
  
  // Memoize stable SDK-based functions
  const sdkFunctions = useMemo(() => {
    if (!sdk) {
      return {
        setUserAttribute: async (_key: string, _value: any): Promise<void> => {},
        getUserAttribute: async (_key: string): Promise<any> => null,
        setUserAttributes: async (_attributes: Record<string, any>): Promise<void> => {},
        trackEvent: async (_eventKey: string): Promise<void> => {},
        trackImpression: async (_experienceShortUid: string): Promise<void> => {},
        getVariantParam: (): string | null => null,
        getExperiences: (): any[] => [],
        getVariantAliases: (): string[] => [],
        getActiveVariant: (_experienceShortUid: string): any => null,
        isPersonalizationEnabled: (): boolean => false,
        clearError: (): void => {},
      };
    }
    
    return {
      setUserAttribute: async (key: string, value: any): Promise<void> => {
        try {
          await sdk.set({ [key]: value });
          // Wait for attribute propagation (up to 1 second as per docs)
          await new Promise(resolve => setTimeout(resolve, 1100));
        } catch (error: any) {
          if (process.env.NODE_ENV === 'development') {
            console.warn('⚠️ setUserAttribute failed:', error?.message || error);
          }
          // Fail silently in production - attribute setting is not critical
        }
      },
      getUserAttribute: async (_key: string): Promise<any> => null, // SDK doesn't provide this method
      setUserAttributes: async (attributes: Record<string, any>): Promise<void> => {
        try {
          await sdk.set(attributes);
          // Wait for attribute propagation (up to 1 second as per docs)
          await new Promise(resolve => setTimeout(resolve, 1100));
        } catch (error: any) {
          // Fail silently - attribute setting is not critical for content delivery
        }
      },
      trackEvent: async (eventKey: string): Promise<void> => {
        try {
          await sdk.triggerEvent(eventKey);
        } catch (error: any) {
          // Fail silently - event tracking is not critical for functionality
        }
      },
      trackImpression: async (experienceShortUid: string): Promise<void> => {
        try {
          await sdk.triggerImpression(experienceShortUid);
        } catch (error: any) {
          // Fail silently - impression tracking is not critical for functionality
        }
      },
      getVariantParam: (): string | null => {
        try {
          return sdk.getVariantParam();
        } catch (error: any) {
          if (process.env.NODE_ENV === 'development') {
            console.warn('⚠️ getVariantParam failed:', error?.message || error);
          }
          return null;
        }
      },
      // CRITICAL: Add missing core personalization methods with error handling
      getExperiences: (): any[] => {
        try {
          return sdk.getExperiences ? sdk.getExperiences() : [];
        } catch (error: any) {
          if (process.env.NODE_ENV === 'development') {
            console.warn('⚠️ getExperiences failed:', error?.message || error);
          }
          return [];
        }
      },
      getVariantAliases: (): string[] => {
        try {
          return sdk.getVariantAliases ? sdk.getVariantAliases() : [];
        } catch (error: any) {
          if (process.env.NODE_ENV === 'development') {
            console.warn('⚠️ getVariantAliases failed:', error?.message || error);
          }
          return [];
        }
      },
      getActiveVariant: (experienceShortUid: string): any => {
        try {
          return sdk.getActiveVariant ? sdk.getActiveVariant(experienceShortUid) : null;
        } catch (error: any) {
          if (process.env.NODE_ENV === 'development') {
            console.warn('⚠️ getActiveVariant failed:', error?.message || error);
          }
          return null;
        }
      },
      isPersonalizationEnabled: (): boolean => true,
      clearError: (): void => {},
    };
  }, [sdk]);
  
  // EMERGENCY FIX: Alternative ready detection using SDK functionality
  const isSDKFunctional = useMemo(() => {
    if (!sdk) return false;
    try {
      // Test if SDK methods are available and callable
      const hasGetExperiences = typeof sdk.getExperiences === 'function';
      const hasGetVariantAliases = typeof sdk.getVariantAliases === 'function';
      return hasGetExperiences && hasGetVariantAliases;
    } catch {
      return false;
    }
  }, [sdk]);
  
  // Memoize the entire context object to prevent unnecessary re-renders
  const contextValue = useMemo(() => {
    // CRITICAL FIX: Use SDK functionality as ready indicator instead of broken state flags
    const isActuallyReady = isSDKFunctional || context.initializationComplete;
    
    return {
      // EMERGENCY: Use SDK functionality to determine ready state
      isInitialized: isActuallyReady,
      isLoading: !isActuallyReady && context.isInitializing,
      error: null,
      sdk: sdk || null,
      variantParam: sdk ? sdk.getVariantParam() : null,
      userAttributes: {},
      // Enhanced debug info
      _debug: {
        sdkExists: !!sdk,
        sdkFunctional: isSDKFunctional,
        initializationComplete: context.initializationComplete,
        isInitializing: context.isInitializing,
        contextReady: context.isReady,
        actuallyReady: isActuallyReady,
        overrideReason: isSDKFunctional ? 'SDK_FUNCTIONAL' : 'INIT_COMPLETE'
      },
      // Stable methods (sdkFunctions already handles sdk/no-sdk cases)
      ...sdkFunctions,
    };
  }, [sdk, sdkFunctions, context.isInitializing, context.initializationComplete, context.isReady, isSDKFunctional]);
  
  return contextValue;
};

// Default PersonalizeProvider for backward compatibility
export const DefaultPersonalizeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <PersonalizeProvider>
      {children}
    </PersonalizeProvider>
  );
};

export default PersonalizeContext;