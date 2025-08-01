// Phone Slug to UID Mapping
// This maps human-readable slugs to Contentstack UIDs for better SEO URLs

export interface PhoneSlugMapping {
  [slug: string]: string; // slug -> UID
}

// Static mapping of phone slugs to their Contentstack UIDs
// Add new phones here as they are added to the CMS
export const PHONE_SLUG_TO_UID: PhoneSlugMapping = {
  // Samsung phones
  'samsung-galaxy-s24-ultra': 'blt6e248f3c32d25409',
  'samsung-galaxy-s25-ultra': 'blt2633e11ac20f3c77',
  
  // OnePlus phones  
  'oneplus-13': 'blt118b05fece1a9fb3',
  'oneplus-12': 'blt9041d497667db6c8',
  
  // Apple phones
  'apple-iphone-16-pro-max': 'bltffc3e218b0c94c4a',
  'iphone-16-pro-max': 'bltffc3e218b0c94c4a', // Alternative slug
  
  // Add more phones as they are added to CMS
};

// Reverse mapping for generating URLs from UIDs
export const PHONE_UID_TO_SLUG: Record<string, string> = {};
Object.entries(PHONE_SLUG_TO_UID).forEach(([slug, uid]) => {
  // Use the first slug found for each UID (primary slug)
  if (!PHONE_UID_TO_SLUG[uid]) {
    PHONE_UID_TO_SLUG[uid] = slug;
  }
});

/**
 * Convert a slug to a UID
 * @param slug - Human-readable slug like 'samsung-galaxy-s24-ultra'
 * @returns UID string or null if not found
 */
export const getUIDFromSlug = (slug: string): string | null => {
  return PHONE_SLUG_TO_UID[slug] || null;
};

/**
 * Convert a UID to a slug  
 * @param uid - Contentstack UID like 'blt6e248f3c32d25409'
 * @returns slug string or null if not found
 */
export const getSlugFromUID = (uid: string): string | null => {
  return PHONE_UID_TO_SLUG[uid] || null;
};

/**
 * Check if a string is a valid phone slug
 * @param slug - String to check
 * @returns boolean
 */
export const isValidPhoneSlug = (slug: string): boolean => {
  return slug in PHONE_SLUG_TO_UID;
};

/**
 * Check if a string looks like a Contentstack UID
 * @param str - String to check  
 * @returns boolean
 */
export const isContentstackUID = (str: string): boolean => {
  return /^blt[a-f0-9]{16}$/.test(str);
};

/**
 * Generate a phone detail URL from UID
 * @param uid - Contentstack UID
 * @param useSlug - Whether to use slug or UID in URL (default: true)
 * @returns URL path
 */
export const generatePhoneURL = (uid: string, useSlug: boolean = true): string => {
  if (useSlug) {
    const slug = getSlugFromUID(uid);
    if (slug) {
      return `/mobiles/${slug}`;
    }
  }
  
  // Fallback to UID
  return `/mobiles/${uid}`;
};

/**
 * Get all available phone slugs
 * @returns Array of slug strings
 */
export const getAllPhoneSlugs = (): string[] => {
  return Object.keys(PHONE_SLUG_TO_UID);
};

/**
 * Get all available phone UIDs
 * @returns Array of UID strings  
 */
export const getAllPhoneUIDs = (): string[] => {
  return Object.values(PHONE_SLUG_TO_UID);
};