const { chromium } = require('playwright');

async function testCMSURLs() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  console.log('🧪 Testing CMS URL Fields...');
  
  try {
    // Navigate to browse page to get phone data
    await page.goto('http://localhost:3002/browse', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    
    await page.waitForTimeout(2000);
    
    // Extract phone data including URLs from the rendered content
    const phoneData = await page.evaluate(() => {
      const phoneCards = document.querySelectorAll('.mobile-phone-item, .phone-card');
      const phones = [];
      
      phoneCards.forEach((card, index) => {
        // Get title
        const titleElement = card.querySelector('h2, h3, [class*="title"]');
        const title = titleElement ? titleElement.textContent : `Phone ${index + 1}`;
        
        // Get UID from data-cslp attributes
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
        
        // Get any href attributes that might be URLs
        const linkElements = card.querySelectorAll('a');
        const links = [];
        linkElements.forEach(link => {
          const href = link.getAttribute('href');
          if (href) {
            links.push(href);
          }
        });
        
        phones.push({
          title: title.trim(),
          uids: [...new Set(uids)],
          links: links,
          cardIndex: index
        });
      });
      
      return phones;
    });
    
    console.log('\n📊 Phone data from browse page:');
    phoneData.forEach((phone, i) => {
      console.log(`${i + 1}. ${phone.title}`);
      console.log(`   UIDs: ${phone.uids.join(', ')}`);
      console.log(`   Links: ${phone.links.join(', ')}`);
    });
    
    // Now let's call the Contentstack service directly through the browser console
    // to see what URL values are actually stored in the CMS
    console.log('\n📊 Fetching actual CMS data with URL fields...');
    
    const cmsData = await page.evaluate(async () => {
      try {
        // Access the contentstackService through window or create a simple query
        // We'll use fetch to call the Contentstack API directly
        
        const apiKey = 'blt60231a1792d69238';
        const deliveryToken = 'cs7dd10e5851c3aabff6d1561b';
        const environment = 'prod';
        
        const response = await fetch(
          `https://api.contentstack.io/v3/content_types/mobiles/entries?environment=${environment}`,
          {
            headers: {
              'api_key': apiKey,
              'access_token': deliveryToken,
              'Content-Type': 'application/json'
            }
          }
        );
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.entries) {
          return data.entries.map(entry => ({
            uid: entry.uid,
            title: entry.title,
            url: entry.url,
            created_at: entry.created_at,
            tags: entry.tags
          }));
        } else {
          return { error: 'No entries found', data };
        }
        
      } catch (error) {
        return { error: error.message };
      }
    });
    
    if (cmsData.error) {
      console.log('❌ Error fetching CMS data:', cmsData.error);
    } else {
      console.log('\n🎯 Actual CMS URL fields:');
      cmsData.forEach((entry, i) => {
        console.log(`${i + 1}. ${entry.title}`);
        console.log(`   UID: ${entry.uid}`);
        console.log(`   URL: ${entry.url || 'NO URL FIELD'}`);
        console.log(`   Tags: ${entry.tags ? entry.tags.join(', ') : 'No tags'}`);
        console.log('');
      });
      
      // Test if any of these URLs actually work
      console.log('📊 Testing CMS URL fields as routes...');
      
      for (const entry of cmsData.slice(0, 3)) { // Test first 3
        if (entry.url) {
          console.log(`\n   Testing URL: ${entry.url}`);
          
          try {
            await page.goto(`http://localhost:3002${entry.url}`, {
              waitUntil: 'networkidle',
              timeout: 10000
            });
            
            await page.waitForTimeout(2000);
            
            const result = await page.evaluate(() => {
              return {
                title: document.title,
                h1: document.querySelector('h1') ? document.querySelector('h1').textContent : null,
                isNotFound: document.querySelector('.not-found') !== null,
                isPhoneDetail: document.querySelector('.phone-detail, [class*="mobile-phone"]') !== null
              };
            });
            
            console.log(`     Result: ${result.isPhoneDetail ? '✅ Phone loaded' : result.isNotFound ? '❌ 404' : '⚠️ Unknown page'}`);
            if (result.h1) {
              console.log(`     Title: ${result.h1}`);
            }
            
          } catch (error) {
            console.log(`     Error: ${error.message}`);
          }
        } else {
          console.log(`   No URL field for: ${entry.title}`);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ CMS URLs test failed:', error.message);
  } finally {
    await browser.close();
  }
}

testCMSURLs().catch(console.error);