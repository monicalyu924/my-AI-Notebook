import React, { createContext, useContext, useState, useEffect } from 'react';

// 可访问性上下文
const AccessibilityContext = createContext({
  announcements: [],
  announce: () => {},
  reducedMotion: false,
  highContrast: false,
  fontSize: 'medium',
  setFontSize: () => {},
  toggleHighContrast: () => {},
});

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within AccessibilityProvider');
  }
  return context;
};

// 可访问性提供者组件
export const AccessibilityProvider = ({ children }) => {
  const [announcements, setAnnouncements] = useState([]);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [fontSize, setFontSize] = useState('medium');

  // 检测用户的运动偏好
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);
    
    const handleChange = (e) => setReducedMotion(e.matches);
    mediaQuery.addListener(handleChange);
    
    return () => mediaQuery.removeListener(handleChange);
  }, []);

  // 检测高对比度偏好
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-contrast: high)');
    setHighContrast(mediaQuery.matches);
    
    const handleChange = (e) => setHighContrast(e.matches);
    mediaQuery.addListener(handleChange);
    
    return () => mediaQuery.removeListener(handleChange);
  }, []);

  // 应用字体大小到根元素
  useEffect(() => {
    const fontSizeMap = {
      small: '14px',
      medium: '16px',
      large: '18px',
      extraLarge: '20px'
    };
    
    document.documentElement.style.setProperty('--base-font-size', fontSizeMap[fontSize]);
  }, [fontSize]);

  // 应用高对比度模式
  useEffect(() => {
    if (highContrast) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }
  }, [highContrast]);

  // 屏幕阅读器通知函数
  const announce = (message, priority = 'polite') => {
    const id = Date.now();
    const announcement = { id, message, priority };
    
    setAnnouncements(prev => [...prev, announcement]);
    
    // 5秒后自动清除通知
    setTimeout(() => {
      setAnnouncements(prev => prev.filter(a => a.id !== id));
    }, 5000);
  };

  const toggleHighContrast = () => {
    setHighContrast(prev => !prev);
  };

  const value = {
    announcements,
    announce,
    reducedMotion,
    highContrast,
    fontSize,
    setFontSize,
    toggleHighContrast,
  };

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
      
      {/* 屏幕阅读器通知区域 */}
      <div className="sr-only">
        {announcements.map(announcement => (
          <div
            key={announcement.id}
            aria-live={announcement.priority}
            aria-atomic="true"
          >
            {announcement.message}
          </div>
        ))}
      </div>
    </AccessibilityContext.Provider>
  );
};

// 跳过链接组件 - 键盘用户快速导航
export const SkipLink = () => (
  <a
    href="#main-content"
    className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded-lg z-50 font-medium"
  >
    跳到主内容
  </a>
);

// 焦点管理Hook
export const useFocusManagement = () => {
  const [focusedElement, setFocusedElement] = useState(null);
  
  const trapFocus = (container) => {
    if (!container) return;
    
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    
    const handleTabKey = (e) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
      
      if (e.key === 'Escape') {
        e.preventDefault();
        container.querySelector('[data-close-button]')?.click();
      }
    };
    
    container.addEventListener('keydown', handleTabKey);
    firstElement?.focus();
    
    return () => {
      container.removeEventListener('keydown', handleTabKey);
    };
  };
  
  const restoreFocus = (element) => {
    if (element && element.focus) {
      element.focus();
    }
  };
  
  return {
    focusedElement,
    setFocusedElement,
    trapFocus,
    restoreFocus
  };
};

// 键盘导航Hook
export const useKeyboardNavigation = (items, onSelect) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  useEffect(() => {
    const handleKeyDown = (e) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev < items.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev > 0 ? prev - 1 : items.length - 1
          );
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          onSelect(items[selectedIndex]);
          break;
        case 'Home':
          e.preventDefault();
          setSelectedIndex(0);
          break;
        case 'End':
          e.preventDefault();
          setSelectedIndex(items.length - 1);
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [items, selectedIndex, onSelect]);
  
  return { selectedIndex, setSelectedIndex };
};