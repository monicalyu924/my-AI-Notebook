/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Trello 主题紫色系统
        'trello': {
          50: '#F4F3FF',
          100: '#EDE9FE', 
          200: '#DDD6FE',
          300: '#C4B5FD',
          400: '#A78BFA',
          500: '#8B5CF6', // 主要紫色
          600: '#7C3AED', // 深紫色
          700: '#6D28D9',
          800: '#5B21B6',
          900: '#4C1D95',
          950: '#2E1065',
        },
        
        // Trello 渐变背景色
        'trello-bg': {
          'start': '#8B5CF6', // 深紫色起点
          'middle': '#A78BFA', // 中间紫色
          'end': '#C4B5FD', // 浅紫色终点
        },
        
        // 保留原有系统，以防其他地方引用
        'notion-bg': '#f7f6f3',
        'notion-dark': '#37352f',
        'notion-gray': '#787774',
        'notion-light-gray': '#e9e9e7',
        
        // 更新蓝色系统
        blue: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
          800: '#1E40AF',
          900: '#1E3A8A',
          950: '#172554',
        },
        
        // 更新绿色系统
        green: {
          50: '#F0FDF4',
          100: '#DCFCE7',
          200: '#BBF7D0',
          300: '#86EFAC',
          400: '#4ADE80',
          500: '#22C55E',
          600: '#16A34A',
          700: '#15803D',
          800: '#166534',
          900: '#14532D',
          950: '#052E16',
        },
        
        // 更新灰色系统
        gray: {
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
          950: '#030712',
        },
      },
      
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif'],
      },
      
      // Trello 风格背景渐变
      backgroundImage: {
        'trello-gradient': 'linear-gradient(135deg, #8B5CF6 0%, #A78BFA 50%, #C4B5FD 100%)',
        'trello-subtle': 'linear-gradient(135deg, #F4F3FF 0%, #EDE9FE 100%)',
      },
      
      // 更新间距系统
      spacing: {
        '25': '2px',
        '50': '4px',
        '100': '8px',
        '150': '12px',
        '200': '16px',
        '250': '20px',
        '300': '24px',
        '400': '32px',
        '500': '40px',
        '600': '48px',
        '800': '64px',
        '1000': '80px',
        '1200': '96px',
      },
      
      // Trello 风格阴影
      boxShadow: {
        'trello-card': '0 1px 3px rgba(139, 92, 246, 0.12), 0 1px 2px rgba(139, 92, 246, 0.08)',
        'trello-card-hover': '0 4px 12px rgba(139, 92, 246, 0.15), 0 2px 4px rgba(139, 92, 246, 0.1)',
        'trello-sidebar': '2px 0 8px rgba(139, 92, 246, 0.1)',
        'trello-modal': '0 10px 25px rgba(139, 92, 246, 0.2), 0 4px 6px rgba(139, 92, 246, 0.05)',
        'atlassian-sm': '0 1px 1px rgba(9, 30, 66, 0.25)',
        'atlassian-md': '0 1px 1px rgba(9, 30, 66, 0.25), 0 0 1px rgba(9, 30, 66, 0.31)',
        'atlassian-lg': '0 4px 8px -2px rgba(9, 30, 66, 0.25), 0 0 1px rgba(9, 30, 66, 0.31)',
      },
      
      // 添加动画时长
      transitionDuration: {
        '350': '350ms',
      },
      
      // 添加圆角变量
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
        '3xl': '20px',
      },
    },
  },
  plugins: [],
}
