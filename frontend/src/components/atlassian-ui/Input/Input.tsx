import React, { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';

// 输入框变体定义
const inputVariants = cva(
  [
    'w-full px-3 py-2',
    'text-sm leading-5',
    'bg-white',
    'border border-gray-300',
    'rounded-sm', // 3px 圆角
    'transition-all duration-200',
    'placeholder:text-gray-500',
    'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
    'disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed',
  ],
  {
    variants: {
      size: {
        small: 'h-8 px-2 py-1 text-xs',
        medium: 'h-10 px-3 py-2 text-sm',
        large: 'h-12 px-4 py-3 text-base',
      },
      
      state: {
        default: 'border-gray-300',
        error: 'border-red-500 focus:ring-red-500',
        success: 'border-green-500 focus:ring-green-500',
        warning: 'border-yellow-500 focus:ring-yellow-500',
      },
      
      rounded: {
        true: 'rounded-md',
        false: 'rounded-sm',
      },
    },
    defaultVariants: {
      size: 'medium',
      state: 'default',
      rounded: false,
    },
  }
);

// 输入框容器变体
const inputContainerVariants = cva([
  'relative flex items-center',
]);

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputVariants> {
  label?: string;
  helperText?: string;
  errorMessage?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  clearable?: boolean;
  onClear?: () => void;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      size,
      state,
      rounded,
      label,
      helperText,
      errorMessage,
      leftIcon,
      rightIcon,
      clearable = false,
      onClear,
      disabled,
      value,
      ...props
    },
    ref
  ) => {
    // 根据错误状态自动设置state
    const inputState = errorMessage ? 'error' : state;
    const showClear = clearable && value && !disabled;

    return (
      <div className="w-full">
        {/* 标签 */}
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
          </label>
        )}

        {/* 输入框容器 */}
        <div className={inputContainerVariants()}>
          {/* 左侧图标 */}
          {leftIcon && (
            <div className="absolute left-3 z-10 text-gray-400">
              {leftIcon}
            </div>
          )}

          {/* 输入框 */}
          <input
            ref={ref}
            disabled={disabled}
            value={value}
            className={clsx(
              inputVariants({ size, state: inputState, rounded }),
              leftIcon && 'pl-10',
              (rightIcon || showClear) && 'pr-10',
              className
            )}
            {...props}
          />

          {/* 右侧图标或清除按钮 */}
          <div className="absolute right-3 flex items-center space-x-1">
            {showClear && (
              <motion.button
                type="button"
                onClick={onClear}
                className="text-gray-400 hover:text-gray-600 focus:outline-none"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
              </motion.button>
            )}
            
            {rightIcon && !showClear && (
              <div className="text-gray-400">
                {rightIcon}
              </div>
            )}
          </div>
        </div>

        {/* 帮助文本或错误信息 */}
        {(helperText || errorMessage) && (
          <div className="mt-1 text-xs">
            {errorMessage ? (
              <span className="text-red-600 flex items-center">
                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {errorMessage}
              </span>
            ) : (
              <span className="text-gray-500">{helperText}</span>
            )}
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

// 搜索框组件变体
export interface SearchInputProps extends Omit<InputProps, 'leftIcon'> {
  onSearch?: (value: string) => void;
  searchDelay?: number;
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  ({ onSearch, searchDelay = 300, ...props }, ref) => {
    const [searchValue, setSearchValue] = React.useState(props.value || '');
    const timeoutRef = React.useRef<NodeJS.Timeout>();

    React.useEffect(() => {
      if (onSearch && searchValue !== props.value) {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        
        timeoutRef.current = setTimeout(() => {
          onSearch(searchValue as string);
        }, searchDelay);
      }

      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };
    }, [searchValue, onSearch, searchDelay, props.value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchValue(e.target.value);
      props.onChange?.(e);
    };

    const handleClear = () => {
      setSearchValue('');
      props.onClear?.();
    };

    const searchIcon = (
      <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
      </svg>
    );

    return (
      <Input
        ref={ref}
        {...props}
        value={searchValue}
        onChange={handleChange}
        onClear={handleClear}
        leftIcon={searchIcon}
        clearable={true}
        placeholder={props.placeholder || '搜索...'}
      />
    );
  }
);

SearchInput.displayName = 'SearchInput';

export type InputVariant = VariantProps<typeof inputVariants>['state'];
export type InputSize = VariantProps<typeof inputVariants>['size'];