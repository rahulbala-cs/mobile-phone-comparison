const { chromium } = require('playwright');

async function testVisualBuilderIntegration() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  console.log('🧪 Testing Visual Builder Integration...');
  
  try {
    // Add console listener to capture JavaScript logs
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('ContentstackLivePreview') || 
          text.includes('Live Preview') || 
          text.includes('Visual Builder') ||
          text.includes('data-cslp')) {
        console.log('🔍 Browser console:', text);
      }
    });

    // Test Visual Builder test page
    console.log('📊 Step 1: Loading Visual Builder test page...');
    await page.goto('http://localhost:3002/visual-builder-test', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    
    await page.waitForTimeout(3000);
    
    // Check if Live Preview SDK is initialized
    const livePreviewSDK = await page.evaluate(() => {
      return {
        contentstack: typeof window.ContentstackLivePreview !== 'undefined',
        globalContentstack: typeof window.Contentstack !== 'undefined',
        sdkVersion: window.ContentstackLivePreview ? window.ContentstackLivePreview.version : null
      };
    });
    
    console.log('📊 Live Preview SDK status:', livePreviewSDK);
    
    // Check for edit tags (data-cslp attributes)
    const editTags = await page.$$('[data-cslp]');
    console.log(`📊 Edit tags found: ${editTags.length}`);
    
    if (editTags.length > 0) {
      // Get some example edit tags
      const sampleEditTags = [];
      for (let i = 0; i < Math.min(5, editTags.length); i++) {
        const cslpValue = await editTags[i].getAttribute('data-cslp');
        const tagName = await editTags[i].evaluate(el => el.tagName);
        const textContent = await editTags[i].evaluate(el => 
          el.textContent ? el.textContent.substring(0, 50) + '...' : 'No text'
        );
        
        sampleEditTags.push({
          tag: tagName,
          cslp: cslpValue,
          content: textContent
        });
      }
      
      console.log('📊 Sample edit tags:');
      sampleEditTags.forEach((tag, i) => {
        console.log(`   ${i + 1}. ${tag.tag}: "${tag.content}" [${tag.cslp}]`);
      });
    }
    
    // Test another page with more content
    console.log('\n📊 Step 2: Testing edit tags on comparison page...');
    await page.goto('http://localhost:3002/compare/oneplus-13-vs-samsung-galaxy-s24-ultra', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    
    await page.waitForTimeout(3000);
    
    const comparisonEditTags = await page.$$('[data-cslp]');
    console.log(`📊 Edit tags on comparison page: ${comparisonEditTags.length}`);
    
    // Check for specific content types
    const phoneCards = await page.$$('.msp-product-card');
    let phoneCardsWithEditTags = 0;
    
    for (const card of phoneCards) {
      const editableElements = await card.$$('[data-cslp]');
      if (editableElements.length > 0) {
        phoneCardsWithEditTags++;
      }
    }
    
    console.log(`📊 Phone cards with edit tags: ${phoneCardsWithEditTags}/${phoneCards.length}`);
    
    // Test home page
    console.log('\n📊 Step 3: Testing edit tags on home page...');
    await page.goto('http://localhost:3002/', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    
    await page.waitForTimeout(3000);
    
    const homeEditTags = await page.$$('[data-cslp]');
    console.log(`📊 Edit tags on home page: ${homeEditTags.length}`);
    
    // Check environment variables
    const envStatus = await page.evaluate(() => {
      // Check if environment variables are accessible (they won't be in production)
      return {
        hasLivePreview: document.querySelector('meta[name="contentstack-live-preview"]') !== null,
        userAgent: navigator.userAgent,
        location: window.location.href
      };
    });
    
    console.log('📊 Environment status:', envStatus);
    
    // Summary
    const results = {
      livePreviewSDK: livePreviewSDK.contentstack,
      editTagsFound: editTags.length > 0,
      totalEditTags: editTags.length + comparisonEditTags.length + homeEditTags.length,
      pagesWithTags: [
        { page: 'visual-builder-test', tags: editTags.length },
        { page: 'comparison', tags: comparisonEditTags.length },
        { page: 'home', tags: homeEditTags.length }
      ]
    };
    
    console.log('\n📊 VISUAL BUILDER INTEGRATION SUMMARY:');
    console.log('-'.repeat(50));
    console.log(`Live Preview SDK initialized: ${results.livePreviewSDK ? '✅' : '❌'}`);
    console.log(`Edit tags working: ${results.editTagsFound ? '✅' : '❌'}`);
    console.log(`Total edit tags across pages: ${results.totalEditTags}`);
    
    results.pagesWithTags.forEach(page => {
      console.log(`  ${page.page}: ${page.tags} edit tags`);
    });
    
    if (results.livePreviewSDK && results.totalEditTags > 0) {
      console.log('\n🎉 Visual Builder integration is working!');
      return true;
    } else {
      console.log('\n🔧 Visual Builder integration needs attention');
      
      if (!results.livePreviewSDK) {
        console.log('   - Live Preview SDK not initialized');
      }
      
      if (!results.editTagsFound) {
        console.log('   - No edit tags found - check getEditAttributes implementation');
      }
      
      return false;
    }
    
  } catch (error) {
    console.error('❌ Visual Builder test failed:', error.message);
    return false;
  } finally {
    await browser.close();
  }
}

testVisualBuilderIntegration().then(success => {
  if (success) {
    console.log('\n🚀 Visual Builder integration working properly!');
  } else {
    console.log('\n🔧 Visual Builder integration needs fixes');
  }
}).catch(console.error);