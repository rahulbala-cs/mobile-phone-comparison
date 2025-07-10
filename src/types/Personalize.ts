/**
 * Contentstack Personalize Types
 * 
 * Type definitions for Contentstack Personalize SDK integration
 * Based on @contentstack/personalize-edge-sdk documentation
 */

// Core Personalize SDK types - based on official SDK API
export interface PersonalizeSDK {
  // Core methods
  getVariantParam(): string;
  addStateToResponse?(response: any): void;
  set(attributes: Record<string, any>): Promise<void>;
  triggerEvent(eventKey: string): Promise<void>;
  triggerImpression(experienceShortUid: string): Promise<void>;
  
  // CRITICAL: Add missing core personalization methods from official docs
  getExperiences(): ManifestExperience[];
  getVariantAliases(): string[];
  getActiveVariant(experienceShortUid: string): any;
  
  // Constants
  VARIANT_QUERY_PARAM: string;
}

// Static methods available on the Personalize class
export interface PersonalizeClass {
  init(projectUid: string, options?: { request?: any }): Promise<PersonalizeSDK>;
  getInitializationStatus(): boolean;
  variantParamToVariantAliases(variantParam: string): string[];
  setEdgeApiUrl(url: string): void;
  VARIANT_QUERY_PARAM: string;
}

// Personalization context state
export interface PersonalizeState {
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
  sdk: PersonalizeSDK | null;
  variantParam: string | null;
  userAttributes: Record<string, any>;
}

// Personalization context methods
export interface PersonalizeContextType extends PersonalizeState {
  // User attribute management
  setUserAttribute(key: string, value: any): Promise<void>;
  getUserAttribute(key: string): Promise<any>;
  setUserAttributes(attributes: Record<string, any>): Promise<void>;
  
  // Event tracking
  trackEvent(eventName: string, eventData?: Record<string, any>): Promise<void>;
  trackImpression(experienceShortUid: string, variantShortUid?: string): Promise<void>;
  
  // CRITICAL: Add core personalization methods from official docs
  getExperiences(): ManifestExperience[];
  getVariantAliases(): string[];
  getActiveVariant(experienceShortUid: string): any;
  
  // Utility methods
  getVariantParam(): string | null;
  isPersonalizationEnabled(): boolean;
  
  // Error handling
  clearError(): void;
}

// User attribute types
export interface UserAttributes {
  // Demographic attributes
  age?: number;
  gender?: 'male' | 'female' | 'other';
  location?: string;
  country?: string;
  city?: string;
  
  // Behavioral attributes
  preferredBrand?: string;
  priceRange?: 'budget' | 'mid-range' | 'premium';
  phoneUsage?: 'basic' | 'moderate' | 'heavy';
  
  // Engagement attributes
  lastVisit?: string;
  visitCount?: number;
  pagesViewed?: number;
  timeSpent?: number;
  
  // Purchase intent
  purchaseIntent?: 'browsing' | 'comparing' | 'ready-to-buy';
  comparisonsMade?: number;
  
  // Custom attributes
  [key: string]: any;
}

// Event types for tracking
export interface EventData {
  // Page events
  page_view?: {
    page_path: string;
    page_title: string;
    referrer?: string;
  };
  
  // Phone interaction events
  phone_view?: {
    phone_uid: string;
    phone_title: string;
    phone_brand: string;
    phone_price?: number;
  };
  
  // Comparison events
  comparison_started?: {
    phone_uids: string[];
    comparison_type: 'side-by-side' | 'feature-focus';
  };
  
  comparison_completed?: {
    phone_uids: string[];
    duration: number;
  };
  
  // Search events
  search_performed?: {
    query: string;
    filters: Record<string, any>;
    results_count: number;
  };
  
  // Custom events
  [key: string]: any;
}

// Personalization configuration
export interface PersonalizeConfig {
  projectUid: string;
  edgeApiUrl?: string;
  environment?: string;
  enableLogging?: boolean;
  fallbackContent?: boolean;
  cookieOptions?: {
    secure?: boolean;
    sameSite?: 'strict' | 'lax' | 'none';
    maxAge?: number;
  };
}

// SDK Experience and variant types - matching actual SDK
export interface ManifestExperience {
  shortUid: string;
  variantShortUid?: string;
  [key: string]: any;
}

// Legacy Experience and variant types for backward compatibility
export interface Experience {
  uid: string;
  shortUid: string;
  title: string;
  description?: string;
  status: 'active' | 'inactive' | 'draft';
  variants: Variant[];
}

export interface Variant {
  uid: string;
  shortUid: string;
  title: string;
  description?: string;
  weight: number;
  content?: Record<string, any>;
}

// Personalization hooks return types
export interface UsePersonalizeReturn extends PersonalizeContextType {
  // Additional hook-specific utilities
  isReady: boolean;
  hasError: boolean;
}

// Error types
export interface PersonalizeError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

// Content personalization types
export interface PersonalizedContent<T = any> {
  content: T;
  experienceUid?: string;
  variantUid?: string;
  isPersonalized: boolean;
  metadata?: {
    experienceTitle?: string;
    variantTitle?: string;
    timestamp: string;
  };
}

// Query parameters for personalized content
export interface PersonalizeQueryParams {
  [key: string]: string | undefined;
  // Variant parameters will be added dynamically
}

// Personalization provider props
export interface PersonalizeProviderProps {
  children: React.ReactNode;
  config: PersonalizeConfig;
  fallbackContent?: boolean;
  onError?: (error: PersonalizeError) => void;
  onInitialized?: () => void;
}

// Analytics integration types
export interface PersonalizeAnalytics {
  trackPersonalizationEvent(eventName: string, data: Record<string, any>): void;
  trackVariantImpression(experienceUid: string, variantUid: string): void;
  trackConversion(eventName: string, data: Record<string, any>): void;
}

// Content delivery integration types
export interface PersonalizedQuery {
  contentType: string;
  uid?: string;
  query?: Record<string, any>;
  variantParams?: Record<string, string>;
  includePersonalization?: boolean;
}

export interface PersonalizedQueryResponse<T = any> {
  content: T;
  personalization?: {
    experienceUid: string;
    variantUid: string;
    isPersonalized: boolean;
  };
}

// Middleware types for future use (if migrating to Next.js)
export interface PersonalizeMiddlewareConfig {
  projectUid: string;
  matcher?: string[];
  skipPaths?: string[];
  enableLogging?: boolean;
}