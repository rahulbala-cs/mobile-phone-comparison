// TypeScript interfaces for Home Page content from Contentstack CMS
import { MobilePhone } from './MobilePhone';

// Device Comparison interfaces
export interface DeviceComparisonReference {
  uid: string;
  _content_type_uid: string;
}

export interface DeviceComparison {
  uid: string;
  title: string;
  subtitle?: string;
  left_device: DeviceInfo;
  right_device: DeviceInfo;
  comparison_metrics: ComparisonMetric[];
  created_at?: string;
  updated_at?: string;
  locale?: string;
  _version?: number;
}

export interface DeviceInfo {
  device_name: string;
  device_image?: {
    uid: string;
    url: string;
    title: string;
  };
  device_type?: string;
  background_color?: string;
  reference_entry?: {
    uid: string;
    _content_type_uid: string;
  }[];
}

export interface ComparisonMetric {
  metric_name: string;
  left_value: string;
  right_value: string;
  left_highlight?: boolean;
  right_highlight?: boolean;
  metric_icon?: {
    uid: string;
    url: string;
    title: string;
  };
  _metadata?: {
    uid: string;
  };
}

export interface HomePageContent {
  title: string;
  
  // Hero Section
  hero_badge_text: string;
  hero_title: string;
  hero_title_highlight: string;
  hero_subtitle: string;
  hero_primary_button_text: string;
  hero_primary_button_url?: string;
  hero_secondary_button_text: string;
  hero_secondary_button_url?: string;
  hero_stat_1_number?: string;
  hero_stat_1_label?: string;
  hero_stat_2_number?: string;
  hero_stat_2_label?: string;
  hero_stat_3_number?: string;
  hero_stat_3_label?: string;
  
  // Hero Phone Showcase
  hero_phone_1_name?: string;
  hero_phone_1_icon?: string;
  hero_phone_2_name?: string;
  hero_phone_2_icon?: string;
  hero_vs_text?: string;
  hero_spec_1_label?: string;
  hero_spec_1_phone_1_value?: string;
  hero_spec_1_phone_2_value?: string;
  hero_spec_1_phone_1_better?: boolean;
  hero_spec_2_label?: string;
  hero_spec_2_phone_1_value?: string;
  hero_spec_2_phone_2_value?: string;
  hero_spec_2_phone_2_better?: boolean;
  hero_spec_3_label?: string;
  hero_spec_3_phone_1_value?: string;
  hero_spec_3_phone_2_value?: string;
  hero_spec_3_phone_2_better?: boolean;
  
  // Features Section
  features_section_title: string;
  features_section_subtitle: string;
  feature_1_title?: string;
  feature_1_description?: string;
  feature_1_icon?: string;
  feature_1_color?: string;
  feature_2_title?: string;
  feature_2_description?: string;
  feature_2_icon?: string;
  feature_2_color?: string;
  feature_3_title?: string;
  feature_3_description?: string;
  feature_3_icon?: string;
  feature_3_color?: string;
  feature_4_title?: string;
  feature_4_description?: string;
  feature_4_icon?: string;
  feature_4_color?: string;
  feature_5_title?: string;
  feature_5_description?: string;
  feature_5_icon?: string;
  feature_5_color?: string;
  feature_6_title?: string;
  feature_6_description?: string;
  feature_6_icon?: string;
  feature_6_color?: string;
  
  // Comparisons Section
  comparisons_section_title: string;
  comparisons_section_subtitle: string;
  comparisons_view_all_button_text?: string;
  comparisons_view_all_button_url?: string;
  comparison_card_button_text?: string;
  comparison_vs_text?: string;
  comparison_phone_placeholder?: string;
  
  // Badge Text
  badge_trending_text?: string;
  badge_hot_text?: string;
  badge_popular_text?: string;
  comparison_1_title?: string;
  comparison_1_description?: string;
  comparison_1_phone_1?: string;
  comparison_1_phone_2?: string;
  comparison_1_category?: string;
  comparison_1_popularity?: string;
  comparison_1_url?: string;
  comparison_2_title?: string;
  comparison_2_description?: string;
  comparison_2_phone_1?: string;
  comparison_2_phone_2?: string;
  comparison_2_category?: string;
  comparison_2_popularity?: string;
  comparison_2_url?: string;
  comparison_3_title?: string;
  comparison_3_description?: string;
  comparison_3_phone_1?: string;
  comparison_3_phone_2?: string;
  comparison_3_category?: string;
  comparison_3_popularity?: string;
  comparison_3_url?: string;
  
  // Stats Section
  stats_section_title: string;
  stats_section_subtitle: string;
  stat_1_icon?: string;
  stat_1_value?: string;
  stat_1_label?: string;
  stat_1_description?: string;
  stat_2_icon?: string;
  stat_2_value?: string;
  stat_2_label?: string;
  stat_2_description?: string;
  stat_3_icon?: string;
  stat_3_value?: string;
  stat_3_label?: string;
  stat_3_description?: string;
  stat_4_icon?: string;
  stat_4_value?: string;
  stat_4_label?: string;
  stat_4_description?: string;
  
  // CTA Section
  cta_title: string;
  cta_description: string;
  cta_button_text: string;
  
  // New Comparison Snippet
  comparison_snippet?: DeviceComparisonReference[];
  
  // Contentstack metadata
  uid?: string;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  updated_by?: string;
  ACL?: any;
  _version?: number;
  locale?: string;
  tags?: string[];
}

// Structured interfaces for easier component consumption
export interface HeroStat {
  number: string;
  label: string;
}

export interface Feature {
  title: string;
  description: string;
  icon_name: string;
  color: string;
}

export interface Comparison {
  title: string;
  description: string;
  phone_1_name: string;
  phone_2_name: string;
  category: string;
  popularity: string;
  url: string;
}

export interface Stat {
  icon_name: string;
  value: string;
  label: string;
  description: string;
}

// New interfaces for Hero Phone Showcase
export interface HeroPhoneShowcase {
  phone_1: MobilePhoneReference;
  phone_2: MobilePhoneReference;
  vs_text: string;
  specifications: HeroPhoneSpec[];
}

export interface MobilePhoneReference {
  uid: string;
  title: string;
  icon?: string;
}

export interface HeroPhoneSpec {
  label: string;
  phone_1_value: string;
  phone_2_value: string;
  phone_2_better: boolean;
}

// Helper functions to transform flat CMS data into structured arrays
export const transformHomePageContent = (content: HomePageContent) => {
  const heroStats: HeroStat[] = [];
  const features: Feature[] = [];
  const comparisons: Comparison[] = [];
  const stats: Stat[] = [];
  
  // Transform hero stats
  if (content.hero_stat_1_number && content.hero_stat_1_label) {
    heroStats.push({
      number: content.hero_stat_1_number,
      label: content.hero_stat_1_label
    });
  }
  if (content.hero_stat_2_number && content.hero_stat_2_label) {
    heroStats.push({
      number: content.hero_stat_2_number,
      label: content.hero_stat_2_label
    });
  }
  if (content.hero_stat_3_number && content.hero_stat_3_label) {
    heroStats.push({
      number: content.hero_stat_3_number,
      label: content.hero_stat_3_label
    });
  }
  
  // Transform features
  for (let i = 1; i <= 6; i++) {
    const title = content[`feature_${i}_title` as keyof HomePageContent] as string;
    const description = content[`feature_${i}_description` as keyof HomePageContent] as string;
    const icon_name = content[`feature_${i}_icon` as keyof HomePageContent] as string;
    const color = content[`feature_${i}_color` as keyof HomePageContent] as string;
    
    if (title && description && icon_name && color) {
      features.push({ title, description, icon_name, color });
    }
  }
  
  // Transform comparisons
  for (let i = 1; i <= 3; i++) {
    const title = content[`comparison_${i}_title` as keyof HomePageContent] as string;
    const description = content[`comparison_${i}_description` as keyof HomePageContent] as string;
    const phone_1_name = content[`comparison_${i}_phone_1` as keyof HomePageContent] as string;
    const phone_2_name = content[`comparison_${i}_phone_2` as keyof HomePageContent] as string;
    const category = content[`comparison_${i}_category` as keyof HomePageContent] as string;
    const popularity = content[`comparison_${i}_popularity` as keyof HomePageContent] as string;
    const url = content[`comparison_${i}_url` as keyof HomePageContent] as string;
    
    if (title && description && phone_1_name && phone_2_name && category && popularity && url) {
      comparisons.push({ title, description, phone_1_name, phone_2_name, category, popularity, url });
    }
  }
  
  // Transform stats
  for (let i = 1; i <= 4; i++) {
    const icon_name = content[`stat_${i}_icon` as keyof HomePageContent] as string;
    const value = content[`stat_${i}_value` as keyof HomePageContent] as string;
    const label = content[`stat_${i}_label` as keyof HomePageContent] as string;
    const description = content[`stat_${i}_description` as keyof HomePageContent] as string;
    
    if (icon_name && value && label && description) {
      stats.push({ icon_name, value, label, description });
    }
  }
  
  return {
    heroStats,
    features,
    comparisons,
    stats
  };
};

// Transform hero phone showcase data from new CMS structure
export const transformHeroPhoneShowcase = async (
  showcaseData: any,
  getPhoneByUID: (uid: string) => Promise<MobilePhone>
): Promise<HeroPhoneShowcase> => {
  try {
    // Fetch phone data for both phones
    const [phone1, phone2] = await Promise.all([
      getPhoneByUID(showcaseData.phone_1_uid),
      getPhoneByUID(showcaseData.phone_2_uid)
    ]);

    // Transform specifications
    const specifications: HeroPhoneSpec[] = showcaseData.specifications?.map((spec: any) => ({
      label: spec.label,
      phone_1_value: spec.phone_1_value,
      phone_2_value: spec.phone_2_value,
      phone_2_better: spec.better_phone
    })) || [];

    return {
      phone_1: {
        uid: phone1.uid,
        title: phone1.title,
        icon: '📱'
      },
      phone_2: {
        uid: phone2.uid,
        title: phone2.title,
        icon: '📱'
      },
      vs_text: showcaseData.vs_text || 'VS',
      specifications
    };
  } catch (error) {
    console.error('Error transforming hero phone showcase:', error);
    
    // Return fallback data
    return {
      phone_1: {
        uid: 'fallback',
        title: 'iPhone 16 Pro Max',
        icon: '📱'
      },
      phone_2: {
        uid: 'fallback',
        title: 'Samsung Galaxy S25 Ultra',
        icon: '📱'
      },
      vs_text: 'VS',
      specifications: [
        {
          label: 'Camera',
          phone_1_value: '48MP',
          phone_2_value: '50MP',
          phone_2_better: true
        },
        {
          label: 'Battery',
          phone_1_value: '3274mAh',
          phone_2_value: '4700mAh',
          phone_2_better: true
        },
        {
          label: 'Price',
          phone_1_value: '₹1,34,900',
          phone_2_value: '₹1,05,999',
          phone_2_better: true
        }
      ]
    };
  }
};