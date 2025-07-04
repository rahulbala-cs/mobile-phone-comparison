// TypeScript interfaces for Mobile Phone content type from Contentstack

export interface ContentstackAsset {
  uid: string;
  created_at: string;
  updated_at: string;
  content_type: string;
  file_size: string;
  filename: string;
  url: string;
  title: string;
  _version: number;
  $?: any; // Edit tags added by addEditableTags
  publish_details?: {
    time: string;
    user: string;
    environment: string;
    locale: string;
  };
}

export interface SEO {
  meta_title: string;
  meta_description: string;
  keywords: string;
  enable_search_indexing: boolean;
}

export interface Specifications {
  display_resolution: string;
  screen_to_body_ratio: string;
  ram: string;
  storage: string;
  front_camera: string;
  rear_camera: string;
  cpu: string;
  weight: string;
  battery: string;
  $?: any; // Edit tags added by addEditableTags
}

export interface Taxonomy {
  name: string;
  uid: string;
}

export interface TaxonomyReference {
  taxonomy_uid: string;
  term_uid: string;
}

export interface RelatedPhone {
  uid: string;
  _content_type_uid: string;
}

export interface Variant {
  variant_name: string;
  _metadata: {
    uid: string;
  };
  price: number;
}

export interface PurchaseLink {
  title: string;
  href: string;
}

// Union types for Live Preview compatibility
type EditableField<T> = T | (T & { $?: any });

export interface MobilePhone {
  uid: string;
  title: EditableField<string>;
  url: string;
  description: EditableField<string>;
  lead_image: ContentstackAsset;
  images?: ContentstackAsset[];
  seo: SEO;
  specifications: EditableField<Specifications>;
  taxonomies?: TaxonomyReference[];
  related_phones?: RelatedPhone[];
  tags?: EditableField<string[]>;
  variants?: EditableField<Variant[]>;
  amazon_link?: PurchaseLink;
  flipkart_link?: PurchaseLink;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
  locale: string;
  _version: number;
  _content_type_uid?: string;
  $?: any; // Edit tags added by addEditableTags
  publish_details?: {
    time: string;
    user: string;
    environment: string;
    locale: string;
  };
}

// Utility type for extracting actual value from editable fields
export type ExtractValue<T> = T extends { $?: any } ? Omit<T, '$'> : T;

// Type guards for editable fields
export const isEditableField = <T>(field: EditableField<T>): field is T & { $?: any } => {
  return typeof field === 'object' && field !== null && '$' in field;
};

export const getFieldValue = <T>(field: EditableField<T>): T => {
  if (isEditableField(field)) {
    const { $, ...value } = field;
    return value as T;
  }
  return field;
};