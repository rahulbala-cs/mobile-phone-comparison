// Standard Contentstack Live Preview V3.0 Implementation
// Following official documentation: https://www.contentstack.com/docs/developers/set-up-live-preview/get-started-with-live-preview-utils-sdk-v3

import ContentstackLivePreview from '@contentstack/live-preview-utils';
import * as Contentstack from 'contentstack';

// Check if we're in preview mode
export const isPreviewMode = (): boolean => {
  if (typeof window === 'undefined') return false;

  const urlParams = new URLSearchParams(window.location.search);
  const hasPreviewParams = urlParams.has('live_preview') || 
                           urlParams.has('contentstack_preview') ||
                           urlParams.has('cs_preview');
  
  const isInIframe = window !== window.top;
  const isDevMode = process.env.NODE_ENV === 'development' && 
                   process.env.REACT_APP_CONTENTSTACK_LIVE_PREVIEW === 'true';
  
  return hasPreviewParams || isInIframe || isDevMode;
};

// Get preview token from URL or environment
export const getPreviewToken = (): string | undefined => {
  if (typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search);
    const tokenFromUrl = urlParams.get('preview_token') || urlParams.get('contentstack_preview_token');
    if (tokenFromUrl) return tokenFromUrl;
  }
  
  return process.env.REACT_APP_CONTENTSTACK_PREVIEW_TOKEN;
};

// Initialize Live Preview SDK - Standard V3.0 Pattern
export const initializeLivePreview = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      if (!isPreviewMode()) {
        resolve();
        return;
      }

      // Standard SDK initialization
      const stack = Contentstack.Stack({
        api_key: process.env.REACT_APP_CONTENTSTACK_API_KEY!,
        delivery_token: process.env.REACT_APP_CONTENTSTACK_DELIVERY_TOKEN!,
        environment: process.env.REACT_APP_CONTENTSTACK_ENVIRONMENT!,
        region: process.env.REACT_APP_CONTENTSTACK_REGION === 'EU' ? Contentstack.Region.EU : 
               process.env.REACT_APP_CONTENTSTACK_REGION === 'AZURE_NA' ? Contentstack.Region.AZURE_NA :
               process.env.REACT_APP_CONTENTSTACK_REGION === 'AZURE_EU' ? Contentstack.Region.AZURE_EU :
               process.env.REACT_APP_CONTENTSTACK_REGION === 'GCP_NA' ? Contentstack.Region.GCP_NA :
               Contentstack.Region.US,
        live_preview: {
          preview_token: getPreviewToken() || '',
          enable: true,
          host: process.env.REACT_APP_CONTENTSTACK_APP_HOST || 'app.contentstack.com'
        }
      });

      // Initialize Live Preview Utils SDK V3.0
      ContentstackLivePreview.init({
        stackSdk: stack,
        enable: true,
        ssr: false // Client-Side Rendering mode
      });

      resolve();
    } catch (error) {
      reject(error);
    }
  });
};

// Export the standard onEntryChange method
export const onEntryChange = ContentstackLivePreview.onEntryChange;

// Export initialized state checker
export const isLivePreviewInitialized = (): boolean => {
  try {
    return ContentstackLivePreview.hash !== undefined;
  } catch {
    return false;
  }
};