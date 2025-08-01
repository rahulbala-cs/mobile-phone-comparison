// Utility functions for URL generation and parsing

export const generatePhoneSlug = (title: string): string => {
  // Fixed: Add null safety for title parameter
  if (!title || typeof title !== 'string') {
    console.log('🔍 DEBUG: generatePhoneSlug received invalid title:', title);
    return '';
  }
  
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .trim()
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
  
  console.log(`🔍 DEBUG: generatePhoneSlug("${title}") -> "${slug}"`);
  return slug;
};

export const generateComparisonUrl = (...phoneTitles: string[]): string => {
  // Fixed: Add null safety for phoneTitles array
  if (!phoneTitles || phoneTitles.length === 0) {
    return '/compare';
  }
  
  const slugs = phoneTitles
    .filter(title => title && typeof title === 'string')
    .map(title => generatePhoneSlug(title))
    .filter(slug => slug.length > 0);
    
  if (slugs.length === 0) {
    return '/compare';
  }
  
  return `/compare/${slugs.join('-vs-')}`;
};

export const parseComparisonUrl = (params: string): string[] | null => {
  // Fixed: Add null safety for params parameter
  if (!params || typeof params !== 'string') {
    console.log('🔍 DEBUG: parseComparisonUrl received invalid params:', params);
    return null;
  }
  
  console.log('🔍 DEBUG: parseComparisonUrl parsing:', params);
  
  // Expected format: "phone1-vs-phone2-vs-phone3-vs-phone4"
  const slugs = params.split('-vs-');
  console.log('🔍 DEBUG: Split slugs:', slugs);
  
  if (slugs.length < 2 || slugs.length > 4) {
    console.log('🔍 DEBUG: Invalid slug count:', slugs.length);
    return null;
  }
  
  // Ensure all slugs are valid (not empty)
  if (slugs.some(slug => !slug || typeof slug !== 'string' || !slug.trim())) {
    console.log('🔍 DEBUG: Found empty or invalid slug');
    return null;
  }
  
  const trimmedSlugs = slugs.map(slug => slug.trim());
  console.log('🔍 DEBUG: Final parsed slugs:', trimmedSlugs);
  return trimmedSlugs;
};

export const findPhoneBySlug = (phones: any[], slug: string): any | null => {
  // Fixed: Add null safety for phones array and phone.title
  if (!phones || !Array.isArray(phones) || !slug) {
    return null;
  }
  
  return phones.find(phone => {
    if (!phone || !phone.title) return false;
    return generatePhoneSlug(phone.title) === slug;
  }) || null;
};