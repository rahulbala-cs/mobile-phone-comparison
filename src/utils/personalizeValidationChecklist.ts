/**
 * Personalize Validation Checklist
 * 
 * Comprehensive validation checklist for troubleshooting personalization issues
 */

import { 
  runComprehensiveApiTests,
  getPersonalizeApiConfig 
} from './personalizeApiTesting';
import { 
  validatePersonalizationSetup
} from './personalizeUtils';
import { 
  compareContentVersions,
  runUserAttributeTestSuite,
  analyzeContentStructure 
} from './personalizeContentDebug';

export interface ValidationCheckResult {
  id: string;
  name: string;
  category: 'configuration' | 'api' | 'sdk' | 'content' | 'audience';
  status: 'pass' | 'fail' | 'warning' | 'skip';
  message: string;
  details?: any;
  recommendation?: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
}

export interface ValidationChecklistResult {
  overallStatus: 'pass' | 'fail' | 'warning';
  totalChecks: number;
  passedChecks: number;
  failedChecks: number;
  warningChecks: number;
  skippedChecks: number;
  criticalIssues: ValidationCheckResult[];
  checks: ValidationCheckResult[];
  summary: string;
  nextSteps: string[];
  timestamp: string;
}

export interface PersonalizeContext {
  isReady: boolean;
  getExperiences: () => any[];
  getVariantAliases: () => string[];
  setUserAttributes: (attrs: Record<string, any>) => Promise<void>;
  isPersonalizationEnabled: () => boolean;
}

/**
 * Run comprehensive personalization validation checklist
 */
export const runValidationChecklist = async (
  personalizeContext?: PersonalizeContext
): Promise<ValidationChecklistResult> => {
  const checks: ValidationCheckResult[] = [];
  const startTime = Date.now();
  
  console.log('🔍 Starting comprehensive personalization validation checklist...');
  
  // Category 1: Configuration Checks
  checks.push(...await runConfigurationChecks());
  
  // Category 2: API Checks
  checks.push(...await runApiChecks());
  
  // Category 3: SDK Checks
  if (personalizeContext) {
    checks.push(...await runSdkChecks(personalizeContext));
  }
  
  // Category 4: Content Checks
  if (personalizeContext && personalizeContext.isReady) {
    checks.push(...await runContentChecks(personalizeContext));
  }
  
  // Category 5: Audience Checks
  if (personalizeContext && personalizeContext.isReady) {
    checks.push(...await runAudienceChecks(personalizeContext));
  }
  
  // Calculate results
  const totalChecks = checks.length;
  const passedChecks = checks.filter(c => c.status === 'pass').length;
  const failedChecks = checks.filter(c => c.status === 'fail').length;
  const warningChecks = checks.filter(c => c.status === 'warning').length;
  const skippedChecks = checks.filter(c => c.status === 'skip').length;
  const criticalIssues = checks.filter(c => c.status === 'fail' && c.priority === 'critical');
  
  // Determine overall status
  let overallStatus: 'pass' | 'fail' | 'warning' = 'pass';
  if (failedChecks > 0) {
    overallStatus = 'fail';
  } else if (warningChecks > 0) {
    overallStatus = 'warning';
  }
  
  // Generate summary and next steps
  const { summary, nextSteps } = generateSummaryAndNextSteps(checks, overallStatus);
  
  const result: ValidationChecklistResult = {
    overallStatus,
    totalChecks,
    passedChecks,
    failedChecks,
    warningChecks,
    skippedChecks,
    criticalIssues,
    checks,
    summary,
    nextSteps,
    timestamp: new Date().toISOString()
  };
  
  const duration = Date.now() - startTime;
  console.log(`✅ Validation checklist completed in ${duration}ms`);
  console.log(`📊 Results: ${passedChecks}/${totalChecks} passed, ${failedChecks} failed, ${warningChecks} warnings`);
  
  return result;
};

/**
 * Configuration validation checks
 */
const runConfigurationChecks = async (): Promise<ValidationCheckResult[]> => {
  const checks: ValidationCheckResult[] = [];
  
  // Check 1: Environment variables
  try {
    const validation = validatePersonalizationSetup();
    
    checks.push({
      id: 'config_env_vars',
      name: 'Environment Variables',
      category: 'configuration',
      status: validation.isValid ? 'pass' : 'fail',
      message: validation.isValid 
        ? 'All required environment variables are configured'
        : `Missing required environment variables: ${validation.errors.join(', ')}`,
      details: { errors: validation.errors, warnings: validation.warnings },
      recommendation: validation.isValid 
        ? undefined 
        : 'Configure missing environment variables in your .env file',
      priority: 'critical'
    });
    
    // Warnings for optional variables
    if (validation.warnings.length > 0) {
      checks.push({
        id: 'config_optional_vars',
        name: 'Optional Configuration',
        category: 'configuration',
        status: 'warning',
        message: `Optional configuration issues: ${validation.warnings.join(', ')}`,
        details: { warnings: validation.warnings },
        recommendation: 'Consider configuring optional variables for optimal performance',
        priority: 'medium'
      });
    }
    
  } catch (error: any) {
    checks.push({
      id: 'config_env_vars',
      name: 'Environment Variables',
      category: 'configuration',
      status: 'fail',
      message: `Configuration validation failed: ${error.message}`,
      recommendation: 'Check your environment configuration',
      priority: 'critical'
    });
  }
  
  // Check 2: Project configuration validity
  try {
    const config = getPersonalizeApiConfig();
    
    checks.push({
      id: 'config_project',
      name: 'Project Configuration',
      category: 'configuration',
      status: 'pass',
      message: 'Project configuration is valid',
      details: {
        projectUid: config.projectUid.substring(0, 8) + '...',
        edgeApiUrl: config.edgeApiUrl,
        environment: config.environment
      },
      priority: 'high'
    });
    
  } catch (error: any) {
    checks.push({
      id: 'config_project',
      name: 'Project Configuration',
      category: 'configuration',
      status: 'fail',
      message: `Project configuration invalid: ${error.message}`,
      recommendation: 'Verify your Contentstack Personalize project settings',
      priority: 'critical'
    });
  }
  
  return checks;
};

/**
 * API validation checks
 */
const runApiChecks = async (): Promise<ValidationCheckResult[]> => {
  const checks: ValidationCheckResult[] = [];
  
  try {
    const apiTests = await runComprehensiveApiTests();
    
    // Check 1: API Connectivity
    checks.push({
      id: 'api_connectivity',
      name: 'API Connectivity',
      category: 'api',
      status: apiTests.connectivity.success ? 'pass' : 'fail',
      message: apiTests.connectivity.success 
        ? 'API connectivity successful'
        : `API connectivity failed: ${apiTests.connectivity.error}`,
      details: apiTests.connectivity,
      recommendation: apiTests.connectivity.success 
        ? undefined 
        : 'Check network connectivity and API endpoint configuration',
      priority: 'critical'
    });
    
    // Check 2: Manifest availability
    checks.push({
      id: 'api_manifest',
      name: 'Personalization Manifest',
      category: 'api',
      status: apiTests.manifest.success ? 'pass' : 'fail',
      message: apiTests.manifest.success 
        ? `Manifest loaded: ${apiTests.manifest.data?.experiences?.length || 0} experiences, ${apiTests.manifest.data?.variants?.length || 0} variants`
        : `Manifest loading failed: ${apiTests.manifest.error}`,
      details: apiTests.manifest.data,
      recommendation: apiTests.manifest.success 
        ? undefined 
        : 'Check if experiences are published and project is correctly configured',
      priority: 'critical'
    });
    
    // Check 3: User attributes
    checks.push({
      id: 'api_user_attributes',
      name: 'User Attributes',
      category: 'api',
      status: apiTests.userAttributes.success ? 'pass' : 'fail',
      message: apiTests.userAttributes.success 
        ? 'User attributes API working'
        : `User attributes failed: ${apiTests.userAttributes.error}`,
      details: apiTests.userAttributes,
      recommendation: apiTests.userAttributes.success 
        ? undefined 
        : 'Check user attributes endpoint and project configuration',
      priority: 'high'
    });
    
    // Check 4: Events tracking
    checks.push({
      id: 'api_events_tracking',
      name: 'Events Tracking',
      category: 'api',
      status: apiTests.eventsTracking.success ? 'pass' : 'fail',
      message: apiTests.eventsTracking.success 
        ? 'Events tracking API working'
        : `Events tracking failed: ${apiTests.eventsTracking.error}`,
      details: apiTests.eventsTracking,
      recommendation: apiTests.eventsTracking.success 
        ? undefined 
        : 'Check events tracking endpoint and analytics configuration',
      priority: 'high'
    });
    
  } catch (error: any) {
    checks.push({
      id: 'api_tests',
      name: 'API Tests',
      category: 'api',
      status: 'fail',
      message: `API tests failed: ${error.message}`,
      recommendation: 'Check API configuration and network connectivity',
      priority: 'critical'
    });
  }
  
  return checks;
};

/**
 * SDK validation checks
 */
const runSdkChecks = async (context: PersonalizeContext): Promise<ValidationCheckResult[]> => {
  const checks: ValidationCheckResult[] = [];
  
  // Check 1: SDK initialization
  checks.push({
    id: 'sdk_initialization',
    name: 'SDK Initialization',
    category: 'sdk',
    status: context.isReady ? 'pass' : 'fail',
    message: context.isReady 
      ? 'SDK initialized successfully'
      : 'SDK not initialized or not ready',
    recommendation: context.isReady 
      ? undefined 
      : 'Check SDK initialization and project configuration',
    priority: 'critical'
  });
  
  // Check 2: Personalization enabled
  checks.push({
    id: 'sdk_personalization_enabled',
    name: 'Personalization Enabled',
    category: 'sdk',
    status: context.isPersonalizationEnabled() ? 'pass' : 'fail',
    message: context.isPersonalizationEnabled() 
      ? 'Personalization is enabled'
      : 'Personalization is disabled',
    recommendation: context.isPersonalizationEnabled() 
      ? undefined 
      : 'Enable personalization by configuring required environment variables',
    priority: 'critical'
  });
  
  if (context.isReady) {
    // Check 3: Experiences available
    const experiences = context.getExperiences();
    checks.push({
      id: 'sdk_experiences',
      name: 'Active Experiences',
      category: 'sdk',
      status: experiences.length > 0 ? 'pass' : 'warning',
      message: `Found ${experiences.length} active experiences`,
      details: experiences,
      recommendation: experiences.length === 0 
        ? 'Create and publish experiences in Contentstack Personalize dashboard'
        : undefined,
      priority: experiences.length === 0 ? 'high' : 'low'
    });
    
    // Check 4: Variant aliases available
    const variantAliases = context.getVariantAliases();
    checks.push({
      id: 'sdk_variant_aliases',
      name: 'Variant Aliases',
      category: 'sdk',
      status: variantAliases.length > 0 ? 'pass' : 'warning',
      message: `Found ${variantAliases.length} variant aliases: ${variantAliases.join(', ')}`,
      details: variantAliases,
      recommendation: variantAliases.length === 0 
        ? 'Check audience matching and experience configuration'
        : undefined,
      priority: variantAliases.length === 0 ? 'high' : 'low'
    });
    
    // Check 5: Method availability
    const methods = ['getExperiences', 'getVariantAliases', 'setUserAttributes'];
    const availableMethods = methods.filter(method => typeof (context as any)[method] === 'function');
    
    checks.push({
      id: 'sdk_methods',
      name: 'SDK Methods',
      category: 'sdk',
      status: availableMethods.length === methods.length ? 'pass' : 'fail',
      message: `${availableMethods.length}/${methods.length} required methods available`,
      details: { available: availableMethods, missing: methods.filter(m => !availableMethods.includes(m)) },
      recommendation: availableMethods.length < methods.length 
        ? 'Update SDK version or check implementation'
        : undefined,
      priority: 'high'
    });
  }
  
  return checks;
};

/**
 * Content validation checks
 */
const runContentChecks = async (context: PersonalizeContext): Promise<ValidationCheckResult[]> => {
  const checks: ValidationCheckResult[] = [];
  
  try {
    // Check 1: Content comparison
    const variantAliases = context.getVariantAliases();
    if (variantAliases.length > 0) {
      const comparison = await compareContentVersions('home_page', variantAliases);
      
      checks.push({
        id: 'content_variants',
        name: 'Content Variants',
        category: 'content',
        status: comparison.hasVariantDifferences ? 'pass' : 'warning',
        message: comparison.hasVariantDifferences 
          ? `Found ${comparison.differences.length} content differences`
          : 'No differences between default and variant content',
        details: comparison,
        recommendation: comparison.hasVariantDifferences 
          ? undefined 
          : 'Check if variant content is configured correctly in CMS',
        priority: comparison.hasVariantDifferences ? 'low' : 'high'
      });
      
      // Check 2: Content structure analysis
      const analysis = analyzeContentStructure(comparison.variantContent);
      checks.push({
        id: 'content_structure',
        name: 'Content Structure',
        category: 'content',
        status: analysis.hasPersonalizationFields ? 'pass' : 'warning',
        message: `Content analysis: ${analysis.contentStructure.totalFields} fields, personalization metadata: ${analysis.hasPersonalizationFields ? 'present' : 'missing'}`,
        details: analysis,
        recommendation: analysis.recommendations.length > 0 
          ? analysis.recommendations.join('; ')
          : undefined,
        priority: 'medium'
      });
      
    } else {
      checks.push({
        id: 'content_variants',
        name: 'Content Variants',
        category: 'content',
        status: 'skip',
        message: 'No variant aliases available - skipping content comparison',
        recommendation: 'Ensure audience matching is working to get variant aliases',
        priority: 'medium'
      });
    }
    
  } catch (error: any) {
    checks.push({
      id: 'content_validation',
      name: 'Content Validation',
      category: 'content',
      status: 'fail',
      message: `Content validation failed: ${error.message}`,
      recommendation: 'Check content fetching and CMS configuration',
      priority: 'high'
    });
  }
  
  return checks;
};

/**
 * Audience validation checks
 */
const runAudienceChecks = async (context: PersonalizeContext): Promise<ValidationCheckResult[]> => {
  const checks: ValidationCheckResult[] = [];
  
  try {
    // Run user attribute test suite
    const testResults = await runUserAttributeTestSuite(
      context.setUserAttributes,
      context.getVariantAliases
    );
    
    checks.push({
      id: 'audience_user_attributes',
      name: 'User Attribute Testing',
      category: 'audience',
      status: testResults.summary.accuracy >= 0.7 ? 'pass' : 'warning',
      message: `User attribute tests: ${testResults.summary.accuracy * 100}% accuracy (${testResults.summary.personalizationTriggered}/${testResults.summary.personalizationExpected} expected)`,
      details: testResults,
      recommendation: testResults.summary.accuracy < 0.7 
        ? 'Check audience criteria and user attribute matching rules'
        : undefined,
      priority: testResults.summary.accuracy < 0.5 ? 'high' : 'medium'
    });
    
    // Check specific attribute scenarios
    const failedTests = testResults.testResults.filter(r => !r.success || r.hasVariants !== r.testCase.shouldTriggerPersonalization);
    if (failedTests.length > 0) {
      checks.push({
        id: 'audience_specific_scenarios',
        name: 'Specific Audience Scenarios',
        category: 'audience',
        status: 'warning',
        message: `${failedTests.length} test scenarios failed or behaved unexpectedly`,
        details: failedTests,
        recommendation: 'Review specific audience criteria and attribute matching logic',
        priority: 'medium'
      });
    }
    
  } catch (error: any) {
    checks.push({
      id: 'audience_testing',
      name: 'Audience Testing',
      category: 'audience',
      status: 'fail',
      message: `Audience testing failed: ${error.message}`,
      recommendation: 'Check user attribute functionality and audience configuration',
      priority: 'high'
    });
  }
  
  return checks;
};

/**
 * Generate summary and next steps
 */
const generateSummaryAndNextSteps = (
  checks: ValidationCheckResult[],
  overallStatus: 'pass' | 'fail' | 'warning'
): { summary: string; nextSteps: string[] } => {
  const criticalIssues = checks.filter(c => c.status === 'fail' && c.priority === 'critical');
  const highIssues = checks.filter(c => c.status === 'fail' && c.priority === 'high');
  const warnings = checks.filter(c => c.status === 'warning');
  
  let summary = '';
  const nextSteps: string[] = [];
  
  if (overallStatus === 'pass') {
    summary = '✅ Personalization is working correctly! All critical checks passed.';
    if (warnings.length > 0) {
      summary += ` However, there are ${warnings.length} warnings that could improve performance.`;
    }
  } else if (overallStatus === 'fail') {
    summary = `❌ Personalization has issues that need to be addressed. Found ${criticalIssues.length} critical issues and ${highIssues.length} high-priority issues.`;
  } else {
    summary = `⚠️ Personalization is working but has ${warnings.length} warnings that should be addressed for optimal performance.`;
  }
  
  // Generate next steps based on failed checks
  if (criticalIssues.length > 0) {
    nextSteps.push('🚨 Address critical issues first:');
    criticalIssues.forEach(issue => {
      if (issue.recommendation) {
        nextSteps.push(`   • ${issue.name}: ${issue.recommendation}`);
      }
    });
  }
  
  if (highIssues.length > 0) {
    nextSteps.push('🔴 Address high-priority issues:');
    highIssues.forEach(issue => {
      if (issue.recommendation) {
        nextSteps.push(`   • ${issue.name}: ${issue.recommendation}`);
      }
    });
  }
  
  if (warnings.length > 0 && criticalIssues.length === 0 && highIssues.length === 0) {
    nextSteps.push('🟡 Consider addressing warnings for optimization:');
    warnings.slice(0, 3).forEach(issue => { // Show top 3 warnings
      if (issue.recommendation) {
        nextSteps.push(`   • ${issue.name}: ${issue.recommendation}`);
      }
    });
  }
  
  if (nextSteps.length === 0) {
    nextSteps.push('🎉 No immediate action required! Monitor for ongoing performance.');
  }
  
  return { summary, nextSteps };
};

/**
 * Format validation results for console display
 */
export const formatValidationResults = (results: ValidationChecklistResult): string => {
  let output = '\n';
  output += '🔍 PERSONALIZATION VALIDATION CHECKLIST RESULTS\n';
  output += '================================================\n\n';
  
  output += `📊 Overall Status: ${results.overallStatus === 'pass' ? '✅ PASS' : results.overallStatus === 'fail' ? '❌ FAIL' : '⚠️ WARNING'}\n`;
  output += `📈 Results: ${results.passedChecks}/${results.totalChecks} passed, ${results.failedChecks} failed, ${results.warningChecks} warnings\n\n`;
  
  output += `📝 Summary:\n${results.summary}\n\n`;
  
  if (results.nextSteps.length > 0) {
    output += '🛠️ Next Steps:\n';
    results.nextSteps.forEach(step => {
      output += `${step}\n`;
    });
    output += '\n';
  }
  
  // Group checks by category
  const categories = ['configuration', 'api', 'sdk', 'content', 'audience'] as const;
  categories.forEach(category => {
    const categoryChecks = results.checks.filter(c => c.category === category);
    if (categoryChecks.length > 0) {
      output += `📂 ${category.toUpperCase()} CHECKS:\n`;
      categoryChecks.forEach(check => {
        const icon = check.status === 'pass' ? '✅' : check.status === 'fail' ? '❌' : check.status === 'warning' ? '⚠️' : '⏭️';
        output += `  ${icon} ${check.name}: ${check.message}\n`;
        if (check.recommendation) {
          output += `     💡 ${check.recommendation}\n`;
        }
      });
      output += '\n';
    }
  });
  
  output += `⏱️ Generated: ${new Date(results.timestamp).toLocaleString()}\n`;
  
  return output;
};