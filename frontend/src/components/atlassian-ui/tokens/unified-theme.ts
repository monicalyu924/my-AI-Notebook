// 统一主题配置
export const unifiedTheme = {
  // 主色调 - 统一使用紫色系
  colors: {
    primary: {
      50: '#F4F3FF',
      100: '#EDE9FE',
      200: '#DDD6FE',
      300: '#C4B5FD',
      400: '#A78BFA',
      500: '#8B5CF6', // 主要紫色
      600: '#7C3AED',
      700: '#6D28D9',
      800: '#5B21B6',
      900: '#4C1D95',
    },
    
    // 语义化颜色
    semantic: {
      success: '#22C55E',
      warning: '#F59E0B',
      error: '#EF4444',
      info: '#3B82F6',
    },
    
    // 中性色
    neutral: {
      0: '#FFFFFF',
      50: '#F9FAFB',
      100: '#F3F4F6',
      200: '#E5E7EB',
      300: '#D1D5DB',
      400: '#9CA3AF',
      500: '#6B7280',
      600: '#4B5563',
      700: '#374151',
      800: '#1F2937',
      900: '#111827',
    }
  },
  
  // 间距系统 (8px grid)
  spacing: {
    xs: '4px',   // 0.5 units
    sm: '8px',   // 1 unit
    md: '16px',  // 2 units
    lg: '24px',  // 3 units
    xl: '32px',  // 4 units
    '2xl': '48px', // 6 units
    '3xl': '64px', // 8 units
  },
  
  // 圆角系统
  borderRadius: {
    none: '0px',
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    full: '9999px',
  },
  
  // 阴影系统
  shadows: {
    sm: '0 1px 3px rgba(139, 92, 246, 0.12)',
    md: '0 4px 12px rgba(139, 92, 246, 0.15)',
    lg: '0 10px 25px rgba(139, 92, 246, 0.20)',
  },
  
  // 字体系统
  typography: {
    fontSize: {
      xs: '12px',
      sm: '14px',
      base: '16px',
      lg: '18px',
      xl: '20px',
      '2xl': '24px',
      '3xl': '32px',
    },
    lineHeight: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.75,
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    }
  }
} as const;

// CSS变量导出函数
export const generateCSSVariables = () => {
  const cssVars: Record<string, string> = {};
  
  // 颜色变量
  Object.entries(unifiedTheme.colors.primary).forEach(([key, value]) => {
    cssVars[`--color-primary-${key}`] = value;
  });
  
  Object.entries(unifiedTheme.colors.semantic).forEach(([key, value]) => {
    cssVars[`--color-${key}`] = value;
  });
  
  Object.entries(unifiedTheme.colors.neutral).forEach(([key, value]) => {
    cssVars[`--color-neutral-${key}`] = value;
  });
  
  // 间距变量
  Object.entries(unifiedTheme.spacing).forEach(([key, value]) => {
    cssVars[`--spacing-${key}`] = value;
  });
  
  return cssVars;
};