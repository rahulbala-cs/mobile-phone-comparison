import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, Users, Clock, Award, BarChart3, Smartphone, DollarSign, Zap, Shield, TrendingUp } from 'lucide-react';
import { Button } from '../shared';
import { HomePageContent, Stat } from '../../types/HomePageContent';
import { getEditAttributes } from '../../utils/livePreview';
import { getFieldValue } from '../../types/EditableTags';
import './StatsSection.css';

// Icon mapping for dynamic icon loading
const iconMap: { [key: string]: React.ElementType } = {
  Star,
  Users,
  Clock,
  Award,
  BarChart3,
  Smartphone,
  DollarSign,
  Zap,
  Shield,
  TrendingUp
};

interface StatsSectionProps {
  content: HomePageContent;
  stats: Stat[];
}

const StatsSection: React.FC<StatsSectionProps> = ({ content, stats }) => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/compare');
  };

  return (
    <section className="stats">
      <div className="stats__container">
        <div className="stats__content">
          <div className="stats__header">
            <h2 className="stats__title" {...getEditAttributes(content.stats_section_title)}>
              {getFieldValue(content.stats_section_title)}
            </h2>
            <p className="stats__subtitle" {...getEditAttributes(content.stats_section_subtitle)}>
              {getFieldValue(content.stats_section_subtitle)}
            </p>
          </div>

          <div className="stats__grid">
            {stats.map((stat, index) => {
              const Icon = iconMap[stat.icon_name] || Users; // Default to Users icon if not found
              return (
                <div key={index} className="stats__item">
                  <div className="stats__icon">
                    <Icon size={24} />
                  </div>
                  <div className="stats__data">
                    <span className="stats__value">{stat.value}</span>
                    <span className="stats__label">{stat.label}</span>
                    <span className="stats__description">{stat.description}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="stats__cta">
            <div className="stats__cta-content">
              <h3 className="stats__cta-title" {...getEditAttributes(content.cta_title)}>
                {getFieldValue(content.cta_title)}
              </h3>
              <p className="stats__cta-description" {...getEditAttributes(content.cta_description)}>
                {getFieldValue(content.cta_description)}
              </p>
              <Button 
                variant="gradient" 
                size="lg"
                onClick={handleGetStarted}
              >
                {getFieldValue(content.cta_button_text)}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default StatsSection;