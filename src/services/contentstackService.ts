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
  ContentstackEntry,
  getFieldValue
} from '../types/EditableTags';
import { 
  PersonalizedContent, 
  PersonalizedQuery, 
  PersonalizedQueryResponse 
} from '../types/Personalize';
import { 
  shouldPersonalizeContent, 
  extractPersonalizationMetadata,
  logPersonalizeEvent
} from '../utils/personalizeUtils';

class ContentstackService {
  private stack: Contentstack.Stack;
  private personalizationEnabled: boolean = false;

  constructor() {
    // Use the SAME Stack instance as Live Preview Utils
    this.stack = createStack();
    
    // Check if personalization is enabled
    this.personalizationEnabled = !!(
      process.env.REACT_APP_CONTENTSTACK_PERSONALIZE_PROJECT_UID
    );
  }

  // Stack is now configured via createStack() function

  // Set personalization variant parameters for queries - following official documentation
  private addPersonalizationToQuery(query: any, variantParam?: string): any {
    if (!this.personalizationEnabled || !variantParam) {
      return query;
    }

    try {
      // Import SDK to access static methods
      const Personalize = require('@contentstack/personalize-edge-sdk');
      
      // Convert variant parameter to variant aliases (following official pattern)
      const variantAliases = Personalize.variantParamToVariantAliases(variantParam);
      
      if (variantAliases && variantAliases.length > 0) {
        // Use the variants method as per official documentation
        const variantAlias = variantAliases.join(',');
        query = query.variants(variantAlias);
        logPersonalizeEvent('PERSONALIZATION_VARIANTS_ADDED', { variantParam, variantAliases });
      }
    } catch (error) {
      logPersonalizeEvent('PERSONALIZATION_VARIANT_CONVERSION_FAILED', { variantParam, error }, 'error');
      
      // Fallback to old method if SDK methods are not available
      try {
        query.addParam('cs_personalize_variant', variantParam);
        logPersonalizeEvent('PERSONALIZATION_PARAM_ADDED_FALLBACK', { variantParam });
      } catch (fallbackError) {
        logPersonalizeEvent('PERSONALIZATION_PARAM_FAILED', { variantParam, error: fallbackError }, 'error');
      }
    }

    return query;
  }

  // Create personalized content wrapper
  private createPersonalizedContent<T>(
    content: T,
    contentType: string,
    variantParam?: string
  ): PersonalizedContent<T> {
    const metadata = extractPersonalizationMetadata(content);
    
    return {
      content,
      experienceUid: metadata.experienceUid,
      variantUid: metadata.variantUid,
      isPersonalized: metadata.isPersonalized,
      metadata: metadata.isPersonalized ? {
        experienceTitle: undefined, // Will be populated by SDK
        variantTitle: undefined,    // Will be populated by SDK
        timestamp: new Date().toISOString(),
      } : undefined,
    };
  }

  // Execute personalized query
  private async executePersonalizedQuery<T>(
    personalizedQuery: PersonalizedQuery
  ): Promise<PersonalizedQueryResponse<T>> {
    try {
      const { contentType, uid, query: queryParams, variantParams } = personalizedQuery;
      
      let query: any;
      
      // Build query based on parameters
      if (uid) {
        query = this.stack.ContentType(contentType).Entry(uid);
      } else {
        query = this.stack.ContentType(contentType).Query();
        
        // Add any query parameters
        if (queryParams) {
          Object.entries(queryParams).forEach(([key, value]) => {
            if (key === 'where' && typeof value === 'object') {
              Object.entries(value).forEach(([whereKey, whereValue]) => {
                query.where(whereKey, whereValue);
              });
            } else {
              query.addParam(key, value);
            }
          });
        }
      }
      
      // Add personalization parameters
      if (variantParams && Object.keys(variantParams).length > 0) {
        Object.entries(variantParams).forEach(([key, value]) => {
          query = this.addPersonalizationToQuery(query, value);
        });
      }
      
      // Execute query
      const result = await query.includeReference().toJSON().fetch();
      
      // Create personalized response
      const personalizedContent = this.createPersonalizedContent(
        result,
        contentType,
        variantParams?.cs_personalize_variant
      );
      
      return {
        content: personalizedContent.content,
        personalization: personalizedContent.isPersonalized ? {
          experienceUid: personalizedContent.experienceUid!,
          variantUid: personalizedContent.variantUid!,
          isPersonalized: true,
        } : undefined,
      };
      
    } catch (error: any) {
      logPersonalizeEvent('PERSONALIZED_QUERY_FAILED', { 
        personalizedQuery, 
        error: error.message 
      }, 'error');
      throw error;
    }
  }

  // Add editable tags for Visual Builder with proper type safety
  private addEditableTagsToEntry(entry: ContentstackEntry, contentTypeUid: string): MobilePhone {
    if (!entry) {
      return entry as MobilePhone;
    }

    try {
      console.log('🏷️ Adding edit tags to Mobile Phone entry');
      
      // Use Utils.addEditableTags with the shared Stack instance
      Utils.addEditableTags(entry as any, contentTypeUid, true);
      
      const locale = 'en-us';
      const entryUid = entry.uid || '';
      
      // Helper function to safely add edit tags
      const addEditTag = (fieldPath: string): EditableTagsConfig => ({
        'data-cslp': `${contentTypeUid}.${entryUid}.${locale}.${fieldPath}`
      });
      
      // Mobile phone fields that need edit tags (using same pattern as home page)
      const editableFields = [
        'title', 'description', 'url', 'lead_image',
        // SEO fields
        'seo_meta_title', 'seo_meta_description', 'seo_keywords',
        // Specification fields
        'specifications_display_resolution', 'specifications_screen_to_body_ratio',
        'specifications_cpu', 'specifications_ram', 'specifications_storage', 
        'specifications_rear_camera', 'specifications_front_camera', 
        'specifications_battery', 'specifications_weight'
      ];
      
      editableFields.forEach(fieldName => {
        const fieldValue = (entry as any)[fieldName];
        if (fieldValue) {
          if (typeof fieldValue === 'string') {
            (entry as any)[fieldName] = {
              value: fieldValue,
              $: addEditTag(fieldName)
            } as EditableField<string>;
          } else if (typeof fieldValue === 'object' && !fieldValue.$) {
            // Handle images and other asset objects
            (entry as any)[fieldName] = {
              ...fieldValue,
              $: addEditTag(fieldName)
            };
          }
        }
      });
      
      // Handle nested specifications object
      if (entry.specifications && typeof entry.specifications === 'object') {
        const specs = entry.specifications as any;
        const specFields = [
          'display_resolution', 'screen_to_body_ratio', 'cpu', 'ram', 'storage', 
          'rear_camera', 'front_camera', 'battery', 'weight'
        ];
        
        specFields.forEach(field => {
          const fieldValue = specs[field];
          if (fieldValue && typeof fieldValue === 'string') {
            specs[field] = {
              value: fieldValue,
              $: addEditTag(`specifications.${field}`)
            } as EditableField<string>;
          }
        });
      }
      
      // Handle variants array
      if (entry.variants && Array.isArray(entry.variants)) {
        entry.variants.forEach((variant: any, index: number) => {
          if (variant.variant_name && typeof variant.variant_name === 'string') {
            variant.variant_name = {
              value: variant.variant_name,
              $: addEditTag(`variants.${index}.variant_name`)
            } as EditableField<string>;
          }
          if (variant.price && typeof variant.price === 'number') {
            variant.price = {
              value: variant.price,
              $: addEditTag(`variants.${index}.price`)
            } as EditableField<number>;
          }
        });
      }
      
      // Handle buy links
      if (entry.amazon_link && typeof entry.amazon_link === 'object') {
        const amazonLink = entry.amazon_link as any;
        if (amazonLink.title && typeof amazonLink.title === 'string') {
          amazonLink.title = {
            value: amazonLink.title,
            $: addEditTag('amazon_link.title')
          } as EditableField<string>;
        }
      }
      
      if (entry.flipkart_link && typeof entry.flipkart_link === 'object') {
        const flipkartLink = entry.flipkart_link as any;
        if (flipkartLink.title && typeof flipkartLink.title === 'string') {
          flipkartLink.title = {
            value: flipkartLink.title,
            $: addEditTag('flipkart_link.title')
          } as EditableField<string>;
        }
      }
      
      // Handle tags array
      if (entry.tags && Array.isArray(entry.tags)) {
        entry.tags = entry.tags.map((tag: string, index: number) => {
          if (typeof tag === 'string') {
            return {
              value: tag,
              $: addEditTag(`tags.${index}`)
            } as EditableField<string>;
          }
          return tag;
        });
      }
      
      // Handle images array
      if (entry.images && Array.isArray(entry.images)) {
        entry.images.forEach((image: any, index: number) => {
          if (image.title && typeof image.title === 'string') {
            image.title = {
              value: image.title,
              $: addEditTag(`images.${index}.title`)
            } as EditableField<string>;
          }
        });
      }
      
      // Handle SEO object
      if (entry.seo && typeof entry.seo === 'object') {
        const seo = entry.seo as any;
        const seoFields = ['meta_title', 'meta_description', 'keywords'];
        
        seoFields.forEach(field => {
          const fieldValue = seo[field];
          if (fieldValue && typeof fieldValue === 'string') {
            seo[field] = {
              value: fieldValue,
              $: addEditTag(`seo.${field}`)
            } as EditableField<string>;
          }
        });
      }
      
      console.log('✅ Mobile Phone edit tags added');
      return entry as MobilePhone;
    } catch (error) {
      console.error('❌ Failed to add editable tags to Mobile Phone:', error);
      return entry as MobilePhone;
    }
  }

  // Fetch mobile phone by UID with personalization support
  async getMobilePhoneByUID(uid: string, variantParam?: string): Promise<MobilePhone> {
    try {
      let entryCall = this.stack.ContentType('mobiles').Entry(uid);
      
      let result;
      // Follow official documentation pattern for variant fetching
      if (variantParam && shouldPersonalizeContent('mobiles')) {
        try {
          // Import SDK to access static methods
          const Personalize = require('@contentstack/personalize-edge-sdk');
          const variantAliases = Personalize.variantParamToVariantAliases(variantParam);
          
          if (variantAliases && variantAliases.length > 0) {
            const variantAlias = variantAliases.join(',');
            result = await entryCall.variants(variantAlias).includeReference().toJSON().fetch();
          } else {
            result = await entryCall.includeReference().toJSON().fetch();
          }
        } catch (error) {
          // Fallback to regular fetch if variant fetching fails
          logPersonalizeEvent('VARIANT_FETCH_FALLBACK', { uid, variantParam, error }, 'warn');
          result = await entryCall.includeReference().toJSON().fetch();
        }
      } else {
        result = await entryCall.includeReference().toJSON().fetch();
      }
      
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

  // Fetch mobile phone by URL field with personalization support
  async getMobilePhoneByURL(url: string, variantParam?: string): Promise<MobilePhone> {
    try {
      let Query = this.stack.ContentType('mobiles').Query();
      Query.where('url', url);
      
      // Add personalization parameters if provided
      if (variantParam && shouldPersonalizeContent('mobiles')) {
        Query = this.addPersonalizationToQuery(Query, variantParam);
      }
      
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

  // Fetch all mobile phones with personalization support
  async getAllMobilePhones(variantParam?: string): Promise<MobilePhone[]> {
    try {
      let Query = this.stack.ContentType('mobiles').Query();
      
      // Add personalization parameters if provided
      if (variantParam && shouldPersonalizeContent('mobiles')) {
        Query = this.addPersonalizationToQuery(Query, variantParam);
      }
      
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

  // Fetch mobile phones by title slugs (for comparison pages) with personalization support
  async getMobilePhonesBySlugs(slugs: string[], variantParam?: string): Promise<MobilePhone[]> {
    try {
      if (!slugs || slugs.length === 0) return [];
      
      console.log('🔍 DEBUG: getMobilePhonesBySlugs called with slugs:', slugs);
      console.log('🔍 DEBUG: variantParam:', variantParam);
      
      // OPTIMIZATION: Fetch all phones for accurate matching
      // The 50-phone limit was causing missing phones
      
      let Query = this.stack.ContentType('mobiles').Query();
      
      // Remove limit to ensure we find all phones
      Query.limit(200); // Increased limit to catch all phones
      
      // Add personalization parameters if provided
      if (variantParam && shouldPersonalizeContent('mobiles')) {
        Query = this.addPersonalizationToQuery(Query, variantParam);
      }
      
      const result = await Query.includeReference().toJSON().find();
      
      console.log('🔍 DEBUG: Raw Contentstack result:', result);
      
      if (!result || !Array.isArray(result) || result.length === 0) {
        console.log('🔍 DEBUG: No result or empty result from Contentstack');
        return [];
      }
      
      const phones = Array.isArray(result[0]) ? result[0] : [];
      console.log('🔍 DEBUG: Found phones count:', phones.length);
      console.log('🔍 DEBUG: Phone titles:', phones.map((phone: any) => phone.title));
      
      const processedPhones = phones.map((phone: any) => this.addEditableTagsToEntry(phone, 'mobiles'));
      
      
      // Now filter the results to match our specific slugs
      const { generatePhoneSlug } = await import('../utils/urlUtils');
      const matchedPhones: MobilePhone[] = [];
      
      console.log('🔍 DEBUG: Looking for slugs:', slugs);
      
      for (const slug of slugs) {
        console.log(`🔍 DEBUG: Looking for slug "${slug}"`);
        const matchedPhone = processedPhones.find((phone: MobilePhone) => {
          if (!phone.title) {
            console.log(`🔍 DEBUG: Phone has no title:`, phone.uid);
            return false;
          }
          // Extract actual title value from editable field or raw value
          const titleValue = getFieldValue(phone.title);
          const phoneSlug = generatePhoneSlug(titleValue as string);
          console.log(`🔍 DEBUG: Phone "${titleValue}" -> slug "${phoneSlug}"`);
          return phoneSlug === slug;
        });
        if (matchedPhone) {
          console.log(`🔍 DEBUG: Found match for slug "${slug}":`, matchedPhone.title);
          matchedPhones.push(matchedPhone);
        } else {
          console.log(`🔍 DEBUG: No match found for slug "${slug}"`);
        }
      }
      
      console.log('🔍 DEBUG: Final matched phones count:', matchedPhones.length);
      console.log(`🔍 DEBUG: Final result - found ${matchedPhones.length} of ${slugs.length} requested phones`);
      
      // If we didn't find all phones, provide detailed feedback
      if (matchedPhones.length < slugs.length) {
        const foundSlugs = matchedPhones.map(phone => {
          const titleValue = getFieldValue(phone.title);
          return generatePhoneSlug(titleValue as string);
        });
        const missingSlugs = slugs.filter(slug => !foundSlugs.includes(slug));
        console.warn(`❌ Missing phones for slugs:`, missingSlugs);
        console.log(`📱 Available phone titles:`, processedPhones.map(phone => {
          const titleValue = getFieldValue(phone.title);
          return `"${titleValue}" -> "${generatePhoneSlug(titleValue as string)}"`;
        }));
      }
      
      return matchedPhones;
      
    } catch (error: any) {
      console.error('Error fetching mobile phones by slugs:', error);
      console.log('🔄 Attempting fallback strategy...');
      
      // FALLBACK STRATEGY: Try to fetch by common phone URLs
      try {
        const fallbackPhones: MobilePhone[] = [];
        
        for (const slug of slugs) {
          // Try common URL patterns for the slug
          const possibleUrls = [
            `/mobiles/${slug}`,
            `/mobile/${slug}`,
            `/${slug}`
          ];
          
          for (const url of possibleUrls) {
            try {
              const phone = await this.getMobilePhoneByURL(url);
              if (phone) {
                console.log(`✅ Fallback success: Found phone via URL ${url}`);
                fallbackPhones.push(phone);
                break; // Found it, stop trying URLs for this slug
              }
            } catch (urlError) {
              // Continue to next URL pattern
            }
          }
        }
        
        if (fallbackPhones.length > 0) {
          console.log(`🔄 Fallback found ${fallbackPhones.length} phones`);
          return fallbackPhones;
        }
      } catch (fallbackError) {
        console.error('Fallback strategy also failed:', fallbackError);
      }
      
      // Return empty array if all strategies failed
      return [];
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

      const navigationEntry = result[0][0];
      const entryWithEditTags = this.addEditableTagsToNavigationEntry(navigationEntry, 'navigation_menu');
      
      return entryWithEditTags;
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
      
      const navigationEntries = result[0] || [];
      const entriesWithEditTags = navigationEntries.map((entry: any) => 
        this.addEditableTagsToNavigationEntry(entry, 'navigation_menu')
      );
      
      return entriesWithEditTags;
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
        // Basic hero fields
        'hero_title', 'hero_subtitle', 'hero_badge_text', 'hero_title_highlight',
        'hero_primary_button_text', 'hero_secondary_button_text',
        
        // Hero stats fields (MISSING - this was the root cause!)
        'hero_stat_1_number', 'hero_stat_1_label',
        'hero_stat_2_number', 'hero_stat_2_label', 
        'hero_stat_3_number', 'hero_stat_3_label',
        
        // Hero phone showcase fields
        'hero_phone_1_name', 'hero_phone_2_name', 'hero_vs_text',
        'hero_spec_1_label', 'hero_spec_1_phone_1_value', 'hero_spec_1_phone_2_value',
        'hero_spec_2_label', 'hero_spec_2_phone_1_value', 'hero_spec_2_phone_2_value',
        'hero_spec_3_label', 'hero_spec_3_phone_1_value', 'hero_spec_3_phone_2_value',
        
        // Features section fields
        'features_section_title', 'features_section_subtitle',
        'feature_1_title', 'feature_1_description', 'feature_2_title', 'feature_2_description',
        'feature_3_title', 'feature_3_description', 'feature_4_title', 'feature_4_description',
        'feature_5_title', 'feature_5_description', 'feature_6_title', 'feature_6_description',
        
        // Comparisons section fields
        'comparisons_section_title', 'comparisons_section_subtitle',
        'comparisons_view_all_button_text', 'comparison_card_button_text',
        'comparison_vs_text', 'comparison_phone_placeholder',
        'comparison_1_title', 'comparison_1_description', 'comparison_1_phone_1', 'comparison_1_phone_2',
        'comparison_2_title', 'comparison_2_description', 'comparison_2_phone_1', 'comparison_2_phone_2',
        'comparison_3_title', 'comparison_3_description', 'comparison_3_phone_1', 'comparison_3_phone_2',
        
        // Stats section fields  
        'stats_section_title', 'stats_section_subtitle',
        'stat_1_value', 'stat_1_label', 'stat_1_description',
        'stat_2_value', 'stat_2_label', 'stat_2_description',
        'stat_3_value', 'stat_3_label', 'stat_3_description',
        'stat_4_value', 'stat_4_label', 'stat_4_description',
        
        // Badge text fields
        'badge_trending_text', 'badge_hot_text', 'badge_popular_text',
        
        // CTA fields
        'cta_title', 'cta_description', 'cta_button_text'
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

  // Add editable tags to navigation menu entries for Visual Builder
  private addEditableTagsToNavigationEntry(entry: ContentstackEntry, contentTypeUid: string): any {
    if (!entry) {
      return entry;
    }

    try {
      console.log('🏷️ Adding edit tags to Navigation Menu content');
      
      // Use Utils.addEditableTags with the shared Stack instance
      Utils.addEditableTags(entry as any, contentTypeUid, true);
      
      const locale = 'en-us';
      const entryUid = entry.uid || '';
      
      // Helper function to safely add edit tags
      const addEditTag = (fieldPath: string): EditableTagsConfig => ({
        'data-cslp': `${contentTypeUid}.${entryUid}.${locale}.${fieldPath}`
      });
      
      // Navigation menu fields that need edit tags
      const editableFields = [
        'menu_type', 'menu_title',
        'menu_item_1_label', 'menu_item_1_description', 'menu_item_1_url', 'menu_item_1_icon',
        'menu_item_2_label', 'menu_item_2_description', 'menu_item_2_url', 'menu_item_2_icon',
        'menu_item_3_label', 'menu_item_3_description', 'menu_item_3_url', 'menu_item_3_icon',
        'menu_item_4_label', 'menu_item_4_description', 'menu_item_4_url', 'menu_item_4_icon',
        'menu_item_5_label', 'menu_item_5_description', 'menu_item_5_url', 'menu_item_5_icon'
      ];
      
      editableFields.forEach(fieldName => {
        const fieldValue = (entry as any)[fieldName];
        if (fieldValue && typeof fieldValue === 'string') {
          (entry as any)[fieldName] = {
            value: fieldValue,
            $: addEditTag(fieldName)
          } as EditableField<string>;
        }
      });
      
      // Handle sub_items arrays for dropdown menus
      for (let i = 1; i <= 5; i++) {
        const subItemsField = `menu_item_${i}_sub_items`;
        const subItems = (entry as any)[subItemsField];
        
        if (subItems && Array.isArray(subItems)) {
          subItems.forEach((subItem: any, subIndex: number) => {
            if (subItem && typeof subItem === 'object') {
              const subFields = ['sub_label', 'sub_description', 'sub_url', 'sub_icon'];
              subFields.forEach(field => {
                const fieldValue = subItem[field];
                if (fieldValue && typeof fieldValue === 'string') {
                  subItem[field] = {
                    value: fieldValue,
                    $: addEditTag(`${subItemsField}.${subIndex}.${field}`)
                  } as EditableField<string>;
                }
              });
            }
          });
        }
      }
      
      console.log('✅ Navigation Menu edit tags added');
      return entry;
    } catch (error) {
      console.error('❌ Failed to add editable tags to Navigation Menu:', error);
      return entry;
    }
  }

  // Add editable tags to compare page entries for Visual Builder
  private addEditableTagsToComparePageEntry(entry: ContentstackEntry, contentTypeUid: string): any {
    if (!entry) {
      return entry;
    }

    try {
      console.log('🏷️ Adding edit tags to Compare Page content');
      
      // Use Utils.addEditableTags with the shared Stack instance
      Utils.addEditableTags(entry as any, contentTypeUid, true);
      
      const locale = 'en-us';
      const entryUid = entry.uid || '';
      
      // Helper function to safely add edit tags
      const addEditTag = (fieldPath: string): EditableTagsConfig => ({
        'data-cslp': `${contentTypeUid}.${entryUid}.${locale}.${fieldPath}`
      });
      
      // Compare page fields that need edit tags
      const editableFields = [
        'page_title', 'page_description',
        'page_header_main_title', 'page_header_subtitle', 'page_header_progress_current_step', 'page_header_progress_total_steps',
        'category_selection_section_title',
        'popular_comparisons_section_title', 'popular_comparisons_section_icon', 'popular_comparisons_browse_button_text',
        'help_section_help_title', 'help_section_help_description', 'help_section_help_icon', 'help_section_cta_button_text'
      ];
      
      editableFields.forEach(fieldName => {
        const fieldValue = (entry as any)[fieldName];
        if (fieldValue && typeof fieldValue === 'string') {
          (entry as any)[fieldName] = {
            value: fieldValue,
            $: addEditTag(fieldName)
          } as EditableField<string>;
        }
      });
      
      console.log('✅ Compare Page edit tags added');
      return entry;
    } catch (error) {
      console.error('❌ Failed to add editable tags to Compare Page:', error);
      return entry;
    }
  }

  // Add editable tags to comparison category entries for Visual Builder
  private addEditableTagsToComparisonCategoryEntry(entry: ContentstackEntry, contentTypeUid: string): any {
    if (!entry) {
      return entry;
    }

    try {
      console.log('🏷️ Adding edit tags to Comparison Category content');
      
      // Use Utils.addEditableTags with the shared Stack instance
      Utils.addEditableTags(entry as any, contentTypeUid, true);
      
      const locale = 'en-us';
      const entryUid = entry.uid || '';
      
      // Helper function to safely add edit tags
      const addEditTag = (fieldPath: string): EditableTagsConfig => ({
        'data-cslp': `${contentTypeUid}.${entryUid}.${locale}.${fieldPath}`
      });
      
      // Handle nested category_details object
      if (entry.category_details && typeof entry.category_details === 'object') {
        const categoryDetails = entry.category_details as any;
        
        // Add edit tags to category_details fields
        if (categoryDetails.category_title && typeof categoryDetails.category_title === 'string') {
          categoryDetails.category_title = {
            value: categoryDetails.category_title,
            $: addEditTag('category_details.category_title')
          } as EditableField<string>;
        }
        
        if (categoryDetails.description && typeof categoryDetails.description === 'string') {
          categoryDetails.description = {
            value: categoryDetails.description,
            $: addEditTag('category_details.description')
          } as EditableField<string>;
        }
        
        // Handle nested icon_config
        if (categoryDetails.icon_config && typeof categoryDetails.icon_config === 'object') {
          const iconConfig = categoryDetails.icon_config as any;
          
          if (iconConfig.icon_name && typeof iconConfig.icon_name === 'string') {
            iconConfig.icon_name = {
              value: iconConfig.icon_name,
              $: addEditTag('category_details.icon_config.icon_name')
            } as EditableField<string>;
          }
          
          if (iconConfig.icon_color && typeof iconConfig.icon_color === 'string') {
            iconConfig.icon_color = {
              value: iconConfig.icon_color,
              $: addEditTag('category_details.icon_config.icon_color')
            } as EditableField<string>;
          }
        }
      }
      
      // Handle nested availability object
      if (entry.availability && typeof entry.availability === 'object') {
        const availability = entry.availability as any;
        
        const availabilityFields = ['is_available', 'count_label', 'route_path'];
        availabilityFields.forEach(field => {
          const fieldValue = availability[field];
          if (fieldValue !== undefined && (typeof fieldValue === 'string' || typeof fieldValue === 'boolean' || typeof fieldValue === 'number')) {
            availability[field] = {
              value: fieldValue,
              $: addEditTag(`availability.${field}`)
            } as EditableField<any>;
          }
        });
      }
      
      // Handle nested cta_config object
      if (entry.cta_config && typeof entry.cta_config === 'object') {
        const ctaConfig = entry.cta_config as any;
        
        const ctaFields = ['available_button_text', 'unavailable_button_text'];
        ctaFields.forEach(field => {
          const fieldValue = ctaConfig[field];
          if (fieldValue && typeof fieldValue === 'string') {
            ctaConfig[field] = {
              value: fieldValue,
              $: addEditTag(`cta_config.${field}`)
            } as EditableField<string>;
          }
        });
      }
      
      // Handle top-level fields
      const topLevelFields = ['category_id', 'display_priority'];
      topLevelFields.forEach(fieldName => {
        const fieldValue = (entry as any)[fieldName];
        if (fieldValue && (typeof fieldValue === 'string' || typeof fieldValue === 'number')) {
          (entry as any)[fieldName] = {
            value: fieldValue,
            $: addEditTag(fieldName)
          } as EditableField<any>;
        }
      });
      
      console.log('✅ Comparison Category edit tags added');
      return entry;
    } catch (error) {
      console.error('❌ Failed to add editable tags to Comparison Category:', error);
      return entry;
    }
  }

  // Add editable tags to featured comparison entries for Visual Builder
  private addEditableTagsToFeaturedComparisonEntry(entry: ContentstackEntry, contentTypeUid: string): any {
    if (!entry) {
      return entry;
    }

    try {
      console.log('🏷️ Adding edit tags to Featured Comparison content');
      
      // Use Utils.addEditableTags with the shared Stack instance
      Utils.addEditableTags(entry as any, contentTypeUid, true);
      
      const locale = 'en-us';
      const entryUid = entry.uid || '';
      
      // Helper function to safely add edit tags
      const addEditTag = (fieldPath: string): EditableTagsConfig => ({
        'data-cslp': `${contentTypeUid}.${entryUid}.${locale}.${fieldPath}`
      });
      
      // Handle nested comparison_details object
      if (entry.comparison_details && typeof entry.comparison_details === 'object') {
        const comparisonDetails = entry.comparison_details as any;
        
        const detailFields = ['comparison_title', 'category_label', 'route_path'];
        detailFields.forEach(field => {
          const fieldValue = comparisonDetails[field];
          if (fieldValue && typeof fieldValue === 'string') {
            comparisonDetails[field] = {
              value: fieldValue,
              $: addEditTag(`comparison_details.${field}`)
            } as EditableField<string>;
          }
        });
      }
      
      // Handle nested popularity_badge object
      if (entry.popularity_badge && typeof entry.popularity_badge === 'object') {
        const popularityBadge = entry.popularity_badge as any;
        
        if (popularityBadge.badge_type && typeof popularityBadge.badge_type === 'string') {
          popularityBadge.badge_type = {
            value: popularityBadge.badge_type,
            $: addEditTag('popularity_badge.badge_type')
          } as EditableField<string>;
        }
      }
      
      // Handle top-level fields
      const topLevelFields = ['display_priority'];
      topLevelFields.forEach(fieldName => {
        const fieldValue = (entry as any)[fieldName];
        if (fieldValue && typeof fieldValue === 'number') {
          (entry as any)[fieldName] = {
            value: fieldValue,
            $: addEditTag(fieldName)
          } as EditableField<number>;
        }
      });
      
      console.log('✅ Featured Comparison edit tags added');
      return entry;
    } catch (error) {
      console.error('❌ Failed to add editable tags to Featured Comparison:', error);
      return entry;
    }
  }

  // OFFICIAL PATTERN: Fetch Home Page content with variant aliases
  async getHomePageContentWithVariants(variantAliases: string[]): Promise<HomePageContent> {
    try {
      console.log('📄 Fetching Home Page content from Contentstack with variant aliases');
      console.log('🔧 Environment:', process.env.REACT_APP_CONTENTSTACK_ENVIRONMENT);
      console.log('🔧 Preview mode:', process.env.REACT_APP_CONTENTSTACK_LIVE_PREVIEW);
      console.log('🎯 Variant aliases:', variantAliases);
      
      let entryCall = this.stack.ContentType('home_page').Query();
      
      let result;
      // OFFICIAL PATTERN: Use variant aliases directly from getVariantAliases()
      if (variantAliases && variantAliases.length > 0 && shouldPersonalizeContent('home_page')) {
        try {
          const variantAlias = variantAliases.join(',');
          result = await entryCall.variants(variantAlias).toJSON().find();
          console.log('✅ Fetched personalized content with variants:', variantAlias);
        } catch (error) {
          // Fallback to regular fetch if variant fetching fails
          logPersonalizeEvent('HOME_PAGE_VARIANT_FETCH_FALLBACK', { variantAliases, error }, 'warn');
          result = await entryCall.toJSON().find();
          console.log('⚠️ Fallback to default content due to variant fetch error');
        }
      } else {
        result = await entryCall.toJSON().find();
        console.log('📄 Fetched default content (no variants available)');
      }
      
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
      
      console.log('✅ Home Page content with variants fetched successfully');
      return contentWithEditTags;
    } catch (error: any) {
      const appError = ErrorFactory.fromUnknown(error, { 
        operation: 'getHomePageContentWithVariants',
        contentType: 'home_page',
        variantAliases
      });
      ErrorHandler.log(appError);
      throw appError;
    }
  }

  // Legacy method for backward compatibility
  async getHomePageContent(variantParam?: string): Promise<HomePageContent> {
    // Convert to variant aliases approach for consistency
    let variantAliases: string[] = [];
    
    if (variantParam) {
      try {
        const Personalize = require('@contentstack/personalize-edge-sdk');
        variantAliases = Personalize.variantParamToVariantAliases(variantParam);
      } catch (error) {
        console.warn('Failed to convert variant param to aliases:', error);
      }
    }
    
    return this.getHomePageContentWithVariants(variantAliases);
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

  // Personalized content methods
  
  // Get personalized mobile phone recommendations
  async getPersonalizedMobilePhoneRecommendations(
    userAttributes: Record<string, any>,
    variantParam?: string,
    limit: number = 10
  ): Promise<MobilePhone[]> {
    try {
      let Query = this.stack.ContentType('mobiles').Query();
      
      // Add personalization parameters
      if (variantParam && shouldPersonalizeContent('mobiles')) {
        Query = this.addPersonalizationToQuery(Query, variantParam);
      }
      
      // Apply user-based filtering (simplified for Contentstack SDK compatibility)
      if (userAttributes.preferredBrand) {
        // Note: This would require proper taxonomy filtering in a real implementation
        console.log('Filtering by preferred brand:', userAttributes.preferredBrand);
      }
      
      Query.limit(limit);
      Query.descending('updated_at');
      
      const result = await Query.includeReference().toJSON().find();
      
      if (!result || !Array.isArray(result) || result.length === 0) {
        return [];
      }
      
      const phones = Array.isArray(result[0]) ? result[0] : [];
      
      logPersonalizeEvent('PERSONALIZED_RECOMMENDATIONS_FETCHED', {
        userAttributes,
        variantParam,
        count: phones.length
      });
      
      return phones.map((phone: any) => this.addEditableTagsToEntry(phone, 'mobiles'));
    } catch (error: any) {
      console.error('Error fetching personalized mobile phone recommendations:', error);
      
      // Fallback to regular recommendations
      return this.getAllMobilePhones(variantParam);
    }
  }
  
  // Get personalized featured comparisons
  async getPersonalizedFeaturedComparisons(
    userAttributes: Record<string, any>,
    variantParam?: string
  ): Promise<any[]> {
    try {
      let Query = this.stack.ContentType('featured_comparisons').Query();
      
      // Add personalization parameters
      if (variantParam && shouldPersonalizeContent('featured_comparisons')) {
        Query = this.addPersonalizationToQuery(Query, variantParam);
      }
      
      // Apply user-based filtering (simplified for Contentstack SDK compatibility)
      if (userAttributes.preferredBrand) {
        console.log('Filtering featured comparisons by preferred brand:', userAttributes.preferredBrand);
      }
      
      if (userAttributes.priceRange) {
        console.log('Filtering featured comparisons by price range:', userAttributes.priceRange);
      }
      
      Query.limit(6);
      Query.descending('updated_at');
      
      const result = await Query.includeReference().toJSON().find();
      
      if (!result || !Array.isArray(result) || result.length === 0) {
        return [];
      }
      
      logPersonalizeEvent('PERSONALIZED_FEATURED_COMPARISONS_FETCHED', {
        userAttributes,
        variantParam,
        count: result[0]?.length || 0
      });
      
      return result[0] || [];
    } catch (error: any) {
      console.error('Error fetching personalized featured comparisons:', error);
      return [];
    }
  }
  
  // Execute a generic personalized query
  async executePersonalizedContentQuery<T>(
    contentType: string,
    queryParams: Record<string, any> = {},
    variantParam?: string
  ): Promise<T[]> {
    try {
      const personalizedQuery: PersonalizedQuery = {
        contentType,
        query: queryParams,
        variantParams: variantParam ? { cs_personalize_variant: variantParam } : undefined,
        includePersonalization: true
      };
      
      const response = await this.executePersonalizedQuery<T[]>(personalizedQuery);
      
      logPersonalizeEvent('PERSONALIZED_CONTENT_QUERY_EXECUTED', {
        contentType,
        queryParams,
        variantParam,
        isPersonalized: response.personalization?.isPersonalized || false
      });
      
      return Array.isArray(response.content) ? response.content : [response.content];
    } catch (error: any) {
      console.error('Error executing personalized content query:', error);
      throw error;
    }
  }
  
  // Check if personalization is enabled for this service
  isPersonalizationEnabled(): boolean {
    return this.personalizationEnabled;
  }

  // Fetch Hero Phone Showcase data
  async getHeroPhoneShowcase(showcaseUID: string): Promise<any> {
    try {
      console.log('🎯 Fetching Hero Phone Showcase');
      
      const showcaseEntry = await this.stack.ContentType('hero_phone_showcase').Entry(showcaseUID).includeReference().toJSON().fetch();
      
      if (!showcaseEntry) {
        throw new Error('Hero Phone Showcase not found');
      }

      // Fetch phone comparison specs
      const specsQuery = this.stack.ContentType('phone_comparison_spec').Query();
      const specsResult = await specsQuery.includeReference().toJSON().find();
      
      const specs = Array.isArray(specsResult[0]) ? specsResult[0] : [];
      
      return {
        ...showcaseEntry,
        specifications: specs
      };
    } catch (error: any) {
      console.error('Error fetching Hero Phone Showcase:', error);
      throw error;
    }
  }

  // Fetch mobile phone data by UID for hero showcase
  async getMobilePhoneForHero(phoneUID: string): Promise<any> {
    try {
      const phoneEntry = await this.stack.ContentType('mobiles').Entry(phoneUID).toJSON().fetch();
      
      if (!phoneEntry) {
        return {
          uid: phoneUID,
          title: 'Unknown Phone',
          icon: '📱'
        };
      }

      return {
        uid: phoneEntry.uid,
        title: phoneEntry.title,
        icon: '📱' // Default icon for now
      };
    } catch (error) {
      console.error('Error fetching phone for hero:', error);
      return {
        uid: phoneUID,
        title: 'Unknown Phone',
        icon: '📱'
      };
    }
  }

  // Fetch Compare Page content
  async getComparePageContent(): Promise<any> {
    try {
      console.log('🎯 Fetching Compare Page content');
      
      const pageQuery = this.stack.ContentType('compare_page_builder').Query();
      pageQuery.where('url', '/compare');
      const pageResult = await pageQuery.includeReference().toJSON().find();
      
      if (!pageResult || !Array.isArray(pageResult) || pageResult.length === 0) {
        throw new Error('Compare page content not found');
      }

      const [entries] = pageResult;
      if (!Array.isArray(entries) || entries.length === 0) {
        throw new Error('Compare page entries not found');
      }

      const comparePageEntry = entries[0];
      const entryWithEditTags = this.addEditableTagsToComparePageEntry(comparePageEntry, 'compare_page_builder');
      
      return entryWithEditTags;
    } catch (error: any) {
      console.error('Error fetching Compare Page content:', error);
      throw error;
    }
  }

  // Fetch all comparison categories
  async getComparisonCategories(): Promise<any[]> {
    try {
      console.log('🎯 Fetching Comparison Categories');
      
      const categoriesQuery = this.stack.ContentType('comparison_category').Query();
      const categoriesResult = await categoriesQuery.includeReference().toJSON().find();
      
      if (!categoriesResult || !Array.isArray(categoriesResult) || categoriesResult.length === 0) {
        return [];
      }

      const [entries] = categoriesResult;
      const categoriesWithEditTags = Array.isArray(entries) 
        ? entries.map((entry: any) => this.addEditableTagsToComparisonCategoryEntry(entry, 'comparison_category'))
        : [];
      
      return categoriesWithEditTags;
    } catch (error: any) {
      console.error('Error fetching Comparison Categories:', error);
      return [];
    }
  }

  // Fetch featured comparisons
  async getFeaturedComparisons(): Promise<any[]> {
    try {
      console.log('🎯 Fetching Featured Comparisons');
      
      const comparisonsQuery = this.stack.ContentType('featured_comparison').Query();
      comparisonsQuery.ascending('display_priority');
      const comparisonsResult = await comparisonsQuery.includeReference().toJSON().find();
      
      if (!comparisonsResult || !Array.isArray(comparisonsResult) || comparisonsResult.length === 0) {
        return [];
      }

      const [entries] = comparisonsResult;
      const comparisonsWithEditTags = Array.isArray(entries) 
        ? entries.map((entry: any) => this.addEditableTagsToFeaturedComparisonEntry(entry, 'featured_comparison'))
        : [];
      
      return comparisonsWithEditTags;
    } catch (error: any) {
      console.error('Error fetching Featured Comparisons:', error);
      return [];
    }
  }
  
  // Get personalization-aware content with fallback
  async getContentWithPersonalization<T>(
    contentType: string,
    uid: string,
    variantParam?: string,
    fallbackContent?: T
  ): Promise<T> {
    try {
      if (!this.personalizationEnabled || !variantParam) {
        // Fallback to regular content fetching
        const Query = this.stack.ContentType(contentType).Entry(uid);
        const result = await Query.includeReference().toJSON().fetch();
        return result as T;
      }
      
      const personalizedQuery: PersonalizedQuery = {
        contentType,
        uid,
        variantParams: { cs_personalize_variant: variantParam },
        includePersonalization: true
      };
      
      const response = await this.executePersonalizedQuery<T>(personalizedQuery);
      
      logPersonalizeEvent('PERSONALIZED_CONTENT_FETCHED', {
        contentType,
        uid,
        variantParam,
        isPersonalized: response.personalization?.isPersonalized || false
      });
      
      return response.content;
    } catch (error: any) {
      console.error('Error fetching personalized content:', error);
      
      // Return fallback content if provided
      if (fallbackContent) {
        return fallbackContent;
      }
      
      throw error;
    }
  }
}

const contentstackService = new ContentstackService();
export default contentstackService;