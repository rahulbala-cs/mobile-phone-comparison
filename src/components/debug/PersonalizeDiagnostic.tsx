/**
 * Personalize Diagnostic Component
 * 
 * Comprehensive debugging and diagnostic tool for Contentstack Personalize integration
 * Shows real-time SDK state, runs API tests, and provides detailed troubleshooting information
 */

import React, { useState, useEffect, useCallback } from 'react';
import { usePersonalize, usePersonalizeDiagnostics } from '../../hooks/usePersonalize';
import { 
  runComprehensiveApiTests, 
  formatApiTestResults
} from '../../utils/personalizeApiTesting';
import { 
  testAllApiEndpoints
} from '../../utils/personalizeApiEndpoints';
import { 
  validatePersonalizationSetup, 
  checkPersonalizationStatus
} from '../../utils/personalizeUtils';
import { 
  runValidationChecklist,
  ValidationChecklistResult
} from '../../utils/personalizeValidationChecklist';
import { 
  compareContentVersions,
  runUserAttributeTestSuite,
  formatContentDifferences
} from '../../utils/personalizeContentDebug';
import {
  debugManifestEndpoint,
  formatManifestDebugResults
} from '../../utils/personalizeManifestDebugger';
import './PersonalizeDiagnostic.css';

interface DiagnosticState {
  isRunning: boolean;
  lastUpdate: string;
  apiTestResults: any | null;
  sdkStatus: any | null;
  validationResults: any | null;
  validationChecklist: ValidationChecklistResult | null;
  contentComparison: any | null;
  userAttributeTests: any | null;
  error: string | null;
}

const PersonalizeDiagnostic: React.FC = () => {
  const [diagnosticState, setDiagnosticState] = useState<DiagnosticState>({
    isRunning: false,
    lastUpdate: new Date().toISOString(),
    apiTestResults: null,
    sdkStatus: null,
    validationResults: null,
    validationChecklist: null,
    contentComparison: null,
    userAttributeTests: null,
    error: null
  });

  const [isVisible, setIsVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'checklist' | 'api' | 'sdk' | 'content' | 'audience' | 'validation' | 'logs'>('overview');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  // Get personalization hooks
  const { 
    isReady, 
    getExperiences, 
    getVariantAliases, 
    isPersonalizationEnabled,
    setUserAttributes,
    sdk 
  } = usePersonalize();
  
  // Get diagnostic hooks (for potential future use)
  usePersonalizeDiagnostics();

  // Add log entry
  const addLog = useCallback((message: string) => {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}`;
    setLogs(prev => [...prev.slice(-49), logEntry]); // Keep last 50 logs
  }, []);

  // Run comprehensive diagnostics
  const runDiagnostics = useCallback(async () => {
    setDiagnosticState(prev => ({ ...prev, isRunning: true, error: null }));
    addLog('🔍 Starting comprehensive personalization diagnostics...');

    try {
      // 1. Configuration validation
      addLog('📋 Validating personalization setup...');
      const validationResults = validatePersonalizationSetup();
      
      // 2. SDK status check
      addLog('🔧 Checking SDK status...');
      const sdkStatus = await checkPersonalizationStatus();
      
      // 3. API tests
      addLog('🌐 Running API tests...');
      const apiTestResults = await runComprehensiveApiTests();
      
      // 4. Real-time SDK state
      const currentSdkState = {
        isReady,
        isPersonalizationEnabled: isPersonalizationEnabled(),
        hasExperiences: getExperiences().length > 0,
        experienceCount: getExperiences().length,
        hasVariantAliases: getVariantAliases().length > 0,
        variantAliasCount: getVariantAliases().length,
        variantAliases: getVariantAliases(),
        experiences: getExperiences(),
        sdkInitialized: !!sdk
      };

      // 5. Comprehensive validation checklist
      addLog('📋 Running comprehensive validation checklist...');
      const validationChecklist = await runValidationChecklist({
        isReady,
        getExperiences,
        getVariantAliases,
        setUserAttributes,
        isPersonalizationEnabled
      });

      // 6. Content comparison (if variants available)
      let contentComparison: any = null;
      const variantAliases = getVariantAliases();
      if (variantAliases.length > 0) {
        addLog('🔍 Comparing content versions...');
        try {
          contentComparison = await compareContentVersions('home_page', variantAliases);
        } catch (error: any) {
          addLog(`⚠️ Content comparison failed: ${error.message}`);
        }
      }

      // 7. User attribute testing
      addLog('👤 Running user attribute tests...');
      let userAttributeTests: any = null;
      if (isReady) {
        try {
          userAttributeTests = await runUserAttributeTestSuite(setUserAttributes, getVariantAliases);
        } catch (error: any) {
          addLog(`⚠️ User attribute tests failed: ${error.message}`);
        }
      }

      setDiagnosticState(prev => ({
        ...prev,
        isRunning: false,
        lastUpdate: new Date().toISOString(),
        apiTestResults,
        sdkStatus: { ...sdkStatus, currentState: currentSdkState },
        validationResults,
        validationChecklist,
        contentComparison,
        userAttributeTests,
        error: null
      }));

      addLog('✅ Diagnostics completed successfully');
      
      // Log critical findings
      if (validationResults.errors.length > 0) {
        addLog(`❌ Configuration errors found: ${validationResults.errors.length}`);
      }
      if (apiTestResults.summary.criticalIssues.length > 0) {
        addLog(`🚨 Critical API issues found: ${apiTestResults.summary.criticalIssues.length}`);
      }
      if (currentSdkState.experienceCount === 0) {
        addLog('⚠️ No experiences found in SDK');
      }
      if (currentSdkState.variantAliasCount === 0) {
        addLog('⚠️ No variant aliases found in SDK');
      }

    } catch (error: any) {
      const errorMessage = error.message || 'Unknown error occurred';
      setDiagnosticState(prev => ({
        ...prev,
        isRunning: false,
        error: errorMessage
      }));
      addLog(`❌ Diagnostic failed: ${errorMessage}`);
    }
  }, [isReady, getExperiences, getVariantAliases, isPersonalizationEnabled, setUserAttributes, sdk, addLog]);

  // Test user attributes
  const testUserAttributes = useCallback(async () => {
    addLog('👤 Testing user attributes...');
    try {
      const testAttributes = {
        device: 'desktop',
        location: 'us',
        userType: 'returning_visitor',
        pageType: 'homepage',
        interestCategory: 'smartphones',
        priceRange: 'mid-range',
        sessionStart: new Date().toISOString()
      };

      await setUserAttributes(testAttributes);
      addLog('✅ Test user attributes set successfully');
      
      // Wait for propagation and re-run diagnostics
      setTimeout(() => {
        addLog('🔄 Re-running diagnostics after attribute change...');
        runDiagnostics();
      }, 2000);
      
    } catch (error: any) {
      addLog(`❌ Failed to set test user attributes: ${error.message}`);
    }
  }, [setUserAttributes, addLog, runDiagnostics]);

  // Test all API endpoints to find working ones
  const testAllEndpoints = useCallback(async () => {
    addLog('🌐 Testing all API endpoints to find the correct one...');
    try {
      const projectUid = process.env.REACT_APP_CONTENTSTACK_PERSONALIZE_PROJECT_UID;
      if (!projectUid) {
        addLog('❌ No project UID configured');
        return;
      }

      const results = await testAllApiEndpoints(projectUid);
      
      addLog(`📊 Endpoint test results: ${results.workingEndpoints.length}/${results.results.length} endpoints working`);
      
      if (results.workingEndpoints.length > 0) {
        addLog(`✅ Working endpoints found: ${results.workingEndpoints.join(', ')}`);
        if (results.bestEndpoint) {
          addLog(`🎯 Best endpoint (fastest): ${results.bestEndpoint}`);
        }
      } else {
        addLog('❌ No working endpoints found - check project UID and network connectivity');
      }
      
      // Log detailed results
      results.results.forEach(result => {
        const status = result.success ? '✅' : '❌';
        addLog(`  ${status} ${result.region}: ${result.endpoint} (${result.responseTime}ms)`);
        if (result.error) {
          addLog(`    Error: ${result.error}`);
        }
      });
      
    } catch (error: any) {
      addLog(`❌ Failed to test endpoints: ${error.message}`);
    }
  }, [addLog]);

  // Debug manifest endpoint in detail
  const debugManifest = useCallback(async () => {
    addLog('🔍 Starting detailed manifest debugging...');
    try {
      const result = await debugManifestEndpoint();
      
      addLog(`📊 Manifest debug result: ${result.success ? 'SUCCESS' : 'FAILED'}`);
      
      if (result.success && result.analysis) {
        const analysis = result.analysis;
        addLog(`📋 Found ${analysis.experienceCount} experiences (${analysis.activeExperiences} active)`);
        addLog(`🎯 Found ${analysis.variantCount} variants`);
        addLog(`👥 Found ${analysis.audienceCount} audiences`);
        addLog(`📄 Content types: ${analysis.contentTypes.join(', ') || 'None'}`);
        
        if (analysis.detailedAnalysis.issues.length > 0) {
          addLog(`⚠️ Configuration issues found:`);
          analysis.detailedAnalysis.issues.forEach((issue: string) => {
            addLog(`  • ${issue}`);
          });
        }
        
        if (analysis.detailedAnalysis.recommendations.length > 0) {
          addLog(`💡 Recommendations:`);
          analysis.detailedAnalysis.recommendations.forEach((rec: string) => {
            addLog(`  • ${rec}`);
          });
        }
      } else {
        addLog(`❌ Error: ${result.error}`);
        if (result.recommendations.length > 0) {
          addLog(`💡 Suggestions:`);
          result.recommendations.forEach((rec: string) => {
            addLog(`  • ${rec}`);
          });
        }
      }
      
      // Log formatted results for detailed review
      const formattedResults = formatManifestDebugResults(result);
      console.log(formattedResults);
      
    } catch (error: any) {
      addLog(`❌ Manifest debugging failed: ${error.message}`);
    }
  }, [addLog]);

  // Auto-refresh effect
  useEffect(() => {
    if (autoRefresh && isVisible) {
      const interval = setInterval(runDiagnostics, 10000); // Every 10 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh, isVisible, runDiagnostics]);

  // Initial load
  useEffect(() => {
    if (isVisible) {
      runDiagnostics();
    }
  }, [isVisible, runDiagnostics]);

  // Keyboard shortcut to toggle diagnostic panel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        setIsVisible(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!isVisible) {
    return (
      <div className="personalize-diagnostic-toggle">
        <button 
          onClick={() => setIsVisible(true)}
          className="diagnostic-toggle-button"
          title="Open Personalize Diagnostic Panel (Ctrl+Shift+D)"
        >
          🔍 Debug
        </button>
      </div>
    );
  }

  const renderOverview = () => (
    <div className="diagnostic-overview">
      <div className="diagnostic-status-grid">
        <div className="status-card">
          <h4>Configuration</h4>
          <div className={`status-indicator ${diagnosticState.validationResults?.isValid ? 'success' : 'error'}`}>
            {diagnosticState.validationResults?.isValid ? '✅ Valid' : '❌ Invalid'}
          </div>
          {diagnosticState.validationResults?.errors?.length > 0 && (
            <div className="error-count">{diagnosticState.validationResults.errors.length} errors</div>
          )}
        </div>

        <div className="status-card">
          <h4>API Connectivity</h4>
          <div className={`status-indicator ${diagnosticState.apiTestResults?.connectivity?.success ? 'success' : 'error'}`}>
            {diagnosticState.apiTestResults?.connectivity?.success ? '✅ Connected' : '❌ Failed'}
          </div>
        </div>

        <div className="status-card">
          <h4>SDK Status</h4>
          <div className={`status-indicator ${diagnosticState.sdkStatus?.currentState?.isReady ? 'success' : 'warning'}`}>
            {diagnosticState.sdkStatus?.currentState?.isReady ? '✅ Ready' : '⚠️ Not Ready'}
          </div>
        </div>

        <div className="status-card">
          <h4>Experiences</h4>
          <div className={`status-indicator ${diagnosticState.sdkStatus?.currentState?.experienceCount > 0 ? 'success' : 'warning'}`}>
            {diagnosticState.sdkStatus?.currentState?.experienceCount || 0} found
          </div>
        </div>

        <div className="status-card">
          <h4>Variant Aliases</h4>
          <div className={`status-indicator ${diagnosticState.sdkStatus?.currentState?.variantAliasCount > 0 ? 'success' : 'warning'}`}>
            {diagnosticState.sdkStatus?.currentState?.variantAliasCount || 0} found
          </div>
        </div>

        <div className="status-card">
          <h4>Overall Status</h4>
          <div className={`status-indicator ${
            diagnosticState.validationResults?.isValid && 
            diagnosticState.apiTestResults?.connectivity?.success && 
            diagnosticState.sdkStatus?.currentState?.isReady &&
            diagnosticState.sdkStatus?.currentState?.experienceCount > 0
              ? 'success' : 'error'
          }`}>
            {diagnosticState.validationResults?.isValid && 
             diagnosticState.apiTestResults?.connectivity?.success && 
             diagnosticState.sdkStatus?.currentState?.isReady &&
             diagnosticState.sdkStatus?.currentState?.experienceCount > 0
              ? '✅ Healthy' : '❌ Issues Found'}
          </div>
        </div>
      </div>

      <div className="diagnostic-actions">
        <button 
          onClick={runDiagnostics} 
          disabled={diagnosticState.isRunning}
          className="diagnostic-button primary"
        >
          {diagnosticState.isRunning ? '🔄 Running...' : '🔍 Run Diagnostics'}
        </button>

        <button 
          onClick={testUserAttributes}
          className="diagnostic-button secondary"
        >
          👤 Test User Attributes
        </button>

        <button 
          onClick={testAllEndpoints}
          className="diagnostic-button secondary"
        >
          🌐 Test All API Endpoints
        </button>

        <button 
          onClick={debugManifest}
          className="diagnostic-button secondary"
        >
          🔍 Debug Manifest
        </button>

        <label className="auto-refresh-toggle">
          <input
            type="checkbox"
            checked={autoRefresh}
            onChange={(e) => setAutoRefresh(e.target.checked)}
          />
          Auto-refresh (10s)
        </label>
      </div>

      {diagnosticState.error && (
        <div className="error-message">
          <h4>❌ Error</h4>
          <pre>{diagnosticState.error}</pre>
        </div>
      )}
    </div>
  );

  const renderApiTests = () => (
    <div className="diagnostic-api">
      {diagnosticState.apiTestResults ? (
        <div className="api-results">
          <pre className="api-results-text">
            {formatApiTestResults(diagnosticState.apiTestResults)}
          </pre>
          
          {diagnosticState.apiTestResults.manifest?.data && (
            <div className="manifest-details">
              <h4>📋 Manifest Details</h4>
              <pre>{JSON.stringify(diagnosticState.apiTestResults.manifest.data, null, 2)}</pre>
            </div>
          )}
        </div>
      ) : (
        <div className="no-data">
          <p>No API test results available. Click "Run Diagnostics" to test API connectivity.</p>
        </div>
      )}
    </div>
  );

  const renderSdkStatus = () => (
    <div className="diagnostic-sdk">
      {diagnosticState.sdkStatus?.currentState ? (
        <div className="sdk-details">
          <h4>🔧 SDK State</h4>
          <pre>{JSON.stringify(diagnosticState.sdkStatus.currentState, null, 2)}</pre>
          
          {diagnosticState.sdkStatus.currentState.experiences?.length > 0 && (
            <div className="experiences-details">
              <h4>🎯 Active Experiences</h4>
              <pre>{JSON.stringify(diagnosticState.sdkStatus.currentState.experiences, null, 2)}</pre>
            </div>
          )}
        </div>
      ) : (
        <div className="no-data">
          <p>No SDK status available. Click "Run Diagnostics" to check SDK state.</p>
        </div>
      )}
    </div>
  );

  const renderValidation = () => (
    <div className="diagnostic-validation">
      {diagnosticState.validationResults ? (
        <div className="validation-results">
          <div className="validation-section">
            <h4>✅ Validation Status</h4>
            <p className={`validation-status ${diagnosticState.validationResults.isValid ? 'success' : 'error'}`}>
              {diagnosticState.validationResults.isValid ? 'Configuration is valid' : 'Configuration has issues'}
            </p>
          </div>

          {diagnosticState.validationResults.errors?.length > 0 && (
            <div className="validation-section">
              <h4>❌ Errors ({diagnosticState.validationResults.errors.length})</h4>
              <ul className="validation-list error">
                {diagnosticState.validationResults.errors.map((error: string, index: number) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          {diagnosticState.validationResults.warnings?.length > 0 && (
            <div className="validation-section">
              <h4>⚠️ Warnings ({diagnosticState.validationResults.warnings.length})</h4>
              <ul className="validation-list warning">
                {diagnosticState.validationResults.warnings.map((warning: string, index: number) => (
                  <li key={index}>{warning}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : (
        <div className="no-data">
          <p>No validation results available. Click "Run Diagnostics" to validate configuration.</p>
        </div>
      )}
    </div>
  );

  const renderLogs = () => (
    <div className="diagnostic-logs">
      <div className="logs-header">
        <h4>📝 Diagnostic Logs</h4>
        <button 
          onClick={() => setLogs([])}
          className="diagnostic-button secondary small"
        >
          Clear Logs
        </button>
      </div>
      <div className="logs-content">
        {logs.length === 0 ? (
          <p className="no-logs">No logs available. Run diagnostics to see activity.</p>
        ) : (
          <pre className="logs-text">
            {logs.join('\n')}
          </pre>
        )}
      </div>
    </div>
  );

  const renderValidationChecklist = () => (
    <div className="diagnostic-checklist">
      {diagnosticState.validationChecklist ? (
        <div className="checklist-results">
          <div className="checklist-summary">
            <h4>📋 Validation Checklist Results</h4>
            <div className={`checklist-status ${diagnosticState.validationChecklist.overallStatus}`}>
              {diagnosticState.validationChecklist.overallStatus === 'pass' ? '✅ PASS' : 
               diagnosticState.validationChecklist.overallStatus === 'fail' ? '❌ FAIL' : '⚠️ WARNING'}
            </div>
            <div className="checklist-stats">
              {diagnosticState.validationChecklist.passedChecks}/{diagnosticState.validationChecklist.totalChecks} passed, {' '}
              {diagnosticState.validationChecklist.failedChecks} failed, {' '}
              {diagnosticState.validationChecklist.warningChecks} warnings
            </div>
          </div>

          <div className="checklist-summary-text">
            <p>{diagnosticState.validationChecklist.summary}</p>
          </div>

          {diagnosticState.validationChecklist.nextSteps.length > 0 && (
            <div className="checklist-next-steps">
              <h4>🛠️ Next Steps:</h4>
              <ul>
                {diagnosticState.validationChecklist.nextSteps.map((step, index) => (
                  <li key={index}>{step}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="checklist-categories">
            {['configuration', 'api', 'sdk', 'content', 'audience'].map(category => {
              const categoryChecks = diagnosticState.validationChecklist!.checks.filter(c => c.category === category);
              if (categoryChecks.length === 0) return null;

              return (
                <div key={category} className="checklist-category">
                  <h4>📂 {category.toUpperCase()} CHECKS</h4>
                  {categoryChecks.map((check, index) => (
                    <div key={index} className={`checklist-item ${check.status}`}>
                      <div className="checklist-item-header">
                        <span className="checklist-item-icon">
                          {check.status === 'pass' ? '✅' : check.status === 'fail' ? '❌' : 
                           check.status === 'warning' ? '⚠️' : '⏭️'}
                        </span>
                        <span className="checklist-item-name">{check.name}</span>
                        <span className={`checklist-item-priority ${check.priority}`}>
                          {check.priority}
                        </span>
                      </div>
                      <div className="checklist-item-message">{check.message}</div>
                      {check.recommendation && (
                        <div className="checklist-item-recommendation">
                          💡 {check.recommendation}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="no-data">
          <p>No validation checklist results available. Click "Run Diagnostics" to generate a comprehensive validation report.</p>
        </div>
      )}
    </div>
  );

  const renderContentAnalysis = () => (
    <div className="diagnostic-content-analysis">
      {diagnosticState.contentComparison ? (
        <div className="content-comparison">
          <h4>🔍 Content Comparison Results</h4>
          <div className="comparison-summary">
            <p>
              <strong>Variants Used:</strong> {diagnosticState.contentComparison.variantAliases.join(', ') || 'None'}
            </p>
            <p>
              <strong>Differences Found:</strong> {diagnosticState.contentComparison.differences.length}
            </p>
            <p className={`comparison-status ${diagnosticState.contentComparison.hasVariantDifferences ? 'success' : 'warning'}`}>
              {diagnosticState.contentComparison.hasVariantDifferences ? 
                '✅ Variant content is different from default' : 
                '⚠️ Variant content is identical to default'}
            </p>
          </div>

          {diagnosticState.contentComparison.differences.length > 0 && (
            <div className="content-differences">
              <h4>📝 Content Differences</h4>
              <pre className="differences-text">
                {formatContentDifferences(diagnosticState.contentComparison.differences)}
              </pre>
            </div>
          )}
        </div>
      ) : (
        <div className="no-data">
          <p>No content comparison available. Variant aliases must be present to compare content versions.</p>
        </div>
      )}
    </div>
  );

  const renderAudienceTests = () => (
    <div className="diagnostic-audience">
      {diagnosticState.userAttributeTests ? (
        <div className="audience-tests">
          <h4>👥 User Attribute Test Results</h4>
          <div className="audience-summary">
            <div className="audience-stats">
              <span>Total Tests: {diagnosticState.userAttributeTests.summary.totalTests}</span>
              <span>Passed: {diagnosticState.userAttributeTests.summary.passedTests}</span>
              <span>Failed: {diagnosticState.userAttributeTests.summary.failedTests}</span>
              <span>Accuracy: {(diagnosticState.userAttributeTests.summary.accuracy * 100).toFixed(1)}%</span>
            </div>
            <div className="audience-personalization">
              <span>Personalization Triggered: {diagnosticState.userAttributeTests.summary.personalizationTriggered}</span>
              <span>Expected: {diagnosticState.userAttributeTests.summary.personalizationExpected}</span>
            </div>
          </div>

          <div className="audience-test-results">
            <h4>📊 Individual Test Results</h4>
            {diagnosticState.userAttributeTests.testResults.map((result: any, index: number) => (
              <div key={index} className={`audience-test-item ${result.success ? 'success' : 'fail'}`}>
                <div className="test-header">
                  <span className="test-icon">
                    {result.success && result.hasVariants === result.testCase.shouldTriggerPersonalization ? '✅' : '❌'}
                  </span>
                  <span className="test-name">{result.testCase.name}</span>
                  <span className="test-duration">{result.duration}ms</span>
                </div>
                <div className="test-description">{result.testCase.description}</div>
                <div className="test-details">
                  <div>Expected Personalization: {result.testCase.shouldTriggerPersonalization ? 'Yes' : 'No'}</div>
                  <div>Actual Variants: {result.hasVariants ? 'Yes' : 'No'} ({result.variantAliases.length})</div>
                  <div>Variant Aliases: {result.variantAliases.join(', ') || 'None'}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="no-data">
          <p>No audience test results available. Click "Run Diagnostics" to test user attribute scenarios.</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="personalize-diagnostic">
      <div className="diagnostic-header">
        <h3>🔍 Personalize Diagnostic Panel</h3>
        <div className="diagnostic-controls">
          <span className="last-update">
            Last updated: {new Date(diagnosticState.lastUpdate).toLocaleTimeString()}
          </span>
          <button 
            onClick={() => setIsVisible(false)}
            className="diagnostic-close"
          >
            ✕
          </button>
        </div>
      </div>

      <div className="diagnostic-tabs">
        <button 
          className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          📊 Overview
        </button>
        <button 
          className={`tab-button ${activeTab === 'api' ? 'active' : ''}`}
          onClick={() => setActiveTab('api')}
        >
          🌐 API Tests
        </button>
        <button 
          className={`tab-button ${activeTab === 'sdk' ? 'active' : ''}`}
          onClick={() => setActiveTab('sdk')}
        >
          🔧 SDK Status
        </button>
        <button 
          className={`tab-button ${activeTab === 'checklist' ? 'active' : ''}`}
          onClick={() => setActiveTab('checklist')}
        >
          📋 Checklist
        </button>
        <button 
          className={`tab-button ${activeTab === 'content' ? 'active' : ''}`}
          onClick={() => setActiveTab('content')}
        >
          📄 Content
        </button>
        <button 
          className={`tab-button ${activeTab === 'audience' ? 'active' : ''}`}
          onClick={() => setActiveTab('audience')}
        >
          👥 Audience
        </button>
        <button 
          className={`tab-button ${activeTab === 'validation' ? 'active' : ''}`}
          onClick={() => setActiveTab('validation')}
        >
          ✅ Validation
        </button>
        <button 
          className={`tab-button ${activeTab === 'logs' ? 'active' : ''}`}
          onClick={() => setActiveTab('logs')}
        >
          📝 Logs
        </button>
      </div>

      <div className="diagnostic-content">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'checklist' && renderValidationChecklist()}
        {activeTab === 'api' && renderApiTests()}
        {activeTab === 'sdk' && renderSdkStatus()}
        {activeTab === 'content' && renderContentAnalysis()}
        {activeTab === 'audience' && renderAudienceTests()}
        {activeTab === 'validation' && renderValidation()}
        {activeTab === 'logs' && renderLogs()}
      </div>
    </div>
  );
};

export default PersonalizeDiagnostic;