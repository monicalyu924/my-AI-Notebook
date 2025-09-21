import React, { useState, useRef, useEffect } from 'react';
import { HelpCircle, X, Lightbulb } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const FeatureTooltip = ({ 
  children, 
  title, 
  description, 
  shortcut,
  placement = 'top',
  showOnHover = true,
  showOnClick = false,
  persistent = false,
  className = '',
  triggerClassName = ''
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isPersistent, setIsPersistent] = useState(false);
  const triggerRef = useRef(null);
  const tooltipRef = useRef(null);
  const timeoutRef = useRef(null);
  
  const showTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(true);
  };
  
  const hideTooltip = () => {
    if (isPersistent) return;
    
    timeoutRef.current = setTimeout(() => {
      setIsVisible(false);
    }, 150);
  };
  
  const togglePersistent = () => {
    setIsPersistent(!isPersistent);
    if (!isPersistent) {
      setIsVisible(true);
    }
  };
  
  const handleClickOutside = (event) => {
    if (
      tooltipRef.current && 
      !tooltipRef.current.contains(event.target) &&
      triggerRef.current &&
      !triggerRef.current.contains(event.target)
    ) {
      setIsVisible(false);
      setIsPersistent(false);
    }
  };
  
  useEffect(() => {
    if (isVisible && isPersistent) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isVisible, isPersistent]);
  
  const getTooltipPosition = () => {
    if (!triggerRef.current) return {};
    
    const rect = triggerRef.current.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
    
    const positions = {
      top: {
        top: rect.top + scrollTop - 10,
        left: rect.left + scrollLeft + rect.width / 2,
        transform: 'translate(-50%, -100%)'
      },
      bottom: {
        top: rect.bottom + scrollTop + 10,
        left: rect.left + scrollLeft + rect.width / 2,
        transform: 'translate(-50%, 0)'
      },
      left: {
        top: rect.top + scrollTop + rect.height / 2,
        left: rect.left + scrollLeft - 10,
        transform: 'translate(-100%, -50%)'
      },
      right: {
        top: rect.top + scrollTop + rect.height / 2,
        left: rect.right + scrollLeft + 10,
        transform: 'translate(0, -50%)'
      }
    };
    
    return positions[placement] || positions.top;
  };
  
  const tooltipPosition = getTooltipPosition();
  
  return (
    <>
      {/* 触发元素 */}
      <div
        ref={triggerRef}
        className={`inline-block ${triggerClassName}`}
        onMouseEnter={showOnHover ? showTooltip : undefined}
        onMouseLeave={showOnHover ? hideTooltip : undefined}
        onClick={showOnClick ? () => setIsVisible(!isVisible) : undefined}
      >
        {children}
      </div>
      
      {/* 提示框 */}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            ref={tooltipRef}
            initial={{ opacity: 0, scale: 0.8, y: placement === 'top' ? 10 : -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: placement === 'top' ? 10 : -10 }}
            transition={{ duration: 0.15 }}
            className={`fixed z-50 max-w-xs ${className}`}
            style={tooltipPosition}
            onMouseEnter={() => {
              if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
              }
            }}
            onMouseLeave={hideTooltip}
          >
            {/* 箭头 */}
            <div 
              className={`absolute w-3 h-3 bg-gray-900 transform rotate-45 ${
                placement === 'top' ? 'bottom-[-6px] left-1/2 -translate-x-1/2' :
                placement === 'bottom' ? 'top-[-6px] left-1/2 -translate-x-1/2' :
                placement === 'left' ? 'right-[-6px] top-1/2 -translate-y-1/2' :
                'left-[-6px] top-1/2 -translate-y-1/2'
              }`}
            />
            
            {/* 内容 */}
            <div className="bg-gray-900 text-white text-sm rounded-lg shadow-lg overflow-hidden">
              {/* 头部 */}
              <div className="flex items-center justify-between p-3 border-b border-gray-700">
                <div className="flex items-center space-x-2">
                  <Lightbulb className="w-4 h-4 text-yellow-400" />
                  <span className="font-medium">{title}</span>
                </div>
                
                <div className="flex items-center space-x-1">
                  {persistent && (
                    <button
                      onClick={togglePersistent}
                      className={`p-1 rounded transition-colors ${
                        isPersistent 
                          ? 'bg-blue-600 text-white' 
                          : 'text-gray-400 hover:text-white hover:bg-gray-700'
                      }`}
                      title={isPersistent ? '取消固定' : '固定提示'}
                    >
                      <HelpCircle className="w-3 h-3" />
                    </button>
                  )}
                  
                  <button
                    onClick={() => {
                      setIsVisible(false);
                      setIsPersistent(false);
                    }}
                    className="p-1 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>
              
              {/* 描述 */}
              <div className="p-3">
                <p className="text-gray-300 leading-relaxed mb-3">
                  {description}
                </p>
                
                {/* 快捷键 */}
                {shortcut && (
                  <div className="flex items-center space-x-2 pt-2 border-t border-gray-700">
                    <span className="text-xs text-gray-400">快捷键:</span>
                    <kbd className="px-2 py-1 bg-gray-800 border border-gray-600 rounded text-xs font-mono">
                      {shortcut}
                    </kbd>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

// 带图标的帮助触发器
export const HelpTrigger = ({ 
  title, 
  description, 
  shortcut, 
  size = 'sm',
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };
  
  return (
    <FeatureTooltip
      title={title}
      description={description}
      shortcut={shortcut}
      showOnHover={true}
      persistent={true}
      triggerClassName={`inline-flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors cursor-help ${className}`}
    >
      <HelpCircle className={sizeClasses[size]} />
    </FeatureTooltip>
  );
};

// 功能介绍悬浮标签
export const FeatureBadge = ({ 
  feature, 
  children, 
  isNew = false, 
  isBeta = false 
}) => {
  return (
    <FeatureTooltip
      title={feature.title}
      description={feature.description}
      shortcut={feature.shortcut}
      showOnHover={true}
      className="relative"
    >
      <div className="relative">
        {children}
        
        {/* 新功能标识 */}
        {(isNew || isBeta) && (
          <div className="absolute -top-1 -right-1 px-1.5 py-0.5 text-xs font-bold rounded-full text-white bg-gradient-to-r from-red-500 to-pink-500">
            {isNew ? 'NEW' : 'BETA'}
          </div>
        )}
      </div>
    </FeatureTooltip>
  );
};

export default FeatureTooltip;