import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MobilePhone } from '../types/MobilePhone';
import contentstackService from '../services/contentstackService';
import { generateComparisonUrl } from '../utils/urlUtils';
import { Helmet } from 'react-helmet-async';
import { getEditDataAttributes, onEntryChange, getContentTypeUid } from '../utils/livePreview';
import './MobilePhoneDetail.css';

const MobilePhoneDetail: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobilePhone, setMobilePhone] = useState<MobilePhone | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);
  const [relatedPhones, setRelatedPhones] = useState<MobilePhone[]>([]);

  useEffect(() => {
    const fetchMobilePhone = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Use the current URL path to find the mobile phone by its URL field
        const currentPath = location.pathname;
        
        // Use the URL field to find the phone
        const phoneData = await contentstackService.getMobilePhoneByURL(currentPath);
        setMobilePhone(phoneData);

        // Fetch related phones if they exist
        if (phoneData.related_phones && phoneData.related_phones.length > 0) {
          const relatedUIDs = phoneData.related_phones.map(rp => rp.uid);
          const relatedPhonesData = await contentstackService.getMobilePhonesByUIDs(relatedUIDs);
          setRelatedPhones(relatedPhonesData);
        }
      } catch (err: any) {
        console.error('Error fetching mobile phone:', err);
        setError(err.message || 'Failed to load mobile phone data');
      } finally {
        setLoading(false);
      }
    };

    fetchMobilePhone();
  }, [location.pathname]);

  // Set up live preview for real-time updates
  useEffect(() => {
    const handleLivePreviewUpdate = () => {
      if (mobilePhone) {
        // Refetch data when content changes in live preview
        const currentPath = location.pathname;
        contentstackService.getMobilePhoneByURL(currentPath)
          .then(phoneData => {
            setMobilePhone(phoneData);
            console.log('📱 Live Preview: Mobile phone data updated');
          })
          .catch(err => console.error('Live Preview update failed:', err));
      }
    };

    onEntryChange(handleLivePreviewUpdate);
  }, [mobilePhone, location.pathname]);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading mobile phone details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <h2>Error Loading Phone</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>
          Try Again
        </button>
      </div>
    );
  }

  if (!mobilePhone) {
    return (
      <div className="error-container">
        <h2>Mobile Phone Not Found</h2>
        <p>The requested mobile phone could not be found.</p>
      </div>
    );
  }

  // Combine lead image with additional images for gallery
  const allImages = [mobilePhone.lead_image, ...(mobilePhone.images || [])];
  const currentImage = allImages[selectedImageIndex];
  
  const optimizedImageUrl = contentstackService.optimizeImage(
    currentImage.url,
    { width: 800, format: 'webp', quality: 90 }
  );

  return (
    <div className="mobile-phone-detail">
      {/* SEO Meta Tags - Using only content-defined SEO fields */}
      <Helmet>
        {mobilePhone.seo.meta_title && <title>{mobilePhone.seo.meta_title}</title>}
        {mobilePhone.seo.meta_description && <meta name="description" content={mobilePhone.seo.meta_description} />}
        {mobilePhone.seo.keywords && <meta name="keywords" content={mobilePhone.seo.keywords} />}
        {!mobilePhone.seo.enable_search_indexing && <meta name="robots" content="noindex, nofollow" />}
        
        {/* Open Graph - Only if SEO fields are defined */}
        {mobilePhone.seo.meta_title && <meta property="og:title" content={mobilePhone.seo.meta_title} />}
        {mobilePhone.seo.meta_description && <meta property="og:description" content={mobilePhone.seo.meta_description} />}
        <meta property="og:image" content={optimizedImageUrl} />
        <meta property="og:type" content="website" />
        
        {/* Twitter Card - Only if SEO fields are defined */}
        <meta name="twitter:card" content="summary_large_image" />
        {mobilePhone.seo.meta_title && <meta name="twitter:title" content={mobilePhone.seo.meta_title} />}
        {mobilePhone.seo.meta_description && <meta name="twitter:description" content={mobilePhone.seo.meta_description} />}
        <meta name="twitter:image" content={optimizedImageUrl} />
      </Helmet>

      {/* Hero Section */}
      <section className="hero-section" {...getEditDataAttributes(mobilePhone.uid, getContentTypeUid(mobilePhone))}>
        <div className="hero-container">
          <div className="hero-content">
            <div className="hero-text">
              {mobilePhone.tags && mobilePhone.tags.length > 0 && (
                <div className="tags-container" {...getEditDataAttributes(mobilePhone.uid, getContentTypeUid(mobilePhone), 'tags')}>
                  {mobilePhone.tags.map((tag, index) => (
                    <span key={index} className="tag">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              
              <h1 className="hero-title" {...getEditDataAttributes(mobilePhone.uid, getContentTypeUid(mobilePhone), 'title')}>
                {mobilePhone.title}
              </h1>
              
              {mobilePhone.description && (
                <p className="hero-description" {...getEditDataAttributes(mobilePhone.uid, getContentTypeUid(mobilePhone), 'description')}>
                  {mobilePhone.description}
                </p>
              )}
            </div>
            
            <div className="hero-image">
              <div className="image-gallery" {...getEditDataAttributes(mobilePhone.uid, getContentTypeUid(mobilePhone), 'lead_image')}>
                <div className="main-image-container">
                  <img
                    src={optimizedImageUrl}
                    alt={currentImage.title || mobilePhone.title}
                    className="phone-image"
                  />
                </div>
                
                {allImages.length > 1 && (
                  <div className="image-thumbnails">
                    {allImages.map((image, index) => (
                      <button
                        key={image.uid}
                        className={`thumbnail ${index === selectedImageIndex ? 'active' : ''}`}
                        onClick={() => setSelectedImageIndex(index)}
                      >
                        <img
                          src={contentstackService.optimizeImage(image.url, {
                            width: 80,
                            format: 'webp',
                            quality: 80
                          })}
                          alt={image.title || `${mobilePhone.title} view ${index + 1}`}
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
      {mobilePhone.variants && mobilePhone.variants.length > 0 && (
        <section className="pricing-section" {...getEditDataAttributes(mobilePhone.uid, getContentTypeUid(mobilePhone), 'variants')}>
          <div className="pricing-container">
            <h2 className="pricing-title">Pricing & Variants</h2>
            <p className="pricing-subtitle">Choose the variant that best fits your needs</p>
            
            <div className="variants-grid">
              {mobilePhone.variants.map((variant, index) => (
                <div 
                  key={variant._metadata.uid}
                  className="variant-card"
                >
                  <div className="variant-name">{variant.variant_name}</div>
                  <div className="variant-price">₹{variant.price.toLocaleString('en-IN')}</div>
                </div>
              ))}
            </div>
            
            {(mobilePhone.amazon_link || mobilePhone.flipkart_link) && (
              <div className="buy-links">
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
                      Buy on {mobilePhone.amazon_link.title}
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
                      Buy on {mobilePhone.flipkart_link.title}
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Specifications Section */}
      <section className="specifications-section" {...getEditDataAttributes(mobilePhone.uid, getContentTypeUid(mobilePhone), 'specifications')}>
        <div className="specs-container">
          <h2 className="specs-title">Technical Specifications</h2>
          <p className="specs-subtitle">Detailed technical information about this device</p>
          
          <div className="specs-grid">
            {mobilePhone.specifications.display_resolution && (
              <div className="spec-card">
                <div className="spec-icon">📱</div>
                <div className="spec-content">
                  <h3 className="spec-label">Display Resolution</h3>
                  <p className="spec-value" {...getEditDataAttributes(mobilePhone.uid, getContentTypeUid(mobilePhone), 'specifications.display_resolution')}>
                    {mobilePhone.specifications.display_resolution}
                  </p>
                </div>
              </div>
            )}
            
            {mobilePhone.specifications.screen_to_body_ratio && (
              <div className="spec-card">
                <div className="spec-icon">📏</div>
                <div className="spec-content">
                  <h3 className="spec-label">Screen-to-Body Ratio</h3>
                  <p className="spec-value" {...getEditDataAttributes(mobilePhone.uid, getContentTypeUid(mobilePhone), 'specifications.screen_to_body_ratio')}>
                    {mobilePhone.specifications.screen_to_body_ratio}
                  </p>
                </div>
              </div>
            )}
            
            {mobilePhone.specifications.ram && (
              <div className="spec-card">
                <div className="spec-icon">🧠</div>
                <div className="spec-content">
                  <h3 className="spec-label">RAM</h3>
                  <p className="spec-value" {...getEditDataAttributes(mobilePhone.uid, getContentTypeUid(mobilePhone), 'specifications.ram')}>
                    {mobilePhone.specifications.ram}
                  </p>
                </div>
              </div>
            )}
            
            {mobilePhone.specifications.storage && (
              <div className="spec-card">
                <div className="spec-icon">💾</div>
                <div className="spec-content">
                  <h3 className="spec-label">Storage</h3>
                  <p className="spec-value">{mobilePhone.specifications.storage}</p>
                </div>
              </div>
            )}
            
            {mobilePhone.specifications.cpu && (
              <div className="spec-card">
                <div className="spec-icon">🔧</div>
                <div className="spec-content">
                  <h3 className="spec-label">CPU</h3>
                  <p className="spec-value">{mobilePhone.specifications.cpu}</p>
                </div>
              </div>
            )}
            
            {mobilePhone.specifications.front_camera && (
              <div className="spec-card">
                <div className="spec-icon">🤳</div>
                <div className="spec-content">
                  <h3 className="spec-label">Front Camera</h3>
                  <p className="spec-value">{mobilePhone.specifications.front_camera}</p>
                </div>
              </div>
            )}
            
            {mobilePhone.specifications.rear_camera && (
              <div className="spec-card">
                <div className="spec-icon">📷</div>
                <div className="spec-content">
                  <h3 className="spec-label">Rear Camera</h3>
                  <p className="spec-value">{mobilePhone.specifications.rear_camera}</p>
                </div>
              </div>
            )}
            
            {mobilePhone.specifications.weight && (
              <div className="spec-card">
                <div className="spec-icon">⚖️</div>
                <div className="spec-content">
                  <h3 className="spec-label">Weight</h3>
                  <p className="spec-value">{mobilePhone.specifications.weight}</p>
                </div>
              </div>
            )}
            
            {mobilePhone.specifications.battery && (
              <div className="spec-card">
                <div className="spec-icon">🔋</div>
                <div className="spec-content">
                  <h3 className="spec-label">Battery</h3>
                  <p className="spec-value">{mobilePhone.specifications.battery}</p>
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
            <div className="related-phones-grid">
              {relatedPhones.map((relatedPhone) => (
                <div key={relatedPhone.uid} className="related-phone-card">
                  <div className="related-phone-image">
                    <img
                      src={contentstackService.optimizeImage(relatedPhone.lead_image.url, {
                        width: 200,
                        format: 'webp',
                        quality: 85
                      })}
                      alt={relatedPhone.title}
                      className="related-image"
                    />
                  </div>
                  <div className="related-phone-content">
                    <h3 className="related-phone-title">{relatedPhone.title}</h3>
                    {relatedPhone.variants && relatedPhone.variants.length > 0 && (
                      <p className="related-phone-price">
                        From ₹{relatedPhone.variants[0].price.toLocaleString('en-IN')}
                      </p>
                    )}
                    <div className="related-phone-actions">
                      <a 
                        href={relatedPhone.url}
                        className="view-details-btn"
                      >
                        View Details
                      </a>
                      <button
                        className="compare-btn"
                        onClick={() => {
                          const comparisonUrl = generateComparisonUrl(mobilePhone.title, relatedPhone.title);
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