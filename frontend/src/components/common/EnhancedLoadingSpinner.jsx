import React from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

/**
 * 增强版加载指示器 - 提供更好的视觉反馈
 * 支持多种样式和大小
 */

// 圆点加载动画
export const DotLoader = ({ size = 'md', color = 'blue' }) => {
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  };

  const colorClasses = {
    blue: 'bg-blue-600',
    purple: 'bg-purple-600',
    green: 'bg-green-600',
    gray: 'bg-gray-600'
  };

  const dotVariants = {
    start: { y: 0 },
    end: { y: -10 }
  };

  return (
    <div className="flex items-center justify-center gap-2">
      {[0, 1, 2].map((index) => (
        <motion.div
          key={index}
          className={`${sizeClasses[size]} ${colorClasses[color]} rounded-full`}
          variants={dotVariants}
          animate="end"
          transition={{
            duration: 0.5,
            repeat: Infinity,
            repeatType: 'reverse',
            delay: index * 0.15
          }}
        />
      ))}
    </div>
  );
};

// 旋转加载动画
export const SpinLoader = ({ size = 'md', color = 'blue' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  const colorClasses = {
    blue: 'text-blue-600',
    purple: 'text-purple-600',
    green: 'text-green-600',
    gray: 'text-gray-600'
  };

  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
    >
      <Loader2 className={`${sizeClasses[size]} ${colorClasses[color]}`} />
    </motion.div>
  );
};

// 进度条加载
export const ProgressLoader = ({ progress = 0, showPercentage = true }) => {
  return (
    <div className="w-full">
      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <motion.div
          className="h-full bg-blue-600 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
      {showPercentage && (
        <p className="text-sm text-gray-600 mt-2 text-center">
          {Math.round(progress)}%
        </p>
      )}
    </div>
  );
};

// 脉冲加载
export const PulseLoader = ({ size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  return (
    <motion.div
      className={`${sizeClasses[size]} bg-blue-600 rounded-full`}
      animate={{
        scale: [1, 1.2, 1],
        opacity: [0.7, 1, 0.7]
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut'
      }}
    />
  );
};

// 全屏加载遮罩
export const LoadingOverlay = ({ message = '加载中...', type = 'spin' }) => {
  const loaders = {
    spin: <SpinLoader size="xl" />,
    dots: <DotLoader size="lg" />,
    pulse: <PulseLoader size="lg" />
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50"
    >
      <div className="bg-white rounded-lg p-8 flex flex-col items-center gap-4 shadow-xl">
        {loaders[type]}
        {message && (
          <p className="text-gray-700 font-medium">{message}</p>
        )}
      </div>
    </motion.div>
  );
};

// 内联加载器（用于按钮等）
export const InlineLoader = ({ size = 'sm', text = '' }) => {
  return (
    <div className="flex items-center gap-2">
      <SpinLoader size={size} color="gray" />
      {text && <span className="text-sm text-gray-600">{text}</span>}
    </div>
  );
};

// 卡片加载状态
export const CardLoader = ({ title = '', lines = 3 }) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        {title ? (
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        ) : (
          <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
        )}
        <DotLoader size="sm" />
      </div>
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className="h-4 bg-gray-200 rounded animate-pulse"
            style={{ width: `${100 - index * 10}%` }}
          />
        ))}
      </div>
    </div>
  );
};

// 默认导出 - 最常用的加载器
const EnhancedLoadingSpinner = ({ 
  type = 'spin', 
  size = 'md', 
  color = 'blue',
  message = '' 
}) => {
  const loaders = {
    spin: <SpinLoader size={size} color={color} />,
    dots: <DotLoader size={size} color={color} />,
    pulse: <PulseLoader size={size} />
  };

  return (
    <div className="flex flex-col items-center justify-center gap-3">
      {loaders[type]}
      {message && (
        <p className="text-sm text-gray-600 text-center">{message}</p>
      )}
    </div>
  );
};

export default EnhancedLoadingSpinner;
