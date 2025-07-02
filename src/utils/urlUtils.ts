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

export const generateComparisonUrl = (phone1Title: string, phone2Title: string): string => {
  const slug1 = generatePhoneSlug(phone1Title);
  const slug2 = generatePhoneSlug(phone2Title);
  return `/compare/${slug1}-vs-${slug2}`;
};

export const parseComparisonUrl = (params: string): { phone1Slug: string; phone2Slug: string } | null => {
  // Expected format: "phone1-vs-phone2"
  const vsIndex = params.lastIndexOf('-vs-');
  
  if (vsIndex === -1) {
    return null;
  }
  
  const phone1Slug = params.substring(0, vsIndex);
  const phone2Slug = params.substring(vsIndex + 4); // 4 = length of '-vs-'
  
  if (!phone1Slug || !phone2Slug) {
    return null;
  }
  
  return { phone1Slug, phone2Slug };
};

export const findPhoneBySlug = (phones: any[], slug: string): any | null => {
  return phones.find(phone => generatePhoneSlug(phone.title) === slug) || null;
};