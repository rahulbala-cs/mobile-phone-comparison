import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { MobilePhone } from '../types/MobilePhone';
import { generateComparisonUrl } from '../utils/urlUtils';
import { Helmet } from 'react-helmet-async';
import { onEntryChange, onLiveEdit, VB_EmptyBlockParentClass, getEditAttributes } from '../utils/livePreview';
import { getFieldValue } from '../types/EditableTags';
import contentstackService from '../services/contentstackService';
import NotFound from './NotFound';
import './MobilePhoneDetail.css';

const MobilePhoneDetail: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();
  const [mobilePhone, setMobilePhone] = useState<MobilePhone | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState<boolean>(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);
  const [relatedPhones, setRelatedPhones] = useState<MobilePhone[]>([]);

  // Determine what to fetch: URL or fallback to default UID
  const currentPath = location.pathname;
  const isRootPath = currentPath === '/';
  const defaultUid = process.env.REACT_APP_MOBILE_PHONE_UID;

  // Main data fetching function
  const fetchMobilePhone = async () => {
    try {
      setLoading(true);
      setError(null);
      setNotFound(false);
      
      let phone: MobilePhone;
      
      if (isRootPath && defaultUid) {
        // Use default UID for home page
        phone = await contentstackService.getMobilePhoneByUID(defaultUid);
      } else if (slug) {
        // For /mobile/:slug or /mobiles/:slug routes
        // First try to find by URL field in CMS (e.g., /mobiles/samsung-galaxy-s24-ultra)
        try {
          phone = await contentstackService.getMobilePhoneByURL(currentPath);
          console.log(`📱 Found phone by URL: ${currentPath}`);
        } catch (urlError) {
          // If URL lookup fails, try as direct UID
          if (slug.startsWith('blt') && slug.length === 19) {
            try {
              phone = await contentstackService.getMobilePhoneByUID(slug);
              console.log(`📱 Found phone by UID: ${slug}`);
            } catch (uidError) {
              console.warn(`Phone not found by URL or UID: ${currentPath}`, uidError);
              setNotFound(true);
              return;
            }
          } else {
            console.warn(`Phone not found by URL: ${currentPath}`, urlError);
            setNotFound(true);
            return;
          }
        }
      } else {
        // Try URL-based fetch first
        try {
          phone = await contentstackService.getMobilePhoneByURL(currentPath);
        } catch (urlError) {
          // For specific routes like /mobile/something or /mobiles/something, don't fallback - show 404
          if (currentPath.startsWith('/mobile/') || currentPath.startsWith('/mobiles/')) {
            console.warn(`Phone not found by URL: ${currentPath}`, urlError);
            setNotFound(true);
            return;
          }
          
          // Fallback to default UID for other routes
          if (defaultUid) {
            phone = await contentstackService.getMobilePhoneByUID(defaultUid);
          } else {
            throw urlError;
          }
        }
      }
      
      setMobilePhone(phone);
      
      // Fetch related phones if they exist
      if (phone.related_phones && phone.related_phones.length > 0) {
        try {
          const relatedUIDs = phone.related_phones.map(rp => rp.uid);
          const related = await contentstackService.getMobilePhonesByUIDs(relatedUIDs);
          setRelatedPhones(related);
        } catch (relatedError) {
          console.warn('Failed to fetch related phones:', relatedError);
        }
      }
      
    } catch (err: any) {
      console.error('Error fetching mobile phone:', err);
      setError(err.message || 'Failed to load mobile phone data');
    } finally {
      setLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchMobilePhone();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPath]);

  // Set up Live Preview and Visual Builder using V3.0+ pattern
  useEffect(() => {
    onEntryChange(fetchMobilePhone); // For Live Preview
    onLiveEdit(fetchMobilePhone);    // For Visual Builder
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading mobile phone details...</p>
      </div>
    );
  }

  if (notFound) {
    return <NotFound />;
  }

  if (error) {
    return (
      <div className="error-container">
        <h2>Error Loading Phone</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>
          Try Again
        </button>
        <button onClick={() => navigate('/')} style={{ marginLeft: '10px' }}>
          Go to Phone List
        </button>
      </div>
    );
  }

  if (!mobilePhone) {
    return (
      <div className="error-container">
        <h2>Mobile Phone Not Found</h2>
        <p>The requested mobile phone could not be found.</p>
        <button onClick={() => navigate('/')}>
          View All Phones
        </button>
      </div>
    );
  }

  // Combine lead image with additional images for gallery
  const allImages = [mobilePhone.lead_image, ...(mobilePhone.images || [])].filter(Boolean);
  const currentImage = allImages[selectedImageIndex] || mobilePhone.lead_image;
  
  const optimizedImageUrl = contentstackService.optimizeImage(
    currentImage?.url || '',
    { width: 800, format: 'webp', quality: 90 }
  );

  return (
    <div className="mobile-phone-detail">
      {/* SEO Meta Tags */}
      <Helmet>
        {mobilePhone.seo?.meta_title && <title>{getFieldValue(mobilePhone.seo.meta_title)}</title>}
        {mobilePhone.seo?.meta_description && <meta name="description" content={getFieldValue(mobilePhone.seo.meta_description)} />}
        {mobilePhone.seo?.keywords && <meta name="keywords" content={getFieldValue(mobilePhone.seo.keywords)} />}
        {mobilePhone.seo && !mobilePhone.seo.enable_search_indexing && <meta name="robots" content="noindex, nofollow" />}
        
        <meta property="og:image" content={optimizedImageUrl} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content={optimizedImageUrl} />
      </Helmet>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-container">
          <div className="hero-content">
            <div className="hero-text">
              {mobilePhone.tags && Array.isArray(mobilePhone.tags) && (
                <div className="tags-container">
                  {mobilePhone.tags.map((tag: any, index: number) => (
                    <span key={index} className="tag" {...getEditAttributes(tag)}>
                      {getFieldValue(tag)}
                    </span>
                  ))}
                </div>
              )}
              
              <h1 className="hero-title" {...getEditAttributes(mobilePhone.title)}>
                {getFieldValue(mobilePhone.title)}
              </h1>
              
              {mobilePhone.description && (
                <p className="hero-description" {...getEditAttributes(mobilePhone.description)}>
                  {getFieldValue(mobilePhone.description)}
                </p>
              )}
            </div>
            
            <div className="hero-image">
              <div className="image-gallery">
                <div className="main-image-container">
                  {currentImage?.url && (
                    <img
                      src={optimizedImageUrl}
                      alt={getFieldValue(mobilePhone.title) || 'Mobile phone'}
                      className="phone-image"
                      {...getEditAttributes(selectedImageIndex === 0 ? mobilePhone.lead_image : mobilePhone.images?.[selectedImageIndex - 1])}
                    />
                  )}
                </div>
                
                {allImages.length > 1 && (
                  <div className="image-thumbnails">
                    {allImages.map((image, index) => (
                      <button
                        key={`${image.uid}-${index}`}
                        className={`thumbnail ${index === selectedImageIndex ? 'active' : ''}`}
                        onClick={() => setSelectedImageIndex(index)}
                      >
                        <img
                          src={contentstackService.optimizeImage(image.url, {
                            width: 80,
                            format: 'webp',
                            quality: 80
                          })}
                          alt={image.title || `${getFieldValue(mobilePhone.title)} view ${index + 1}`}
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing and Variants Section */}
      {mobilePhone.variants && Array.isArray(mobilePhone.variants) && mobilePhone.variants.length > 0 && (
        <section className="pricing-section">
          <div className="pricing-container">
            <h2 className="pricing-title">Pricing & Variants</h2>
            <p className="pricing-subtitle">Choose the variant that best fits your needs</p>
            
            <div className={`variants-grid ${VB_EmptyBlockParentClass}`}>
              {mobilePhone.variants.map((variant: any, index: number) => (
                <div 
                  key={variant._metadata?.uid || index}
                  className="variant-card"
                >
                  <div className="variant-name" {...getEditAttributes(variant.variant_name)}>{getFieldValue(variant.variant_name)}</div>
                  <div className="variant-price" {...getEditAttributes(variant.price)}>₹{getFieldValue(variant.price)?.toLocaleString('en-IN')}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Buy Links Section */}
      {(mobilePhone.amazon_link || mobilePhone.flipkart_link) && (
        <section className="buy-links-section">
          <div className="buy-links-container">
            <h3 className="buy-links-title">Buy Now</h3>
            <div className="buy-buttons">
              {mobilePhone.amazon_link && (
                <a 
                  href={mobilePhone.amazon_link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="buy-button amazon"
                >
                  <span className="buy-icon">🛒</span>
                  Buy on <span {...getEditAttributes(mobilePhone.amazon_link.title)}>{getFieldValue(mobilePhone.amazon_link.title)}</span>
                </a>
              )}
              {mobilePhone.flipkart_link && (
                <a 
                  href={mobilePhone.flipkart_link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="buy-button flipkart"
                >
                  <span className="buy-icon">🛍️</span>
                  Buy on <span {...getEditAttributes(mobilePhone.flipkart_link.title)}>{getFieldValue(mobilePhone.flipkart_link.title)}</span>
                </a>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Specifications Section */}
      <section className="specifications-section">
        <div className="specs-container">
          <h2 className="specs-title">Technical Specifications</h2>
          <p className="specs-subtitle">Detailed technical information about this device</p>
          
          <div className={`specs-grid ${VB_EmptyBlockParentClass}`}>
            {mobilePhone.specifications?.display_resolution && (
              <div className="spec-card">
                <div className="spec-icon">📱</div>
                <div className="spec-content">
                  <h3 className="spec-label">Display Resolution</h3>
                  <p className="spec-value" {...getEditAttributes(mobilePhone.specifications.display_resolution)}>{getFieldValue(mobilePhone.specifications.display_resolution)}</p>
                </div>
              </div>
            )}
            
            {mobilePhone.specifications?.screen_to_body_ratio && (
              <div className="spec-card">
                <div className="spec-icon">📏</div>
                <div className="spec-content">
                  <h3 className="spec-label">Screen-to-Body Ratio</h3>
                  <p className="spec-value" {...getEditAttributes(mobilePhone.specifications.screen_to_body_ratio)}>{getFieldValue(mobilePhone.specifications.screen_to_body_ratio)}</p>
                </div>
              </div>
            )}
            
            {mobilePhone.specifications?.ram && (
              <div className="spec-card">
                <div className="spec-icon">🧠</div>
                <div className="spec-content">
                  <h3 className="spec-label">RAM</h3>
                  <p className="spec-value" {...getEditAttributes(mobilePhone.specifications.ram)}>{getFieldValue(mobilePhone.specifications.ram)}</p>
                </div>
              </div>
            )}
            
            {mobilePhone.specifications?.storage && (
              <div className="spec-card">
                <div className="spec-icon">💾</div>
                <div className="spec-content">
                  <h3 className="spec-label">Storage</h3>
                  <p className="spec-value" {...getEditAttributes(mobilePhone.specifications.storage)}>{getFieldValue(mobilePhone.specifications.storage)}</p>
                </div>
              </div>
            )}
            
            {mobilePhone.specifications?.cpu && (
              <div className="spec-card">
                <div className="spec-icon">🔧</div>
                <div className="spec-content">
                  <h3 className="spec-label">CPU</h3>
                  <p className="spec-value" {...getEditAttributes(mobilePhone.specifications.cpu)}>{getFieldValue(mobilePhone.specifications.cpu)}</p>
                </div>
              </div>
            )}
            
            {mobilePhone.specifications?.front_camera && (
              <div className="spec-card">
                <div className="spec-icon">🤳</div>
                <div className="spec-content">
                  <h3 className="spec-label">Front Camera</h3>
                  <p className="spec-value" {...getEditAttributes(mobilePhone.specifications.front_camera)}>{getFieldValue(mobilePhone.specifications.front_camera)}</p>
                </div>
              </div>
            )}
            
            {mobilePhone.specifications?.rear_camera && (
              <div className="spec-card">
                <div className="spec-icon">📷</div>
                <div className="spec-content">
                  <h3 className="spec-label">Rear Camera</h3>
                  <p className="spec-value" {...getEditAttributes(mobilePhone.specifications.rear_camera)}>{getFieldValue(mobilePhone.specifications.rear_camera)}</p>
                </div>
              </div>
            )}
            
            {mobilePhone.specifications?.weight && (
              <div className="spec-card">
                <div className="spec-icon">⚖️</div>
                <div className="spec-content">
                  <h3 className="spec-label">Weight</h3>
                  <p className="spec-value" {...getEditAttributes(mobilePhone.specifications.weight)}>{getFieldValue(mobilePhone.specifications.weight)}</p>
                </div>
              </div>
            )}
            
            {mobilePhone.specifications?.battery && (
              <div className="spec-card">
                <div className="spec-icon">🔋</div>
                <div className="spec-content">
                  <h3 className="spec-label">Battery</h3>
                  <p className="spec-value" {...getEditAttributes(mobilePhone.specifications.battery)}>{getFieldValue(mobilePhone.specifications.battery)}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Related Phones Section */}
      {relatedPhones.length > 0 && (
        <section className="related-phones-section">
          <div className="related-container">
            <h2 className="related-title">Related Phones</h2>
            <p className="related-subtitle">You might also be interested in these phones</p>
            <div className={`related-phones-grid ${VB_EmptyBlockParentClass}`}>
              {relatedPhones.map((relatedPhone) => (
                <div key={relatedPhone.uid} className="related-phone-card">
                  <div className="related-phone-image">
                    <img
                      src={contentstackService.optimizeImage(relatedPhone.lead_image.url, {
                        width: 200,
                        format: 'webp',
                        quality: 85
                      })}
                      alt={getFieldValue(relatedPhone.title) || 'Related phone'}
                      className="related-image"
                      {...getEditAttributes(relatedPhone.lead_image)}
                    />
                  </div>
                  <div className="related-phone-content">
                    <h3 className="related-phone-title" {...getEditAttributes(relatedPhone.title)}>
                      {getFieldValue(relatedPhone.title)}
                    </h3>
                    {relatedPhone.variants && Array.isArray(relatedPhone.variants) && relatedPhone.variants.length > 0 && (
                      <p className="related-phone-price" {...getEditAttributes(relatedPhone.variants[0].price)}>
                        From ₹{getFieldValue(relatedPhone.variants[0].price)?.toLocaleString('en-IN')}
                      </p>
                    )}
                    <div className="related-phone-actions">
                      <a 
                        href={getFieldValue(relatedPhone.url)}
                        className="view-details-btn"
                      >
                        View Details
                      </a>
                      <button
                        className="compare-btn"
                        onClick={() => {
                          const currentTitle = typeof mobilePhone.title === 'string' ? mobilePhone.title : String(mobilePhone.title);
                          const relatedTitle = typeof relatedPhone.title === 'string' ? relatedPhone.title : String(relatedPhone.title);
                          const comparisonUrl = generateComparisonUrl(currentTitle, relatedTitle);
                          navigate(comparisonUrl);
                        }}
                      >
                        Compare
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default MobilePhoneDetail;