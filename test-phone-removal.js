const { chromium } = require('playwright');

async function testPhoneRemoval() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  console.log('🧪 Testing Phone Removal Functionality...');
  
  try {
    await page.goto('http://localhost:3002/compare/oneplus-13-vs-samsung-galaxy-s24-ultra', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    
    await page.waitForTimeout(3000);
    
    // Check initial phone count
    const initialPhoneCards = await page.$$('.msp-product-card');
    console.log(`📊 Initial phone count: ${initialPhoneCards.length}`);
    
    if (initialPhoneCards.length < 2) {
      console.log('❌ Not enough phones to test removal');
      return false;
    }
    
    // Find remove buttons
    const removeButtons = await page.$$('.msp-remove-btn');
    console.log(`📊 Remove buttons found: ${removeButtons.length}`);
    
    if (removeButtons.length === 0) {
      console.log('❌ No remove buttons found');
      return false;
    }
    
    // Click the first remove button
    console.log('📊 Clicking first remove button...');
    await removeButtons[0].click();
    await page.waitForTimeout(2000);
    
    // Check phone count after removal
    const remainingPhoneCards = await page.$$('.msp-product-card');
    console.log(`📊 Remaining phone count: ${remainingPhoneCards.length}`);
    
    const phoneRemoved = remainingPhoneCards.length < initialPhoneCards.length;
    
    if (phoneRemoved) {
      console.log('✅ Phone removal working correctly!');
      
      // Check if UI is still intact
      const comparisonGrid = await page.$('.msp-comparison-grid');
      const floatingButton = await page.$('.msp-floating-add-phone');
      
      console.log(`📊 Comparison grid exists: ${comparisonGrid !== null}`);
      console.log(`📊 Floating button exists: ${floatingButton !== null}`);
      
      // Test adding a phone back
      if (floatingButton) {
        console.log('📊 Testing add phone after removal...');
        await floatingButton.click();
        await page.waitForTimeout(1500);
        
        const modal = await page.$('.phone-selector-modal');
        if (modal) {
          console.log('✅ Add phone modal opens after removal');
          
          const phoneOption = await page.$('.phone-selector-card');
          if (phoneOption) {
            await phoneOption.click();
            await page.waitForTimeout(2000);
            
            const finalPhoneCards = await page.$$('.msp-product-card');
            console.log(`📊 Final phone count: ${finalPhoneCards.length}`);
            
            return true;
          }
        }
      }
    } else {
      console.log('❌ Phone removal not working - phone count unchanged');
      
      // Check for any error messages or console logs
      const errorMessages = await page.evaluate(() => {
        const errors = Array.from(document.querySelectorAll('.error, .alert')).map(el => el.textContent);
        return errors;
      });
      
      if (errorMessages.length > 0) {
        console.log('📊 Error messages found:', errorMessages);
      }
      
      return false;
    }
    
    return phoneRemoved;
    
  } catch (error) {
    console.error('❌ Phone removal test failed:', error.message);
    return false;
  } finally {
    await browser.close();
  }
}

testPhoneRemoval().then(success => {
  if (success) {
    console.log('\n🚀 Phone removal functionality working!');
  } else {
    console.log('\n🔧 Phone removal needs fixing');
  }
}).catch(console.error);