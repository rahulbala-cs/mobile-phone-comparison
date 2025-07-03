import * as Contentstack from 'contentstack';
import { MobilePhone } from '../types/MobilePhone';

class ContentstackService {
  private stack: any;

  constructor() {
    this.stack = Contentstack.Stack({
      api_key: process.env.REACT_APP_CONTENTSTACK_API_KEY!,
      delivery_token: process.env.REACT_APP_CONTENTSTACK_DELIVERY_TOKEN!,
      environment: process.env.REACT_APP_CONTENTSTACK_ENVIRONMENT!,
      region: process.env.REACT_APP_CONTENTSTACK_REGION === 'EU' ? Contentstack.Region.EU : 
             process.env.REACT_APP_CONTENTSTACK_REGION === 'AZURE_NA' ? Contentstack.Region.AZURE_NA :
             process.env.REACT_APP_CONTENTSTACK_REGION === 'AZURE_EU' ? Contentstack.Region.AZURE_EU :
             process.env.REACT_APP_CONTENTSTACK_REGION === 'GCP_NA' ? Contentstack.Region.GCP_NA :
             Contentstack.Region.US
    });
  }

  // Fetch mobile phone by UID
  async getMobilePhoneByUID(uid: string): Promise<MobilePhone> {
    try {
      console.log('Fetching mobile phone with UID:', uid);
      console.log('Environment:', process.env.REACT_APP_CONTENTSTACK_ENVIRONMENT);
      
      const Query = this.stack.ContentType('mobiles').Entry(uid);
      const result = await Query.includeReference().toJSON().fetch();
      
      console.log('API Response:', result);
      
      if (!result) {
        throw new Error(`Mobile phone with UID ${uid} not found`);
      }

      return result as MobilePhone;
    } catch (error: any) {
      console.error('Error fetching mobile phone:', error);
      throw new Error(error.message || 'Failed to fetch mobile phone data');
    }
  }

  // Fetch mobile phone by URL field
  async getMobilePhoneByURL(url: string): Promise<MobilePhone> {
    try {
      console.log('Fetching mobile phone with URL:', url);
      console.log('Environment:', process.env.REACT_APP_CONTENTSTACK_ENVIRONMENT);
      
      const Query = this.stack.ContentType('mobiles').Query();
      Query.where('url', url);
      const result = await Query.includeReference().toJSON().find();
      
      console.log('API Response for URL:', result);
      
      if (!result || !result[0] || result[0].length === 0) {
        throw new Error(`Mobile phone with URL ${url} not found`);
      }

      return result[0][0] as MobilePhone;
    } catch (error: any) {
      console.error('Error fetching mobile phone by URL:', error);
      throw new Error(error.message || 'Failed to fetch mobile phone data');
    }
  }

  // Fetch all mobile phones (for listing page)
  async getAllMobilePhones(): Promise<MobilePhone[]> {
    try {
      const Query = this.stack.ContentType('mobiles').Query();
      const result = await Query.includeReference().toJSON().find();
      
      return result[0] || [];
    } catch (error: any) {
      console.error('Error fetching mobile phones:', error);
      throw new Error(error.message || 'Failed to fetch mobile phones');
    }
  }

  // Fetch multiple mobile phones by UIDs (for related phones)
  async getMobilePhonesByUIDs(uids: string[]): Promise<MobilePhone[]> {
    try {
      if (!uids || uids.length === 0) return [];
      
      const Query = this.stack.ContentType('mobiles').Query();
      Query.containedIn('uid', uids);
      const result = await Query.includeReference().toJSON().find();
      
      return result[0] || [];
    } catch (error: any) {
      console.error('Error fetching mobile phones by UIDs:', error);
      throw new Error(error.message || 'Failed to fetch related mobile phones');
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