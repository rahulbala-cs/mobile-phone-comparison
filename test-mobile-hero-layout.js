const { chromium } = require('playwright');

async function testMobileHeroLayout() {
  console.log('📱 Testing mobile hero layout redesign...\n');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000
  });
  
  const context = await browser.newContext({
    viewport: { width: 375, height: 667 } // iPhone SE viewport
  });
  
  const page = await context.newPage();
  
  try {
    console.log('🚀 Loading home page on mobile viewport (375x667)...\n');
    
    await page.goto('http://localhost:3002', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    console.log('📸 Taking screenshot to analyze layout...');
    
    // Wait for content to load
    await page.waitForTimeout(3000);
    
    // Check what's in the viewport
    const heroVisual = await page.$('.hero__visual');
    const heroContent = await page.$('.hero__content');
    
    if (heroVisual) {
      const visualBounds = await heroVisual.boundingBox();
      console.log('📱 Hero Visual Position:', {
        top: Math.round(visualBounds.y),
        height: Math.round(visualBounds.height),
        inViewport: visualBounds.y < 667 && visualBounds.y + visualBounds.height > 0
      });
    }
    
    if (heroContent) {
      const contentBounds = await heroContent.boundingBox();
      console.log('📝 Hero Content Position:', {
        top: Math.round(contentBounds.y),
        height: Math.round(contentBounds.height),
        inViewport: contentBounds.y < 667 && contentBounds.y + contentBounds.height > 0
      });
    }
    
    // Check if phone comparison card is visible in viewport
    const phonePreview = await page.$('.hero__phone-preview');
    if (phonePreview) {
      const previewBounds = await phonePreview.boundingBox();
      const visibleInViewport = previewBounds.y < 667 && previewBounds.y + previewBounds.height > 0;
      console.log('🎯 Phone Comparison Card:', {
        top: Math.round(previewBounds.y),
        bottom: Math.round(previewBounds.y + previewBounds.height),
        height: Math.round(previewBounds.height),
        fullyVisible: previewBounds.y >= 0 && previewBounds.y + previewBounds.height <= 667,
        partiallyVisible: visibleInViewport
      });
      
      if (visibleInViewport) {
        console.log('✅ SUCCESS: Phone comparison card is visible in mobile viewport!');
      } else {
        console.log('❌ ISSUE: Phone comparison card is not visible in mobile viewport');
      }
    }
    
    // Take screenshot for visual verification
    await page.screenshot({ 
      path: 'mobile-hero-layout-test.png',
      fullPage: false // Only capture viewport
    });
    
    console.log('\n📸 Screenshot saved as mobile-hero-layout-test.png');
    console.log('🔍 Check the screenshot to verify the visual design');
    
    // Test different mobile sizes
    console.log('\n📱 Testing on smaller mobile (320x568)...');
    await page.setViewportSize({ width: 320, height: 568 });
    await page.waitForTimeout(1000);
    
    await page.screenshot({ 
      path: 'mobile-hero-layout-small.png',
      fullPage: false
    });
    
    console.log('📸 Small mobile screenshot saved');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    console.log('\n🔍 Browser will remain open for manual inspection...');
    await page.waitForTimeout(30000);
    await browser.close();
  }
}

testMobileHeroLayout().catch(console.error);