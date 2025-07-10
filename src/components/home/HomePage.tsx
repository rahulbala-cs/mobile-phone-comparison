import React, { useState, useEffect, useCallback, useRef } from 'react';
import { HomePageContent, transformHomePageContent } from '../../types/HomePageContent';
import contentstackService from '../../services/contentstackService';
import { onEntryChange, onLiveEdit } from '../../utils/livePreview';
import { CMSErrorBoundary } from '../shared/ErrorBoundary';
import { FALLBACK_CONFIG } from '../../config/fallbacks';
import { AppError, ErrorHandler } from '../../types/errors';
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

  // Personalization hooks
  const { getVariantParam, isReady: isPersonalizeReady } = usePersonalize();
  const { trackComponentView } = useComponentPersonalization('HomePage');
  
  // Use refs to store stable references and prevent re-renders
  const personalizationRef = useRef({ getVariantParam, isPersonalizeReady, trackComponentView });
  const fetchingRef = useRef(false); // Prevent multiple simultaneous fetches
  
  // Update refs when personalization changes (but don't trigger re-renders)
  personalizationRef.current = { getVariantParam, isPersonalizeReady, trackComponentView };
  
  // Track page view automatically
  usePageView('/', 'Mobile Compare - Compare Smartphones Side-by-Side', {
    trackOnMount: true,
    trackOnChange: true
  });

  // Fetch home page content from Contentstack with personalization support
  // Remove problematic dependencies to prevent infinite loop
  const fetchHomePageContent = useCallback(async () => {
    // Prevent multiple simultaneous API calls
    if (fetchingRef.current) {
      console.log('🔄 Home page content fetch already in progress, skipping...');
      return;
    }
    
    try {
      fetchingRef.current = true;
      setLoading(true);
      setError(null);
      
      // Get variant parameter for personalization from stable ref
      const { getVariantParam: getVariant, isPersonalizeReady: isReady, trackComponentView: trackView } = personalizationRef.current;
      const variantParam = getVariant();
      
      const content = await contentstackService.getHomePageContent(variantParam || undefined);
      setHomePageContent(content);
      
      console.log('🏠 Home Page content loaded from CMS:', content);
      
      // Track component view with personalization info (using stable ref)
      if (isReady) {
        await trackView();
      }
      
    } catch (err: any) {
      // Handle specific error types
      if (err instanceof AppError) {
        ErrorHandler.log(err);
        const userMessage = ErrorHandler.getUserMessage(err);
        setError(userMessage);
      } else {
        console.error('❌ Error loading Home Page content:', err);
        setError(err.message || 'Failed to load home page content');
      }
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, []); // Remove all dependencies that were causing the infinite loop

  // Initial data fetch
  useEffect(() => {
    fetchHomePageContent();
  }, [fetchHomePageContent]);

  // Set up Live Preview and Visual Builder for real-time updates
  // Use a stable reference to prevent re-registration on every render
  const stableFetchRef = useRef(fetchHomePageContent);
  stableFetchRef.current = fetchHomePageContent;
  
  useEffect(() => {
    // Create a stable wrapper function to prevent Live Preview listener churn
    const handleContentUpdate = () => {
      stableFetchRef.current();
    };
    
    // The onEntryChange and onLiveEdit functions may not return unsubscribe functions
    // They are event listeners that are handled internally by the Live Preview SDK
    onEntryChange(handleContentUpdate); // For Live Preview
    onLiveEdit(handleContentUpdate);    // For Visual Builder
    
    // No explicit cleanup needed as these are handled by the SDK
  }, []); // Remove fetchHomePageContent dependency to prevent re-registration

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
          <p style={{ color: '#64748b', fontSize: '1.125rem' }}>{FALLBACK_CONFIG.LOADING.HOME_PAGE_CONTENT}</p>
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
          <h2 style={{ color: '#dc2626', marginBottom: '1rem' }}>{FALLBACK_CONFIG.ERRORS.LOADING_FAILED}</h2>
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