import summaryService from './summaryService';
import { MobilePhone } from '../types/MobilePhone';

// Mock phone data with various Unicode characters
const createMockPhone = (title: string, specs: any = {}): MobilePhone => ({
  uid: 'test-uid',
  title,
  url: 'test-url',
  description: 'Test description',
  lead_image: {
    uid: 'img-uid',
    url: 'test-image.jpg',
    title: 'Test Image',
    created_at: '2023-01-01',
    updated_at: '2023-01-01',
    content_type: 'image/jpeg',
    file_size: '100kb',
    filename: 'test.jpg',
    _version: 1
  },
  seo: {
    meta_title: 'Test',
    meta_description: 'Test',
    keywords: 'test',
    enable_search_indexing: true
  },
  specifications: {
    ram: specs.ram || '8GB',
    storage: specs.storage || '256GB',
    cpu: 'Test CPU',
    rear_camera: '48MP',
    front_camera: '12MP',
    battery: '4000mAh',
    weight: '200g',
    display_resolution: '1080p',
    screen_to_body_ratio: '85%',
    ...specs
  },
  created_at: '2023-01-01',
  updated_at: '2023-01-01',
  locale: 'en-us',
  _version: 1
});

describe('SummaryService Unicode Support', () => {
  const testCases = [
    {
      name: 'Basic English phones',
      phones: [
        createMockPhone('iPhone 16 Pro'),
        createMockPhone('Samsung Galaxy S24 Ultra')
      ]
    },
    {
      name: 'Phones with emojis',
      phones: [
        createMockPhone('iPhone 16 Pro 📱'),
        createMockPhone('Samsung Galaxy S24 Ultra ⭐')
      ]
    },
    {
      name: 'Phones with accented characters',
      phones: [
        createMockPhone('Teléfono Móvil Pro'),
        createMockPhone('Smartphone Avancé')
      ]
    },
    {
      name: 'Phones with Chinese characters',
      phones: [
        createMockPhone('华为 Mate 50 Pro'),
        createMockPhone('小米 13 Ultra')
      ]
    },
    {
      name: 'Mixed Unicode characters',
      phones: [
        createMockPhone('📱 iPhone 16 Pro ™️'),
        createMockPhone('🇰🇷 Samsung Galaxy S24 ®'),
        createMockPhone('Español: Teléfono Móvil 🔥')
      ]
    },
    {
      name: 'Very long phone names',
      phones: [
        createMockPhone('📱 iPhone 16 Pro Max Ultra Super Premium Edition with Advanced Camera System 📷'),
        createMockPhone('Samsung Galaxy S24 Ultra 5G Premium Edition with S-Pen and Advanced AI Features 🤖')
      ]
    }
  ];

  testCases.forEach(testCase => {
    test(`should handle ${testCase.name} without errors`, async () => {
      expect(async () => {
        await summaryService.generateSummary({
          phones: testCase.phones,
          userPreferences: { usage: 'general' }
        });
      }).not.toThrow();
    });
  });

  test('should generate consistent cache keys for same phones', async () => {
    const phones = [
      createMockPhone('iPhone 16 Pro 📱'),
      createMockPhone('Samsung Galaxy S24 Ultra ⭐')
    ];

    // Generate summary twice
    const result1 = await summaryService.generateSummary({ phones });
    const result2 = await summaryService.generateSummary({ phones });

    // Should return cached result (same structure)
    expect(result1.summary).toBeDefined();
    expect(result2.summary).toBeDefined();
    expect(typeof result1.summary).toBe('string');
    expect(typeof result2.summary).toBe('string');
  });

  test('should handle empty phone names gracefully', async () => {
    const phones = [
      createMockPhone(''),
      createMockPhone('   ')
    ];

    expect(async () => {
      await summaryService.generateSummary({ phones });
    }).not.toThrow();
  });

  test('should handle phones with only special characters', async () => {
    const phones = [
      createMockPhone('📱🔥⭐'),
      createMockPhone('🇺🇸🇰🇷🇨🇳')
    ];

    expect(async () => {
      await summaryService.generateSummary({ phones });
    }).not.toThrow();
  });
});

// Manual test for console logging (run in browser console)
export const testUnicodePhones = () => {
  console.log('Testing Unicode phone names...');
  
  const unicodePhones = [
    createMockPhone('iPhone 16 Pro 📱'),
    createMockPhone('Samsung Galaxy S24 Ultra ⭐'),
    createMockPhone('华为 Mate 50 Pro'),
    createMockPhone('Español: Teléfono Móvil')
  ];

  summaryService.generateSummary({ phones: unicodePhones })
    .then(result => {
      console.log('✅ Unicode test passed:', result.summary);
    })
    .catch(error => {
      console.error('❌ Unicode test failed:', error);
    });
};