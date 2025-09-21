import { useState, useEffect } from 'react';

export const useAdvancedResponsive = () => {
  const [screenInfo, setScreenInfo] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768,
    isMobile: false,
    isTablet: false,
    isDesktop: false,
    orientation: 'landscape',
    deviceType: 'desktop'
  });

  useEffect(() => {
    const updateScreenInfo = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const isMobile = width < 768;
      const isTablet = width >= 768 && width < 1024;
      const isDesktop = width >= 1024;
      const orientation = width > height ? 'landscape' : 'portrait';
      
      // 更精确的设备类型检测
      let deviceType = 'desktop';
      if (isMobile) {
        deviceType = 'mobile';
      } else if (isTablet) {
        deviceType = 'tablet';
      }

      setScreenInfo({
        width,
        height,
        isMobile,
        isTablet,
        isDesktop,
        orientation,
        deviceType
      });
    };

    updateScreenInfo();
    window.addEventListener('resize', updateScreenInfo);
    window.addEventListener('orientationchange', updateScreenInfo);

    return () => {
      window.removeEventListener('resize', updateScreenInfo);
      window.removeEventListener('orientationchange', updateScreenInfo);
    };
  }, []);

  // 响应式样式生成器
  const getResponsiveClasses = (mobileClasses, tabletClasses, desktopClasses) => {
    if (screenInfo.isMobile) return mobileClasses;
    if (screenInfo.isTablet) return tabletClasses;
    return desktopClasses;
  };

  // 响应式值选择器
  const getResponsiveValue = (mobileValue, tabletValue, desktopValue) => {
    if (screenInfo.isMobile) return mobileValue;
    if (screenInfo.isTablet) return tabletValue;
    return desktopValue;
  };

  // 布局配置生成器
  const getLayoutConfig = () => {
    return {
      sidebar: {
        width: getResponsiveValue('100%', '280px', '320px'),
        isCollapsible: screenInfo.isMobile,
        showOverlay: screenInfo.isMobile,
        position: getResponsiveValue('fixed', 'relative', 'relative')
      },
      content: {
        padding: getResponsiveValue('16px', '24px', '32px'),
        maxWidth: getResponsiveValue('100%', '768px', '1200px'),
        columns: getResponsiveValue(1, 2, 3)
      },
      modal: {
        maxWidth: getResponsiveValue('calc(100vw - 16px)', '600px', '800px'),
        margin: getResponsiveValue('8px', '32px', '48px'),
        borderRadius: getResponsiveValue('12px', '16px', '20px')
      }
    };
  };

  return {
    ...screenInfo,
    getResponsiveClasses,
    getResponsiveValue,
    getLayoutConfig
  };
};

export default useAdvancedResponsive;