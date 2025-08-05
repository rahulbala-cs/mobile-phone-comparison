const { chromium } = require('playwright');

async function testModalClose() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  console.log('🧪 Testing Modal Auto-Close Issue...');
  
  try {
    await page.goto('http://localhost:3002/compare/oneplus-13-vs-samsung-galaxy-s24-ultra', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    
    await page.waitForTimeout(3000);
    
    console.log('📊 Step 1: Click floating add phone button');
    const addButton = await page.$('.msp-floating-add-phone');
    if (addButton) {
      await addButton.click();
      await page.waitForTimeout(1000);
      
      console.log('📊 Step 2: Check if modal opened');
      const modal = await page.$('.phone-selector-modal');
      if (modal) {
        console.log('✅ Modal opened successfully');
        
        console.log('📊 Step 3: Select a phone');
        const phoneOption = await page.$('.phone-selector-card');
        if (phoneOption) {
          // Listen to console messages
          page.on('console', msg => {
            if (msg.text().includes('PhoneSelector') || msg.text().includes('MobilePhoneComparison')) {
              console.log('🐛 Browser console:', msg.text());
            }
          });
          
          await phoneOption.click();
          console.log('📊 Phone selected, waiting for modal to close...');
          
          // Wait and check multiple times
          for (let i = 0; i < 10; i++) {
            await page.waitForTimeout(500);
            const modalAfterSelection = await page.$('.phone-selector-modal');
            
            console.log(`📊 Check ${i + 1}: Modal exists = ${modalAfterSelection !== null}`);
            
            if (modalAfterSelection === null) {
              console.log('✅ Modal closed successfully!');
              return true;
            }
          }
          
          console.log('❌ Modal did not close after 5 seconds');
          
          // Check if there are any error messages
          const errorMessages = await page.evaluate(() => {
            const errors = [];
            const consoleErrors = window.console._errors || [];
            return consoleErrors.slice(-5); // Last 5 errors
          });
          
          console.log('📊 Recent errors:', errorMessages);
          
          return false;
        } else {
          console.log('❌ No phone options found');
          return false;
        }
      } else {
        console.log('❌ Modal did not open');
        return false;
      }
    } else {
      console.log('❌ Add button not found');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Testing failed:', error.message);
    return false;
  } finally {
    await browser.close();
  }
}

testModalClose().then(success => {
  if (success) {
    console.log('\n🚀 Modal auto-close working!');
  } else {
    console.log('\n🔧 Modal auto-close needs fixing');
  }
}).catch(console.error);