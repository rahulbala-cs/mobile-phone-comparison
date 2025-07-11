/**
 * Contentstack Personalize Manifest Debugger
 * 
 * Specialized debugging tool to analyze manifest responses and identify configuration issues
 */

import { getPersonalizeApiConfig, analyzeManifest } from './personalizeApiTesting';

/**
 * Generate a personalize user UID for testing
 */
const generatePersonalizeUserUid = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : ((r & 0x3) | 0x8);
    return v.toString(16);
  });
};

export interface ManifestDebugResult {
  success: boolean;
  endpoint: string;
  projectUid: string;
  userUid: string;
  statusCode?: number;
  error?: string;
  manifestData?: any;
  analysis?: any;
  recommendations: string[];
  nextSteps: string[];
}

/**
 * Debug manifest endpoint with detailed analysis
 */
export const debugManifestEndpoint = async (): Promise<ManifestDebugResult> => {
  try {
    const config = getPersonalizeApiConfig();
    const userUid = generatePersonalizeUserUid();
    const url = `${config.edgeApiUrl}/manifest`;
    
    console.log('🔍 Starting manifest debugging:', {
      endpoint: config.edgeApiUrl,
      projectUid: config.projectUid,
      userUid,
      url
    });
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Contentstack-Personalize-React-App',
        'x-project-uid': config.projectUid,
        'x-cs-personalize-user-uid': userUid
      }
    });
    
    const result: ManifestDebugResult = {
      success: response.ok,
      endpoint: config.edgeApiUrl,
      projectUid: config.projectUid,
      userUid,
      statusCode: response.status,
      recommendations: [],
      nextSteps: []
    };
    
    if (response.ok) {
      try {
        const manifestData = await response.json();
        result.manifestData = manifestData;
        
        // Perform detailed analysis
        const analysis = analyzeManifest(manifestData);
        result.analysis = analysis;
        
        console.log('✅ Manifest debugging successful:', {
          statusCode: response.status,
          analysis: analysis.detailedAnalysis
        });
        
        // Generate specific recommendations based on findings
        if (analysis.experienceCount === 0) {
          result.recommendations.push('📋 DASHBOARD: No experiences found - create experiences in Contentstack Personalize dashboard');
          result.nextSteps.push('1. Log into app.contentstack.com');
          result.nextSteps.push('2. Navigate to Personalize section');
          result.nextSteps.push('3. Create a new experience');
          result.nextSteps.push('4. Configure targeting rules and variants');
          result.nextSteps.push('5. Publish the experience');
        } else if (analysis.activeExperiences === 0) {
          result.recommendations.push('📋 DASHBOARD: Experiences exist but none are active - activate in dashboard');
          result.nextSteps.push('1. Go to Contentstack Personalize dashboard');
          result.nextSteps.push('2. Find your 3 draft/paused experiences');
          result.nextSteps.push('3. Click Edit on each experience');
          result.nextSteps.push('4. Review configuration and click Publish/Activate');
          result.nextSteps.push('5. Verify status changes to Active');
        } else {
          result.recommendations.push('✅ TECHNICAL: Active experiences found - API infrastructure working!');
          if (!analysis.hasHomePageExperience) {
            result.recommendations.push('📋 DASHBOARD: Configure experiences to target home_page content type');
          }
        }
        
        if (analysis.variantCount === 0) {
          result.recommendations.push('📋 DASHBOARD: No variants configured - set up A/B testing variants');
          result.nextSteps.push('1. Edit each experience in Personalize dashboard');
          result.nextSteps.push('2. Add Control and Test variants');
          result.nextSteps.push('3. Set traffic allocation percentages');
          result.nextSteps.push('4. Create variant content in Contentstack CMS');
          result.nextSteps.push('5. Ensure variant content differs from default');
        }
        
        if (analysis.audienceCount === 0) {
          result.recommendations.push('📋 DASHBOARD: No audiences configured - create targeting segments');
          result.nextSteps.push('1. Go to Audiences section in Personalize dashboard');
          result.nextSteps.push('2. Create audience segments (mobile users, new visitors, etc.)');
          result.nextSteps.push('3. Define targeting criteria (device, location, userType)');
          result.nextSteps.push('4. Assign audiences to your experiences');
          result.nextSteps.push('5. Test audience matching with user attributes');
        }
        
        // Add reference to setup guide
        if (analysis.experienceCount > 0 && analysis.activeExperiences === 0) {
          result.nextSteps.push('');
          result.nextSteps.push('📖 See PERSONALIZATION_SETUP_GUIDE.md for detailed instructions');
          result.nextSteps.push('🎯 Technical setup is complete - only dashboard configuration needed!');
        }
        
      } catch (jsonError) {
        result.success = false;
        result.error = 'Invalid JSON response from manifest endpoint';
        result.recommendations.push('Manifest endpoint returned invalid JSON - check project configuration');
        console.error('❌ Manifest JSON parsing failed:', jsonError);
      }
    } else {
      const errorText = await response.text().catch(() => '');
      result.error = `HTTP ${response.status}: ${response.statusText}${errorText ? ` - ${errorText}` : ''}`;
      
      if (response.status === 404) {
        result.recommendations.push('Project not found - verify project UID and region');
        result.nextSteps.push('1. Confirm project UID is correct in .env file');
        result.nextSteps.push('2. Verify project exists in Contentstack Personalize dashboard');
        result.nextSteps.push('3. Check if project is in the correct region (AWS US)');
      } else if (response.status === 401 || response.status === 403) {
        result.recommendations.push('Authentication failed - check project configuration');
        result.nextSteps.push('1. Verify project UID is correct');
        result.nextSteps.push('2. Check project permissions');
      } else {
        result.recommendations.push('Unexpected API error - check network and service status');
        result.nextSteps.push('1. Retry the request');
        result.nextSteps.push('2. Check Contentstack service status');
        result.nextSteps.push('3. Verify network connectivity');
      }
      
      console.error('❌ Manifest debugging failed:', result);
    }
    
    return result;
    
  } catch (error: any) {
    const result: ManifestDebugResult = {
      success: false,
      endpoint: 'unknown',
      projectUid: 'unknown',
      userUid: 'unknown',
      error: error.message || 'Network error',
      recommendations: ['Network error occurred - check connectivity'],
      nextSteps: ['1. Check internet connection', '2. Verify API endpoint is accessible', '3. Retry the request']
    };
    
    console.error('❌ Manifest debugging error:', error);
    return result;
  }
};

/**
 * Format manifest debug results for display
 */
export const formatManifestDebugResults = (result: ManifestDebugResult): string => {
  let output = '\n🔍 MANIFEST DEBUGGING RESULTS\n';
  output += '==============================\n\n';
  
  output += `🌐 Endpoint: ${result.endpoint}\n`;
  output += `📋 Project UID: ${result.projectUid}\n`;
  output += `👤 User UID: ${result.userUid}\n`;
  output += `📊 Status: ${result.success ? '✅ SUCCESS' : '❌ FAILED'}\n`;
  
  if (result.statusCode) {
    output += `🔢 Status Code: ${result.statusCode}\n`;
  }
  
  if (result.error) {
    output += `❌ Error: ${result.error}\n`;
  }
  
  if (result.analysis) {
    const analysis = result.analysis;
    output += '\n📊 MANIFEST ANALYSIS:\n';
    output += `   Experiences: ${analysis.experienceCount} (${analysis.activeExperiences} active)\n`;
    output += `   Variants: ${analysis.variantCount}\n`;
    output += `   Audiences: ${analysis.audienceCount}\n`;
    output += `   Content Types: ${analysis.contentTypes.join(', ') || 'None'}\n`;
    output += `   Variant Aliases: ${analysis.variantAliases.join(', ') || 'None'}\n`;
    output += `   Home Page Experience: ${analysis.hasHomePageExperience ? 'Yes' : 'No'}\n`;
    
    if (analysis.detailedAnalysis.experiencesByStatus) {
      output += '\n📈 EXPERIENCE STATUS BREAKDOWN:\n';
      Object.entries(analysis.detailedAnalysis.experiencesByStatus).forEach(([status, count]) => {
        output += `   ${status}: ${count}\n`;
      });
    }
  }
  
  if (result.recommendations.length > 0) {
    output += '\n💡 RECOMMENDATIONS:\n';
    result.recommendations.forEach((rec, index) => {
      output += `   ${index + 1}. ${rec}\n`;
    });
  }
  
  if (result.nextSteps.length > 0) {
    output += '\n🛠️ NEXT STEPS:\n';
    result.nextSteps.forEach(step => {
      output += `   ${step}\n`;
    });
  }
  
  return output;
};

/**
 * Quick manifest status check
 */
export const quickManifestCheck = async (): Promise<{
  hasExperiences: boolean;
  hasActiveExperiences: boolean;
  hasVariants: boolean;
  hasAudiences: boolean;
  ready: boolean;
  summary: string;
}> => {
  try {
    const result = await debugManifestEndpoint();
    
    if (!result.success || !result.analysis) {
      return {
        hasExperiences: false,
        hasActiveExperiences: false,
        hasVariants: false,
        hasAudiences: false,
        ready: false,
        summary: result.error || 'Manifest check failed'
      };
    }
    
    const analysis = result.analysis;
    const hasExperiences = analysis.experienceCount > 0;
    const hasActiveExperiences = analysis.activeExperiences > 0;
    const hasVariants = analysis.variantCount > 0;
    const hasAudiences = analysis.audienceCount > 0;
    const ready = hasActiveExperiences && hasVariants && hasAudiences;
    
    let summary = '';
    if (ready) {
      summary = '✅ Personalization ready - all components configured';
    } else if (hasExperiences) {
      summary = '⚠️ Experiences exist but need activation/configuration';
    } else {
      summary = '❌ No experiences configured - setup required';
    }
    
    return {
      hasExperiences,
      hasActiveExperiences,
      hasVariants,
      hasAudiences,
      ready,
      summary
    };
    
  } catch (error) {
    return {
      hasExperiences: false,
      hasActiveExperiences: false,
      hasVariants: false,
      hasAudiences: false,
      ready: false,
      summary: 'Manifest check failed due to error'
    };
  }
};