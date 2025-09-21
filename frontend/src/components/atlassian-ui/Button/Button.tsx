import React, { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';

// 使用 CVA 定义按钮变体
const buttonVariants = cva(
  // 基础样式
  [
    'inline-flex items-center justify-center',
    'font-medium text-sm leading-5',
    'border border-transparent',
    'cursor-pointer select-none',
    'transition-all duration-200',
    'focus:outline-none focus:ring-2 focus:ring-offset-2',
    'disabled:cursor-not-allowed disabled:opacity-50',
    'rounded-sm', // 3px 圆角
  ],
  {
    variants: {
      // 按钮类型变体
      variant: {
        primary: [
          'bg-blue-600 text-white', // #0052CC
          'hover:bg-blue-700',
          'focus:ring-blue-500',
          'active:bg-blue-800',
        ],
        secondary: [
          'bg-white text-gray-700 border-gray-300',
          'hover:bg-gray-50 hover:border-gray-400',
          'focus:ring-blue-500',
          'active:bg-gray-100',
        ],
        ghost: [
          'bg-transparent text-gray-700',
          'hover:bg-gray-100',
          'focus:ring-blue-500',
          'active:bg-gray-200',
        ],
        danger: [
          'bg-red-600 text-white', // #DE350B
          'hover:bg-red-700',
          'focus:ring-red-500',
          'active:bg-red-800',
        ],
        success: [
          'bg-green-600 text-white', // #36B37E
          'hover:bg-green-700',
          'focus:ring-green-500',
          'active:bg-green-800',
        ],
      },
      
      // 尺寸变体
      size: {
        small: 'h-8 px-3 py-1 text-xs', // 32px height
        medium: 'h-10 px-4 py-2 text-sm', // 40px height
        large: 'h-12 px-6 py-3 text-base', // 48px height
      },
      
      // 加载状态
      loading: {
        true: 'cursor-wait',
        false: '',
      },
      
      // 圆形按钮
      rounded: {
        true: 'rounded-full',
        false: 'rounded-sm',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'medium',
      loading: false,
      rounded: false,
    },
  }
);

// 加载图标组件
const LoadingSpinner = ({ size = 16 }: { size?: number }) => (
  <motion.svg
    animate={{ rotate: 360 }}
    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
    width={size}
    height={size}
    viewBox="0 0 24 24"
    className="mr-2"
  >
    <circle
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
      strokeDasharray="32"
      strokeDashoffset="32"
      className="opacity-25"
    />
    <circle
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
      strokeDasharray="32"
      strokeDashoffset="8"
    />
  </motion.svg>
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  children: React.ReactNode;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  asChild?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      loading = false,
      rounded,
      disabled,
      children,
      leftIcon,
      rightIcon,
      onClick,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    return (
      <motion.button
        ref={ref}
        className={clsx(buttonVariants({ variant, size, loading, rounded }), className)}
        disabled={isDisabled}
        onClick={isDisabled ? undefined : onClick}
        whileHover={{ scale: isDisabled ? 1 : 1.02 }}
        whileTap={{ scale: isDisabled ? 1 : 0.98 }}
        transition={{ duration: 0.1 }}
        {...props}
      >
        {loading && <LoadingSpinner size={size === 'small' ? 14 : 16} />}
        {!loading && leftIcon && <span className="mr-2">{leftIcon}</span>}
        
        <span className="flex-1 text-center">
          {loading ? '加载中...' : children}
        </span>
        
        {!loading && rightIcon && <span className="ml-2">{rightIcon}</span>}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';

// 导出变体类型
export type ButtonVariant = VariantProps<typeof buttonVariants>['variant'];
export type ButtonSize = VariantProps<typeof buttonVariants>['size'];