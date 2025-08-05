const { chromium } = require('playwright');

async function testResponsiveLayout() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  console.log('🧪 Testing Responsive Layout for Multiple Phones...');
  
  const results = {
    twoPhones: { hasDataAttribute: false, columnCount: 0, isScrollable: false },
    threePhones: { hasDataAttribute: false, columnCount: 0, isScrollable: false },
    fourPhones: { hasDataAttribute: false, columnCount: 0, isScrollable: false },
    testsPassed: 0,
    totalTests: 3
  };
  
  try {
    console.log('\n✅ TEST 1: Two Phone Comparison Layout');
    console.log('=' .repeat(50));
    
    await page.goto('http://localhost:3002/compare/oneplus-13-vs-samsung-galaxy-s24-ultra', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    
    await page.waitForTimeout(3000);
    
    // Check data-phone-count attribute
    const productCards = await page.$('.msp-product-cards');
    const phoneCount = await productCards.getAttribute('data-phone-count');
    results.twoPhones.hasDataAttribute = phoneCount === '2';
    
    // Check if grid has proper columns
    const computedStyle = await page.evaluate(() => {
      const element = document.querySelector('.msp-product-cards');
      return window.getComputedStyle(element).gridTemplateColumns;
    });
    
    const columnCount = computedStyle.split(' ').length;
    results.twoPhones.columnCount = columnCount;
    
    // Check if specifications are scrollable when needed
    const specsGrid = await page.$('.msp-comparison-grid');
    const specsPhoneCount = await specsGrid.getAttribute('data-phone-count');
    results.twoPhones.isScrollable = specsPhoneCount === '2';
    
    console.log(`📊 Phone count attribute: ${phoneCount}`);
    console.log(`📊 Grid columns: ${columnCount}`);
    console.log(`📊 Specs phone count: ${specsPhoneCount}`);
    
    if (results.twoPhones.hasDataAttribute && results.twoPhones.columnCount >= 3) {
      console.log('✅ Two phone layout working correctly');
      results.testsPassed++;
    } else {
      console.log('❌ Two phone layout issues detected');
    }
    
    console.log('\n✅ TEST 2: Add Third Phone');
    console.log('=' .repeat(50));
    
    // Try to add a third phone
    const addButton = await page.$('.msp-add-phone-card');
    if (addButton) {
      await addButton.click();
      await page.waitForTimeout(2000);
      
      // Select a phone (OnePlus or similar)
      const phoneOption = await page.$('.phone-selector-card');
      if (phoneOption) {
        await phoneOption.click();
        await page.waitForTimeout(3000);
        
        // Check new layout
        const newPhoneCount = await page.$eval('.msp-product-cards', el => el.getAttribute('data-phone-count'));
        results.threePhones.hasDataAttribute = newPhoneCount === '3';
        
        const newComputedStyle = await page.evaluate(() => {
          const element = document.querySelector('.msp-product-cards');
          return window.getComputedStyle(element).gridTemplateColumns;
        });
        
        results.threePhones.columnCount = newComputedStyle.split(' ').length;
        
        console.log(`📊 New phone count: ${newPhoneCount}`);
        console.log(`📊 New grid columns: ${results.threePhones.columnCount}`);
        
        // Check if page is horizontally scrollable when needed
        const pageWidth = await page.evaluate(() => document.body.scrollWidth);
        const viewportWidth = await page.evaluate(() => window.innerWidth);
        results.threePhones.isScrollable = pageWidth > viewportWidth;
        
        console.log(`📊 Page scrollable: ${results.threePhones.isScrollable} (width: ${pageWidth}px vs viewport: ${viewportWidth}px)`);
        
        if (results.threePhones.hasDataAttribute && results.threePhones.columnCount >= 4) {
          console.log('✅ Three phone layout working correctly');
          results.testsPassed++;
        } else {
          console.log('❌ Three phone layout issues detected');
        }
      }
    }
    
    console.log('\n✅ TEST 3: Check Specifications Scrollability');
    console.log('=' .repeat(50));
    
    // Check if specifications table is properly configured
    const specsContainer = await page.$('.msp-unified-comparison-container');
    const containerScrollWidth = await page.evaluate(el => el.scrollWidth, specsContainer);
    const containerClientWidth = await page.evaluate(el => el.clientWidth, specsContainer);
    
    const specsScrollable = containerScrollWidth > containerClientWidth;
    console.log(`📊 Specs container scrollable: ${specsScrollable} (scroll: ${containerScrollWidth}px vs client: ${containerClientWidth}px)`);
    
    if (specsScrollable || results.threePhones.columnCount <= 3) {
      console.log('✅ Specifications layout properly configured');
      results.testsPassed++;
    } else {
      console.log('❌ Specifications layout needs adjustment');
    }
    
    // Take a screenshot
    await page.screenshot({ path: 'responsive-layout-test.png', fullPage: true });
    
    console.log('\n📊 FINAL RESULTS');
    console.log('='.repeat(60));
    console.log(`Tests Passed: ${results.testsPassed}/${results.totalTests}`);
    console.log(`Success Rate: ${Math.round((results.testsPassed / results.totalTests) * 100)}%`);
    
    console.log('\n📋 Detailed Results:');
    console.log(`✅ Two Phones: ${results.twoPhones.hasDataAttribute ? 'Correct data attr' : 'Missing data attr'}, ${results.twoPhones.columnCount} columns`);
    console.log(`✅ Three Phones: ${results.threePhones.hasDataAttribute ? 'Correct data attr' : 'Missing data attr'}, ${results.threePhones.columnCount} columns`);
    console.log(`✅ Scrollability: ${results.threePhones.isScrollable ? 'Working' : 'Check needed'}`);
    
    if (results.testsPassed === results.totalTests) {
      console.log('\n🎉 ALL RESPONSIVE LAYOUT TESTS PASSED!');
    } else {
      console.log(`\n🔧 ${results.totalTests - results.testsPassed} tests need attention`);
    }
    
    console.log('\n📸 Screenshot saved as responsive-layout-test.png');
    
    return results;
    
  } catch (error) {
    console.error('❌ Testing failed:', error.message);
    return { error: error.message };
  } finally {
    await browser.close();
  }
}

testResponsiveLayout().then(results => {
  if (results.error) {
    console.log('\n💥 Responsive layout test failed');
  } else if (results.testsPassed === results.totalTests) {
    console.log('\n🚀 Responsive layout working perfectly!');
  } else {
    console.log(`\n🔄 ${results.testsPassed}/${results.totalTests} layout tests working`);
  }
}).catch(console.error);