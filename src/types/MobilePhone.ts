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
  weight: string;
  battery: string;
}

export interface Taxonomy {
  name: string;
  uid: string;
}

export interface MobilePhone {
  uid: string;
  title: string;
  url: string;
  description: string;
  lead_image: ContentstackAsset;
  seo: SEO;
  specifications: Specifications;
  taxonomies?: {
    brand?: Taxonomy[];
  };
  created_at: string;
  updated_at: string;
  locale: string;
  _version: number;
}