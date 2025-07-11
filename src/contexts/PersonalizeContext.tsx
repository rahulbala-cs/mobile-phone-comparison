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

// Store the initialized SDK instance globally to prevent re-initialization
let globalSdkInstance: PersonalizeSDK | null = null;

// Initialize Personalize SDK - follows official documentation pattern with validation
async function getPersonalizeInstance(): Promise<PersonalizeSDK | null> {
  try {
    // Return existing instance if already initialized
    if (globalSdkInstance) {
      console.log('✅ Returning existing Personalize SDK instance');
      return globalSdkInstance;
    }
    
    // CRITICAL: Validate setup before initialization
    const { validatePersonalizationSetup } = await import('../utils/personalizeUtils');
    const validation = validatePersonalizationSetup();
    
    if (!validation.isValid) {
      console.error('❌ Personalization setup validation failed:', validation.errors);
      console.warn('⚠️ Personalization warnings:', validation.warnings);
      return null;
    }
    
    if (validation.warnings.length > 0) {
      console.warn('⚠️ Personalization setup warnings:', validation.warnings);
    }
    
    console.log('✅ Personalization setup validation passed');
    
    const projectUid = process.env.REACT_APP_CONTENTSTACK_PERSONALIZE_PROJECT_UID;
    
    if (!projectUid) {
      console.warn('Personalize project UID not configured');
      return null;
    }

    console.log('🚀 Initializing Contentstack Personalize SDK...');
    console.log('📋 Project UID:', projectUid.substring(0, 8) + '...');

    // Set custom Edge API URL if configured
    const edgeApiUrl = process.env.REACT_APP_CONTENTSTACK_PERSONALIZE_EDGE_API_URL;
    if (edgeApiUrl) {
      console.log('🌐 Setting Edge API URL:', edgeApiUrl);
      Personalize.setEdgeApiUrl(edgeApiUrl);
    }

    // Initialize the SDK - only once globally
    const sdk = await Personalize.init(projectUid);
    
    if (sdk) {
      // Store the SDK instance globally
      globalSdkInstance = sdk;
      console.log('✅ Personalize SDK initialized successfully');
      
      // Log SDK capabilities for debugging
      try {
        const experiences = sdk.getExperiences ? sdk.getExperiences() : [];
        const variantAliases = sdk.getVariantAliases ? sdk.getVariantAliases() : [];
        
        console.log('🎯 SDK Status:', {
          hasGetExperiences: !!sdk.getExperiences,
          hasGetVariantAliases: !!sdk.getVariantAliases,
          experienceCount: experiences.length,
          variantAliasCount: variantAliases.length,
          variantAliases
        });
        
        if (experiences.length === 0) {
          console.warn('⚠️ No active experiences found. Check your Contentstack Personalize configuration.');
        }
      } catch (debugError) {
        console.warn('⚠️ Could not debug SDK state:', debugError);
      }
      
      return sdk;
    }
    
    console.warn('⚠️ SDK initialization returned null');
    return null;
    
  } catch (error: any) {
    console.error('❌ Failed to initialize Personalize SDK:', error);
    console.error('📋 Error details:', {
      message: error?.message || 'Unknown error',
      projectUid: process.env.REACT_APP_CONTENTSTACK_PERSONALIZE_PROJECT_UID ? 'configured' : 'missing',
      edgeApiUrl: process.env.REACT_APP_CONTENTSTACK_PERSONALIZE_EDGE_API_URL ? 'configured' : 'missing'
    });
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
        getExperiences: (): any[] => [],
        getVariantAliases: (): string[] => [],
        getActiveVariant: (_experienceShortUid: string): any => null,
        isPersonalizationEnabled: (): boolean => false,
        clearError: (): void => {},
      };
    }
    
    return {
      setUserAttribute: async (key: string, value: any): Promise<void> => {
        await sdk.set({ [key]: value });
        // Wait for attribute propagation (up to 1 second as per docs)
        await new Promise(resolve => setTimeout(resolve, 1100));
      },
      getUserAttribute: async (_key: string): Promise<any> => null, // SDK doesn't provide this method
      setUserAttributes: async (attributes: Record<string, any>): Promise<void> => {
        await sdk.set(attributes);
        // Wait for attribute propagation (up to 1 second as per docs)
        await new Promise(resolve => setTimeout(resolve, 1100));
      },
      trackEvent: async (eventKey: string): Promise<void> => {
        await sdk.triggerEvent(eventKey);
      },
      trackImpression: async (experienceShortUid: string): Promise<void> => {
        await sdk.triggerImpression(experienceShortUid);
      },
      getVariantParam: (): string | null => sdk.getVariantParam(),
      // CRITICAL: Add missing core personalization methods
      getExperiences: (): any[] => sdk.getExperiences ? sdk.getExperiences() : [],
      getVariantAliases: (): string[] => sdk.getVariantAliases ? sdk.getVariantAliases() : [],
      getActiveVariant: (experienceShortUid: string): any => 
        sdk.getActiveVariant ? sdk.getActiveVariant(experienceShortUid) : null,
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