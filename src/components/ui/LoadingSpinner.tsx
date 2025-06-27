import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * LoadingSpinner Component
 * 
 * A reusable loading spinner with configurable size
 */
const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16',
  };

  return (
    <div className="flex justify-center items-center h-64">
      <div className={`animate-spin rounded-full border-b-2 border-primary-600 ${sizeClasses[size]} ${className}`}></div>
    </div>
  );
};

export default LoadingSpinner;