import React from 'react';
import { LucideIcon } from 'lucide-react';
import './Button.css';

export interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'gradient';
  size?: 'sm' | 'md' | 'lg';
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  type?: 'button' | 'submit' | 'reset';
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  fullWidth = false,
  className = '',
  onClick,
  type = 'button'
}) => {
  const buttonClasses = [
    'btn',
    `btn--${variant}`,
    `btn--${size}`,
    fullWidth && 'btn--full-width',
    loading && 'btn--loading',
    className
  ].filter(Boolean).join(' ');

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled && !loading && onClick) {
      onClick(e);
    }
  };

  return (
    <button
      type={type}
      className={buttonClasses}
      onClick={handleClick}
      disabled={disabled || loading}
    >
      {loading && (
        <div className="btn__spinner">
          <div className="btn__spinner-circle"></div>
        </div>
      )}
      
      {!loading && Icon && iconPosition === 'left' && (
        <Icon className="btn__icon btn__icon--left" size={size === 'sm' ? 16 : size === 'lg' ? 20 : 18} />
      )}
      
      <span className="btn__text">{children}</span>
      
      {!loading && Icon && iconPosition === 'right' && (
        <Icon className="btn__icon btn__icon--right" size={size === 'sm' ? 16 : size === 'lg' ? 20 : 18} />
      )}
    </button>
  );
};

export default Button;