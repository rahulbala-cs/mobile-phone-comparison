import React, { useState, useEffect } from 'react';
import { getFieldValue } from '../types/EditableTags';
import contentstackService from '../services/contentstackService';
import { generatePhoneSlug } from '../utils/urlUtils';

interface DebugPhoneInfo {
  uid: string;
  title: string;
  slug: string;
  url?: string;
}

const DebugPhones: React.FC = () => {
  const [phones, setPhones] = useState<DebugPhoneInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPhones = async () => {
      try {
        setLoading(true);
        const allPhones = await contentstackService.getAllMobilePhones();
        
        const debugInfo: DebugPhoneInfo[] = allPhones.map(phone => {
          const titleValue = getFieldValue(phone.title);
          const urlValue = getFieldValue(phone.url);
          return {
            uid: phone.uid,
            title: titleValue,
            slug: generatePhoneSlug(titleValue),
            url: urlValue
          };
        });
        
        setPhones(debugInfo.sort((a, b) => a.title.localeCompare(b.title)));
      } catch (err: any) {
        setError(err.message || 'Failed to load phones');
      } finally {
        setLoading(false);
      }
    };

    loadPhones();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '20px', fontFamily: 'monospace' }}>
        <h1>🔍 Phone Debug Tool</h1>
        <p>Loading all phones from CMS...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px', fontFamily: 'monospace' }}>
        <h1>🔍 Phone Debug Tool</h1>
        <p style={{ color: 'red' }}>Error: {error}</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace', maxWidth: '1200px' }}>
      <h1>🔍 Phone Debug Tool</h1>
      <p><strong>Total phones found:</strong> {phones.length}</p>
      
      <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#f5f5f5' }}>
        <h3>🎯 Test URLs:</h3>
        <p>Try these working comparison URLs:</p>
        {phones.slice(0, 4).map((phone, index) => (
          <div key={phone.uid}>
            <a 
              href={`/compare/${phone.slug}${phones[index + 1] ? `-vs-${phones[index + 1].slug}` : ''}`}
              style={{ color: 'blue', textDecoration: 'underline' }}
            >
              /compare/{phone.slug}{phones[index + 1] ? `-vs-${phones[index + 1].slug}` : ''}
            </a>
          </div>
        ))}
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
        <thead>
          <tr style={{ backgroundColor: '#e0e0e0' }}>
            <th style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'left' }}>Title</th>
            <th style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'left' }}>Generated Slug</th>
            <th style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'left' }}>CMS URL</th>
            <th style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'left' }}>UID</th>
          </tr>
        </thead>
        <tbody>
          {phones.map(phone => (
            <tr key={phone.uid}>
              <td style={{ border: '1px solid #ccc', padding: '8px' }}>
                <strong>{phone.title}</strong>
              </td>
              <td style={{ border: '1px solid #ccc', padding: '8px', fontFamily: 'monospace', backgroundColor: '#f9f9f9' }}>
                <code>{phone.slug}</code>
              </td>
              <td style={{ border: '1px solid #ccc', padding: '8px' }}>
                {phone.url || 'No URL'}
              </td>
              <td style={{ border: '1px solid #ccc', padding: '8px', fontSize: '10px', color: '#666' }}>
                {phone.uid}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#fff3cd' }}>
        <h3>💡 How to fix comparison issues:</h3>
        <ol>
          <li><strong>Check phone titles:</strong> Use the exact slug from the "Generated Slug" column</li>
          <li><strong>URL format:</strong> /compare/slug1-vs-slug2-vs-slug3</li>
          <li><strong>Missing phones:</strong> If a phone you want isn't listed, add it to your Contentstack CMS</li>
          <li><strong>Title mismatches:</strong> Update phone titles in CMS to match expected names</li>
        </ol>
      </div>
    </div>
  );
};

export default DebugPhones;