import React, { memo, useMemo, useCallback, useRef, useEffect } from 'react';
import { DndContext, DragOverlay, closestCenter, closestCorners, pointerWithin } from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy, verticalListSortingStrategy, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { createPortal } from 'react-dom';
import { useOptimizedDrag, useDragItemOptimization, useAnimationOptimization } from '../../hooks/useOptimizedDrag';
import { useMobileOptimization } from '../../hooks/useMobileOptimization';

// 优化的拖拽容器组件
const OptimizedDragContainer = memo(({
  children,
  items = [],
  onDragStart,
  onDragEnd,
  onDragMove,
  onDragOver,
  strategy = 'vertical',
  collisionDetection = 'default',
  renderDragOverlay,
  disabled = false,
  accessibility = true,
  performanceMode = 'balanced',
  className = '',
  style = {},
  id
}) => {
  const containerRef = useRef(null);
  const { isMobile, isTouchDevice } = useMobileOptimization();
  const { getAnimationConfig } = useAnimationOptimization();
  
  // 拖拽优化配置
  const dragConfig = useMemo(() => ({
    activationConstraint: isMobile ? { distance: 8 } : { distance: 3 },
    enableKeyboard: !isMobile && accessibility,
    enableTouch: isTouchDevice,
    optimization: performanceMode
  }), [isMobile, isTouchDevice, accessibility, performanceMode]);

  const {
    sensors,
    isDragging,
    draggedItem,
    handleDragStart: handleOptimizedDragStart,
    handleDragMove: handleOptimizedDragMove,
    handleDragEnd: handleOptimizedDragEnd
  } = useOptimizedDrag(dragConfig);

  // 排序策略映射
  const sortingStrategy = useMemo(() => {
    switch (strategy) {
      case 'horizontal':
        return horizontalListSortingStrategy;
      case 'grid':
        return rectSortingStrategy;
      case 'vertical':
      default:
        return verticalListSortingStrategy;
    }
  }, [strategy]);

  // 碰撞检测策略
  const collisionDetectionAlgorithm = useMemo(() => {
    switch (collisionDetection) {
      case 'closest-center':
        return closestCenter;
      case 'closest-corners':
        return closestCorners;
      case 'pointer-within':
        return pointerWithin;
      default:
        return closestCenter;
    }
  }, [collisionDetection]);

  // 处理拖拽开始
  const handleDragStart = useCallback((event) => {
    handleOptimizedDragStart(event);
    onDragStart?.(event);
  }, [handleOptimizedDragStart, onDragStart]);

  // 处理拖拽移动
  const handleDragMove = useCallback((event) => {
    handleOptimizedDragMove(event);
    onDragMove?.(event);
  }, [handleOptimizedDragMove, onDragMove]);

  // 处理拖拽结束
  const handleDragEnd = useCallback((event) => {
    handleOptimizedDragEnd(event);
    onDragEnd?.(event);
  }, [handleOptimizedDragEnd, onDragEnd]);

  // 处理拖拽悬停
  const handleDragOver = useCallback((event) => {
    onDragOver?.(event);
  }, [onDragOver]);

  // 动画配置
  const animationConfig = getAnimationConfig('drag');

  // 容器样式优化
  const containerStyle = useMemo(() => ({
    ...style,
    // 启用硬件加速
    willChange: isDragging ? 'contents' : 'auto',
    // 优化渲染性能
    contain: 'layout style',
    ...style
  }), [style, isDragging]);

  // 辅助功能属性
  const accessibilityProps = useMemo(() => {
    if (!accessibility) return {};
    
    return {
      'aria-describedby': `${id}-instructions`,
      'aria-label': '可拖拽列表',
      role: 'application'
    };
  }, [accessibility, id]);

  return (
    <div
      ref={containerRef}
      className={`optimized-drag-container ${className}`}
      style={containerStyle}
      {...accessibilityProps}
    >
      <DndContext
        sensors={sensors}
        collisionDetection={collisionDetectionAlgorithm}
        onDragStart={handleDragStart}
        onDragMove={handleDragMove}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
        disabled={disabled}
        id={id}
      >
        <SortableContext items={items} strategy={sortingStrategy}>
          {children}
        </SortableContext>

        {/* 拖拽覆盖层 */}
        <DragOverlay
          adjustScale={isMobile}
          dropAnimation={{
            duration: animationConfig.duration,
            easing: animationConfig.easing,
          }}
        >
          {isDragging && draggedItem && renderDragOverlay ? 
            renderDragOverlay(draggedItem) : null
          }
        </DragOverlay>
      </DndContext>

      {/* 辅助功能说明 */}
      {accessibility && (
        <div id={`${id}-instructions`} className="sr-only">
          使用方向键移动项目，空格键拾取和放置，ESC键取消操作
        </div>
      )}
    </div>
  );
});

// 优化的可排序项目组件
export const OptimizedSortableItem = memo(({
  id,
  children,
  disabled = false,
  className = '',
  style = {},
  data,
  handle = false,
  transition = true
}) => {
  const { isMobile } = useMobileOptimization();
  const { getAnimationConfig } = useAnimationOptimization();
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition: sortableTransition,
    isDragging,
    isOver
  } = useSortable({ id, disabled, data });

  // 拖拽项目优化
  const { ref: optimizationRef, isOptimized } = useDragItemOptimization(data, isDragging);
  
  // 合并refs
  const mergedRef = useCallback((node) => {
    setNodeRef(node);
    optimizationRef.current = node;
  }, [setNodeRef, optimizationRef]);

  // 动画配置
  const animationConfig = getAnimationConfig('sort');

  // 样式计算
  const itemStyle = useMemo(() => {
    const baseStyle = {
      ...style,
      transform: CSS.Transform.toString(transform),
      transition: transition ? (sortableTransition || `transform ${animationConfig.duration}ms ${animationConfig.easing}`) : undefined,
      opacity: isDragging ? 0.5 : 1,
      zIndex: isDragging ? 1000 : 'auto',
      // 性能优化
      contain: 'layout',
      willChange: isDragging ? 'transform' : 'auto'
    };

    // 移动端特殊处理
    if (isMobile && isDragging) {
      baseStyle.transform += ' scale(1.05)';
      baseStyle.boxShadow = '0 5px 15px rgba(0, 0, 0, 0.3)';
    }

    return baseStyle;
  }, [style, transform, transition, sortableTransition, animationConfig, isDragging, isMobile]);

  // 交互属性
  const interactionProps = useMemo(() => {
    if (handle) {
      return {}; // 处理器模式下，事件由handle控制
    }
    
    return {
      ...attributes,
      ...listeners
    };
  }, [attributes, listeners, handle]);

  return (
    <div
      ref={mergedRef}
      className={`optimized-sortable-item ${className} ${isDragging ? 'dragging' : ''} ${isOver ? 'drag-over' : ''}`}
      style={itemStyle}
      {...interactionProps}
      data-id={id}
    >
      {children}
    </div>
  );
});

// 拖拽处理器组件
export const DragHandle = memo(({
  className = '',
  style = {},
  children,
  ...props
}) => {
  const { isMobile } = useMobileOptimization();
  
  const handleStyle = useMemo(() => ({
    cursor: 'grab',
    touchAction: 'none',
    minWidth: isMobile ? '44px' : '24px',
    minHeight: isMobile ? '44px' : '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    ...style
  }), [style, isMobile]);

  const {
    attributes,
    listeners,
    setActivatorNodeRef,
    transform
  } = useSortable({ ...props });

  return (
    <div
      ref={setActivatorNodeRef}
      className={`drag-handle ${className}`}
      style={handleStyle}
      {...attributes}
      {...listeners}
      aria-label="拖拽手柄"
    >
      {children || (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M3 7h2v2H3V7zm4 0h2v2H7V7zm4 0h2v2h-2V7zM3 3h2v2H3V3zm4 0h2v2H7V3zm4 0h2v2h-2V3zM3 11h2v2H3v-2zm4 0h2v2H7v-2zm4 0h2v2h-2v-2z"/>
        </svg>
      )}
    </div>
  );
});

// 拖拽指示器组件
export const DragIndicator = memo(({
  isActive = false,
  position = 'top',
  className = '',
  style = {}
}) => {
  const indicatorStyle = useMemo(() => ({
    position: 'absolute',
    left: 0,
    right: 0,
    height: '2px',
    backgroundColor: '#3b82f6',
    borderRadius: '1px',
    opacity: isActive ? 1 : 0,
    transition: 'opacity 150ms ease',
    [position]: position === 'top' ? '-1px' : '-1px',
    ...style
  }), [isActive, position, style]);

  if (!isActive) return null;

  return (
    <div
      className={`drag-indicator ${className}`}
      style={indicatorStyle}
      aria-hidden="true"
    />
  );
});

// 性能监控组件（开发环境）
export const DragPerformanceMonitor = memo(() => {
  const { metrics, startFrameMonitoring, stopFrameMonitoring } = useDragPerformanceMonitor();

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      startFrameMonitoring();
      return stopFrameMonitoring;
    }
  }, [startFrameMonitoring, stopFrameMonitoring]);

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 bg-black bg-opacity-75 text-white p-2 rounded text-xs font-mono z-50">
      <div>拖拽次数: {metrics.totalDrags}</div>
      <div>平均耗时: {metrics.averageDragTime.toFixed(2)}ms</div>
      <div>掉帧率: {(metrics.frameDrops * 100).toFixed(1)}%</div>
      <div>内存: {metrics.memoryUsage.toFixed(1)}MB</div>
    </div>
  );
});

OptimizedDragContainer.displayName = 'OptimizedDragContainer';
OptimizedSortableItem.displayName = 'OptimizedSortableItem';
DragHandle.displayName = 'DragHandle';
DragIndicator.displayName = 'DragIndicator';
DragPerformanceMonitor.displayName = 'DragPerformanceMonitor';

export default OptimizedDragContainer;