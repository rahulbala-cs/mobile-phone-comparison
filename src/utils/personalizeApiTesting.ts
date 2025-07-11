/**
 * Contentstack Personalize API Testing Utilities
 * 
 * Direct API testing to validate that variants exist at the infrastructure level
 * Based on official Contentstack Personalize Edge API documentation
 */

import { logPersonalizeEvent } from './personalizeUtils';

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

export interface PersonalizeApiTestResult {
  success: boolean;
  data?: any;
  error?: string;
  statusCode?: number;
  timestamp: string;
}

export interface ManifestResponse {
  experiences: ManifestExperience[];
  variants: ManifestVariant[];
  audiences: ManifestAudience[];
  project: {
    uid: string;
    name: string;
    environment: string;
  };
}

export interface ManifestExperience {
  uid: string;
  shortUid: string;
  title: string;
  status: 'active' | 'paused' | 'draft';
  variants: ManifestVariant[];
  audiences: string[];
  contentTypes: string[];
}

export interface ManifestVariant {
  uid: string;
  alias: string;
  title: string;
  isControl: boolean;
  trafficAllocation: number;
  experienceUid: string;
}

export interface ManifestAudience {
  uid: string;
  title: string;
  description?: string;
  rules: any[];
}

export interface PersonalizeApiConfig {
  projectUid: string;
  edgeApiUrl: string;
  environment: string;
}

/**
 * Get API configuration from environment
 */
export const getPersonalizeApiConfig = (): PersonalizeApiConfig => {
  const projectUid = process.env.REACT_APP_CONTENTSTACK_PERSONALIZE_PROJECT_UID;
  const edgeApiUrl = process.env.REACT_APP_CONTENTSTACK_PERSONALIZE_EDGE_API_URL || 'https://personalize-edge.contentstack.com';
  const environment = process.env.REACT_APP_CONTENTSTACK_ENVIRONMENT || 'production';
  
  if (!projectUid) {
    throw new Error('REACT_APP_CONTENTSTACK_PERSONALIZE_PROJECT_UID is required');
  }
  
  return {
    projectUid,
    edgeApiUrl,
    environment
  };
};

/**
 * Test basic API connectivity using manifest endpoint
 */
export const testApiConnectivity = async (): Promise<PersonalizeApiTestResult> => {
  try {
    const config = getPersonalizeApiConfig();
    const url = `${config.edgeApiUrl}/manifest`;
    const testUserUid = generatePersonalizeUserUid();
    
    console.log('🔍 Testing API connectivity:', {
      url,
      projectUid: config.projectUid,
      edgeApiUrl: config.edgeApiUrl,
      testUserUid
    });
    
    logPersonalizeEvent('API_CONNECTIVITY_TEST_STARTED', { url, testUserUid });
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Contentstack-Personalize-React-App',
        'x-project-uid': config.projectUid,
        'x-cs-personalize-user-uid': testUserUid
      }
    });
    
    const result: PersonalizeApiTestResult = {
      success: response.ok,
      statusCode: response.status,
      timestamp: new Date().toISOString()
    };
    
    if (response.ok) {
      try {
        result.data = await response.json();
        logPersonalizeEvent('API_CONNECTIVITY_TEST_SUCCESS', result);
        console.log('✅ API connectivity successful - Found', result.data?.experiences?.length || 0, 'experiences');
      } catch (jsonError) {
        result.success = false;
        result.error = 'Invalid JSON response';
        console.error('❌ API connectivity failed: Invalid JSON response');
        logPersonalizeEvent('API_CONNECTIVITY_TEST_FAILED', result, 'error');
      }
    } else {
      result.error = `HTTP ${response.status}: ${response.statusText}`;
      
      // Try to get response body for more details
      try {
        const errorBody = await response.text();
        if (errorBody) {
          result.error += ` - ${errorBody}`;
        }
      } catch (bodyError) {
        // Ignore body parsing errors
      }
      
      console.error('❌ API connectivity failed:', result);
      logPersonalizeEvent('API_CONNECTIVITY_TEST_FAILED', result, 'error');
    }
    
    return result;
  } catch (error: any) {
    const result: PersonalizeApiTestResult = {
      success: false,
      error: error.message || 'Network error',
      timestamp: new Date().toISOString()
    };
    
    console.error('❌ API connectivity error:', error);
    logPersonalizeEvent('API_CONNECTIVITY_TEST_ERROR', result, 'error');
    return result;
  }
};

/**
 * Fetch personalization manifest (experiences, variants, audiences)
 */
export const fetchPersonalizeManifest = async (): Promise<PersonalizeApiTestResult> => {
  try {
    const config = getPersonalizeApiConfig();
    const url = `${config.edgeApiUrl}/manifest`;
    const testUserUid = generatePersonalizeUserUid();
    
    logPersonalizeEvent('MANIFEST_FETCH_STARTED', { url, testUserUid });
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Contentstack-Personalize-React-App',
        'x-project-uid': config.projectUid,
        'x-cs-personalize-user-uid': testUserUid
      }
    });
    
    const result: PersonalizeApiTestResult = {
      success: response.ok,
      statusCode: response.status,
      timestamp: new Date().toISOString()
    };
    
    if (response.ok) {
      const manifestData = await response.json();
      result.data = manifestData;
      
      // Log detailed manifest analysis
      const analysis = analyzeManifest(manifestData);
      logPersonalizeEvent('MANIFEST_FETCH_SUCCESS', { 
        ...result,
        analysis 
      });
    } else {
      result.error = `HTTP ${response.status}: ${response.statusText}`;
      logPersonalizeEvent('MANIFEST_FETCH_FAILED', result, 'error');
    }
    
    return result;
  } catch (error: any) {
    const result: PersonalizeApiTestResult = {
      success: false,
      error: error.message || 'Network error',
      timestamp: new Date().toISOString()
    };
    
    logPersonalizeEvent('MANIFEST_FETCH_ERROR', result, 'error');
    return result;
  }
};

/**
 * Analyze manifest data for debugging
 */
export const analyzeManifest = (manifest: any): {
  experienceCount: number;
  variantCount: number;
  audienceCount: number;
  activeExperiences: number;
  contentTypes: string[];
  variantAliases: string[];
  hasHomePageExperience: boolean;
  detailedAnalysis: {
    experiences: any[];
    variants: any[];
    audiences: any[];
    experiencesByStatus: Record<string, number>;
    issues: string[];
    recommendations: string[];
  };
} => {
  const experiences = manifest.experiences || [];
  const variants = manifest.variants || [];
  const audiences = manifest.audiences || [];
  
  const activeExperiences = experiences.filter((exp: any) => exp.status === 'active').length;
  const contentTypes = Array.from(new Set(experiences.flatMap((exp: any) => exp.contentTypes || []))) as string[];
  const variantAliases = variants.map((variant: any) => variant.alias).filter(Boolean);
  const hasHomePageExperience = experiences.some((exp: any) => 
    exp.contentTypes && exp.contentTypes.includes('home_page')
  );
  
  // Detailed analysis for debugging
  const experiencesByStatus = experiences.reduce((acc: Record<string, number>, exp: any) => {
    acc[exp.status || 'unknown'] = (acc[exp.status || 'unknown'] || 0) + 1;
    return acc;
  }, {});
  
  const issues: string[] = [];
  const recommendations: string[] = [];
  
  // Identify configuration issues
  if (experiences.length === 0) {
    issues.push('No experiences found in manifest');
    recommendations.push('Create experiences in Contentstack Personalize dashboard');
  } else if (activeExperiences === 0) {
    issues.push('No active experiences found - experiences exist but are in draft/paused state');
    recommendations.push('Activate experiences in Contentstack Personalize dashboard');
  }
  
  if (variants.length === 0) {
    issues.push('No variants found in manifest');
    recommendations.push('Configure A/B testing variants for your experiences');
  }
  
  if (audiences.length === 0) {
    issues.push('No audiences found in manifest');
    recommendations.push('Create audience segments for user targeting');
  }
  
  if (!hasHomePageExperience) {
    issues.push('No experiences targeting home_page content type');
    recommendations.push('Configure experiences to target home_page content type');
  }
  
  // Check for potential targeting issues
  if (experiences.length > 0 && audiences.length === 0) {
    issues.push('Experiences without audience targeting - all users will get same variants');
    recommendations.push('Create audience segments to enable proper user targeting');
  }
  
  console.log('📊 Detailed Manifest Analysis:', {
    experienceCount: experiences.length,
    activeExperiences,
    experiencesByStatus,
    variantCount: variants.length,
    audienceCount: audiences.length,
    contentTypes,
    variantAliases,
    issues,
    recommendations
  });
  
  return {
    experienceCount: experiences.length,
    variantCount: variants.length,
    audienceCount: audiences.length,
    activeExperiences,
    contentTypes,
    variantAliases,
    hasHomePageExperience,
    detailedAnalysis: {
      experiences,
      variants,
      audiences,
      experiencesByStatus,
      issues,
      recommendations
    }
  };
};

/**
 * Test user attributes endpoint
 */
export const testUserAttributes = async (userAttributes: Record<string, any>): Promise<PersonalizeApiTestResult> => {
  try {
    const config = getPersonalizeApiConfig();
    const url = `${config.edgeApiUrl}/user-attributes`;
    const testUserUid = generatePersonalizeUserUid();
    
    logPersonalizeEvent('USER_ATTRIBUTES_TEST_STARTED', { url, userAttributes, testUserUid });
    
    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Contentstack-Personalize-React-App',
        'x-project-uid': config.projectUid,
        'x-cs-personalize-user-uid': testUserUid
      },
      body: JSON.stringify(userAttributes)
    });
    
    const result: PersonalizeApiTestResult = {
      success: response.ok,
      statusCode: response.status,
      timestamp: new Date().toISOString()
    };
    
    if (response.ok) {
      try {
        const responseData = await response.json();
        result.data = responseData;
        logPersonalizeEvent('USER_ATTRIBUTES_TEST_SUCCESS', result);
        console.log('✅ User attributes test successful');
      } catch (jsonError) {
        // Some endpoints may return 204 No Content
        if (response.status === 204) {
          result.data = { status: 'User attributes updated successfully' };
          logPersonalizeEvent('USER_ATTRIBUTES_TEST_SUCCESS', result);
          console.log('✅ User attributes test successful (204 No Content)');
        } else {
          result.success = false;
          result.error = 'Invalid JSON response';
          logPersonalizeEvent('USER_ATTRIBUTES_TEST_FAILED', result, 'error');
        }
      }
    } else {
      result.error = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const errorBody = await response.text();
        if (errorBody) {
          result.error += ` - ${errorBody}`;
        }
      } catch (bodyError) {
        // Ignore body parsing errors
      }
      logPersonalizeEvent('USER_ATTRIBUTES_TEST_FAILED', result, 'error');
    }
    
    return result;
  } catch (error: any) {
    const result: PersonalizeApiTestResult = {
      success: false,
      error: error.message || 'Network error',
      timestamp: new Date().toISOString()
    };
    
    logPersonalizeEvent('USER_ATTRIBUTES_TEST_ERROR', result, 'error');
    return result;
  }
};

/**
 * Test events tracking endpoint
 */
export const testEventsTracking = async (): Promise<PersonalizeApiTestResult> => {
  try {
    const config = getPersonalizeApiConfig();
    const url = `${config.edgeApiUrl}/events`;
    const testUserUid = generatePersonalizeUserUid();
    
    const testEvent = {
      type: 'impression',
      experienceUid: 'test-experience-uid',
      variantUid: 'test-variant-uid',
      timestamp: new Date().toISOString(),
      metadata: {
        testEvent: true,
        source: 'api-testing'
      }
    };
    
    // Events API expects an array of events, not a single event object
    const eventsArray = [testEvent];
    
    logPersonalizeEvent('EVENTS_TRACKING_TEST_STARTED', { url, testEvent, testUserUid });
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Contentstack-Personalize-React-App',
        'x-project-uid': config.projectUid,
        'x-cs-personalize-user-uid': testUserUid
      },
      body: JSON.stringify(eventsArray)
    });
    
    const result: PersonalizeApiTestResult = {
      success: response.ok,
      statusCode: response.status,
      timestamp: new Date().toISOString()
    };
    
    if (response.ok) {
      try {
        const responseData = await response.json();
        result.data = responseData;
        logPersonalizeEvent('EVENTS_TRACKING_TEST_SUCCESS', result);
        console.log('✅ Events tracking test successful');
      } catch (jsonError) {
        // Some endpoints may return 204 No Content
        if (response.status === 204) {
          result.data = { status: 'Event tracked successfully' };
          logPersonalizeEvent('EVENTS_TRACKING_TEST_SUCCESS', result);
          console.log('✅ Events tracking test successful (204 No Content)');
        } else {
          result.success = false;
          result.error = 'Invalid JSON response';
          logPersonalizeEvent('EVENTS_TRACKING_TEST_FAILED', result, 'error');
        }
      }
    } else {
      result.error = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const errorBody = await response.text();
        if (errorBody) {
          result.error += ` - ${errorBody}`;
        }
      } catch (bodyError) {
        // Ignore body parsing errors
      }
      logPersonalizeEvent('EVENTS_TRACKING_TEST_FAILED', result, 'error');
    }
    
    return result;
  } catch (error: any) {
    const result: PersonalizeApiTestResult = {
      success: false,
      error: error.message || 'Network error',
      timestamp: new Date().toISOString()
    };
    
    logPersonalizeEvent('EVENTS_TRACKING_TEST_ERROR', result, 'error');
    return result;
  }
};

/**
 * Run comprehensive API test suite
 */
export const runComprehensiveApiTests = async (): Promise<{
  connectivity: PersonalizeApiTestResult;
  manifest: PersonalizeApiTestResult;
  userAttributes: PersonalizeApiTestResult;
  eventsTracking: PersonalizeApiTestResult;
  summary: {
    totalTests: number;
    passedTests: number;
    failedTests: number;
    criticalIssues: string[];
    recommendations: string[];
  };
}> => {
  logPersonalizeEvent('COMPREHENSIVE_API_TEST_SUITE_STARTED', {});
  
  // Test 1: Basic connectivity (using manifest endpoint)
  const connectivity = await testApiConnectivity();
  
  // Test 2: Fetch manifest (same as connectivity but with detailed analysis)
  const manifest = await fetchPersonalizeManifest();
  
  // Test 3: Test user attributes endpoint
  const userAttributes = await testUserAttributes({
    device: 'desktop',
    location: 'us',
    userType: 'new_visitor',
    pageType: 'homepage',
    sessionStart: new Date().toISOString()
  });
  
  // Test 4: Test events tracking endpoint
  const eventsTracking = await testEventsTracking();
  
  // Analyze results
  const tests = [connectivity, manifest, userAttributes, eventsTracking];
  const passedTests = tests.filter(test => test.success).length;
  const failedTests = tests.length - passedTests;
  
  const criticalIssues: string[] = [];
  const recommendations: string[] = [];
  
  // Analyze critical issues
  if (!connectivity.success) {
    criticalIssues.push('TECHNICAL: API connectivity failed - check network and project configuration');
  }
  
  if (!manifest.success) {
    criticalIssues.push('TECHNICAL: Manifest fetch failed - experiences and variants cannot be loaded');
  } else if (manifest.data) {
    const analysis = analyzeManifest(manifest.data);
    if (analysis.experienceCount === 0) {
      criticalIssues.push('CONFIGURATION: No experiences found - create experiences in Contentstack Personalize dashboard');
    }
    if (analysis.variantCount === 0) {
      criticalIssues.push('CONFIGURATION: No variants found - configure A/B testing variants in dashboard');
    }
    if (analysis.activeExperiences === 0) {
      criticalIssues.push('CONFIGURATION: No active experiences - activate experiences in Contentstack dashboard');
    }
    if (!analysis.hasHomePageExperience) {
      criticalIssues.push('CONFIGURATION: No home_page experience - configure content type targeting in dashboard');
    }
  }
  
  if (!userAttributes.success) {
    criticalIssues.push('TECHNICAL: User attributes endpoint failed - user targeting not working');
  }
  
  if (!eventsTracking.success) {
    criticalIssues.push('TECHNICAL: Events tracking endpoint failed - check API format or connectivity');
  }
  
  // Generate recommendations based on issue types
  const hasConfigurationIssues = criticalIssues.some(issue => issue.startsWith('CONFIGURATION:'));
  const hasTechnicalIssues = criticalIssues.some(issue => issue.startsWith('TECHNICAL:'));
  
  if (criticalIssues.length === 0) {
    recommendations.push('✅ API infrastructure working correctly');
    recommendations.push('✅ All core Personalize Edge API endpoints functional');
    recommendations.push('✅ Personalization fully configured and ready');
  } else {
    if (hasConfigurationIssues) {
      recommendations.push('📋 DASHBOARD ACTION REQUIRED: Complete configuration in Contentstack Personalize dashboard');
      recommendations.push('📋 See PERSONALIZATION_SETUP_GUIDE.md for step-by-step instructions');
      recommendations.push('📋 Activate experiences, configure variants, and create audience segments');
    }
    if (hasTechnicalIssues) {
      recommendations.push('🔧 TECHNICAL: Check API connectivity and project configuration');
      recommendations.push('🔧 TECHNICAL: Verify project UID and region are correct');
    }
  }
  
  const summary = {
    totalTests: tests.length,
    passedTests,
    failedTests,
    criticalIssues,
    recommendations
  };
  
  logPersonalizeEvent('COMPREHENSIVE_API_TEST_SUITE_COMPLETED', {
    summary,
    results: {
      connectivity: connectivity.success,
      manifest: manifest.success,
      userAttributes: userAttributes.success,
      eventsTracking: eventsTracking.success
    }
  });
  
  return {
    connectivity,
    manifest,
    userAttributes,
    eventsTracking,
    summary
  };
};

/**
 * Format API test results for display
 */
export const formatApiTestResults = (results: any): string => {
  let manifestDetails = '';
  if (results.manifest.data) {
    const analysis = analyzeManifest(results.manifest.data);
    manifestDetails = `   Experiences: ${analysis.experienceCount} (${analysis.activeExperiences} active)
   Variants: ${analysis.variantCount}
   Audiences: ${analysis.audienceCount}
   Content Types: ${analysis.contentTypes.join(', ') || 'None'}
   Variant Aliases: ${analysis.variantAliases.join(', ') || 'None'}
   Home Page Experience: ${analysis.hasHomePageExperience ? 'Yes' : 'No'}`;
    
    if (analysis.detailedAnalysis.issues.length > 0) {
      manifestDetails += `\n   Configuration Issues: ${analysis.detailedAnalysis.issues.length}`;
      analysis.detailedAnalysis.issues.forEach(issue => {
        manifestDetails += `\n     • ${issue}`;
      });
    }
  }

  return `
🔧 Personalize Edge API Test Results
====================================

📡 Connectivity: ${results.connectivity.success ? '✅ PASS' : '❌ FAIL'}
${results.connectivity.error ? `   Error: ${results.connectivity.error}` : ''}

📋 Manifest: ${results.manifest.success ? '✅ PASS' : '❌ FAIL'}
${results.manifest.error ? `   Error: ${results.manifest.error}` : ''}
${manifestDetails}

👤 User Attributes: ${results.userAttributes.success ? '✅ PASS' : '❌ FAIL'}
${results.userAttributes.error ? `   Error: ${results.userAttributes.error}` : ''}

📊 Events Tracking: ${results.eventsTracking.success ? '✅ PASS' : '❌ FAIL'}
${results.eventsTracking.error ? `   Error: ${results.eventsTracking.error}` : ''}

📈 Summary: ${results.summary.passedTests}/${results.summary.totalTests} tests passed

${results.summary.criticalIssues.length > 0 ? `
🚨 Critical Issues:
${results.summary.criticalIssues.map((issue: string) => `   • ${issue}`).join('\n')}
` : ''}

💡 Recommendations:
${results.summary.recommendations.map((rec: string) => `   • ${rec}`).join('\n')}
`;
};