import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Smartphone, Laptop, Headphones, ArrowRight, TrendingUp, Clock } from 'lucide-react';
import { getEditAttributes, VB_EmptyBlockParentClass } from '../../utils/livePreview';
import { getFieldValue } from '../../types/EditableTags';
import { Card, Button, Badge } from '../shared';
import ProgressIndicator from './ProgressIndicator';
import contentstackService from '../../services/contentstackService';
import { 
  ComparePageContent, 
  transformCategories,
  transformFeaturedComparisons
} from '../../types/ComparePageContent';
import './CompareHub.css';

// Icon mapping for dynamic icon rendering
const iconMap: Record<string, React.ComponentType<any>> = {
  Smartphone,
  Laptop,
  Headphones,
  TrendingUp,
  Clock
};

const CompareHub: React.FC = () => {
  const navigate = useNavigate();
  const [pageContent, setPageContent] = useState<ComparePageContent | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [featuredComparisons, setFeaturedComparisons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadComparePageData = async () => {
      try {
        setLoading(true);
        
        // Fetch all data in parallel
        const [pageData, categoriesData, comparisonsData] = await Promise.all([
          contentstackService.getComparePageContent(),
          contentstackService.getComparisonCategories(),
          contentstackService.getFeaturedComparisons()
        ]);

        setPageContent(pageData);
        setCategories(transformCategories(categoriesData));
        setFeaturedComparisons(transformFeaturedComparisons(comparisonsData));
        
      } catch (error: any) {
        console.error('Failed to load compare page data:', error);
        setError(error.message || 'Failed to load page content');
      } finally {
        setLoading(false);
      }
    };

    loadComparePageData();
  }, []);

  const handleCategorySelect = (category: any) => {
    if (category.available) {
      if (category.id === 'mobile-phones') {
        // For mobile phones, go to browse page where users can select phones to compare
        navigate('/browse');
      } else {
        navigate(category.route);
      }
    }
  };

  const handleQuickComparison = (route: string) => {
    navigate(route);
  };

  const handleBrowseAll = () => {
    navigate('/browse');
  };

  // Get icon component from name
  const getIcon = (iconName: string) => {
    return iconMap[iconName] || Smartphone;
  };

  // Loading state
  if (loading) {
    return (
      <div className="compare-hub">
        <div className="compare-hub__container">
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            minHeight: '400px',
            fontSize: '18px',
            color: '#64748b'
          }}>
            Loading compare page...
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !pageContent) {
    return (
      <div className="compare-hub">
        <div className="compare-hub__container">
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column',
            justifyContent: 'center', 
            alignItems: 'center', 
            minHeight: '400px',
            textAlign: 'center',
            gap: '1rem'
          }}>
            <h2 style={{ color: '#dc2626' }}>Failed to load page content</h2>
            <p style={{ color: '#64748b' }}>{error}</p>
            <Button variant="primary" onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="compare-hub">
      <div className="compare-hub__container">
        {/* Header Section */}
        <div className="compare-hub__header">
          <ProgressIndicator 
            currentStep={getFieldValue(pageContent.page_header.progress_current_step) || 1} 
            totalSteps={getFieldValue(pageContent.page_header.progress_total_steps) || 4} 
          />
          <h1 className="compare-hub__title" {...getEditAttributes(pageContent.page_header.main_title)}>
            {getFieldValue(pageContent.page_header.main_title)}
          </h1>
          <p className="compare-hub__subtitle" {...getEditAttributes(pageContent.page_header.subtitle)}>
            {getFieldValue(pageContent.page_header.subtitle)}
          </p>
        </div>

        {/* Category Selection */}
        <section className="compare-hub__section">
          <h2 className="compare-hub__section-title" {...getEditAttributes(pageContent.category_selection.section_title)}>
            {getFieldValue(pageContent.category_selection.section_title)}
          </h2>
          <div className={`compare-hub__categories ${categories.length ? '' : VB_EmptyBlockParentClass}`}>
            {categories.map((category) => {
              const Icon = getIcon(category.icon);
              return (
                <Card
                  key={category.id}
                  className={`compare-hub__category ${!category.available ? 'compare-hub__category--disabled' : ''}`}
                  variant="elevated"
                  hover={category.available}
                  onClick={() => handleCategorySelect(category)}
                >
                  <div className="compare-hub__category-header">
                    <div 
                      className="compare-hub__category-icon"
                      style={{ backgroundColor: `${category.color}15`, color: category.color }}
                    >
                      <Icon size={32} />
                    </div>
                    <Badge 
                      variant={category.available ? 'success' : 'default'} 
                      size="sm"
                    >
                      {category.count} Models
                    </Badge>
                  </div>
                  
                  <div className="compare-hub__category-content">
                    <h3 className="compare-hub__category-title" {...getEditAttributes(category.title)}>
                      {getFieldValue(category.title)}
                    </h3>
                    <p className="compare-hub__category-description" {...getEditAttributes(category.description)}>
                      {getFieldValue(category.description)}
                    </p>
                  </div>
                  
                  <div className="compare-hub__category-action">
                    <Button 
                      variant={category.available ? 'primary' : 'ghost'} 
                      size="sm"
                      icon={ArrowRight}
                      iconPosition="right"
                      disabled={!category.available}
                    >
                      {category.buttonText}
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Quick Start Comparisons */}
        <section className="compare-hub__section">
          <div className="compare-hub__section-header">
            <h2 className="compare-hub__section-title" {...getEditAttributes(pageContent.popular_comparisons.section_title)}>
              {pageContent.popular_comparisons.section_icon && (
                <span className="compare-hub__section-icon" {...getEditAttributes(pageContent.popular_comparisons.section_icon)}>
                  {React.createElement(getIcon(getFieldValue(pageContent.popular_comparisons.section_icon)))}
                </span>
              )}
              {getFieldValue(pageContent.popular_comparisons.section_title)}
            </h2>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleBrowseAll}
              {...getEditAttributes(pageContent.popular_comparisons.browse_button_text)}
            >
              {getFieldValue(pageContent.popular_comparisons.browse_button_text)}
            </Button>
          </div>
          
          <div className={`compare-hub__quick-comparisons ${featuredComparisons.length ? '' : VB_EmptyBlockParentClass}`}>
            {featuredComparisons.map((comparison, index) => (
              <Card
                key={index}
                className="compare-hub__quick-comparison"
                variant="bordered"
                hover
                onClick={() => handleQuickComparison(comparison.route)}
              >
                <div className="compare-hub__comparison-header">
                  <Badge 
                    variant={comparison.popularity === 'trending' ? 'success' : 'primary'}
                    size="sm"
                    {...getEditAttributes(comparison.popularityBadge)}
                  >
                    {getFieldValue(comparison.popularityBadge)}
                  </Badge>
                  <Badge variant="default" size="sm" {...getEditAttributes(comparison.categoryLabel)}>
                    {getFieldValue(comparison.categoryLabel)}
                  </Badge>
                </div>
                
                <h3 className="compare-hub__comparison-title" {...getEditAttributes(comparison.title)}>
                  {getFieldValue(comparison.title)}
                </h3>
                
                <Button variant="ghost" size="sm" icon={ArrowRight} iconPosition="right">
                  Compare Now
                </Button>
              </Card>
            ))}
          </div>
        </section>

        {/* Help Section */}
        <section className="compare-hub__help">
          <Card className="compare-hub__help-card" variant="gradient">
            <div className="compare-hub__help-content">
              {pageContent.help_section.help_icon && 
                <span {...getEditAttributes(pageContent.help_section.help_icon)}>
                  {React.createElement(getIcon(getFieldValue(pageContent.help_section.help_icon)), { size: 24 })}
                </span>
              }
              <div>
                <h3 className="compare-hub__help-title" {...getEditAttributes(pageContent.help_section.help_title)}>
                  {getFieldValue(pageContent.help_section.help_title)}
                </h3>
                <p className="compare-hub__help-description" {...getEditAttributes(pageContent.help_section.help_description)}>
                  {getFieldValue(pageContent.help_section.help_description)}
                </p>
              </div>
              <Button variant="outline" onClick={handleBrowseAll} {...getEditAttributes(pageContent.help_section.cta_button_text)}>
                {getFieldValue(pageContent.help_section.cta_button_text)}
              </Button>
            </div>
          </Card>
        </section>
      </div>
    </div>
  );
};

export default CompareHub;