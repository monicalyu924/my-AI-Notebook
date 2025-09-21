import React from 'react';

// 基础骨架屏组件
export const Skeleton = ({ 
  width = '100%', 
  height = '1rem', 
  className = '', 
  rounded = 'rounded',
  animate = true 
}) => {
  const animationClass = animate ? 'animate-pulse' : '';
  
  return (
    <div
      className={`bg-gray-200 ${rounded} ${animationClass} ${className}`}
      style={{ width, height }}
    />
  );
};

// 骨架屏文本行
export const SkeletonText = ({ lines = 3, className = '' }) => {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          height="0.875rem"
          width={index === lines - 1 ? '75%' : '100%'}
          className="rounded"
        />
      ))}
    </div>
  );
};

// 骨架屏头像
export const SkeletonAvatar = ({ size = 'w-10 h-10', className = '' }) => {
  return (
    <Skeleton
      className={`${size} rounded-full ${className}`}
    />
  );
};

// 骨架屏按钮
export const SkeletonButton = ({ width = '120px', height = '40px', className = '' }) => {
  return (
    <Skeleton
      width={width}
      height={height}
      className={`rounded-md ${className}`}
    />
  );
};

// 笔记列表骨架屏
export const NoteListSkeleton = ({ count = 5 }) => {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-start space-x-3">
            <SkeletonAvatar size="w-8 h-8" />
            <div className="flex-1 space-y-2">
              <Skeleton height="1.25rem" width="70%" />
              <SkeletonText lines={2} />
              <div className="flex items-center space-x-4 mt-3">
                <Skeleton height="0.75rem" width="80px" />
                <Skeleton height="0.75rem" width="60px" />
                <Skeleton height="0.75rem" width="100px" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// 文件夹树骨架屏
export const FolderTreeSkeleton = ({ depth = 3 }) => {
  return (
    <div className="space-y-2 p-4">
      {Array.from({ length: depth }).map((_, index) => (
        <div key={index} className="space-y-2">
          <div className="flex items-center space-x-2">
            <Skeleton width="16px" height="16px" className="rounded" />
            <Skeleton height="1rem" width={`${60 + Math.random() * 40}%`} />
          </div>
          {index < depth - 1 && (
            <div className="ml-6 space-y-1">
              {Array.from({ length: 2 }).map((_, subIndex) => (
                <div key={subIndex} className="flex items-center space-x-2">
                  <Skeleton width="16px" height="16px" className="rounded" />
                  <Skeleton height="0.875rem" width={`${40 + Math.random() * 30}%`} />
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

// 编辑器骨架屏
export const EditorSkeleton = () => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      {/* 工具栏 */}
      <div className="flex items-center space-x-2 pb-4 border-b border-gray-200 mb-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <SkeletonButton
            key={index}
            width="36px"
            height="36px"
            className="rounded"
          />
        ))}
      </div>
      
      {/* 标题 */}
      <Skeleton height="2rem" width="60%" className="mb-4" />
      
      {/* 内容 */}
      <div className="space-y-3">
        <SkeletonText lines={8} />
        <div className="space-y-2">
          <Skeleton height="0.875rem" width="85%" />
          <Skeleton height="0.875rem" width="92%" />
          <Skeleton height="0.875rem" width="70%" />
        </div>
      </div>
    </div>
  );
};

// 看板骨架屏
export const KanbanSkeleton = () => {
  return (
    <div className="flex space-x-6 p-6 overflow-x-auto">
      {Array.from({ length: 3 }).map((_, columnIndex) => (
        <div key={columnIndex} className="bg-gray-100 rounded-lg p-4 min-w-80">
          {/* 列标题 */}
          <div className="flex items-center justify-between mb-4">
            <Skeleton height="1.5rem" width="60%" />
            <SkeletonButton width="24px" height="24px" />
          </div>
          
          {/* 卡片 */}
          <div className="space-y-3">
            {Array.from({ length: 3 + columnIndex }).map((_, cardIndex) => (
              <div key={cardIndex} className="bg-white rounded-md p-3 shadow-sm">
                <Skeleton height="1.25rem" width="80%" className="mb-2" />
                <SkeletonText lines={2} />
                <div className="flex items-center justify-between mt-3">
                  <div className="flex space-x-1">
                    {Array.from({ length: 2 }).map((_, tagIndex) => (
                      <Skeleton
                        key={tagIndex}
                        height="1.25rem"
                        width="40px"
                        className="rounded-full"
                      />
                    ))}
                  </div>
                  <SkeletonAvatar size="w-6 h-6" />
                </div>
              </div>
            ))}
          </div>
          
          {/* 添加卡片按钮 */}
          <SkeletonButton
            width="100%"
            height="40px"
            className="mt-3 rounded-md"
          />
        </div>
      ))}
    </div>
  );
};

// 聊天骨架屏
export const ChatSkeleton = () => {
  return (
    <div className="space-y-4 p-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className={`flex ${index % 2 === 0 ? 'justify-start' : 'justify-end'}`}
        >
          <div
            className={`max-w-xs p-3 rounded-lg ${
              index % 2 === 0 ? 'bg-gray-100' : 'bg-blue-100'
            }`}
          >
            <SkeletonText lines={Math.floor(Math.random() * 3) + 1} />
            <Skeleton height="0.75rem" width="60px" className="mt-2" />
          </div>
        </div>
      ))}
    </div>
  );
};

// 统计卡片骨架屏
export const StatCardSkeleton = ({ count = 4 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton height="0.875rem" width="80px" />
              <Skeleton height="2rem" width="60px" />
            </div>
            <Skeleton width="48px" height="48px" className="rounded-lg" />
          </div>
          <div className="mt-4">
            <Skeleton height="0.75rem" width="70%" />
          </div>
        </div>
      ))}
    </div>
  );
};

// 表格骨架屏
export const TableSkeleton = ({ rows = 5, columns = 4 }) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* 表头 */}
      <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
        <div className="flex space-x-4">
          {Array.from({ length: columns }).map((_, index) => (
            <Skeleton
              key={index}
              height="1rem"
              width={`${80 + Math.random() * 40}px`}
            />
          ))}
        </div>
      </div>
      
      {/* 表格行 */}
      <div className="divide-y divide-gray-200">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="px-6 py-4">
            <div className="flex space-x-4">
              {Array.from({ length: columns }).map((_, colIndex) => (
                <Skeleton
                  key={colIndex}
                  height="0.875rem"
                  width={
                    colIndex === 0
                      ? '120px'
                      : colIndex === columns - 1
                      ? '80px'
                      : `${60 + Math.random() * 60}px`
                  }
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// 组合型骨架屏 - 主应用布局
export const MainAppSkeleton = () => {
  return (
    <div className="h-screen flex bg-gray-50">
      {/* 侧边栏骨架屏 */}
      <div className="w-64 bg-white border-r border-gray-200 p-4">
        <Skeleton height="2rem" width="60%" className="mb-6" />
        <FolderTreeSkeleton />
      </div>
      
      {/* 主内容区骨架屏 */}
      <div className="flex-1 flex flex-col">
        {/* 头部 */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <Skeleton height="1.5rem" width="200px" />
            <div className="flex space-x-2">
              <SkeletonButton width="100px" height="36px" />
              <SkeletonButton width="80px" height="36px" />
            </div>
          </div>
        </div>
        
        {/* 内容区 */}
        <div className="flex-1 p-6">
          <NoteListSkeleton count={3} />
        </div>
      </div>
    </div>
  );
};

// 导出默认骨架屏
export default Skeleton;