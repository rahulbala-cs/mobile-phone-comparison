import ContentstackLivePreview from '@contentstack/live-preview-utils';

interface LivePreviewConfig {
  apiKey: string;
  environment: string;
  enable: boolean;
  enableEditTags: boolean;
  host?: string;
  previewToken?: string;
}

class LivePreviewManager {
  private isInitialized: boolean = false;
  private config: LivePreviewConfig;

  constructor() {
    this.config = {
      apiKey: process.env.REACT_APP_CONTENTSTACK_API_KEY || '',
      environment: process.env.REACT_APP_CONTENTSTACK_ENVIRONMENT || 'prod',
      enable: process.env.REACT_APP_CONTENTSTACK_LIVE_PREVIEW === 'true',
      enableEditTags: process.env.REACT_APP_CONTENTSTACK_LIVE_EDIT_TAGS === 'true',
      host: process.env.REACT_APP_CONTENTSTACK_APP_HOST,
      previewToken: process.env.REACT_APP_CONTENTSTACK_PREVIEW_TOKEN,
    };
  }

  /**
   * Initialize Live Preview SDK
   */
  public init(): void {
    if (this.isInitialized || !this.config.enable) {
      return;
    }

    try {
      ContentstackLivePreview.init({
        stackDetails: {
          apiKey: this.config.apiKey,
          environment: this.config.environment,
        },
        clientUrlParams: {
          host: this.config.host,
        },
        ssr: false,
        editButton: {
          enable: this.config.enableEditTags,
        },
      });

      this.isInitialized = true;
      console.log('✅ Contentstack Live Preview initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Contentstack Live Preview:', error);
    }
  }

  /**
   * Check if Live Preview is enabled
   */
  public isEnabled(): boolean {
    return this.config.enable;
  }

  /**
   * Check if edit tags are enabled
   */
  public isEditTagsEnabled(): boolean {
    return this.config.enableEditTags;
  }

  /**
   * Set up real-time content updates for a component
   */
  public onEntryChange(callback: () => void): void {
    if (!this.isInitialized || !this.config.enable) {
      return;
    }

    try {
      ContentstackLivePreview.onEntryChange(callback);
    } catch (error) {
      console.error('❌ Failed to set up onEntryChange:', error);
    }
  }

  /**
   * Get data attributes for Live Preview edit tags
   */
  public getEditDataAttributes(
    entryUid: string,
    contentTypeUid: string = 'mobiles',
    fieldPath?: string
  ): Record<string, string> {
    if (!this.config.enableEditTags) {
      return {};
    }

    const baseAttributes = {
      'data-cslp': `${entryUid}.${contentTypeUid}${fieldPath ? `.${fieldPath}` : ''}`,
    };

    return baseAttributes;
  }

  /**
   * Check if we're in preview mode
   */
  public isPreviewMode(): boolean {
    if (typeof window === 'undefined') {
      return false;
    }

    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.has('live_preview') || urlParams.has('contentstack_preview');
  }

  /**
   * Get preview token for API requests
   */
  public getPreviewToken(): string | undefined {
    return this.config.previewToken;
  }
}

// Create singleton instance
const livePreview = new LivePreviewManager();

export default livePreview;

// Export utility functions for easier use
export const initLivePreview = () => livePreview.init();
export const isLivePreviewEnabled = () => livePreview.isEnabled();
export const onEntryChange = (callback: () => void) => livePreview.onEntryChange(callback);
export const getEditDataAttributes = (entryUid: string, contentTypeUid?: string, fieldPath?: string) =>
  livePreview.getEditDataAttributes(entryUid, contentTypeUid, fieldPath);
export const isPreviewMode = () => livePreview.isPreviewMode();
export const getPreviewToken = () => livePreview.getPreviewToken();