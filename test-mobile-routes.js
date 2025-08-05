const { chromium } = require('playwright');

async function testMobileRoutes() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  console.log('🧪 Testing Mobile Phone Routes...');
  
  // Add console listener to see what's happening with data fetching
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('Phone not found') || text.includes('getMobilePhone') || text.includes('slug')) {
      console.log('🔍 Browser console:', text);
    }
  });

  try {
    // First, let's see what phones are available by checking browse page
    console.log('\n📊 Step 1: Getting available phone UIDs from browse page...');
    await page.goto('http://localhost:3002/browse', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    
    await page.waitForTimeout(2000);
    
    // Extract phone UIDs from the browse page
    const phoneInfo = await page.evaluate(() => {
      const phoneCards = document.querySelectorAll('.mobile-phone-item, .phone-card');
      const phones = [];
      
      phoneCards.forEach((card, index) => {
        const titleElement = card.querySelector('h2, h3, [class*="title"]');
        const title = titleElement ? titleElement.textContent : `Phone ${index + 1}`;
        
        // Look for any data attributes or links that might contain UID
        const linkElement = card.querySelector('a');
        const href = linkElement ? linkElement.getAttribute('href') : null;
        
        // Get any data-cslp attributes that might contain UIDs
        const cslpElements = card.querySelectorAll('[data-cslp]');
        const uids = [];
        
        cslpElements.forEach(el => {
          const cslp = el.getAttribute('data-cslp');
          if (cslp && cslp.includes('mobiles.')) {
            const match = cslp.match(/mobiles\.([^.]+)/);
            if (match) {
              uids.push(match[1]);
            }
          }
        });
        
        phones.push({
          title: title,
          href: href,
          uids: [...new Set(uids)] // Remove duplicates
        });
      });
      
      return phones;
    });
    
    console.log('📊 Available phones:');
    phoneInfo.forEach((phone, i) => {
      console.log(`   ${i + 1}. ${phone.title}`);
      if (phone.uids.length > 0) {
        console.log(`      UIDs: ${phone.uids.join(', ')}`);
      }
      if (phone.href) {
        console.log(`      Link: ${phone.href}`);
      }
    });
    
    // Test the specific route that's failing
    console.log('\n📊 Step 2: Testing /mobiles/samsung-galaxy-s24-ultra...');
    await page.goto('http://localhost:3002/mobiles/samsung-galaxy-s24-ultra', {
      waitUntil: 'networkidle',
      timeout: 15000
    });
    
    await page.waitForTimeout(3000);
    
    // Check what page we got
    const pageContent = await page.evaluate(() => {
      return {
        title: document.title,
        h1Text: document.querySelector('h1') ? document.querySelector('h1').textContent : null,
        isNotFound: document.querySelector('.not-found') !== null,
        isPhoneDetail: document.querySelector('.phone-detail, [class*="mobile-phone"]') !== null,
        isLoading: document.querySelector('.loading') !== null,
        bodyClasses: document.body.className,
        url: window.location.href
      };
    });
    
    console.log('📊 Page result:');
    console.log(`   Title: ${pageContent.title}`);
    console.log(`   H1: ${pageContent.h1Text}`);
    console.log(`   Is 404: ${pageContent.isNotFound}`);
    console.log(`   Is phone detail: ${pageContent.isPhoneDetail}`);
    console.log(`   Is loading: ${pageContent.isLoading}`);
    console.log(`   URL: ${pageContent.url}`);
    
    // Test with some known UIDs
    const knownUIDs = [
      'blt6e248f3c32d25409', // Samsung Galaxy S24 Ultra (from previous tests)
      'blt118b05fece1a9fb3', // OnePlus 13 (from previous tests)
      'bltffc3e218b0c94c4a'  // iPhone 16 Pro Max (default)
    ];
    
    console.log('\n📊 Step 3: Testing known UIDs...');
    for (const uid of knownUIDs) {
      console.log(`\n   Testing /mobiles/${uid}...`);
      
      try {
        await page.goto(`http://localhost:3002/mobiles/${uid}`, {
          waitUntil: 'networkidle',
          timeout: 15000
        });
        
        await page.waitForTimeout(2000);
        
        const result = await page.evaluate(() => {
          return {
            title: document.title,
            h1: document.querySelector('h1') ? document.querySelector('h1').textContent : null,
            isNotFound: document.querySelector('.not-found') !== null,
            isPhoneDetail: document.querySelector('.phone-detail, [class*="mobile-phone"], .mobile-phone-detail') !== null
          };
        });
        
        console.log(`     Result: ${result.isPhoneDetail ? '✅ Phone detail loaded' : result.isNotFound ? '❌ 404 page' : '⚠️ Unknown page'}`);
        if (result.h1) {
          console.log(`     Phone: ${result.h1}`);
        }
        
      } catch (error) {
        console.log(`     Error: ${error.message}`);
      }
    }
    
    // Test slug-to-UID mapping approach
    console.log('\n📊 Step 4: Testing slug-based approach...');
    
    // Create a mapping of common slugs to UIDs based on what we know
    const slugToUID = {
      'samsung-galaxy-s24-ultra': 'blt6e248f3c32d25409',
      'oneplus-13': 'blt118b05fece1a9fb3', 
      'iphone-16-pro-max': 'bltffc3e218b0c94c4a',
      'apple-iphone-16-pro-max': 'bltffc3e218b0c94c4a'
    };
    
    for (const [slug, uid] of Object.entries(slugToUID)) {
      console.log(`\n   Testing slug mapping: ${slug} -> ${uid}`);
      
      try {
        await page.goto(`http://localhost:3002/mobiles/${slug}`, {
          waitUntil: 'networkidle',
          timeout: 15000
        });
        
        await page.waitForTimeout(2000);
        
        const result = await page.evaluate(() => {
          return {
            h1: document.querySelector('h1') ? document.querySelector('h1').textContent : null,
            isNotFound: document.querySelector('.not-found') !== null,
            isPhoneDetail: document.querySelector('.phone-detail, [class*="mobile-phone"], .mobile-phone-detail') !== null
          };
        });
        
        console.log(`     Result: ${result.isPhoneDetail ? '✅ Loaded' : result.isNotFound ? '❌ 404' : '⚠️ Unknown'}`);
        if (result.h1) {
          console.log(`     Title: ${result.h1}`);
        }
        
      } catch (error) {
        console.log(`     Error: ${error.message}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Mobile routes test failed:', error.message);
  } finally {
    await browser.close();
  }
}

testMobileRoutes().catch(console.error);