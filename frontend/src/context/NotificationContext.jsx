import React, { createContext, useContext, useState } from 'react';
import { CheckCircle, AlertCircle, Info, XCircle } from 'lucide-react';

const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

const NotificationItem = ({ notification, onRemove }) => {
  const icons = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertCircle,
    info: Info,
  };

  const colors = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
  };

  const Icon = icons[notification.type];

  React.useEffect(() => {
    if (notification.autoClose) {
      const timer = setTimeout(() => {
        onRemove(notification.id);
      }, notification.duration || 5000);
      return () => clearTimeout(timer);
    }
  }, [notification, onRemove]);

  return (
    <div className={`p-4 rounded-lg border flex items-start space-x-3 ${colors[notification.type]}`}>
      <Icon className="h-5 w-5 mt-0.5 flex-shrink-0" />
      <div className="flex-1">
        {notification.title && (
          <h4 className="font-medium mb-1">{notification.title}</h4>
        )}
        <p className="text-sm">{notification.message}</p>
      </div>
      <button
        onClick={() => onRemove(notification.id)}
        className="text-gray-400 hover:text-gray-600"
      >
        <XCircle className="h-4 w-4" />
      </button>
    </div>
  );
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const addNotification = ({ type = 'info', title, message, autoClose = true, duration = 5000 }) => {
    const id = Date.now().toString();
    const notification = { id, type, title, message, autoClose, duration };
    
    setNotifications(prev => [...prev, notification]);
    return id;
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const showSuccess = (message, title) => addNotification({ type: 'success', title, message });
  const showError = (message, title) => addNotification({ type: 'error', title, message, autoClose: false });
  const showWarning = (message, title) => addNotification({ type: 'warning', title, message });
  const showInfo = (message, title) => addNotification({ type: 'info', title, message });

  const value = {
    notifications,
    addNotification,
    removeNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      
      {/* Notification Container */}
      <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
        {notifications.map(notification => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onRemove={removeNotification}
          />
        ))}
      </div>
    </NotificationContext.Provider>
  );
};
