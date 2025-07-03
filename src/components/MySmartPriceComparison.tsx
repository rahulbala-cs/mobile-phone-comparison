import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { X, Star, ShoppingCart, Eye, Plus } from 'lucide-react';
import { MobilePhone } from '../types/MobilePhone';
import contentstackService from '../services/contentstackService';
import { parseComparisonUrl, findPhoneBySlug } from '../utils/urlUtils';
import PhoneSelector from './PhoneSelector';
import './MySmartPriceComparison.css';

const MySmartPriceComparison: React.FC = () => {
  const { phones: phonesParam } = useParams<{ phones: string }>();
  const navigate = useNavigate();
  
  const [phones, setPhones] = useState<(MobilePhone | null)[]>([null, null, null, null]);
  const [allPhones, setAllPhones] = useState<MobilePhone[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showOnlyDifferences, setShowOnlyDifferences] = useState<boolean>(false);
  const [showPhoneSelector, setShowPhoneSelector] = useState<boolean>(false);
  const [selectingSlot, setSelectingSlot] = useState<number | null>(null);
  const [imageGallery, setImageGallery] = useState<{ phone: MobilePhone; isOpen: boolean }>({ phone: null as any, isOpen: false });

  useEffect(() => {
    const fetchAllPhones = async () => {
      try {
        const phones = await contentstackService.getAllMobilePhones();
        setAllPhones(phones);
        return phones;
      } catch (err: any) {
        console.error('Error fetching phones:', err);
        setError('Failed to load mobile phones');
        return [];
      }
    };

    const loadComparison = async () => {
      setLoading(true);
      setError(null);

      const allPhonesData = await fetchAllPhones();
      
      if (phonesParam && allPhonesData.length > 0) {
        const slugs = parseComparisonUrl(phonesParam);
        
        if (slugs && slugs.length >= 2) {
          const foundPhones = slugs.map(slug => findPhoneBySlug(allPhonesData, slug));
          
          if (foundPhones.every(phone => phone !== null)) {
            const newPhones = [null, null, null, null];
            foundPhones.forEach((phone, index) => {
              if (index < 4) newPhones[index] = phone;
            });
            setPhones(newPhones);
          } else {
            setError('One or more phones not found');
          }
        } else {
          setError('Invalid comparison URL format');
        }
      }
      
      setLoading(false);
    };

    loadComparison();
  }, [phonesParam]);

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
    setImageGallery({ phone, isOpen: true });
  };

  const closeImageGallery = () => {
    setImageGallery({ phone: null as any, isOpen: false });
  };

  // Helper function to check if all phones have the same value for a spec
  const hasDifferences = (specKey: keyof MobilePhone['specifications']) => {
    const validPhones = phones.filter(phone => phone !== null) as MobilePhone[];
    if (validPhones.length < 2) return true;
    
    const values = validPhones.map(phone => phone.specifications[specKey] || 'N/A');
    const uniqueValues = new Set(values);
    return uniqueValues.size > 1;
  };

  // Define all specifications with their labels
  const specifications = [
    { key: 'cpu' as const, label: 'Processor' },
    { key: 'ram' as const, label: 'RAM' },
    { key: 'storage' as const, label: 'Storage' },
    { key: 'rear_camera' as const, label: 'Rear Camera' },
    { key: 'front_camera' as const, label: 'Front Camera' },
    { key: 'display_resolution' as const, label: 'Display' },
    { key: 'screen_to_body_ratio' as const, label: 'Screen-to-Body Ratio' },
    { key: 'battery' as const, label: 'Battery' },
    { key: 'weight' as const, label: 'Weight' }
  ];

  // Filter specs based on "Show Only Differences" toggle
  const filteredSpecs = showOnlyDifferences 
    ? specifications.filter(spec => hasDifferences(spec.key))
    : specifications;

  const getExpertScore = (phone: MobilePhone) => {
    // Will be populated from CMS field later
    return null;
  };

  const getPrice = (phone: MobilePhone) => {
    if (phone.variants && phone.variants.length > 0) {
      return phone.variants[0].price;
    }
    return null;
  };

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
        <p>{error}</p>
        <button onClick={() => navigate('/compare')}>
          Go to Comparison
        </button>
      </div>
    );
  }

  return (
    <div className="msp-comparison">
      <Helmet>
        <title>{validPhones.map(p => p.title).join(' vs ')} - Mobile Phone Comparison</title>
        <meta name="description" content={`Compare ${validPhones.map(p => p.title).join(', ')} specifications and prices.`} />
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
              <h3>{imageGallery.phone.title} - Photos</h3>
              <button className="msp-gallery-close" onClick={closeImageGallery}>
                <X size={24} />
              </button>
            </div>
            <div className="msp-gallery-content">
              <div className="msp-gallery-main">
                <img
                  src={contentstackService.optimizeImage(imageGallery.phone.lead_image.url, {
                    width: 600,
                    format: 'webp',
                    quality: 90
                  })}
                  alt={imageGallery.phone.title}
                  className="msp-gallery-main-image"
                />
              </div>
              {imageGallery.phone.images && imageGallery.phone.images.length > 0 && (
                <div className="msp-gallery-thumbnails">
                  <img
                    src={contentstackService.optimizeImage(imageGallery.phone.lead_image.url, {
                      width: 100,
                      format: 'webp',
                      quality: 80
                    })}
                    alt="Main"
                    className="msp-gallery-thumb active"
                  />
                  {imageGallery.phone.images.map((image, index) => (
                    <img
                      key={image.uid}
                      src={contentstackService.optimizeImage(image.url, {
                        width: 100,
                        format: 'webp',
                        quality: 80
                      })}
                      alt={`${imageGallery.phone.title} ${index + 1}`}
                      className="msp-gallery-thumb"
                    />
                  ))}
                </div>
              )}
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
                
                {getExpertScore(phone) && (
                  <div className="msp-rating">
                    <Star className="msp-star" size={14} />
                    <span>{getExpertScore(phone)}</span>
                  </div>
                )}

                <div className="msp-product-image">
                  <img
                    src={contentstackService.optimizeImage(phone.lead_image.url, {
                      width: 200,
                      format: 'webp',
                      quality: 90
                    })}
                    alt={phone.title}
                  />
                </div>

                {index < phones.length - 1 && <div className="msp-vs-badge">VS</div>}

                <h3 className="msp-product-title">{phone.title}</h3>

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
                  {phone.amazon_link && (
                    <a href={phone.amazon_link.href} target="_blank" rel="noopener noreferrer" className="msp-store">
                      <ShoppingCart size={14} />
                      Amazon
                    </a>
                  )}
                  {phone.flipkart_link && (
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

      {/* Sticky Phone Headers */}
      <div className="msp-sticky-headers">
        <div className="msp-sticky-label">Comparing</div>
        {phones.map((phone, index) => (
          <div key={index} className="msp-sticky-phone">
            {phone ? (
              <>
                <img
                  src={contentstackService.optimizeImage(phone.lead_image.url, {
                    width: 40,
                    format: 'webp',
                    quality: 80
                  })}
                  alt={phone.title}
                  className="msp-sticky-image"
                />
                <span className="msp-sticky-name">{phone.title}</span>
              </>
            ) : (
              <span className="msp-sticky-empty">-</span>
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
                <div key={`${spec.key}-${index}`} className="msp-spec-value">
                  {phone ? (phone.specifications[spec.key] || 'N/A') : '-'}
                </div>
              ))}
            </React.Fragment>
          ))}

          {/* Price - Always show regardless of differences toggle */}
          <div className="msp-spec-label">Price</div>
          {phones.map((phone, index) => (
            <div key={`price-${index}`} className="msp-spec-value">
              {phone && getPrice(phone) ? (
                <div className="msp-price-comparison">
                  <div className="msp-price-item">
                    <ShoppingCart size={12} />
                    <span>₹ {getPrice(phone)?.toLocaleString('en-IN')}</span>
                    <span className="msp-store-name">Amazon</span>
                  </div>
                  <div className="msp-price-item">
                    <ShoppingCart size={12} />
                    <span>₹ {(getPrice(phone)! + 1000).toLocaleString('en-IN')}</span>
                    <span className="msp-store-name">Flipkart</span>
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
                    <img
                      src={contentstackService.optimizeImage(phone.lead_image.url, {
                        width: 150,
                        format: 'webp',
                        quality: 80
                      })}
                      alt={phone.title}
                    />
                    <div className="msp-media-overlay">
                      <Eye size={16} />
                      <span>{getImageCount(phone)} PHOTOS</span>
                    </div>
                    <div className="msp-image-stack">
                      <div className="msp-stack-layer msp-stack-3"></div>
                      <div className="msp-stack-layer msp-stack-2"></div>
                      <div className="msp-stack-layer msp-stack-1"></div>
                    </div>
                  </div>
                  <h4 className="msp-media-title">{phone.title}</h4>
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

export default MySmartPriceComparison;