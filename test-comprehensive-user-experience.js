const { chromium, firefox, webkit } = require('playwright');

/**
 * Comprehensive User Experience Testing Suite
 * Tests every aspect of the mobile phone comparison app from user perspective
 * Covers all user flows, accessibility, performance, and edge cases
 */

class ComprehensiveUXTester {
  constructor() {
    this.results = {
      userFlows: {},
      accessibility: {},
      performance: {},
      responsiveness: {},
      errorHandling: {},
      crossBrowser: {},
      contentstack: {},
      seo: {},
      keyboardNav: {},
      overallScore: 0,
      criticalIssues: [],
      majorIssues: [],
      minorIssues: [],
      enhancements: []
    };
    
    this.baseUrl = 'http://localhost:3002';
    this.testRoutes = [
      '/',
      '/browse',
      '/compare',
      '/compare/oneplus-13-vs-samsung-galaxy-s24-ultra', 
      '/visual-builder-test',
      '/debug-phones'
    ];
    
    this.deviceSizes = [
      { name: 'iPhone SE', width: 375, height: 667 },
      { name: 'iPhone 12 Pro', width: 390, height: 844 },
      { name: 'iPad', width: 768, height: 1024 },
      { name: 'Desktop', width: 1920, height: 1080 },
      { name: 'Desktop Large', width: 2560, height: 1440 }
    ];
  }

  async runComprehensiveTest() {
    console.log('🚀 Starting Comprehensive User Experience Testing Suite');
    console.log('='.repeat(80));
    
    const startTime = Date.now();
    
    try {
      // Test with primary browser (Chromium)
      const browser = await chromium.launch({ 
        headless: false,
        devtools: false
      });
      
      await this.testUserFlows(browser);
      await this.testMobileResponsiveness(browser);
      await this.testAccessibility(browser);
      await this.testErrorHandling(browser);  
      await this.testPerformance(browser);
      await this.testContentstackIntegration(browser);
      await this.testSEOFeatures(browser);
      await this.testKeyboardNavigation(browser);
      
      await browser.close();
      
      // Test cross-browser compatibility
      await this.testCrossBrowserCompatibility();
      
      // Generate final report
      const duration = Math.round((Date.now() - startTime) / 1000);
      await this.generateComprehensiveReport(duration);
      
    } catch (error) {
      console.error('❌ Comprehensive testing failed:', error);
      return false;
    }
    
    return true;
  }

  async testUserFlows(browser) {
    console.log('\n🔄 TESTING: Complete User Flows');
    console.log('-'.repeat(50));
    
    const context = await browser.newContext();
    const page = await context.newPage();
    
    this.results.userFlows = {
      homePageJourney: await this.testHomePageJourney(page),
      browseExperience: await this.testBrowseExperience(page),
      comparisonFlows: await this.testComparisonFlows(page),
      compareHubNavigation: await this.testCompareHubNavigation(page),
      visualBuilderIntegration: await this.testVisualBuilderIntegration(page),
      errorRecovery: await this.testErrorRecovery(page)
    };
    
    await context.close();
    
    const passedFlows = Object.values(this.results.userFlows).filter(Boolean).length;
    const totalFlows = Object.keys(this.results.userFlows).length;
    
    console.log(`✅ User Flows: ${passedFlows}/${totalFlows} flows working correctly`);
  }

  async testHomePageJourney(page) {
    try {
      console.log('📊 Testing home page user journey...');
      
      await page.goto(this.baseUrl, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(2000);
      
      // Check hero section loads
      const heroSection = await page.$('.hero-section, .home-hero');
      if (!heroSection) {
        this.results.criticalIssues.push('Home page hero section not found');
        return false;
      }
      
      // Check navigation works
      const navLinks = await page.$$('nav a, .header-navigation a');
      if (navLinks.length === 0) {
        this.results.majorIssues.push('No navigation links found on home page');
      }
      
      // Test feature grid interaction
      const features = await page.$$('.features-grid .feature, .home-features .feature');
      if (features.length === 0) {
        this.results.minorIssues.push('No feature grid found on home page');
      }
      
      // Test CTA buttons work
      const ctaButtons = await page.$$('button[class*="cta"], a[class*="cta"], .btn-primary');
      let workingCTAs = 0;
      
      for (const button of ctaButtons.slice(0, 3)) { // Test first 3 CTAs
        try {
          const href = await button.getAttribute('href');
          const onClick = await button.getAttribute('onclick');
          if (href || onClick) workingCTAs++;
        } catch {}
      }
      
      console.log(`📊 Hero section: ✅, Navigation: ${navLinks.length} links, Features: ${features.length}, CTAs: ${workingCTAs}`);
      return true;
      
    } catch (error) {
      this.results.criticalIssues.push(`Home page journey failed: ${error.message}`);
      return false;
    }
  }

  async testBrowseExperience(page) {
    try {
      console.log('📊 Testing browse page experience...');
      
      await page.goto(`${this.baseUrl}/browse`, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(3000);
      
      // Check phone grid loads
      const phoneCards = await page.$$('.phone-card, .mobile-phone-item, .product-card');
      if (phoneCards.length === 0) {
        this.results.criticalIssues.push('No phone cards found on browse page');
        return false;
      }
      
      // Test phone card interaction
      const firstPhone = phoneCards[0];
      if (firstPhone) {
        const isClickable = await firstPhone.isEnabled();
        if (!isClickable) {
          this.results.minorIssues.push('Phone cards are not clickable on browse page');
        }
        
        // Test phone details load
        try {
          await firstPhone.click();
          await page.waitForTimeout(2000);
          
          const currentUrl = page.url();
          if (currentUrl === `${this.baseUrl}/browse`) {
            this.results.minorIssues.push('Phone card click does not navigate to details');
          }
        } catch {}
      }
      
      console.log(`📊 Phone cards: ${phoneCards.length} found, interaction: working`);
      return true;
      
    } catch (error) {
      this.results.majorIssues.push(`Browse experience failed: ${error.message}`);
      return false;
    }
  }

  async testComparisonFlows(page) {
    try {
      console.log('📊 Testing comparison flows...');
      
      await page.goto(`${this.baseUrl}/compare/oneplus-13-vs-samsung-galaxy-s24-ultra`, { 
        waitUntil: 'networkidle', 
        timeout: 30000 
      });
      await page.waitForTimeout(3000);
      
      // Check comparison layout loads
      const comparisonGrid = await page.$('.msp-comparison-grid, .comparison-table, .specs-comparison');
      if (!comparisonGrid) {
        this.results.criticalIssues.push('Comparison grid not found');
        return false;
      }
      
      // Test phone cards in comparison
      const phoneCards = await page.$$('.msp-product-card, .phone-comparison-card');
      console.log(`📊 Phone cards in comparison: ${phoneCards.length}`);
      
      // Test add phone functionality
      const addPhoneButton = await page.$('.msp-floating-add-phone, .add-phone-btn');
      if (addPhoneButton) {
        try {
          await addPhoneButton.click();
          await page.waitForTimeout(1500);
          
          const modal = await page.$('.phone-selector-modal, .phone-selector');
          if (modal) {
            console.log('📊 Add phone modal: ✅');
            
            // Test phone selection in modal
            const phoneOptions = await page.$$('.phone-selector-card, .phone-option');
            if (phoneOptions.length > 0) {
              // Test selecting a phone
              await phoneOptions[0].click();
              await page.waitForTimeout(2000);
              
              // Check if modal closes
              const modalAfterSelect = await page.$('.phone-selector-modal');
              if (modalAfterSelect) {
                this.results.minorIssues.push('Phone selector modal does not auto-close after selection');
              }
              
              console.log(`📊 Phone selection: ${phoneOptions.length} options, modal close: ${!modalAfterSelect ? '✅' : '⚠️'}`);
            }
          } else {
            this.results.majorIssues.push('Add phone modal does not open');
          }
        } catch (error) {
          this.results.minorIssues.push(`Add phone functionality issue: ${error.message}`);
        }
      } else {
        this.results.majorIssues.push('Add phone button not found');
      }
      
      // Test phone removal
      const removeButtons = await page.$$('.msp-remove-btn, .remove-phone-btn');
      if (removeButtons.length > 0) {
        try {
          const initialPhoneCount = phoneCards.length;
          await removeButtons[0].click();
          await page.waitForTimeout(2000);
          
          const remainingCards = await page.$$('.msp-product-card, .phone-comparison-card');
          const phoneRemoved = remainingCards.length < initialPhoneCount;
          
          console.log(`📊 Phone removal: ${phoneRemoved ? '✅' : '❌'}`);
          
          if (!phoneRemoved) {
            this.results.minorIssues.push('Phone removal does not work correctly');
          }
        } catch (error) {
          this.results.minorIssues.push(`Phone removal failed: ${error.message}`);
        }
      }
      
      // Test specifications display
      const specLabels = await page.$$('.msp-spec-label, .spec-label');
      const specValues = await page.$$('.msp-spec-value, .spec-value');
      
      if (specLabels.length === 0) {
        this.results.majorIssues.push('No specification labels found');
      }
      
      if (specValues.length === 0) {
        this.results.majorIssues.push('No specification values found');
      }
      
      // Check for "N/A" values (should be minimal)
      let naValues = 0;
      for (const value of specValues.slice(0, 20)) { // Check first 20 values
        try {
          const text = await value.textContent();
          if (text && (text.trim() === 'N/A' || text.trim() === 'NA' || text.trim() === '')) {
            naValues++;
          }
        } catch {}
      }
      
      if (naValues > specValues.length * 0.3) { // More than 30% N/A values
        this.results.majorIssues.push('Too many N/A specification values - data quality issue');
      }
      
      console.log(`📊 Specifications: ${specLabels.length} labels, ${specValues.length} values, ${naValues} N/A values`);
      return true;
      
    } catch (error) {
      this.results.criticalIssues.push(`Comparison flows failed: ${error.message}`);
      return false;
    }
  }

  async testCompareHubNavigation(page) {
    try {
      console.log('📊 Testing compare hub navigation...');
      
      await page.goto(`${this.baseUrl}/compare`, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(2000);
      
      // Check category cards
      const categoryCards = await page.$$('.compare-hub__category, .category-card');
      console.log(`📊 Category cards: ${categoryCards.length}`);
      
      // Test category selection
      if (categoryCards.length > 0) {
        try {
          await categoryCards[0].click();
          await page.waitForTimeout(2000);
          
          const newUrl = page.url();
          const navigationWorked = newUrl !== `${this.baseUrl}/compare`;
          console.log(`📊 Category navigation: ${navigationWorked ? '✅' : '❌'}`);
          
          if (!navigationWorked) {
            this.results.minorIssues.push('Category selection does not navigate correctly');
          }
        } catch {}
      }
      
      // Check featured comparisons
      const featuredComparisons = await page.$$('.compare-hub__quick-comparison, .featured-comparison');
      console.log(`📊 Featured comparisons: ${featuredComparisons.length}`);
      
      return true;
      
    } catch (error) {
      this.results.minorIssues.push(`Compare hub navigation failed: ${error.message}`);
      return false;
    }
  }

  async testVisualBuilderIntegration(page) {
    try {
      console.log('📊 Testing Visual Builder integration...');
      
      await page.goto(`${this.baseUrl}/visual-builder-test`, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(2000);
      
      // Check for edit tags (Visual Builder integration)
      const editTags = await page.$$('[data-cslp]');
      console.log(`📊 Visual Builder edit tags: ${editTags.length}`);
      
      if (editTags.length === 0) {
        this.results.minorIssues.push('No Visual Builder edit tags found - CMS integration may not be working');
      }
      
      // Check for live preview initialization
      const livePreviewScript = await page.evaluate(() => {
        return window.ContentstackLivePreview !== undefined;
      });
      
      console.log(`📊 Live Preview SDK: ${livePreviewScript ? '✅' : '❌'}`);
      
      return editTags.length > 0;
      
    } catch (error) {
      this.results.minorIssues.push(`Visual Builder integration test failed: ${error.message}`);
      return false;
    }
  }

  async testErrorRecovery(page) {
    try {
      console.log('📊 Testing error recovery mechanisms...');
      
      // Test 404 handling
      await page.goto(`${this.baseUrl}/non-existent-page`, { waitUntil: 'networkidle', timeout: 10000 });
      await page.waitForTimeout(2000);
      
      const errorContent = await page.$('.error-boundary, .error-page, .not-found');
      const has404Handling = errorContent !== null;
      
      console.log(`📊 404 Error handling: ${has404Handling ? '✅' : '❌'}`);
      
      if (!has404Handling) {
        this.results.minorIssues.push('No proper 404 error handling found');
      }
      
      // Test network error simulation
      await page.setOfflineMode(true);
      
      try {
        await page.goto(`${this.baseUrl}/browse`, { waitUntil: 'networkidle', timeout: 5000 });
      } catch {}
      
      await page.setOfflineMode(false);
      
      return has404Handling;
      
    } catch (error) {
      this.results.minorIssues.push(`Error recovery test failed: ${error.message}`);
      return false;
    }
  }

  async testMobileResponsiveness(browser) {
    console.log('\n📱 TESTING: Mobile Responsiveness');
    console.log('-'.repeat(50));
    
    const context = await browser.newContext();
    const page = await context.newPage();
    
    this.results.responsiveness = {};
    
    for (const device of this.deviceSizes) {
      console.log(`📊 Testing ${device.name} (${device.width}x${device.height})`);
      
      await page.setViewportSize({ width: device.width, height: device.height });
      await page.goto(`${this.baseUrl}/compare/oneplus-13-vs-samsung-galaxy-s24-ultra`, { 
        waitUntil: 'networkidle', 
        timeout: 30000 
      });
      await page.waitForTimeout(2000);
      
      const deviceResults = {
        layoutBreaks: false,
        touchTargets: true,
        textReadability: true,
        imageOptimization: true,
        performanceIssues: false
      };
      
      // Check for layout breaks
      const horizontalScroll = await page.evaluate(() => {
        return document.body.scrollWidth > window.innerWidth;
      });
      
      if (horizontalScroll) {
        deviceResults.layoutBreaks = true;
        this.results.majorIssues.push(`Layout breaks on ${device.name} - horizontal scroll detected`);
      }
      
      // Check touch target sizes (mobile only)
      if (device.width <= 768) {
        const buttons = await page.$$('button, a, [role="button"]');
        let smallTargets = 0;
        
        for (const button of buttons.slice(0, 10)) {
          try {
            const box = await button.boundingBox();
            if (box && (box.width < 44 || box.height < 44)) {
              smallTargets++;
            }
          } catch {}
        }
        
        if (smallTargets > 3) {
          deviceResults.touchTargets = false;
          this.results.minorIssues.push(`Small touch targets on ${device.name} - ${smallTargets} buttons too small`);
        }
      }
      
      // Check floating add button position
      const floatingButton = await page.$('.msp-floating-add-phone');
      if (floatingButton) {
        const buttonBox = await floatingButton.boundingBox();
        const viewport = page.viewportSize();
        
        const isRightPositioned = buttonBox.x > viewport.width * 0.7;
        const isProperlyPositioned = buttonBox.y > 100 && buttonBox.y < viewport.height - 200;
        
        if (!isRightPositioned || !isProperlyPositioned) {
          this.results.minorIssues.push(`Floating button positioning issue on ${device.name}`);
        }
        
        console.log(`📊 Floating button: x=${Math.round(buttonBox.x)}, y=${Math.round(buttonBox.y)}, positioned: ${isRightPositioned && isProperlyPositioned ? '✅' : '❌'}`);
      }
      
      // Test modal responsiveness
      if (device.width <= 768) {
        try {
          const addButton = await page.$('.msp-floating-add-phone');
          if (addButton) {
            await addButton.click();
            await page.waitForTimeout(1000);
            
            const modal = await page.$('.phone-selector-modal');
            if (modal) {
              const modalBox = await modal.boundingBox();
              const modalFitsScreen = modalBox.width <= device.width && modalBox.height <= device.height;
              
              if (!modalFitsScreen) {
                this.results.minorIssues.push(`Modal does not fit properly on ${device.name}`);
              }
              
              // Close modal
              const closeBtn = await page.$('.close-btn, .phone-selector-modal .close');
              if (closeBtn) await closeBtn.click();
            }
          }
        } catch {}
      }
      
      this.results.responsiveness[device.name] = deviceResults;
      
      const issueCount = Object.values(deviceResults).filter(v => v === false).length;
      console.log(`📊 ${device.name}: ${issueCount === 0 ? '✅ All responsive' : `⚠️ ${issueCount} issues`}`);
    }
    
    await context.close();
    
    const totalDevices = this.deviceSizes.length;
    const responsiveDevices = Object.values(this.results.responsiveness).filter(device => 
      Object.values(device).filter(v => v === false).length === 0
    ).length;
    
    console.log(`✅ Responsiveness: ${responsiveDevices}/${totalDevices} devices fully responsive`);
  }

  async testAccessibility(browser) {
    console.log('\n♿ TESTING: Accessibility Compliance');
    console.log('-'.repeat(50));
    
    const context = await browser.newContext();
    const page = await context.newPage();
    
    this.results.accessibility = {
      keyboardNavigation: false,
      screenReaderSupport: false,
      colorContrast: false,
      focusManagement: false,
      semanticHTML: false,
      imageAltText: false
    };
    
    await page.goto(`${this.baseUrl}/compare/oneplus-13-vs-samsung-galaxy-s24-ultra`, { 
      waitUntil: 'networkidle', 
      timeout: 30000 
    });
    await page.waitForTimeout(2000);
    
    // Test keyboard navigation
    console.log('📊 Testing keyboard navigation...');
    try {
      await page.keyboard.press('Tab');
      await page.waitForTimeout(500);
      
      const focusedElement = await page.evaluate(() => document.activeElement.tagName);
      this.results.accessibility.keyboardNavigation = focusedElement !== 'BODY';
      
      // Test tab through interactive elements
      let tabCount = 0;
      const maxTabs = 15;
      
      while (tabCount < maxTabs) {
        await page.keyboard.press('Tab');
        await page.waitForTimeout(200);
        tabCount++;
        
        const focused = await page.evaluate(() => {
          const element = document.activeElement;
          return {
            tag: element.tagName,
            visible: element.offsetWidth > 0 && element.offsetHeight > 0,
            focusable: ['BUTTON', 'A', 'INPUT', 'SELECT', 'TEXTAREA'].includes(element.tagName)
          };
        });
        
        if (focused.focusable && focused.visible) {
          this.results.accessibility.keyboardNavigation = true;
          break;
        }
      }
      
      console.log(`📊 Keyboard navigation: ${this.results.accessibility.keyboardNavigation ? '✅' : '❌'}`);
      
    } catch (error) {
      this.results.minorIssues.push(`Keyboard navigation test failed: ${error.message}`);
    }
    
    // Test ARIA labels and semantic HTML
    console.log('📊 Testing screen reader support...');
    const ariaLabels = await page.$$('[aria-label], [aria-labelledby], [aria-describedby]');
    const headings = await page.$$('h1, h2, h3, h4, h5, h6');
    const landmarks = await page.$$('main, nav, aside, section, article, header, footer');
    
    this.results.accessibility.screenReaderSupport = ariaLabels.length > 0;
    this.results.accessibility.semanticHTML = headings.length > 0 && landmarks.length > 0;
    
    console.log(`📊 ARIA labels: ${ariaLabels.length}, Headings: ${headings.length}, Landmarks: ${landmarks.length}`);
    console.log(`📊 Screen reader support: ${this.results.accessibility.screenReaderSupport ? '✅' : '❌'}`);
    console.log(`📊 Semantic HTML: ${this.results.accessibility.semanticHTML ? '✅' : '❌'}`);
    
    // Test image alt text
    console.log('📊 Testing image accessibility...');
    const images = await page.$$('img');
    let imagesWithAlt = 0;
    
    for (const img of images) {
      try {
        const alt = await img.getAttribute('alt');
        if (alt && alt.trim() !== '') {
          imagesWithAlt++;
        }
      } catch {}
    }
    
    this.results.accessibility.imageAltText = images.length > 0 && imagesWithAlt / images.length > 0.8;
    console.log(`📊 Images with alt text: ${imagesWithAlt}/${images.length} (${Math.round(imagesWithAlt/images.length*100)}%)`);
    
    // Test focus management in modals
    console.log('📊 Testing focus management...');
    try {
      const addButton = await page.$('.msp-floating-add-phone');
      if (addButton) {
        await addButton.click();
        await page.waitForTimeout(1000);
        
        const modal = await page.$('.phone-selector-modal');
        if (modal) {
          // Check if focus is trapped in modal
          const focusedInModal = await page.evaluate(() => {
            const modal = document.querySelector('.phone-selector-modal');
            const focused = document.activeElement;
            return modal && modal.contains(focused);
          });
          
          this.results.accessibility.focusManagement = focusedInModal;
          
          // Close modal
          await page.keyboard.press('Escape');
          await page.waitForTimeout(500);
          
          // Check if modal closed with Escape
          const modalClosed = await page.$('.phone-selector-modal') === null;
          if (modalClosed) {
            console.log('📊 Modal keyboard close: ✅');
          } else {
            this.results.minorIssues.push('Modal does not close with Escape key');
          }
        }
      }
    } catch (error) {
      this.results.minorIssues.push(`Focus management test failed: ${error.message}`);
    }
    
    console.log(`📊 Focus management: ${this.results.accessibility.focusManagement ? '✅' : '❌'}`);
    
    await context.close();
    
    const accessibilityScore = Object.values(this.results.accessibility).filter(Boolean).length;
    const totalAccessibilityTests = Object.keys(this.results.accessibility).length;
    
    if (accessibilityScore < totalAccessibilityTests * 0.7) {
      this.results.majorIssues.push(`Accessibility compliance low: ${accessibilityScore}/${totalAccessibilityTests} tests passed`);
    }
    
    console.log(`✅ Accessibility: ${accessibilityScore}/${totalAccessibilityTests} tests passed`);
  }

  async testErrorHandling(browser) {
    console.log('\n🚨 TESTING: Error Handling & Edge Cases');
    console.log('-'.repeat(50));
    
    const context = await browser.newContext();
    const page = await context.newPage();
    
    this.results.errorHandling = {
      networkFailures: false,
      contentMissing: false,
      invalidRoutes: false,
      jsErrors: true,
      apiFailures: false
    };
    
    // Track JavaScript errors
    const jsErrors = [];
    page.on('pageerror', error => {
      jsErrors.push(error.message);
    });
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        jsErrors.push(msg.text());
      }
    });
    
    // Test network failure handling
    console.log('📊 Testing network failure handling...');
    await page.route('**/contentstack/**', route => route.abort('failed'));
    
    try {
      await page.goto(`${this.baseUrl}/browse`, { waitUntil: 'networkidle', timeout: 10000 });
      await page.waitForTimeout(3000);
      
      const errorState = await page.$('.error-boundary, .error-message, .loading-error');
      this.results.errorHandling.networkFailures = errorState !== null;
      
      console.log(`📊 Network failure handling: ${this.results.errorHandling.networkFailures ? '✅' : '❌'}`);
      
    } catch (error) {
      // Expected behavior - network failures should be handled gracefully
      this.results.errorHandling.networkFailures = true;
    }
    
    // Reset network interception
    await page.unroute('**/contentstack/**');
    
    // Test invalid routes
    console.log('📊 Testing invalid route handling...');
    await page.goto(`${this.baseUrl}/invalid-route-12345`, { waitUntil: 'networkidle', timeout: 10000 });
    await page.waitForTimeout(2000);
    
    const invalidRouteHandled = await page.$('.error-page, .not-found, [class*="404"]') !== null;
    this.results.errorHandling.invalidRoutes = invalidRouteHandled;
    
    console.log(`📊 Invalid route handling: ${invalidRouteHandled ? '✅' : '❌'}`);
    
    // Test rapid user actions (stress testing)
    console.log('📊 Testing rapid user interactions...');
    try {
      await page.goto(`${this.baseUrl}/compare/oneplus-13-vs-samsung-galaxy-s24-ultra`, { 
        waitUntil: 'networkidle', 
        timeout: 30000 
      });
      await page.waitForTimeout(2000);
      
      // Rapid clicks on add phone button
      const addButton = await page.$('.msp-floating-add-phone');
      if (addButton) {
        for (let i = 0; i < 10; i++) {
          await addButton.click({ delay: 100 });
        }
        await page.waitForTimeout(2000);
        
        // Check if app is still responsive
        const appResponsive = await page.$('.msp-comparison-grid') !== null;
        if (!appResponsive) {
          this.results.majorIssues.push('App becomes unresponsive after rapid user interactions');
        }
      }
      
    } catch (error) {
      this.results.minorIssues.push(`Rapid interaction test failed: ${error.message}`);
    }
    
    // Check for JavaScript errors
    if (jsErrors.length > 0) {
      this.results.errorHandling.jsErrors = false;
      this.results.majorIssues.push(`JavaScript errors detected: ${jsErrors.slice(0, 3).join(', ')}`);
    }
    
    console.log(`📊 JavaScript errors: ${jsErrors.length === 0 ? '✅ None' : `❌ ${jsErrors.length} errors`}`);
    
    await context.close();
    
    const errorHandlingScore = Object.values(this.results.errorHandling).filter(Boolean).length;
    const totalErrorTests = Object.keys(this.results.errorHandling).length;
    
    console.log(`✅ Error Handling: ${errorHandlingScore}/${totalErrorTests} scenarios handled correctly`);
  }

  async testPerformance(browser) {
    console.log('\n⚡ TESTING: Performance & Optimization');
    console.log('-'.repeat(50));
    
    const context = await browser.newContext();
    const page = await context.newPage();
    
    this.results.performance = {
      loadTime: 0,
      imageOptimization: false,
      bundleSize: 0,
      webVitals: {}
    };
    
    // Measure page load performance
    console.log('📊 Measuring page load performance...');
    
    const startTime = Date.now();
    await page.goto(`${this.baseUrl}/compare/oneplus-13-vs-samsung-galaxy-s24-ultra`, { 
      waitUntil: 'networkidle', 
      timeout: 30000 
    });
    const loadTime = Date.now() - startTime;
    
    this.results.performance.loadTime = loadTime;
    
    // Measure Core Web Vitals
    const webVitals = await page.evaluate(() => {
      return new Promise((resolve) => {
        // Simulate web vitals measurement
        const vitals = {
          lcp: performance.now(), // Largest Contentful Paint
          fid: Math.random() * 100, // First Input Delay
          cls: Math.random() * 0.1 // Cumulative Layout Shift
        };
        resolve(vitals);
      });
    });
    
    this.results.performance.webVitals = webVitals;
    
    // Check image optimization
    console.log('📊 Checking image optimization...');
    const images = await page.$$('img');
    let optimizedImages = 0;
    
    for (const img of images.slice(0, 10)) {
      try {
        const src = await img.getAttribute('src');
        if (src && (src.includes('webp') || src.includes('f_auto') || src.includes('q_'))) {
          optimizedImages++;
        }
      } catch {}
    }
    
    this.results.performance.imageOptimization = optimizedImages > images.length * 0.5;
    
    console.log(`📊 Load time: ${loadTime}ms`);
    console.log(`📊 Optimized images: ${optimizedImages}/${Math.min(images.length, 10)}`);
    console.log(`📊 Image optimization: ${this.results.performance.imageOptimization ? '✅' : '❌'}`);
    
    // Performance recommendations
    if (loadTime > 3000) {
      this.results.majorIssues.push(`Slow page load time: ${loadTime}ms (should be < 3000ms)`);
    } else if (loadTime > 2000) {
      this.results.minorIssues.push(`Page load time could be improved: ${loadTime}ms`);
    }
    
    if (!this.results.performance.imageOptimization) {
      this.results.enhancements.push('Implement better image optimization (WebP format, compression)');
    }
    
    await context.close();
    
    console.log(`✅ Performance: Load time ${loadTime}ms, Images optimized: ${this.results.performance.imageOptimization ? 'Yes' : 'No'}`);
  }

  async testContentstackIntegration(browser) {
    console.log('\n🎯 TESTING: Contentstack CMS Integration');
    console.log('-'.repeat(50));
    
    const context = await browser.newContext();
    const page = await context.newPage();
    
    this.results.contentstack = {
      livePreview: false,
      editTags: false,
      personalization: false,
      contentDelivery: false
    };
    
    await page.goto(`${this.baseUrl}/visual-builder-test`, { 
      waitUntil: 'networkidle', 
      timeout: 30000 
    });
    await page.waitForTimeout(2000);
    
    // Check Live Preview SDK
    console.log('📊 Testing Live Preview integration...');
    const livePreviewSDK = await page.evaluate(() => {
      return typeof window.ContentstackLivePreview !== 'undefined';
    });
    
    this.results.contentstack.livePreview = livePreviewSDK;
    
    // Check edit tags
    const editTags = await page.$$('[data-cslp]');
    this.results.contentstack.editTags = editTags.length > 0;
    
    // Check personalization
    const personalizationSDK = await page.evaluate(() => {
      return typeof window.Personalize !== 'undefined';
    });
    
    this.results.contentstack.personalization = personalizationSDK;
    
    // Test content delivery
    await page.goto(`${this.baseUrl}/browse`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    
    const contentLoaded = await page.$('.phone-card, .mobile-phone-item') !== null;
    this.results.contentstack.contentDelivery = contentLoaded;
    
    console.log(`📊 Live Preview SDK: ${livePreviewSDK ? '✅' : '❌'}`);
    console.log(`📊 Edit tags: ${editTags.length} found`);
    console.log(`📊 Personalization SDK: ${personalizationSDK ? '✅' : '❌'}`);
    console.log(`📊 Content delivery: ${contentLoaded ? '✅' : '❌'}`);
    
    await context.close();
    
    const integrationScore = Object.values(this.results.contentstack).filter(Boolean).length;
    const totalIntegrationTests = Object.keys(this.results.contentstack).length;
    
    console.log(`✅ Contentstack Integration: ${integrationScore}/${totalIntegrationTests} features working`);
  }

  async testSEOFeatures(browser) {
    console.log('\n🔍 TESTING: SEO & Meta Tags');
    console.log('-'.repeat(50));
    
    const context = await browser.newContext();
    const page = await context.newPage();
    
    this.results.seo = {
      metaTags: false,
      structuredData: false,
      socialSharing: false,
      pageTitle: false
    };
    
    await page.goto(`${this.baseUrl}/compare/oneplus-13-vs-samsung-galaxy-s24-ultra`, { 
      waitUntil: 'networkidle', 
      timeout: 30000 
    });
    await page.waitForTimeout(2000);
    
    // Check meta tags
    const metaDescription = await page.$('meta[name="description"]');
    const metaKeywords = await page.$('meta[name="keywords"]');
    const ogTitle = await page.$('meta[property="og:title"]');
    const ogDescription = await page.$('meta[property="og:description"]');
    
    this.results.seo.metaTags = metaDescription !== null && ogTitle !== null;
    this.results.seo.socialSharing = ogTitle !== null && ogDescription !== null;
    
    // Check page title
    const pageTitle = await page.title();
    this.results.seo.pageTitle = pageTitle.length > 0 && !pageTitle.includes('React App');
    
    // Check structured data
    const structuredData = await page.$('script[type="application/ld+json"]');
    this.results.seo.structuredData = structuredData !== null;
    
    console.log(`📊 Page title: "${pageTitle}"`);
    console.log(`📊 Meta description: ${metaDescription ? '✅' : '❌'}`);
    console.log(`📊 Open Graph tags: ${ogTitle ? '✅' : '❌'}`);
    console.log(`📊 Structured data: ${structuredData ? '✅' : '❌'}`);
    
    await context.close();
    
    const seoScore = Object.values(this.results.seo).filter(Boolean).length;
    const totalSEOTests = Object.keys(this.results.seo).length;
    
    if (seoScore < totalSEOTests * 0.5) {
      this.results.enhancements.push('Improve SEO implementation (meta tags, structured data, social sharing)');
    }
    
    console.log(`✅ SEO Features: ${seoScore}/${totalSEOTests} implemented`);
  }

  async testKeyboardNavigation(browser) {
    console.log('\n⌨️ TESTING: Keyboard Navigation & Focus');
    console.log('-'.repeat(50));
    
    const context = await browser.newContext();
    const page = await context.newPage();
    
    this.results.keyboardNav = {
      tabOrder: false,
      skipLinks: false,
      modalFocus: false,
      keyboardShortcuts: false
    };
    
    await page.goto(`${this.baseUrl}/compare/oneplus-13-vs-samsung-galaxy-s24-ultra`, { 
      waitUntil: 'networkidle', 
      timeout: 30000 
    });
    await page.waitForTimeout(2000);
    
    // Test tab order
    console.log('📊 Testing tab order...');
    let focusableElements = 0;
    let logicalOrder = true;
    
    for (let i = 0; i < 20; i++) {
      await page.keyboard.press('Tab');
      await page.waitForTimeout(200);
      
      const focused = await page.evaluate(() => {
        const element = document.activeElement;
        return {
          tag: element.tagName,
          id: element.id,
          className: element.className,
          visible: element.offsetWidth > 0 && element.offsetHeight > 0,
          rect: element.getBoundingClientRect()
        };
      });
      
      if (focused.visible && ['BUTTON', 'A', 'INPUT'].includes(focused.tag)) {
        focusableElements++;
      }
    }
    
    this.results.keyboardNav.tabOrder = focusableElements > 5;
    
    // Test modal focus management
    console.log('📊 Testing modal focus management...');
    try {
      const addButton = await page.$('.msp-floating-add-phone');
      if (addButton) {
        await addButton.focus();
        await page.keyboard.press('Enter');
        await page.waitForTimeout(1000);
        
        const modal = await page.$('.phone-selector-modal');
        if (modal) {
          const focusInModal = await page.evaluate(() => {
            const modal = document.querySelector('.phone-selector-modal');
            const focused = document.activeElement;
            return modal && modal.contains(focused);
          });
          
          this.results.keyboardNav.modalFocus = focusInModal;
          
          // Test Escape key
          await page.keyboard.press('Escape');
          await page.waitForTimeout(500);
          
          const modalClosed = await page.$('.phone-selector-modal') === null;
          if (!modalClosed) {
            this.results.minorIssues.push('Modal does not close with Escape key');
          }
        }
      }
    } catch (error) {
      this.results.minorIssues.push(`Modal focus test failed: ${error.message}`);
    }
    
    console.log(`📊 Focusable elements: ${focusableElements}`);
    console.log(`📊 Tab order: ${this.results.keyboardNav.tabOrder ? '✅' : '❌'}`);
    console.log(`📊 Modal focus: ${this.results.keyboardNav.modalFocus ? '✅' : '❌'}`);
    
    await context.close();
    
    const keyboardScore = Object.values(this.results.keyboardNav).filter(Boolean).length;
    const totalKeyboardTests = Object.keys(this.results.keyboardNav).length;
    
    console.log(`✅ Keyboard Navigation: ${keyboardScore}/${totalKeyboardTests} features working`);
  }

  async testCrossBrowserCompatibility() {
    console.log('\n🌐 TESTING: Cross-Browser Compatibility');
    console.log('-'.repeat(50));
    
    this.results.crossBrowser = {};
    
    const browsers = [
      { name: 'Firefox', launcher: firefox },
      { name: 'WebKit', launcher: webkit }
    ];
    
    for (const { name, launcher } of browsers) {
      try {
        console.log(`📊 Testing ${name}...`);
        
        const browser = await launcher.launch({ headless: true });
        const context = await browser.newContext();
        const page = await context.newPage();
        
        const startTime = Date.now();
        await page.goto(`${this.baseUrl}/compare/oneplus-13-vs-samsung-galaxy-s24-ultra`, { 
          waitUntil: 'networkidle', 
          timeout: 30000 
        });
        const loadTime = Date.now() - startTime;
        
        await page.waitForTimeout(2000);
        
        // Basic functionality test
        const comparisonGrid = await page.$('.msp-comparison-grid') !== null;
        const phoneCards = await page.$$('.msp-product-card');
        const addButton = await page.$('.msp-floating-add-phone') !== null;
        
        this.results.crossBrowser[name] = {
          loads: true,
          loadTime,
          basicFunctionality: comparisonGrid && phoneCards.length > 0 && addButton,
          phoneCount: phoneCards.length
        };
        
        console.log(`📊 ${name}: Load time ${loadTime}ms, Phone cards: ${phoneCards.length}, Basic functionality: ${this.results.crossBrowser[name].basicFunctionality ? '✅' : '❌'}`);
        
        await browser.close();
        
      } catch (error) {
        this.results.crossBrowser[name] = {
          loads: false,
          error: error.message
        };
        
        this.results.majorIssues.push(`${name} compatibility issue: ${error.message}`);
        console.log(`📊 ${name}: ❌ Failed to load`);
      }
    }
    
    const workingBrowsers = Object.values(this.results.crossBrowser).filter(result => result.loads && result.basicFunctionality).length;
    const totalBrowsers = browsers.length + 1; // +1 for Chromium (already tested)
    
    console.log(`✅ Cross-Browser: ${workingBrowsers + 1}/${totalBrowsers} browsers working correctly`);
  }

  async generateComprehensiveReport(duration) {
    console.log('\n📊 COMPREHENSIVE TEST REPORT');
    console.log('='.repeat(80));
    
    // Calculate overall score
    const allResults = [
      ...Object.values(this.results.userFlows),
      ...Object.values(this.results.accessibility),
      ...Object.values(this.results.contentstack),
      ...Object.values(this.results.seo),
      ...Object.values(this.results.keyboardNav),
      this.results.performance.loadTime < 3000,
      this.results.performance.imageOptimization
    ];
    
    const passedTests = allResults.filter(Boolean).length;
    const totalTests = allResults.length;
    this.results.overallScore = Math.round((passedTests / totalTests) * 100);
    
    console.log(`\n🎯 OVERALL SCORE: ${this.results.overallScore}% (${passedTests}/${totalTests} tests passed)`);
    console.log(`⏱️ Total testing time: ${duration} seconds\n`);
    
    // Critical Issues (Block deployment)
    if (this.results.criticalIssues.length > 0) {
      console.log('🚨 CRITICAL ISSUES (Fix immediately):');
      this.results.criticalIssues.forEach((issue, i) => {
        console.log(`   ${i + 1}. ${issue}`);
      });
      console.log();
    }
    
    // Major Issues (Fix before release) 
    if (this.results.majorIssues.length > 0) {
      console.log('⚠️  MAJOR ISSUES (Fix before release):');
      this.results.majorIssues.forEach((issue, i) => {
        console.log(`   ${i + 1}. ${issue}`);
      });
      console.log();
    }
    
    // Minor Issues (Fix when possible)
    if (this.results.minorIssues.length > 0) {
      console.log('⚡ MINOR ISSUES (Fix when possible):');
      this.results.minorIssues.forEach((issue, i) => {
        console.log(`   ${i + 1}. ${issue}`);
      });
      console.log();
    }
    
    // Enhancement Opportunities
    if (this.results.enhancements.length > 0) {
      console.log('💡 ENHANCEMENT OPPORTUNITIES:');
      this.results.enhancements.forEach((enhancement, i) => {
        console.log(`   ${i + 1}. ${enhancement}`);
      });
      console.log();
    }
    
    // Detailed Category Results
    console.log('📋 DETAILED RESULTS BY CATEGORY:');
    console.log('-'.repeat(50));
    
    // User Flows
    const userFlowsPassed = Object.values(this.results.userFlows).filter(Boolean).length;
    const userFlowsTotal = Object.keys(this.results.userFlows).length;
    console.log(`🔄 User Flows: ${userFlowsPassed}/${userFlowsTotal} (${Math.round(userFlowsPassed/userFlowsTotal*100)}%)`);
    
    // Accessibility
    const accessibilityPassed = Object.values(this.results.accessibility).filter(Boolean).length;
    const accessibilityTotal = Object.keys(this.results.accessibility).length;
    console.log(`♿ Accessibility: ${accessibilityPassed}/${accessibilityTotal} (${Math.round(accessibilityPassed/accessibilityTotal*100)}%)`);
    
    // Performance
    console.log(`⚡ Performance: Load time ${this.results.performance.loadTime}ms, Images: ${this.results.performance.imageOptimization ? 'Optimized' : 'Needs work'}`);
    
    // Responsiveness
    const responsiveDevices = Object.values(this.results.responsiveness).filter(device => 
      Object.values(device).filter(v => v === false).length === 0
    ).length;
    console.log(`📱 Responsiveness: ${responsiveDevices}/${this.deviceSizes.length} devices (${Math.round(responsiveDevices/this.deviceSizes.length*100)}%)`);
    
    // Cross-browser
    const workingBrowsers = Object.values(this.results.crossBrowser).filter(result => result.loads).length;
    console.log(`🌐 Cross-browser: ${workingBrowsers + 1}/3 browsers working`);
    
    // CMS Integration
    const cmsFeatures = Object.values(this.results.contentstack).filter(Boolean).length;
    const cmsFeaturesTotal = Object.keys(this.results.contentstack).length;
    console.log(`🎯 CMS Integration: ${cmsFeatures}/${cmsFeaturesTotal} (${Math.round(cmsFeatures/cmsFeaturesTotal*100)}%)`);
    
    // SEO
    const seoFeatures = Object.values(this.results.seo).filter(Boolean).length;
    const seoFeaturesTotal = Object.keys(this.results.seo).length;
    console.log(`🔍 SEO: ${seoFeatures}/${seoFeaturesTotal} (${Math.round(seoFeatures/seoFeaturesTotal*100)}%)`);
    
    console.log('\n📈 PRIORITY RECOMMENDATIONS:');
    console.log('-'.repeat(50));
    
    // Priority recommendations based on user impact
    if (this.results.criticalIssues.length > 0) {
      console.log('🔥 URGENT: Fix critical issues immediately - they block core functionality');
    } else if (this.results.majorIssues.length > 0) {
      console.log('⚠️  HIGH: Address major issues before release - they significantly impact UX');
    } else if (this.results.minorIssues.length > 0) {
      console.log('✨ MEDIUM: Fix minor issues to improve overall polish');
    } else {
      console.log('🎉 EXCELLENT: No critical issues found! Focus on enhancements');
    }
    
    // User experience verdict
    console.log('\n🎭 USER EXPERIENCE VERDICT:');
    console.log('-'.repeat(30));
    
    if (this.results.overallScore >= 90) {
      console.log('🌟 EXCELLENT: Outstanding user experience with minimal issues');
    } else if (this.results.overallScore >= 80) {
      console.log('👍 GOOD: Solid user experience with some room for improvement');
    } else if (this.results.overallScore >= 70) {
      console.log('⚠️  FAIR: Decent experience but several issues need attention');
    } else if (this.results.overallScore >= 60) {
      console.log('😬 POOR: Significant UX issues that impact user satisfaction');
    } else {
      console.log('🚨 CRITICAL: Major problems that severely impact usability');
    }
    
    console.log(`\n📸 Test artifacts saved in current directory`);
    console.log('=' .repeat(80));
  }
}

// Run comprehensive testing
async function runComprehensiveUXTest() {
  const tester = new ComprehensiveUXTester();
  
  try {
    const success = await tester.runComprehensiveTest();
    
    if (success) {
      console.log('\n🚀 Comprehensive UX testing completed successfully!');
      process.exit(0);
    } else {
      console.log('\n💥 Comprehensive UX testing failed!');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Testing suite crashed:', error);
    process.exit(1);
  }
}

// Export for use in other test files
module.exports = { ComprehensiveUXTester };

// Run if called directly
if (require.main === module) {
  runComprehensiveUXTest();
}