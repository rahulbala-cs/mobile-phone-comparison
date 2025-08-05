// TypeScript interfaces for Contentstack editable tags and Live Preview

export interface EditableField<T = string> {
  value?: T;
  $?: {
    'data-cslp'?: string;
    [key: string]: any;
  };
}

export interface EditableTagsConfig {
  'data-cslp'?: string;
  [key: string]: any;
}

// Enhanced interfaces for fields that support live preview editing
export interface EditableHomePageContent {
  title: EditableField<string>;
  hero_badge_text: EditableField<string>;
  hero_title: EditableField<string>;
  hero_title_highlight: EditableField<string>;
  hero_subtitle: EditableField<string>;
  hero_primary_button_text: EditableField<string>;
  hero_primary_button_url?: EditableField<string>;
  hero_secondary_button_text: EditableField<string>;
  hero_secondary_button_url?: EditableField<string>;
  
  // Hero Phone Showcase
  hero_phone_1_name?: EditableField<string>;
  hero_phone_1_icon?: EditableField<string>;
  hero_phone_2_name?: EditableField<string>;
  hero_phone_2_icon?: EditableField<string>;
  hero_vs_text?: EditableField<string>;
  hero_spec_1_label?: EditableField<string>;
  hero_spec_1_phone_1_value?: EditableField<string>;
  hero_spec_1_phone_2_value?: EditableField<string>;
  hero_spec_1_phone_1_better?: EditableField<boolean>;
  hero_spec_2_label?: EditableField<string>;
  hero_spec_2_phone_1_value?: EditableField<string>;
  hero_spec_2_phone_2_value?: EditableField<string>;
  hero_spec_2_phone_2_better?: EditableField<boolean>;
  hero_spec_3_label?: EditableField<string>;
  hero_spec_3_phone_1_value?: EditableField<string>;
  hero_spec_3_phone_2_value?: EditableField<string>;
  hero_spec_3_phone_2_better?: EditableField<boolean>;
  
  // Features Section
  features_section_title: EditableField<string>;
  features_section_subtitle: EditableField<string>;
  
  // Comparisons Section
  comparisons_section_title: EditableField<string>;
  comparisons_section_subtitle: EditableField<string>;
  comparisons_view_all_button_text?: EditableField<string>;
  comparisons_view_all_button_url?: EditableField<string>;
  comparison_card_button_text?: EditableField<string>;
  comparison_vs_text?: EditableField<string>;
  comparison_phone_placeholder?: EditableField<string>;
  
  // Badge Text
  badge_trending_text?: EditableField<string>;
  badge_hot_text?: EditableField<string>;
  badge_popular_text?: EditableField<string>;
  
  // Stats Section
  stats_section_title: EditableField<string>;
  stats_section_subtitle: EditableField<string>;
  
  // CTA Section
  cta_title: EditableField<string>;
  cta_description: EditableField<string>;
  cta_button_text: EditableField<string>;
  
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

// Type guard to check if a field has editable tags
export const hasEditableTags = (field: any): field is EditableField => {
  return field && typeof field === 'object' && '$' in field;
};

// Utility to safely get field value, whether it's a simple value or editable field
export const getFieldValue = <T>(field: T | EditableField<T>): T => {
  if (hasEditableTags(field)) {
    return field.value as T;
  }
  return field as T;
};

// Utility to safely create editable field
export const createEditableField = <T>(
  value: T, 
  contentTypeUid: string, 
  entryUid: string, 
  locale: string, 
  fieldUid: string
): EditableField<T> => {
  return {
    value,
    $: {
      'data-cslp': `${contentTypeUid}.${entryUid}.${locale}.${fieldUid}`
    }
  };
};

// Type for Contentstack Utils.addEditableTags function input
export interface ContentstackEntry {
  uid?: string;
  [key: string]: any;
}

// Enhanced type for mobile phone with editable tags
export interface EditableMobilePhone {
  title: EditableField<string>;
  description: EditableField<string>;
  url: EditableField<string>;
  lead_image?: EditableField<any>;
  specifications?: {
    cpu?: EditableField<string>;
    ram?: EditableField<string>;
    storage?: EditableField<string>;
    rear_camera?: EditableField<string>;
    front_camera?: EditableField<string>;
    battery?: EditableField<string>;
    [key: string]: EditableField<string> | undefined;
  };
  
  // Contentstack metadata
  uid?: string;
  created_at?: string;
  updated_at?: string;
  ACL?: any;
  _version?: number;
  locale?: string;
  tags?: string[];
}