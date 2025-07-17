// TypeScript interfaces for Compare Page content from Contentstack CMS

export interface ComparePageContent {
  title: string;
  url: string;
  page_header: PageHeader;
  category_selection: CategorySelection;
  popular_comparisons: PopularComparisons;
  help_section: HelpSection;
  uid?: string;
  created_at?: string;
  updated_at?: string;
  locale?: string;
}

export interface PageHeader {
  main_title: string;
  subtitle: string;
  progress_total_steps?: number;
  progress_current_step?: number;
}

export interface CategorySelection {
  section_title: string;
}

export interface PopularComparisons {
  section_title: string;
  section_icon?: string;
  browse_button_text: string;
}

export interface HelpSection {
  help_title: string;
  help_description: string;
  help_icon?: string;
  cta_button_text: string;
}

// Comparison Category interfaces
export interface ComparisonCategory {
  title: string;
  category_id: string;
  category_details: CategoryDetails;
  availability: CategoryAvailability;
  cta_config: CategoryCTAConfig;
  uid?: string;
}

export interface CategoryDetails {
  category_title: string;
  description: string;
  icon_config: IconConfig;
}

export interface IconConfig {
  icon_name: string;
  icon_color: string;
  background_color?: string;
}

export interface CategoryAvailability {
  is_available: boolean;
  count_label: string;
  route_path: string;
}

export interface CategoryCTAConfig {
  available_button_text: string;
  unavailable_button_text: string;
}

// Featured Comparison interfaces
export interface FeaturedComparison {
  title: string;
  comparison_details: ComparisonDetails;
  popularity_badge: PopularityBadge;
  comparison_phones?: ComparisonPhones;
  display_priority?: number;
  uid?: string;
}

export interface ComparisonDetails {
  comparison_title: string;
  category_label: string;
  route_path: string;
}

export interface PopularityBadge {
  badge_type: 'trending' | 'hot' | 'popular';
  custom_badge_text?: string;
}

export interface ComparisonPhones {
  phone_1_uid?: string;
  phone_2_uid?: string;
}

// Helper functions for badge display
export const getBadgeDisplay = (badge: PopularityBadge): string => {
  if (badge.custom_badge_text) {
    return badge.custom_badge_text;
  }
  
  switch (badge.badge_type) {
    case 'trending':
      return '🔥 Trending';
    case 'hot':
      return '🌟 Hot';
    case 'popular':
      return '📈 Popular';
    default:
      return '📈 Popular';
  }
};

// Transform categories for component consumption
export const transformCategories = (categories: ComparisonCategory[]) => {
  return categories.map(category => ({
    id: category.category_id,
    title: category.category_details.category_title,
    description: category.category_details.description,
    icon: category.category_details.icon_config.icon_name,
    available: category.availability.is_available,
    count: category.availability.count_label,
    color: category.category_details.icon_config.icon_color,
    route: category.availability.route_path,
    buttonText: category.availability.is_available 
      ? category.cta_config.available_button_text 
      : category.cta_config.unavailable_button_text
  }));
};

// Transform featured comparisons for component consumption
export const transformFeaturedComparisons = (comparisons: FeaturedComparison[]) => {
  return comparisons
    .sort((a, b) => (a.display_priority || 999) - (b.display_priority || 999))
    .map(comparison => ({
      title: comparison.comparison_details.comparison_title,
      category: comparison.comparison_details.category_label,
      popularity: comparison.popularity_badge.badge_type,
      route: comparison.comparison_details.route_path,
      badgeText: getBadgeDisplay(comparison.popularity_badge)
    }));
};