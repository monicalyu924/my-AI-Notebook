import { useState, useEffect, useCallback } from 'react';

// 移动端优化Hook
export const useMobileOptimization = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [orientation, setOrientation] = useState('portrait');
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  // 检测设备类型
  const detectDevice = useCallback(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;

    // 更新视口大小
    setViewportSize({ width, height });

    // 检测设备类型
    setIsMobile(width < 768);
    setIsTablet(width >= 768 && width < 1024);

    // 检测方向
    setOrientation(width > height ? 'landscape' : 'portrait');

    // 检测触摸设备
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);

  // 防抖处理
  const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  };

  // 优化的resize处理
  const handleResize = useCallback(
    debounce(() => {
      detectDevice();
    }, 250),
    []
  );

  useEffect(() => {
    // 初始检测
    detectDevice();

    // 添加事件监听
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', detectDevice);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', detectDevice);
    };
  }, [detectDevice, handleResize]);

  // 获取响应式类名
  const getResponsiveClass = useCallback((baseClass, mobileClass, tabletClass) => {
    if (isMobile) return `${baseClass} ${mobileClass}`;
    if (isTablet) return `${baseClass} ${tabletClass}`;
    return baseClass;
  }, [isMobile, isTablet]);

  // 获取响应式样式
  const getResponsiveStyle = useCallback((desktop, tablet, mobile) => {
    if (isMobile) return mobile || tablet || desktop;
    if (isTablet) return tablet || desktop;
    return desktop;
  }, [isMobile, isTablet]);

  // 触摸事件优化
  const optimizeTouchEvents = useCallback((element) => {
    if (!element || !isTouchDevice) return;

    // 添加触摸优化样式
    element.style.touchAction = 'manipulation';
    element.style.userSelect = 'none';
    element.style.webkitTapHighlightColor = 'transparent';
  }, [isTouchDevice]);

  return {
    isMobile,
    isTablet,
    isDesktop: !isMobile && !isTablet,
    orientation,
    viewportSize,
    isTouchDevice,
    getResponsiveClass,
    getResponsiveStyle,
    optimizeTouchEvents,
    deviceInfo: {
      type: isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop',
      orientation,
      touch: isTouchDevice,
      viewport: viewportSize
    }
  };
};

// 移动端性能优化配置
export const mobileOptimizations = {
  // 图片懒加载配置
  lazyImage: {
    threshold: 0.1,
    rootMargin: '50px',
  },
  
  // 触摸滑动配置
  swipe: {
    threshold: 50,
    velocity: 0.3,
  },
  
  // 动画配置
  animation: {
    mobile: {
      duration: 0.2,
      easing: 'ease-out',
    },
    desktop: {
      duration: 0.3,
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
    }
  },
  
  // 虚拟滚动配置
  virtualScroll: {
    itemHeight: 80,
    buffer: 5,
    throttle: 16,
  }
};

// 响应式断点
export const breakpoints = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
};

// 媒体查询帮助函数
export const mediaQueries = {
  mobile: `(max-width: ${breakpoints.md - 1}px)`,
  tablet: `(min-width: ${breakpoints.md}px) and (max-width: ${breakpoints.lg - 1}px)`,
  desktop: `(min-width: ${breakpoints.lg}px)`,
  retina: '(-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi)',
  prefersReducedMotion: '(prefers-reduced-motion: reduce)',
  prefersDarkMode: '(prefers-color-scheme: dark)',
};

export default useMobileOptimization;