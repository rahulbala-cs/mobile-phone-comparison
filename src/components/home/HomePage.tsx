import React, { useState, useEffect, useRef } from 'react';
import { HomePageContent, transformHomePageContent, HeroPhoneShowcase, transformHeroPhoneShowcase } from '../../types/HomePageContent';
import contentstackService from '../../services/contentstackService';
import { CMSErrorBoundary } from '../shared/ErrorBoundary';
import { FALLBACK_CONFIG } from '../../config/fallbacks';
import { usePageView, useComponentPersonalization } from '../../hooks/usePersonalize';
import { useGlobalPersonalize } from '../../App';
import HeroSection from './HeroSection';
import FeaturesGrid from './FeaturesGrid';
import FeaturedComparisons from './FeaturedComparisons';
import StatsSection from './StatsSection';
import './HomePage.css';

const HomePage: React.FC = () => {
  const [homePageContent, setHomePageContent] = useState<HomePageContent | null>(null);
  const [heroShowcase, setHeroShowcase] = useState<HeroPhoneShowcase | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPersonalized, setIsPersonalized] = useState<boolean>(false);
  const [showSkeleton, setShowSkeleton] = useState<boolean>(true);
  
  // Use global personalization context
  const globalPersonalize = useGlobalPersonalize();
  
  // Loading gate to prevent multiple fetches
  const hasLoadedRef = useRef<boolean>(false);

  // Keep hooks for tracking
  const { trackComponentView } = useComponentPersonalization('HomePage');
  
  // Track page view automatically
  usePageView('/', 'Mobile Compare - Compare Smartphones Side-by-Side', {
    trackOnMount: true,
    trackOnChange: true
  });
  
  // OPTIMIZED PHASE 3: Parallel content + tracking for maximum performance
  useEffect(() => {
    const loadContentWithParallelOptimization = async () => {
      // Prevent duplicate loads
      if (hasLoadedRef.current) return;
      hasLoadedRef.current = true;
      
      try {
        // Use variants from global SDK (may be empty if SDK not ready or failed)
        const variantAliases = globalPersonalize.variants || [];
        
        // PERFORMANCE BOOST: Execute content loading and tracking in parallel
        const promises: Promise<any>[] = [
          // Primary: Content loading (critical path)
          contentstackService.getHomePageContentWithVariants(variantAliases)
        ];
        
        // Secondary: Non-blocking tracking setup (if personalized)
        if (variantAliases.length > 0 && globalPersonalize.sdk) {
          promises.push(
            // Delayed tracking to not block content rendering
            new Promise(async (resolve) => {
              try {
                await new Promise(resolve => setTimeout(resolve, 50)); // Small delay
                const experiences = globalPersonalize.sdk.getExperiences ? globalPersonalize.sdk.getExperiences() : [];
                
                // Track component view in background
                for (const experience of experiences) {
                  if (experience.shortUid) {
                    try {
                      await trackComponentView();
                      break; // Only track once
                    } catch {
                      // Fail silently - tracking is non-critical
                    }
                  }
                }
                resolve(true);
              } catch {
                resolve(false); // Fail silently
              }
            })
          );
        }
        
        // PARALLEL EXECUTION: Wait for content (critical) and let tracking happen async
        const [content] = await Promise.all(promises);
        
        // Fetch hero phone showcase data
        try {
          const showcaseData = await contentstackService.getHeroPhoneShowcase('blt111ef00d3b7d90a7');
          const heroShowcaseTransformed = await transformHeroPhoneShowcase(
            showcaseData,
            (uid: string) => contentstackService.getMobilePhoneByUID(uid)
          );
          setHeroShowcase(heroShowcaseTransformed);
        } catch (heroError) {
          console.warn('Failed to load hero phone showcase, using fallback:', heroError);
          // Hero showcase will remain null and use fallback logic
        }
        
        // Update UI immediately with content
        setHomePageContent(content);
        setIsPersonalized(variantAliases.length > 0);
        setShowSkeleton(false);
        
      } catch (error: any) {
        console.error('❌ Failed to load home page content:', error);
        setError(error.message || 'Failed to load content');
        setShowSkeleton(false);
      }
    };

    // Load content as soon as global personalize is ready (or immediately if no personalization)
    if (globalPersonalize.isReady) {
      loadContentWithParallelOptimization();
    }
  }, [globalPersonalize.isReady, globalPersonalize.variants, globalPersonalize.sdk, trackComponentView]); // eslint-disable-line react-hooks/exhaustive-deps
  // OPTIMIZED: Intentionally excluding error and isInitializing to prevent unnecessary re-fetches

  // NEUTRAL SKELETON UI - no visible "Loading" text, seamless experience
  if (showSkeleton) {
    return (
      <div className="home-page">
        {/* Neutral skeleton that doesn't announce "loading" */}
        <div className="skeleton-container" style={{
          opacity: 0.6,
          pointerEvents: 'none'
        }}>
          {/* Hero Section Skeleton */}
          <div style={{
            minHeight: '60vh',
            background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 2s infinite',
            marginBottom: '2rem'
          }}></div>
          
          {/* Features Grid Skeleton */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '1.5rem',
            padding: '2rem',
            marginBottom: '2rem'
          }}>
            {[1, 2, 3, 4].map(i => (
              <div key={i} style={{
                height: '200px',
                background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 2s infinite',
                borderRadius: '8px',
                animationDelay: `${i * 0.1}s`
              }}></div>
            ))}
          </div>
          
          {/* Stats Section Skeleton */}
          <div style={{
            height: '150px',
            background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 2s infinite',
            margin: '2rem 0'
          }}></div>
        </div>
        
        <style>{`
          @keyframes shimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
          }
        `}</style>
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
          heroShowcase={heroShowcase}
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