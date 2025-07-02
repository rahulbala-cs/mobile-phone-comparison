import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { MobilePhone } from '../types/MobilePhone';
import contentstackService from '../services/contentstackService';
import { Helmet } from 'react-helmet-async';
import './MobilePhoneDetail.css';

const MobilePhoneDetail: React.FC = () => {
  const location = useLocation();
  const [mobilePhone, setMobilePhone] = useState<MobilePhone | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

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
      } catch (err: any) {
        console.error('Error fetching mobile phone:', err);
        setError(err.message || 'Failed to load mobile phone data');
      } finally {
        setLoading(false);
      }
    };

    fetchMobilePhone();
  }, [location.pathname]);

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

  const optimizedImageUrl = contentstackService.optimizeImage(
    mobilePhone.lead_image.url,
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
      <section className="hero-section">
        <div className="hero-container">
          <div className="hero-content">
            <div className="hero-text">
              {mobilePhone.taxonomies?.brand && mobilePhone.taxonomies.brand.length > 0 && (
                <div className="brand-tags">
                  {mobilePhone.taxonomies.brand.map((brand) => (
                    <span key={brand.uid} className="brand-tag">
                      {brand.name}
                    </span>
                  ))}
                </div>
              )}
              
              <h1 className="hero-title">{mobilePhone.title}</h1>
              
              {mobilePhone.description && (
                <p className="hero-description">{mobilePhone.description}</p>
              )}
            </div>
            
            <div className="hero-image">
              <img
                src={optimizedImageUrl}
                alt={mobilePhone.lead_image.title || mobilePhone.title}
                className="phone-image"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Specifications Section */}
      <section className="specifications-section">
        <div className="specs-container">
          <h2 className="specs-title">Technical Specifications</h2>
          
          <div className="specs-grid">
            {mobilePhone.specifications.display_resolution && (
              <div className="spec-card">
                <div className="spec-icon">📱</div>
                <div className="spec-content">
                  <h3 className="spec-label">Display Resolution</h3>
                  <p className="spec-value">{mobilePhone.specifications.display_resolution}</p>
                </div>
              </div>
            )}
            
            {mobilePhone.specifications.screen_to_body_ratio && (
              <div className="spec-card">
                <div className="spec-icon">📏</div>
                <div className="spec-content">
                  <h3 className="spec-label">Screen-to-Body Ratio</h3>
                  <p className="spec-value">{mobilePhone.specifications.screen_to_body_ratio}</p>
                </div>
              </div>
            )}
            
            {mobilePhone.specifications.ram && (
              <div className="spec-card">
                <div className="spec-icon">🧠</div>
                <div className="spec-content">
                  <h3 className="spec-label">RAM</h3>
                  <p className="spec-value">{mobilePhone.specifications.ram}</p>
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
            
            {mobilePhone.specifications.front_camera && (
              <div className="spec-card">
                <div className="spec-icon">📷</div>
                <div className="spec-content">
                  <h3 className="spec-label">Front Camera</h3>
                  <p className="spec-value">{mobilePhone.specifications.front_camera}</p>
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
    </div>
  );
};

export default MobilePhoneDetail;