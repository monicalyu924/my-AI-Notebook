import React, { useState, useEffect, createContext, useContext } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Toast 通知系统 - 提供优雅的用户反馈
 * 支持多种类型：success, error, warning, info
 */

// Toast Context
const ToastContext = createContext();

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

// Toast 图标映射
const icons = {
  success: <CheckCircle className="w-5 h-5" />,
  error: <AlertCircle className="w-5 h-5" />,
  warning: <AlertTriangle className="w-5 h-5" />,
  info: <Info className="w-5 h-5" />
};

// Toast 样式映射
const styles = {
  success: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-800',
    icon: 'text-green-600'
  },
  error: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-800',
    icon: 'text-red-600'
  },
  warning: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-800',
    icon: 'text-amber-600'
  },
  info: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-800',
    icon: 'text-blue-600'
  }
};

// 单个 Toast 组件
const ToastItem = ({ toast, onClose }) => {
  const [progress, setProgress] = useState(100);
  const style = styles[toast.type] || styles.info;

  useEffect(() => {
    if (toast.duration && toast.duration > 0) {
      const interval = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev - (100 / (toast.duration / 100));
          if (newProgress <= 0) {
            clearInterval(interval);
            onClose(toast.id);
            return 0;
          }
          return newProgress;
        });
      }, 100);

      return () => clearInterval(interval);
    }
  }, [toast.id, toast.duration, onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={`
        relative overflow-hidden
        ${style.bg} ${style.border} border
        rounded-lg shadow-lg p-4 mb-3
        min-w-80 max-w-md
      `}
    >
      <div className="flex items-start gap-3">
        {/* 图标 */}
        <div className={style.icon}>
          {icons[toast.type]}
        </div>

        {/* 内容 */}
        <div className="flex-1">
          {toast.title && (
            <h4 className={`font-semibold ${style.text} mb-1`}>
              {toast.title}
            </h4>
          )}
          {toast.message && (
            <p className={`text-sm ${style.text}`}>
              {toast.message}
            </p>
          )}
        </div>

        {/* 关闭按钮 */}
        <button
          onClick={() => onClose(toast.id)}
          className={`${style.text} hover:opacity-70 transition-opacity`}
          aria-label="关闭通知"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* 进度条 */}
      {toast.duration && toast.duration > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200">
          <motion.div
            className={style.border.replace('border-', 'bg-')}
            style={{ width: `${progress}%` }}
            transition={{ duration: 0.1 }}
          />
        </div>
      )}
    </motion.div>
  );
};

// Toast Container
export const ToastContainer = ({ toasts, onClose }) => {
  return (
    <div className="fixed top-4 right-4 z-50">
      <AnimatePresence mode="popLayout">
        {toasts.map(toast => (
          <ToastItem
            key={toast.id}
            toast={toast}
            onClose={onClose}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

// Toast Provider
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = ({
    type = 'info',
    title,
    message,
    duration = 3000
  }) => {
    const id = Date.now() + Math.random();
    const newToast = {
      id,
      type,
      title,
      message,
      duration
    };

    setToasts(prev => [...prev, newToast]);

    // 自动移除（备用，主要由进度条控制）
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }

    return id;
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  // 便捷方法
  const toast = {
    success: (message, title = '成功') =>
      showToast({ type: 'success', title, message }),

    error: (message, title = '错误') =>
      showToast({ type: 'error', title, message, duration: 5000 }),

    warning: (message, title = '警告') =>
      showToast({ type: 'warning', title, message }),

    info: (message, title = '提示') =>
      showToast({ type: 'info', title, message }),

    custom: (options) => showToast(options)
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </ToastContext.Provider>
  );
};

export default ToastProvider;
