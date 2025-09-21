import React from 'react';
import { useLocation } from 'react-router-dom';
import { useResponsiveLayout } from '../../hooks/useResponsiveLayout';

interface UnifiedLayoutProps {
  children: React.ReactNode;
  className?: string;
  showGradient?: boolean;
}

const UnifiedLayout: React.FC<UnifiedLayoutProps> = ({ 
  children, 
  className = '', 
  showGradient = true 
}) => {
  const location = useLocation();
  const { isMobile, isTablet } = useResponsiveLayout();
  const isProjectPage = location.pathname.includes('/app') && location.search.includes('projects');
  
  return (
    <div className={`
      min-h-screen w-full 
      ${showGradient && !isProjectPage ? 'bg-gradient-to-br from-purple-50 via-white to-blue-50' : 'bg-transparent'}
      ${className}
    `}>
      <div className={`
        w-full h-full 
        min-h-screen 
        max-w-screen-2xl 
        mx-auto 
        ${isMobile ? 'px-2 py-2' : isTablet ? 'px-4 py-4' : 'px-4 sm:px-6 lg:px-8 py-4 sm:py-6'}
        flex 
        flex-col
        overflow-auto
      `}>
        {children}
      </div>
    </div>
  );
};

export default UnifiedLayout;