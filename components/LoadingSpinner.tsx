
import React from 'react';

interface LoadingSpinnerProps {
  size?: string;
  color?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'w-5 h-5', color = 'border-white' }) => {
  return (
    <div
      className={`${size} ${color} border-t-transparent border-solid animate-spin rounded-full border-2`}
      role="status"
    >
        <span className="sr-only">Loading...</span>
    </div>
  );
};

export default LoadingSpinner;
