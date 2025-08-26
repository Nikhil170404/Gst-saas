// src/components/common/LoadingSpinner.js
import React from 'react';

const LoadingSpinner = ({ size = 'md', text = '' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4'
  };

  return (
    <div className="loading">
      <div className="flex flex-col items-center gap-4">
        <div className={`spinner ${sizeClasses[size]}`}></div>
        {text && <p className="text-sm text-gray-500">{text}</p>}
      </div>
    </div>
  );
};

export default LoadingSpinner;
