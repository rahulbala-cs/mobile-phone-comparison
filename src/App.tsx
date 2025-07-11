import React, { useEffect, useState, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import HeaderNavigation from './components/HeaderNavigation';
import HomePage from './components/home/HomePage';
import CompareHub from './components/compare/CompareHub';
import MobilePhoneList from './components/MobilePhoneList';
import MobilePhoneDetail from './components/MobilePhoneDetail';
import MobilePhoneComparison from './components/MobilePhoneComparison';
import VisualBuilderTest from './components/VisualBuilderTest';
import ErrorBoundary, { LivePreviewErrorBoundary } from './components/shared/ErrorBoundary';
import { DefaultPersonalizeProvider } from './contexts/PersonalizeContext';
import { FALLBACK_CONFIG } from './config/fallbacks';
import { isPersonalizationEnabled, logPersonalizeEvent } from './utils/personalizeUtils';
import Personalize from '@contentstack/personalize-edge-sdk';
import './App.css';
import './components/shared/ErrorBoundary.css';

// Global Personalize Ready Context - Suspense-like behavior for personalization
interface GlobalPersonalizeState {
  sdk: any | null;
  isReady: boolean;
  isInitializing: boolean;
  variants: string[];
  error: string | null;
}

const GlobalPersonalizeContext = createContext<GlobalPersonalizeState>({
  sdk: null,
  isReady: false,
  isInitializing: true,
  variants: [],
  error: null
});

export const useGlobalPersonalize = () => useContext(GlobalPersonalizeContext);

// Global Personalize Provider - initializes SDK once for entire app
const GlobalPersonalizeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<GlobalPersonalizeState>({
    sdk: null,
    isReady: false,
    isInitializing: true,
    variants: [],
    error: null
  });

  useEffect(() => {
    let mounted = true;
    
    const initializeGlobalSDK = async () => {
      try {
        const projectUid = process.env.REACT_APP_CONTENTSTACK_PERSONALIZE_PROJECT_UID;
        
        if (!projectUid) {
          if (mounted) {
            setState(prev => ({ ...prev, isReady: true, isInitializing: false }));
          }
          return;
        }

        // PHASE 4: Check cache for previous variants to reduce flicker
        const cacheKey = `personalize_variants_${projectUid}`;
        const cachedVariants = sessionStorage.getItem(cacheKey);
        let initialVariants: string[] = [];
        
        if (cachedVariants) {
          try {
            const parsed = JSON.parse(cachedVariants);
            if (Array.isArray(parsed.variants) && Date.now() - parsed.timestamp < 300000) { // 5 min cache
              initialVariants = parsed.variants;
            }
          } catch {
            sessionStorage.removeItem(cacheKey); // Clean invalid cache
          }
        }

        // Set Edge API URL if configured
        const edgeApiUrl = process.env.REACT_APP_CONTENTSTACK_PERSONALIZE_EDGE_API_URL;
        if (edgeApiUrl) {
          Personalize.setEdgeApiUrl(edgeApiUrl);
        }

        // Initialize SDK
        const sdk = await Personalize.init(projectUid);
        
        if (!mounted) return;

        if (sdk) {
          // Use cached variants immediately, then update with fresh variants
          if (initialVariants.length > 0 && mounted) {
            setState(prev => ({
              ...prev,
              sdk,
              isReady: true,
              isInitializing: false,
              variants: initialVariants,
              error: null
            }));
          }

          // Get fresh variant aliases (may be empty initially)
          let freshVariants: string[] = [];
          try {
            // Set basic user attributes for immediate personalization
            await sdk.set({
              device: 'desktop',
              location: 'unknown',
              sessionStart: new Date().toISOString(),
              timestamp: Date.now()
            });

            // Small wait for attribute propagation
            await new Promise(resolve => setTimeout(resolve, 100));
            
            freshVariants = sdk.getVariantAliases ? sdk.getVariantAliases() : [];
            
            // Cache fresh variants for next session
            if (freshVariants.length > 0) {
              sessionStorage.setItem(cacheKey, JSON.stringify({
                variants: freshVariants,
                timestamp: Date.now()
              }));
            }
          } catch (attrError) {
            // CORS errors are non-blocking - fail silently
          }

          // Update with fresh variants (even if same as cached)
          if (mounted) {
            setState({
              sdk,
              isReady: true,
              isInitializing: false,
              variants: freshVariants,
              error: null
            });
          }
        } else {
          setState(prev => ({ ...prev, isReady: true, isInitializing: false, error: 'SDK initialization returned null' }));
        }

      } catch (error: any) {
        if (mounted) {
          setState(prev => ({ 
            ...prev, 
            isReady: true, 
            isInitializing: false, 
            error: error?.message || 'SDK initialization failed' 
          }));
        }
      }
    };

    initializeGlobalSDK();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <GlobalPersonalizeContext.Provider value={state}>
      {children}
    </GlobalPersonalizeContext.Provider>
  );
};

function App() {
  // Log personalization status on app load (development only)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const personalizationEnabled = isPersonalizationEnabled();
      logPersonalizeEvent('APP_INITIALIZATION', {
        personalizationEnabled,
        timestamp: new Date().toISOString(),
      });
    }
  }, []);

  return (
    <ErrorBoundary>
      {/* Global Personalize Provider - initializes SDK once for entire app */}
      <GlobalPersonalizeProvider>
        <DefaultPersonalizeProvider>
          <HelmetProvider>
            <Router>
              <div className="App">
                <ErrorBoundary fallback={
                  <div style={{ padding: '1rem', textAlign: 'center' }}>
                    <p>{FALLBACK_CONFIG.ERRORS.NAVIGATION_UNAVAILABLE}</p>
                  </div>
                }>
                  <HeaderNavigation />
                </ErrorBoundary>
                
                <main>
                  <LivePreviewErrorBoundary>
                    <Routes>
                  {/* New Home Page - Hero landing with value proposition */}
                  <Route path="/" element={
                    <ErrorBoundary>
                      <HomePage />
                    </ErrorBoundary>
                  } />
                  
                  {/* Browse all mobile phones - moved from home */}
                  <Route path="/browse" element={
                    <ErrorBoundary>
                      <MobilePhoneList />
                    </ErrorBoundary>
                  } />
                  
                  {/* Compare hub - category selection */}
                  <Route path="/compare" element={
                    <ErrorBoundary>
                      <CompareHub />
                    </ErrorBoundary>
                  } />
                  
                  {/* Mobile phone comparison page */}
                  <Route path="/compare/:phones" element={
                    <ErrorBoundary>
                      <MobilePhoneComparison />
                    </ErrorBoundary>
                  } />
                  
                  {/* Visual Builder Test Page */}
                  <Route path="/visual-builder-test" element={
                    <ErrorBoundary>
                      <VisualBuilderTest />
                    </ErrorBoundary>
                  } />
                  
                  {/* Individual mobile phone detail page using content URL field */}
                  <Route path="*" element={
                    <ErrorBoundary>
                      <MobilePhoneDetail />
                    </ErrorBoundary>
                  } />
                  </Routes>
                </LivePreviewErrorBoundary>
              </main>
            </div>
          </Router>
        </HelmetProvider>
      </DefaultPersonalizeProvider>
    </GlobalPersonalizeProvider>
  </ErrorBoundary>
  );
}

export default App;