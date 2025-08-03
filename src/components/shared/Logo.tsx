import React from 'react';
import './Logo.css';

interface LogoProps {
  size?: 'small' | 'medium' | 'large';
  variant?: 'full' | 'icon-only' | 'text-only';
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ 
  size = 'medium', 
  variant = 'full', 
  className = '' 
}) => {
  const logoIcon = (
    <div className={`logo-icon logo-icon--${size}`}>
      <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Background Circle */}
        <circle cx="16" cy="16" r="16" fill="url(#logoGradient)" />
        
        {/* Phone 1 */}
        <rect x="8" y="10" width="6" height="12" rx="1" fill="white" stroke="currentColor" strokeWidth="0.5" opacity="0.9"/>
        <rect x="9" y="12" width="4" height="6" rx="0.5" fill="#f8fafc"/>
        <rect x="9.5" y="13" width="3" height="1" rx="0.2" fill="#e2e8f0"/>
        <rect x="9.5" y="15" width="2" height="0.5" rx="0.2" fill="#cbd5e1"/>
        
        {/* VS */}
        <text x="16" y="18" textAnchor="middle" fill="white" fontFamily="Arial" fontWeight="bold" fontSize="4">VS</text>
        
        {/* Phone 2 */}
        <rect x="18" y="10" width="6" height="12" rx="1" fill="white" stroke="currentColor" strokeWidth="0.5" opacity="0.9"/>
        <rect x="19" y="12" width="4" height="6" rx="0.5" fill="#f8fafc"/>
        <rect x="19.5" y="13" width="3" height="1" rx="0.2" fill="#e2e8f0"/>
        <rect x="19.5" y="15" width="2.5" height="0.5" rx="0.2" fill="#cbd5e1"/>
        
        {/* Gradients */}
        <defs>
          <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#667eea" stopOpacity="1" />
            <stop offset="100%" stopColor="#764ba2" stopOpacity="1" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );

  const logoText = (
    <div className={`logo-text logo-text--${size}`}>
      <span className="logo-text-primary">Tech</span>
      <span className="logo-text-secondary">Compare</span>
    </div>
  );

  return (
    <div className={`logo logo--${size} logo--${variant} ${className}`}>
      {(variant === 'full' || variant === 'icon-only') && logoIcon}
      {(variant === 'full' || variant === 'text-only') && logoText}
    </div>
  );
};

export default Logo;