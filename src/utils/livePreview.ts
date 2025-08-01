// MINIMAL Visual Builder Implementation - Following Official Docs Exactly
// Based on: https://www.contentstack.com/docs/developers/set-up-live-preview/live-preview-implementation-for-reactjs-csr-website/

import ContentstackLivePreview, { VB_EmptyBlockParentClass } from '@contentstack/live-preview-utils';
import * as Contentstack from 'contentstack';

// Always-active preview mode for working site
export const isPreviewMode = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  // Check for live preview parameters (still supported for compatibility)
  const urlParams = new URLSearchParams(window.location.search);
  const hasPreviewParams = urlParams.has('live_preview') || 
                          urlParams.has('contentstack_live_preview') ||
                          urlParams.has('contentstack_preview') ||
                          urlParams.has('preview') ||
                          urlParams.has('preview_token') ||
                          urlParams.has('contentstack_preview_token');
  
  // Check if in iframe (Visual Builder)
  const isInIframe = window !== window.top;
  
  // Check for Live Preview enabled in environment
  const isLivePreviewEnabled = process.env.REACT_APP_CONTENTSTACK_LIVE_PREVIEW === 'true';
  
  // For testing, also check for specific test routes
  const isTestRoute = window.location.pathname.includes('visual-builder-test');
  
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 Preview Mode Detection (Always Active):', {
      hasPreviewParams,
      isInIframe,
      isLivePreviewEnabled,
      isTestRoute,
      currentURL: window.location.href,
      params: Object.fromEntries(urlParams),
      userAgent: navigator.userAgent.includes('Contentstack'),
      alwaysActive: true
    });
  }
  
  // ALWAYS ACTIVE: Enable Live Preview for working site
  // This makes Visual Builder and edit tags available on all pages
  return true;
};

// Get preview token from URL
export const getPreviewToken = (): string | undefined => {
  if (typeof window === 'undefined') return undefined;
  
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('preview_token') || 
         urlParams.get('contentstack_preview_token') || 
         undefined;
};

// Create Stack with Live Preview - MUST be shared with ContentstackService
let globalStack: any = null;

export const createStack = () => {
  if (globalStack) return globalStack;
  
  // Get correct preview host based on region
  const getPreviewHost = (): string => {
    const region = process.env.REACT_APP_CONTENTSTACK_REGION?.toLowerCase() || 'us';
    
    switch (region) {
      case 'eu':
        return 'eu-rest-preview.contentstack.com';
      case 'azure-na':
        return 'azure-na-rest-preview.contentstack.com';
      case 'azure-eu':
        return 'azure-eu-rest-preview.contentstack.com';
      case 'us':
      default:
        return 'rest-preview.contentstack.com';
    }
  };
  
  const stackConfig: any = {
    api_key: process.env.REACT_APP_CONTENTSTACK_API_KEY!,
    delivery_token: process.env.REACT_APP_CONTENTSTACK_DELIVERY_TOKEN!,
    environment: process.env.REACT_APP_CONTENTSTACK_ENVIRONMENT!,
    region: Contentstack.Region.US,
    live_preview: {
      enable: true,
      host: getPreviewHost()
    }
  };

  // Use preview token from URL or environment variable
  const urlPreviewToken = getPreviewToken();
  const envPreviewToken = process.env.REACT_APP_CONTENTSTACK_PREVIEW_TOKEN;
  const previewToken = urlPreviewToken || envPreviewToken;
  
  if (previewToken) {
    stackConfig.live_preview.preview_token = previewToken;
    console.log('🔑 Using preview token for Live Preview:', previewToken.substring(0, 8) + '...');
  } else {
    console.warn('⚠️ No preview token found - Live Preview may not work properly');
    console.warn('   Add REACT_APP_CONTENTSTACK_PREVIEW_TOKEN to your .env file');
  }
  
  console.log('🌐 Preview host configured:', stackConfig.live_preview.host);

  globalStack = Contentstack.Stack(stackConfig);
  return globalStack;
};

// Initialize Live Preview - Always active for working site
export const initializeLivePreview = async (): Promise<void> => {
  try {
    console.log('🔧 Initializing Live Preview for Visual Builder (Always Active)');

    // Create Stack instance FIRST
    const Stack = createStack();
    console.log('📦 Stack instance created:', !!Stack);

    // Check for required Visual Builder configuration
    const managementToken = process.env.REACT_APP_CONTENTSTACK_MANAGEMENT_TOKEN;
    if (!managementToken || managementToken === 'your_management_token_here') {
      console.warn('⚠️ Visual Builder requires REACT_APP_CONTENTSTACK_MANAGEMENT_TOKEN');
      console.warn('   Please add your management token to .env file for full Visual Builder functionality');
    }

    // Get the correct app host URL based on region and environment
    const getAppHost = (): string => {
      // Use environment variable if provided
      const envAppHost = process.env.REACT_APP_CONTENTSTACK_APP_HOST;
      if (envAppHost && envAppHost !== 'app.contentstack.com') {
        return `https://${envAppHost}`;
      }
      
      // Default to US region app host
      return 'https://app.contentstack.com';
    };

    // Enhanced Live Preview Utils configuration for Visual Builder
    const config: any = {
      stackSdk: Stack,
      stackDetails: {
        apiKey: process.env.REACT_APP_CONTENTSTACK_API_KEY!,
        environment: process.env.REACT_APP_CONTENTSTACK_ENVIRONMENT!,
        // CRITICAL: Add management token and branch for Visual Builder
        ...(managementToken && managementToken !== 'your_management_token_here' && {
          managementToken: managementToken,
          branch: process.env.REACT_APP_CONTENTSTACK_BRANCH || 'main'
        }),
        // CRITICAL: Set the correct app host for edit URLs
        host: getAppHost().replace('https://', ''),
        region: process.env.REACT_APP_CONTENTSTACK_REGION?.toLowerCase() || 'us'
      },
      mode: 'builder', // Force builder mode to show Start Editing button
      enable: true,
      ssr: false,
      runScriptsOnUpdate: true, // Required for Visual Builder
      cleanCslpOnProduction: process.env.NODE_ENV === 'production',
      // Visual Builder button configuration
      editButton: {
        enable: true,
        position: 'top-right'
      },
      // Additional options for better Visual Builder support
      debug: process.env.NODE_ENV === 'development',
      timeout: 10000,
      // Critical Visual Builder specific options
      includeOwnerInfo: true,
      editableTags: true,
      hash: window.location.hash || '',
      // CRITICAL: This controls where edit URLs point to
      clientUrlParams: {
        protocol: 'https',
        host: getAppHost().replace('https://', ''),
        port: 443
      },
      // CRITICAL: Proper Visual Builder app host configuration
      visualBuilderBaseUrl: getAppHost(),
    };

    // Add preview token if available (URL or environment)
    const urlPreviewToken = getPreviewToken();
    const envPreviewToken = process.env.REACT_APP_CONTENTSTACK_PREVIEW_TOKEN;
    const previewToken = urlPreviewToken || envPreviewToken;
    
    if (previewToken) {
      config.stackDetails.preview_token = previewToken;
      console.log('🔑 Live Preview Utils using preview token:', previewToken.substring(0, 8) + '...');
    }
    
    console.log('🔍 Live Preview config:', {
      ...config,
      stackSdk: '<<Stack Instance>>',
      visualBuilderBaseUrl: config.visualBuilderBaseUrl,
      clientUrlParams: config.clientUrlParams,
      mode: config.mode
    });
    
    console.log('🌍 Visual Builder edit URLs will point to:', `${config.clientUrlParams.protocol}://${config.clientUrlParams.host}`);

    // Wait a moment for Stack to be fully ready
    await new Promise(resolve => setTimeout(resolve, 100));

    // Initialize Live Preview Utils
    ContentstackLivePreview.init(config);
    
    // Expose SDK to window object for debugging and testing
    if (typeof window !== 'undefined') {
      (window as any).ContentstackLivePreview = ContentstackLivePreview;
      (window as any).Contentstack = Contentstack;
    }

    console.log('✅ Live Preview initialized successfully');
  } catch (error) {
    console.error('❌ Live Preview initialization failed:', error);
    console.error('Error details:', error);
    throw error;
  }
};

// Export event handlers
export const onEntryChange = ContentstackLivePreview.onEntryChange;
export const onLiveEdit = ContentstackLivePreview.onLiveEdit;

// Enhanced edit attributes helper with debugging and DOM prop filtering
export const getEditAttributes = (field: any) => {
  if (!isPreviewMode()) {
    return {};
  }
  
  const editAttrs = field?.$ || {};
  
  // Filter out invalid DOM properties - only keep valid HTML attributes
  const validDOMProps: Record<string, any> = {};
  
  // Valid HTML/React attributes that can be spread onto DOM elements
  const validPropNames = [
    'data-cslp',
    'data-testid', 
    'className',
    'style',
    'id',
    'role',
    'aria-label',
    'aria-labelledby',
    'aria-describedby',
    'title'
  ];
  
  // Only include properties that are valid DOM attributes
  Object.keys(editAttrs).forEach(key => {
    if (validPropNames.includes(key) || key.startsWith('data-') || key.startsWith('aria-')) {
      validDOMProps[key] = editAttrs[key];
    }
  });
  
  // Debug logging for edit attributes (development only)
  if (process.env.NODE_ENV === 'development' && field && typeof field === 'object') {
    const filteredKeys = Object.keys(editAttrs).filter(key => !Object.keys(validDOMProps).includes(key));
    if (filteredKeys.length > 0) {
      console.log('🔍 getEditAttributes filtered out invalid DOM props:', filteredKeys);
    }
  }
  
  return validDOMProps;
};

// Export VB_EmptyBlockParentClass for multiple field containers
export { VB_EmptyBlockParentClass };