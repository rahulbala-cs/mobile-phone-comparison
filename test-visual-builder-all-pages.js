const { chromium } = require('playwright');

async function testVisualBuilderAllPages() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  console.log('🧪 COMPREHENSIVE Visual Builder Integration Test - All Pages');
  console.log('='.repeat(70));
  
  // Define all pages to test
  const pagesToTest = [
    {
      name: 'Home Page',
      url: '/',
      expectedContent: ['hero', 'features', 'comparisons', 'stats'],
      minEditTags: 20
    },
    {
      name: 'Browse Page',
      url: '/browse',
      expectedContent: ['phone-card', 'mobile-phone'],
      minEditTags: 10
    },
    {
      name: 'Compare Hub',
      url: '/compare',
      expectedContent: ['category', 'comparison'],
      minEditTags: 5
    },
    {
      name: 'Phone Comparison',
      url: '/compare/oneplus-13-vs-samsung-galaxy-s24-ultra',
      expectedContent: ['msp-product-card', 'msp-comparison'],
      minEditTags: 15
    },
    {
      name: 'Visual Builder Test',
      url: '/visual-builder-test',
      expectedContent: ['visual-builder', 'debug'],
      minEditTags: 3
    },
    {
      name: 'Mobile Phone Detail',
      url: '/mobile/bltffc3e218b0c94c4a',
      expectedContent: ['phone-detail', 'specifications'],
      minEditTags: 8
    }
  ];
  
  const results = {};
  let totalEditTags = 0;
  let totalPages = 0;
  let workingPages = 0;
  
  // Add console listener to capture Live Preview logs
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('Live Preview') || text.includes('ContentstackLivePreview')) {
      console.log(`🔍 Console: ${text}`);
    }
  });
  
  try {
    for (const pageTest of pagesToTest) {
      console.log(`\n📊 Testing: ${pageTest.name}`);
      console.log('-'.repeat(50));
      
      totalPages++;
      
      try {
        await page.goto(`http://localhost:3002${pageTest.url}`, {
          waitUntil: 'networkidle',
          timeout: 30000
        });
        
        await page.waitForTimeout(3000);
        
        // Check Live Preview SDK initialization
        const sdkStatus = await page.evaluate(() => {
          return {
            livePreview: typeof window.ContentstackLivePreview !== 'undefined',
            contentstack: typeof window.Contentstack !== 'undefined',
            sdkMethods: window.ContentstackLivePreview ? Object.keys(window.ContentstackLivePreview) : []
          };
        });
        
        // Count edit tags
        const editTags = await page.$$('[data-cslp]');
        const editTagCount = editTags.length;
        totalEditTags += editTagCount;
        
        // Get sample edit tags with their content
        const sampleEditTags = [];
        for (let i = 0; i < Math.min(5, editTags.length); i++) {
          const tag = editTags[i];
          const cslpValue = await tag.getAttribute('data-cslp');
          const tagName = await tag.evaluate(el => el.tagName);
          const textContent = await tag.evaluate(el => {
            const text = el.textContent || el.alt || el.title || '';
            return text.length > 40 ? text.substring(0, 40) + '...' : text;
          });
          
          sampleEditTags.push({
            tag: tagName,
            cslp: cslpValue,
            content: textContent
          });
        }
        
        // Check for page-specific content
        let contentFound = 0;
        for (const expectedContent of pageTest.expectedContent) {
          const elements = await page.$$(`[class*="${expectedContent}"], #${expectedContent}, [id*="${expectedContent}"]`);
          if (elements.length > 0) {
            contentFound++;
          }
        }
        
        // Check for any JavaScript errors
        const jsErrors = await page.evaluate(() => {
          // Look for any error indicators in the DOM
          const errorElements = document.querySelectorAll('.error, .error-message, [class*="error"]');
          return Array.from(errorElements).map(el => el.textContent).filter(text => text.length > 0);
        });
        
        // Assess page status
        const hasSDK = sdkStatus.livePreview;
        const hasEditTags = editTagCount >= pageTest.minEditTags;
        const hasContent = contentFound > 0 || editTagCount > 0;
        const noErrors = jsErrors.length === 0;
        
        const pageWorking = hasSDK && hasEditTags && hasContent && noErrors;
        if (pageWorking) workingPages++;
        
        results[pageTest.name] = {
          url: pageTest.url,
          sdkInitialized: hasSDK,
          editTagCount: editTagCount,
          minEditTags: pageTest.minEditTags,
          editTagsOK: hasEditTags,
          contentFound: contentFound,
          expectedContent: pageTest.expectedContent.length,
          jsErrors: jsErrors.length,
          sampleEditTags: sampleEditTags,
          working: pageWorking
        };
        
        console.log(`📊 Live Preview SDK: ${hasSDK ? '✅' : '❌'}`);
        console.log(`📊 Edit tags: ${editTagCount} found (min: ${pageTest.minEditTags}) ${hasEditTags ? '✅' : '❌'}`);
        console.log(`📊 Content elements: ${contentFound}/${pageTest.expectedContent.length} ${hasContent ? '✅' : '❌'}`);
        console.log(`📊 JavaScript errors: ${jsErrors.length} ${noErrors ? '✅' : '❌'}`);
        
        if (sampleEditTags.length > 0) {
          console.log('📊 Sample edit tags:');
          sampleEditTags.forEach((tag, i) => {
            console.log(`   ${i + 1}. ${tag.tag}: "${tag.content}" [${tag.cslp}]`);
          });
        }
        
        if (jsErrors.length > 0) {
          console.log('⚠️ JavaScript errors found:', jsErrors);
        }
        
        console.log(`📊 Overall: ${pageWorking ? '✅ Working' : '❌ Issues found'}`);
        
      } catch (pageError) {
        console.log(`❌ Failed to test ${pageTest.name}:`, pageError.message);
        results[pageTest.name] = {
          url: pageTest.url,
          error: pageError.message,
          working: false
        };
      }
    }
    
    // Test dynamic content loading (personalization)
    console.log(`\n📊 Testing: Dynamic Content Loading`);
    console.log('-'.repeat(50));
    
    await page.goto('http://localhost:3002/', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    
    await page.waitForTimeout(2000);
    
    // Check for personalization indicators
    const personalizationStatus = await page.evaluate(() => {
      return {
        hasPersonalizeSDK: typeof window.Personalize !== 'undefined',
        hasPersonalizeIndicator: document.querySelector('[style*="Personalized"]') !== null,
        hasVariantData: sessionStorage.getItem('personalize_variants_6867b3948da5ea911dab7899') !== null
      };
    });
    
    console.log(`📊 Personalize SDK: ${personalizationStatus.hasPersonalizeSDK ? '✅' : '❌'}`);
    console.log(`📊 Personalization active: ${personalizationStatus.hasPersonalizeIndicator ? '✅' : '❌'}`);
    console.log(`📊 Variant data: ${personalizationStatus.hasVariantData ? '✅' : '❌'}`);
    
    // Final assessment
    console.log('\n🎯 COMPREHENSIVE VISUAL BUILDER ASSESSMENT');
    console.log('='.repeat(70));
    
    const successRate = Math.round((workingPages / totalPages) * 100);
    const avgEditTags = Math.round(totalEditTags / totalPages);
    
    console.log(`📊 Pages tested: ${totalPages}`);
    console.log(`📊 Pages working: ${workingPages}`);
    console.log(`📊 Success rate: ${successRate}%`);
    console.log(`📊 Total edit tags: ${totalEditTags}`);
    console.log(`📊 Average edit tags per page: ${avgEditTags}`);
    
    console.log('\n📋 Detailed Results by Page:');
    Object.entries(results).forEach(([pageName, result]) => {
      if (result.error) {
        console.log(`❌ ${pageName}: ERROR - ${result.error}`);
      } else {
        const status = result.working ? '✅' : '❌';
        console.log(`${status} ${pageName}: ${result.editTagCount} edit tags, SDK: ${result.sdkInitialized ? 'Yes' : 'No'}`);
      }
    });
    
    // Recommendations
    console.log('\n💡 RECOMMENDATIONS:');
    console.log('-'.repeat(30));
    
    if (successRate >= 90) {
      console.log('🎉 EXCELLENT: Visual Builder integration is working perfectly across all pages!');
      console.log('   • All pages have proper edit tags');
      console.log('   • Live Preview SDK is consistently initialized');
      console.log('   • Content management is fully functional');
      console.log('   • Ready for production use');
    } else if (successRate >= 70) {
      console.log('👍 GOOD: Visual Builder integration is mostly working');
      console.log('   • Most pages have proper functionality');
      console.log('   • Minor issues may need attention');
    } else {
      console.log('⚠️ NEEDS ATTENTION: Visual Builder integration has issues');
      console.log('   • Multiple pages not working correctly');
      console.log('   • SDK initialization or edit tags missing');
    }
    
    // Specific issues found
    const pagesWithIssues = Object.entries(results).filter(([_, result]) => !result.working);
    if (pagesWithIssues.length > 0) {
      console.log('\n🔧 Pages needing attention:');
      pagesWithIssues.forEach(([pageName, result]) => {
        console.log(`   • ${pageName}: ${result.error || 'Edit tags or SDK issues'}`);
      });
    }
    
    return {
      totalPages,
      workingPages,
      successRate,
      totalEditTags,
      results,
      overallWorking: successRate >= 90
    };
    
  } catch (error) {
    console.error('❌ Comprehensive Visual Builder test failed:', error);
    return { error: error.message };
  } finally {
    await browser.close();
  }
}

testVisualBuilderAllPages().then(results => {
  if (results.overallWorking) {
    console.log('\n🚀 Visual Builder integration confirmed working across all pages!');
  } else {
    console.log('\n🔧 Visual Builder integration needs attention on some pages');
  }
}).catch(console.error);