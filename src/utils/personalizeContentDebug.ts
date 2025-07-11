/**
 * Personalize Content Debugging Utilities
 * 
 * Advanced debugging tools for content fetching and variant comparison
 */

import contentstackService from '../services/contentstackService';
import { logPersonalizeEvent } from './personalizeUtils';
// import { HomePageContent } from '../types/HomePageContent';

export interface ContentComparisonResult {
  defaultContent: any;
  variantContent: any;
  differences: ContentDifference[];
  hasVariantDifferences: boolean;
  timestamp: string;
  variantAliases: string[];
  contentType: string;
}

export interface ContentDifference {
  path: string;
  defaultValue: any;
  variantValue: any;
  type: 'added' | 'removed' | 'modified';
}

export interface UserAttributeTestCase {
  name: string;
  description: string;
  attributes: Record<string, any>;
  expectedBehavior: string;
  shouldTriggerPersonalization: boolean;
}

/**
 * Compare default content vs variant content
 */
export const compareContentVersions = async (
  contentType: string,
  variantAliases: string[]
): Promise<ContentComparisonResult> => {
  logPersonalizeEvent('CONTENT_COMPARISON_STARTED', { contentType, variantAliases });
  
  try {
    let defaultContent: any;
    let variantContent: any;
    
    // Fetch default content (without variants)
    if (contentType === 'home_page') {
      defaultContent = await contentstackService.getHomePageContentWithVariants([]);
    } else {
      throw new Error(`Content type ${contentType} not supported for comparison`);
    }
    
    // Fetch variant content (with variants)
    if (contentType === 'home_page') {
      variantContent = await contentstackService.getHomePageContentWithVariants(variantAliases);
    } else {
      throw new Error(`Content type ${contentType} not supported for comparison`);
    }
    
    // Compare the content structures
    const differences = findContentDifferences(defaultContent, variantContent);
    
    const result: ContentComparisonResult = {
      defaultContent,
      variantContent,
      differences,
      hasVariantDifferences: differences.length > 0,
      timestamp: new Date().toISOString(),
      variantAliases,
      contentType
    };
    
    logPersonalizeEvent('CONTENT_COMPARISON_COMPLETED', {
      contentType,
      variantAliases,
      differenceCount: differences.length,
      hasVariantDifferences: result.hasVariantDifferences
    });
    
    return result;
    
  } catch (error: any) {
    logPersonalizeEvent('CONTENT_COMPARISON_FAILED', {
      contentType,
      variantAliases,
      error: error.message
    }, 'error');
    
    throw error;
  }
};

/**
 * Deep comparison to find differences between content objects
 */
export const findContentDifferences = (
  defaultObj: any,
  variantObj: any,
  path: string = ''
): ContentDifference[] => {
  const differences: ContentDifference[] = [];
  
  // Handle primitive values
  if (typeof defaultObj !== 'object' || typeof variantObj !== 'object') {
    if (defaultObj !== variantObj) {
      differences.push({
        path,
        defaultValue: defaultObj,
        variantValue: variantObj,
        type: 'modified'
      });
    }
    return differences;
  }
  
  // Handle null values
  if (defaultObj === null || variantObj === null) {
    if (defaultObj !== variantObj) {
      differences.push({
        path,
        defaultValue: defaultObj,
        variantValue: variantObj,
        type: defaultObj === null ? 'added' : 'removed'
      });
    }
    return differences;
  }
  
  // Handle arrays
  if (Array.isArray(defaultObj) && Array.isArray(variantObj)) {
    const maxLength = Math.max(defaultObj.length, variantObj.length);
    for (let i = 0; i < maxLength; i++) {
      const newPath = `${path}[${i}]`;
      if (i >= defaultObj.length) {
        differences.push({
          path: newPath,
          defaultValue: undefined,
          variantValue: variantObj[i],
          type: 'added'
        });
      } else if (i >= variantObj.length) {
        differences.push({
          path: newPath,
          defaultValue: defaultObj[i],
          variantValue: undefined,
          type: 'removed'
        });
      } else {
        differences.push(...findContentDifferences(defaultObj[i], variantObj[i], newPath));
      }
    }
    return differences;
  }
  
  // Handle objects
  const allKeys = new Set([...Object.keys(defaultObj), ...Object.keys(variantObj)]);
  
  for (const key of Array.from(allKeys)) {
    const newPath = path ? `${path}.${key}` : key;
    
    if (!(key in defaultObj)) {
      differences.push({
        path: newPath,
        defaultValue: undefined,
        variantValue: variantObj[key],
        type: 'added'
      });
    } else if (!(key in variantObj)) {
      differences.push({
        path: newPath,
        defaultValue: defaultObj[key],
        variantValue: undefined,
        type: 'removed'
      });
    } else {
      differences.push(...findContentDifferences(defaultObj[key], variantObj[key], newPath));
    }
  }
  
  return differences;
};

/**
 * Test user attribute scenarios that should trigger personalization
 */
export const getUserAttributeTestCases = (): UserAttributeTestCase[] => {
  return [
    {
      name: 'Basic Demographics',
      description: 'Basic user demographic information',
      attributes: {
        age: 28,
        gender: 'male',
        location: 'us',
        device: 'desktop'
      },
      expectedBehavior: 'Should match general demographic audience',
      shouldTriggerPersonalization: true
    },
    {
      name: 'Mobile User',
      description: 'Mobile device user',
      attributes: {
        device: 'mobile',
        location: 'us',
        userType: 'new_visitor',
        sessionStart: new Date().toISOString()
      },
      expectedBehavior: 'Should match mobile-specific experiences',
      shouldTriggerPersonalization: true
    },
    {
      name: 'High-Value Customer',
      description: 'User with premium preferences',
      attributes: {
        priceRange: 'premium',
        preferredBrand: 'apple',
        purchaseIntent: 'ready-to-buy',
        device: 'desktop'
      },
      expectedBehavior: 'Should match premium customer segments',
      shouldTriggerPersonalization: true
    },
    {
      name: 'Budget Conscious',
      description: 'User looking for budget options',
      attributes: {
        priceRange: 'budget',
        preferredBrand: 'xiaomi',
        purchaseIntent: 'comparing',
        userType: 'returning_visitor'
      },
      expectedBehavior: 'Should match budget-conscious segments',
      shouldTriggerPersonalization: true
    },
    {
      name: 'First-Time Visitor',
      description: 'New user with minimal attributes',
      attributes: {
        userType: 'new_visitor',
        pageType: 'homepage',
        sessionStart: new Date().toISOString(),
        device: 'desktop'
      },
      expectedBehavior: 'Should match new visitor experiences',
      shouldTriggerPersonalization: true
    },
    {
      name: 'Geographic Targeting',
      description: 'User from specific regions',
      attributes: {
        location: 'eu',
        device: 'desktop',
        userType: 'returning_visitor',
        language: 'en'
      },
      expectedBehavior: 'Should match geographic audience rules',
      shouldTriggerPersonalization: true
    },
    {
      name: 'Behavioral Targeting',
      description: 'User with specific behavioral patterns',
      attributes: {
        pagesViewed: 5,
        comparisonsMade: 2,
        lastVisit: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        purchaseIntent: 'comparing'
      },
      expectedBehavior: 'Should match behavioral audience segments',
      shouldTriggerPersonalization: true
    },
    {
      name: 'Empty Attributes',
      description: 'User with no specific attributes',
      attributes: {},
      expectedBehavior: 'Should use default content (no personalization)',
      shouldTriggerPersonalization: false
    }
  ];
};

/**
 * Test specific user attribute scenario
 */
export const testUserAttributeScenario = async (
  testCase: UserAttributeTestCase,
  setUserAttributesFunc: (attrs: Record<string, any>) => Promise<void>,
  getVariantAliasesFunc: () => string[]
): Promise<{
  testCase: UserAttributeTestCase;
  success: boolean;
  variantAliases: string[];
  hasVariants: boolean;
  error?: string;
  duration: number;
  timestamp: string;
}> => {
  const startTime = Date.now();
  
  logPersonalizeEvent('USER_ATTRIBUTE_TEST_STARTED', {
    testCaseName: testCase.name,
    attributes: testCase.attributes
  });
  
  try {
    // Set the test attributes
    await setUserAttributesFunc(testCase.attributes);
    
    // Wait for attribute propagation (longer wait for testing)
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Get variant aliases after setting attributes
    const variantAliases = getVariantAliasesFunc();
    const hasVariants = variantAliases.length > 0;
    
    const endTime = Date.now();
    const result = {
      testCase,
      success: true,
      variantAliases,
      hasVariants,
      duration: endTime - startTime,
      timestamp: new Date().toISOString()
    };
    
    // Check if personalization behavior matches expectation
    const personalizedAsExpected = hasVariants === testCase.shouldTriggerPersonalization;
    
    logPersonalizeEvent('USER_ATTRIBUTE_TEST_COMPLETED', {
      ...result,
      personalizedAsExpected,
      expectedPersonalization: testCase.shouldTriggerPersonalization
    });
    
    return result;
    
  } catch (error: any) {
    const endTime = Date.now();
    const result = {
      testCase,
      success: false,
      variantAliases: [],
      hasVariants: false,
      error: error.message,
      duration: endTime - startTime,
      timestamp: new Date().toISOString()
    };
    
    logPersonalizeEvent('USER_ATTRIBUTE_TEST_FAILED', result, 'error');
    return result;
  }
};

/**
 * Run comprehensive user attribute testing
 */
export const runUserAttributeTestSuite = async (
  setUserAttributesFunc: (attrs: Record<string, any>) => Promise<void>,
  getVariantAliasesFunc: () => string[]
): Promise<{
  testResults: any[];
  summary: {
    totalTests: number;
    passedTests: number;
    failedTests: number;
    personalizationTriggered: number;
    personalizationExpected: number;
    accuracy: number;
  };
}> => {
  logPersonalizeEvent('USER_ATTRIBUTE_TEST_SUITE_STARTED', {});
  
  const testCases = getUserAttributeTestCases();
  const testResults = [];
  
  for (const testCase of testCases) {
    const result = await testUserAttributeScenario(testCase, setUserAttributesFunc, getVariantAliasesFunc);
    testResults.push(result);
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Calculate summary statistics
  const totalTests = testResults.length;
  const passedTests = testResults.filter(r => r.success).length;
  const failedTests = totalTests - passedTests;
  const personalizationTriggered = testResults.filter(r => r.hasVariants).length;
  const personalizationExpected = testCases.filter(tc => tc.shouldTriggerPersonalization).length;
  const accuracy = totalTests > 0 ? 
    testResults.filter(r => r.hasVariants === r.testCase.shouldTriggerPersonalization).length / totalTests : 0;
  
  const summary = {
    totalTests,
    passedTests,
    failedTests,
    personalizationTriggered,
    personalizationExpected,
    accuracy: Math.round(accuracy * 100) / 100
  };
  
  logPersonalizeEvent('USER_ATTRIBUTE_TEST_SUITE_COMPLETED', {
    summary,
    testResults: testResults.map(r => ({
      name: r.testCase.name,
      success: r.success,
      hasVariants: r.hasVariants,
      expected: r.testCase.shouldTriggerPersonalization
    }))
  });
  
  return {
    testResults,
    summary
  };
};

/**
 * Format content differences for display
 */
export const formatContentDifferences = (differences: ContentDifference[]): string => {
  if (differences.length === 0) {
    return '✅ No differences found - content is identical\n';
  }
  
  let output = `🔍 Found ${differences.length} differences:\n\n`;
  
  differences.forEach((diff, index) => {
    const icon = diff.type === 'added' ? '➕' : diff.type === 'removed' ? '➖' : '🔄';
    output += `${index + 1}. ${icon} ${diff.type.toUpperCase()}: ${diff.path}\n`;
    
    if (diff.type === 'modified') {
      output += `   Default: ${JSON.stringify(diff.defaultValue)}\n`;
      output += `   Variant: ${JSON.stringify(diff.variantValue)}\n`;
    } else if (diff.type === 'added') {
      output += `   Added: ${JSON.stringify(diff.variantValue)}\n`;
    } else if (diff.type === 'removed') {
      output += `   Removed: ${JSON.stringify(diff.defaultValue)}\n`;
    }
    output += '\n';
  });
  
  return output;
};

/**
 * Analyze content structure for personalization readiness
 */
export const analyzeContentStructure = (content: any): {
  hasPersonalizationFields: boolean;
  personalizationMetadata: any;
  contentStructure: {
    totalFields: number;
    textFields: number;
    imageFields: number;
    richTextFields: number;
    arrayFields: number;
  };
  recommendations: string[];
} => {
  const recommendations: string[] = [];
  let hasPersonalizationFields = false;
  let personalizationMetadata = null;
  
  // Check for personalization metadata
  if (content._metadata?.personalization) {
    hasPersonalizationFields = true;
    personalizationMetadata = content._metadata.personalization;
  }
  
  // Analyze content structure
  const structure = analyzeObjectStructure(content);
  
  // Generate recommendations
  if (!hasPersonalizationFields) {
    recommendations.push('No personalization metadata found in content');
  }
  
  if (structure.textFields === 0) {
    recommendations.push('No text fields found - limited personalization opportunities');
  }
  
  if (structure.imageFields === 0) {
    recommendations.push('No image fields found - consider image personalization');
  }
  
  if (structure.totalFields < 5) {
    recommendations.push('Limited content fields - consider adding more personalizable content');
  }
  
  return {
    hasPersonalizationFields,
    personalizationMetadata,
    contentStructure: structure,
    recommendations
  };
};

/**
 * Recursively analyze object structure
 */
const analyzeObjectStructure = (obj: any, depth: number = 0): {
  totalFields: number;
  textFields: number;
  imageFields: number;
  richTextFields: number;
  arrayFields: number;
} => {
  const stats = {
    totalFields: 0,
    textFields: 0,
    imageFields: 0,
    richTextFields: 0,
    arrayFields: 0
  };
  
  if (depth > 5 || typeof obj !== 'object' || obj === null) {
    return stats;
  }
  
  for (const [key, value] of Object.entries(obj)) {
    stats.totalFields++;
    
    if (typeof value === 'string') {
      stats.textFields++;
      
      // Check for rich text
      if (value.includes('<') || value.includes('[') || value.length > 200) {
        stats.richTextFields++;
      }
    } else if (Array.isArray(value)) {
      stats.arrayFields++;
      
      // Analyze array contents
      value.forEach(item => {
        const itemStats = analyzeObjectStructure(item, depth + 1);
        stats.totalFields += itemStats.totalFields;
        stats.textFields += itemStats.textFields;
        stats.imageFields += itemStats.imageFields;
        stats.richTextFields += itemStats.richTextFields;
        stats.arrayFields += itemStats.arrayFields;
      });
    } else if (typeof value === 'object' && value !== null) {
      // Check for image objects
      if ((value as any).url || (value as any).src || key.includes('image') || key.includes('photo')) {
        stats.imageFields++;
      }
      
      // Recurse into nested objects
      const nestedStats = analyzeObjectStructure(value, depth + 1);
      stats.totalFields += nestedStats.totalFields;
      stats.textFields += nestedStats.textFields;
      stats.imageFields += nestedStats.imageFields;
      stats.richTextFields += nestedStats.richTextFields;
      stats.arrayFields += nestedStats.arrayFields;
    }
  }
  
  return stats;
};