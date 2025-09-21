import React, { useState, useEffect } from 'react';
import { useMobileOptimization } from '../../hooks/useMobileOptimization';
import { Menu, X, ChevronLeft, MoreVertical } from 'lucide-react';

const MobileOptimizedLayout = ({ 
  sidebar, 
  content, 
  header, 
  footer,
  sidebarWidth = '280px',
  collapsible = true 
}) => {
  const { isMobile, isTablet, getResponsiveClass, optimizeTouchEvents } = useMobileOptimization();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // 移动端自动关闭侧边栏
  useEffect(() => {
    if (isMobile && sidebarOpen) {
      const timer = setTimeout(() => setSidebarOpen(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isMobile, sidebarOpen]);

  // 处理侧边栏切换
  const toggleSidebar = () => {
    setIsTransitioning(true);
    setSidebarOpen(!sidebarOpen);
    setTimeout(() => setIsTransitioning(false), 300);
  };

  // 处理遮罩点击
  const handleOverlayClick = () => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  // 响应式容器类名
  const containerClass = getResponsiveClass(
    'min-h-screen bg-gray-50 flex flex-col',
    'mobile-layout',
    'tablet-layout'
  );

  // 侧边栏类名
  const sidebarClass = `
    ${isMobile ? 'fixed inset-y-0 left-0 z-50' : 'relative'}
    ${isMobile && !sidebarOpen ? '-translate-x-full' : 'translate-x-0'}
    ${isTransitioning ? 'transition-transform duration-300 ease-in-out' : ''}
    bg-white shadow-lg
    ${isMobile ? 'w-80' : `w-[${sidebarWidth}]`}
  `;

  // 主内容区类名
  const mainClass = `
    flex-1 flex flex-col
    ${!isMobile && sidebarOpen ? `ml-[${sidebarWidth}]` : ''}
    ${isTransitioning ? 'transition-all duration-300 ease-in-out' : ''}
  `;

  return (
    <div className={containerClass}>
      {/* 移动端头部 */}
      {isMobile && (
        <div className=\"sticky top-0 z-40 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between\">
          <button
            onClick={toggleSidebar}
            className=\"p-2 rounded-md hover:bg-gray-100 transition-colors\"
            aria-label=\"Toggle menu\"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          {header}
          <button className=\"p-2 rounded-md hover:bg-gray-100 transition-colors\">
            <MoreVertical size={20} />
          </button>
        </div>
      )}

      <div className=\"flex-1 flex relative\">
        {/* 侧边栏 */}
        <aside className={sidebarClass}>
          <div className=\"h-full flex flex-col\">
            {/* 移动端侧边栏头部 */}
            {isMobile && (
              <div className=\"p-4 border-b border-gray-200 flex items-center justify-between\">
                <h2 className=\"font-semibold text-gray-900\">菜单</h2>
                <button
                  onClick={toggleSidebar}
                  className=\"p-1 rounded-md hover:bg-gray-100\"
                >
                  <X size={18} />
                </button>
              </div>
            )}
            
            {/* 侧边栏内容 */}
            <div className=\"flex-1 overflow-y-auto\">
              {sidebar}
            </div>
          </div>
        </aside>

        {/* 移动端遮罩 */}
        {isMobile && sidebarOpen && (
          <div
            className=\"fixed inset-0 bg-black bg-opacity-50 z-40\"
            onClick={handleOverlayClick}
            aria-hidden=\"true\"
          />
        )}

        {/* 主内容区 */}
        <main className={mainClass}>
          {/* 桌面端头部 */}
          {!isMobile && header && (
            <div className=\"sticky top-0 z-30 bg-white border-b border-gray-200 px-6 py-4\">
              {header}
            </div>
          )}

          {/* 内容区域 */}
          <div className=\"flex-1 overflow-auto\">
            <div className={isMobile ? 'p-4' : 'p-6'}>
              {content}
            </div>
          </div>

          {/* 底部 */}
          {footer && (
            <div className=\"border-t border-gray-200 p-4\">
              {footer}
            </div>
          )}
        </main>
      </div>

      {/* 移动端浮动操作按钮 */}
      {isMobile && (
        <div className=\"fixed bottom-6 right-6 z-30\">
          <button
            className=\"w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors flex items-center justify-center\"
            aria-label=\"Quick action\"
          >
            <svg className=\"w-6 h-6\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\">
              <path strokeLinecap=\"round\" strokeLinejoin=\"round\" strokeWidth={2} d=\"M12 4v16m8-8H4\" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};

// 移动端优化的卡片组件
export const MobileCard = ({ children, className = '', onClick, ...props }) => {
  const { isMobile, optimizeTouchEvents } = useMobileOptimization();
  
  const cardRef = React.useRef(null);
  
  useEffect(() => {
    if (cardRef.current) {
      optimizeTouchEvents(cardRef.current);
    }
  }, [optimizeTouchEvents]);

  const cardClass = `
    ${isMobile ? 'p-4 mb-3' : 'p-6 mb-4'}
    bg-white rounded-lg shadow-sm border border-gray-200
    ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}
    ${isMobile ? 'active:bg-gray-50' : 'hover:bg-gray-50'}
    ${className}
  `;

  return (
    <div
      ref={cardRef}
      className={cardClass}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  );
};

// 移动端优化的列表组件
export const MobileList = ({ items, renderItem, className = '', ...props }) => {
  const { isMobile } = useMobileOptimization();

  const listClass = `
    ${isMobile ? 'space-y-2' : 'space-y-3'}
    ${className}
  `;

  return (
    <div className={listClass} {...props}>
      {items.map((item, index) => (
        <div key={item.id || index}>
          {renderItem(item, index)}
        </div>
      ))}
    </div>
  );
};

// 移动端优化的输入框组件
export const MobileInput = ({ label, className = '', ...props }) => {
  const { isMobile } = useMobileOptimization();

  const inputClass = `
    w-full px-3 py-2 border border-gray-300 rounded-md
    focus:ring-2 focus:ring-blue-500 focus:border-blue-500
    ${isMobile ? 'text-base' : 'text-sm'}
    ${isMobile ? 'min-h-[44px]' : 'min-h-[36px]'}
    ${className}
  `;

  return (
    <div className=\"space-y-2\">
      {label && (
        <label className={`block font-medium text-gray-700 ${isMobile ? 'text-base' : 'text-sm'}`}>
          {label}
        </label>
      )}
      <input className={inputClass} {...props} />
    </div>
  );
};

export default MobileOptimizedLayout;