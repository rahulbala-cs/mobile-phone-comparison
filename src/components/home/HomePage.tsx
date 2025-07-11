import React, { useState, useEffect, useCallback } from 'react';
import { HomePageContent, transformHomePageContent } from '../../types/HomePageContent';
import contentstackService from '../../services/contentstackService';
import { onEntryChange, onLiveEdit } from '../../utils/livePreview';
import { CMSErrorBoundary } from '../shared/ErrorBoundary';
import { FALLBACK_CONFIG } from '../../config/fallbacks';
import { usePersonalize, usePageView, useComponentPersonalization } from '../../hooks/usePersonalize';
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

  // Personalization hooks - using official CSR pattern
  const { 
    getExperiences, 
    getVariantAliases, 
    isReady: isPersonalizeReady,
    setUserAttributes 
  } = usePersonalize();
  const { trackComponentView } = useComponentPersonalization('HomePage');
  
  // Track page view automatically
  usePageView('/', 'Mobile Compare - Compare Smartphones Side-by-Side', {
    trackOnMount: true,
    trackOnChange: true
  });

  // OFFICIAL CSR PATTERN: Clean content loading with personalization
  const fetchHomePageContent = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🚀 Loading HomePage content...');

      let variantAliases: string[] = [];
      let experiences: any[] = [];

      // STEP 1: Check if personalization is ready and get variants
      if (isPersonalizeReady) {
        console.log('🎯 Personalization SDK ready - fetching variants...');
        
        // Set user attributes for targeting (official CSR pattern)
        try {
          await setUserAttributes({
            device: 'desktop',
            location: 'unknown',
            sessionStart: new Date().toISOString(),
            pageType: 'homepage'
          });
          console.log('✅ User attributes set successfully');
        } catch (attrError) {
          console.warn('⚠️ Failed to set user attributes:', attrError);
        }

        // Get experiences and variant aliases (official pattern)
        try {
          experiences = getExperiences();
          variantAliases = getVariantAliases();
          
          console.log('📊 Personalization data:', {
            experienceCount: experiences.length,
            variantAliasCount: variantAliases.length,
            variantAliases
          });

          // Track impressions for active experiences
          if (experiences.length > 0) {
            for (const experience of experiences) {
              if (experience.shortUid) {
                try {
                  await trackComponentView();
                  console.log(`✅ Tracked impression for experience: ${experience.shortUid}`);
                } catch (impressionError) {
                  console.warn('⚠️ Failed to track impression:', impressionError);
                }
              }
            }
          }
        } catch (personalizeError) {
          console.warn('⚠️ Error getting personalization data:', personalizeError);
          variantAliases = []; // Fallback to default content
        }
      } else {
        console.log('⏳ Personalization SDK not ready - loading default content');
      }

      // STEP 2: Fetch content with variant aliases (official pattern)
      console.log('📄 Fetching content with variant aliases:', variantAliases);
      const content = await contentstackService.getHomePageContentWithVariants(variantAliases);
      
      // STEP 3: Update state
      setHomePageContent(content);
      setIsPersonalized(variantAliases.length > 0);
      setLoading(false);
      
      const personalizedStatus = variantAliases.length > 0 ? 'personalized' : 'default';
      console.log(`✅ HomePage content loaded (${personalizedStatus})`, {
        content,
        variantAliases,
        experienceCount: experiences.length,
        isPersonalized: variantAliases.length > 0
      });
      
    } catch (err: any) {
      console.error('❌ Error loading HomePage content:', err);
      setError(err.message || 'Failed to load home page content');
      setLoading(false);
    }
  }, [isPersonalizeReady, getExperiences, getVariantAliases, setUserAttributes, trackComponentView]);

  // Load content when component mounts or when personalization becomes ready
  useEffect(() => {
    fetchHomePageContent();
  }, [fetchHomePageContent]);

  // Set up Live Preview for real-time updates
  useEffect(() => {
    const handleContentUpdate = () => {
      console.log('🔄 Live Preview update detected - reloading content...');
      fetchHomePageContent();
    };
    
    onEntryChange(handleContentUpdate);
    onLiveEdit(handleContentUpdate);
  }, [fetchHomePageContent]);

  // Loading state
  if (loading) {
    return (
      <div className="home-page">
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '50vh',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            border: '4px solid #e2e8f0',
            borderTop: '4px solid #667eea',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          <p style={{ color: '#64748b', fontSize: '1.125rem' }}>
            {FALLBACK_CONFIG.LOADING.HOME_PAGE_CONTENT}
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
          minHeight: '50vh',
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
            onClick={fetchHomePageContent}
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
          minHeight: '50vh',
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
      
      <CMSErrorBoundary onRetry={fetchHomePageContent}>
        <HeroSection 
          content={homePageContent}
          heroStats={heroStats}
        />
      </CMSErrorBoundary>
      
      <CMSErrorBoundary onRetry={fetchHomePageContent}>
        <FeaturesGrid 
          content={homePageContent}
          features={features}
        />
      </CMSErrorBoundary>
      
      <CMSErrorBoundary onRetry={fetchHomePageContent}>
        <FeaturedComparisons 
          content={homePageContent}
          comparisons={comparisons}
        />
      </CMSErrorBoundary>
      
      <CMSErrorBoundary onRetry={fetchHomePageContent}>
        <StatsSection 
          content={homePageContent}
          stats={stats}
        />
      </CMSErrorBoundary>
    </div>
  );
};

export default HomePage;