const { chromium } = require('playwright');

async function testDataStructure() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  console.log('🧪 Testing Data Structure for Visual Builder...');
  
  try {
    await page.goto('http://localhost:3002/visual-builder-test', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    
    await page.waitForTimeout(3000);
    
    // Get the actual data structure that's being rendered
    const dataStructure = await page.evaluate(() => {
      // Look for the debug info section
      const debugSection = document.querySelector('pre');
      if (debugSection) {
        try {
          return JSON.parse(debugSection.textContent);
        } catch (e) {
          return { error: 'Could not parse debug data', raw: debugSection.textContent };
        }
      }
      return { error: 'No debug section found' };
    });
    
    console.log('📊 Data structure from page:');
    console.log(JSON.stringify(dataStructure, null, 2));
    
    // Check for actual edit attributes in the DOM
    const editAttributes = await page.evaluate(() => {
      const elements = document.querySelectorAll('[data-cslp]');
      const attrs = [];
      
      elements.forEach((el, i) => {
        if (i < 10) { // First 10 elements
          attrs.push({
            tag: el.tagName,
            cslp: el.getAttribute('data-cslp'),
            content: el.textContent ? el.textContent.substring(0, 50) : '',
            style: el.style.border || 'none'
          });
        }
      });
      
      return attrs;
    });
    
    console.log('\n📊 Edit attributes found:');
    editAttributes.forEach((attr, i) => {
      console.log(`${i + 1}. ${attr.tag}: "${attr.content}" [${attr.cslp}]`);
    });
    
    // Check debug info text
    const debugInfo = await page.evaluate(() => {
      const debugDiv = document.querySelector('div[style*="background: #f0f0f0"]');
      return debugDiv ? debugDiv.textContent : 'No debug info found';
    });
    
    console.log('\n📊 Debug info text:');
    console.log(debugInfo);
    
    return editAttributes.length > 0;
    
  } catch (error) {
    console.error('❌ Data structure test failed:', error.message);
    return false;
  } finally {
    await browser.close();
  }
}

testDataStructure().then(success => {
  console.log(success ? '\n✅ Data structure test complete' : '\n❌ Data structure test failed');
}).catch(console.error);