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

// Create context for the SDK instance
const PersonalizeContext = createContext<PersonalizeSDK | null>(null);

// PersonalizeProvider component - follows official documentation pattern
export function PersonalizeProvider({ children }: { children: ReactNode }) {
  const [sdk, setSdk] = useState<PersonalizeSDK | null>(null);
  
  useEffect(() => {
    getPersonalizeInstance().then(setSdk);
  }, []);
  
  return (
    <PersonalizeContext.Provider value={sdk}>
      {children}
    </PersonalizeContext.Provider>
  );
}

// Hook to use the PersonalizeContext
export function usePersonalize() {
  return useContext(PersonalizeContext);
}

// Initialize Personalize SDK - follows official documentation pattern
async function getPersonalizeInstance(): Promise<PersonalizeSDK | null> {
  try {
    // Check if already initialized (following official pattern)
    if (!Personalize.getInitializationStatus()) {
      const projectUid = process.env.REACT_APP_CONTENTSTACK_PERSONALIZE_PROJECT_UID;
      
      if (!projectUid) {
        console.warn('Personalize project UID not configured');
        return null;
      }

      // Set custom Edge API URL if configured
      const edgeApiUrl = process.env.REACT_APP_CONTENTSTACK_PERSONALIZE_EDGE_API_URL;
      if (edgeApiUrl) {
        Personalize.setEdgeApiUrl(edgeApiUrl);
      }

      return await Personalize.init(projectUid);
    }
    return null;
  } catch (error) {
    console.error('Failed to initialize Personalize SDK:', error);
    return null;
  }
}

// Legacy hook for backward compatibility
export const usePersonalizeContext = () => {
  const sdk = usePersonalize();
  
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
        isPersonalizationEnabled: (): boolean => false,
        clearError: (): void => {},
      };
    }
    
    return {
      setUserAttribute: async (key: string, value: any): Promise<void> => {
        await sdk.set({ [key]: value });
      },
      getUserAttribute: async (_key: string): Promise<any> => null, // SDK doesn't provide this method
      setUserAttributes: async (attributes: Record<string, any>): Promise<void> => {
        await sdk.set(attributes);
      },
      trackEvent: async (eventKey: string): Promise<void> => {
        await sdk.triggerEvent(eventKey);
      },
      trackImpression: async (experienceShortUid: string): Promise<void> => {
        await sdk.triggerImpression(experienceShortUid);
      },
      getVariantParam: (): string | null => sdk.getVariantParam(),
      isPersonalizationEnabled: (): boolean => true,
      clearError: (): void => {},
    };
  }, [sdk]);
  
  // Memoize the entire context object to prevent unnecessary re-renders
  const contextValue = useMemo(() => {
    return {
      // State
      isInitialized: !!sdk,
      isLoading: false,
      error: null,
      sdk: sdk || null,
      variantParam: sdk ? sdk.getVariantParam() : null,
      userAttributes: {},
      // Stable methods (sdkFunctions already handles sdk/no-sdk cases)
      ...sdkFunctions,
    };
  }, [sdk, sdkFunctions]);
  
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