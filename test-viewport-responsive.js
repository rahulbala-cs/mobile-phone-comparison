const { chromium } = require('playwright');

async function testViewportResponsive() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  console.log('🧪 Testing Viewport Responsiveness for Multiple Phones...');
  
  const viewports = [
    { name: 'Desktop Large', width: 1400, height: 800 },
    { name: 'Desktop Medium', width: 1200, height: 800 },
    { name: 'Desktop Small', width: 1000, height: 800 },
    { name: 'Tablet', width: 800, height: 600 },
    { name: 'Mobile', width: 600, height: 800 }
  ];
  
  const results = {
    viewportTests: {},
    testsPassed: 0,
    totalTests: viewports.length
  };
  
  try {
    for (const viewport of viewports) {
      console.log(`\n✅ TEST: ${viewport.name} (${viewport.width}x${viewport.height})`);
      console.log('=' .repeat(60));
      
      // Set viewport size
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      
      // Navigate to comparison page
      await page.goto('http://localhost:3002/compare/oneplus-13-vs-samsung-galaxy-s24-ultra', {
        waitUntil: 'networkidle',
        timeout: 30000
      });
      
      await page.waitForTimeout(2000);
      
      // Add a third phone to test 3-phone layout
      const addButton = await page.$('.msp-add-phone-card');
      if (addButton) {
        try {
          await addButton.click();
          await page.waitForTimeout(1500);
          
          const phoneOption = await page.$('.phone-selector-card');
          if (phoneOption) {
            await phoneOption.click();
            await page.waitForTimeout(2000);
          }
        } catch (e) {
          console.log('⚠️ Could not add third phone, continuing with 2-phone test');
        }
      }
      
      // Get phone count
      const phoneCount = await page.$eval('.msp-product-cards', el => el.getAttribute('data-phone-count') || '0');
      
      // Check if content overflows viewport
      const measurements = await page.evaluate(() => {
        const productCards = document.querySelector('.msp-product-cards');
        const specsContainer = document.querySelector('.msp-unified-comparison-container');
        const specsGrid = document.querySelector('.msp-comparison-grid');
        
        return {
          viewport: { width: window.innerWidth, height: window.innerHeight },
          productCards: {
            scrollWidth: productCards?.scrollWidth || 0,
            clientWidth: productCards?.clientWidth || 0,
            offsetWidth: productCards?.offsetWidth || 0
          },
          specsContainer: {
            scrollWidth: specsContainer?.scrollWidth || 0,
            clientWidth: specsContainer?.clientWidth || 0,
            offsetWidth: specsContainer?.offsetWidth || 0
          },
          specsGrid: {
            scrollWidth: specsGrid?.scrollWidth || 0,
            clientWidth: specsGrid?.clientWidth || 0,
            offsetWidth: specsGrid?.offsetWidth || 0
          }
        };
      });
      
      const needsHorizontalScroll = 
        measurements.productCards.scrollWidth > measurements.productCards.clientWidth ||
        measurements.specsContainer.scrollWidth > measurements.specsContainer.clientWidth ||
        measurements.specsGrid.scrollWidth > measurements.viewport.width;
      
      const hasScrollability = await page.evaluate(() => {
        const container = document.querySelector('.msp-unified-comparison-container');
        const containerStyle = window.getComputedStyle(container);
        return containerStyle.overflowX === 'auto' || containerStyle.overflowX === 'scroll';
      });
      
      console.log(`📊 Phone count: ${phoneCount}`);
      console.log(`📊 Viewport: ${measurements.viewport.width}x${measurements.viewport.height}`);
      console.log(`📊 Product cards: ${measurements.productCards.scrollWidth}px scroll vs ${measurements.productCards.clientWidth}px client`);
      console.log(`📊 Specs container: ${measurements.specsContainer.scrollWidth}px scroll vs ${measurements.specsContainer.clientWidth}px client`);
      console.log(`📊 Needs horizontal scroll: ${needsHorizontalScroll}`);
      console.log(`📊 Has scrollability: ${hasScrollability}`);
      
      // Test passed if:
      // 1. For small viewports with multiple phones, scrolling should be enabled
      // 2. For large viewports, content should fit or have proper scrolling
      const isSmallViewport = viewport.width <= 1000;
      const hasMultiplePhones = parseInt(phoneCount) >= 2;
      
      let testPassed = false;
      
      if (isSmallViewport && hasMultiplePhones) {
        // Small viewport with multiple phones should have scrolling capability
        testPassed = hasScrollability && (needsHorizontalScroll || measurements.specsContainer.scrollWidth > measurements.viewport.width);
        console.log(`✅ Small viewport test: ${testPassed ? 'PASS' : 'FAIL'} - Should have horizontal scrolling`);
      } else {
        // Large viewport should either fit content or have proper overflow handling
        testPassed = !needsHorizontalScroll || hasScrollability;
        console.log(`✅ Large viewport test: ${testPassed ? 'PASS' : 'FAIL'} - Content should fit or scroll properly`);
      }
      
      results.viewportTests[viewport.name] = {
        phoneCount: parseInt(phoneCount),
        needsScroll: needsHorizontalScroll,
        hasScrollability,
        measurements,
        passed: testPassed
      };
      
      if (testPassed) {
        results.testsPassed++;
      }
      
      // Take a screenshot for this viewport
      await page.screenshot({ path: `viewport-${viewport.name.toLowerCase().replace(' ', '-')}-${phoneCount}phones.png` });
    }
    
    console.log('\n📊 FINAL VIEWPORT TEST RESULTS');
    console.log('='.repeat(70));
    console.log(`Tests Passed: ${results.testsPassed}/${results.totalTests}`);
    console.log(`Success Rate: ${Math.round((results.testsPassed / results.totalTests) * 100)}%`);
    
    console.log('\n📋 Detailed Results:');
    Object.entries(results.viewportTests).forEach(([viewport, data]) => {
      const status = data.passed ? '✅' : '❌';
      console.log(`${status} ${viewport}: ${data.phoneCount} phones, ${data.needsScroll ? 'needs' : 'no'} scroll, ${data.hasScrollability ? 'has' : 'no'} scrollability`);
    });
    
    if (results.testsPassed === results.totalTests) {
      console.log('\n🎉 ALL VIEWPORT TESTS PASSED! Responsive layout working perfectly!');
    } else {
      console.log(`\n🔧 ${results.totalTests - results.testsPassed} viewport tests need attention`);
    }
    
    return results;
    
  } catch (error) {
    console.error('❌ Testing failed:', error.message);
    return { error: error.message };
  } finally {
    await browser.close();
  }
}

testViewportResponsive().then(results => {
  if (results.error) {
    console.log('\n💥 Viewport responsive test failed');
  } else if (results.testsPassed === results.totalTests) {
    console.log('\n🚀 Viewport responsiveness working perfectly!');
  } else {
    console.log(`\n🔄 ${results.testsPassed}/${results.totalTests} viewport tests working`);
  }
}).catch(console.error);