import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { X, ShoppingCart, Eye, Plus } from 'lucide-react';
import { MobilePhone, getFieldValue } from '../types/MobilePhone';
import contentstackService from '../services/contentstackService';
import { parseComparisonUrl, findPhoneBySlug } from '../utils/urlUtils';
import { onEntryChange, onLiveEdit, VB_EmptyBlockParentClass, getEditAttributes } from '../utils/livePreview';
import { usePersonalize, usePageView, useComparisonTracking, usePhoneTracking } from '../hooks/usePersonalize';
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
  const [imageGallery, setImageGallery] = useState<ImageGalleryState>({
    phone: null,
    isOpen: false,
    currentImage: 0
  });

  // Personalization hooks
  const { getVariantParam, isReady: isPersonalizeReady } = usePersonalize();
  const { trackComparisonStarted, trackComparisonCompleted } = useComparisonTracking();
  const { trackPhoneView } = usePhoneTracking();
  
  // Track comparison duration
  const comparisonStartTime = useRef<number>(Date.now());
  
  // Track page view with dynamic title
  const validPhones = phones.filter(phone => phone !== null) as MobilePhone[];
  const pageTitle = validPhones.length > 0 
    ? `Compare ${validPhones.map(p => p.title).join(' vs ')} - Mobile Compare`
    : 'Mobile Phone Comparison - Mobile Compare';
  
  usePageView(
    `/compare/${phonesParam || ''}`,
    pageTitle,
    { trackOnMount: true, trackOnChange: true }
  );

  // Main data fetching function with personalization support
  const loadComparison = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Get variant parameter for personalization
      const variantParam = getVariantParam();

      // Fetch all phones first with personalization
      const allPhonesData = await contentstackService.getAllMobilePhones(variantParam || undefined);
      setAllPhones(allPhonesData);
      
      if (phonesParam && allPhonesData.length > 0) {
        const slugs = parseComparisonUrl(phonesParam);
        
        if (slugs && slugs.length >= 2) {
          const foundPhones = slugs.map(slug => findPhoneBySlug(allPhonesData, slug));
          
          if (foundPhones.every(phone => phone !== null)) {
            const newPhones: (MobilePhone | null)[] = [null, null, null, null];
            foundPhones.forEach((phone, index) => {
              if (index < 4) newPhones[index] = phone;
            });
            setPhones(newPhones);
            
            // Track comparison started with personalization
            if (isPersonalizeReady && foundPhones.length >= 2) {
              const phoneUids = foundPhones.filter(phone => phone !== null).map(phone => phone!.uid);
              await trackComparisonStarted(phoneUids);
              comparisonStartTime.current = Date.now();
            }
          } else {
            setError({
              message: 'One or more phones not found',
              code: 'PHONES_NOT_FOUND'
            });
          }
        } else {
          setError({
            message: 'Invalid comparison URL format',
            code: 'INVALID_URL'
          });
        }
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
  }, [phonesParam, getVariantParam, isPersonalizeReady, trackComparisonStarted]);

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
      if (isPersonalizeReady && validPhones.length >= 2) {
        const duration = Date.now() - comparisonStartTime.current;
        const phoneUids = validPhones.map(phone => phone.uid);
        trackComparisonCompleted(phoneUids, duration);
      }
    };
  }, [isPersonalizeReady, validPhones, trackComparisonCompleted]);

  const removePhone = (index: number) => {
    const newPhones = [...phones];
    newPhones[index] = null;
    setPhones(newPhones);
  };

  const addPhone = (index: number) => {
    setSelectingSlot(index);
    setShowPhoneSelector(true);
  };

  const handlePhoneSelect = async (phone: MobilePhone) => {
    if (selectingSlot !== null) {
      const newPhones = [...phones];
      newPhones[selectingSlot] = phone;
      setPhones(newPhones);
      
      // Track phone view and update personalization attributes
      if (isPersonalizeReady) {
        await trackPhoneView({
          uid: phone.uid,
          title: typeof phone.title === 'string' ? phone.title : String(phone.title),
          brand: phone.taxonomies?.[0]?.term_uid || undefined,
          price: phone.variants?.[0]?.price || undefined
        });
        
        // If this creates a valid comparison (2+ phones), track it
        const validNewPhones = newPhones.filter(p => p !== null) as MobilePhone[];
        if (validNewPhones.length >= 2) {
          const phoneUids = validNewPhones.map(p => p.uid);
          await trackComparisonStarted(phoneUids);
          comparisonStartTime.current = Date.now();
        }
      }
    }
    setShowPhoneSelector(false);
    setSelectingSlot(null);
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
        const specs = getFieldValue(phone.specifications);
        if (!specs || typeof specs !== 'object') return 'N/A';
        return specs[specKey as keyof typeof specs] || 'N/A';
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
      const specs = getFieldValue(phone.specifications);
      if (!specs || typeof specs !== 'object') return { phone, rawValue: 'N/A', numericValue: null };
      
      const rawValue = specs[specKey as keyof typeof specs] || 'N/A';
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
        return firstVariant && typeof firstVariant === 'object' && 'price' in firstVariant ? firstVariant.price : null;
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
    
    // Safety check for valid phone count
    if (phoneCount < 0 || phoneCount > maxSlots) {
      return {
        labelWidth: '160px',
        cardColumns: '1fr',
        comparisonColumns: '1fr',
        unifiedGrid: '160px 1fr',
        cardSlots: 1,
        comparisonSlots: 0,
        phoneCount: 0,
        minPhoneColumnWidth: '280px',
        isMobile: false
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
    
    // For product cards: show phones + Add Phone slot (if not full)
    const cardSlots = Math.min(phoneCount + (phoneCount < maxSlots ? 1 : 0), maxSlots);
    const cardGridTemplate = phoneCount < maxSlots 
      ? `${labelWidth} ${phoneColumnsTemplate} minmax(${minPhoneColumnWidth}, 1fr)`
      : unifiedGrid;
    
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
      <div className="msp-loading">
        <div className="msp-spinner"></div>
        <p>Loading comparison...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="msp-error">
        <h2>Comparison Error</h2>
        <p>{error.message}</p>
        {error.code === 'INVALID_URL' && (
          <p className="msp-error-help">
            Please use the format: /compare/phone1-vs-phone2
          </p>
        )}
        <button onClick={() => navigate('/')}>
          Back to Phone List
        </button>
      </div>
    );
  }

  return (
    <div className="msp-comparison">
      <Helmet>
        <title>{validPhones.map(p => getFieldValue(p.title)).join(' vs ')} - Mobile Phone Comparison</title>
        <meta name="description" content={`Compare ${validPhones.map(p => getFieldValue(p.title)).join(', ')} specifications and prices.`} />
      </Helmet>

      {/* Phone Selector Modal */}
      {showPhoneSelector && (
        <PhoneSelector
          phones={allPhones}
          onSelect={handlePhoneSelect}
          onClose={() => {
            setShowPhoneSelector(false);
            setSelectingSlot(null);
          }}
          excludePhone={null}
        />
      )}

      {/* Image Gallery Modal */}
      {imageGallery.isOpen && imageGallery.phone && (
        <div className="msp-gallery-overlay" onClick={closeImageGallery}>
          <div className="msp-gallery-modal" onClick={(e) => e.stopPropagation()}>
            <div className="msp-gallery-header">
              <h3>{getFieldValue(imageGallery.phone?.title) || 'Phone'} - Photos</h3>
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
          style={{
            gridTemplateColumns: gridConfig.cardGrid
          }}
        >
          {/* Specification Label Column */}
          <div className="msp-spec-label-column">
            <div className="msp-spec-label-header">Compare</div>
          </div>
          
          {/* Dynamic Phone Cards - Only show filled slots + one add slot */}
          {Array.from({ length: Math.min(gridConfig.cardSlots, 4) }, (_, index) => {
            const phone = phones[index];
            return (
              <div key={index} className="msp-product-card">
                {phone ? (
                  <>
                    <button 
                      className="msp-remove-btn"
                      onClick={() => removePhone(index)}
                    >
                      <X size={16} />
                    </button>

                    <div className="msp-card-content">
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

                      <h3 className="msp-product-title" {...getEditAttributes(phone.title)}>
                        {getFieldValue(phone.title)}
                      </h3>

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

                      <div className="msp-stores">
                        {phone.amazon_link?.href && (
                          <a href={phone.amazon_link.href} target="_blank" rel="noopener noreferrer" className="msp-store">
                            <ShoppingCart size={14} />
                            Amazon
                          </a>
                        )}
                        {phone.flipkart_link?.href && (
                          <a href={phone.flipkart_link.href} target="_blank" rel="noopener noreferrer" className="msp-store">
                            <ShoppingCart size={14} />
                            Flipkart
                          </a>
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="msp-add-phone-card" onClick={() => addPhone(index)}>
                    <div className="msp-add-icon">
                      <Plus size={24} />
                    </div>
                    <span className="msp-add-text">Add Phone</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

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
                  {getFieldValue(phone.title) || 'Phone'}
                </div>
              </div>
            ))}
          </div>

          {/* Comparison Grid */}
          <div 
            className={`msp-comparison-grid ${VB_EmptyBlockParentClass}`}
            style={{
              gridTemplateColumns: gridConfig.unifiedGrid,
              gap: gridConfig.isMobile ? '8px' : '12px'
            }}
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
                            if (!phone.specifications) return 'N/A';
                            const specs = getFieldValue(phone.specifications);
                            return specs && typeof specs === 'object' ? specs[spec.key as keyof typeof specs] || 'N/A' : 'N/A';
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
                  <h4 className="msp-media-title" {...getEditAttributes(phone.title)}>{getFieldValue(phone.title)}</h4>
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