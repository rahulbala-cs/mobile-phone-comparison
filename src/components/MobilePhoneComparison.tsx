import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { X, ShoppingCart, Eye, Plus } from 'lucide-react';
import { MobilePhone } from '../types/MobilePhone';
import { getFieldValue } from '../types/EditableTags';
import contentstackService from '../services/contentstackService';
import { parseComparisonUrl } from '../utils/urlUtils';
import { onEntryChange, onLiveEdit, VB_EmptyBlockParentClass, getEditAttributes } from '../utils/livePreview';
import { usePageView, useComparisonTracking, usePhoneTracking } from '../hooks/usePersonalize';
import { useGlobalPersonalize } from '../App';
import PhoneSelector from './PhoneSelector';
import QuickSummarize from './QuickSummarize';
import './MobilePhoneComparison.css';

// Types for better type safety
interface ImageGalleryState {
  phone: MobilePhone | null;
  isOpen: boolean;
  currentImage: number;
}

interface ComparisonError {
  message: string;
  code: 'INVALID_URL' | 'PHONES_NOT_FOUND' | 'FETCH_ERROR';
}

const MobilePhoneComparison: React.FC = () => {
  const { phones: phonesParam } = useParams<{ phones: string }>();
  const navigate = useNavigate();
  
  const [phones, setPhones] = useState<(MobilePhone | null)[]>([null, null, null, null]);
  const [allPhones, setAllPhones] = useState<MobilePhone[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<ComparisonError | null>(null);
  const [showOnlyDifferences, setShowOnlyDifferences] = useState<boolean>(false);
  const [showPhoneSelector, setShowPhoneSelector] = useState<boolean>(false);
  const [selectingSlot, setSelectingSlot] = useState<number | null>(null);
  const [isSelectingPhone, setIsSelectingPhone] = useState<boolean>(false);
  const [imageGallery, setImageGallery] = useState<ImageGalleryState>({
    phone: null,
    isOpen: false,
    currentImage: 0
  });

  // Global personalization context
  const globalPersonalize = useGlobalPersonalize();
  const { trackComparisonStarted, trackComparisonCompleted } = useComparisonTracking();
  const { trackPhoneView } = usePhoneTracking();
  
  // Track comparison duration
  const comparisonStartTime = useRef<number>(Date.now());
  
  // Track page view with dynamic title
  const validPhones = phones.filter(phone => phone !== null) as MobilePhone[];
  const pageTitle = validPhones.length > 0 
    ? `Compare ${validPhones.map(p => getFieldValue(p.title)).join(' vs ')} - Mobile Compare`
    : 'Mobile Phone Comparison - Mobile Compare';
  
  usePageView(
    `/compare/${phonesParam || ''}`,
    pageTitle,
    { trackOnMount: true, trackOnChange: true }
  );

  // OPTIMIZED: Stable loading function to prevent loops
  const loadComparison = useCallback(async () => {
    // Only load if we have global personalization ready or no personalization needed
    if (!globalPersonalize.isReady) return;
    
    try {
      setLoading(true);
      setError(null);

      if (!phonesParam) {
        setError({
          message: 'No phones specified for comparison',
          code: 'INVALID_URL'
        });
        return;
      }

      const slugs = parseComparisonUrl(phonesParam);
      
      if (!slugs || slugs.length < 2) {
        setError({
          message: 'Invalid comparison URL format',
          code: 'INVALID_URL'
        });
        return;
      }

      // Get variant aliases from global personalization  
      const variantAliases = globalPersonalize.variants || [];

      // COMPARISON CACHING: Check cache first
      const cacheKey = `comparison_${slugs.join('_')}_${variantAliases.join('_')}`;
      const cachedComparison = sessionStorage.getItem(cacheKey);
      
      if (cachedComparison) {
        try {
          const parsed = JSON.parse(cachedComparison);
          if (Date.now() - parsed.timestamp < 600000) { // 10 min cache
            setPhones(parsed.phones);
            setLoading(false);
            return;
          }
        } catch {
          sessionStorage.removeItem(cacheKey); // Clean invalid cache
        }
      }

      // Convert variant aliases to variant parameter string
      const variantParam = variantAliases.length > 0 ? variantAliases.join(',') : undefined;

      // PARALLEL OPTIMIZATION: Fetch phones and track in parallel
      const promises: Promise<any>[] = [
        // Primary: Fetch comparison phones
        contentstackService.getMobilePhonesBySlugs(slugs, variantParam)
      ];

      const [foundPhones] = await Promise.all(promises);
      
      if (foundPhones.length < 2) {
        // Only error if we can't do a comparison (need at least 2 phones)
        setError({
          message: `Could not find enough phones for comparison. Found ${foundPhones.length} of ${slugs.length} phones. Please check the phone names in the URL.`,
          code: 'PHONES_NOT_FOUND'
        });
        return;
      } else if (foundPhones.length !== slugs.length) {
        // Warning but continue with partial comparison
        console.warn(`⚠️ Partial comparison: Found ${foundPhones.length} of ${slugs.length} requested phones`);
      }

      // Set up phones array
      const newPhones: (MobilePhone | null)[] = [null, null, null, null];
      foundPhones.forEach((phone: MobilePhone, index: number) => {
        if (index < 4) newPhones[index] = phone;
      });
      setPhones(newPhones);
      
      // Cache successful comparison
      sessionStorage.setItem(cacheKey, JSON.stringify({
        phones: newPhones,
        timestamp: Date.now()
      }));
      
      // Track comparison started with personalization (background)
      if (foundPhones.length >= 2) {
        const phoneUids = foundPhones.map((phone: MobilePhone) => phone.uid);
        setTimeout(async () => {
          try {
            await trackComparisonStarted(phoneUids);
            comparisonStartTime.current = Date.now();
          } catch {
            // Fail silently - tracking is non-critical
          }
        }, 100);
      }
    } catch (err: any) {
      console.error('Error loading comparison:', err);
      setError({
        message: 'Failed to load mobile phones',
        code: 'FETCH_ERROR'
      });
    } finally {
      setLoading(false);
    }
  }, [phonesParam, globalPersonalize.variants, globalPersonalize.isReady]); // eslint-disable-line react-hooks/exhaustive-deps
  // OPTIMIZED: Intentionally excluding trackComparisonStarted to prevent loops

  // Initial data fetch
  useEffect(() => {
    loadComparison();
  }, [loadComparison]);

  // Set up Live Preview and Visual Builder using V3.0+ pattern
  useEffect(() => {
    onEntryChange(loadComparison); // For Live Preview
    onLiveEdit(loadComparison);    // For Visual Builder
  }, [loadComparison]);

  // Track comparison completion on unmount
  useEffect(() => {
    return () => {
      // Track comparison completion when component unmounts
      if (globalPersonalize.isReady && validPhones.length >= 2) {
        const duration = Date.now() - comparisonStartTime.current;
        const phoneUids = validPhones.map(phone => phone.uid);
        trackComparisonCompleted(phoneUids, duration);
      }
    };
  }, [globalPersonalize.isReady, validPhones, trackComparisonCompleted]);

  const removePhone = (index: number) => {
    const newPhones = [...phones];
    newPhones[index] = null;
    
    // Compact array to remove gaps and maintain proper positioning
    const compactedPhones = newPhones.filter(phone => phone !== null);
    
    // Fill remaining slots with null to maintain 4-slot array structure
    const finalPhones = [...compactedPhones];
    while (finalPhones.length < 4) {
      finalPhones.push(null);
    }
    
    setPhones(finalPhones);
    
    // Track comparison completion if we now have fewer than 2 phones
    const validNewPhones = compactedPhones as MobilePhone[];
    if (validNewPhones.length < 2 && globalPersonalize.isReady) {
      const duration = Date.now() - comparisonStartTime.current;
      const phoneUids = validNewPhones.map(p => p.uid);
      trackComparisonCompleted(phoneUids, duration);
    }
  };

  const addPhone = async () => {
    // Find the first empty slot
    const emptySlotIndex = phones.findIndex(phone => phone === null);
    
    if (emptySlotIndex === -1) {
      // All slots are full, can't add more phones
      console.warn('All comparison slots are full (maximum 4 phones)');
      return;
    }
    
    setSelectingSlot(emptySlotIndex);
    
    // Lazy load all phones only when selector is opened
    if (allPhones.length === 0) {
      try {
        const variantAliases = globalPersonalize.variants || [];
        const variantParam = variantAliases.length > 0 ? variantAliases.join(',') : undefined;
        const allPhonesData = await contentstackService.getAllMobilePhones(variantParam);
        setAllPhones(allPhonesData);
      } catch (error) {
        console.error('Failed to load phones for selector:', error);
        // Continue anyway - user can still use existing phones
      }
    }
    
    setShowPhoneSelector(true);
  };

  const handlePhoneSelect = async (phone: MobilePhone) => {
    setIsSelectingPhone(true);
    
    try {
      if (selectingSlot !== null) {
        const newPhones = [...phones];
        newPhones[selectingSlot] = phone;
        setPhones(newPhones);
        
        // Track phone view and update personalization attributes with timeout protection
        if (globalPersonalize.isReady) {
          try {
            // Set a timeout for tracking to prevent hanging
            const trackingPromise = Promise.race([
              trackPhoneView({
                uid: phone.uid,
                title: getFieldValue(phone.title),
                brand: phone.taxonomies?.[0]?.term_uid || undefined,
                price: getPrice(phone) || undefined
              }),
              new Promise((_, reject) => setTimeout(() => reject(new Error('Tracking timeout')), 2000))
            ]);
            
            await trackingPromise;
            
            // If this creates a valid comparison (2+ phones), track it
            const validNewPhones = newPhones.filter(p => p !== null) as MobilePhone[];
            if (validNewPhones.length >= 2) {
              const phoneUids = validNewPhones.map(p => p.uid);
              
              const comparisonPromise = Promise.race([
                trackComparisonStarted(phoneUids),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Comparison tracking timeout')), 2000))
              ]);
              
              await comparisonPromise;
              comparisonStartTime.current = Date.now();
            }
          } catch (trackingError) {
            console.warn('Phone tracking failed (non-critical):', trackingError);
            // Continue with phone selection even if tracking fails
          }
        }
        
        // Small delay to ensure UI updates are processed
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } catch (error) {
      console.error('Failed to select phone:', error);
      // Even if there's an error, we should still close the modal
    } finally {
      // Always close the modal and reset state, regardless of success or failure
      setIsSelectingPhone(false);
      setShowPhoneSelector(false);
      setSelectingSlot(null);
    }
  };

  const getImageCount = (phone: MobilePhone) => {
    try {
      if (phone.images && phone.images.length > 0) {
        return phone.images.length;
      }
      return 1; // At least lead_image
    } catch (error) {
      console.warn('Error getting image count for phone:', phone?.uid, error);
      return 1;
    }
  };

  const openImageGallery = (phone: MobilePhone) => {
    setImageGallery({ phone, isOpen: true, currentImage: 0 });
  };

  const closeImageGallery = useCallback(() => {
    setImageGallery({ phone: null, isOpen: false, currentImage: 0 });
  }, []);

  // Navigate to phone detail page
  const handlePhoneDetailClick = useCallback((phone: MobilePhone) => {
    try {
      // First try to use the phone's URL field if it exists
      const phoneUrl = getFieldValue(phone.url);
      if (phoneUrl && typeof phoneUrl === 'string') {
        navigate(phoneUrl);
        return;
      }
      
      // Fallback to UID-based URL
      navigate(`/mobiles/${phone.uid}`);
    } catch (error) {
      console.warn('Error navigating to phone detail:', error);
      // Fallback to UID
      navigate(`/mobiles/${phone.uid}`);
    }
  }, [navigate]);

  const setCurrentImage = (index: number) => {
    setImageGallery(prev => ({ ...prev, currentImage: index }));
  };

  const getCurrentImageUrl = () => {
    try {
      if (!imageGallery.phone?.lead_image?.url) return '';
      
      if (imageGallery.currentImage === 0) {
        return imageGallery.phone.lead_image.url;
      }
      
      if (imageGallery.phone.images && Array.isArray(imageGallery.phone.images) && imageGallery.phone.images.length > 0) {
        const imageIndex = imageGallery.currentImage - 1;
        if (imageIndex >= 0 && imageIndex < imageGallery.phone.images.length) {
          const image = imageGallery.phone.images[imageIndex];
          return image?.url || imageGallery.phone.lead_image.url;
        }
      }
      
      return imageGallery.phone.lead_image.url;
    } catch (error) {
      console.warn('Error getting current image URL:', error);
      return imageGallery.phone?.lead_image?.url || '';
    }
  };

  // Helper function to check if all phones have the same value for a spec
  const hasDifferences = useCallback((specKey: string) => {
    const validPhones = phones.filter((phone): phone is MobilePhone => phone !== null);
    if (validPhones.length < 2) return true;
    
    try {
      const values = validPhones.map(phone => {
        if (!phone?.specifications) return 'N/A';
        const specValue = phone.specifications[specKey as keyof typeof phone.specifications];
        if (!specValue) return 'N/A';
        const fieldValue = getFieldValue(specValue);
        return typeof fieldValue === 'string' ? fieldValue : String(fieldValue || 'N/A');
      });
      const uniqueValues = new Set(values);
      return uniqueValues.size > 1;
    } catch (error) {
      console.warn('Error checking differences for spec:', specKey, error);
      return true;
    }
  }, [phones]);

  // Intelligent spec comparison logic
  const getSpecComparison = useCallback((specKey: string) => {
    const validPhones = phones.filter((phone): phone is MobilePhone => phone !== null);
    if (validPhones.length < 2) return phones.map(() => ({ isWinner: false, value: 'N/A' }));
    
    const specValues = phones.map(phone => {
      if (!phone?.specifications) return { phone, rawValue: 'N/A', numericValue: null };
      
      const specValue = phone.specifications[specKey as keyof typeof phone.specifications];
      if (!specValue) return { phone, rawValue: 'N/A', numericValue: null };
      
      const fieldValue = getFieldValue(specValue);
      const rawValue = typeof fieldValue === 'string' ? fieldValue : String(fieldValue || 'N/A');
      const numericValue = extractNumericValue(rawValue);
      
      return { phone, rawValue, numericValue };
    });
    
    // Define specs where lower is better
    const lowerIsBetter = ['weight', 'thickness', 'price'];
    
    // Find the best value
    const validValues = specValues.filter(sv => sv.numericValue !== null);
    if (validValues.length < 2) {
      return specValues.map(sv => ({ isWinner: false, value: sv.rawValue }));
    }
    
    let bestValue: number;
    try {
      if (lowerIsBetter.includes(specKey)) {
        bestValue = Math.min(...validValues.map(sv => sv.numericValue!));
      } else {
        bestValue = Math.max(...validValues.map(sv => sv.numericValue!));
      }
    } catch (error) {
      console.warn('Error calculating best value for spec:', specKey, error);
      return specValues.map(sv => ({ isWinner: false, value: sv.rawValue }));
    }
    
    return specValues.map(sv => ({
      isWinner: sv.numericValue === bestValue && sv.numericValue !== null,
      value: sv.rawValue
    }));
  }, [phones]);

  // Extract numeric value from spec strings
  const extractNumericValue = (value: string): number | null => {
    if (!value || value === 'N/A') return null;
    
    try {
      // Remove common units and text, extract first number
      const numericMatch = value.toString().match(/([0-9]+\.?[0-9]*)/); 
      if (!numericMatch) return null;
      
      const baseNumber = parseFloat(numericMatch[1]);
      if (isNaN(baseNumber)) return null;
      
      // Handle common units
      const valueStr = value.toString().toLowerCase();
      if (valueStr.includes('gb') || valueStr.includes('tb')) {
        return valueStr.includes('tb') ? baseNumber * 1000 : baseNumber;
      }
      if (valueStr.includes('mah')) {
        return baseNumber;
      }
      if (valueStr.includes('mp')) {
        return baseNumber;
      }
      if (valueStr.includes('ghz')) {
        return baseNumber;
      }
      if (valueStr.includes('hz')) {
        return baseNumber;
      }
      if (valueStr.includes('g') && !valueStr.includes('gb')) {
        return baseNumber; // weight in grams
      }
      
      return baseNumber;
    } catch (error) {
      console.warn('Error extracting numeric value from:', value, error);
      return null;
    }
  };

  // Define all specifications with their labels and comparison logic
  const specifications = [
    { key: 'cpu', label: 'Processor', comparable: false },
    { key: 'ram', label: 'RAM', comparable: true },
    { key: 'storage', label: 'Storage', comparable: true },
    { key: 'rear_camera', label: 'Rear Camera', comparable: true },
    { key: 'front_camera', label: 'Front Camera', comparable: true },
    { key: 'display_resolution', label: 'Display', comparable: false },
    { key: 'screen_to_body_ratio', label: 'Screen-to-Body Ratio', comparable: true },
    { key: 'battery', label: 'Battery', comparable: true },
    { key: 'weight', label: 'Weight', comparable: true }
  ];

  // Filter specs based on "Show Only Differences" toggle
  const filteredSpecs = showOnlyDifferences 
    ? specifications.filter(spec => hasDifferences(spec.key))
    : specifications;

  const getPrice = useCallback((phone: MobilePhone) => {
    if (!phone?.variants) return null;
    
    try {
      const variants = getFieldValue(phone.variants);
      if (variants && Array.isArray(variants) && variants.length > 0) {
        const firstVariant = variants[0];
        return firstVariant && typeof firstVariant === 'object' && 'price' in firstVariant 
          ? getFieldValue(firstVariant.price) : null;
      }
      return null;
    } catch (error) {
      console.warn('Error getting price for phone:', phone?.uid, error);
      return null;
    }
  }, []);

  // Calculate dynamic grid layout based on phone count
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  // Handle window resize for responsive grid
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getGridColumns = useCallback(() => {
    const phoneCount = validPhones.length;
    const maxSlots = 4; // Maximum comparison slots
    
    // Safety check for valid phone count with better edge case handling
    if (phoneCount < 0) {
      console.warn('Invalid phone count: negative value');
      return {
        labelWidth: '160px',
        unifiedGrid: '160px',
        cardGrid: '160px',
        comparisonGrid: '160px',
        cardSlots: 0,
        comparisonSlots: 0,
        phoneCount: 0,
        minPhoneColumnWidth: '280px',
        isMobile: false
      };
    }
    
    if (phoneCount === 0) {
      return {
        labelWidth: '160px',
        unifiedGrid: '160px',
        cardGrid: '160px',
        comparisonGrid: '160px',
        cardSlots: 0,
        comparisonSlots: 0,
        phoneCount: 0,
        minPhoneColumnWidth: '280px',
        isMobile: windowWidth <= 768
      };
    }
    
    if (phoneCount > maxSlots) {
      console.warn(`Phone count (${phoneCount}) exceeds maximum slots (${maxSlots}), limiting to ${maxSlots}`);
      // Use only the first maxSlots phones
      const limitedPhoneCount = maxSlots;
      const isMobile = windowWidth <= 768;
      const labelWidth = isMobile ? '100px' : '160px';
      const minPhoneColumnWidth = isMobile ? '140px' : '220px';
      const phoneColumnsTemplate = `repeat(${limitedPhoneCount}, minmax(${minPhoneColumnWidth}, 1fr))`;
      const unifiedGrid = `${labelWidth} ${phoneColumnsTemplate}`;
      
      return {
        labelWidth,
        minPhoneColumnWidth,
        unifiedGrid,
        cardGrid: unifiedGrid,
        comparisonGrid: unifiedGrid,
        cardSlots: limitedPhoneCount,
        comparisonSlots: limitedPhoneCount,
        phoneCount: limitedPhoneCount,
        isMobile
      };
    }
    
    // Check if we're on mobile (use state for reactivity)
    const isMobile = windowWidth <= 768;
    
    // UNIFIED GRID SYSTEM: Both cards and comparison use the same template
    const labelWidth = isMobile ? '100px' : '160px';
    const minPhoneColumnWidth = isMobile 
      ? (phoneCount <= 2 ? '180px' : phoneCount === 3 ? '160px' : '140px')
      : (phoneCount <= 2 ? '300px' : phoneCount === 3 ? '260px' : '220px');
    
    // Create unified grid template that works for both sections
    const phoneColumnsTemplate = `repeat(${phoneCount}, minmax(${minPhoneColumnWidth}, 1fr))`;
    const unifiedGrid = `${labelWidth} ${phoneColumnsTemplate}`;
    
    // For product cards: show only actual phones (no add phone slot in grid)
    const cardSlots = phoneCount;
    const cardGridTemplate = unifiedGrid;
    
    return {
      labelWidth,
      minPhoneColumnWidth,
      unifiedGrid,
      cardGrid: cardGridTemplate,
      comparisonGrid: unifiedGrid,
      cardSlots,
      comparisonSlots: phoneCount,
      phoneCount,
      isMobile
    };
  }, [validPhones.length, windowWidth]);

  const gridConfig = getGridColumns();

  if (loading) {
    return (
      <div className="msp-comparison">
        {/* Comparison Skeleton UI */}
        <div className="msp-product-cards-container">
          <div 
            className="msp-product-cards" 
            data-phone-count="2"
            style={{
              opacity: 0.6,
              pointerEvents: 'none'
            }}
          >
            <div className="msp-spec-label-column">
              <div className="msp-spec-label-header">Compare</div>
            </div>
            
            {/* Phone Card Skeletons */}
            {[1, 2].map(i => (
              <div key={i} className="msp-product-card">
                <div className="msp-card-content">
                  <div className="msp-product-image" style={{
                    background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
                    backgroundSize: '200% 100%',
                    animation: 'shimmer 2s infinite',
                    height: '200px',
                    borderRadius: '8px'
                  }}></div>
                  <div style={{
                    height: '24px',
                    background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
                    backgroundSize: '200% 100%',
                    animation: 'shimmer 2s infinite',
                    margin: '1rem 0',
                    borderRadius: '4px'
                  }}></div>
                  <div style={{
                    height: '40px',
                    background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
                    backgroundSize: '200% 100%',
                    animation: 'shimmer 2s infinite',
                    borderRadius: '4px'
                  }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Comparison Grid Skeleton */}
        <div className="msp-overview-container">
          <section className="msp-overview">
            <div style={{
              height: '32px',
              background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 2s infinite',
              marginBottom: '2rem',
              borderRadius: '4px',
              width: '200px'
            }}></div>
            
            <div className="msp-unified-comparison-container">
              <div style={{
                display: 'grid',
                gridTemplateColumns: '160px repeat(2, minmax(280px, 1fr))',
                gap: '12px'
              }}>
                {[1, 2, 3, 4, 5].map(row => (
                  <React.Fragment key={row}>
                    <div style={{
                      height: '40px',
                      background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
                      backgroundSize: '200% 100%',
                      animation: 'shimmer 2s infinite',
                      borderRadius: '4px',
                      animationDelay: `${row * 0.1}s`
                    }}></div>
                    {[1, 2].map(col => (
                      <div key={col} style={{
                        height: '40px',
                        background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
                        backgroundSize: '200% 100%',
                        animation: 'shimmer 2s infinite',
                        borderRadius: '4px',
                        animationDelay: `${(row * 2 + col) * 0.1}s`
                      }}></div>
                    ))}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </section>
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

  if (error) {
    return (
      <div className="msp-error">
        <h2>Comparison Error</h2>
        <p>{error.message}</p>
        {error.code === 'INVALID_URL' && (
          <div className="msp-error-help">
            <p>Please use the format: /compare/phone1-vs-phone2</p>
            <p>Example: /compare/oneplus-13-vs-samsung-galaxy-s24-ultra</p>
          </div>
        )}
        {error.code === 'PHONES_NOT_FOUND' && (
          <div className="msp-error-help">
            <p>Available phone slugs include:</p>
            <ul>
              <li>oneplus-13</li>
              <li>samsung-galaxy-s24-ultra</li>
              <li>apple-iphone-16-pro-max</li>
              <li>oneplus-12</li>
              <li>samsung-galaxy-s25-ultra</li>
            </ul>
            <p>Try using these exact phone names in your comparison URL.</p>
          </div>
        )}
        <div className="msp-error-actions">
          <button onClick={() => navigate('/')} className="msp-error-button">
            Back to Home
          </button>
          <button onClick={() => navigate('/compare')} className="msp-error-button msp-error-button-secondary">
            Start New Comparison
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="msp-comparison">
      <Helmet>
        <title>{validPhones.map(p => {
          const titleValue = getFieldValue(p.title);
          return typeof titleValue === 'string' ? titleValue : String(titleValue || 'Phone');
        }).join(' vs ')} - Mobile Phone Comparison</title>
        <meta name="description" content={`Compare ${validPhones.map(p => {
          const titleValue = getFieldValue(p.title);
          return typeof titleValue === 'string' ? titleValue : String(titleValue || 'Phone');
        }).join(', ')} specifications and prices.`} />
      </Helmet>

      {/* Phone Selector Modal */}
      {showPhoneSelector && (
        <PhoneSelector
          phones={allPhones}
          onSelect={handlePhoneSelect}
          onClose={() => {
            setShowPhoneSelector(false);
            setSelectingSlot(null);
            setIsSelectingPhone(false);
          }}
          excludePhone={null}
          isLoading={isSelectingPhone}
        />
      )}

      {/* Image Gallery Modal */}
      {imageGallery.isOpen && imageGallery.phone && (
        <div className="msp-gallery-overlay" onClick={closeImageGallery}>
          <div className="msp-gallery-modal" onClick={(e) => e.stopPropagation()}>
            <div className="msp-gallery-header">
              <h3>{(() => {
                const titleValue = getFieldValue(imageGallery.phone?.title);
                return typeof titleValue === 'string' ? titleValue : String(titleValue || 'Phone');
              })()} - Photos</h3>
              <button className="msp-gallery-close" onClick={closeImageGallery}>
                <X size={24} />
              </button>
            </div>
            <div className="msp-gallery-content">
              <div className="msp-gallery-main">
                {getCurrentImageUrl() && (
                  <img
                    src={contentstackService.optimizeImage(getCurrentImageUrl(), {
                      width: 600,
                      format: 'webp',
                      quality: 90
                    })}
                    alt={getFieldValue(imageGallery.phone?.title) || 'Mobile phone'}
                    className="msp-gallery-main-image"
                  />
                )}
              </div>
              <div className="msp-gallery-thumbnails">
                {imageGallery.phone?.lead_image?.url && (
                  <img
                    src={contentstackService.optimizeImage(imageGallery.phone.lead_image.url, {
                      width: 100,
                      format: 'webp',
                      quality: 80
                    })}
                    alt="Main"
                    className={`msp-gallery-thumb ${imageGallery.currentImage === 0 ? 'active' : ''}`}
                    onClick={() => setCurrentImage(0)}
                  />
                )}
                {imageGallery.phone?.images && Array.isArray(imageGallery.phone.images) && imageGallery.phone.images.map((image, index) => {
                  if (!image?.url) return null;
                  return (
                    <img
                      key={image.uid || `image-${index}`}
                      src={contentstackService.optimizeImage(image.url, {
                        width: 100,
                        format: 'webp',
                        quality: 80
                      })}
                      alt={`${getFieldValue(imageGallery.phone?.title) || 'Phone'} ${index + 1}`}
                      className={`msp-gallery-thumb ${imageGallery.currentImage === index + 1 ? 'active' : ''}`}
                      onClick={() => setCurrentImage(index + 1)}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Product Cards */}
      <div className="msp-product-cards-container">
        <div 
          className={`msp-product-cards ${VB_EmptyBlockParentClass}`}
          data-phone-count={validPhones.length}
        >
          {/* Specification Label Column */}
          <div className="msp-spec-label-column">
            <div className="msp-spec-label-header">Compare</div>
          </div>
          
          {/* Dynamic Phone Cards - Only show actual phones */}
          {validPhones.map((phone, index) => (
            <div key={phone.uid} className="msp-product-card">
              {phone && (
                  <>
                    <button 
                      className="msp-remove-btn"
                      onClick={() => removePhone(index)}
                    >
                      <X size={16} />
                    </button>

                    <div 
                      className="msp-card-content msp-clickable-card"
                      onClick={() => handlePhoneDetailClick(phone)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handlePhoneDetailClick(phone);
                        }
                      }}
                      title={`View details for ${getFieldValue(phone.title) || 'this phone'}`}
                    >
                      <div className="msp-product-image">
                        {phone.lead_image?.url ? (
                          <img
                            src={contentstackService.optimizeImage(phone.lead_image.url, {
                              width: 200,
                              format: 'webp',
                              quality: 90
                            })}
                            alt={getFieldValue(phone.title) || 'Mobile phone'}
                          />
                        ) : (
                          <div className="msp-no-image">No Image Available</div>
                        )}
                      </div>

                      <div className="msp-phone-header">
                        <h3 className="msp-product-title" {...getEditAttributes(phone.title)}>
                          {(() => {
                            const titleValue = getFieldValue(phone.title);
                            return typeof titleValue === 'string' ? titleValue : String(titleValue || 'Phone');
                          })()}
                        </h3>
                      </div>

                      <div className="msp-price">
                        {getPrice(phone) && (
                          <>
                            <span className="msp-starts-from">Starts from</span>
                            <div className="msp-price-amount" {...getEditAttributes(phone.variants?.[0]?.price)}>
                              <span className="msp-currency">₹</span>
                              <span className="msp-amount">{getPrice(phone)?.toLocaleString('en-IN')}</span>
                            </div>
                          </>
                        )}
                      </div>

                      <div 
                        className="msp-stores"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {getFieldValue(phone.amazon_link?.href) && (
                          <a href={getFieldValue(phone.amazon_link?.href)} target="_blank" rel="noopener noreferrer" className="msp-store">
                            <ShoppingCart size={14} />
                            Amazon
                          </a>
                        )}
                        {getFieldValue(phone.flipkart_link?.href) && (
                          <a href={getFieldValue(phone.flipkart_link?.href)} target="_blank" rel="noopener noreferrer" className="msp-store">
                            <ShoppingCart size={14} />
                            Flipkart
                          </a>
                        )}
                      </div>
                    </div>
                  </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Floating Add Phone Button */}
      {validPhones.length < 4 && (
        <button
          className="msp-floating-add-phone"
          onClick={addPhone}
          aria-label="Add a phone to comparison"
          title="Add Phone"
        >
          <Plus size={24} />
          <span className="msp-floating-add-text">Add Phone</span>
        </button>
      )}

      {/* Overview Section */}
      <div className="msp-overview-container">
        <section className="msp-overview">
          <div className="msp-section-header">
          <h2>Overview</h2>
          <div className="msp-section-controls">
            <QuickSummarize phones={phones} />
            <label className="msp-toggle">
              <input
                type="checkbox"
                checked={showOnlyDifferences}
                onChange={(e) => setShowOnlyDifferences(e.target.checked)}
              />
              Show Only Differences
            </label>
          </div>
        </div>

        {/* Unified Scrollable Comparison Container */}
        <div className="msp-unified-comparison-container">
          {/* Sticky Phone Headers */}
          <div 
            className="msp-sticky-headers"
            style={{
              gridTemplateColumns: gridConfig.unifiedGrid,
              gap: gridConfig.isMobile ? '8px' : '12px'
            }}
          >
            <div className="msp-sticky-label">Specifications</div>
            {validPhones.map((phone, index) => (
              <div key={`sticky-${phone.uid}`} className="msp-sticky-phone">
                {phone.lead_image?.url && (
                  <img
                    src={contentstackService.optimizeImage(phone.lead_image.url, {
                      width: 48,
                      format: 'webp',
                      quality: 80
                    })}
                    alt={getFieldValue(phone.title) || 'Phone'}
                    className="msp-sticky-image"
                  />
                )}
                <div className="msp-sticky-name" title={getFieldValue(phone.title) || 'Phone'}>
                  {(() => {
                    const titleValue = getFieldValue(phone.title);
                    return typeof titleValue === 'string' ? titleValue : String(titleValue || 'Phone');
                  })()}
                </div>
              </div>
            ))}
          </div>

          {/* Comparison Grid */}
          <div 
            className={`msp-comparison-grid ${VB_EmptyBlockParentClass}`}
            data-phone-count={validPhones.length}
          >
          {/* Dynamic Specifications with Intelligent Highlighting */}
          {filteredSpecs.map((spec) => {
            const specComparison = spec.comparable ? getSpecComparison(spec.key) : null;
            
            return (
              <React.Fragment key={spec.key}>
                <div className="msp-spec-label">{spec.label}</div>
                {validPhones.map((phone, index) => {
                  const comparison = specComparison?.[index];
                  const isWinner = comparison?.isWinner || false;
                  
                  return (
                    <div 
                      key={`${spec.key}-${phone.uid}`} 
                      className={`msp-spec-value ${isWinner ? 'msp-winner' : ''}`}
                    >
                      <div className="msp-spec-content">
                        <span className="msp-spec-text" {...getEditAttributes(phone.specifications?.[spec.key as keyof typeof phone.specifications])}>
                          {(() => {
                            if (!phone.specifications) {
                              return 'N/A';
                            }
                            
                            // Each spec field is individually an editable field object
                            const specValue = phone.specifications[spec.key as keyof typeof phone.specifications];
                            if (!specValue) {
                              return 'N/A';
                            }
                            
                            const finalValue = getFieldValue(specValue);
                            return typeof finalValue === 'string' ? finalValue : String(finalValue || 'N/A');
                          })()} 
                        </span>
                        {isWinner && (
                          <span className="msp-winner-badge" title="Best value">🏆</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </React.Fragment>
            );
          })}

          {/* Price - Always show with intelligent highlighting */}
          <div className="msp-spec-label">Price</div>
          {(() => {
            const prices = validPhones.map(phone => getPrice(phone));
            const validPrices = prices.filter(price => price !== null) as number[];
            const lowestPrice = validPrices.length > 1 ? Math.min(...validPrices) : null;
            
            return validPhones.map((phone, index) => {
              const price = getPrice(phone);
              const isLowestPrice = price !== null && price === lowestPrice && validPrices.length > 1;
              
              return (
                <div key={`price-${phone.uid}`} className={`msp-spec-value ${isLowestPrice ? 'msp-winner' : ''}`}>
                  {price ? (
                    <div className="msp-price-comparison">
                      <div className="msp-price-item">
                        <ShoppingCart size={12} />
                        <span {...getEditAttributes(phone.variants?.[0]?.price)}>₹ {price.toLocaleString('en-IN')}</span>
                        <span className="msp-store-name">Starting Price</span>
                        {isLowestPrice && (
                          <span className="msp-winner-badge" title="Best price">🏆</span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="msp-spec-content">
                      <span className="msp-spec-text">N/A</span>
                    </div>
                  )}
                </div>
              );
            });
          })()}
          </div>
        </div>
        </section>
      </div>

      {/* Photos and Videos */}
      {validPhones.length > 0 && (
        <div className="msp-overview-container">
          <section className="msp-media">
          <h2>Photos and Videos</h2>
          <div className={`msp-media-grid ${VB_EmptyBlockParentClass}`}>
            {phones.map((phone, index) => (
              phone && (
                <div key={phone.uid} className="msp-media-item">
                  <div 
                    className="msp-media-preview" 
                    onClick={() => openImageGallery(phone)}
                  >
                    {phone.lead_image?.url ? (
                      <img
                        src={contentstackService.optimizeImage(phone.lead_image.url, {
                          width: 150,
                          format: 'webp',
                          quality: 80
                        })}
                        alt={getFieldValue(phone.title) || 'Mobile phone'}
                      />
                    ) : (
                      <div className="msp-media-no-image">📱</div>
                    )}
                    <div className="msp-media-overlay">
                      <Eye size={16} />
                      <span>{getImageCount(phone)} PHOTOS</span>
                    </div>
                  </div>
                  <div className="msp-phone-header">
                    <h4 className="msp-media-title" {...getEditAttributes(phone.title)}>
                      {(() => {
                        const titleValue = getFieldValue(phone.title);
                        return typeof titleValue === 'string' ? titleValue : String(titleValue || 'Phone');
                      })()}
                    </h4>
                  </div>
                </div>
              )
            ))}
          </div>
          </section>
        </div>
      )}

      {/* Empty State Message */}
      {validPhones.length === 0 && (
        <div className="msp-overview-container">
          <div className="msp-empty-state">
            <div className="msp-empty-icon">📱</div>
            <h3>Start Your Comparison</h3>
            <p>Click "Add Phone" above to select phones and start comparing specifications, prices, and features.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MobilePhoneComparison;