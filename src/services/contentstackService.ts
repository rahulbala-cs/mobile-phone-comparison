import * as Contentstack from 'contentstack';
import * as Utils from '@contentstack/utils';
import { MobilePhone } from '../types/MobilePhone';
import { HomePageContent } from '../types/HomePageContent';
import { createStack } from '../utils/livePreview';
import { 
  validateContentstackResponse, 
  validateHomePageContent, 
  validateMobilePhone,
  createValidationError
} from '../utils/validation';
import { ErrorFactory, ErrorHandler } from '../types/errors';
import { 
  EditableField, 
  EditableTagsConfig, 
  ContentstackEntry
} from '../types/EditableTags';

class ContentstackService {
  private stack: Contentstack.Stack;

  constructor() {
    // Use the SAME Stack instance as Live Preview Utils
    this.stack = createStack();
  }

  // Stack is now configured via createStack() function

  // Add editable tags for Visual Builder with proper type safety
  private addEditableTagsToEntry(entry: ContentstackEntry, contentTypeUid: string): MobilePhone {
    if (!entry) {
      return entry as MobilePhone;
    }

    try {
      console.log('🏷️ Adding edit tags with SHARED Stack instance');
      
      // Use Utils.addEditableTags with the shared Stack instance
      // Type assertion to handle the incompatible types
      Utils.addEditableTags(entry as any, contentTypeUid, true);
      
      const locale = 'en-us'; // Should match your actual locale
      const entryUid = entry.uid || '';
      
      // Helper function to safely add edit tags
      const addEditTag = (obj: any, fieldPath: string): EditableTagsConfig => ({
        'data-cslp': `${contentTypeUid}.${entryUid}.${locale}.${fieldPath}`
      });
      
      // Add $ properties with type-safe approach
      if (entry.title && typeof entry.title === 'object') {
        (entry.title as EditableField).$ = addEditTag(entry.title, 'title');
      }
      if (entry.description && typeof entry.description === 'object') {
        (entry.description as EditableField).$ = addEditTag(entry.description, 'description');
      }
      if (entry.lead_image && typeof entry.lead_image === 'object') {
        (entry.lead_image as EditableField).$ = addEditTag(entry.lead_image, 'lead_image');
      }
      if (entry.specifications && typeof entry.specifications === 'object') {
        (entry.specifications as EditableField).$ = addEditTag(entry.specifications, 'specifications');
        
        // Add individual spec edit tags with proper typing
        const specs = entry.specifications as any;
        const specFields = ['cpu', 'ram', 'storage', 'rear_camera', 'front_camera', 'battery'];
        
        specFields.forEach(field => {
          if (specs[field] && typeof specs[field] === 'object') {
            (specs[field] as EditableField).$ = addEditTag(specs[field], `specifications.${field}`);
          }
        });
      }
      
      console.log('✅ Type-safe edit tags added');
      return entry as MobilePhone;
    } catch (error) {
      console.error('❌ Failed to add editable tags:', error);
      return entry as MobilePhone;
    }
  }

  // Fetch mobile phone by UID
  async getMobilePhoneByUID(uid: string): Promise<MobilePhone> {
    try {
      const Query = this.stack.ContentType('mobiles').Entry(uid);
      const result = await Query.includeReference().toJSON().fetch();
      
      if (!result) {
        throw ErrorFactory.contentNotFound('Mobile Phone', uid, { contentType: 'mobiles' });
      }

      // Validate the mobile phone data structure
      const validation = validateMobilePhone(result);
      if (!validation.isValid) {
        throw ErrorFactory.validationError(validation.errors, { 
          uid, 
          contentType: 'mobiles',
          validationErrors: validation.errors 
        });
      }

      return this.addEditableTagsToEntry(result, 'mobiles') as MobilePhone;
    } catch (error: any) {
      const appError = ErrorFactory.fromUnknown(error, { 
        operation: 'getMobilePhoneByUID',
        uid,
        contentType: 'mobiles'
      });
      ErrorHandler.log(appError);
      throw appError;
    }
  }

  // Fetch mobile phone by URL field
  async getMobilePhoneByURL(url: string): Promise<MobilePhone> {
    try {
      const Query = this.stack.ContentType('mobiles').Query();
      Query.where('url', url);
      
      const result = await Query.includeReference().toJSON().find();
      
      if (!result || !Array.isArray(result) || result.length === 0) {
        throw ErrorFactory.contentNotFound('Mobile Phone', url, { 
          contentType: 'mobiles',
          searchField: 'url'
        });
      }
      
      const [entries] = result;
      if (!Array.isArray(entries) || entries.length === 0) {
        throw ErrorFactory.contentNotFound('Mobile Phone', url, { 
          contentType: 'mobiles',
          searchField: 'url',
          stage: 'entries_extraction'
        });
      }

      const phoneEntry = entries[0];
      if (!phoneEntry || typeof phoneEntry !== 'object') {
        throw ErrorFactory.contentNotFound('Mobile Phone', url, { 
          contentType: 'mobiles',
          searchField: 'url',
          stage: 'entry_validation'
        });
      }

      // Validate the mobile phone data structure
      const validation = validateMobilePhone(phoneEntry);
      if (!validation.isValid) {
        throw ErrorFactory.validationError(validation.errors, { 
          url, 
          contentType: 'mobiles',
          validationErrors: validation.errors 
        });
      }

      return this.addEditableTagsToEntry(phoneEntry, 'mobiles') as MobilePhone;
    } catch (error: any) {
      const appError = ErrorFactory.fromUnknown(error, { 
        operation: 'getMobilePhoneByURL',
        url,
        contentType: 'mobiles'
      });
      ErrorHandler.log(appError);
      throw appError;
    }
  }

  // Fetch all mobile phones
  async getAllMobilePhones(): Promise<MobilePhone[]> {
    try {
      const Query = this.stack.ContentType('mobiles').Query();
      const result = await Query.includeReference().toJSON().find();
      
      if (!result || !Array.isArray(result) || result.length === 0) {
        return [];
      }
      
      const phones = Array.isArray(result[0]) ? result[0] : [];
      
      return phones.map((phone: any) => this.addEditableTagsToEntry(phone, 'mobiles'));
    } catch (error: any) {
      console.error('Error fetching mobile phones:', error);
      throw new Error(error.message || 'Failed to fetch mobile phones');
    }
  }

  // Fetch multiple mobile phones by UIDs
  async getMobilePhonesByUIDs(uids: string[]): Promise<MobilePhone[]> {
    try {
      if (!uids || uids.length === 0) return [];
      
      const Query = this.stack.ContentType('mobiles').Query();
      Query.containedIn('uid', uids);
      
      const result = await Query.includeReference().toJSON().find();
      
      if (!result || !Array.isArray(result) || result.length === 0) {
        return [];
      }
      
      const phones = Array.isArray(result[0]) ? result[0] : [];
      
      return phones.map((phone: any) => this.addEditableTagsToEntry(phone, 'mobiles'));
    } catch (error: any) {
      console.error('Error fetching mobile phones by UIDs:', error);
      throw new Error(error.message || 'Failed to fetch related mobile phones');
    }
  }

  // Fetch navigation menus by type
  async getNavigationMenuByType(menuType: string): Promise<any> {
    try {
      const Query = this.stack.ContentType('navigation_menu').Query();
      Query.where('menu_type', menuType);
      const result = await Query.includeReference().toJSON().find();
      
      if (!result || !result[0] || result[0].length === 0) {
        return null;
      }

      return result[0][0];
    } catch (error: any) {
      console.error('Error fetching navigation menu:', error);
      throw new Error(error.message || 'Failed to fetch navigation menu');
    }
  }

  // Fetch all navigation menus
  async getAllNavigationMenus(): Promise<any[]> {
    try {
      const Query = this.stack.ContentType('navigation_menu').Query();
      const result = await Query.includeReference().toJSON().find();
      
      return result[0] || [];
    } catch (error: any) {
      console.error('Error fetching navigation menus:', error);
      throw new Error(error.message || 'Failed to fetch navigation menus');
    }
  }

  // Add editable tags for Home Page content with proper type safety
  private addEditableTagsToHomePageEntry(entry: ContentstackEntry, contentTypeUid: string): HomePageContent {
    if (!entry) {
      return entry as HomePageContent;
    }

    try {
      console.log('🏷️ Adding edit tags to Home Page content');
      
      // Use Utils.addEditableTags with the shared Stack instance
      // Type assertion to handle the incompatible types
      Utils.addEditableTags(entry as any, contentTypeUid, true);
      
      const locale = 'en-us'; // Should match your actual locale
      const entryUid = entry.uid || '';
      
      // Helper function to safely add edit tags
      const addEditTag = (fieldPath: string): EditableTagsConfig => ({
        'data-cslp': `${contentTypeUid}.${entryUid}.${locale}.${fieldPath}`
      });
      
      // Type-safe approach to adding edit tags for key fields
      const editableFields = [
        'hero_title', 'hero_subtitle', 'hero_badge_text', 'hero_title_highlight',
        'hero_primary_button_text', 'hero_secondary_button_text',
        'features_section_title', 'features_section_subtitle',
        'comparisons_section_title', 'comparisons_section_subtitle',
        'stats_section_title', 'stats_section_subtitle',
        'cta_title', 'cta_description', 'cta_button_text',
        // Add new dynamic fields
        'hero_phone_1_name', 'hero_phone_2_name', 'hero_vs_text',
        'hero_spec_1_label', 'hero_spec_2_label', 'hero_spec_3_label',
        'comparisons_view_all_button_text', 'comparison_card_button_text',
        'comparison_vs_text', 'badge_trending_text', 'badge_hot_text', 'badge_popular_text'
      ];
      
      editableFields.forEach(fieldName => {
        const fieldValue = (entry as any)[fieldName];
        if (fieldValue && typeof fieldValue === 'string') {
          // Create editable field structure
          (entry as any)[fieldName] = {
            value: fieldValue,
            $: addEditTag(fieldName)
          } as EditableField<string>;
        }
      });
      
      console.log('✅ Type-safe Home Page edit tags added');
      return entry as HomePageContent;
    } catch (error) {
      console.error('❌ Failed to add editable tags to Home Page:', error);
      return entry as HomePageContent;
    }
  }

  // Fetch Home Page content from Contentstack
  async getHomePageContent(): Promise<HomePageContent> {
    try {
      console.log('📄 Fetching Home Page content from Contentstack');
      console.log('🔧 Environment:', process.env.REACT_APP_CONTENTSTACK_ENVIRONMENT);
      console.log('🔧 Preview mode:', process.env.REACT_APP_CONTENTSTACK_LIVE_PREVIEW);
      
      const Query = this.stack.ContentType('home_page').Query();
      const result = await Query.toJSON().find();
      
      // Validate the raw Contentstack response
      const responseValidation = validateContentstackResponse(result);
      if (!responseValidation.isValid) {
        throw createValidationError('Contentstack API response', responseValidation.errors);
      }
      
      if (!result || !Array.isArray(result) || result.length === 0) {
        throw ErrorFactory.contentNotFound('Home Page', 'home_page', { 
          contentType: 'home_page'
        });
      }
      
      const [entries] = result;
      if (!Array.isArray(entries) || entries.length === 0) {
        throw ErrorFactory.contentNotFound('Home Page', 'home_page', { 
          contentType: 'home_page',
          stage: 'entries_extraction'
        });
      }

      const homePageEntry = entries[0]; // Get the first (and likely only) entry
      
      // Validate the home page content structure
      const contentValidation = validateHomePageContent(homePageEntry);
      if (!contentValidation.isValid) {
        throw ErrorFactory.validationError(contentValidation.errors, { 
          contentType: 'home_page',
          validationErrors: contentValidation.errors 
        });
      }

      const contentWithEditTags = this.addEditableTagsToHomePageEntry(homePageEntry as HomePageContent, 'home_page');
      
      console.log('✅ Home Page content fetched successfully');
      return contentWithEditTags;
    } catch (error: any) {
      const appError = ErrorFactory.fromUnknown(error, { 
        operation: 'getHomePageContent',
        contentType: 'home_page'
      });
      ErrorHandler.log(appError);
      throw appError;
    }
  }

  // Optimize image using Contentstack's Image Delivery API
  optimizeImage(imageUrl: string, options: {
    width?: number;
    height?: number;
    format?: 'webp' | 'jpg' | 'png';
    quality?: number;
  } = {}): string {
    if (!imageUrl) return '';

    const params = new URLSearchParams();
    
    if (options.width) params.append('width', options.width.toString());
    if (options.height) params.append('height', options.height.toString());
    if (options.format) params.append('format', options.format);
    if (options.quality) params.append('quality', options.quality.toString());

    const separator = imageUrl.includes('?') ? '&' : '?';
    return `${imageUrl}${separator}${params.toString()}`;
  }
}

const contentstackService = new ContentstackService();
export default contentstackService;