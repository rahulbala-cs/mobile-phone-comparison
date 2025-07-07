// Validation utilities for CMS data structures
// Using custom validation instead of external libraries to keep bundle size minimal

export interface ValidationResult<T> {
  isValid: boolean;
  data?: T;
  errors: string[];
}

// Type guards and validators for Contentstack responses
export const validateContentstackResponse = (response: any): ValidationResult<any> => {
  const errors: string[] = [];

  if (!response) {
    errors.push('Response is null or undefined');
    return { isValid: false, errors };
  }

  if (typeof response !== 'object') {
    errors.push('Response is not an object');
    return { isValid: false, errors };
  }

  return { isValid: true, data: response, errors: [] };
};

export const validateHomePageContent = (content: any): ValidationResult<any> => {
  const errors: string[] = [];

  if (!content) {
    errors.push('Content is null or undefined');
    return { isValid: false, errors };
  }

  // Required fields validation
  const requiredFields = [
    'title',
    'hero_badge_text',
    'hero_title',
    'hero_title_highlight',
    'hero_subtitle',
    'hero_primary_button_text',
    'hero_secondary_button_text',
    'features_section_title',
    'features_section_subtitle',
    'comparisons_section_title',
    'comparisons_section_subtitle',
    'stats_section_title',
    'stats_section_subtitle',
    'cta_title',
    'cta_description',
    'cta_button_text'
  ];

  for (const field of requiredFields) {
    if (!content[field] || typeof content[field] !== 'string' || content[field].trim() === '') {
      errors.push(`Required field '${field}' is missing or empty`);
    }
  }

  // Validate Contentstack metadata
  if (content.uid && typeof content.uid !== 'string') {
    errors.push('Invalid uid format');
  }

  if (content._version && typeof content._version !== 'number') {
    errors.push('Invalid version format');
  }

  return {
    isValid: errors.length === 0,
    data: errors.length === 0 ? content : undefined,
    errors
  };
};

export const validateMobilePhone = (phone: any): ValidationResult<any> => {
  const errors: string[] = [];

  if (!phone) {
    errors.push('Phone data is null or undefined');
    return { isValid: false, errors };
  }

  // Required fields for mobile phone
  const requiredFields = ['title', 'description', 'url'];
  
  for (const field of requiredFields) {
    if (!phone[field] || typeof phone[field] !== 'string') {
      errors.push(`Required field '${field}' is missing or invalid`);
    }
  }

  // Validate specifications if present
  if (phone.specifications) {
    if (typeof phone.specifications !== 'object') {
      errors.push('Specifications must be an object');
    }
  }

  return {
    isValid: errors.length === 0,
    data: errors.length === 0 ? phone : undefined,
    errors
  };
};

// Error class for validation failures
export class ValidationError extends Error {
  public readonly errors: string[];
  
  constructor(message: string, errors: string[]) {
    super(message);
    this.name = 'ValidationError';
    this.errors = errors;
  }
}

// Utility function to create validation error
export const createValidationError = (context: string, errors: string[]): ValidationError => {
  const message = `Validation failed in ${context}: ${errors.join(', ')}`;
  return new ValidationError(message, errors);
};