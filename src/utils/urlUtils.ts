// Utility functions for URL generation and parsing

export const generatePhoneSlug = (title: string): string => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .trim()
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
};

export const generateComparisonUrl = (...phoneTitles: string[]): string => {
  const slugs = phoneTitles.map(title => generatePhoneSlug(title));
  return `/compare/${slugs.join('-vs-')}`;
};

export const parseComparisonUrl = (params: string): string[] | null => {
  // Expected format: "phone1-vs-phone2-vs-phone3-vs-phone4"
  const slugs = params.split('-vs-');
  
  if (slugs.length < 2 || slugs.length > 4) {
    return null;
  }
  
  // Ensure all slugs are valid (not empty)
  if (slugs.some(slug => !slug.trim())) {
    return null;
  }
  
  return slugs;
};

export const findPhoneBySlug = (phones: any[], slug: string): any | null => {
  return phones.find(phone => generatePhoneSlug(phone.title) === slug) || null;
};