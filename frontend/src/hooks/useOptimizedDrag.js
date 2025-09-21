import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { useSensor, useSensors, PointerSensor, KeyboardSensor } from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';

// 拖拽性能优化Hook
export const useOptimizedDrag = (options = {}) => {
  const {
    activationConstraint = { distance: 3 },
    enableKeyboard = true,
    enableTouch = true,
    optimization = 'balanced'
  } = options;

  // 拖拽状态
  const [isDragging, setIsDragging] = useState(false);
  const [draggedItem, setDraggedItem] = useState(null);
  const [dragOverlay, setDragOverlay] = useState(null);
  
  // 性能相关的refs
  const lastUpdateTime = useRef(0);
  const updateThrottle = useRef(16); // 60fps
  const dragStartTime = useRef(0);
  const frameId = useRef(null);

  // 根据设备性能调整配置
  const performanceConfig = useMemo(() => {
    const isLowEnd = navigator.hardwareConcurrency <= 2 || 
                     'connection' in navigator && navigator.connection?.effectiveType === 'slow-2g';
    
    switch (optimization) {
      case 'performance':
        return {
          updateThrottle: isLowEnd ? 33 : 16, // 30fps/60fps
          useTransform3d: true,
          enableGPUAcceleration: true,
          batchUpdates: true
        };
      case 'quality':
        return {
          updateThrottle: 8, // 120fps
          useTransform3d: true,
          enableGPUAcceleration: true,
          batchUpdates: false
        };
      default: // balanced
        return {
          updateThrottle: isLowEnd ? 25 : 16, // 40fps/60fps
          useTransform3d: true,
          enableGPUAcceleration: true,
          batchUpdates: isLowEnd
        };
    }
  }, [optimization]);

  // 优化的传感器配置
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint,
      // 优化触摸设备性能
      onActivation: () => {
        dragStartTime.current = performance.now();
      }
    }),
    ...(enableKeyboard ? [
      useSensor(KeyboardSensor, {
        coordinateGetter: sortableKeyboardCoordinates,
      })
    ] : [])
  );

  // 节流更新函数
  const throttledUpdate = useCallback((callback) => {
    const now = performance.now();
    if (now - lastUpdateTime.current >= performanceConfig.updateThrottle) {
      if (performanceConfig.batchUpdates) {
        // 批量更新
        if (frameId.current) {
          cancelAnimationFrame(frameId.current);
        }
        frameId.current = requestAnimationFrame(() => {
          callback();
          lastUpdateTime.current = now;
        });
      } else {
        callback();
        lastUpdateTime.current = now;
      }
    }
  }, [performanceConfig]);

  // 拖拽开始处理
  const handleDragStart = useCallback((event) => {
    setIsDragging(true);
    setDraggedItem(event.active.data.current);
    dragStartTime.current = performance.now();
    
    // 启用GPU加速
    if (performanceConfig.enableGPUAcceleration) {
      const draggedElement = document.querySelector(`[data-id="${event.active.id}"]`);
      if (draggedElement) {
        draggedElement.style.willChange = 'transform';
        draggedElement.style.transform = 'translateZ(0)';
      }
    }
  }, [performanceConfig.enableGPUAcceleration]);

  // 拖拽移动处理（优化版）
  const handleDragMove = useCallback((event) => {
    throttledUpdate(() => {
      // 只在必要时更新UI
      const { delta } = event;
      if (Math.abs(delta.x) > 1 || Math.abs(delta.y) > 1) {
        // 触发重渲染
        setDragOverlay(prev => ({ ...prev, ...event }));
      }
    });
  }, [throttledUpdate]);

  // 拖拽结束处理
  const handleDragEnd = useCallback((event) => {
    const dragDuration = performance.now() - dragStartTime.current;
    
    setIsDragging(false);
    setDraggedItem(null);
    setDragOverlay(null);
    
    // 清理GPU加速
    if (performanceConfig.enableGPUAcceleration) {
      const draggedElement = document.querySelector(`[data-id="${event.active.id}"]`);
      if (draggedElement) {
        draggedElement.style.willChange = 'auto';
        draggedElement.style.transform = '';
      }
    }
    
    // 取消待执行的动画帧
    if (frameId.current) {
      cancelAnimationFrame(frameId.current);
      frameId.current = null;
    }
    
    // 性能统计（开发环境）
    if (process.env.NODE_ENV === 'development') {
      console.log(`拖拽操作耗时: ${dragDuration.toFixed(2)}ms`);
    }
  }, [performanceConfig.enableGPUAcceleration]);

  // 清理函数
  useEffect(() => {
    return () => {
      if (frameId.current) {
        cancelAnimationFrame(frameId.current);
      }
    };
  }, []);

  return {
    sensors,
    isDragging,
    draggedItem,
    dragOverlay,
    handleDragStart,
    handleDragMove,
    handleDragEnd,
    performanceConfig
  };
};

// 拖拽项目优化Hook
export const useDragItemOptimization = (item, isDragging = false) => {
  const elementRef = useRef(null);
  const [isOptimized, setIsOptimized] = useState(false);

  // 应用拖拽优化
  const applyOptimizations = useCallback(() => {
    const element = elementRef.current;
    if (!element) return;

    // GPU加速和性能优化
    element.style.willChange = 'transform';
    element.style.backfaceVisibility = 'hidden';
    element.style.perspective = '1000px';
    element.style.transformStyle = 'preserve-3d';
    
    // 移除不必要的过渡动画
    element.style.transition = 'none';
    
    setIsOptimized(true);
  }, []);

  // 清理优化
  const clearOptimizations = useCallback(() => {
    const element = elementRef.current;
    if (!element) return;

    element.style.willChange = 'auto';
    element.style.backfaceVisibility = '';
    element.style.perspective = '';
    element.style.transformStyle = '';
    element.style.transition = '';
    
    setIsOptimized(false);
  }, []);

  // 根据拖拽状态应用/清理优化
  useEffect(() => {
    if (isDragging) {
      applyOptimizations();
    } else {
      clearOptimizations();
    }
  }, [isDragging, applyOptimizations, clearOptimizations]);

  return {
    ref: elementRef,
    isOptimized,
    applyOptimizations,
    clearOptimizations
  };
};

// 虚拟化拖拽Hook（用于大量数据）
export const useVirtualizedDrag = (items, containerHeight, itemHeight) => {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef(null);

  // 计算可见项目范围
  const visibleRange = useMemo(() => {
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight) + 1,
      items.length
    );
    return { startIndex, endIndex };
  }, [scrollTop, itemHeight, containerHeight, items.length]);

  // 可见项目
  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.startIndex, visibleRange.endIndex);
  }, [items, visibleRange]);

  // 滚动处理
  const handleScroll = useCallback((event) => {
    const newScrollTop = event.target.scrollTop;
    setScrollTop(newScrollTop);
  }, []);

  // 获取项目样式
  const getItemStyle = useCallback((index) => {
    const actualIndex = visibleRange.startIndex + index;
    return {
      position: 'absolute',
      top: actualIndex * itemHeight,
      height: itemHeight,
      width: '100%'
    };
  }, [visibleRange.startIndex, itemHeight]);

  return {
    containerRef,
    visibleItems,
    visibleRange,
    handleScroll,
    getItemStyle,
    totalHeight: items.length * itemHeight
  };
};

// 动画优化Hook
export const useAnimationOptimization = () => {
  const [reducedMotion, setReducedMotion] = useState(false);
  const [performanceMode, setPerformanceMode] = useState('auto');

  // 检测用户偏好
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);

    const handleChange = (e) => setReducedMotion(e.matches);
    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeListener(handleChange);
  }, []);

  // 检测设备性能
  useEffect(() => {
    const isLowEnd = navigator.hardwareConcurrency <= 2;
    const isSlowConnection = 'connection' in navigator && 
      navigator.connection?.effectiveType === 'slow-2g';
    
    if (isLowEnd || isSlowConnection) {
      setPerformanceMode('low');
    } else {
      setPerformanceMode('high');
    }
  }, []);

  // 获取动画配置
  const getAnimationConfig = useCallback((animationType = 'default') => {
    if (reducedMotion) {
      return { duration: 0, easing: 'linear' };
    }

    const configs = {
      low: {
        drag: { duration: 150, easing: 'ease-out' },
        sort: { duration: 200, easing: 'ease-in-out' },
        default: { duration: 100, easing: 'ease' }
      },
      high: {
        drag: { duration: 250, easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)' },
        sort: { duration: 300, easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)' },
        default: { duration: 200, easing: 'ease-out' }
      }
    };

    return configs[performanceMode]?.[animationType] || configs[performanceMode].default;
  }, [reducedMotion, performanceMode]);

  return {
    reducedMotion,
    performanceMode,
    getAnimationConfig
  };
};

// 拖拽性能监控Hook
export const useDragPerformanceMonitor = () => {
  const [metrics, setMetrics] = useState({
    averageDragTime: 0,
    totalDrags: 0,
    frameDrops: 0,
    memoryUsage: 0
  });

  const dragTimes = useRef([]);
  const frameMonitor = useRef(null);

  // 记录拖拽性能
  const recordDragPerformance = useCallback((dragTime) => {
    dragTimes.current.push(dragTime);
    
    // 保持最近100次的记录
    if (dragTimes.current.length > 100) {
      dragTimes.current.shift();
    }

    const averageDragTime = dragTimes.current.reduce((a, b) => a + b, 0) / dragTimes.current.length;
    
    setMetrics(prev => ({
      ...prev,
      averageDragTime,
      totalDrags: prev.totalDrags + 1
    }));
  }, []);

  // 监控帧率
  const startFrameMonitoring = useCallback(() => {
    let lastTime = performance.now();
    let frameCount = 0;
    let droppedFrames = 0;

    const monitor = () => {
      const currentTime = performance.now();
      const deltaTime = currentTime - lastTime;
      
      frameCount++;
      
      // 检测掉帧（假设目标60fps）
      if (deltaTime > 16.67 * 1.5) {
        droppedFrames++;
      }

      // 每秒更新一次统计
      if (frameCount >= 60) {
        setMetrics(prev => ({
          ...prev,
          frameDrops: droppedFrames / frameCount
        }));
        frameCount = 0;
        droppedFrames = 0;
      }

      lastTime = currentTime;
      frameMonitor.current = requestAnimationFrame(monitor);
    };

    frameMonitor.current = requestAnimationFrame(monitor);
  }, []);

  // 停止帧率监控
  const stopFrameMonitoring = useCallback(() => {
    if (frameMonitor.current) {
      cancelAnimationFrame(frameMonitor.current);
      frameMonitor.current = null;
    }
  }, []);

  // 获取内存使用情况
  const updateMemoryUsage = useCallback(() => {
    if ('memory' in performance) {
      setMetrics(prev => ({
        ...prev,
        memoryUsage: performance.memory.usedJSHeapSize / 1048576 // MB
      }));
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(updateMemoryUsage, 5000);
    return () => clearInterval(interval);
  }, [updateMemoryUsage]);

  return {
    metrics,
    recordDragPerformance,
    startFrameMonitoring,
    stopFrameMonitoring
  };
};

export default useOptimizedDrag;