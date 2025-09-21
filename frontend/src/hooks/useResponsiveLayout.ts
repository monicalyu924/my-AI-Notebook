import { useState, useEffect } from 'react';

interface ResponsiveLayout {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  screenWidth: number;
  screenHeight: number;
  touchSupported: boolean;
}

export const useResponsiveLayout = (): ResponsiveLayout => {
  const [screenWidth, setScreenWidth] = useState(window.innerWidth);
  const [screenHeight, setScreenHeight] = useState(window.innerHeight);
  const [touchSupported, setTouchSupported] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setScreenWidth(window.innerWidth);
      setScreenHeight(window.innerHeight);
    };

    const handleTouchSupport = () => {
      setTouchSupported('ontouchstart' in window || navigator.maxTouchPoints > 0);
    };

    handleResize();
    handleTouchSupport();

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  const isMobile = screenWidth < 768;
  const isTablet = screenWidth >= 768 && screenWidth < 1024;
  const isDesktop = screenWidth >= 1024;

  return {
    isMobile,
    isTablet,
    isDesktop,
    screenWidth,
    screenHeight,
    touchSupported
  };
};

// 响应式断点工具函数
export const getResponsiveClasses = ({
  mobile = '',
  tablet = '',
  desktop = '',
  default: defaultClass = ''
}: {
  mobile?: string;
  tablet?: string;
  desktop?: string;
  default?: string;
}) => {
  const { isMobile, isTablet, isDesktop } = useResponsiveLayout();
  
  const classes = [defaultClass];
  
  if (isMobile && mobile) classes.push(mobile);
  if (isTablet && tablet) classes.push(tablet);
  if (isDesktop && desktop) classes.push(desktop);
  
  return classes.join(' ');
};

// 拖拽优化Hook
export const useDragOptimization = () => {
  const { isMobile, touchSupported } = useResponsiveLayout();
  
  return {
    // 移动端优化设置 - 修复距离太大导致点击被识别为拖拽
    activationConstraint: { distance: 3 }, // 统一使用3px，避免点击被误判
    // 触摸设备优化 - 修复完全禁用触摸操作的问题
    touchAction: 'auto', // 允许触摸操作，避免完全禁用交互
    // 移动端拖拽手柄大小
    dragHandleSize: isMobile ? '44px' : 'auto'
  };
};