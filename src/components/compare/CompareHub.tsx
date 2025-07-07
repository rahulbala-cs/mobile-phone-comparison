import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Smartphone, Laptop, Headphones, ArrowRight, TrendingUp, Clock } from 'lucide-react';
import { Card, Button, Badge } from '../shared';
import ProgressIndicator from './ProgressIndicator';
import './CompareHub.css';

const categories = [
  {
    id: 'mobile-phones',
    title: 'Mobile Phones',
    description: 'Compare smartphones from all major brands',
    icon: Smartphone,
    available: true,
    count: '100+',
    color: '#667eea',
    route: '/compare/mobile-phones'
  },
  {
    id: 'laptops',
    title: 'Laptops',
    description: 'Coming soon - Compare laptops and notebooks',
    icon: Laptop,
    available: false,
    count: 'Soon',
    color: '#10b981',
    route: '/compare/laptops'
  },
  {
    id: 'audio',
    title: 'Audio Devices',
    description: 'Coming soon - Compare headphones and speakers',
    icon: Headphones,
    available: false,
    count: 'Soon',
    color: '#f59e0b',
    route: '/compare/audio'
  }
];

const quickComparisons = [
  {
    title: 'iPhone 16 Pro vs Samsung S24 Ultra',
    category: 'Flagship Battle',
    popularity: 'trending',
    route: '/compare/iphone-16-pro-vs-samsung-galaxy-s24-ultra'
  },
  {
    title: 'Google Pixel 9 vs OnePlus 12',
    category: 'AI vs Speed',
    popularity: 'hot',
    route: '/compare/google-pixel-9-vs-oneplus-12'
  },
  {
    title: 'iPhone 16 vs Google Pixel 9',
    category: 'Best Value',
    popularity: 'popular',
    route: '/compare/iphone-16-vs-google-pixel-9'
  }
];

const CompareHub: React.FC = () => {
  const navigate = useNavigate();

  const handleCategorySelect = (category: typeof categories[0]) => {
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

  return (
    <div className="compare-hub">
      <div className="compare-hub__container">
        {/* Header Section */}
        <div className="compare-hub__header">
          <ProgressIndicator currentStep={1} totalSteps={4} />
          <h1 className="compare-hub__title">What would you like to compare?</h1>
          <p className="compare-hub__subtitle">
            Select a category to start comparing devices and find the perfect match for your needs.
          </p>
        </div>

        {/* Category Selection */}
        <section className="compare-hub__section">
          <h2 className="compare-hub__section-title">Choose a Category</h2>
          <div className="compare-hub__categories">
            {categories.map((category) => {
              const Icon = category.icon;
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
                    <h3 className="compare-hub__category-title">{category.title}</h3>
                    <p className="compare-hub__category-description">{category.description}</p>
                  </div>
                  
                  <div className="compare-hub__category-action">
                    <Button 
                      variant={category.available ? 'primary' : 'ghost'} 
                      size="sm"
                      icon={ArrowRight}
                      iconPosition="right"
                      disabled={!category.available}
                    >
                      {category.available ? 'Compare Now' : 'Coming Soon'}
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
            <h2 className="compare-hub__section-title">
              <TrendingUp className="compare-hub__section-icon" />
              Popular Comparisons
            </h2>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleBrowseAll}
            >
              Browse All Phones
            </Button>
          </div>
          
          <div className="compare-hub__quick-comparisons">
            {quickComparisons.map((comparison, index) => (
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
                  >
                    {comparison.popularity === 'trending' ? '🔥 Trending' : 
                     comparison.popularity === 'hot' ? '🌟 Hot' : '📈 Popular'}
                  </Badge>
                  <Badge variant="default" size="sm">
                    {comparison.category}
                  </Badge>
                </div>
                
                <h3 className="compare-hub__comparison-title">{comparison.title}</h3>
                
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
              <Clock size={24} />
              <div>
                <h3 className="compare-hub__help-title">Need Help Choosing?</h3>
                <p className="compare-hub__help-description">
                  Not sure which phones to compare? Browse our complete database or check out our buying guide.
                </p>
              </div>
              <Button variant="outline" onClick={handleBrowseAll}>
                Browse All Phones
              </Button>
            </div>
          </Card>
        </section>
      </div>
    </div>
  );
};

export default CompareHub;