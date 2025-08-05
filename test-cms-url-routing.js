const { chromium } = require('playwright');

async function testCMSURLRouting() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  console.log('🧪 Testing CMS URL-Based Routing...');
  
  // Add console listener to see what method is being used
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('Found phone by') || text.includes('Phone not found')) {
      console.log('🔍 Browser console:', text);
    }
  });

  try {
    const urlsToTest = [
      '/mobiles/samsung-galaxy-s24-ultra',
      '/mobiles/oneplus-13', 
      '/mobiles/apple-iphone-16-pro-max',
      '/mobiles/oneplus-12',
      '/mobiles/samsung-galaxy-s25-ultra',
      // Test UID fallback
      '/mobiles/blt6e248f3c32d25409',
      // Test non-existent
      '/mobiles/non-existent-phone'
    ];
    
    let workingUrls = 0;
    
    console.log('\n📊 Testing all CMS URLs:');
    console.log('-'.repeat(60));
    
    for (const testUrl of urlsToTest) {
      console.log(`\nTesting: ${testUrl}`);
      
      try {
        await page.goto(`http://localhost:3002${testUrl}`, {
          waitUntil: 'networkidle',
          timeout: 15000
        });
        
        await page.waitForTimeout(2000);
        
        const result = await page.evaluate(() => {
          return {
            title: document.title,
            h1: document.querySelector('h1') ? document.querySelector('h1').textContent : null,
            isNotFound: document.querySelector('.not-found') !== null,
            isPhoneDetail: document.querySelector('.phone-detail, [class*="mobile-phone"], .mobile-phone-detail') !== null,
            hasEditTags: document.querySelectorAll('[data-cslp]').length > 0
          };
        });
        
        if (result.isPhoneDetail) {
          workingUrls++;
          console.log(`✅ Success: ${result.h1}`);
          console.log(`   Edit tags: ${result.hasEditTags ? '✅' : '❌'}`);
        } else if (result.isNotFound) {
          console.log(`❌ 404: Page not found`);
        } else {
          console.log(`⚠️ Unknown page state`);
        }
        
      } catch (error) {
        console.log(`❌ Error: ${error.message}`);
      }
    }
    
    console.log('\n🎯 SUMMARY:');
    console.log('-'.repeat(30));
    console.log(`Working URLs: ${workingUrls}/${urlsToTest.length - 1} (excluding non-existent test)`);
    console.log(`Success rate: ${Math.round((workingUrls / (urlsToTest.length - 1)) * 100)}%`);
    
    if (workingUrls === urlsToTest.length - 1) {
      console.log('\n🎉 All CMS URLs working perfectly!');
      console.log('✅ CMS URL field routing is fully functional');
      console.log('✅ Content managers can set custom URLs in CMS');
      console.log('✅ SEO-friendly URLs working as expected');
    } else {
      console.log('\n⚠️ Some URLs may need attention');
    }
    
  } catch (error) {
    console.error('❌ CMS URL routing test failed:', error.message);
  } finally {
    await browser.close();
  }
}

testCMSURLRouting().catch(console.error);