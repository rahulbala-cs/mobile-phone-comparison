import React, { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, TrendingUp } from 'lucide-react';
import { Card, Button, Badge } from '../shared';
import { HomePageContent, Comparison } from '../../types/HomePageContent';
import { getEditAttributes, VB_EmptyBlockParentClass } from '../../utils/livePreview';
import { FallbackHelper } from '../../config/fallbacks';
import { getFieldValue } from '../../types/EditableTags';
import './FeaturedComparisons.css';

interface FeaturedComparisonsProps {
  content: HomePageContent;
  comparisons: Comparison[];
}

const FeaturedComparisons: React.FC<FeaturedComparisonsProps> = React.memo(({ content, comparisons }) => {
  const navigate = useNavigate();

  // Memoized navigation handlers
  const handleComparisonClick = useCallback((url: string) => {
    navigate(url);
  }, [navigate]);

  const handleViewAllComparisons = useCallback(() => {
    navigate(FallbackHelper.getNavigationUrl(getFieldValue(content.comparisons_view_all_button_url), 'COMPARE_URL'));
  }, [navigate, content.comparisons_view_all_button_url]);

  // Memoized badge text mapping
  const badgeTextMap = useMemo(() => ({
    trending: FallbackHelper.getBadgeText(getFieldValue(content.badge_trending_text), 'TRENDING'),
    hot: FallbackHelper.getBadgeText(getFieldValue(content.badge_hot_text), 'HOT'),
    popular: FallbackHelper.getBadgeText(getFieldValue(content.badge_popular_text), 'POPULAR')
  }), [content.badge_trending_text, content.badge_hot_text, content.badge_popular_text]);

  // Memoized UI constants
  const uiConstants = useMemo(() => ({
    viewAllButtonText: FallbackHelper.getText(getFieldValue(content.comparisons_view_all_button_text), 'VIEW_ALL_COMPARISONS'),
    cardButtonText: FallbackHelper.getText(getFieldValue(content.comparison_card_button_text), 'COMPARE_NOW'),
    vsText: FallbackHelper.getPhoneInfo(getFieldValue(content.comparison_vs_text), 'VS_TEXT'),
    phonePlaceholder: FallbackHelper.getPhoneInfo(getFieldValue(content.comparison_phone_placeholder), 'PLACEHOLDER_EMOJI')
  }), [
    content.comparisons_view_all_button_text,
    content.comparison_card_button_text,
    content.comparison_vs_text,
    content.comparison_phone_placeholder
  ]);

  return (
    <section className="featured-comparisons">
      <div className="featured-comparisons__container">
        <div className="featured-comparisons__header">
          <div className="featured-comparisons__title-section">
            <h2 className="featured-comparisons__title">
              <TrendingUp className="featured-comparisons__title-icon" />
              <span {...getEditAttributes(content.comparisons_section_title)}>
                {getFieldValue(content.comparisons_section_title)}
              </span>
            </h2>
            <p className="featured-comparisons__subtitle" {...getEditAttributes(content.comparisons_section_subtitle)}>
              {getFieldValue(content.comparisons_section_subtitle)}
            </p>
          </div>
          <Button 
            variant="outline" 
            icon={ArrowRight}
            iconPosition="right"
            onClick={handleViewAllComparisons}
          >
            <span {...getEditAttributes(content.comparisons_view_all_button_text)}>
              {uiConstants.viewAllButtonText}
            </span>
          </Button>
        </div>

        <div className={`featured-comparisons__grid ${comparisons.length ? '' : VB_EmptyBlockParentClass}`}>
          {comparisons.map((comparison, index) => {
            // Map back to original CMS field names for proper edit attributes
            const comparisonTitle = index === 0 ? content.comparison_1_title :
                                   index === 1 ? content.comparison_2_title :
                                   content.comparison_3_title;
            const comparisonDescription = index === 0 ? content.comparison_1_description :
                                         index === 1 ? content.comparison_2_description :
                                         content.comparison_3_description;
            const comparisonPhone1 = index === 0 ? content.comparison_1_phone_1 :
                                    index === 1 ? content.comparison_2_phone_1 :
                                    content.comparison_3_phone_1;
            const comparisonPhone2 = index === 0 ? content.comparison_1_phone_2 :
                                    index === 1 ? content.comparison_2_phone_2 :
                                    content.comparison_3_phone_2;
            
            return (
              <Card 
                key={index}
                className="featured-comparisons__card"
                variant="elevated"
                hover
                onClick={() => handleComparisonClick(getFieldValue(comparison.url))}
              >
                <div className="featured-comparisons__card-header">
                  <Badge 
                    variant={comparison.popularity === 'trending' ? 'success' : 'primary'}
                    size="sm"
                  >
                    {badgeTextMap[comparison.popularity as keyof typeof badgeTextMap] || badgeTextMap.popular}
                  </Badge>
                  <Badge variant="default" size="sm">
                    {comparison.category}
                  </Badge>
                </div>

                <div className="featured-comparisons__phones">
                  <div className="featured-comparisons__phone">
                    <div className="featured-comparisons__phone-placeholder">
                      {uiConstants.phonePlaceholder}
                    </div>
                    <span className="featured-comparisons__phone-name" {...getEditAttributes(comparisonPhone1)}>
                      {getFieldValue(comparisonPhone1)}
                    </span>
                  </div>
                  
                  <div className="featured-comparisons__vs" {...getEditAttributes(content.comparison_vs_text)}>
                    {uiConstants.vsText}
                  </div>
                  
                  <div className="featured-comparisons__phone">
                    <div className="featured-comparisons__phone-placeholder">
                      {uiConstants.phonePlaceholder}
                    </div>
                    <span className="featured-comparisons__phone-name" {...getEditAttributes(comparisonPhone2)}>
                      {getFieldValue(comparisonPhone2)}
                    </span>
                  </div>
                </div>

                <div className="featured-comparisons__content">
                  <h3 className="featured-comparisons__card-title" {...getEditAttributes(comparisonTitle)}>
                    {getFieldValue(comparisonTitle)}
                  </h3>
                  <p className="featured-comparisons__card-description" {...getEditAttributes(comparisonDescription)}>
                    {getFieldValue(comparisonDescription)}
                  </p>
                </div>

                <div className="featured-comparisons__action">
                  <Button variant="ghost" size="sm" icon={ArrowRight} iconPosition="right">
                    <span {...getEditAttributes(content.comparison_card_button_text)}>
                      {uiConstants.cardButtonText}
                    </span>
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
});

FeaturedComparisons.displayName = 'FeaturedComparisons';

export default FeaturedComparisons;