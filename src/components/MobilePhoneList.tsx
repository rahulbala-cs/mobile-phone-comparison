import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MobilePhone } from '../types/MobilePhone';
import contentstackService from '../services/contentstackService';
import { generateComparisonUrl } from '../utils/urlUtils';
import './MobilePhoneList.css';

const MobilePhoneList: React.FC = () => {
  const navigate = useNavigate();
  const [mobilePhones, setMobilePhones] = useState<MobilePhone[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPhones, setSelectedPhones] = useState<MobilePhone[]>([]);

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

  const handlePhoneSelect = (phone: MobilePhone) => {
    if (selectedPhones.find(p => p.uid === phone.uid)) {
      // Remove if already selected
      setSelectedPhones(selectedPhones.filter(p => p.uid !== phone.uid));
    } else if (selectedPhones.length < 2) {
      // Add if less than 2 selected
      setSelectedPhones([...selectedPhones, phone]);
    }
  };

  const handleCompare = () => {
    if (selectedPhones.length === 2) {
      const comparisonUrl = generateComparisonUrl(selectedPhones[0].title, selectedPhones[1].title);
      navigate(comparisonUrl);
    }
  };

  const clearSelection = () => {
    setSelectedPhones([]);
  };

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
        
        {/* Comparison Bar */}
        {selectedPhones.length > 0 && (
          <div className="comparison-bar">
            <div className="selected-phones">
              <span className="selection-text">
                {selectedPhones.length === 1 
                  ? 'Select one more phone to compare' 
                  : 'Ready to compare!'
                }
              </span>
              <div className="selected-phones-list">
                {selectedPhones.map((phone) => (
                  <div key={phone.uid} className="selected-phone-item">
                    <span>{phone.title}</span>
                    <button 
                      className="remove-btn"
                      onClick={() => handlePhoneSelect(phone)}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div className="comparison-actions">
              <button 
                className="compare-btn"
                onClick={handleCompare}
                disabled={selectedPhones.length !== 2}
              >
                Compare Now
              </button>
              <button 
                className="clear-btn"
                onClick={clearSelection}
              >
                Clear
              </button>
            </div>
          </div>
        )}
        
        <div className="phones-grid">
          {mobilePhones.map((phone) => {
            const isSelected = selectedPhones.find(p => p.uid === phone.uid);
            const canSelect = selectedPhones.length < 2 || isSelected;
            
            return (
              <div key={phone.uid} className="phone-card-wrapper">
                <Link 
                  to={phone.url}
                  className="phone-card-link"
                >
                  <div className={`phone-card ${isSelected ? 'selected' : ''}`}>
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
                
                {/* Selection Checkbox */}
                <div className="selection-overlay">
                  <button
                    className={`selection-checkbox ${isSelected ? 'checked' : ''} ${!canSelect ? 'disabled' : ''}`}
                    onClick={(e) => {
                      e.preventDefault();
                      if (canSelect) {
                        handlePhoneSelect(phone);
                      }
                    }}
                    disabled={!canSelect}
                  >
                    {isSelected ? '✓' : '+'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default MobilePhoneList;