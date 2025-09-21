import React, { useEffect, useState } from 'react';

const SkeletonLoader = ({ type = 'card' }) => {
  if (type === 'card') {
    return (
      <div className="animate-pulse space-y-2">
        <div className="bg-gray-200 h-4 rounded w-3/4"></div>
        <div className="bg-gray-200 h-3 rounded w-1/2"></div>
      </div>
    );
  }
  
  if (type === 'list') {
    return (
      <div className="animate-pulse space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center space-x-3">
            <div className="bg-gray-200 h-4 w-4 rounded"></div>
            <div className="bg-gray-200 h-4 rounded flex-1"></div>
          </div>
        ))}
      </div>
    );
  }
  
  return (
    <div className="animate-pulse">
      <div className="bg-gray-200 h-4 rounded"></div>
    </div>
  );
};

const LoadingSpinner = ({ 
  size = 'md', 
  text = '加载中...', 
  showSkeleton = false, 
  skeletonType = 'card',
  autoHide = false,
  hideDelay = 5000
}) => {
  const [visible, setVisible] = useState(true);
  
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12'
  };

  useEffect(() => {
    if (autoHide) {
      const timer = setTimeout(() => setVisible(false), hideDelay);
      return () => clearTimeout(timer);
    }
  }, [autoHide, hideDelay]);

  if (!visible) return null;

  if (showSkeleton) {
    return <SkeletonLoader type={skeletonType} />;
  }

  return (
    <div className="flex items-center justify-center space-x-2" role="status" aria-live="polite">
      <div
        className={`${sizeClasses[size]} animate-spin rounded-full border-2 border-gray-300 border-t-blue-600`}
        aria-hidden="true"
      ></div>
      {text && (
        <span className="text-gray-600 text-sm sr-only md:not-sr-only">
          {text}
        </span>
      )}
    </div>
  );
};

export default LoadingSpinner;
