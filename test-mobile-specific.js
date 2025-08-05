const { chromium } = require('playwright');

async function testMobileSpecific() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  console.log('🧪 Testing Mobile-Specific Add Phone Button Layout...');
  
  try {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE size
    
    await page.goto('http://localhost:3002/compare/oneplus-13-vs-samsung-galaxy-s24-ultra', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    
    await page.waitForTimeout(3000);
    
    // Get detailed measurements
    const measurements = await page.evaluate(() => {
      const addPhoneContainer = document.querySelector('.msp-add-phone-container');
      const addPhoneCard = document.querySelector('.msp-add-phone-card');
      const productCard = document.querySelector('.msp-product-card');
      
      const containerRect = addPhoneContainer?.getBoundingClientRect();
      const cardRect = addPhoneCard?.getBoundingClientRect();
      const productRect = productCard?.getBoundingClientRect();
      
      const containerStyles = addPhoneContainer ? window.getComputedStyle(addPhoneContainer) : null;
      const cardStyles = addPhoneCard ? window.getComputedStyle(addPhoneCard) : null;
      
      return {
        viewport: { width: window.innerWidth, height: window.innerHeight },
        container: {
          exists: !!addPhoneContainer,
          rect: containerRect ? {
            width: Math.round(containerRect.width),
            height: Math.round(containerRect.height)
          } : null,
          styles: containerStyles ? {
            height: containerStyles.height,
            minHeight: containerStyles.minHeight,
            maxHeight: containerStyles.maxHeight,
            marginTop: containerStyles.marginTop,
            display: containerStyles.display
          } : null
        },
        card: {
          exists: !!addPhoneCard,
          rect: cardRect ? {
            width: Math.round(cardRect.width),
            height: Math.round(cardRect.height)
          } : null,
          styles: cardStyles ? {
            height: cardStyles.height,
            minHeight: cardStyles.minHeight,
            maxHeight: cardStyles.maxHeight,
            padding: cardStyles.padding
          } : null
        },
        productCard: {
          rect: productRect ? {
            width: Math.round(productRect.width),
            height: Math.round(productRect.height)
          } : null
        }
      };
    });
    
    console.log('📊 MOBILE MEASUREMENTS:');
    console.log(`Viewport: ${measurements.viewport.width}x${measurements.viewport.height}`);
    console.log('\n📦 Add Phone Container:');
    console.log(`  Exists: ${measurements.container.exists}`);
    if (measurements.container.rect) {
      console.log(`  Size: ${measurements.container.rect.width}x${measurements.container.rect.height}px`);
    }
    if (measurements.container.styles) {
      console.log(`  Styles: height=${measurements.container.styles.height}, minHeight=${measurements.container.styles.minHeight}`);
      console.log(`  Margin: ${measurements.container.styles.marginTop}, Display: ${measurements.container.styles.display}`);
    }
    
    console.log('\n📱 Add Phone Card:');
    console.log(`  Exists: ${measurements.card.exists}`);
    if (measurements.card.rect) {
      console.log(`  Size: ${measurements.card.rect.width}x${measurements.card.rect.height}px`);
    }
    if (measurements.card.styles) {
      console.log(`  Styles: height=${measurements.card.styles.height}, minHeight=${measurements.card.styles.minHeight}, maxHeight=${measurements.card.styles.maxHeight}`);
      console.log(`  Padding: ${measurements.card.styles.padding}`);
    }
    
    console.log('\n📱 Product Card (for comparison):');
    if (measurements.productCard.rect) {
      console.log(`  Size: ${measurements.productCard.rect.width}x${measurements.productCard.rect.height}px`);
    }
    
    // Check media query application
    const mediaQueryStatus = await page.evaluate(() => {
      const testElement = document.createElement('div');
      testElement.className = 'msp-add-phone-card';
      document.body.appendChild(testElement);
      
      const styles = window.getComputedStyle(testElement);
      const mediaQuery480 = window.matchMedia('(max-width: 480px)').matches;
      const mediaQuery768 = window.matchMedia('(max-width: 768px)').matches;
      
      document.body.removeChild(testElement);
      
      return {
        mediaQuery480,
        mediaQuery768,
        computedMinHeight: styles.minHeight,
        computedMaxHeight: styles.maxHeight
      };
    });
    
    console.log('\n📊 MEDIA QUERY STATUS:');
    console.log(`  480px query matches: ${mediaQueryStatus.mediaQuery480}`);
    console.log(`  768px query matches: ${mediaQueryStatus.mediaQuery768}`);
    console.log(`  Computed minHeight: ${mediaQueryStatus.computedMinHeight}`);
    console.log(`  Computed maxHeight: ${mediaQueryStatus.computedMaxHeight}`);
    
    // Check if the issue is resolved
    const isResolved = measurements.card.rect && measurements.card.rect.height <= 120;
    console.log(`\n✅ RESULT: ${isResolved ? 'RESOLVED' : 'STILL NEEDS FIXING'}`);
    
    if (!isResolved && measurements.card.rect) {
      console.log(`❌ Card height ${measurements.card.rect.height}px is still too large (should be ≤ 120px)`);
    }
    
    // Take screenshot
    await page.screenshot({ path: 'mobile-add-phone-debug.png', fullPage: true });
    console.log('\n📸 Screenshot saved as mobile-add-phone-debug.png');
    
    return { measurements, mediaQueryStatus, isResolved };
    
  } catch (error) {
    console.error('❌ Testing failed:', error.message);
    return { error: error.message };
  } finally {
    await browser.close();
  }
}

testMobileSpecific().then(results => {
  if (results.error) {
    console.log('\n💥 Mobile test failed');
  } else if (results.isResolved) {
    console.log('\n🚀 Mobile add phone button layout is working!');
  } else {
    console.log('\n🔧 Mobile layout still needs attention');
  }
}).catch(console.error);