/**
 * Contentstack Personalize API Endpoints for Different Regions
 * 
 * Helper utility to test different API endpoints based on region
 */

export const PERSONALIZE_API_ENDPOINTS = {
  // AWS North America (Default)
  AWS_US: 'https://personalize-edge.contentstack.com',
  
  // AWS Europe
  AWS_EU: 'https://eu-personalize-edge.contentstack.com',
  
  // AWS Australia
  AWS_AU: 'https://au-personalize-edge.contentstack.com',
  
  // Azure North America
  AZURE_NA: 'https://azure-na-personalize-edge.contentstack.com',
  
  // Azure Europe
  AZURE_EU: 'https://azure-eu-personalize-edge.contentstack.com',
  
  // GCP North America
  GCP_NA: 'https://gcp-na-personalize-edge.contentstack.com',
  
  // GCP Europe
  GCP_EU: 'https://gcp-eu-personalize-edge.contentstack.com'
};

export const ENDPOINT_REGIONS = Object.keys(PERSONALIZE_API_ENDPOINTS) as Array<keyof typeof PERSONALIZE_API_ENDPOINTS>;

/**
 * Test connectivity to all available API endpoints to find the correct one
 */
interface ApiEndpointTestResult {
  region: string;
  endpoint: string;
  success: boolean;
  statusCode?: number;
  error?: string;
  responseTime?: number;
  manifestData?: any;
}

/**
 * Generate a personalize user UID for testing (simple UUID-like format)
 */
const generatePersonalizeUserUid = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : ((r & 0x3) | 0x8);
    return v.toString(16);
  });
};

export const testAllApiEndpoints = async (projectUid: string): Promise<{
  results: ApiEndpointTestResult[];
  workingEndpoints: string[];
  bestEndpoint?: string;
}> => {
  const results = [];
  const workingEndpoints = [];
  const testUserUid = generatePersonalizeUserUid();
  
  console.log('🌐 Testing all Personalize API endpoints for project:', projectUid);
  console.log('📋 Using test user UID:', testUserUid);
  
  for (const [region, endpoint] of Object.entries(PERSONALIZE_API_ENDPOINTS)) {
    const startTime = Date.now();
    
    try {
      const url = `${endpoint}/manifest`;
      console.log(`  Testing ${region}: ${url}`);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Contentstack-Personalize-React-App',
          'x-project-uid': projectUid,
          'x-cs-personalize-user-uid': testUserUid
        },
        // Add timeout to prevent hanging
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });
      
      const responseTime = Date.now() - startTime;
      
      const result: ApiEndpointTestResult = {
        region,
        endpoint,
        success: response.ok,
        statusCode: response.status,
        responseTime
      };
      
      if (response.ok) {
        try {
          const manifestData = await response.json();
          result.manifestData = manifestData;
          console.log(`  ✅ ${region}: SUCCESS (${responseTime}ms) - Found ${manifestData.experiences?.length || 0} experiences`);
          workingEndpoints.push(endpoint);
        } catch (jsonError) {
          result.success = false;
          result.error = 'Invalid JSON response';
          console.log(`  ❌ ${region}: FAILED - Invalid JSON response`);
        }
      } else {
        const errorText = await response.text().catch(() => '');
        result.error = `HTTP ${response.status}: ${response.statusText}${errorText ? ` - ${errorText}` : ''}`;
        console.log(`  ❌ ${region}: FAILED - ${result.error}`);
      }
      
      results.push(result);
      
    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      const result: ApiEndpointTestResult = {
        region,
        endpoint,
        success: false,
        error: error.message || 'Network error',
        responseTime
      };
      
      console.log(`  ❌ ${region}: ERROR - ${result.error} (${responseTime}ms)`);
      results.push(result);
    }
  }
  
  // Find the best endpoint (fastest working one)
  const workingResults = results.filter(r => r.success);
  const bestEndpoint = workingResults.length > 0 
    ? workingResults.sort((a, b) => (a.responseTime || Infinity) - (b.responseTime || Infinity))[0].endpoint
    : undefined;
  
  console.log('🎯 API Endpoint Test Summary:', {
    totalTested: results.length,
    working: workingEndpoints.length,
    bestEndpoint,
    workingEndpoints
  });
  
  return {
    results,
    workingEndpoints,
    bestEndpoint
  };
};

/**
 * Test manifest endpoint for a specific API URL
 */
export const testManifestEndpoint = async (endpoint: string, projectUid: string): Promise<{
  success: boolean;
  statusCode?: number;
  data?: any;
  error?: string;
}> => {
  try {
    const url = `${endpoint}/manifest`;
    const testUserUid = generatePersonalizeUserUid();
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Contentstack-Personalize-React-App',
        'x-project-uid': projectUid,
        'x-cs-personalize-user-uid': testUserUid
      },
      signal: AbortSignal.timeout(10000)
    });
    
    if (response.ok) {
      const data = await response.json();
      return {
        success: true,
        statusCode: response.status,
        data
      };
    } else {
      const errorText = await response.text().catch(() => '');
      return {
        success: false,
        statusCode: response.status,
        error: `HTTP ${response.status}: ${response.statusText}${errorText ? ` - ${errorText}` : ''}`
      };
    }
    
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Network error'
    };
  }
};