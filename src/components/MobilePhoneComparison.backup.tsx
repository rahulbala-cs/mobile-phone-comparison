import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { MobilePhone } from '../types/MobilePhone';
import contentstackService from '../services/contentstackService';
import { parseComparisonUrl, findPhoneBySlug } from '../utils/urlUtils';
import PhoneSelector from './PhoneSelector';
import './MobilePhoneComparison.css';

const MobilePhoneComparison: React.FC = () => {
  const { phones: phonesParam } = useParams<{ phones: string }>();
  const navigate = useNavigate();
  const [phones, setPhones] = useState<(MobilePhone | null)[]>([null, null, null, null]);
  const [allPhones, setAllPhones] = useState<MobilePhone[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showSelector, setShowSelector] = useState<boolean>(false);
  const [selectingFor, setSelectingFor] = useState<number | null>(null);

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

  const handlePhoneSelect = (phone: MobilePhone) => {
    if (selectingFor !== null) {
      const newPhones = [...phones];
      newPhones[selectingFor] = phone;
      setPhones(newPhones);
    }
    setShowSelector(false);
    setSelectingFor(null);
  };

  const openPhoneSelector = (position: number) => {
    setSelectingFor(position);
    setShowSelector(true);
  };

  const removePhone = (position: number) => {
    const newPhones = [...phones];
    newPhones[position] = null;
    setPhones(newPhones);
  };

  const getSpecValue = (phone: MobilePhone | null, specKey: keyof MobilePhone['specifications']) => {
    return phone?.specifications[specKey] || '';
  };

  const getSpecComparison = (values: (string | number)[], specKey: string) => {
    const numericSpecs = ['ram', 'storage', 'battery', 'weight', 'front_camera', 'rear_camera'];
    const higherIsBetter = ['ram', 'storage', 'battery', 'front_camera', 'rear_camera'];
    const lowerIsBetter = ['weight'];
    
    if (!numericSpecs.includes(specKey)) {
      return values.map(() => 'neutral');
    }

    const numericValues = values.map(val => {
      if (typeof val === 'string' && val) {
        const match = val.match(/(\d+(?:\.\d+)?)/);
        return match ? parseFloat(match[1]) : 0;
      }
      return 0;
    });

    const maxValue = Math.max(...numericValues);
    const minValue = Math.min(...numericValues);
    
    return numericValues.map(val => {
      if (val === 0) return 'neutral';
      
      if (higherIsBetter.includes(specKey)) {
        return val === maxValue ? 'best' : val === minValue ? 'worst' : 'neutral';
      } else if (lowerIsBetter.includes(specKey)) {
        return val === minValue ? 'best' : val === maxValue ? 'worst' : 'neutral';
      }
      
      return 'neutral';
    });
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading comparison...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <h2>Comparison Error</h2>
        <p>{error}</p>
        <button onClick={() => navigate('/')}>
          Back to Phone List
        </button>
      </div>
    );
  }

  const validPhones = phones.filter(phone => phone !== null) as MobilePhone[];
  const specs = [
    { key: 'display_resolution', label: 'Display Resolution', icon: '📱', unit: '' },
    { key: 'screen_to_body_ratio', label: 'Screen-to-Body Ratio', icon: '📏', unit: '%' },
    { key: 'cpu', label: 'CPU', icon: '🔧', unit: '' },
    { key: 'ram', label: 'RAM', icon: '🧠', unit: 'GB' },
    { key: 'storage', label: 'Storage', icon: '💾', unit: 'GB' },
    { key: 'front_camera', label: 'Front Camera', icon: '🤳', unit: 'MP' },
    { key: 'rear_camera', label: 'Rear Camera', icon: '📷', unit: 'MP' },
    { key: 'battery', label: 'Battery', icon: '🔋', unit: 'mAh' },
    { key: 'weight', label: 'Weight', icon: '⚖️', unit: 'g' }
  ] as const;

  return (
    <div className="comparison-page">
      <Helmet>
        <title>
          {validPhones.length > 0 
            ? `${validPhones.map(p => p.title).join(' vs ')} - Mobile Phone Comparison`
            : 'Mobile Phone Comparison'
          }
        </title>
        <meta name="description" content={
          validPhones.length > 0 
            ? `Compare ${validPhones.map(p => p.title).join(', ')} specifications and features side by side.`
            : 'Compare up to 4 mobile phones side by side to find the best device for your needs.'
        } />
      </Helmet>

      {showSelector && (
        <PhoneSelector
          phones={allPhones}
          onSelect={handlePhoneSelect}
          onClose={() => setShowSelector(false)}
          excludePhone={null}
        />
      )}

      <div className="comparison-container">
        <div className="comparison-header">
          <h1 className="comparison-title">Mobile Phone Comparison</h1>
          <p className="comparison-subtitle">
            {validPhones.length > 0 
              ? `Comparing ${validPhones.length} phone${validPhones.length > 1 ? 's' : ''}`
              : 'Select phones to compare'
            }
          </p>
        </div>

        {/* Phone Selection Grid */}
        <div className="phone-selection-grid">
          {phones.map((phone, index) => (
            <div key={index} className="phone-selection-slot">
              {phone ? (
                <div className="selected-phone-card">
                  <div className="phone-image-wrapper">
                    <img
                      src={contentstackService.optimizeImage(phone.lead_image.url, {
                        width: 200,
                        format: 'webp',
                        quality: 90
                      })}
                      alt={phone.title}
                      className="phone-comparison-image"
                    />
                  </div>
                  <div className="phone-info">
                    <h3 className="phone-title">{phone.title}</h3>
                    <div className="phone-actions">
                      <button 
                        className="change-phone-btn"
                        onClick={() => openPhoneSelector(index)}
                      >
                        Change
                      </button>
                      <button 
                        className="remove-phone-btn"
                        onClick={() => removePhone(index)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="empty-phone-slot">
                  <div className="empty-slot-content">
                    <div className="empty-icon">📱</div>
                    <p className="empty-text">
                      {index < 2 ? 'Required' : 'Optional'}
                    </p>
                    <button 
                      className="add-phone-btn"
                      onClick={() => openPhoneSelector(index)}
                    >
                      Add Phone
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Specifications Comparison Table */}
        {validPhones.length >= 2 && (
          <div className="specs-comparison-section">
            <h2 className="specs-section-title">Detailed Specifications</h2>
            <div className="specs-comparison-table">
              <div className="specs-table-header">
                <div className="spec-label-header">Specification</div>
                {phones.map((phone, index) => (
                  <div key={index} className="phone-header-cell">
                    {phone ? (
                      <div className="phone-header-content">
                        <div className="phone-mini-image">
                          <img
                            src={contentstackService.optimizeImage(phone.lead_image.url, {
                              width: 60,
                              format: 'webp',
                              quality: 80
                            })}
                            alt={phone.title}
                          />
                        </div>
                        <span className="phone-mini-title">{phone.title}</span>
                      </div>
                    ) : (
                      <div className="empty-header">-</div>
                    )}
                  </div>
                ))}
              </div>

              {specs.map((spec) => {
                const values = phones.map(phone => getSpecValue(phone, spec.key));
                const comparisons = getSpecComparison(values, spec.key);
                
                return (
                  <div key={spec.key} className="spec-row">
                    <div className="spec-label-cell">
                      <span className="spec-icon">{spec.icon}</span>
                      <span className="spec-name">{spec.label}</span>
                    </div>
                    {values.map((value, index) => (
                      <div 
                        key={index} 
                        className={`spec-value-cell ${comparisons[index]} ${phones[index] ? 'has-phone' : 'no-phone'}`}
                      >
                        {phones[index] && (
                          <>
                            <span className="spec-value">{value || 'N/A'}</span>
                            {comparisons[index] === 'best' && (
                              <span className="comparison-badge best">Best</span>
                            )}
                            {comparisons[index] === 'worst' && (
                              <span className="comparison-badge worst">Lowest</span>
                            )}
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {validPhones.length < 2 && (
          <div className="no-comparison-message">
            <div className="message-icon">🔍</div>
            <h3>Ready to Compare?</h3>
            <p>Select at least 2 phones to see a detailed comparison of their specifications and features.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MobilePhoneComparison;