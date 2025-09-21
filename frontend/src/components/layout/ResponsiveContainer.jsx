import React from 'react';
import { useAdvancedResponsive } from '../../hooks/useAdvancedResponsive';

const ResponsiveContainer = ({ 
  children, 
  className = '', 
  mobileLayout = 'stack',
  tabletLayout = 'sidebar', 
  desktopLayout = 'three-column',
  enableSidebarToggle = true
}) => {
  const { 
    isMobile, 
    isTablet, 
    isDesktop, 
    getResponsiveClasses, 
    getLayoutConfig 
  } = useAdvancedResponsive();
  
  const layoutConfig = getLayoutConfig();
  
  // 根据设备类型选择布局
  const getLayoutClasses = () => {
    const baseClasses = 'min-h-screen w-full transition-all duration-300';
    
    if (isMobile) {
      return `${baseClasses} flex flex-col`;
    }
    
    if (isTablet) {
      if (tabletLayout === 'sidebar') {
        return `${baseClasses} flex`;
      }
      return `${baseClasses} grid grid-cols-2 gap-4`;
    }
    
    // Desktop
    if (desktopLayout === 'three-column') {
      return `${baseClasses} grid grid-cols-[320px_1fr_300px] gap-6`;
    }
    
    return `${baseClasses} flex`;
  };

  const containerClasses = `${getLayoutClasses()} ${className}`;
  
  return (
    <div className={containerClasses} style={{ 
      padding: layoutConfig.content.padding 
    }}>
      {children}
    </div>
  );
};

// 响应式侧边栏组件
export const ResponsiveSidebar = ({ 
  children, 
  isOpen = true, 
  onToggle,
  className = '' 
}) => {
  const { isMobile, getLayoutConfig } = useAdvancedResponsive();
  const layoutConfig = getLayoutConfig();
  
  if (isMobile) {
    return (
      <>
        {/* 移动端遮罩 */}
        {isOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={onToggle}
          />
        )}
        
        {/* 移动端侧边栏 */}
        <div className={`
          fixed top-0 left-0 h-full bg-white z-50 transform transition-transform duration-300
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          ${className}
        `} style={{ width: layoutConfig.sidebar.width }}>
          {children}
        </div>
      </>
    );
  }
  
  // 桌面端侧边栏
  return (
    <div 
      className={`h-full bg-white transition-all duration-300 ${className}`}
      style={{ 
        width: isOpen ? layoutConfig.sidebar.width : '60px',
        minWidth: isOpen ? layoutConfig.sidebar.width : '60px'
      }}
    >
      {children}
    </div>
  );
};

// 响应式内容区域
export const ResponsiveContent = ({ 
  children, 
  className = '',
  maxWidth = true 
}) => {
  const { getLayoutConfig } = useAdvancedResponsive();
  const layoutConfig = getLayoutConfig();
  
  return (
    <div className={`
      flex-1 overflow-auto
      ${maxWidth ? 'max-w-full' : ''}
      ${className}
    `} style={{
      maxWidth: maxWidth ? layoutConfig.content.maxWidth : 'none'
    }}>
      {children}
    </div>
  );
};

// 响应式模态框
export const ResponsiveModal = ({ 
  children, 
  isOpen, 
  onClose, 
  title,
  className = '' 
}) => {
  const { getLayoutConfig } = useAdvancedResponsive();
  const layoutConfig = getLayoutConfig();
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* 遮罩 */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />
      
      {/* 模态框内容 */}
      <div 
        className={`
          relative bg-white shadow-xl z-10 overflow-hidden
          ${className}
        `}
        style={{
          maxWidth: layoutConfig.modal.maxWidth,
          margin: layoutConfig.modal.margin,
          borderRadius: layoutConfig.modal.borderRadius,
          maxHeight: 'calc(100vh - 64px)'
        }}
      >
        {title && (
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          </div>
        )}
        
        <div className="overflow-auto max-h-full">
          {children}
        </div>
      </div>
    </div>
  );
};

export default ResponsiveContainer;