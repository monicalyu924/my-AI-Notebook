import React from 'react';
import { useResponsiveLayout } from '../../hooks/useResponsiveLayout';

interface ResponsiveLayoutProps {
  children: React.ReactNode;
  mobileLayout?: React.ReactNode;
  tabletLayout?: React.ReactNode;
  desktopLayout?: React.ReactNode;
  className?: string;
}

/**
 * 响应式布局组件 - 根据屏幕大小渲染不同的布局
 */
const ResponsiveLayout: React.FC<ResponsiveLayoutProps> = ({
  children,
  mobileLayout,
  tabletLayout,
  desktopLayout,
  className = ''
}) => {
  const { isMobile, isTablet, isDesktop } = useResponsiveLayout();

  // 优先级：特定布局 > 通用布局
  if (isMobile && mobileLayout) {
    return <div className={className}>{mobileLayout}</div>;
  }
  
  if (isTablet && tabletLayout) {
    return <div className={className}>{tabletLayout}</div>;
  }
  
  if (isDesktop && desktopLayout) {
    return <div className={className}>{desktopLayout}</div>;
  }

  return <div className={className}>{children}</div>;
};

export default ResponsiveLayout;