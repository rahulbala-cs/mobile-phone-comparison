import React, { useState } from 'react';
import { MobilePhone } from '../types/MobilePhone';
import contentstackService from '../services/contentstackService';
import { getEditAttributes, VB_EmptyBlockParentClass } from '../utils/livePreview';
import { getFieldValue } from '../types/EditableTags';
import './PhoneSelector.css';

interface PhoneSelectorProps {
  phones: MobilePhone[];
  onSelect: (phone: MobilePhone) => void;
  onClose: () => void;
  excludePhone?: MobilePhone | null;
  isLoading?: boolean;
}

const PhoneSelector: React.FC<PhoneSelectorProps> = ({ 
  phones, 
  onSelect, 
  onClose, 
  excludePhone,
  isLoading = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPhones = phones.filter(phone => {
    const phoneTitle = getFieldValue(phone.title) || '';
    const phoneTags = getFieldValue(phone.tags) || [];
    const matchesSearch = phoneTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (Array.isArray(phoneTags) && phoneTags.some((tag: any) => {
                           const tagValue = typeof tag === 'string' ? tag : String(tag || '');
                           return tagValue.toLowerCase().includes(searchTerm.toLowerCase());
                         }));
    const isNotExcluded = !excludePhone || phone.uid !== excludePhone.uid;
    
    return matchesSearch && isNotExcluded;
  });

  const handlePhoneSelect = (phone: MobilePhone) => {
    onSelect(phone);
  };

  return (
    <div className="phone-selector-overlay">
      <div className="phone-selector-modal">
        {isLoading && (
          <div className="phone-selector-loading">
            <div className="loading-spinner"></div>
            <p>Adding phone to comparison...</p>
          </div>
        )}
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

        <div className={`phones-grid ${filteredPhones.length ? '' : VB_EmptyBlockParentClass}`}>
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
                  alt={getFieldValue(phone.title)}
                  {...getEditAttributes(phone.lead_image)}
                />
              </div>
              <div className="phone-selector-info">
                {(() => {
                  const tags = getFieldValue(phone.tags);
                  return Array.isArray(tags) && tags.length > 0 && (
                    <span className="phone-selector-brand">
                      {getFieldValue(tags[0]) || tags[0]}
                    </span>
                  );
                })()}
                <h4 className="phone-selector-title" {...getEditAttributes(phone.title)}>{getFieldValue(phone.title)}</h4>
                <div className="phone-quick-specs">
                  {phone.specifications?.ram && (
                    <span className="quick-spec">
                      RAM: <span {...getEditAttributes(phone.specifications.ram)}>{getFieldValue(phone.specifications.ram)}</span>
                    </span>
                  )}
                  {phone.specifications?.storage && (
                    <span className="quick-spec">
                      Storage: <span {...getEditAttributes(phone.specifications.storage)}>{getFieldValue(phone.specifications.storage)}</span>
                    </span>
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