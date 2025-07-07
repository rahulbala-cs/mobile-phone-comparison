// MINIMAL Visual Builder Test Component
import React, { useState, useEffect } from 'react';
import { initializeLivePreview, onEntryChange, onLiveEdit, getEditAttributes, isPreviewMode } from '../utils/livePreview';
import contentstackService from '../services/contentstackService';
import { MobilePhone } from '../types/MobilePhone';
import { FALLBACK_CONFIG } from '../config/fallbacks';

const VisualBuilderTest: React.FC = () => {
  const [phone, setPhone] = useState<MobilePhone | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize Live Preview
  useEffect(() => {
    initializeLivePreview().catch(console.error);
  }, []);

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const defaultUid = process.env.REACT_APP_MOBILE_PHONE_UID || FALLBACK_CONFIG.ENVIRONMENT.DEFAULT_MOBILE_UID;
        const phoneData = await contentstackService.getMobilePhoneByUID(defaultUid);
        setPhone(phoneData);
      } catch (error) {
        console.error('Failed to fetch phone data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Set up live preview listeners
  useEffect(() => {
    const updateData = async () => {
      try {
        const defaultUid = process.env.REACT_APP_MOBILE_PHONE_UID || FALLBACK_CONFIG.ENVIRONMENT.DEFAULT_MOBILE_UID;
        const phoneData = await contentstackService.getMobilePhoneByUID(defaultUid);
        setPhone(phoneData);
      } catch (error) {
        console.error('Live preview update failed:', error);
      }
    };

    onEntryChange(updateData);
    onLiveEdit(updateData);
  }, []);

  if (loading) return <div>Loading...</div>;
  if (!phone) return <div>No phone data found</div>;

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      {/* Enhanced Debug Info */}
      <div style={{ 
        background: '#f0f0f0', 
        padding: '15px', 
        marginBottom: '20px',
        borderRadius: '4px',
        fontFamily: 'monospace',
        fontSize: '12px'
      }}>
        <h3 style={{ marginTop: 0, fontFamily: 'sans-serif' }}>Visual Builder Debug Info</h3>
        <p><strong>Preview Mode:</strong> {isPreviewMode() ? 'YES ✅' : 'NO ❌'}</p>
        <p><strong>URL:</strong> {window.location.href}</p>
        <p><strong>Entry UID:</strong> {phone.uid}</p>
        <p><strong>Title $ property:</strong> {(phone.title as any)?.$ ? 'YES ✅' : 'NO ❌'}</p>
        {(phone.title as any)?.$ && (
          <div style={{ background: '#e8f5e8', padding: '5px', margin: '5px 0' }}>
            <strong>Title Edit Attrs:</strong> {JSON.stringify((phone.title as any).$, null, 2)}
          </div>
        )}
        <p><strong>Description $ property:</strong> {(phone.description as any)?.$ ? 'YES ✅' : 'NO ❌'}</p>
        <p><strong>Specifications $ property:</strong> {(phone.specifications as any)?.$ ? 'YES ✅' : 'NO ❌'}</p>
        <p><strong>Lead Image $ property:</strong> {(phone.lead_image as any)?.$ ? 'YES ✅' : 'NO ❌'}</p>
        
        {/* Show raw field structure */}
        <details style={{ marginTop: '10px' }}>
          <summary><strong>Raw Field Structure (Click to expand)</strong></summary>
          <pre style={{ background: '#fff', padding: '10px', overflow: 'auto', maxHeight: '200px' }}>
            {JSON.stringify({
              title: phone.title,
              description: phone.description ? (typeof phone.description === 'string' ? phone.description.substring(0, 50) + '...' : phone.description) : null,
              lead_image_structure: phone.lead_image ? { url: phone.lead_image.url, $: (phone.lead_image as any).$ } : null
            }, null, 2)}
          </pre>
        </details>
      </div>

      {/* Test Content with Edit Tags - Visual Indicators */}
      <div style={{ border: '2px dashed #007bff', padding: '10px', marginBottom: '10px', position: 'relative' }}>
        <div style={{ position: 'absolute', top: '-10px', left: '10px', background: '#007bff', color: 'white', padding: '2px 8px', fontSize: '10px', borderRadius: '3px' }}>
          TITLE (should be editable in VB)
        </div>
        <h1 {...getEditAttributes(phone.title)} style={{ color: '#333', marginBottom: '10px' }}>
          {phone.title}
        </h1>
      </div>

      <div style={{ border: '2px dashed #28a745', padding: '10px', marginBottom: '20px', position: 'relative' }}>
        <div style={{ position: 'absolute', top: '-10px', left: '10px', background: '#28a745', color: 'white', padding: '2px 8px', fontSize: '10px', borderRadius: '3px' }}>
          DESCRIPTION (should be editable in VB)
        </div>
        <p {...getEditAttributes(phone.description)} style={{ color: '#666', marginBottom: '0' }}>
          {phone.description}
        </p>
      </div>

      {/* Image with edit tags */}
      {phone.lead_image && (
        <div style={{ border: '2px dashed #dc3545', padding: '10px', marginBottom: '20px', position: 'relative' }}>
          <div style={{ position: 'absolute', top: '-10px', left: '10px', background: '#dc3545', color: 'white', padding: '2px 8px', fontSize: '10px', borderRadius: '3px' }}>
            LEAD IMAGE (should be editable in VB)
          </div>
          <img 
            {...getEditAttributes(phone.lead_image)}
            src={phone.lead_image.url} 
            alt={phone.title}
            style={{ maxWidth: '300px', height: 'auto', display: 'block' }}
          />
        </div>
      )}

      {/* Specifications */}
      {phone.specifications && (
        <div style={{ border: '2px dashed #6f42c1', padding: '15px', marginBottom: '20px', position: 'relative' }}>
          <div style={{ position: 'absolute', top: '-10px', left: '10px', background: '#6f42c1', color: 'white', padding: '2px 8px', fontSize: '10px', borderRadius: '3px' }}>
            SPECIFICATIONS (should be editable in VB)
          </div>
          <h2 style={{ marginTop: '10px' }}>Specifications</h2>
          <ul>
            {phone.specifications.cpu && (
              <li style={{ marginBottom: '8px' }}>
                <strong>CPU:</strong> 
                <span {...getEditAttributes(phone.specifications.cpu)} style={{ background: '#f8f9fa', padding: '2px 4px', marginLeft: '5px' }}>
                  {phone.specifications.cpu}
                </span>
              </li>
            )}
            {phone.specifications.ram && (
              <li style={{ marginBottom: '8px' }}>
                <strong>RAM:</strong> 
                <span {...getEditAttributes(phone.specifications.ram)} style={{ background: '#f8f9fa', padding: '2px 4px', marginLeft: '5px' }}>
                  {phone.specifications.ram}
                </span>
              </li>
            )}
          </ul>
        </div>
      )}

      {/* Instructions */}
      <div style={{ 
        background: '#e8f4fd', 
        padding: '15px', 
        marginTop: '30px',
        borderRadius: '4px',
        border: '1px solid #bee5eb'
      }}>
        <h3>Visual Builder Test Instructions:</h3>
        <ol>
          <li>Access this page through Contentstack Visual Builder</li>
          <li>Hover over the title, description, and specifications</li>
          <li>You should see edit buttons/highlights appear</li>
          <li>Click to edit and verify changes appear in real-time</li>
        </ol>
        <p><strong>URL to use in Visual Builder:</strong></p>
        <code>http://localhost:3000/visual-builder-test</code>
      </div>
    </div>
  );
};

export default VisualBuilderTest;