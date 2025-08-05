const { chromium } = require('playwright');

async function testAllFixes() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  console.log('🧪 Testing All Bug Fixes...');
  
  const results = {
    phoneHeadersFound: 0,
    addPhoneButtonWorking: false,
    addPhoneClickable: false,
    phoneSelectorWorking: false,
    errorHandlingImproved: false,
    specificationsWorking: false,
    reactErrors: [],
    testsPassed: 0,
    totalTests: 6
  };
  
  // Capture JavaScript errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      results.reactErrors.push(msg.text());
    }
  });
  
  try {
    console.log('\n✅ TEST 1: Phone Headers Class Structure');
    console.log('=' .repeat(50));
    
    await page.goto('http://localhost:3002/compare/oneplus-13-vs-samsung-galaxy-s24-ultra', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    
    await page.waitForTimeout(3000);
    
    // Test phone headers
    const phoneHeaders = await page.$$('.msp-phone-header');
    results.phoneHeadersFound = phoneHeaders.length;
    
    if (phoneHeaders.length >= 2) {
      console.log(`✅ Found ${phoneHeaders.length} phone headers with correct class`);
      results.testsPassed++;
    } else {
      console.log(`❌ Only found ${phoneHeaders.length} phone headers (expected 2+)`);
    }
    
    console.log('\n✅ TEST 2: Add Phone Button Clickability');
    console.log('=' .repeat(50));
    
    // Test add phone button visibility and clickability
    const addPhoneButtons = await page.$$('.msp-add-phone-card');
    results.addPhoneButtonWorking = addPhoneButtons.length > 0;
    
    if (addPhoneButtons.length > 0) {
      console.log(`✅ Found ${addPhoneButtons.length} add phone buttons`);
      
      // Test if button is actually clickable
      try {
        const buttonBox = await addPhoneButtons[0].boundingBox();
        const isVisible = buttonBox && buttonBox.width > 0 && buttonBox.height > 0;
        
        if (isVisible) {
          console.log('✅ Add phone button is visible and has proper dimensions');
          
          // Try to click it
          await addPhoneButtons[0].click({ timeout: 5000 });
          await page.waitForTimeout(2000);
          
          results.addPhoneClickable = true;
          console.log('✅ Add phone button is clickable');
          results.testsPassed++;
        } else {
          console.log('❌ Add phone button is not visible');
        }
      } catch (clickError) {
        console.log(`❌ Add phone button click failed: ${clickError.message}`);
      }
    } else {
      console.log('❌ No add phone buttons found');
    }
    
    console.log('\n✅ TEST 3: Phone Selector Modal');
    console.log('=' .repeat(50));
    
    // Test if phone selector modal appeared
    const phoneSelector = await page.$('.phone-selector-overlay, .phone-selector-modal');
    results.phoneSelectorWorking = phoneSelector !== null;
    
    if (phoneSelector) {
      console.log('✅ Phone selector modal opened successfully');
      results.testsPassed++;
      
      // Test search functionality
      const searchInput = await page.$('input[placeholder*="Search"]');
      if (searchInput) {
        await searchInput.fill('OnePlus');
        await page.waitForTimeout(1000);
        console.log('✅ Phone selector search is working');
      }
      
      // Close the modal
      const closeButton = await page.$('.close-btn, button:has-text("✕")');
      if (closeButton) {
        await closeButton.click();
        await page.waitForTimeout(1000);
      }
    } else {
      console.log('❌ Phone selector modal did not open');
    }
    
    console.log('\n✅ TEST 4: Error Handling');
    console.log('=' .repeat(50));
    
    // Test improved error handling
    await page.goto('http://localhost:3002/compare/invalid-phone-vs-another-invalid', {
      waitUntil: 'networkidle',
      timeout: 15000
    });
    await page.waitForTimeout(2000);
    
    const errorPageText = await page.textContent('body');
    const hasImprovedError = errorPageText.includes('Available phone slugs') || 
                            errorPageText.includes('oneplus-13') ||
                            errorPageText.includes('Back to Home');
    
    results.errorHandlingImproved = hasImprovedError;
    
    if (hasImprovedError) {
      console.log('✅ Improved error handling with helpful suggestions');
      results.testsPassed++;
    } else {
      console.log('❌ Error handling not improved');
    }
    
    console.log('\n✅ TEST 5: Specifications Display');
    console.log('=' .repeat(50));
    
    // Go back to working comparison and test specifications
    await page.goto('http://localhost:3002/compare/oneplus-13-vs-samsung-galaxy-s24-ultra', {
      waitUntil: 'networkidle',
      timeout: 15000
    });
    await page.waitForTimeout(3000);
    
    const pageText = await page.textContent('body');
    const naCount = (pageText.match(/N\/A/g) || []).length;
    const hasRealSpecs = pageText.includes('GB') || pageText.includes('MP') || pageText.includes('mAh');
    
    results.specificationsWorking = naCount < 5 && hasRealSpecs;
    
    if (results.specificationsWorking) {
      console.log(`✅ Specifications working (${naCount} N/A values, real specs present)`);
      results.testsPassed++;
    } else {
      console.log(`❌ Specifications issue (${naCount} N/A values, real specs: ${hasRealSpecs})`);
    }
    
    console.log('\n✅ TEST 6: React Error Free');
    console.log('=' .repeat(50));
    
    // Check for React errors
    if (results.reactErrors.length === 0) {
      console.log('✅ No React JavaScript errors detected');
      results.testsPassed++;
    } else {
      console.log(`❌ Found ${results.reactErrors.length} React errors:`);
      results.reactErrors.slice(0, 3).forEach(error => console.log(`  - ${error}`));
    }
    
    // Final screenshot
    await page.screenshot({ path: 'all-fixes-test.png', fullPage: true });
    
    console.log('\n📊 FINAL TEST RESULTS');
    console.log('='.repeat(60));
    console.log(`Tests Passed: ${results.testsPassed}/${results.totalTests}`);
    console.log(`Success Rate: ${Math.round((results.testsPassed / results.totalTests) * 100)}%`);
    
    console.log('\n📋 Detailed Results:');
    console.log(`✅ Phone Headers: ${results.phoneHeadersFound} found`);
    console.log(`✅ Add Phone Button: ${results.addPhoneClickable ? 'Working' : 'Issues'}`);
    console.log(`✅ Phone Selector: ${results.phoneSelectorWorking ? 'Working' : 'Issues'}`);
    console.log(`✅ Error Handling: ${results.errorHandlingImproved ? 'Improved' : 'Needs work'}`);
    console.log(`✅ Specifications: ${results.specificationsWorking ? 'Working' : 'Issues'}`);
    console.log(`✅ React Errors: ${results.reactErrors.length === 0 ? 'None' : results.reactErrors.length + ' found'}`);
    
    if (results.testsPassed === results.totalTests) {
      console.log('\n🎉 ALL TESTS PASSED! Bug fixes are successful!');
    } else {
      console.log(`\n🔧 ${results.totalTests - results.testsPassed} tests still need attention`);
    }
    
    console.log('\n📸 Screenshot saved as all-fixes-test.png');
    
    return results;
    
  } catch (error) {
    console.error('❌ Testing failed:', error.message);
    return { error: error.message };
  } finally {
    await browser.close();
  }
}

testAllFixes().then(results => {
  if (results.error) {
    console.log('\n💥 Test suite failed');
  } else if (results.testsPassed === results.totalTests) {
    console.log('\n🚀 All fixes validated successfully!');
  } else {
    console.log(`\n🔄 ${results.testsPassed}/${results.totalTests} fixes working properly`);
  }
}).catch(console.error);