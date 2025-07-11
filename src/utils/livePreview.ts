// MINIMAL Visual Builder Implementation - Following Official Docs Exactly
// Based on: https://www.contentstack.com/docs/developers/set-up-live-preview/live-preview-implementation-for-reactjs-csr-website/

import ContentstackLivePreview, { VB_EmptyBlockParentClass } from '@contentstack/live-preview-utils';
import * as Contentstack from 'contentstack';

// Enhanced preview mode detection
export const isPreviewMode = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  // Check for live preview parameters
  const urlParams = new URLSearchParams(window.location.search);
  const hasPreviewParams = urlParams.has('live_preview') || 
                          urlParams.has('contentstack_live_preview') ||
                          urlParams.has('contentstack_preview') ||
                          urlParams.has('preview') ||
                          urlParams.has('preview_token') ||
                          urlParams.has('contentstack_preview_token');
  
  // Check if in iframe (Visual Builder)
  const isInIframe = window !== window.top;
  
  // Check for development mode with preview enabled
  const isDevWithPreview = process.env.NODE_ENV === 'development' && 
                          process.env.REACT_APP_CONTENTSTACK_LIVE_PREVIEW === 'true';
  
  // For testing, also check for specific test routes
  const isTestRoute = window.location.pathname.includes('visual-builder-test');
  
  // DO NOT force preview mode for development - this causes interference
  const forcePreviewForDev = false;
  
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 Preview Mode Detection:', {
      hasPreviewParams,
      isInIframe,
      isDevWithPreview,
      isTestRoute,
      forcePreviewForDev,
      currentURL: window.location.href,
      params: Object.fromEntries(urlParams),
      userAgent: navigator.userAgent.includes('Contentstack')
    });
  }
  
  // Only enable for actual preview scenarios
  return hasPreviewParams || isInIframe || isDevWithPreview || isTestRoute;
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
  
  const stackConfig: any = {
    api_key: process.env.REACT_APP_CONTENTSTACK_API_KEY!,
    delivery_token: process.env.REACT_APP_CONTENTSTACK_DELIVERY_TOKEN!,
    environment: process.env.REACT_APP_CONTENTSTACK_ENVIRONMENT!,
    region: Contentstack.Region.US,
    live_preview: {
      enable: true,
      host: 'rest-preview.contentstack.com'
    }
  };

  const previewToken = getPreviewToken();
  if (previewToken) {
    stackConfig.live_preview.preview_token = previewToken;
  }

  globalStack = Contentstack.Stack(stackConfig);
  return globalStack;
};

// Initialize Live Preview - MINIMAL implementation
export const initializeLivePreview = async (): Promise<void> => {
  const inPreviewMode = isPreviewMode();
  
  if (!inPreviewMode) {
    console.log('❌ Not in preview mode, skipping Live Preview initialization');
    console.log('💡 To test Visual Builder, try:');
    console.log('   - Add ?live_preview=true to URL');
    console.log('   - Or access through Contentstack Visual Builder');
    console.log('   - Or visit /visual-builder-test route');
    return;
  }

  try {
    console.log('🔧 Initializing Live Preview for Visual Builder');

    // Create Stack instance FIRST
    const Stack = createStack();
    console.log('📦 Stack instance created:', !!Stack);

    // Check for required Visual Builder configuration
    const managementToken = process.env.REACT_APP_CONTENTSTACK_MANAGEMENT_TOKEN;
    if (!managementToken || managementToken === 'your_management_token_here') {
      console.warn('⚠️ Visual Builder requires REACT_APP_CONTENTSTACK_MANAGEMENT_TOKEN');
      console.warn('   Please add your management token to .env file for full Visual Builder functionality');
    }

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
        })
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
      // FIXED: Proper URL configuration for Visual Builder
      clientUrlParams: {
        protocol: window.location.protocol.replace(':', ''),
        host: window.location.hostname,
        port: window.location.port || (window.location.protocol === 'https:' ? '443' : '80'),
        url: window.location.origin + window.location.pathname
      },
      // Add Visual Builder specific URL config
      visualBuilderBaseUrl: 'https://app.contentstack.com',
      region: 'us' // or your specific region
    };

    // Add preview token if available
    const previewToken = getPreviewToken();
    if (previewToken) {
      config.stackDetails.preview_token = previewToken;
    }
    
    console.log('🔍 Live Preview config:', {
      ...config,
      stackSdk: '<<Stack Instance>>'
    });

    // Wait a moment for Stack to be fully ready
    await new Promise(resolve => setTimeout(resolve, 100));

    // Initialize Live Preview Utils
    ContentstackLivePreview.init(config);

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

// Enhanced edit attributes helper with debugging
export const getEditAttributes = (field: any) => {
  if (!isPreviewMode()) {
    return {};
  }
  
  const editAttrs = field?.$ || {};
  
  // Debug logging for edit attributes
  if (field && typeof field === 'object') {
    console.log('🔍 getEditAttributes debug:', {
      hasField: !!field,
      hasEditProperty: !!field.$,
      editAttributes: editAttrs,
      fieldType: typeof field,
      fieldKeys: Object.keys(field || {})
    });
  }
  
  return editAttrs;
};

// Export VB_EmptyBlockParentClass for multiple field containers
export { VB_EmptyBlockParentClass };