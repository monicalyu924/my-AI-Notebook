// 设计令牌导出入口
export * from './colors';
export * from './spacing';
export * from './typography';

// 阴影系统
export const shadows = {
  none: 'none',
  sm: '0 1px 1px rgba(9, 30, 66, 0.25)',
  md: '0 1px 1px rgba(9, 30, 66, 0.25), 0 0 1px rgba(9, 30, 66, 0.31)',
  lg: '0 4px 8px -2px rgba(9, 30, 66, 0.25), 0 0 1px rgba(9, 30, 66, 0.31)',
  xl: '0 8px 12px -4px rgba(9, 30, 66, 0.25), 0 0 1px rgba(9, 30, 66, 0.31)',
  overlay: '0 8px 16px -4px rgba(9, 30, 66, 0.25), 0 0 1px rgba(9, 30, 66, 0.31)',
} as const;

// 圆角系统
export const borderRadius = {
  none: '0px',
  sm: '3px',
  md: '6px',
  lg: '8px',
  xl: '12px',
  full: '9999px',
} as const;

// 动画系统
export const motion = {
  // 缓动函数
  easing: {
    standard: 'cubic-bezier(0.2, 0.0, 0.38, 0.9)',
    enter: 'cubic-bezier(0.0, 0.0, 0.38, 0.9)',
    exit: 'cubic-bezier(0.2, 0.0, 1.0, 0.9)',
  },
  
  // 持续时间
  duration: {
    instant: '0ms',
    fast: '100ms',
    medium: '200ms',
    slow: '300ms',
    slower: '400ms',
  },
} as const;

// Z-index 层级
export const zIndex = {
  dropdown: 1000,
  modal: 1100,
  popover: 1200,
  tooltip: 1300,
  toast: 1400,
} as const;

export type Shadow = keyof typeof shadows;
export type BorderRadius = keyof typeof borderRadius;
export type Duration = keyof typeof motion.duration;