import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { X, ShoppingCart, Eye, Plus } from 'lucide-react';
import { MobilePhone, getFieldValue } from '../types/MobilePhone';
import contentstackService from '../services/contentstackService';
import { parseComparisonUrl, findPhoneBySlug } from '../utils/urlUtils';
import { onEntryChange } from '../utils/livePreview';
import PhoneSelector from './PhoneSelector';
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

  // Main data fetching function
  const loadComparison = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all phones first
      const allPhonesData = await contentstackService.getAllMobilePhones();
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
  }, [phonesParam]);

  // Initial data fetch
  useEffect(() => {
    loadComparison();
  }, [loadComparison]);

  // Set up Live Preview using standard V3.0 pattern
  useEffect(() => {
    onEntryChange(loadComparison);
  }, [loadComparison]);

  const removePhone = (index: number) => {
    const newPhones = [...phones];
    newPhones[index] = null;
    setPhones(newPhones);
  };

  const addPhone = (index: number) => {
    setSelectingSlot(index);
    setShowPhoneSelector(true);
  };

  const handlePhoneSelect = (phone: MobilePhone) => {
    if (selectingSlot !== null) {
      const newPhones = [...phones];
      newPhones[selectingSlot] = phone;
      setPhones(newPhones);
    }
    setShowPhoneSelector(false);
    setSelectingSlot(null);
  };

  const getImageCount = (phone: MobilePhone) => {
    if (phone.images && phone.images.length > 0) {
      return phone.images.length;
    }
    return 1; // At least lead_image
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
  };

  // Helper function to check if all phones have the same value for a spec
  const hasDifferences = useCallback((specKey: string) => {
    const validPhones = phones.filter((phone): phone is MobilePhone => phone !== null);
    if (validPhones.length < 2) return true;
    
    const values = validPhones.map(phone => {
      if (!phone?.specifications) return 'N/A';
      const specs = getFieldValue(phone.specifications);
      if (!specs || typeof specs !== 'object') return 'N/A';
      return specs[specKey as keyof typeof specs] || 'N/A';
    });
    const uniqueValues = new Set(values);
    return uniqueValues.size > 1;
  }, [phones]);

  // Define all specifications with their labels
  const specifications = [
    { key: 'cpu', label: 'Processor' },
    { key: 'ram', label: 'RAM' },
    { key: 'storage', label: 'Storage' },
    { key: 'rear_camera', label: 'Rear Camera' },
    { key: 'front_camera', label: 'Front Camera' },
    { key: 'display_resolution', label: 'Display' },
    { key: 'screen_to_body_ratio', label: 'Screen-to-Body Ratio' },
    { key: 'battery', label: 'Battery' },
    { key: 'weight', label: 'Weight' }
  ];

  // Filter specs based on "Show Only Differences" toggle
  const filteredSpecs = showOnlyDifferences 
    ? specifications.filter(spec => hasDifferences(spec.key))
    : specifications;

  const getPrice = useCallback((phone: MobilePhone) => {
    if (!phone?.variants) return null;
    
    const variants = getFieldValue(phone.variants);
    if (variants && Array.isArray(variants) && variants.length > 0) {
      const firstVariant = variants[0];
      return firstVariant && typeof firstVariant === 'object' && 'price' in firstVariant ? firstVariant.price : null;
    }
    return null;
  }, []);

  const validPhones = phones.filter(phone => phone !== null) as MobilePhone[];

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
      <div className="msp-product-cards">
        {phones.map((phone, index) => (
          <div key={index} className="msp-product-card">
            {phone ? (
              <>
                <button 
                  className="msp-remove-btn"
                  onClick={() => removePhone(index)}
                >
                  <X size={16} />
                </button>

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

                <h3 className="msp-product-title">
                  {getFieldValue(phone.title)}
                </h3>

                <div className="msp-price">
                  {getPrice(phone) && (
                    <>
                      <span className="msp-starts-from">Starts from</span>
                      <div className="msp-price-amount">
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
        ))}
      </div>

      {/* Overview Section */}
      <section className="msp-overview">
        <div className="msp-section-header">
          <h2>Overview</h2>
          <label className="msp-toggle">
            <input
              type="checkbox"
              checked={showOnlyDifferences}
              onChange={(e) => setShowOnlyDifferences(e.target.checked)}
            />
            Show Only Differences
          </label>
        </div>

        {/* Comparison Grid */}
        <div className="msp-comparison-grid">
          {/* Dynamic Specifications */}
          {filteredSpecs.map((spec) => (
            <React.Fragment key={spec.key}>
              <div className="msp-spec-label">{spec.label}</div>
              {phones.map((phone, index) => (
                <div 
                  key={`${spec.key}-${index}`} 
                  className="msp-spec-value"
                >
                  {phone ? (
                    <div className="msp-spec-content">
                      <span className="msp-spec-text">
                        {(() => {
                          if (!phone.specifications) return 'N/A';
                          const specs = getFieldValue(phone.specifications);
                          return specs && typeof specs === 'object' ? specs[spec.key as keyof typeof specs] || 'N/A' : 'N/A';
                        })()} 
                      </span>
                    </div>
                  ) : (
                    '-'
                  )}
                </div>
              ))}
            </React.Fragment>
          ))}

          {/* Price - Always show */}
          <div className="msp-spec-label">Price</div>
          {phones.map((phone, index) => (
            <div key={`price-${index}`} className="msp-spec-value">
              {phone && getPrice(phone) ? (
                <div className="msp-price-comparison">
                  <div className="msp-price-item">
                    <ShoppingCart size={12} />
                    <span>₹ {getPrice(phone)?.toLocaleString('en-IN')}</span>
                    <span className="msp-store-name">Starting Price</span>
                  </div>
                </div>
              ) : (
                <span>-</span>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Photos and Videos */}
      {validPhones.length > 0 && (
        <section className="msp-media">
          <h2>Photos and Videos</h2>
          <div className="msp-media-grid">
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
                  <h4 className="msp-media-title">{getFieldValue(phone.title)}</h4>
                </div>
              )
            ))}
          </div>
        </section>
      )}

      {/* Empty State Message */}
      {validPhones.length === 0 && (
        <div className="msp-empty-state">
          <div className="msp-empty-icon">📱</div>
          <h3>Start Your Comparison</h3>
          <p>Click "Add Phone" above to select phones and start comparing specifications, prices, and features.</p>
        </div>
      )}
    </div>
  );
};

export default MobilePhoneComparison;