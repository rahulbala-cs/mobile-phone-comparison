import React, { useMemo, useCallback, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Smartphone, Search } from 'lucide-react';
import { Button, Card } from '../shared';
import { HomePageContent, HeroStat, HeroPhoneShowcase, DeviceComparison } from '../../types/HomePageContent';
import { getEditAttributes } from '../../utils/livePreview';
import { FallbackHelper } from '../../config/fallbacks';
import { getFieldValue } from '../../types/EditableTags';
import contentstackService from '../../services/contentstackService';
import './HeroSection.css';

interface HeroSectionProps {
  content: HomePageContent;
  heroStats: HeroStat[];
  heroShowcase?: HeroPhoneShowcase | null;
}

// Helper function to get device icon based on device type
const getDeviceIcon = (deviceType?: string): string => {
  switch (deviceType?.toLowerCase()) {
    case 'laptop':
      return '💻';
    case 'tablet':
      return '📱'; // You can change this to a tablet emoji if available
    case 'smartwatch':
      return '⌚';
    case 'phone':
    default:
      return '📱';
  }
};

const HeroSection: React.FC<HeroSectionProps> = React.memo(({ content, heroStats, heroShowcase }) => {
  const navigate = useNavigate();
  const [deviceComparison, setDeviceComparison] = useState<DeviceComparison | null>(null);

  // Fetch device comparison data if comparison_snippet is available
  useEffect(() => {
    const fetchDeviceComparison = async () => {
      if (content.comparison_snippet && content.comparison_snippet.length > 0) {
        try {
          console.log('🎯 Hero fetching device comparison from snippet');
          const firstComparison = await contentstackService.getDeviceComparison(content.comparison_snippet[0].uid);
          setDeviceComparison(firstComparison);
          console.log('✅ Hero device comparison fetched:', firstComparison);
        } catch (error) {
          console.error('❌ Hero failed to fetch device comparison:', error);
        }
      }
    };

    fetchDeviceComparison();
  }, [content.comparison_snippet]);

  // Memoized navigation handlers to prevent unnecessary re-renders
  const handleCompareNow = useCallback(() => {
    navigate(FallbackHelper.getNavigationUrl(getFieldValue(content.hero_primary_button_url), 'COMPARE_URL'));
  }, [navigate, content.hero_primary_button_url]);

  const handleBrowsePhones = useCallback(() => {
    navigate(FallbackHelper.getNavigationUrl(getFieldValue(content.hero_secondary_button_url), 'BROWSE_URL'));
  }, [navigate, content.hero_secondary_button_url]);

  // Memoized hero stats rendering to avoid re-creating on every render
  const heroStatsElements = useMemo(() => {
    if (heroStats.length === 0) return null;
    
    return (
      <div className="hero__stats">
        {heroStats.map((stat, index) => {
          // Map back to original CMS field names for proper edit attributes
          const statNumber = index === 0 ? content.hero_stat_1_number :
                            index === 1 ? content.hero_stat_2_number :
                            content.hero_stat_3_number;
          const statLabel = index === 0 ? content.hero_stat_1_label :
                           index === 1 ? content.hero_stat_2_label :
                           content.hero_stat_3_label;
          
          
          return (
            <div key={`${stat.number}-${stat.label}-${index}`} className="hero__stat">
              <span className="hero__stat-number" {...getEditAttributes(statNumber)}>{getFieldValue(statNumber)}</span>
              <span className="hero__stat-label" {...getEditAttributes(statLabel)}>{getFieldValue(statLabel)}</span>
            </div>
          );
        })}
      </div>
    );
  }, [heroStats, content.hero_stat_1_number, content.hero_stat_1_label, content.hero_stat_2_number, content.hero_stat_2_label, content.hero_stat_3_number, content.hero_stat_3_label]);

  // Memoized phone showcase data to prevent unnecessary re-computation
  const phoneShowcaseData = useMemo(() => {
    // Priority 1: Use device comparison data from comparison_snippet
    if (deviceComparison) {
      // Transform device comparison metrics into hero specs format
      const specs = deviceComparison.comparison_metrics.slice(0, 3).map(metric => ({
        label: metric.metric_name,
        phone1Value: metric.left_value,
        phone2Value: metric.right_value,
        phone1Better: metric.left_highlight || false,
        phone2Better: metric.right_highlight || false
      }));

      return {
        phone1: {
          name: deviceComparison.left_device.device_name,
          icon: getDeviceIcon(deviceComparison.left_device.device_type)
        },
        phone2: {
          name: deviceComparison.right_device.device_name,
          icon: getDeviceIcon(deviceComparison.right_device.device_type)
        },
        vsText: 'VS',
        specs
      };
    }

    // Priority 2: Use new CMS structure if available, otherwise fallback to old structure or defaults
    if (heroShowcase) {
      return {
        phone1: {
          name: getFieldValue(heroShowcase.phone_1.title),
          icon: getFieldValue(heroShowcase.phone_1.icon) || '📱'
        },
        phone2: {
          name: getFieldValue(heroShowcase.phone_2.title),
          icon: getFieldValue(heroShowcase.phone_2.icon) || '📱'
        },
        vsText: getFieldValue(heroShowcase.vs_text),
        specs: heroShowcase.specifications.map(spec => ({
          label: getFieldValue(spec.label),
          phone1Value: getFieldValue(spec.phone_1_value),
          phone2Value: getFieldValue(spec.phone_2_value),
          phone1Better: !getFieldValue(spec.phone_2_better),
          phone2Better: getFieldValue(spec.phone_2_better)
        }))
      };
    }

    // Fallback to old CMS structure or defaults
    return {
      phone1: {
        name: FallbackHelper.getPhoneInfo(getFieldValue(content.hero_phone_1_name), 'DEFAULT_PHONE_1'),
        icon: FallbackHelper.getPhoneInfo(getFieldValue(content.hero_phone_1_icon), 'PHONE_ICON')
      },
      phone2: {
        name: FallbackHelper.getPhoneInfo(getFieldValue(content.hero_phone_2_name), 'DEFAULT_PHONE_2'),
        icon: FallbackHelper.getPhoneInfo(getFieldValue(content.hero_phone_2_icon), 'PHONE_ICON')
      },
      vsText: FallbackHelper.getPhoneInfo(getFieldValue(content.hero_vs_text), 'VS_TEXT'),
      specs: [
        {
          label: FallbackHelper.getSpecification(getFieldValue(content.hero_spec_1_label), 'CAMERA_LABEL'),
          phone1Value: FallbackHelper.getSpecification(getFieldValue(content.hero_spec_1_phone_1_value), 'CAMERA_PHONE_1'),
          phone2Value: FallbackHelper.getSpecification(getFieldValue(content.hero_spec_1_phone_2_value), 'CAMERA_PHONE_2'),
          phone1Better: getFieldValue(content.hero_spec_1_phone_1_better)
        },
        {
          label: FallbackHelper.getSpecification(getFieldValue(content.hero_spec_2_label), 'BATTERY_LABEL'),
          phone1Value: FallbackHelper.getSpecification(getFieldValue(content.hero_spec_2_phone_1_value), 'BATTERY_PHONE_1'),
          phone2Value: FallbackHelper.getSpecification(getFieldValue(content.hero_spec_2_phone_2_value), 'BATTERY_PHONE_2'),
          phone2Better: getFieldValue(content.hero_spec_2_phone_2_better)
        },
        {
          label: FallbackHelper.getSpecification(getFieldValue(content.hero_spec_3_label), 'PRICE_LABEL'),
          phone1Value: FallbackHelper.getSpecification(getFieldValue(content.hero_spec_3_phone_1_value), 'PRICE_PHONE_1'),
          phone2Value: FallbackHelper.getSpecification(getFieldValue(content.hero_spec_3_phone_2_value), 'PRICE_PHONE_2'),
          phone2Better: getFieldValue(content.hero_spec_3_phone_2_better)
        }
      ]
    };
  }, [
    deviceComparison, // Add deviceComparison as primary dependency
    heroShowcase,
    content.hero_phone_1_name, content.hero_phone_1_icon,
    content.hero_phone_2_name, content.hero_phone_2_icon,
    content.hero_vs_text,
    content.hero_spec_1_label, content.hero_spec_1_phone_1_value, content.hero_spec_1_phone_2_value, content.hero_spec_1_phone_1_better,
    content.hero_spec_2_label, content.hero_spec_2_phone_1_value, content.hero_spec_2_phone_2_value, content.hero_spec_2_phone_2_better,
    content.hero_spec_3_label, content.hero_spec_3_phone_1_value, content.hero_spec_3_phone_2_value, content.hero_spec_3_phone_2_better
  ]);

  return (
    <section className="hero">
      <div className="hero__container">
        <div className="hero__content">
          <div className="hero__badge">
            <span className="hero__badge-text" {...getEditAttributes(content.hero_badge_text)}>
              {getFieldValue(content.hero_badge_text)}
            </span>
          </div>
          
          <h1 className="hero__title" {...getEditAttributes(content.hero_title)}>
            {getFieldValue(content.hero_title)}
            <span className="hero__title-highlight" {...getEditAttributes(content.hero_title_highlight)}>
              {getFieldValue(content.hero_title_highlight)}
            </span>
          </h1>
          
          <p className="hero__subtitle" {...getEditAttributes(content.hero_subtitle)}>
            {getFieldValue(content.hero_subtitle)}
          </p>
          
          <div className="hero__actions">
            <Button 
              variant="gradient" 
              size="lg" 
              icon={Search}
              onClick={handleCompareNow}
            >
              {getFieldValue(content.hero_primary_button_text)}
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              icon={Smartphone}
              onClick={handleBrowsePhones}
            >
              {getFieldValue(content.hero_secondary_button_text)}
            </Button>
          </div>
          
          {heroStatsElements}
        </div>
        
        <div className="hero__visual">
          <Card className="hero__phone-preview" variant="elevated" hover>
            <div className="hero__phone-showcase">
              <div className="hero__phone-card hero__phone-card--primary">
                <span style={{ fontSize: '32px' }}>{phoneShowcaseData.phone1.icon}</span>
                <span {...getEditAttributes(content.hero_phone_1_name)}>{phoneShowcaseData.phone1.name}</span>
              </div>
              <div className="hero__vs" {...getEditAttributes(content.hero_vs_text)}>{phoneShowcaseData.vsText}</div>
              <div className="hero__phone-card hero__phone-card--secondary">
                <span style={{ fontSize: '32px' }}>{phoneShowcaseData.phone2.icon}</span>
                <span {...getEditAttributes(content.hero_phone_2_name)}>{phoneShowcaseData.phone2.name}</span>
              </div>
            </div>
            <div className="hero__comparison-preview">
              {phoneShowcaseData.specs.map((spec, index) => (
                <div key={`${spec.label}-${index}`} className="hero__spec-row">
                  <span {...getEditAttributes(content[`hero_spec_${index + 1}_label` as keyof HomePageContent])}>{spec.label}</span>
                  <span className={`hero__spec-value ${
                    index === 0 ? (spec.phone1Better ? 'hero__spec-value--better' : '') :
                    index === 1 ? (!spec.phone2Better ? 'hero__spec-value--better' : '') :
                    (!spec.phone2Better ? 'hero__spec-value--better' : '')
                  }`}>
                    {spec.phone1Value}
                  </span>
                  <span className={`hero__spec-value ${
                    index === 0 ? (!spec.phone1Better ? 'hero__spec-value--better' : '') :
                    index === 1 ? (spec.phone2Better ? 'hero__spec-value--better' : '') :
                    (spec.phone2Better ? 'hero__spec-value--better' : '')
                  }`}>
                    {spec.phone2Value}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
});

// Custom comparison function for React.memo to optimize re-renders
HeroSection.displayName = 'HeroSection';

export default HeroSection;