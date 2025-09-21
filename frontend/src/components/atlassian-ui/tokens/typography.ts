// Atlassian Design System 字体系统
export const typography = {
  // 字体家族
  fontFamily: {
    base: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
    mono: '"SF Mono", "Monaco", "Inconsolata", "Roboto Mono", "Source Code Pro", monospace',
  },

  // 字体大小和行高
  fontSize: {
    11: { size: '11px', lineHeight: '16px' }, // 小标签
    12: { size: '12px', lineHeight: '16px' }, // 辅助文本
    14: { size: '14px', lineHeight: '20px' }, // 正文
    16: { size: '16px', lineHeight: '24px' }, // 大正文
    20: { size: '20px', lineHeight: '24px' }, // 小标题
    24: { size: '24px', lineHeight: '28px' }, // 中标题
    29: { size: '29px', lineHeight: '32px' }, // 大标题
    35: { size: '35px', lineHeight: '40px' }, // 特大标题
  },

  // 字重
  fontWeight: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },

  // 预设文本样式
  textStyles: {
    // 标题系列
    h1: {
      fontSize: '35px',
      lineHeight: '40px',
      fontWeight: 500,
      letterSpacing: '-0.01em',
    },
    h2: {
      fontSize: '29px', 
      lineHeight: '32px',
      fontWeight: 500,
      letterSpacing: '-0.01em',
    },
    h3: {
      fontSize: '24px',
      lineHeight: '28px',
      fontWeight: 600,
      letterSpacing: '0em',
    },
    h4: {
      fontSize: '20px',
      lineHeight: '24px',
      fontWeight: 600,
      letterSpacing: '0em',
    },
    h5: {
      fontSize: '16px',
      lineHeight: '20px',
      fontWeight: 600,
      letterSpacing: '0em',
    },
    h6: {
      fontSize: '14px',
      lineHeight: '16px',
      fontWeight: 600,
      letterSpacing: '0em',
      textTransform: 'uppercase' as const,
    },

    // 正文系列
    bodyLarge: {
      fontSize: '16px',
      lineHeight: '24px',
      fontWeight: 400,
    },
    body: {
      fontSize: '14px',
      lineHeight: '20px',
      fontWeight: 400,
    },
    bodySmall: {
      fontSize: '12px',
      lineHeight: '16px',
      fontWeight: 400,
    },

    // UI 元素
    button: {
      fontSize: '14px',
      lineHeight: '20px',
      fontWeight: 500,
    },
    caption: {
      fontSize: '11px',
      lineHeight: '16px',
      fontWeight: 400,
      color: '#6B778C',
    },
    code: {
      fontSize: '12px',
      lineHeight: '16px',
      fontWeight: 400,
      fontFamily: '"SF Mono", "Monaco", monospace',
    },
  },
} as const;

export type FontSize = keyof typeof typography.fontSize;
export type FontWeight = keyof typeof typography.fontWeight;
export type TextStyle = keyof typeof typography.textStyles;