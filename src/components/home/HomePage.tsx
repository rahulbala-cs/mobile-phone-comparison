import React, { useState, useEffect, useRef } from 'react';
import { HomePageContent, transformHomePageContent } from '../../types/HomePageContent';
import contentstackService from '../../services/contentstackService';
import { CMSErrorBoundary } from '../shared/ErrorBoundary';
import { FALLBACK_CONFIG } from '../../config/fallbacks';
import { usePageView, useComponentPersonalization } from '../../hooks/usePersonalize';
import Personalize from '@contentstack/personalize-edge-sdk';
import HeroSection from './HeroSection';
import FeaturesGrid from './FeaturesGrid';
import FeaturedComparisons from './FeaturedComparisons';
import StatsSection from './StatsSection';
import './HomePage.css';

const HomePage: React.FC = () => {
  const [homePageContent, setHomePageContent] = useState<HomePageContent | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isPersonalized, setIsPersonalized] = useState<boolean>(false);
  
  // Official SDK pattern - simple state management
  const [personalizeSdk, setPersonalizeSdk] = useState<any>(null);
  const [sdkInitialized, setSdkInitialized] = useState<boolean>(false);
  
  // Add loading gate to prevent multiple simultaneous fetches
  const isLoadingRef = useRef<boolean>(false);
  const hasLoadedRef = useRef<boolean>(false);

  // Keep hooks for tracking (they work fine)
  const { trackComponentView } = useComponentPersonalization('HomePage');
  
  // Track page view automatically
  usePageView('/', 'Mobile Compare - Compare Smartphones Side-by-Side', {
    trackOnMount: true,
    trackOnChange: true
  });
  
  // OFFICIAL PATTERN: Initialize SDK following documentation
  useEffect(() => {
    async function initializePersonalize() {
      try {
        const projectUid = process.env.REACT_APP_CONTENTSTACK_PERSONALIZE_PROJECT_UID;
        if (!projectUid) {
          setSdkInitialized(true); // Mark as "done" even if no SDK
          return;
        }
        
        // Set Edge API URL if configured
        const edgeApiUrl = process.env.REACT_APP_CONTENTSTACK_PERSONALIZE_EDGE_API_URL;
        if (edgeApiUrl) {
          Personalize.setEdgeApiUrl(edgeApiUrl);
        }
        
        if (process.env.NODE_ENV === 'development') {
          console.log('🚀 OFFICIAL: Initializing Personalize SDK...');
        }
        
        // Official SDK initialization pattern
        const sdk = await Personalize.init(projectUid);
        setPersonalizeSdk(sdk);
        
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ OFFICIAL: SDK initialized successfully');
        }
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('⚠️ OFFICIAL: SDK initialization failed:', error);
        }
      } finally {
        setSdkInitialized(true);
      }
    }
    
    initializePersonalize();
  }, []);
  
  // FIXED APPROACH: Load content once with personalization, prevent infinite loop
  useEffect(() => {
    const loadContentWithPersonalization = async () => {
      // LOADING GATE: Prevent multiple simultaneous fetches
      if (isLoadingRef.current || hasLoadedRef.current) {
        if (process.env.NODE_ENV === 'development') {
          console.log('🚫 GATE: Skipping duplicate content load attempt');
        }
        return;
      }
      
      isLoadingRef.current = true;
      
      try {
        if (process.env.NODE_ENV === 'development') {
          console.log('🚀 FIXED: Loading content with personalization from start...');
        }
        
        let variantAliases: string[] = [];
        let attempts = 0;
        const maxAttempts = 10; // Wait up to 1 second for SDK
        
        // Brief wait for SDK to be available (if enabled)
        if (process.env.REACT_APP_CONTENTSTACK_PERSONALIZE_PROJECT_UID) {
          while (attempts < maxAttempts && !personalizeSdk && sdkInitialized) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
          }
          
          // If SDK is available, get personalization data
          if (personalizeSdk) {
            try {
              // CORS HANDLING: Try setting user attributes but don't block on failure
              try {
                await personalizeSdk.set({
                  device: 'desktop',
                  location: 'unknown',
                  sessionStart: new Date().toISOString(),
                  pageType: 'homepage'
                });
                
                // Brief wait for attribute propagation
                await new Promise(resolve => setTimeout(resolve, 100));
              } catch (corsError: any) {
                if (process.env.NODE_ENV === 'development') {
                  console.warn('⚠️ CORS: User attribute setting failed (non-blocking):', corsError?.message);
                }
                // Continue without user attributes - personalization may still work
              }
              
              // Get variant aliases (this doesn't require user attributes)
              variantAliases = personalizeSdk.getVariantAliases ? personalizeSdk.getVariantAliases() : [];
              
              if (process.env.NODE_ENV === 'development') {
                console.log('📊 FIXED: Using personalization variants:', variantAliases);
              }
            } catch (error) {
              if (process.env.NODE_ENV === 'development') {
                console.warn('⚠️ FIXED: Personalization setup failed, using default:', error);
              }
            }
          }
        }
        
        // Load content with variants (or empty array for default)
        const content = await contentstackService.getHomePageContentWithVariants(variantAliases);
        setHomePageContent(content);
        setIsPersonalized(variantAliases.length > 0);
        setLoading(false);
        hasLoadedRef.current = true;
        
        // Track impressions if personalized (do this after content is loaded)
        if (variantAliases.length > 0 && personalizeSdk) {
          // Use setTimeout to avoid blocking content display
          setTimeout(async () => {
            try {
              const experiences = personalizeSdk.getExperiences ? personalizeSdk.getExperiences() : [];
              for (const experience of experiences) {
                if (experience.shortUid) {
                  try {
                    await trackComponentView();
                  } catch {
                    // Fail silently - tracking is non-critical
                  }
                }
              }
            } catch {
              // Fail silently - tracking is non-critical
            }
          }, 100);
        }
        
        if (process.env.NODE_ENV === 'development') {
          const status = variantAliases.length > 0 ? 'personalized' : 'default';
          console.log(`✅ FIXED: Content loaded (${status}) - no content switching!`);
        }
        
      } catch (error: any) {
        console.error('❌ Failed to load content:', error);
        setError(error.message || 'Failed to load content');
        setLoading(false);
        hasLoadedRef.current = true;
      } finally {
        isLoadingRef.current = false;
      }
    };
    
    // FIXED: Only depend on sdkInitialized to prevent infinite loop
    if (sdkInitialized && !hasLoadedRef.current) {
      loadContentWithPersonalization();
    }
  }, [sdkInitialized]); // eslint-disable-line react-hooks/exhaustive-deps
  // FIXED: Intentionally excluding personalizeSdk and trackComponentView to prevent infinite loop

  // Loading state - should be minimal since we load default content first
  if (loading) {
    return (
      <div className="home-page">
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '20vh',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          <div style={{
            width: '24px',
            height: '24px',
            border: '2px solid #e2e8f0',
            borderTop: '2px solid #667eea',
            borderRadius: '50%',
            animation: 'spin 0.6s linear infinite'
          }}></div>
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
            Loading...
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="home-page">
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '30vh',
          flexDirection: 'column',
          gap: '1rem',
          textAlign: 'center',
          padding: '2rem'
        }}>
          <h2 style={{ color: '#dc2626', marginBottom: '1rem' }}>
            {FALLBACK_CONFIG.ERRORS.LOADING_FAILED}
          </h2>
          <p style={{ color: '#64748b', marginBottom: '2rem' }}>{error}</p>
          <button 
            onClick={() => window.location.reload()}
            style={{
              background: '#667eea',
              color: 'white',
              border: 'none',
              padding: '0.75rem 2rem',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '1rem'
            }}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Content not found
  if (!homePageContent) {
    return (
      <div className="home-page">
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '30vh',
          flexDirection: 'column',
          gap: '1rem',
          textAlign: 'center'
        }}>
          <h2 style={{ color: '#64748b' }}>No Content Available</h2>
          <p style={{ color: '#64748b' }}>{FALLBACK_CONFIG.ERRORS.CONTENT_NOT_FOUND}</p>
        </div>
      </div>
    );
  }

  // Transform flat CMS data into structured format
  const { heroStats, features, comparisons, stats } = transformHomePageContent(homePageContent);

  return (
    <div className="home-page">
      {/* Development indicator for personalization status */}
      {process.env.NODE_ENV === 'development' && isPersonalized && (
        <div style={{
          position: 'fixed',
          top: '10px',
          right: '10px',
          background: '#10b981',
          color: 'white',
          padding: '4px 8px',
          borderRadius: '4px',
          fontSize: '12px',
          zIndex: 9999,
          fontFamily: 'monospace'
        }}>
          🎯 Personalized
        </div>
      )}
      
      <CMSErrorBoundary onRetry={() => window.location.reload()}>
        <HeroSection 
          content={homePageContent}
          heroStats={heroStats}
        />
      </CMSErrorBoundary>
      
      <CMSErrorBoundary onRetry={() => window.location.reload()}>
        <FeaturesGrid 
          content={homePageContent}
          features={features}
        />
      </CMSErrorBoundary>
      
      <CMSErrorBoundary onRetry={() => window.location.reload()}>
        <FeaturedComparisons 
          content={homePageContent}
          comparisons={comparisons}
        />
      </CMSErrorBoundary>
      
      <CMSErrorBoundary onRetry={() => window.location.reload()}>
        <StatsSection 
          content={homePageContent}
          stats={stats}
        />
      </CMSErrorBoundary>
    </div>
  );
};

export default HomePage;