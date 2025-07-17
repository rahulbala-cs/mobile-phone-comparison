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
      
      // We'll fetch a limited set and filter by slug matching
      // This is more reliable than complex title pattern matching
      
      let Query = this.stack.ContentType('mobiles').Query();
      
      // Note: We could use regex matching but it's complex and slug-based matching is more reliable
      
      // Fetch a reasonable subset of phones that might match
      Query.limit(50); // Limit to reasonable number instead of all phones
      
      // Add personalization parameters if provided
      if (variantParam && shouldPersonalizeContent('mobiles')) {
        Query = this.addPersonalizationToQuery(Query, variantParam);
      }
      
      const result = await Query.includeReference().toJSON().find();
      
      if (!result || !Array.isArray(result) || result.length === 0) {
        return [];
      }
      
      const phones = Array.isArray(result[0]) ? result[0] : [];
      const processedPhones = phones.map((phone: any) => this.addEditableTagsToEntry(phone, 'mobiles'));
      
      // Now filter the results to match our specific slugs
      const { generatePhoneSlug } = await import('../utils/urlUtils');
      const matchedPhones: MobilePhone[] = [];
      
      for (const slug of slugs) {
        const matchedPhone = processedPhones.find((phone: MobilePhone) => 
          phone.title && generatePhoneSlug(phone.title) === slug
        );
        if (matchedPhone) {
          matchedPhones.push(matchedPhone);
        }
      }
      
      return matchedPhones;
      
    } catch (error: any) {
      console.error('Error fetching mobile phones by slugs:', error);
      
      // Fallback to individual fetches by URL if batch fails
      const { generatePhoneSlug } = await import('../utils/urlUtils');
      const matchedPhones: MobilePhone[] = [];
      
      for (const slug of slugs) {
        try {
          // Try to find phone by constructing likely URL patterns
          const possibleUrls = [
            `/${slug}`,
            `/mobiles/${slug}`,
            slug
          ];
          
          for (const url of possibleUrls) {
            try {
              const phone = await this.getMobilePhoneByURL(url, variantParam);
              if (phone && generatePhoneSlug(phone.title) === slug) {
                matchedPhones.push(phone);
                break;
              }
            } catch {
              // Continue to next URL pattern
            }
          }
        } catch {
          // Skip phone if not found
        }
      }
      
      return matchedPhones;
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