const { chromium } = require('playwright');

async function testContentLoading() {
  console.log('🔍 Testing content loading...\n');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Monitor errors and console messages
  const errors = [];
  const consoleMessages = [];
  
  page.on('pageerror', (error) => {
    errors.push({
      timestamp: new Date().toISOString(),
      message: error.message,
      stack: error.stack
    });
    console.log(`❌ Page Error: ${error.message}`);
  });
  
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleMessages.push({
        timestamp: new Date().toISOString(),
        type: msg.type(),
        text: msg.text()
      });
      console.log(`🚨 Console Error: ${msg.text()}`);
    } else if (msg.text().includes('failed') || msg.text().includes('error') || msg.text().includes('❌')) {
      console.log(`⚠️  Console Warning: ${msg.text()}`);
    }
  });
  
  try {
    console.log('🚀 Navigating to home page...\n');
    
    await page.goto('http://localhost:3002', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    console.log('⏳ Waiting for content to load...');
    await page.waitForTimeout(5000);
    
    // Check if main content elements are present
    const heroSection = await page.$('.hero');
    const featuresSection = await page.$('.features');
    const comparisonsSection = await page.$('.featured-comparisons');
    
    console.log('\n📊 Content Status:');
    console.log(`🎯 Hero Section: ${heroSection ? '✅ Present' : '❌ Missing'}`);
    console.log(`🔥 Features Section: ${featuresSection ? '✅ Present' : '❌ Missing'}`);
    console.log(`📱 Comparisons Section: ${comparisonsSection ? '✅ Present' : '❌ Missing'}`);
    
    // Check for loading states
    const skeleton = await page.$('.skeleton-container');
    const errorState = await page.$('[style*="color: #dc2626"]');
    
    console.log(`💀 Skeleton Loading: ${skeleton ? '⚠️  Still loading' : '✅ Loaded'}`);
    console.log(`🚨 Error State: ${errorState ? '❌ Error present' : '✅ No errors'}`);
    
    // Check for specific text content
    const heroTitle = await page.textContent('h1');
    const heroSubtitle = await page.textContent('.hero__subtitle');
    
    console.log('\n📝 Content Text:');
    console.log(`📖 Hero Title: ${heroTitle || 'NOT FOUND'}`);
    console.log(`📄 Hero Subtitle: ${heroSubtitle || 'NOT FOUND'}`);
    
    // Check if there are any React errors
    if (errors.length > 0) {
      console.log('\n🚨 JavaScript Errors:');
      errors.forEach(error => {
        console.log(`   ${error.timestamp}: ${error.message}`);
      });
    }
    
    if (consoleMessages.filter(m => m.type === 'error').length > 0) {
      console.log('\n🚨 Console Errors:');
      consoleMessages.filter(m => m.type === 'error').forEach(msg => {
        console.log(`   ${msg.timestamp}: ${msg.text}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    console.log('\n🔍 Browser will remain open for manual inspection...');
    await page.waitForTimeout(30000);
    await browser.close();
  }
}

testContentLoading().catch(console.error);