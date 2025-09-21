// Atlassian Design System 颜色令牌
export const colors = {
  // 主色调 - Atlassian Blue
  primary: {
    50: '#E3F2FD',
    100: '#BBDEFB',
    200: '#90CAF9',
    300: '#64B5F6',
    400: '#42A5F5',
    500: '#0052CC', // 主要蓝色
    600: '#0047B3',
    700: '#003A99',
    800: '#002D7F',
    900: '#001F66',
  },

  // 成功色 - 绿色系统
  success: {
    50: '#E8F5E8',
    100: '#C3E6C3',
    200: '#9DD69D',
    300: '#77C677',
    400: '#57B957',
    500: '#36B37E', // 主要绿色
    600: '#31A06B',
    700: '#2A8D58',
    800: '#237A45',
    900: '#1A5A32',
  },

  // 警告色 - 黄色系统
  warning: {
    50: '#FFF8E1',
    100: '#FFECB5',
    200: '#FFE082',
    300: '#FFD54F',
    400: '#FFCA28',
    500: '#FFAB00', // 主要黄色
    600: '#FF8F00',
    700: '#FF6F00',
    800: '#E65100',
    900: '#BF360C',
  },

  // 错误色 - 红色系统
  error: {
    50: '#FFEBEE',
    100: '#FFCDD2',
    200: '#EF9A9A',
    300: '#E57373',
    400: '#EF5350',
    500: '#DE350B', // 主要红色
    600: '#D32F2F',
    700: '#C62828',
    800: '#B71C1C',
    900: '#8D0D0D',
  },

  // 中性色系统
  neutral: {
    0: '#FFFFFF',
    50: '#FAFBFC',
    100: '#F4F5F7',
    200: '#EBECF0',
    300: '#DFE1E6',
    400: '#C1C7D0',
    500: '#97A0AF',
    600: '#6B778C',
    700: '#505F79',
    800: '#42526E',
    900: '#253858',
    1000: '#172B4D',
  },

  // 品牌色
  brand: {
    atlassian: '#0052CC',
    jira: '#0052CC',
    confluence: '#172B4D',
    trello: '#0079BF',
  },
} as const;

export type ColorScale = keyof typeof colors;
export type ColorShade = keyof typeof colors.primary;