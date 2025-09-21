import React from 'react';
import { AlertCircle, X } from 'lucide-react';

const ErrorMessage = ({ message, onClose, type = 'error' }) => {
  const baseClasses = "flex items-center p-4 mb-4 text-sm rounded-lg";
  const typeClasses = {
    error: "text-red-800 bg-red-50 border border-red-200",
    warning: "text-yellow-800 bg-yellow-50 border border-yellow-200",
    info: "text-blue-800 bg-blue-50 border border-blue-200",
    success: "text-green-800 bg-green-50 border border-green-200"
  };

  return (
    <div 
      className={`${baseClasses} ${typeClasses[type]}`}
      role="alert"
      aria-live="polite"
    >
      <AlertCircle className="flex-shrink-0 inline w-4 h-4 mr-3" aria-hidden="true" />
      <span className="flex-1">{message}</span>
      {onClose && (
        <button
          type="button"
          className="ml-auto -mx-1.5 -my-1.5 rounded-lg focus:ring-2 focus:ring-red-500 p-1.5 hover:bg-red-200 inline-flex h-8 w-8 items-center justify-center"
          onClick={onClose}
          aria-label="关闭提示"
        >
          <X className="w-3 h-3" aria-hidden="true" />
        </button>
      )}
    </div>
  );
};

export default ErrorMessage;
