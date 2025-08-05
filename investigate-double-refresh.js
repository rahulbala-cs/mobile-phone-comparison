const { chromium } = require('playwright');

async function investigateDoubleRefresh() {
  console.log('🔍 Starting double refresh investigation...\n');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Track events
  let pageLoadEvents = [];
  let navigationEvents = [];
  let networkRequests = [];
  let consoleMessages = [];
  let reactRenderEvents = [];
  
  // Monitor page loads
  page.on('load', () => {
    const timestamp = new Date().toISOString();
    pageLoadEvents.push(timestamp);
    console.log(`📄 Page Load Event #${pageLoadEvents.length} at ${timestamp}`);
  });
  
  // Monitor navigation
  page.on('framenavigated', (frame) => {
    if (frame === page.mainFrame()) {
      const timestamp = new Date().toISOString();
      navigationEvents.push({ timestamp, url: frame.url() });
      console.log(`🧭 Navigation Event #${navigationEvents.length} to: ${frame.url()}`);
    }
  });
  
  // Monitor network requests
  page.on('request', (request) => {
    if (request.url().includes('localhost:3002') || 
        request.url().includes('contentstack.io') ||
        request.resourceType() === 'document') {
      const reqData = {
        timestamp: new Date().toISOString(),
        url: request.url(),
        method: request.method(),
        resourceType: request.resourceType()
      };
      networkRequests.push(reqData);
      console.log(`🌐 Request: ${request.method()} ${request.resourceType()} ${request.url()}`);
    }
  });
  
  // Monitor console messages for React patterns
  page.on('console', (msg) => {
    const msgData = {
      timestamp: new Date().toISOString(),
      type: msg.type(),
      text: msg.text()
    };
    consoleMessages.push(msgData);
    
    // Track React-specific patterns
    if (msg.text().includes('Hero') || 
        msg.text().includes('HomePage') || 
        msg.text().includes('useEffect') ||
        msg.text().includes('personalize') ||
        msg.text().includes('loading') ||
        msg.text().includes('hasLoadedRef')) {
      reactRenderEvents.push(msgData);
      console.log(`⚛️  React Event [${msg.type()}]: ${msg.text()}`);
    } else {
      console.log(`💬 Console [${msg.type()}]: ${msg.text()}`);
    }
  });
  
  try {
    console.log('🚀 Step 1: Initial navigation to home page...\n');
    
    // Initial navigation
    await page.goto('http://localhost:3002', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    console.log('\n⏱️  Step 2: Waiting 3 seconds after initial load...\n');
    await page.waitForTimeout(3000);
    
    // Reset tracking for refresh test
    const preRefreshState = {
      pageLoads: pageLoadEvents.length,
      navigations: navigationEvents.length,
      requests: networkRequests.length,
      consoleMessages: consoleMessages.length,
      reactEvents: reactRenderEvents.length
    };
    
    console.log('🔄 Step 3: Performing manual refresh (F5)...\n');
    
    // Manual refresh
    await page.reload({ waitUntil: 'networkidle', timeout: 30000 });
    
    console.log('\n⏱️  Step 4: Waiting 8 seconds after refresh to observe all behavior...\n');
    await page.waitForTimeout(8000);
    
    // Analysis
    const postRefreshState = {
      pageLoads: pageLoadEvents.length - preRefreshState.pageLoads,
      navigations: navigationEvents.length - preRefreshState.navigations,
      requests: networkRequests.length - preRefreshState.requests,
      consoleMessages: consoleMessages.length - preRefreshState.consoleMessages,
      reactEvents: reactRenderEvents.length - preRefreshState.reactEvents
    };
    
    console.log('\n📊 DOUBLE REFRESH ANALYSIS:');
    console.log('='.repeat(60));
    console.log(`🔄 Page loads during refresh: ${postRefreshState.pageLoads}`);
    console.log(`🧭 Navigations during refresh: ${postRefreshState.navigations}`);
    console.log(`🌐 Network requests during refresh: ${postRefreshState.requests}`);
    console.log(`💬 Console messages during refresh: ${postRefreshState.consoleMessages}`);
    console.log(`⚛️  React events during refresh: ${postRefreshState.reactEvents}`);
    
    // Detailed analysis
    if (postRefreshState.pageLoads > 1) {
      console.log('\n🚨 DOUBLE REFRESH CONFIRMED!');
      console.log('\n📋 Recent page load timestamps:');
      pageLoadEvents.slice(-postRefreshState.pageLoads).forEach((timestamp, index) => {
        console.log(`   Load #${index + 1}: ${timestamp}`);
      });
    }
    
    if (postRefreshState.reactEvents > 0) {
      console.log('\n⚛️  React Events During Refresh:');
      reactRenderEvents.slice(-postRefreshState.reactEvents).forEach(event => {
        console.log(`   [${event.type}] ${event.timestamp}: ${event.text}`);
      });
    }
    
    // Check for specific patterns
    const suspiciousPatterns = consoleMessages.filter(msg => 
      msg.text.includes('hasLoadedRef.current') ||
      msg.text.includes('duplicate') ||
      msg.text.includes('twice') ||
      msg.text.includes('multiple') ||
      msg.text.includes('Fetched') ||
      msg.text.includes('useEffect')
    ).slice(-10);
    
    if (suspiciousPatterns.length > 0) {
      console.log('\n🕵️  Suspicious Patterns Found:');
      suspiciousPatterns.forEach(pattern => {
        console.log(`   [${pattern.type}] ${pattern.text}`);
      });
    }
    
    // Network request analysis
    const documentRequests = networkRequests.filter(req => 
      req.resourceType === 'document' && req.url.includes('localhost:3002')
    ).slice(-5);
    
    console.log('\n📡 Document Requests (potential page reloads):');
    documentRequests.forEach(req => {
      console.log(`   ${req.timestamp}: ${req.method} ${req.url}`);
    });
    
    // Check for useEffect patterns
    const useEffectMessages = consoleMessages.filter(msg => 
      msg.text.includes('loadContentWithParallelOptimization') ||
      msg.text.includes('globalPersonalize.isReady') ||
      msg.text.includes('hasLoadedRef')
    );
    
    if (useEffectMessages.length > 0) {
      console.log('\n🎣 useEffect Related Messages:');
      useEffectMessages.slice(-5).forEach(msg => {
        console.log(`   [${msg.type}] ${msg.text}`);
      });
    }
    
    console.log('\n🏁 Investigation Results Summary:');
    console.log('='.repeat(60));
    if (postRefreshState.pageLoads > 1) {
      console.log('❌ ISSUE CONFIRMED: Double refresh detected');
      console.log(`   - ${postRefreshState.pageLoads} page loads occurred`);
      console.log(`   - ${postRefreshState.reactEvents} React events triggered`);
    } else {
      console.log('✅ No double refresh detected in this test run');
    }
    
  } catch (error) {
    console.error('❌ Investigation failed:', error.message);
  } finally {
    console.log('\n🔍 Browser will remain open for 30 seconds for manual inspection...');
    await page.waitForTimeout(30000);
    await browser.close();
  }
}

// Run the investigation
investigateDoubleRefresh().catch(console.error);