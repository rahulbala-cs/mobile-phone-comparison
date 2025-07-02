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
  const [phone1, setPhone1] = useState<MobilePhone | null>(null);
  const [phone2, setPhone2] = useState<MobilePhone | null>(null);
  const [allPhones, setAllPhones] = useState<MobilePhone[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showSelector, setShowSelector] = useState<boolean>(false);
  const [selectingFor, setSelectingFor] = useState<'phone1' | 'phone2' | null>(null);

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

      const phones = await fetchAllPhones();
      
      if (phonesParam && phones.length > 0) {
        const parsedParams = parseComparisonUrl(phonesParam);
        
        if (parsedParams) {
          const foundPhone1 = findPhoneBySlug(phones, parsedParams.phone1Slug);
          const foundPhone2 = findPhoneBySlug(phones, parsedParams.phone2Slug);
          
          if (foundPhone1 && foundPhone2) {
            setPhone1(foundPhone1);
            setPhone2(foundPhone2);
          } else {
            setError('One or both phones not found');
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
    if (selectingFor === 'phone1') {
      setPhone1(phone);
    } else if (selectingFor === 'phone2') {
      setPhone2(phone);
    }
    setShowSelector(false);
    setSelectingFor(null);
  };

  const openPhoneSelector = (position: 'phone1' | 'phone2') => {
    setSelectingFor(position);
    setShowSelector(true);
  };

  const getSpecValue = (phone: MobilePhone | null, specKey: keyof MobilePhone['specifications']) => {
    return phone?.specifications[specKey] || 'N/A';
  };

  const getSpecComparison = (phone1Value: string, phone2Value: string) => {
    if (phone1Value === 'N/A' || phone2Value === 'N/A') return 'neutral';
    
    // Simple numeric comparison for certain specs
    const numericSpecs = ['ram', 'storage', 'battery'];
    
    if (numericSpecs.some(spec => phone1Value.toLowerCase().includes(spec))) {
      const num1 = parseInt(phone1Value.replace(/\D/g, ''));
      const num2 = parseInt(phone2Value.replace(/\D/g, ''));
      
      if (num1 > num2) return 'better';
      if (num1 < num2) return 'worse';
    }
    
    return 'neutral';
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

  const specs = [
    { key: 'display_resolution', label: 'Display Resolution', icon: '📱' },
    { key: 'screen_to_body_ratio', label: 'Screen-to-Body Ratio', icon: '📏' },
    { key: 'ram', label: 'RAM', icon: '🧠' },
    { key: 'storage', label: 'Storage', icon: '💾' },
    { key: 'front_camera', label: 'Front Camera', icon: '📷' },
    { key: 'weight', label: 'Weight', icon: '⚖️' },
    { key: 'battery', label: 'Battery', icon: '🔋' }
  ] as const;

  return (
    <div className="comparison-page">
      {/* SEO Meta Tags */}
      <Helmet>
        <title>
          {phone1 && phone2 
            ? `${phone1.title} vs ${phone2.title} - Mobile Phone Comparison`
            : 'Mobile Phone Comparison'
          }
        </title>
        <meta name="description" content={
          phone1 && phone2 
            ? `Compare ${phone1.title} and ${phone2.title} specifications, features, and differences side by side.`
            : 'Compare mobile phones side by side to find the best device for your needs.'
        } />
      </Helmet>

      {showSelector && (
        <PhoneSelector
          phones={allPhones}
          onSelect={handlePhoneSelect}
          onClose={() => setShowSelector(false)}
          excludePhone={selectingFor === 'phone1' ? phone2 : phone1}
        />
      )}

      <div className="comparison-container">
        <div className="comparison-header">
          <h1 className="comparison-title">Mobile Phone Comparison</h1>
          {phone1 && phone2 && (
            <p className="comparison-subtitle">
              {phone1.title} vs {phone2.title}
            </p>
          )}
        </div>

        <div className="comparison-grid">
          {/* Phone 1 Column */}
          <div className="phone-column">
            {phone1 ? (
              <>
                <div className="phone-header">
                  <div className="phone-image-container">
                    <img
                      src={contentstackService.optimizeImage(phone1.lead_image.url, {
                        width: 300,
                        format: 'webp',
                        quality: 90
                      })}
                      alt={phone1.title}
                      className="phone-comparison-image"
                    />
                  </div>
                  <h2 className="phone-title">{phone1.title}</h2>
                  {phone1.taxonomies?.brand && (
                    <span className="phone-brand">{phone1.taxonomies.brand[0]?.name}</span>
                  )}
                  <button 
                    className="change-phone-btn"
                    onClick={() => openPhoneSelector('phone1')}
                  >
                    Change Phone
                  </button>
                </div>
              </>
            ) : (
              <div className="phone-placeholder">
                <div className="placeholder-icon">📱</div>
                <h3>Select First Phone</h3>
                <button 
                  className="select-phone-btn"
                  onClick={() => openPhoneSelector('phone1')}
                >
                  Choose Phone
                </button>
              </div>
            )}
          </div>

          {/* VS Divider */}
          <div className="vs-divider">
            <span className="vs-text">VS</span>
          </div>

          {/* Phone 2 Column */}
          <div className="phone-column">
            {phone2 ? (
              <>
                <div className="phone-header">
                  <div className="phone-image-container">
                    <img
                      src={contentstackService.optimizeImage(phone2.lead_image.url, {
                        width: 300,
                        format: 'webp',
                        quality: 90
                      })}
                      alt={phone2.title}
                      className="phone-comparison-image"
                    />
                  </div>
                  <h2 className="phone-title">{phone2.title}</h2>
                  {phone2.taxonomies?.brand && (
                    <span className="phone-brand">{phone2.taxonomies.brand[0]?.name}</span>
                  )}
                  <button 
                    className="change-phone-btn"
                    onClick={() => openPhoneSelector('phone2')}
                  >
                    Change Phone
                  </button>
                </div>
              </>
            ) : (
              <div className="phone-placeholder">
                <div className="placeholder-icon">📱</div>
                <h3>Select Second Phone</h3>
                <button 
                  className="select-phone-btn"
                  onClick={() => openPhoneSelector('phone2')}
                >
                  Choose Phone
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Specifications Comparison */}
        {phone1 && phone2 && (
          <div className="specs-comparison">
            <h3 className="specs-title">Specifications Comparison</h3>
            <div className="specs-table">
              {specs.map((spec) => {
                const value1 = getSpecValue(phone1, spec.key);
                const value2 = getSpecValue(phone2, spec.key);
                const comparison = getSpecComparison(value1, value2);
                
                return (
                  <div key={spec.key} className="spec-row">
                    <div className="spec-label">
                      <span className="spec-icon">{spec.icon}</span>
                      {spec.label}
                    </div>
                    <div className={`spec-value ${comparison === 'better' ? 'better' : comparison === 'worse' ? 'worse' : ''}`}>
                      {value1}
                    </div>
                    <div className={`spec-value ${comparison === 'worse' ? 'better' : comparison === 'better' ? 'worse' : ''}`}>
                      {value2}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MobilePhoneComparison;