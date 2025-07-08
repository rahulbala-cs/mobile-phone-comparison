import React from 'react';
import { render, screen } from '@testing-library/react';
import QuickSummarize from './QuickSummarize';
import { MobilePhone } from '../types/MobilePhone';

// Mock the summary service
jest.mock('../services/summaryService', () => ({
  generateSummary: jest.fn()
}));

const mockPhone: MobilePhone = {
  uid: 'test-uid',
  title: 'Test Phone',
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
    ram: '8GB',
    storage: '256GB',
    cpu: 'Test CPU',
    rear_camera: '48MP',
    front_camera: '12MP',
    battery: '4000mAh',
    weight: '200g',
    display_resolution: '1080p',
    screen_to_body_ratio: '85%'
  },
  created_at: '2023-01-01',
  updated_at: '2023-01-01',
  locale: 'en-us',
  _version: 1
};

describe('QuickSummarize', () => {
  test('renders disabled button when less than 2 phones', () => {
    render(<QuickSummarize phones={[mockPhone]} />);
    
    const button = screen.getByRole('button', { name: /quick summarize/i });
    expect(button).toBeDisabled();
  });

  test('renders enabled button when 2 or more phones', () => {
    render(<QuickSummarize phones={[mockPhone, mockPhone]} />);
    
    const button = screen.getByRole('button', { name: /quick summarize/i });
    expect(button).not.toBeDisabled();
  });
});