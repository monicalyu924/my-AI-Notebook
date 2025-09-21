// Atlassian 8px 网格间距系统
export const spacing = {
  // 基础间距 (8px 网格系统)
  0: '0px',
  25: '2px',   // 0.25 * 8px
  50: '4px',   // 0.5 * 8px
  100: '8px',  // 1 * 8px (基本单位)
  150: '12px', // 1.5 * 8px
  200: '16px', // 2 * 8px
  250: '20px', // 2.5 * 8px
  300: '24px', // 3 * 8px
  400: '32px', // 4 * 8px
  500: '40px', // 5 * 8px
  600: '48px', // 6 * 8px
  800: '64px', // 8 * 8px
  1000: '80px', // 10 * 8px
  1200: '96px', // 12 * 8px
} as const;

// 组件特定间距
export const componentSpacing = {
  // 按钮内边距
  button: {
    small: { x: '12px', y: '4px' },
    medium: { x: '16px', y: '8px' },
    large: { x: '24px', y: '12px' },
  },
  
  // 卡片间距
  card: {
    padding: '16px',
    gap: '12px',
  },
  
  // 导航栏
  navigation: {
    height: '56px',
    padding: '8px 16px',
    itemSpacing: '8px',
  },
  
  // 侧边栏
  sidebar: {
    width: '240px',
    collapsedWidth: '64px',
    padding: '16px',
    itemHeight: '40px',
  },
  
  // 时间轴
  timeline: {
    rowHeight: '40px',
    barHeight: '24px',
    barRadius: '3px',
    columnWidth: '200px',
  },
} as const;

export type SpacingScale = keyof typeof spacing;