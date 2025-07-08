import { MobilePhone, getFieldValue } from '../types/MobilePhone';

export interface SummaryRequest {
  phones: MobilePhone[];
  userPreferences?: {
    budget?: number;
    priorityFeatures?: string[];
    usage?: 'photography' | 'gaming' | 'business' | 'general';
  };
}

export interface SummaryResponse {
  summary: string;
  keyDifferences: string[];
  recommendation: {
    winner: string;
    reason: string;
    score: number;
  };
  prosAndCons: {
    [phoneName: string]: {
      pros: string[];
      cons: string[];
    };
  };
}

class SummaryService {
  private readonly webhookUrl: string;
  private readonly authKey: string;
  private readonly cache: Map<string, { data: any; timestamp: number }>;
  private readonly cacheTimeout: number = 5 * 60 * 1000; // 5 minutes

  constructor() {
    // This would be configured in your Contentstack Automation Hub
    this.webhookUrl = process.env.REACT_APP_CONTENTSTACK_WEBHOOK_URL || '';
    this.authKey = 'U4)arzhjy'; // The auth key from your HTTP trigger setup
    this.cache = new Map();
    
  }

  async generateSummary(request: SummaryRequest): Promise<any> {
    // Validate input
    if (!request.phones || request.phones.length < 2) {
      throw new Error('At least 2 phones are required for comparison');
    }

    // Validate webhook URL is configured
    if (!this.webhookUrl || this.webhookUrl.includes('your-webhook-url-here') || this.webhookUrl === '') {
      throw new Error('Contentstack webhook URL is not configured. Please set REACT_APP_CONTENTSTACK_WEBHOOK_URL in your .env file with your actual Contentstack Automation Hub webhook URL.');
    }

    // Generate cache key based on phone names and specs
    const cacheKey = this.generateCacheKey(request);
    
    // Check cache first
    const cachedResult = this.getCachedResult(cacheKey);
    if (cachedResult) {
      console.log('Returning cached Contentstack response');
      return cachedResult;
    }


    try {
      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ah-http-key': this.authKey, // Auth key for secure HTTP trigger
        },
        body: JSON.stringify({
          action: 'generate_summary',
          data: {
            phones: request.phones.map(phone => {
              try {
                return {
                  name: getFieldValue(phone.title) || 'Unknown Phone',
                  specifications: getFieldValue(phone.specifications) || {},
                  price: getFieldValue(phone.variants)?.[0]?.price || 0,
                  brand: phone.taxonomies?.find(t => t.taxonomy_uid)?.term_uid || 'Unknown Brand',
                  images: phone.lead_image?.url || ''
                };
              } catch (error) {
                console.warn('Error extracting phone data:', error);
                return {
                  name: 'Unknown Phone',
                  specifications: {},
                  price: 0,
                  brand: 'Unknown Brand',
                  images: ''
                };
              }
            }),
            userPreferences: request.userPreferences
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Contentstack webhook failed with status: ${response.status} ${response.statusText}`);
      }

      // Get the raw text response from Contentstack
      const textResponse = await response.text();
      
      // Try to parse as JSON first, if it fails, treat as plain text
      let data;
      try {
        data = JSON.parse(textResponse);
      } catch (error) {
        // If not valid JSON, wrap the text response in an object
        data = {
          response: textResponse,
          type: "text",
          timestamp: new Date().toISOString()
        };
      }
      
      // Cache and return the response from Contentstack
      this.setCachedResult(cacheKey, data);
      return data;
      
    } catch (error) {
      console.error('Error calling Contentstack webhook:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Failed to get response from Contentstack: ${errorMessage}`);
    }
  }


  private generateCacheKey(request: SummaryRequest): string {
    try {
      // Create a hash-like key based on phone names and key specs
      const phoneKeys = request.phones.map(phone => {
        const specs = getFieldValue(phone.specifications) || {};
        const title = getFieldValue(phone.title) || 'unknown';
        return `${title}-${specs.ram}-${specs.storage}-${specs.rear_camera}`;
      }).sort().join('|');
      
      // Use Unicode-safe hash generation instead of btoa
      return this.createSafeHash(phoneKeys).substring(0, 32);
    } catch (error) {
      console.warn('Cache key generation failed, using fallback:', error);
      // Fallback to timestamp-based key
      return `fallback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
  }

  private createSafeHash(input: string): string {
    // Simple hash function that works with Unicode characters
    let hash = 0;
    
    // Use encodeURIComponent to handle Unicode safely
    const safeInput = encodeURIComponent(input);
    
    for (let i = 0; i < safeInput.length; i++) {
      const char = safeInput.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    // Convert to positive string and add prefix for readability
    const hashString = Math.abs(hash).toString(36);
    return `ph_${hashString}`;
  }

  private getCachedResult(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    // Check if cache is still valid
    if (Date.now() - cached.timestamp > this.cacheTimeout) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  private setCachedResult(key: string, data: any): void {
    // Clean up old cache entries if cache gets too large
    if (this.cache.size > 50) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }
}

export default new SummaryService();