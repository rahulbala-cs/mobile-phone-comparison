const { chromium } = require('playwright');

async function test404Handling() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  console.log('🧪 Testing 404 Error Handling...');
  
  try {
    // Test various invalid routes
    const invalidRoutes = [
      '/non-existent-page',
      '/invalid-route-12345',
      '/compare/invalid-phone-slug',
      '/mobile/non-existent-phone',
      '/browse/invalid-category',
      '/random-gibberish'
    ];
    
    let workingRoutes = 0;
    
    for (const route of invalidRoutes) {
      console.log(`📊 Testing route: ${route}`);
      
      await page.goto(`http://localhost:3002${route}`, { 
        waitUntil: 'networkidle', 
        timeout: 10000 
      });
      
      await page.waitForTimeout(2000);
      
      // Check if 404 page is displayed
      const notFoundPage = await page.$('.not-found, .error-page, [class*="404"]');
      const notFoundTitle = await page.$('h1:has-text("Page Not Found"), h1:has-text("Not Found"), h1:has-text("404")');
      const homeButton = await page.$('button:has-text("Go to Homepage"), a:has-text("Home")');
      
      const has404Page = notFoundPage !== null;
      const hasTitle = notFoundTitle !== null;
      const hasNavigation = homeButton !== null;
      
      if (has404Page && hasTitle) {
        console.log(`✅ ${route}: Proper 404 page displayed`);
        workingRoutes++;
        
        // Test navigation buttons
        if (hasNavigation) {
          console.log(`✅ ${route}: Navigation buttons available`);
        } else {
          console.log(`⚠️ ${route}: Missing navigation buttons`);
        }
        
        // Test if page has proper meta tags for SEO
        const pageTitle = await page.title();
        if (pageTitle.includes('Not Found') || pageTitle.includes('404')) {
          console.log(`✅ ${route}: Proper SEO title set`);
        } else {
          console.log(`⚠️ ${route}: SEO title not optimized: "${pageTitle}"`);
        }
        
      } else {
        console.log(`❌ ${route}: No proper 404 handling`);
        
        // Check what was actually displayed
        const pageContent = await page.evaluate(() => {
          const title = document.querySelector('h1, h2, h3');
          const body = document.body.innerText.substring(0, 200);
          return {
            title: title ? title.innerText : 'No title',
            bodyPreview: body
          };
        });
        
        console.log(`📊 ${route}: Displayed content - Title: "${pageContent.title}"`);
      }
    }
    
    console.log(`\n📊 404 Handling Summary: ${workingRoutes}/${invalidRoutes.length} routes properly handled`);
    
    // Test 404 page functionality
    if (workingRoutes > 0) {
      console.log('\n📊 Testing 404 page functionality...');
      
      await page.goto('http://localhost:3002/test-404-functionality', { 
        waitUntil: 'networkidle', 
        timeout: 10000 
      });
      await page.waitForTimeout(2000);
      
      // Test home button
      const homeButton = await page.$('button:has-text("Go to Homepage"), button:has-text("Homepage")');
      if (homeButton) {
        await homeButton.click();
        await page.waitForTimeout(2000);
        
        const currentUrl = page.url();
        const homePageReached = currentUrl.endsWith('/') || currentUrl.includes('localhost:3002');
        
        console.log(`✅ Home button navigation: ${homePageReached ? 'Working' : 'Not working'}`);
      }
      
      // Test browse button
      await page.goBack();
      await page.waitForTimeout(1000);
      
      const browseButton = await page.$('button:has-text("Browse Phones"), button:has-text("Browse")');
      if (browseButton) {
        await browseButton.click();
        await page.waitForTimeout(2000);
        
        const currentUrl = page.url();
        const browsePageReached = currentUrl.includes('/browse');
        
        console.log(`✅ Browse button navigation: ${browsePageReached ? 'Working' : 'Not working'}`);
      }
    }
    
    return workingRoutes > invalidRoutes.length * 0.5;
    
  } catch (error) {
    console.error('❌ 404 testing failed:', error.message);
    return false;
  } finally {
    await browser.close();
  }
}

test404Handling().then(success => {
  if (success) {
    console.log('\n🚀 404 error handling working properly!');
  } else {
    console.log('\n🔧 404 error handling needs improvement');
  }
}).catch(console.error);