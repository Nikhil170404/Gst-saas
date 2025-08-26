// src/components/common/LoadingSpinner.js - Enhanced version
import React from 'react';

const LoadingSpinner = ({ 
  size = 'md', 
  text = '', 
  variant = 'primary',
  fullScreen = false,
  overlay = false 
}) => {
  const sizeClasses = {
    xs: 'w-4 h-4 border-2',
    sm: 'w-6 h-6 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
    xl: 'w-16 h-16 border-4'
  };

  const colorClasses = {
    primary: 'border-primary-200 border-t-primary-600',
    secondary: 'border-gray-200 border-t-gray-600',
    white: 'border-white/30 border-t-white',
    success: 'border-green-200 border-t-green-600',
    warning: 'border-yellow-200 border-t-yellow-600',
    error: 'border-red-200 border-t-red-600'
  };

  const SpinnerComponent = () => (
    <div className="flex flex-col items-center gap-4 animate-fade-in">
      {/* Modern Spinner */}
      <div className="relative">
        <div 
          className={`
            spinner rounded-full animate-spin
            ${sizeClasses[size]} 
            ${colorClasses[variant]}
          `}
        />
        {size === 'lg' || size === 'xl' ? (
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-current opacity-20 animate-spin" 
               style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
        ) : null}
      </div>

      {/* Loading Text */}
      {text && (
        <div className="text-center">
          <p className={`font-medium animate-pulse ${
            variant === 'white' ? 'text-white' : 'text-gray-700'
          }`}>
            {text}
          </p>
        </div>
      )}
    </div>
  );

  // Full screen loading
  if (fullScreen) {
    return (
      <div className={`
        fixed inset-0 z-50 flex items-center justify-center
        ${overlay ? 'bg-black/50 backdrop-blur-sm' : 'bg-white'}
      `}>
        <div className="text-center p-8">
          <SpinnerComponent />
        </div>
      </div>
    );
  }

  // Inline loading
  return (
    <div className="loading flex justify-center items-center p-8">
      <SpinnerComponent />
    </div>
  );
};

// Skeleton Loading Components
export const SkeletonLoader = ({ 
  lines = 3, 
  className = '', 
  avatar = false,
  title = false 
}) => (
  <div className={`animate-pulse space-y-3 ${className}`}>
    {avatar && (
      <div className="flex items-center space-x-4 mb-4">
        <div className="w-12 h-12 bg-gray-200 rounded-full skeleton"></div>
        <div className="flex-1">
          <div className="h-4 bg-gray-200 rounded w-1/4 skeleton mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/3 skeleton"></div>
        </div>
      </div>
    )}
    
    {title && (
      <div className="h-6 bg-gray-200 rounded w-1/2 skeleton mb-4"></div>
    )}
    
    {Array.from({ length: lines }).map((_, index) => (
      <div 
        key={index}
        className={`h-4 bg-gray-200 rounded skeleton ${
          index === lines - 1 ? 'w-3/4' : 'w-full'
        }`}
      />
    ))}
  </div>
);

// Card Skeleton
export const CardSkeleton = ({ count = 1 }) => (
  <div className="space-y-4">
    {Array.from({ length: count }).map((_, index) => (
      <div key={index} className="card-modern p-6">
        <SkeletonLoader lines={3} title avatar />
      </div>
    ))}
  </div>
);

// Table Skeleton
export const TableSkeleton = ({ rows = 5, columns = 4 }) => (
  <div className="table-container">
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 p-4 border-b border-gray-200">
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {Array.from({ length: columns }).map((_, index) => (
            <div key={index} className="h-4 bg-gray-200 rounded skeleton"></div>
          ))}
        </div>
      </div>
      
      {/* Rows */}
      <div className="divide-y divide-gray-200">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="p-4">
            <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
              {Array.from({ length: columns }).map((_, colIndex) => (
                <div key={colIndex} className="h-4 bg-gray-200 rounded skeleton"></div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// Chart Skeleton
export const ChartSkeleton = ({ height = 'h-64' }) => (
  <div className={`card-modern p-6 ${height}`}>
    <div className="flex justify-between items-center mb-4">
      <div className="h-6 bg-gray-200 rounded w-1/3 skeleton"></div>
      <div className="h-4 bg-gray-200 rounded w-16 skeleton"></div>
    </div>
    <div className="h-full bg-gray-100 rounded-lg skeleton flex items-end justify-center">
      <div className="flex items-end space-x-2 h-3/4 w-full px-4">
        {Array.from({ length: 7 }).map((_, index) => (
          <div
            key={index}
            className="bg-gray-200 rounded-t w-full skeleton"
            style={{ 
              height: `${Math.random() * 60 + 20}%`,
              animationDelay: `${index * 0.1}s`
            }}
          />
        ))}
      </div>
    </div>
  </div>
);

// Button Loading State
export const ButtonSpinner = ({ size = 'sm', color = 'white' }) => (
  <div 
    className={`
      spinner rounded-full animate-spin inline-block mr-2
      ${size === 'xs' ? 'w-3 h-3 border' : 'w-4 h-4 border-2'}
      ${color === 'white' ? 'border-white/30 border-t-white' : 'border-gray-300 border-t-gray-700'}
    `}
  />
);

export default LoadingSpinner;