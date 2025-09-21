import React, { useState, useEffect, createContext, useContext } from 'react';
import { AlertCircle, CheckCircle, Info, X, AlertTriangle } from 'lucide-react';

// 错误处理上下文
const ErrorContext = createContext();

// 错误类型枚举
export const ERROR_TYPES = {
  NETWORK: 'network',
  VALIDATION: 'validation',
  AUTH: 'auth',
  PERMISSION: 'permission',
  SERVER: 'server',
  CLIENT: 'client'
};

// 通知类型枚举
export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info'
};

// 错误处理Provider
export const ErrorProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [errors, setErrors] = useState([]);

  // 添加通知
  const addNotification = (message, type = NOTIFICATION_TYPES.INFO, duration = 5000) => {
    const id = Date.now() + Math.random();
    const notification = {
      id,
      message,
      type,
      timestamp: new Date(),
      duration
    };

    setNotifications(prev => [...prev, notification]);

    // 自动移除通知
    if (duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, duration);
    }

    return id;
  };

  // 移除通知
  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // 添加错误
  const addError = (error, context = {}) => {
    const errorObj = {
      id: Date.now() + Math.random(),
      message: error.message || '未知错误',
      type: error.type || ERROR_TYPES.CLIENT,
      code: error.code || error.response?.status,
      context,
      timestamp: new Date(),
      stack: error.stack
    };

    setErrors(prev => [...prev, errorObj]);

    // 根据错误类型显示不同的通知
    const notificationType = getNotificationTypeFromError(error);
    const userMessage = getUserFriendlyMessage(error);
    
    addNotification(userMessage, notificationType);

    // 发送错误日志到服务器（可选）
    if (process.env.NODE_ENV === 'production') {
      logErrorToServer(errorObj);
    }

    return errorObj.id;
  };

  // 清除错误
  const clearErrors = () => {
    setErrors([]);
  };

  // 获取用户友好的错误消息
  const getUserFriendlyMessage = (error) => {
    const status = error.response?.status;
    const message = error.message;

    // 网络错误
    if (!error.response && error.request) {
      return '网络连接失败，请检查您的网络连接';
    }

    // HTTP状态码错误
    switch (status) {
      case 400:
        return '请求参数错误，请检查输入内容';
      case 401:
        return '登录已过期，请重新登录';
      case 403:
        return '您没有权限执行此操作';
      case 404:
        return '请求的资源不存在';
      case 409:
        return '数据冲突，请刷新页面后重试';
      case 429:
        return '请求过于频繁，请稍后再试';
      case 500:
        return '服务器内部错误，我们正在处理中';
      case 502:
      case 503:
      case 504:
        return '服务暂时不可用，请稍后重试';
      default:
        // 尝试从错误消息中提取有用信息
        if (message.includes('timeout')) {
          return '请求超时，请检查网络连接';
        }
        if (message.includes('abort')) {
          return '请求已取消';
        }
        return message || '操作失败，请重试';
    }
  };

  // 根据错误类型获取通知类型
  const getNotificationTypeFromError = (error) => {
    const status = error.response?.status;
    
    if (status >= 500) return NOTIFICATION_TYPES.ERROR;
    if (status >= 400) return NOTIFICATION_TYPES.WARNING;
    return NOTIFICATION_TYPES.ERROR;
  };

  // 发送错误日志到服务器
  const logErrorToServer = async (errorObj) => {
    try {
      await fetch('/api/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: errorObj.message,
          type: errorObj.type,
          code: errorObj.code,
          url: window.location.href,
          userAgent: navigator.userAgent,
          timestamp: errorObj.timestamp
        })
      });
    } catch (err) {
      // 忽略日志发送失败
    }
  };

  const value = {
    notifications,
    errors,
    addNotification,
    removeNotification,
    addError,
    clearErrors,
    // 便捷方法
    success: (message, duration) => addNotification(message, NOTIFICATION_TYPES.SUCCESS, duration),
    error: (message, duration) => addNotification(message, NOTIFICATION_TYPES.ERROR, duration),
    warning: (message, duration) => addNotification(message, NOTIFICATION_TYPES.WARNING, duration),
    info: (message, duration) => addNotification(message, NOTIFICATION_TYPES.INFO, duration)
  };

  return (
    <ErrorContext.Provider value={value}>
      {children}
      <NotificationContainer />
    </ErrorContext.Provider>
  );
};

// 通知容器组件
const NotificationContainer = () => {
  const { notifications, removeNotification } = useContext(ErrorContext);

  if (notifications.length === 0) return null;

  return (
    <div className=\"fixed top-4 right-4 z-50 space-y-2 max-w-sm\">
      {notifications.map(notification => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onClose={() => removeNotification(notification.id)}
        />
      ))}
    </div>
  );
};

// 通知项组件
const NotificationItem = ({ notification, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // 入场动画
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(onClose, 300);
  };

  const getIcon = () => {
    switch (notification.type) {
      case NOTIFICATION_TYPES.SUCCESS:
        return <CheckCircle className=\"w-5 h-5 text-green-500\" />;
      case NOTIFICATION_TYPES.ERROR:
        return <AlertCircle className=\"w-5 h-5 text-red-500\" />;
      case NOTIFICATION_TYPES.WARNING:
        return <AlertTriangle className=\"w-5 h-5 text-yellow-500\" />;
      default:
        return <Info className=\"w-5 h-5 text-blue-500\" />;
    }
  };

  const getBackgroundColor = () => {
    switch (notification.type) {
      case NOTIFICATION_TYPES.SUCCESS:
        return 'bg-green-50 border-green-200';
      case NOTIFICATION_TYPES.ERROR:
        return 'bg-red-50 border-red-200';
      case NOTIFICATION_TYPES.WARNING:
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  return (
    <div
      className={`
        transform transition-all duration-300 ease-in-out
        ${isVisible && !isLeaving ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
        ${getBackgroundColor()}
        border rounded-lg shadow-lg p-4 flex items-start space-x-3
        max-w-sm
      `}
    >
      {getIcon()}
      <div className=\"flex-1\">
        <p className=\"text-sm text-gray-800\">{notification.message}</p>
      </div>
      <button
        onClick={handleClose}
        className=\"text-gray-400 hover:text-gray-600 transition-colors\"
      >
        <X className=\"w-4 h-4\" />
      </button>
    </div>
  );
};

// Hook for using error context
export const useError = () => {
  const context = useContext(ErrorContext);
  if (!context) {
    throw new Error('useError must be used within an ErrorProvider');
  }
  return context;
};

// 全局错误边界组件
export class GlobalErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error,
      errorInfo
    });

    // 发送错误到监控服务
    if (process.env.NODE_ENV === 'production') {
      // 这里可以集成错误监控服务如 Sentry
      console.error('Global error caught:', error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className=\"min-h-screen flex items-center justify-center bg-gray-50\">
          <div className=\"max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center\">
            <AlertCircle className=\"w-16 h-16 text-red-500 mx-auto mb-4\" />
            <h1 className=\"text-xl font-semibold text-gray-900 mb-2\">
              应用出现了问题
            </h1>
            <p className=\"text-gray-600 mb-4\">
              我们遇到了一个意外错误。请刷新页面重试，如果问题持续存在，请联系技术支持。
            </p>
            <div className=\"space-y-2\">
              <button
                onClick={() => window.location.reload()}
                className=\"w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors\"
              >
                刷新页面
              </button>
              <details className=\"text-left\">
                <summary className=\"cursor-pointer text-sm text-gray-500\">
                  技术详情
                </summary>
                <pre className=\"mt-2 text-xs text-gray-600 bg-gray-100 p-2 rounded overflow-auto\">
                  {this.state.error && this.state.error.toString()}
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorProvider;