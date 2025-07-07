import React from 'react';
import { LucideIcon } from 'lucide-react';
import './Badge.css';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md' | 'lg';
  icon?: LucideIcon;
  className?: string;
  removable?: boolean;
  onRemove?: () => void;
}

const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  icon: Icon,
  className = '',
  removable = false,
  onRemove
}) => {
  const badgeClasses = [
    'badge',
    `badge--${variant}`,
    `badge--${size}`,
    className
  ].filter(Boolean).join(' ');

  return (
    <span className={badgeClasses}>
      {Icon && (
        <Icon className="badge__icon" size={size === 'sm' ? 12 : size === 'lg' ? 16 : 14} />
      )}
      
      <span className="badge__text">{children}</span>
      
      {removable && (
        <button
          className="badge__remove"
          onClick={onRemove}
          aria-label="Remove"
        >
          ×
        </button>
      )}
    </span>
  );
};

export default Badge;