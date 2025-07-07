import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MobilePhone } from '../types/MobilePhone';
import contentstackService from '../services/contentstackService';
import { generateComparisonUrl } from '../utils/urlUtils';
import { onEntryChange, onLiveEdit, VB_EmptyBlockParentClass, getEditAttributes } from '../utils/livePreview';
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

  // Set up Live Preview and Visual Builder for real-time updates using V3.0+ pattern
  useEffect(() => {
    const updateData = async () => {
      try {
        const phones = await contentstackService.getAllMobilePhones();
        setMobilePhones(phones);
      } catch (err) {
        console.error('Live Preview update failed:', err);
      }
    };

    onEntryChange(updateData); // For Live Preview
    onLiveEdit(updateData);    // For Visual Builder
  }, []);

  const handlePhoneSelect = (phone: MobilePhone) => {
    if (selectedPhones.find(p => p.uid === phone.uid)) {
      // Remove if already selected
      setSelectedPhones(selectedPhones.filter(p => p.uid !== phone.uid));
    } else if (selectedPhones.length < 4) {
      // Add if less than 4 selected
      setSelectedPhones([...selectedPhones, phone]);
    }
  };

  const handleCompare = () => {
    if (selectedPhones.length >= 2) {
      const comparisonUrl = generateComparisonUrl(...selectedPhones.map(p => p.title));
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
                  ? 'Select at least one more phone to compare (up to 4 total)' 
                  : selectedPhones.length < 4
                    ? `${selectedPhones.length} phones selected - add more or compare now`
                    : 'Maximum 4 phones selected - ready to compare!'
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
                disabled={selectedPhones.length < 2}
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
        
        <div className={`phones-grid ${VB_EmptyBlockParentClass}`}>
          {mobilePhones.map((phone) => {
            const isSelected = selectedPhones.find(p => p.uid === phone.uid);
            const canSelect = selectedPhones.length < 4 || isSelected;
            
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
                      {phone.tags && (phone.tags as any[])?.length > 0 && (
                        <div className="phone-brand">
                          {(phone.tags as any[])[0]}
                        </div>
                      )}
                      
                      <h3 className="phone-card-title" {...getEditAttributes(phone.title)}>{phone.title}</h3>
                      
                      {phone.description && (
                        <p className="phone-card-description" {...getEditAttributes(phone.description)}>
                          {phone.description.length > 100 
                            ? `${phone.description.substring(0, 100)}...` 
                            : phone.description
                          }
                        </p>
                      )}
                      
                      {phone.variants && (phone.variants as any[])?.length > 0 && (
                        <div className="phone-pricing">
                          <span className="price-label">From</span>
                          <span className="price-value" {...getEditAttributes((phone.variants as any[])[0]?.price)}>₹{(phone.variants as any[])[0].price.toLocaleString('en-IN')}</span>
                        </div>
                      )}

                      <div className="phone-key-specs">
                        {(phone.specifications as any)?.cpu && (
                          <span className="key-spec">
                            <strong>CPU:</strong> <span {...getEditAttributes((phone.specifications as any)?.cpu)}>{(phone.specifications as any).cpu}</span>
                          </span>
                        )}
                        {(phone.specifications as any)?.ram && (
                          <span className="key-spec">
                            <strong>RAM:</strong> <span {...getEditAttributes((phone.specifications as any)?.ram)}>{(phone.specifications as any).ram}</span>
                          </span>
                        )}
                        {(phone.specifications as any)?.storage && (
                          <span className="key-spec">
                            <strong>Storage:</strong> <span {...getEditAttributes((phone.specifications as any)?.storage)}>{(phone.specifications as any).storage}</span>
                          </span>
                        )}
                        {(phone.specifications as any)?.rear_camera && (
                          <span className="key-spec">
                            <strong>Camera:</strong> <span {...getEditAttributes((phone.specifications as any)?.rear_camera)}>{(phone.specifications as any).rear_camera}</span>
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