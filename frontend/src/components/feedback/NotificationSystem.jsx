import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle, 
  AlertCircle, 
  XCircle, 
  Info, 
  X, 
  RotateCcw,
  ExternalLink 
} from 'lucide-react';
import { useAdvancedResponsive } from '../../hooks/useAdvancedResponsive';

// 通知上下文
const NotificationContext = createContext({});

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
};

// 通知类型配置
const notificationConfig = {
  success: {
    icon: CheckCircle,
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    iconColor: 'text-green-600',
    textColor: 'text-green-800',
    defaultDuration: 4000
  },
  error: {
    icon: XCircle,
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    iconColor: 'text-red-600',
    textColor: 'text-red-800',
    defaultDuration: 0 // 不自动消失
  },
  warning: {
    icon: AlertCircle,
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    iconColor: 'text-yellow-600',
    textColor: 'text-yellow-800',
    defaultDuration: 6000
  },
  info: {
    icon: Info,
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    iconColor: 'text-blue-600',
    textColor: 'text-blue-800',
    defaultDuration: 5000
  }
};

// 单个通知组件
const NotificationItem = ({ notification, onClose, onAction }) => {
  const { isMobile } = useAdvancedResponsive();
  const config = notificationConfig[notification.type] || notificationConfig.info;
  const Icon = config.icon;
  
  useEffect(() => {
    if (notification.duration > 0) {
      const timer = setTimeout(() => {
        onClose(notification.id);
      }, notification.duration);
      
      return () => clearTimeout(timer);
    }
  }, [notification.id, notification.duration, onClose]);
  
  return (
    <motion.div
      initial={{ 
        opacity: 0, 
        x: isMobile ? 0 : 300, 
        y: isMobile ? -50 : 0,
        scale: 0.9 
      }}
      animate={{ 
        opacity: 1, 
        x: 0, 
        y: 0,
        scale: 1 
      }}
      exit={{ 
        opacity: 0, 
        x: isMobile ? 0 : 300, 
        y: isMobile ? -50 : 0,
        scale: 0.9 
      }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={`
        ${config.bgColor} ${config.borderColor} ${config.textColor}
        border rounded-lg shadow-lg p-4 mb-3 max-w-sm w-full
        relative overflow-hidden
      `}
    >
      {/* 进度条 */}
      {notification.duration > 0 && (
        <motion.div
          className="absolute bottom-0 left-0 h-1 bg-current opacity-30"
          initial={{ width: '100%' }}
          animate={{ width: '0%' }}
          transition={{ 
            duration: notification.duration / 1000, 
            ease: 'linear' 
          }}
        />
      )}
      
      <div className="flex items-start space-x-3">
        {/* 图标 */}
        <Icon className={`w-5 h-5 ${config.iconColor} flex-shrink-0 mt-0.5`} />
        
        {/* 内容 */}
        <div className="flex-1 min-w-0">
          {notification.title && (
            <h4 className="font-semibold text-sm mb-1">
              {notification.title}
            </h4>
          )}
          
          <p className="text-sm leading-relaxed">
            {notification.message}
          </p>
          
          {/* 操作按钮 */}
          {notification.actions && (
            <div className="flex items-center space-x-3 mt-3">
              {notification.actions.map((action, index) => (
                <button
                  key={index}
                  onClick={() => onAction(notification.id, action)}
                  className={`
                    text-xs font-medium px-3 py-1.5 rounded-md transition-colors
                    ${action.primary 
                      ? `${config.iconColor} bg-white hover:bg-gray-50 border border-current` 
                      : 'text-gray-600 hover:text-gray-800 hover:bg-white'
                    }
                  `}
                >
                  {action.icon && <action.icon className="w-3 h-3 mr-1 inline" />}
                  {action.label}
                </button>
              ))}
            </div>
          )}
          
          {/* 详情链接 */}
          {notification.details && (
            <button
              onClick={() => onAction(notification.id, { type: 'details', url: notification.details })}
              className="flex items-center space-x-1 text-xs text-current opacity-70 hover:opacity-100 mt-2 transition-opacity"
            >
              <span>查看详情</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          )}
        </div>
        
        {/* 关闭按钮 */}
        <button
          onClick={() => onClose(notification.id)}
          className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="关闭通知"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
};

// 通知容器
const NotificationContainer = ({ notifications, onClose, onAction }) => {
  const { isMobile } = useAdvancedResponsive();
  
  return (
    <div className={`
      fixed z-50 pointer-events-none
      ${isMobile 
        ? 'top-4 left-4 right-4' 
        : 'top-4 right-4'
      }
    `}>
      <AnimatePresence>
        {notifications.map(notification => (
          <div key={notification.id} className="pointer-events-auto">
            <NotificationItem
              notification={notification}
              onClose={onClose}
              onAction={onAction}
            />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
};

// 通知提供者
export const NotificationProvider = ({ children, maxNotifications = 5 }) => {
  const [notifications, setNotifications] = useState([]);
  
  const addNotification = useCallback((notification) => {
    const id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const config = notificationConfig[notification.type] || notificationConfig.info;
    
    const newNotification = {
      id,
      duration: config.defaultDuration,
      timestamp: Date.now(),
      ...notification
    };
    
    setNotifications(prev => {
      const updated = [newNotification, ...prev];
      // 限制通知数量
      return updated.slice(0, maxNotifications);
    });
    
    return id;
  }, [maxNotifications]);
  
  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);
  
  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);
  
  const handleAction = useCallback((notificationId, action) => {
    if (action.type === 'details' && action.url) {
      window.open(action.url, '_blank');
    } else if (action.type === 'retry' && action.handler) {
      action.handler();
    } else if (action.handler) {
      action.handler();
    }
    
    // 执行动作后移除通知
    if (action.closeAfter !== false) {
      removeNotification(notificationId);
    }
  }, [removeNotification]);
  
  // 便捷方法
  const success = useCallback((message, options = {}) => {
    return addNotification({ type: 'success', message, ...options });
  }, [addNotification]);
  
  const error = useCallback((message, options = {}) => {
    return addNotification({ 
      type: 'error', 
      message, 
      actions: [
        {
          label: '重试',
          icon: RotateCcw,
          type: 'retry',
          primary: true,
          ...options.retryAction
        }
      ],
      ...options 
    });
  }, [addNotification]);
  
  const warning = useCallback((message, options = {}) => {
    return addNotification({ type: 'warning', message, ...options });
  }, [addNotification]);
  
  const info = useCallback((message, options = {}) => {
    return addNotification({ type: 'info', message, ...options });
  }, [addNotification]);
  
  const contextValue = {
    notifications,
    addNotification,
    removeNotification,
    clearAllNotifications,
    success,
    error,
    warning,
    info
  };
  
  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
      <NotificationContainer
        notifications={notifications}
        onClose={removeNotification}
        onAction={handleAction}
      />
    </NotificationContext.Provider>
  );
};

// Default export
export default NotificationProvider;