import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  const [isPersonalized, setIsPersonalized] = useState<boolean>(false); // Track if showing personalized content

  // Personalization hooks - using correct methods from official docs
  const { 
    getExperiences, 
    getVariantAliases, 
    isReady: isPersonalizeReady,
    setUserAttributes 
  } = usePersonalize();
  const { trackComponentView } = useComponentPersonalization('HomePage');
  
  // Use refs to store stable references and prevent re-renders
  const personalizationRef = useRef({ 
    getExperiences, 
    getVariantAliases, 
    isPersonalizeReady, 
    trackComponentView,
    setUserAttributes 
  });
  const fetchingRef = useRef(false); // Prevent multiple simultaneous fetches
  const userAttributesSet = useRef(false); // Track if user attributes have been set
  const defaultContentLoaded = useRef(false); // Track if default content has been loaded
  const personalizedContentRequested = useRef(false); // Track if personalized content has been requested
  
  // Update refs when personalization changes (but don't trigger re-renders)
  personalizationRef.current = { 
    getExperiences, 
    getVariantAliases, 
    isPersonalizeReady, 
    trackComponentView,
    setUserAttributes 
  };
  
  // Track page view automatically
  usePageView('/', 'Mobile Compare - Compare Smartphones Side-by-Side', {
    trackOnMount: true,
    trackOnChange: true
  });

  // Upgrade to personalized content when SDK is ready
  const upgradeToPersonalizedContent = useCallback(async () => {
    // Only upgrade if we haven't already requested personalized content
    if (personalizedContentRequested.current || fetchingRef.current) {
      console.log('🔄 Personalized content upgrade already in progress, skipping...');
      console.log('📊 Upgrade block state:', {
        personalizedRequested: personalizedContentRequested.current,
        fetchingInProgress: fetchingRef.current,
        isPersonalized: isPersonalized
      });
      return;
    }
    
    // Skip if already showing personalized content
    if (isPersonalized) {
      console.log('✅ Already showing personalized content, skipping upgrade');
      return;
    }
    
    try {
      fetchingRef.current = true;
      personalizedContentRequested.current = true;
      console.log('🎯 Upgrading to personalized content...');
      // Don't show loading state for upgrade - keep showing current content
      
      // Get personalization methods from stable ref
      const { 
        getExperiences, 
        getVariantAliases, 
        isPersonalizeReady: isReady, 
        trackComponentView: trackView,
        setUserAttributes 
      } = personalizationRef.current;
      
      // Ensure SDK is actually ready
      if (!isReady) {
        console.log('⚠️ SDK not ready during upgrade attempt, skipping...');
        return;
      }
      
      // STEP 1: Set user attributes if not already set (CSR pattern)
      if (!userAttributesSet.current) {
        try {
          await setUserAttributes({
            // Set basic demographic attributes for audience targeting
            device: 'desktop', // Could be dynamic based on user agent
            location: 'unknown', // Could be from geolocation API
            sessionStart: new Date().toISOString(),
            pageType: 'homepage'
          });
          userAttributesSet.current = true;
          console.log('🎯 User attributes set for personalization upgrade');
        } catch (attrError) {
          console.warn('⚠️ Failed to set user attributes:', attrError);
        }
      }
      
      // STEP 2: Get active experiences and variant aliases (OFFICIAL PATTERN)
      let variantAliases: string[] = [];
      let experiences: any[] = [];
      
      try {
        experiences = getExperiences();
        variantAliases = getVariantAliases();
        
        console.log('🎯 Upgrade - Active experiences:', experiences);
        console.log('🎯 Upgrade - Variant aliases:', variantAliases);
        
        // Only upgrade if we actually have variant aliases (personalization available)
        if (variantAliases.length === 0) {
          console.log('ℹ️ No personalization available, keeping default content');
          return;
        }
        
        console.log('📊 Personalization Upgrade State:', {
          sdkReady: isReady,
          experienceCount: experiences.length,
          variantAliasCount: variantAliases.length,
          variantAliases
        });
        
        // Track impressions for active experiences
        if (experiences.length > 0) {
          for (const experience of experiences) {
            if (experience.shortUid) {
              try {
                await trackView(); // Track impression for this experience
                console.log(`✅ Tracked impression for experience: ${experience.shortUid}`);
              } catch (impressionError) {
                console.warn('⚠️ Failed to track impression:', impressionError);
              }
            }
          }
        }
      } catch (personalizeError) {
        console.warn('⚠️ Personalization upgrade error:', personalizeError);
        return; // Keep default content on error
      }
      
      // STEP 3: Fetch personalized content with variant aliases
      console.log('🎯 Fetching personalized content with variant aliases:', variantAliases);
      const personalizedContent = await contentstackService.getHomePageContentWithVariants(variantAliases);
      
      // Smoothly upgrade to personalized content
      setHomePageContent(personalizedContent);
      setIsPersonalized(true);
      
      console.log('✨ Content upgraded to personalized version successfully!', {
        personalizedContent,
        variantAliases,
        isPersonalized: true
      });
      
    } catch (err: any) {
      console.error('❌ Error upgrading to personalized content:', err);
      // Keep showing default content on error - don't break the user experience
    } finally {
      fetchingRef.current = false;
    }
  }, [isPersonalized]);

  // Smart content loading with SDK state prediction
  const fetchContentWithSmartPersonalization = useCallback(async () => {
    if (fetchingRef.current) {
      return;
    }

    try {
      fetchingRef.current = true;
      const startTime = Date.now();
      console.log('🚀 Smart loading: Starting optimized content fetch...');
      console.log('📊 Initial state:', {
        sdkReady: isPersonalizeReady,
        hasContent: !!homePageContent,
        isPersonalized: isPersonalized,
        personalizedRequested: personalizedContentRequested.current,
        defaultLoaded: defaultContentLoaded.current,
        timestamp: new Date().toISOString()
      });
      
      // Check if SDK is already ready (fast path)
      if (isPersonalizeReady) {
        console.log('⚡ SDK ready immediately - fetching personalized content...');
        await upgradeToPersonalizedContent();
        return;
      }
      
      // SDK not ready yet - start both processes in parallel
      console.log('🔄 SDK initializing - starting parallel fetch strategy...');
      
      // Start with default content for immediate display
      const defaultContentPromise = contentstackService.getHomePageContentWithVariants([]);
      
      // Wait for SDK with optimized timing (up to 1000ms for better capture)
      const sdkReadyPromise = new Promise<boolean>((resolve) => {
        if (isPersonalizeReady) {
          console.log('🎯 SDK already ready - using personalized content immediately');
          resolve(true);
          return;
        }
        
        // Check SDK state every 25ms for up to 1000ms (40 attempts)
        let attempts = 0;
        const maxAttempts = 40; // 1000ms total
        
        const checkSdk = () => {
          attempts++;
          console.log(`🔍 SDK check ${attempts}/${maxAttempts}: Ready=${isPersonalizeReady}`);
          
          if (isPersonalizeReady) {
            console.log('✅ SDK became ready during polling - using personalized content');
            resolve(true);
            return;
          }
          
          if (attempts >= maxAttempts) {
            console.log('⏰ SDK timeout reached - proceeding with default content');
            resolve(false);
            return;
          }
          
          // Use exponential backoff for efficiency: start fast, slow down
          const delay = attempts < 20 ? 25 : 50; // Fast polling first 500ms, then slower
          setTimeout(checkSdk, delay);
        };
        
        checkSdk();
      });
      
      // Race between default content and SDK ready state
      const [defaultContent, sdkReady] = await Promise.all([
        defaultContentPromise,
        sdkReadyPromise
      ]);
      
      if (sdkReady && !personalizedContentRequested.current) {
        console.log('🎯 SDK became ready during fetch - getting personalized content...');
        // SDK became ready while we were fetching - get personalized version
        personalizedContentRequested.current = true;
        
        // Get personalization data
        const { getExperiences, getVariantAliases, setUserAttributes } = personalizationRef.current;
        
        // Set user attributes quickly
        if (!userAttributesSet.current) {
          try {
            await setUserAttributes({
              device: 'desktop',
              location: 'unknown',
              sessionStart: new Date().toISOString(),
              pageType: 'homepage'
            });
            userAttributesSet.current = true;
          } catch (attrError) {
            console.warn('⚠️ Failed to set user attributes:', attrError);
          }
        }
        
        // Get variant aliases
        getExperiences(); // Track experiences for analytics
        const variantAliases = getVariantAliases();
        
        if (variantAliases.length > 0) {
          console.log('🎯 Fetching personalized content with aliases:', variantAliases);
          const personalizedContent = await contentstackService.getHomePageContentWithVariants(variantAliases);
          setHomePageContent(personalizedContent);
          setIsPersonalized(true);
          console.log('✨ Personalized content loaded directly!');
        } else {
          console.log('ℹ️ No personalization available - using default content');
          setHomePageContent(defaultContent);
          setIsPersonalized(false);
        }
      } else {
        console.log('⚡ Using default content - SDK not ready within timeout');
        setHomePageContent(defaultContent);
        setIsPersonalized(false);
        defaultContentLoaded.current = true;
        // Reset personalized content request flag to allow fallback upgrade
        personalizedContentRequested.current = false;
        console.log('🔄 Reset personalized content flag to allow fallback upgrade');
      }
      
      setLoading(false);
      const endTime = Date.now();
      console.log(`⏱️ Smart loading completed in ${endTime - startTime}ms`);
      
    } catch (err: any) {
      console.error('❌ Error in smart content loading:', err);
      setError(err.message || 'Failed to load content');
      setLoading(false);
    } finally {
      fetchingRef.current = false;
    }
  }, [isPersonalizeReady, upgradeToPersonalizedContent, isPersonalized]);

  // Smart loading strategy: Optimal personalization timing
  useEffect(() => {
    // Start smart content loading immediately
    fetchContentWithSmartPersonalization();
  }, [fetchContentWithSmartPersonalization]);
  
  // Fallback upgrade if SDK becomes ready after initial load
  useEffect(() => {
    // Trigger upgrade if SDK becomes ready and we're showing default content
    if (isPersonalizeReady && !personalizedContentRequested.current && homePageContent) {
      console.log('🎯 SDK ready after initial load - upgrading to personalized content...');
      console.log('📊 Fallback upgrade state:', {
        sdkReady: isPersonalizeReady,
        hasContent: !!homePageContent,
        isPersonalized: isPersonalized,
        personalizedRequested: personalizedContentRequested.current,
        defaultLoaded: defaultContentLoaded.current
      });
      upgradeToPersonalizedContent();
    }
  }, [isPersonalizeReady, upgradeToPersonalizedContent, homePageContent, isPersonalized]);

  // Set up Live Preview and Visual Builder for real-time updates
  useEffect(() => {
    // Create stable wrapper functions for live preview
    const handleContentUpdate = () => {
      // Reset state and re-fetch content on live preview changes
      defaultContentLoaded.current = false;
      personalizedContentRequested.current = false;
      userAttributesSet.current = false;
      setLoading(true);
      
      // Start fresh content loading cycle with smart personalization
      fetchContentWithSmartPersonalization();
    };
    
    // The onEntryChange and onLiveEdit functions may not return unsubscribe functions
    // They are event listeners that are handled internally by the Live Preview SDK
    onEntryChange(handleContentUpdate); // For Live Preview
    onLiveEdit(handleContentUpdate);    // For Visual Builder
    
    // No explicit cleanup needed as these are handled by the SDK
  }, [fetchContentWithSmartPersonalization]);

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
            onClick={() => {
              // Reset state and retry
              setError(null);
              setLoading(true);
              defaultContentLoaded.current = false;
              personalizedContentRequested.current = false;
              userAttributesSet.current = false;
              fetchContentWithSmartPersonalization();
            }}
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
      
      <CMSErrorBoundary onRetry={() => {
        // Reset state and retry content loading
        defaultContentLoaded.current = false;
        personalizedContentRequested.current = false;
        userAttributesSet.current = false;
        setLoading(true);
        fetchContentWithSmartPersonalization();
      }}>
        <HeroSection 
          content={homePageContent}
          heroStats={heroStats}
        />
      </CMSErrorBoundary>
      
      <CMSErrorBoundary onRetry={() => {
        // Reset state and retry content loading
        defaultContentLoaded.current = false;
        personalizedContentRequested.current = false;
        userAttributesSet.current = false;
        setLoading(true);
        fetchContentWithSmartPersonalization();
      }}>
        <FeaturesGrid 
          content={homePageContent}
          features={features}
        />
      </CMSErrorBoundary>
      
      <CMSErrorBoundary onRetry={() => {
        // Reset state and retry content loading
        defaultContentLoaded.current = false;
        personalizedContentRequested.current = false;
        userAttributesSet.current = false;
        setLoading(true);
        fetchContentWithSmartPersonalization();
      }}>
        <FeaturedComparisons 
          content={homePageContent}
          comparisons={comparisons}
        />
      </CMSErrorBoundary>
      
      <CMSErrorBoundary onRetry={() => {
        // Reset state and retry content loading
        defaultContentLoaded.current = false;
        personalizedContentRequested.current = false;
        userAttributesSet.current = false;
        setLoading(true);
        fetchContentWithSmartPersonalization();
      }}>
        <StatsSection 
          content={homePageContent}
          stats={stats}
        />
      </CMSErrorBoundary>
    </div>
  );
};

export default HomePage;