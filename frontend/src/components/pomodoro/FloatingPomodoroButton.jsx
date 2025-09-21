import React, { useState, useRef, useEffect } from 'react';
import { Clock, X } from 'lucide-react';
import PomodoroTimer from './PomodoroTimer';

const FloatingPomodoroButton = () => {
  const [isTimerOpen, setIsTimerOpen] = useState(false);
  
  // 拖拽相关状态
  const [position, setPosition] = useState(() => {
    // 从localStorage读取保存的位置
    const savedPosition = localStorage.getItem('pomodoroButtonPosition');
    if (savedPosition) {
      return JSON.parse(savedPosition);
    }
    // 默认位置
    return { x: window.innerWidth - 100, y: window.innerHeight - 100 };
  });
  
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const buttonRef = useRef(null);

  // 保存位置到localStorage
  useEffect(() => {
    localStorage.setItem('pomodoroButtonPosition', JSON.stringify(position));
  }, [position]);

  // 拖拽开始
  const handleMouseDown = (e) => {
    if (e.button !== 0) return; // 只响应左键
    
    setIsDragging(true);
    const rect = buttonRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    
    // 阻止默认行为
    e.preventDefault();
  };

  // 拖拽过程
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return;
      
      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;
      
      // 边界检查，防止拖出屏幕
      const maxX = window.innerWidth - 56; // 按钮宽度是56px (w-14)
      const maxY = window.innerHeight - 56;
      
      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY))
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = 'none'; // 禁止选择文本
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.userSelect = '';
      };
    }
  }, [isDragging, dragOffset]);

  // 处理点击事件 - 区分拖拽和点击
  const [dragStartTime, setDragStartTime] = useState(0);
  
  const handleMouseDownStart = (e) => {
    setDragStartTime(Date.now());
    handleMouseDown(e);
  };
  
  const handleClick = () => {
    // 如果拖拽时间超过200ms，则不触发点击
    const dragDuration = Date.now() - dragStartTime;
    if (dragDuration < 200) {
      setIsTimerOpen(true);
    }
  };

  return (
    <>
      {/* 浮动按钮 */}
      {!isTimerOpen && (
        <button
          ref={buttonRef}
          onMouseDown={handleMouseDownStart}
          onClick={handleClick}
          className={`fixed z-40 w-14 h-14 bg-red-600 text-white rounded-full shadow-lg flex items-center justify-center transition-colors ${
            isDragging 
              ? 'cursor-grabbing scale-110' 
              : 'cursor-grab hover:bg-red-700 hover:scale-105'
          }`}
          style={{
            left: `${position.x}px`,
            top: `${position.y}px`,
            transition: isDragging ? 'none' : 'transform 0.2s, background-color 0.2s'
          }}
          title="番茄钟 - 可拖拽"
        >
          <Clock className="h-6 w-6" />
        </button>
      )}

      {/* 浮动番茄钟 */}
      {isTimerOpen && (
        <PomodoroTimer 
          isFloating={true} 
          onClose={() => setIsTimerOpen(false)}
          buttonPosition={position}
        />
      )}
    </>
  );
};

export default FloatingPomodoroButton;