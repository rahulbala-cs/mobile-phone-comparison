import React from 'react';
import { BarChart3, Smartphone, DollarSign, Zap, Shield, Users, Star, Clock, Award, TrendingUp } from 'lucide-react';
import { Card } from '../shared';
import { HomePageContent, Feature } from '../../types/HomePageContent';
import { getEditAttributes, VB_EmptyBlockParentClass } from '../../utils/livePreview';
import { getFieldValue } from '../../types/EditableTags';
import './FeaturesGrid.css';

// Icon mapping for dynamic icon loading
const iconMap: { [key: string]: React.ElementType } = {
  BarChart3,
  Smartphone,
  DollarSign,
  Zap,
  Shield,
  Users,
  Star,
  Clock,
  Award,
  TrendingUp
};

interface FeaturesGridProps {
  content: HomePageContent;
  features: Feature[];
}

const FeaturesGrid: React.FC<FeaturesGridProps> = ({ content, features }) => {
  return (
    <section className="features">
      <div className="features__container">
        <div className="features__header">
          <h2 className="features__title" {...getEditAttributes(content.features_section_title)}>
            {getFieldValue(content.features_section_title)}
          </h2>
          <p className="features__subtitle" {...getEditAttributes(content.features_section_subtitle)}>
            {getFieldValue(content.features_section_subtitle)}
          </p>
        </div>
        
        <div className={`features__grid ${features.length ? '' : VB_EmptyBlockParentClass}`}>
          {features.map((feature, index) => {
            const Icon = iconMap[feature.icon_name] || Smartphone; // Default to Smartphone icon if not found
            return (
              <Card 
                key={index} 
                className="features__card" 
                variant="elevated" 
                hover
              >
                <div 
                  className="features__icon" 
                  style={{ backgroundColor: `${feature.color}15`, color: feature.color }}
                >
                  <Icon size={24} />
                </div>
                <h3 className="features__card-title">{feature.title}</h3>
                <p className="features__card-description">{feature.description}</p>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FeaturesGrid;