import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MobilePhone } from '../types/MobilePhone';
import contentstackService from '../services/contentstackService';
import { generateComparisonUrl } from '../utils/urlUtils';
import { onEntryChange, onLiveEdit, getEditAttributes } from '../utils/livePreview';
import { getFieldValue } from '../types/EditableTags';
import { usePersonalize, usePageView, usePhoneTracking, useSearchTracking, useUserAttributes } from '../hooks/usePersonalize';
import './MobilePhoneList.css';

const MobilePhoneList: React.FC = () => {
  const navigate = useNavigate();
  const [mobilePhones, setMobilePhones] = useState<MobilePhone[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPhones, setSelectedPhones] = useState<MobilePhone[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(9); // Show 9 items per page
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filteredPhones, setFilteredPhones] = useState<MobilePhone[]>([]);

  // Personalization hooks
  const { getVariantParam, isReady: isPersonalizeReady } = usePersonalize();
  const { trackPhoneView } = usePhoneTracking();
  const { trackSearch } = useSearchTracking();
  const { userAttributes } = useUserAttributes();
  
  // Track page view
  usePageView('/browse', 'Browse Mobile Phones - Mobile Compare', {
    trackOnMount: true,
    trackOnChange: true
  });

  // Fetch mobile phones data with personalization
  useEffect(() => {
    const fetchMobilePhones = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get variant parameter for personalization
        const variantParam = getVariantParam();
        
        // Fetch regular phones
        const phones = await contentstackService.getAllMobilePhones(variantParam || undefined);
        setMobilePhones(phones);
        
        // Fetch personalized recommendations if user has attributes
        if (isPersonalizeReady && Object.keys(userAttributes).length > 0) {
          try {
            const personalizedRecommendations = await contentstackService.getPersonalizedMobilePhoneRecommendations(
              userAttributes,
              variantParam || undefined,
              20 // Get more for personalized section
            );
            
            // For now, we'll just log the personalized recommendations
            // In a full implementation, you could display them separately
            console.log('Personalized recommendations:', personalizedRecommendations.length);
          } catch (personalizedError) {
            console.warn('Failed to fetch personalized recommendations:', personalizedError);
            // Continue with regular phones
          }
        }
        
        // Track search event for browse page
        if (isPersonalizeReady) {
          await trackSearch('browse_all', {}, phones.length);
        }
        
      } catch (err: any) {
        console.error('Error fetching mobile phones:', err);
        setError(err.message || 'Failed to load mobile phones');
      } finally {
        setLoading(false);
      }
    };

    fetchMobilePhones();
  }, [getVariantParam, isPersonalizeReady, userAttributes, trackSearch]);

  // Exact items that fit in viewport
  useEffect(() => {
    const updateItemsPerPage = () => {
      const width = window.innerWidth;
      
      if (width <= 480) {
        setItemsPerPage(3); // 1x3 grid (exactly 3 items)
      } else if (width <= 768) {
        setItemsPerPage(6); // 2x3 grid (exactly 6 items)
      } else {
        setItemsPerPage(9); // 3x3 grid (exactly 9 items)
      }
    };

    updateItemsPerPage();
    window.addEventListener('resize', updateItemsPerPage);
    return () => window.removeEventListener('resize', updateItemsPerPage);
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

  // Filter phones based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredPhones(mobilePhones);
    } else {
      const query = searchQuery.toLowerCase().trim();
      const filtered = mobilePhones.filter(phone => {
        const title = getFieldValue(phone.title).toLowerCase();
        const description = getFieldValue(phone.description).toLowerCase();
        
        // Search in specifications too
        const specs = phone.specifications || {};
        const specsText = Object.values(specs).join(' ').toLowerCase();
        
        return title.includes(query) || 
               description.includes(query) || 
               specsText.includes(query);
      });
      setFilteredPhones(filtered);
    }
    // Reset to page 1 when search changes
    setCurrentPage(1);
  }, [mobilePhones, searchQuery]);

  // Pagination logic using filtered phones
  const totalPages = Math.ceil(filteredPhones.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPhones = filteredPhones.slice(startIndex, endIndex);

  // Reset to page 1 if current page is out of bounds after items per page change
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  // Event handlers with personalization tracking
  const handlePhoneSelect = async (phone: MobilePhone) => {
    if (selectedPhones.find(p => p.uid === phone.uid)) {
      // Remove if already selected
      setSelectedPhones(selectedPhones.filter(p => p.uid !== phone.uid));
    } else if (selectedPhones.length < 4) {
      // Add if less than 4 selected
      setSelectedPhones([...selectedPhones, phone]);
      
      // Track phone interaction for personalization
      if (isPersonalizeReady) {
        await trackPhoneView({
          uid: phone.uid,
          title: typeof phone.title === 'string' ? phone.title : String(phone.title),
          brand: phone.taxonomies?.[0]?.term_uid || undefined,
          price: phone.variants?.[0]?.price || undefined
        });
      }
    }
  };

  const handleCompare = () => {
    if (selectedPhones.length >= 2) {
      const comparisonUrl = generateComparisonUrl(...selectedPhones.map(p => getFieldValue(p.title)));
      navigate(comparisonUrl);
    }
  };

  const clearSelection = () => {
    setSelectedPhones([]);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top of the phone list
    const phoneList = document.querySelector('.phones-grid');
    if (phoneList) {
      phoneList.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handlePrevious = () => {
    if (currentPage > 1) {
      handlePageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      handlePageChange(currentPage + 1);
    }
  };

  // Early returns after all hooks
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
        <p className="list-subtitle">Compare the latest mobile phones and their specifications • {mobilePhones.length} phones available</p>
        
        {/* Search/Filter Input */}
        <div className="search-container">
          <div className="search-input-wrapper">
            <input
              type="text"
              placeholder="Search phones by name, brand, or specs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            {searchQuery && (
              <button 
                className="search-clear"
                onClick={() => setSearchQuery('')}
                title="Clear search"
              >
                ✕
              </button>
            )}
          </div>
          {searchQuery && (
            <p className="search-results">
              {filteredPhones.length} phone{filteredPhones.length !== 1 ? 's' : ''} found for "{searchQuery}"
            </p>
          )}
        </div>
        
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
                    <span {...getEditAttributes(phone.title)}>{getFieldValue(phone.title)}</span>
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
        
        {/* No search results message */}
        {searchQuery && filteredPhones.length === 0 && (
          <div className="no-results-container">
            <h3>No phones found</h3>
            <p>No phones match your search for "{searchQuery}"</p>
            <button 
              className="clear-search-btn"
              onClick={() => setSearchQuery('')}
            >
              Clear search to see all phones
            </button>
          </div>
        )}
        
        <div className="phones-grid">
          {currentPhones.map((phone) => {
            const isSelected = selectedPhones.find(p => p.uid === phone.uid);
            const canSelect = selectedPhones.length < 4 || isSelected;
            
            return (
              <div key={phone.uid} className="phone-card-wrapper">
                <Link 
                  to={getFieldValue(phone.url)}
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
                        alt={phone.lead_image.title || getFieldValue(phone.title)}
                        className="phone-card-image"
                        {...getEditAttributes(phone.lead_image)}
                      />
                    </div>
                    
                    <div className="phone-card-content">
                      {phone.tags && (phone.tags as any[])?.length > 0 && (
                        <div className="phone-brand">
                          {getFieldValue((phone.tags as any[])[0])}
                        </div>
                      )}
                      
                      <h3 className="phone-card-title" {...getEditAttributes(phone.title)}>{getFieldValue(phone.title)}</h3>
                      
                      {phone.description && (
                        <p className="phone-card-description" {...getEditAttributes(phone.description)}>
                          {getFieldValue(phone.description).length > 100 
                            ? `${getFieldValue(phone.description).substring(0, 100)}...` 
                            : getFieldValue(phone.description)
                          }
                        </p>
                      )}
                      
                      {phone.variants && (phone.variants as any[])?.length > 0 && (
                        <div className="phone-pricing">
                          <span className="price-label">From</span>
                          <span className="price-value" {...getEditAttributes((phone.variants as any[])[0]?.price)}>₹{getFieldValue((phone.variants as any[])[0]?.price).toLocaleString('en-IN')}</span>
                        </div>
                      )}

                      <div className="phone-key-specs">
                        {(phone.specifications as any)?.cpu && (
                          <span className="key-spec">
                            <strong>CPU:</strong> <span {...getEditAttributes((phone.specifications as any)?.cpu)}>{getFieldValue((phone.specifications as any).cpu)}</span>
                          </span>
                        )}
                        {(phone.specifications as any)?.ram && (
                          <span className="key-spec">
                            <strong>RAM:</strong> <span {...getEditAttributes((phone.specifications as any)?.ram)}>{getFieldValue((phone.specifications as any).ram)}</span>
                          </span>
                        )}
                        {(phone.specifications as any)?.storage && (
                          <span className="key-spec">
                            <strong>Storage:</strong> <span {...getEditAttributes((phone.specifications as any)?.storage)}>{getFieldValue((phone.specifications as any).storage)}</span>
                          </span>
                        )}
                        {(phone.specifications as any)?.rear_camera && (
                          <span className="key-spec">
                            <strong>Camera:</strong> <span {...getEditAttributes((phone.specifications as any)?.rear_camera)}>{getFieldValue((phone.specifications as any).rear_camera)}</span>
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
        
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="pagination-container">
            <button 
              className="pagination-btn pagination-prev"
              onClick={handlePrevious}
              disabled={currentPage === 1}
            >
              Previous
            </button>
            
            <div className="pagination-numbers">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  className={`pagination-number ${currentPage === page ? 'active' : ''}`}
                  onClick={() => handlePageChange(page)}
                >
                  {page}
                </button>
              ))}
            </div>
            
            <button 
              className="pagination-btn pagination-next"
              onClick={handleNext}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </div>
        )}
        
        {/* Page Info */}
        <div className="page-info">
          Showing {startIndex + 1}-{Math.min(endIndex, mobilePhones.length)} of {mobilePhones.length} phones
        </div>
      </div>
    </div>
  );
};

export default MobilePhoneList;