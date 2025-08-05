const { chromium } = require('playwright');

async function investigateDoubleRefresh() {
  console.log('🔍 Starting double refresh investigation...\n');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000 // Slow down for better observation
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Track page loads and navigation events
  let pageLoadCount = 0;
  let navigationCount = 0;
  let networkRequests = [];
  let consoleMessages = [];
  
  // Monitor page loads
  page.on('load', () => {
    pageLoadCount++;
    console.log(`📄 Page Load #${pageLoadCount} at ${new Date().toISOString()}`);
  });
  
  // Monitor navigation
  page.on('framenavigated', (frame) => {
    if (frame === page.mainFrame()) {
      navigationCount++;
      console.log(`🧭 Navigation #${navigationCount} to: ${frame.url()}`);
    }
  });
  
  // Monitor network requests
  page.on('request', (request) => {
    if (request.url().includes('contentstack.io') || request.url().includes('localhost:3000')) {
      networkRequests.push({
        timestamp: new Date().toISOString(),
        url: request.url(),
        method: request.method(),
        resourceType: request.resourceType()
      });
      console.log(`🌐 Network Request: ${request.method()} ${request.url()}`);
    }
  });
  
  // Monitor console messages
  page.on('console', (msg) => {
    consoleMessages.push({
      timestamp: new Date().toISOString(),
      type: msg.type(),
      text: msg.text()
    });
    console.log(`💬 Console [${msg.type()}]: ${msg.text()}`);
  });
  
  console.log('🚀 Initial navigation to home page...\n');
  
  try {
    // Initial navigation
    await page.goto('http://localhost:3000', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    console.log('\n⏱️  Waiting 3 seconds after initial load...\n');
    await page.waitForTimeout(3000);
    
    console.log('🔄 Performing manual refresh (F5)...\n');
    
    // Reset counters for refresh test
    const preRefreshPageLoads = pageLoadCount;
    const preRefreshNavigations = navigationCount;
    const preRefreshRequests = networkRequests.length;
    
    // Perform manual refresh
    await page.reload({ waitUntil: 'networkidle', timeout: 30000 });
    
    console.log('\n⏱️  Waiting 5 seconds after refresh to observe behavior...\n');
    await page.waitForTimeout(5000);
    
    // Analysis
    const postRefreshPageLoads = pageLoadCount - preRefreshPageLoads;
    const postRefreshNavigations = navigationCount - preRefreshNavigations;
    const postRefreshRequests = networkRequests.length - preRefreshRequests;
    
    console.log('\n📊 REFRESH ANALYSIS:');
    console.log('='.repeat(50));
    console.log(`🔄 Page loads during refresh: ${postRefreshPageLoads}`);
    console.log(`🧭 Navigations during refresh: ${postRefreshNavigations}`);
    console.log(`🌐 Network requests during refresh: ${postRefreshRequests}`);
    
    if (postRefreshPageLoads > 1) {
      console.log('\n⚠️  DOUBLE REFRESH DETECTED!');
      console.log('📋 Recent console messages:');
      consoleMessages.slice(-10).forEach(msg => {
        console.log(`   [${msg.type}] ${msg.text}`);
      });
    } else {
      console.log('\n✅ No double refresh detected');
    }
    
    // Check for specific React patterns that might cause re-renders
    console.log('\n🔍 Checking for React re-render patterns...');
    
    const reactRelatedMessages = consoleMessages.filter(msg => 
      msg.text.includes('useEffect') || 
      msg.text.includes('render') ||
      msg.text.includes('personalize') ||
      msg.text.includes('loading') ||
      msg.text.includes('HomePage') ||
      msg.text.includes('Hero')
    );
    
    console.log(`📝 Found ${reactRelatedMessages.length} React-related console messages:`);
    reactRelatedMessages.forEach(msg => {
      console.log(`   [${msg.type}] ${msg.text}`);
    });
    
    // Check network patterns
    console.log('\n🌐 Analyzing network request patterns...');
    const contentstackRequests = networkRequests.filter(req => 
      req.url.includes('contentstack.io')
    ).slice(-10);
    
    console.log(`📡 Recent Contentstack requests (${contentstackRequests.length}):`);
    contentstackRequests.forEach(req => {
      console.log(`   ${req.method} ${req.url}`);
    });
    
    // Wait a bit more to catch any delayed effects
    console.log('\n⏳ Waiting additional 5 seconds to catch delayed effects...');
    await page.waitForTimeout(5000);
    
    const finalPageLoads = pageLoadCount - preRefreshPageLoads;
    if (finalPageLoads !== postRefreshPageLoads) {
      console.log(`\n🚨 DELAYED REFRESH DETECTED! Final page loads: ${finalPageLoads}`);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    console.log('\n🏁 Investigation complete. Browser will remain open for manual inspection...');
    // Keep browser open for manual inspection
    await page.waitForTimeout(30000);
    await browser.close();
  }
}

// Run the investigation
investigateDoubleRefresh().catch(console.error);