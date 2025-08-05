const { chromium } = require('playwright');

async function testPhoneCardLayout() {
  console.log('📱 Testing phone card horizontal layout...\n');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000
  });
  
  const context = await browser.newContext({
    viewport: { width: 375, height: 667 } // iPhone SE viewport
  });
  
  const page = await context.newPage();
  
  try {
    console.log('🚀 Loading home page...\n');
    
    await page.goto('http://localhost:3002', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    await page.waitForTimeout(3000);
    
    // Check phone showcase layout
    const phoneShowcase = await page.$('.hero__phone-showcase');
    if (phoneShowcase) {
      const showcaseBounds = await phoneShowcase.boundingBox();
      console.log('📱 Phone Showcase Bounds:', {
        width: Math.round(showcaseBounds.width),
        height: Math.round(showcaseBounds.height)
      });
      
      // Check individual phone cards
      const phoneCards = await page.$$('.hero__phone-card');
      console.log(`📱 Found ${phoneCards.length} phone cards`);
      
      for (let i = 0; i < phoneCards.length; i++) {
        const cardBounds = await phoneCards[i].boundingBox();
        console.log(`   Card ${i + 1}: ${Math.round(cardBounds.width)}w x ${Math.round(cardBounds.height)}h at (${Math.round(cardBounds.x)}, ${Math.round(cardBounds.y)})`);
      }
      
      // Check VS element
      const vsElement = await page.$('.hero__vs');
      if (vsElement) {
        const vsBounds = await vsElement.boundingBox();
        console.log(`📱 VS Element: ${Math.round(vsBounds.width)}w x ${Math.round(vsBounds.height)}h at (${Math.round(vsBounds.x)}, ${Math.round(vsBounds.y)})`);
      }
      
      // Check if cards are horizontally aligned
      if (phoneCards.length >= 2) {
        const card1Bounds = await phoneCards[0].boundingBox();
        const card2Bounds = await phoneCards[1].boundingBox();
        
        const horizontalAlignment = Math.abs(card1Bounds.y - card2Bounds.y) < 10; // Allow 10px tolerance
        const sideBySide = card1Bounds.x < card2Bounds.x; // Card 1 should be left of card 2
        
        console.log('\n🔍 Layout Analysis:');
        console.log(`   Horizontally aligned: ${horizontalAlignment ? '✅ YES' : '❌ NO'}`);
        console.log(`   Side by side: ${sideBySide ? '✅ YES' : '❌ NO'}`);
        console.log(`   Y-position difference: ${Math.round(Math.abs(card1Bounds.y - card2Bounds.y))}px`);
        
        if (horizontalAlignment && sideBySide) {
          console.log('\n🎉 SUCCESS: Phone cards are properly arranged horizontally!');
        } else {
          console.log('\n❌ ISSUE: Phone cards are not properly arranged horizontally');
        }
      }
    }
    
    // Take screenshot
    await page.screenshot({ 
      path: 'phone-card-layout-test.png',
      fullPage: false
    });
    
    console.log('\n📸 Screenshot saved as phone-card-layout-test.png');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    console.log('\n🔍 Browser will remain open for manual inspection...');
    await page.waitForTimeout(15000);
    await browser.close();
  }
}

testPhoneCardLayout().catch(console.error);