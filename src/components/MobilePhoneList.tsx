import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MobilePhone } from '../types/MobilePhone';
import contentstackService from '../services/contentstackService';
import './MobilePhoneList.css';

const MobilePhoneList: React.FC = () => {
  const [mobilePhones, setMobilePhones] = useState<MobilePhone[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMobilePhones = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const phones = await contentstackService.getAllMobilePhones();
        setMobilePhones(phones);
      } catch (err: any) {
        console.error('Error fetching mobile phones:', err);
        setError(err.message || 'Failed to load mobile phones');
      } finally {
        setLoading(false);
      }
    };

    fetchMobilePhones();
  }, []);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading mobile phones...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <h2>Error Loading Phones</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>
          Try Again
        </button>
      </div>
    );
  }

  if (mobilePhones.length === 0) {
    return (
      <div className="empty-container">
        <h2>No Mobile Phones Found</h2>
        <p>No mobile phone entries are currently available.</p>
      </div>
    );
  }

  return (
    <div className="mobile-phone-list">
      <div className="list-container">
        <h1 className="list-title">Mobile Phone Comparison</h1>
        <p className="list-subtitle">Compare the latest mobile phones and their specifications</p>
        
        <div className="phones-grid">
          {mobilePhones.map((phone) => (
            <Link 
              key={phone.uid} 
              to={phone.url}
              className="phone-card-link"
            >
              <div className="phone-card">
                <div className="phone-image-container">
                  <img
                    src={contentstackService.optimizeImage(phone.lead_image.url, {
                      width: 300,
                      format: 'webp',
                      quality: 85
                    })}
                    alt={phone.lead_image.title || phone.title}
                    className="phone-card-image"
                  />
                </div>
                
                <div className="phone-card-content">
                  {phone.taxonomies?.brand && phone.taxonomies.brand.length > 0 && (
                    <div className="phone-brand">
                      {phone.taxonomies.brand[0].name}
                    </div>
                  )}
                  
                  <h3 className="phone-card-title">{phone.title}</h3>
                  
                  {phone.description && (
                    <p className="phone-card-description">
                      {phone.description.length > 100 
                        ? `${phone.description.substring(0, 100)}...` 
                        : phone.description
                      }
                    </p>
                  )}
                  
                  <div className="phone-key-specs">
                    {phone.specifications.ram && (
                      <span className="key-spec">
                        <strong>RAM:</strong> {phone.specifications.ram}
                      </span>
                    )}
                    {phone.specifications.storage && (
                      <span className="key-spec">
                        <strong>Storage:</strong> {phone.specifications.storage}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MobilePhoneList;