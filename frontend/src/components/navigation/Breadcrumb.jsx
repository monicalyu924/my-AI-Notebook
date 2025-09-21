import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ChevronRight, Home, ArrowLeft } from 'lucide-react';
import { useAdvancedResponsive } from '../../hooks/useAdvancedResponsive';

const Breadcrumb = ({ 
  customItems = [], 
  showHomeIcon = true, 
  showBackButton = false,
  onBack,
  className = '' 
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isMobile, getResponsiveValue } = useAdvancedResponsive();
  
  // 生成默认面包屑项
  const generateBreadcrumbItems = () => {
    const pathnames = location.pathname.split('/').filter(x => x);
    const searchParams = new URLSearchParams(location.search);
    
    let items = [];
    
    // 根路径
    if (showHomeIcon) {
      items.push({
        label: isMobile ? '' : '首页',
        icon: Home,
        href: '/',
        isHome: true
      });
    }
    
    // 解析路径
    pathnames.forEach((pathname, index) => {
      const href = `/${pathnames.slice(0, index + 1).join('/')}`;
      let label = pathname;
      
      // 路径标签映射
      const pathLabels = {
        'app': '应用',
        'settings': '设置',
        'profile': '个人资料',
        'notes': '笔记',
        'todos': '待办事项',
        'projects': '项目管理',
        'workspace': '工作空间',
        'chat': 'AI对话',
        'pomodoro': '番茄钟'
      };
      
      if (pathLabels[pathname]) {
        label = pathLabels[pathname];
      }
      
      // 添加查询参数信息
      if (index === pathnames.length - 1 && searchParams.toString()) {
        if (searchParams.get('view')) {
          const viewLabels = {
            'notes': '笔记',
            'todos': '待办',
            'projects': '项目',
            'workspace': '工作空间',
            'chat': 'AI对话',
            'pomodoro': '番茄钟'
          };
          const view = searchParams.get('view');
          if (viewLabels[view]) {
            label = viewLabels[view];
          }
        }
      }
      
      items.push({
        label,
        href,
        isActive: index === pathnames.length - 1
      });
    });
    
    return items;
  };
  
  // 合并自定义项和自动生成的项
  const breadcrumbItems = customItems.length > 0 ? customItems : generateBreadcrumbItems();
  
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };
  
  // 移动端简化显示
  if (isMobile) {
    const currentItem = breadcrumbItems[breadcrumbItems.length - 1];
    const previousItem = breadcrumbItems[breadcrumbItems.length - 2];
    
    return (
      <nav 
        className={`flex items-center space-x-2 py-2 px-4 bg-white border-b border-gray-200 ${className}`}
        aria-label="面包屑导航"
      >
        {showBackButton && (
          <button
            onClick={handleBack}
            className="p-2 -ml-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="返回上一页"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        )}
        
        {previousItem && (
          <>
            <Link
              to={previousItem.href || '#'}
              className="text-gray-500 hover:text-gray-700 text-sm flex items-center"
            >
              {previousItem.icon && <previousItem.icon className="w-4 h-4 mr-1" />}
              {previousItem.label}
            </Link>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </>
        )}
        
        <span className="text-gray-900 font-medium text-sm flex items-center">
          {currentItem?.icon && <currentItem.icon className="w-4 h-4 mr-1" />}
          {currentItem?.label}
        </span>
      </nav>
    );
  }
  
  // 桌面端完整显示
  return (
    <nav 
      className={`flex items-center space-x-1 py-3 px-6 bg-white border-b border-gray-200 ${className}`}
      aria-label="面包屑导航"
    >
      {showBackButton && (
        <button
          onClick={handleBack}
          className="p-2 mr-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="返回上一页"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
      )}
      
      <ol className="flex items-center space-x-1">
        {breadcrumbItems.map((item, index) => (
          <li key={index} className="flex items-center">
            {index > 0 && (
              <ChevronRight className="w-4 h-4 text-gray-400 mx-2" aria-hidden="true" />
            )}
            
            {item.href && !item.isActive ? (
              <Link
                to={item.href}
                className="text-gray-600 hover:text-gray-900 transition-colors flex items-center space-x-1 px-2 py-1 rounded-md hover:bg-gray-100"
              >
                {item.icon && (
                  <item.icon className={`w-4 h-4 ${item.isHome ? 'text-blue-600' : ''}`} />
                )}
                {item.label && (
                  <span className="text-sm font-medium">{item.label}</span>
                )}
              </Link>
            ) : (
              <span 
                className="text-gray-900 flex items-center space-x-1 px-2 py-1"
                aria-current="page"
              >
                {item.icon && (
                  <item.icon className={`w-4 h-4 ${item.isHome ? 'text-blue-600' : ''}`} />
                )}
                {item.label && (
                  <span className="text-sm font-semibold">{item.label}</span>
                )}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

// 面包屑上下文提供者，用于管理全局面包屑状态
export const BreadcrumbProvider = ({ children }) => {
  const [customItems, setCustomItems] = React.useState([]);
  
  const updateBreadcrumb = (items) => {
    setCustomItems(items);
  };
  
  const clearBreadcrumb = () => {
    setCustomItems([]);
  };
  
  return (
    <BreadcrumbContext.Provider value={{ 
      customItems, 
      updateBreadcrumb, 
      clearBreadcrumb 
    }}>
      {children}
    </BreadcrumbContext.Provider>
  );
};

export const BreadcrumbContext = React.createContext({
  customItems: [],
  updateBreadcrumb: () => {},
  clearBreadcrumb: () => {}
});

export const useBreadcrumb = () => {
  const context = React.useContext(BreadcrumbContext);
  if (!context) {
    throw new Error('useBreadcrumb must be used within a BreadcrumbProvider');
  }
  return context;
};

export default Breadcrumb;