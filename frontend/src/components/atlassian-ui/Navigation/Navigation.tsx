import React, { forwardRef, useState } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

// 导航栏变体
const navigationVariants = cva(
  [
    'flex items-center justify-between',
    'bg-white border-b border-gray-200',
    'px-4 py-2',
    'shadow-sm',
  ],
  {
    variants: {
      size: {
        compact: 'h-12',
        standard: 'h-14',
        large: 'h-16',
      },
      variant: {
        primary: 'bg-blue-600 text-white border-blue-700',
        secondary: 'bg-gray-800 text-white border-gray-700',
        light: 'bg-white text-gray-900 border-gray-200',
      },
    },
    defaultVariants: {
      size: 'standard',
      variant: 'light',
    },
  }
);

// 导航项变体
const navItemVariants = cva(
  [
    'flex items-center px-3 py-2',
    'text-sm font-medium',
    'rounded-sm',
    'transition-all duration-200',
    'cursor-pointer',
  ],
  {
    variants: {
      active: {
        true: 'bg-blue-100 text-blue-700 border-b-2 border-blue-500',
        false: 'text-gray-700 hover:bg-gray-100 hover:text-gray-900',
      },
      disabled: {
        true: 'text-gray-400 cursor-not-allowed hover:bg-transparent',
        false: '',
      },
    },
    defaultVariants: {
      active: false,
      disabled: false,
    },
  }
);

// 导航项接口
export interface NavigationItem {
  id: string;
  label: string;
  href?: string;
  icon?: React.ReactNode;
  badge?: string | number;
  disabled?: boolean;
  children?: NavigationItem[];
}

// 顶部导航栏组件
export interface TopNavigationProps
  extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof navigationVariants> {
  logo?: React.ReactNode;
  items?: NavigationItem[];
  actions?: React.ReactNode;
  activeItem?: string;
  onItemClick?: (item: NavigationItem) => void;
}

export const TopNavigation = forwardRef<HTMLElement, TopNavigationProps>(
  (
    {
      className,
      logo,
      items = [],
      actions,
      activeItem,
      onItemClick,
      size,
      variant,
      ...props
    },
    ref
  ) => {
    const [hoveredItem, setHoveredItem] = useState<string | null>(null);

    return (
      <nav
        ref={ref}
        className={clsx(navigationVariants({ size, variant }), className)}
        {...props}
      >
        {/* Logo 区域 */}
        <div className="flex items-center space-x-4">
          {logo && <div className="flex-shrink-0">{logo}</div>}
          
          {/* 导航项 */}
          <div className="hidden md:flex items-center space-x-1">
            {items.map((item) => (
              <NavItem
                key={item.id}
                item={item}
                active={activeItem === item.id}
                onClick={() => onItemClick?.(item)}
                onHover={setHoveredItem}
                isHovered={hoveredItem === item.id}
              />
            ))}
          </div>
        </div>

        {/* 操作区域 */}
        {actions && (
          <div className="flex items-center space-x-2">
            {actions}
          </div>
        )}
      </nav>
    );
  }
);

TopNavigation.displayName = 'TopNavigation';

// 导航项组件
interface NavItemProps {
  item: NavigationItem;
  active?: boolean;
  onClick?: () => void;
  onHover?: (id: string | null) => void;
  isHovered?: boolean;
}

const NavItem: React.FC<NavItemProps> = ({
  item,
  active = false,
  onClick,
  onHover,
  isHovered = false,
}) => {
  const [showDropdown, setShowDropdown] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    if (item.disabled) {
      e.preventDefault();
      return;
    }
    
    if (item.children && item.children.length > 0) {
      setShowDropdown(!showDropdown);
    } else {
      onClick?.();
    }
  };

  return (
    <div
      className="relative"
      onMouseEnter={() => onHover?.(item.id)}
      onMouseLeave={() => onHover?.(null)}
    >
      <motion.div
        className={clsx(
          navItemVariants({ active, disabled: item.disabled }),
          'flex items-center space-x-2'
        )}
        onClick={handleClick}
        whileHover={{ scale: item.disabled ? 1 : 1.02 }}
        whileTap={{ scale: item.disabled ? 1 : 0.98 }}
      >
        {item.icon && (
          <span className="w-4 h-4">{item.icon}</span>
        )}
        <span>{item.label}</span>
        
        {item.badge && (
          <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
            {item.badge}
          </span>
        )}
        
        {item.children && item.children.length > 0 && (
          <svg
            className={clsx(
              'w-4 h-4 transition-transform duration-200',
              showDropdown && 'rotate-180'
            )}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        )}
      </motion.div>

      {/* 下拉菜单 */}
      <AnimatePresence>
        {showDropdown && item.children && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-dropdown"
          >
            {item.children.map((child) => (
              <a
                key={child.id}
                href={child.href}
                className={clsx(
                  'block px-4 py-2 text-sm',
                  child.disabled
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-gray-700 hover:bg-gray-100'
                )}
                onClick={(e) => {
                  if (child.disabled) {
                    e.preventDefault();
                  } else {
                    setShowDropdown(false);
                  }
                }}
              >
                <div className="flex items-center space-x-2">
                  {child.icon && <span className="w-4 h-4">{child.icon}</span>}
                  <span>{child.label}</span>
                  {child.badge && (
                    <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                      {child.badge}
                    </span>
                  )}
                </div>
              </a>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// 侧边栏导航组件
export interface SidebarNavigationProps
  extends React.HTMLAttributes<HTMLElement> {
  items: NavigationItem[];
  activeItem?: string;
  collapsed?: boolean;
  onItemClick?: (item: NavigationItem) => void;
  onCollapsedChange?: (collapsed: boolean) => void;
  header?: React.ReactNode;
  footer?: React.ReactNode;
}

export const SidebarNavigation = forwardRef<HTMLElement, SidebarNavigationProps>(
  (
    {
      className,
      items,
      activeItem,
      collapsed = false,
      onItemClick,
      onCollapsedChange,
      header,
      footer,
      ...props
    },
    ref
  ) => {
    return (
      <motion.nav
        ref={ref}
        className={clsx(
          'flex flex-col bg-white border-r border-gray-200 shadow-sm',
          collapsed ? 'w-16' : 'w-60',
          className
        )}
        animate={{ width: collapsed ? 64 : 240 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        {...props}
      >
        {/* 头部 */}
        {header && (
          <div className={clsx(
            'p-4 border-b border-gray-200',
            collapsed && 'px-2'
          )}>
            {header}
          </div>
        )}

        {/* 折叠按钮 */}
        <div className="p-2">
          <motion.button
            onClick={() => onCollapsedChange?.(!collapsed)}
            className="w-full flex items-center justify-center p-2 rounded-sm hover:bg-gray-100 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <svg
              className={clsx(
                'w-4 h-4 transition-transform duration-300',
                collapsed ? 'rotate-180' : ''
              )}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </motion.button>
        </div>

        {/* 导航项列表 */}
        <div className="flex-1 overflow-y-auto py-2">
          {items.map((item) => (
            <SidebarItem
              key={item.id}
              item={item}
              active={activeItem === item.id}
              collapsed={collapsed}
              onClick={() => onItemClick?.(item)}
            />
          ))}
        </div>

        {/* 底部 */}
        {footer && (
          <div className={clsx(
            'p-4 border-t border-gray-200',
            collapsed && 'px-2'
          )}>
            {footer}
          </div>
        )}
      </motion.nav>
    );
  }
);

SidebarNavigation.displayName = 'SidebarNavigation';

// 侧边栏项组件
interface SidebarItemProps {
  item: NavigationItem;
  active?: boolean;
  collapsed?: boolean;
  onClick?: () => void;
}

const SidebarItem: React.FC<SidebarItemProps> = ({
  item,
  active = false,
  collapsed = false,
  onClick,
}) => {
  const [expanded, setExpanded] = useState(false);
  const hasChildren = item.children && item.children.length > 0;

  const handleClick = () => {
    if (item.disabled) return;
    
    if (hasChildren && !collapsed) {
      setExpanded(!expanded);
    } else {
      onClick?.();
    }
  };

  return (
    <div className="px-2">
      <motion.div
        className={clsx(
          'flex items-center rounded-sm cursor-pointer transition-all duration-200',
          'hover:bg-gray-100',
          active ? 'bg-blue-100 text-blue-700 border-r-2 border-blue-500' : 'text-gray-700',
          item.disabled && 'text-gray-400 cursor-not-allowed hover:bg-transparent',
          collapsed ? 'justify-center p-2' : 'px-3 py-2 space-x-3'
        )}
        onClick={handleClick}
        whileHover={{ scale: item.disabled ? 1 : 1.02 }}
        title={collapsed ? item.label : undefined}
      >
        {item.icon && (
          <span className={clsx('flex-shrink-0', collapsed ? 'w-5 h-5' : 'w-4 h-4')}>
            {item.icon}
          </span>
        )}
        
        {!collapsed && (
          <>
            <span className="flex-1 truncate">{item.label}</span>
            
            {item.badge && (
              <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                {item.badge}
              </span>
            )}
            
            {hasChildren && (
              <svg
                className={clsx(
                  'w-4 h-4 transition-transform duration-200',
                  expanded && 'rotate-90'
                )}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </>
        )}
      </motion.div>

      {/* 子项 */}
      <AnimatePresence>
        {expanded && hasChildren && !collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="ml-7 overflow-hidden"
          >
            {item.children!.map((child) => (
              <SidebarItem
                key={child.id}
                item={child}
                active={activeItem === child.id}
                collapsed={false}
                onClick={() => onClick?.()}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export type NavigationSize = VariantProps<typeof navigationVariants>['size'];
export type NavigationVariant = VariantProps<typeof navigationVariants>['variant'];