import React from 'react';
import './Logo.css';

interface LogoABProps {
  size?: 'small' | 'medium' | 'large';
  variant?: 'full' | 'icon-only' | 'text-only';
  className?: string;
}

const LogoAB: React.FC<LogoABProps> = ({ 
  size = 'medium', 
  variant = 'full', 
  className = '' 
}) => {
  const logoIcon = (
    <div className={`logo-icon logo-icon--${size}`}>
      <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Phone Background */}
        <rect x="4" y="2" width="24" height="28" rx="6" fill="#6B7280" />
        <rect x="6" y="4" width="20" height="24" rx="4" fill="#E5E7EB" />
        
        {/* Screen */}
        <rect x="7" y="6" width="18" height="16" rx="2" fill="#F9FAFB" />
        
        {/* Notch */}
        <rect x="12" y="4" width="8" height="2" rx="1" fill="#9CA3AF" />
        
        {/* Home Button */}
        <circle cx="16" cy="26" r="1.5" fill="#9CA3AF" />
        
        {/* A Label (Green) */}
        <rect x="8" y="10" width="6" height="6" rx="2" fill="#10B981" />
        <text x="11" y="15" textAnchor="middle" fill="white" fontFamily="Arial" fontWeight="bold" fontSize="4">A</text>
        
        {/* B Label (Red) */}
        <rect x="18" y="10" width="6" height="6" rx="2" fill="#EF4444" />
        <text x="21" y="15" textAnchor="middle" fill="white" fontFamily="Arial" fontWeight="bold" fontSize="4">B</text>
      </svg>
    </div>
  );

  const logoText = (
    <div className={`logo-text logo-text--${size}`}>
      <span className="logo-text-primary">Mobile</span>
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

export default LogoAB;