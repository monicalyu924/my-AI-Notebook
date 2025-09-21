import React, { useState, useEffect, useRef } from 'react';
import { X, ArrowLeft, ArrowRight, Target, Lightbulb, Keyboard } from 'lucide-react';
import { useAdvancedResponsive } from '../../hooks/useAdvancedResponsive';
import { motion, AnimatePresence } from 'framer-motion';

const UserGuide = ({ 
  isOpen, 
  onClose, 
  steps = [], 
  startStep = 0,
  onComplete,
  showProgress = true 
}) => {
  const [currentStep, setCurrentStep] = useState(startStep);
  const [targetElement, setTargetElement] = useState(null);
  const { isMobile, getResponsiveValue } = useAdvancedResponsive();
  const overlayRef = useRef(null);
  
  const step = steps[currentStep];
  
  useEffect(() => {
    if (!isOpen || !step) return;
    
    // 查找目标元素
    if (step.target) {
      const element = document.querySelector(step.target);
      setTargetElement(element);
      
      // 滚动到目标元素
      if (element) {
        element.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
      }
    }
  }, [isOpen, step, currentStep]);
  
  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // 完成引导
      onComplete?.();
      onClose();
    }
  };
  
  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  const skipGuide = () => {
    onClose();
  };
  
  // 获取目标元素的位置
  const getTargetPosition = () => {
    if (!targetElement) return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
    
    const rect = targetElement.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
    
    return {
      top: rect.top + scrollTop,
      left: rect.left + scrollLeft,
      width: rect.width,
      height: rect.height
    };
  };
  
  const targetPos = getTargetPosition();
  
  if (!isOpen || !step) return null;
  
  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50">
        {/* 遮罩层 */}
        <motion.div
          ref={overlayRef}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black bg-opacity-75"
          onClick={skipGuide}
        />
        
        {/* 高亮目标元素 */}
        {targetElement && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute border-4 border-blue-400 rounded-lg shadow-lg"
            style={{
              top: targetPos.top - 4,
              left: targetPos.left - 4,
              width: targetPos.width + 8,
              height: targetPos.height + 8,
              pointerEvents: 'none'
            }}
          />
        )}
        
        {/* 引导提示框 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className={`absolute bg-white rounded-xl shadow-2xl z-10 ${
            isMobile ? 'mx-4 max-w-sm' : 'max-w-md'
          }`}
          style={{
            top: targetElement 
              ? `${targetPos.top + targetPos.height + 20}px`
              : '50%',
            left: targetElement 
              ? `${Math.max(16, Math.min(targetPos.left, window.innerWidth - (isMobile ? 320 : 400)))}px`
              : '50%',
            transform: !targetElement ? 'translate(-50%, -50%)' : undefined
          }}
        >
          {/* 指示箭头 */}
          {targetElement && (
            <div 
              className="absolute w-4 h-4 bg-white transform rotate-45 border-l border-t border-gray-200"
              style={{
                top: -8,
                left: Math.max(20, Math.min(targetPos.width / 2, 380))
              }}
            />
          )}
          
          <div className="p-6">
            {/* 头部 */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                {step.icon || <Lightbulb className="w-5 h-5 text-blue-600" />}
                <h3 className="text-lg font-semibold text-gray-900">
                  {step.title}
                </h3>
              </div>
              
              <button
                onClick={skipGuide}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                aria-label="关闭引导"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* 内容 */}
            <div className="mb-6">
              <p className="text-gray-600 leading-relaxed mb-4">
                {step.description}
              </p>
              
              {/* 额外内容 */}
              {step.content && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  {step.content}
                </div>
              )}
              
              {/* 快捷键提示 */}
              {step.shortcut && (
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <Keyboard className="w-4 h-4" />
                  <span>快捷键: </span>
                  <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-xs font-mono">
                    {step.shortcut}
                  </kbd>
                </div>
              )}
            </div>
            
            {/* 底部控制 */}
            <div className="flex items-center justify-between">
              {/* 进度指示器 */}
              {showProgress && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">
                    {currentStep + 1} / {steps.length}
                  </span>
                  <div className="flex space-x-1">
                    {steps.map((_, index) => (
                      <div
                        key={index}
                        className={`w-2 h-2 rounded-full ${
                          index === currentStep 
                            ? 'bg-blue-600' 
                            : index < currentStep 
                            ? 'bg-blue-300' 
                            : 'bg-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )}
              
              {/* 导航按钮 */}
              <div className="flex items-center space-x-2">
                {currentStep > 0 && (
                  <button
                    onClick={prevStep}
                    className="flex items-center space-x-1 px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>上一步</span>
                  </button>
                )}
                
                <button
                  onClick={nextStep}
                  className="flex items-center space-x-1 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors"
                >
                  <span>
                    {currentStep === steps.length - 1 ? '完成' : '下一步'}
                  </span>
                  {currentStep < steps.length - 1 && (
                    <ArrowRight className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

// 预定义的引导步骤
export const createWelcomeGuide = () => [
  {
    title: '欢迎使用AI智能记事本',
    description: '让我们花几分钟时间了解一下主要功能，帮助您快速上手。',
    icon: <Target className="w-5 h-5 text-blue-600" />,
    content: (
      <div className="text-sm">
        <p className="font-medium text-blue-800 mb-2">主要功能包括：</p>
        <ul className="space-y-1 text-blue-700">
          <li>• 智能笔记编辑</li>
          <li>• AI助手对话</li>
          <li>• 项目管理看板</li>
          <li>• 待办事项管理</li>
        </ul>
      </div>
    )
  },
  {
    title: '侧边栏导航',
    description: '这里是主要的导航区域，您可以在不同功能模块之间快速切换。',
    target: '[data-guide="sidebar"]',
    shortcut: 'Ctrl + B'
  },
  {
    title: '命令面板',
    description: '使用快捷键打开命令面板，快速执行各种操作和功能。',
    target: '[data-guide="command-palette-trigger"]',
    shortcut: 'Ctrl + K'
  },
  {
    title: 'AI助手',
    description: '点击这里与AI助手对话，获得智能帮助和建议。',
    target: '[data-guide="ai-assistant"]',
    content: (
      <div className="text-sm text-gray-600">
        AI助手可以帮您：文本续写、内容润色、翻译总结等
      </div>
    )
  },
  {
    title: '完成！',
    description: '您已经了解了基本功能。开始探索和创造吧！',
    content: (
      <div className="text-center">
        <div className="text-2xl mb-2">🎉</div>
        <p className="text-sm text-gray-600">
          随时可以在设置中重新查看此引导
        </p>
      </div>
    )
  }
];

export default UserGuide;