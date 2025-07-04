import React, { useState } from 'react';
import { MobilePhone } from '../types/MobilePhone';
import contentstackService from '../services/contentstackService';
import './PhoneSelector.css';

interface PhoneSelectorProps {
  phones: MobilePhone[];
  onSelect: (phone: MobilePhone) => void;
  onClose: () => void;
  excludePhone?: MobilePhone | null;
}

const PhoneSelector: React.FC<PhoneSelectorProps> = ({ 
  phones, 
  onSelect, 
  onClose, 
  excludePhone 
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPhones = phones.filter(phone => {
    const matchesSearch = phone.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (phone.tags && (phone.tags as any[])?.some((tag: any) => tag.toLowerCase().includes(searchTerm.toLowerCase())));
    const isNotExcluded = !excludePhone || phone.uid !== excludePhone.uid;
    
    return matchesSearch && isNotExcluded;
  });

  const handlePhoneSelect = (phone: MobilePhone) => {
    onSelect(phone);
  };

  return (
    <div className="phone-selector-overlay">
      <div className="phone-selector-modal">
        <div className="selector-header">
          <h3>Select a Phone</h3>
          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>
        
        <div className="search-container">
          <input
            type="text"
            placeholder="Search phones..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="phones-grid">
          {filteredPhones.map((phone) => (
            <div
              key={phone.uid}
              className="phone-selector-card"
              onClick={() => handlePhoneSelect(phone)}
            >
              <div className="phone-selector-image">
                <img
                  src={contentstackService.optimizeImage(phone.lead_image.url, {
                    width: 120,
                    format: 'webp',
                    quality: 80
                  })}
                  alt={phone.title}
                />
              </div>
              <div className="phone-selector-info">
                {phone.tags && (phone.tags as any[])?.length > 0 && (
                  <span className="phone-selector-brand">
                    {(phone.tags as any[])[0]}
                  </span>
                )}
                <h4 className="phone-selector-title">{phone.title}</h4>
                <div className="phone-quick-specs">
                  {(phone.specifications as any)?.ram && (
                    <span className="quick-spec">RAM: {(phone.specifications as any).ram}</span>
                  )}
                  {(phone.specifications as any)?.storage && (
                    <span className="quick-spec">Storage: {(phone.specifications as any).storage}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredPhones.length === 0 && (
          <div className="no-results">
            <p>No phones found matching your search.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PhoneSelector;