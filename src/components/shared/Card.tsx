import React from 'react';
import './Card.css';

export interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'bordered' | 'gradient';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
  hover?: boolean;
}

const Card: React.FC<CardProps> = ({ 
  children, 
  variant = 'default', 
  size = 'md',
  className = '',
  onClick,
  hover = false
}) => {
  const cardClasses = [
    'card',
    `card--${variant}`,
    `card--${size}`,
    hover && 'card--hover',
    onClick && 'card--clickable',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={cardClasses} onClick={onClick}>
      {children}
    </div>
  );
};

export default Card;