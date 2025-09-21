import React, { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';

// 卡片变体定义
const cardVariants = cva(
  [
    'bg-white rounded-sm border border-gray-200',
    'transition-all duration-200',
  ],
  {
    variants: {
      // 阴影级别
      shadow: {
        none: 'shadow-none',
        sm: 'shadow-sm',
        md: 'shadow-md hover:shadow-lg',
        lg: 'shadow-lg hover:shadow-xl',
      },
      
      // 内边距
      padding: {
        none: 'p-0',
        sm: 'p-3',
        md: 'p-4',
        lg: 'p-6',
      },
      
      // 交互状态
      interactive: {
        true: 'cursor-pointer hover:border-gray-300',
        false: '',
      },
      
      // 选中状态
      selected: {
        true: 'border-blue-500 ring-2 ring-blue-200',
        false: '',
      },
    },
    defaultVariants: {
      shadow: 'sm',
      padding: 'md',
      interactive: false,
      selected: false,
    },
  }
);

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  children: React.ReactNode;
  asChild?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      className,
      children,
      shadow,
      padding,
      interactive,
      selected,
      onClick,
      ...props
    },
    ref
  ) => {
    const MotionDiv = interactive ? motion.div : 'div';

    const motionProps = interactive
      ? {
          whileHover: { y: -2 },
          whileTap: { scale: 0.98 },
          transition: { duration: 0.2 },
        }
      : {};

    return (
      <MotionDiv
        ref={ref}
        className={clsx(
          cardVariants({ shadow, padding, interactive, selected }),
          className
        )}
        onClick={onClick}
        {...motionProps}
        {...props}
      >
        {children}
      </MotionDiv>
    );
  }
);

Card.displayName = 'Card';

// 卡片标题组件
export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, title, subtitle, actions, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={clsx(
          'flex items-center justify-between p-4 border-b border-gray-200',
          className
        )}
        {...props}
      >
        <div className="min-w-0 flex-1">
          {title && (
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {title}
            </h3>
          )}
          {subtitle && (
            <p className="text-sm text-gray-600 mt-1 truncate">
              {subtitle}
            </p>
          )}
          {children}
        </div>
        {actions && (
          <div className="ml-4 flex items-center space-x-2">
            {actions}
          </div>
        )}
      </div>
    );
  }
);

CardHeader.displayName = 'CardHeader';

// 卡片内容组件
export interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const CardContent = forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={clsx('p-4', className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

CardContent.displayName = 'CardContent';

// 卡片底部组件
export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  justify?: 'start' | 'center' | 'end' | 'between';
}

export const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, children, justify = 'end', ...props }, ref) => {
    const justifyClasses = {
      start: 'justify-start',
      center: 'justify-center',
      end: 'justify-end',
      between: 'justify-between',
    };

    return (
      <div
        ref={ref}
        className={clsx(
          'flex items-center p-4 border-t border-gray-200',
          justifyClasses[justify],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

CardFooter.displayName = 'CardFooter';

// 状态卡片组件 (用于显示状态信息)
export interface StatusCardProps extends Omit<CardProps, 'children'> {
  status: 'success' | 'warning' | 'error' | 'info';
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export const StatusCard = forwardRef<HTMLDivElement, StatusCardProps>(
  ({ status, title, description, icon, action, ...props }, ref) => {
    const statusConfig = {
      success: {
        borderColor: 'border-l-green-500',
        iconColor: 'text-green-500',
        titleColor: 'text-green-900',
        bgColor: 'bg-green-50',
      },
      warning: {
        borderColor: 'border-l-yellow-500',
        iconColor: 'text-yellow-500',
        titleColor: 'text-yellow-900',
        bgColor: 'bg-yellow-50',
      },
      error: {
        borderColor: 'border-l-red-500',
        iconColor: 'text-red-500',
        titleColor: 'text-red-900',
        bgColor: 'bg-red-50',
      },
      info: {
        borderColor: 'border-l-blue-500',
        iconColor: 'text-blue-500',
        titleColor: 'text-blue-900',
        bgColor: 'bg-blue-50',
      },
    };

    const config = statusConfig[status];

    return (
      <Card
        ref={ref}
        className={clsx(
          config.bgColor,
          config.borderColor,
          'border-l-4'
        )}
        {...props}
      >
        <div className="flex items-start space-x-3">
          {icon && (
            <div className={clsx('mt-1', config.iconColor)}>
              {icon}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h4 className={clsx('text-sm font-medium', config.titleColor)}>
              {title}
            </h4>
            {description && (
              <p className="text-sm text-gray-600 mt-1">
                {description}
              </p>
            )}
          </div>
          {action && (
            <div className="ml-4">
              {action}
            </div>
          )}
        </div>
      </Card>
    );
  }
);

StatusCard.displayName = 'StatusCard';

export type CardShadow = VariantProps<typeof cardVariants>['shadow'];
export type CardPadding = VariantProps<typeof cardVariants>['padding'];