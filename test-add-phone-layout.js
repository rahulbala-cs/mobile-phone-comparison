const { chromium } = require('playwright');

async function testAddPhoneLayout() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  console.log('🧪 Testing Add Phone Button Layout and Accessibility...');
  
  const results = {
    compactness: false,
    accessibility: false,
    responsiveness: false,
    visualIntegration: false,
    testsPassed: 0,
    totalTests: 4
  };
  
  try {
    console.log('\n✅ TEST 1: Add Phone Button Compactness');
    console.log('=' .repeat(50));
    
    await page.goto('http://localhost:3002/compare/oneplus-13-vs-samsung-galaxy-s24-ultra', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    
    await page.waitForTimeout(3000);
    
    // Check add phone button dimensions
    const addPhoneButton = await page.$('.msp-add-phone-card');
    if (addPhoneButton) {
      const buttonBox = await addPhoneButton.boundingBox();
      const phoneCard = await page.$('.msp-product-card');
      const phoneCardBox = phoneCard ? await phoneCard.boundingBox() : null;
      
      console.log(`📊 Add phone button: ${Math.round(buttonBox.width)}x${Math.round(buttonBox.height)}px`);
      if (phoneCardBox) {
        console.log(`📊 Phone card: ${Math.round(phoneCardBox.width)}x${Math.round(phoneCardBox.height)}px`);
        
        // Add phone should be significantly smaller in height
        const heightRatio = buttonBox.height / phoneCardBox.height;
        results.compactness = heightRatio < 0.4; // Should be less than 40% of phone card height
        
        console.log(`📊 Height ratio: ${Math.round(heightRatio * 100)}% (should be < 40%)`);
        console.log(results.compactness ? '✅ Add phone button is compact' : '❌ Add phone button too large');
      }
    }
    
    if (results.compactness) results.testsPassed++;
    
    console.log('\n✅ TEST 2: Accessibility and Click Interaction');
    console.log('=' .repeat(50));
    
    // Test accessibility features
    const hasProperRole = await page.evaluate(() => {
      const addButton = document.querySelector('.msp-add-phone-card');
      return addButton && (
        addButton.getAttribute('role') === 'button' ||
        addButton.tagName === 'BUTTON' ||
        addButton.style.cursor === 'pointer'
      );
    });
    
    // Test click interaction
    let clickWorking = false;
    try {
      await addPhoneButton.click();
      await page.waitForTimeout(2000);
      
      // Check if phone selector modal appeared
      const phoneSelector = await page.$('.phone-selector-overlay, .phone-selector-modal');
      clickWorking = phoneSelector !== null;
      
      console.log(`📊 Click interaction: ${clickWorking ? 'Working' : 'Failed'}`);
      
      // Close modal if opened
      if (phoneSelector) {
        const closeButton = await page.$('.close-btn, button:has-text(\"✕\")');
        if (closeButton) {
          await closeButton.click();
          await page.waitForTimeout(1000);
        }
      }
    } catch (error) {
      console.log(`❌ Click interaction failed: ${error.message}`);
    }
    
    results.accessibility = hasProperRole && clickWorking;
    console.log(results.accessibility ? '✅ Accessibility features working' : '❌ Accessibility issues detected');
    
    if (results.accessibility) results.testsPassed++;
    
    console.log('\n✅ TEST 3: Responsive Behavior');
    console.log('=' .repeat(50));
    
    // Test on mobile viewport (iPhone SE size for consistency)
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(1500);
    
    const mobileAddButton = await page.$('.msp-add-phone-card');
    if (mobileAddButton) {
      const mobileButtonBox = await mobileAddButton.boundingBox();
      console.log(`📊 Mobile add button: ${Math.round(mobileButtonBox.width)}x${Math.round(mobileButtonBox.height)}px`);
      
      // Should be even more compact on mobile
      results.responsiveness = mobileButtonBox.height < 130;
      console.log(results.responsiveness ? '✅ Mobile responsiveness working' : '❌ Mobile button too large');
    }
    
    if (results.responsiveness) results.testsPassed++;
    
    // Reset to desktop view
    await page.setViewportSize({ width: 1400, height: 800 });
    await page.waitForTimeout(1000);
    
    console.log('\n✅ TEST 4: Visual Integration');
    console.log('=' .repeat(50));
    
    // Check if add phone button visually integrates well
    const visualIntegration = await page.evaluate(() => {
      const addContainer = document.querySelector('.msp-add-phone-container');
      const addButton = document.querySelector('.msp-add-phone-card');
      const productCards = document.querySelector('.msp-product-cards');
      
      if (!addButton || !addContainer || !productCards) return false;
      
      const containerStyle = window.getComputedStyle(addContainer);
      const addButtonStyle = window.getComputedStyle(addButton);
      
      // Check if container is properly aligned and not creating layout issues
      const isProperlyAligned = containerStyle.alignSelf === 'start' || containerStyle.alignSelf === 'flex-start';
      const hasReasonableHeight = parseInt(addButtonStyle.height) < 150;
      const hasMarginTop = parseInt(containerStyle.marginTop) > 0;
      const containerHeightReasonable = parseInt(containerStyle.height) < 150;
      
      return isProperlyAligned && hasReasonableHeight && hasMarginTop && containerHeightReasonable;
    });
    
    results.visualIntegration = visualIntegration;
    console.log(results.visualIntegration ? '✅ Visual integration good' : '❌ Visual integration needs work');
    
    if (results.visualIntegration) results.testsPassed++;
    
    // Take final screenshot
    await page.screenshot({ path: 'add-phone-layout-test.png', fullPage: true });
    
    console.log('\n📊 FINAL ADD PHONE LAYOUT RESULTS');
    console.log('='.repeat(60));
    console.log(`Tests Passed: ${results.testsPassed}/${results.totalTests}`);
    console.log(`Success Rate: ${Math.round((results.testsPassed / results.totalTests) * 100)}%`);
    
    console.log('\n📋 Detailed Results:');
    console.log(`✅ Compactness: ${results.compactness ? 'Good' : 'Needs improvement'}`);
    console.log(`✅ Accessibility: ${results.accessibility ? 'Working' : 'Issues detected'}`);
    console.log(`✅ Responsiveness: ${results.responsiveness ? 'Working' : 'Issues detected'}`);
    console.log(`✅ Visual Integration: ${results.visualIntegration ? 'Good' : 'Needs work'}`);
    
    if (results.testsPassed === results.totalTests) {
      console.log('\n🎉 ALL ADD PHONE LAYOUT TESTS PASSED!');
    } else {
      console.log(`\n🔧 ${results.totalTests - results.testsPassed} tests need attention`);
    }
    
    console.log('\n📸 Screenshot saved as add-phone-layout-test.png');
    
    return results;
    
  } catch (error) {
    console.error('❌ Testing failed:', error.message);
    return { error: error.message };
  } finally {
    await browser.close();
  }
}

testAddPhoneLayout().then(results => {
  if (results.error) {
    console.log('\n💥 Add phone layout test failed');
  } else if (results.testsPassed === results.totalTests) {
    console.log('\n🚀 Add phone button layout perfect!');
  } else {
    console.log(`\n🔄 ${results.testsPassed}/${results.totalTests} layout improvements working`);
  }
}).catch(console.error);