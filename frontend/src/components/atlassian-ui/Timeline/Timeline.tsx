import React, { forwardRef, useState } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';

// 时间轴任务状态
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'blocked';

// 时间轴数据类型
export interface TimelineTask {
  id: string;
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  status: TaskStatus;
  progress?: number; // 0-100
  assignee?: {
    name: string;
    avatar?: string;
  };
  dependencies?: string[]; // 依赖的任务ID
}

// 任务条样式变体
const taskBarVariants = cva(
  [
    'h-6 rounded-sm flex items-center justify-between px-2',
    'text-xs font-medium text-white',
    'cursor-pointer transition-all duration-200',
    'hover:shadow-md',
  ],
  {
    variants: {
      status: {
        pending: 'bg-gray-400 hover:bg-gray-500',
        in_progress: 'bg-blue-500 hover:bg-blue-600',
        completed: 'bg-green-500 hover:bg-green-600',
        blocked: 'bg-red-500 hover:bg-red-600',
      },
    },
    defaultVariants: {
      status: 'pending',
    },
  }
);

// 状态指示器组件
const StatusIndicator: React.FC<{ status: TaskStatus; onClick?: () => void }> = ({ 
  status, 
  onClick 
}) => {
  const statusConfig = {
    pending: { color: 'bg-gray-400', label: '待开始' },
    in_progress: { color: 'bg-blue-500', label: '进行中' },
    completed: { color: 'bg-green-500', label: '已完成' },
    blocked: { color: 'bg-red-500', label: '已阻塞' },
  };

  const config = statusConfig[status];

  return (
    <motion.div
      className={clsx(
        'w-3 h-3 rounded-full border-2 border-white shadow-sm cursor-pointer',
        config.color
      )}
      onClick={onClick}
      whileHover={{ scale: 1.2 }}
      whileTap={{ scale: 0.9 }}
      title={config.label}
    />
  );
};

// 任务条组件
interface TaskBarProps {
  task: TimelineTask;
  startDate: Date;
  endDate: Date;
  dayWidth: number;
  onTaskClick?: (task: TimelineTask) => void;
  onStatusChange?: (taskId: string, status: TaskStatus) => void;
}

const TaskBar: React.FC<TaskBarProps> = ({
  task,
  startDate,
  endDate,
  dayWidth,
  onTaskClick,
  onStatusChange,
}) => {
  // 计算任务条的位置和宽度
  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const taskStartDays = Math.ceil((task.startDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const taskDuration = Math.ceil((task.endDate.getTime() - task.startDate.getTime()) / (1000 * 60 * 60 * 24));
  
  const left = Math.max(0, taskStartDays * dayWidth);
  const width = Math.max(dayWidth * 0.5, taskDuration * dayWidth);

  const handleStatusCycle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onStatusChange) {
      const statusCycle: TaskStatus[] = ['pending', 'in_progress', 'completed'];
      const currentIndex = statusCycle.indexOf(task.status);
      const nextStatus = statusCycle[(currentIndex + 1) % statusCycle.length];
      onStatusChange(task.id, nextStatus);
    }
  };

  return (
    <div 
      className="absolute flex items-center"
      style={{ left: `${left}px`, width: `${width}px` }}
    >
      {/* 状态指示器 */}
      <StatusIndicator 
        status={task.status} 
        onClick={handleStatusCycle}
      />
      
      {/* 任务条 */}
      <motion.div
        className={clsx(taskBarVariants({ status: task.status }), 'ml-2 flex-1')}
        onClick={() => onTaskClick?.(task)}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <span className="truncate">{task.title}</span>
        {task.progress !== undefined && (
          <span className="text-xs opacity-80">{task.progress}%</span>
        )}
      </motion.div>

      {/* 进度条覆盖层 */}
      {task.progress !== undefined && task.status === 'in_progress' && (
        <div 
          className="absolute left-6 top-0 h-6 bg-blue-300 opacity-50 rounded-sm"
          style={{ width: `${(width - 24) * (task.progress / 100)}px` }}
        />
      )}
    </div>
  );
};

// 时间轴头部组件
interface TimelineHeaderProps {
  startDate: Date;
  endDate: Date;
  dayWidth: number;
  viewMode: 'day' | 'week' | 'month';
}

const TimelineHeader: React.FC<TimelineHeaderProps> = ({ 
  startDate, 
  endDate, 
  dayWidth,
  viewMode 
}) => {
  const generateTimeLabels = () => {
    const labels = [];
    const current = new Date(startDate);
    
    while (current <= endDate) {
      labels.push(new Date(current));
      current.setDate(current.getDate() + (viewMode === 'day' ? 1 : viewMode === 'week' ? 7 : 30));
    }
    
    return labels;
  };

  const timeLabels = generateTimeLabels();

  return (
    <div className="flex items-center h-12 border-b border-gray-200 bg-gray-50">
      {/* 任务列表头部 */}
      <div className="w-80 px-4 font-medium text-gray-700 border-r border-gray-200">
        任务
      </div>
      
      {/* 时间刻度 */}
      <div className="flex-1 flex">
        {timeLabels.map((date, index) => (
          <div
            key={index}
            className="border-r border-gray-200 px-2 py-2 text-xs text-gray-600 text-center"
            style={{ minWidth: `${dayWidth * (viewMode === 'day' ? 1 : viewMode === 'week' ? 7 : 30)}px` }}
          >
            {date.toLocaleDateString('zh-CN', {
              month: 'short',
              day: 'numeric',
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

// 主要时间轴组件
export interface TimelineProps extends React.HTMLAttributes<HTMLDivElement> {
  tasks: TimelineTask[];
  startDate?: Date;
  endDate?: Date;
  dayWidth?: number;
  viewMode?: 'day' | 'week' | 'month';
  onTaskClick?: (task: TimelineTask) => void;
  onStatusChange?: (taskId: string, status: TaskStatus) => void;
}

export const Timeline = forwardRef<HTMLDivElement, TimelineProps>(
  ({
    className,
    tasks = [],
    startDate,
    endDate,
    dayWidth = 40,
    viewMode = 'day',
    onTaskClick,
    onStatusChange,
    ...props
  }, ref) => {
    // 自动计算时间范围
    const autoStartDate = tasks.length > 0 
      ? new Date(Math.min(...tasks.map(t => t.startDate.getTime())))
      : new Date();
    const autoEndDate = tasks.length > 0
      ? new Date(Math.max(...tasks.map(t => t.endDate.getTime())))
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const timelineStart = startDate || autoStartDate;
    const timelineEnd = endDate || autoEndDate;

    return (
      <div
        ref={ref}
        className={clsx('bg-white border border-gray-200 rounded-md overflow-hidden', className)}
        {...props}
      >
        {/* 时间轴头部 */}
        <TimelineHeader
          startDate={timelineStart}
          endDate={timelineEnd}
          dayWidth={dayWidth}
          viewMode={viewMode}
        />

        {/* 任务列表 */}
        <div className="max-h-96 overflow-y-auto">
          {tasks.map((task, index) => (
            <div
              key={task.id}
              className={clsx(
                'flex items-center h-12 border-b border-gray-100',
                index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
              )}
            >
              {/* 任务信息 */}
              <div className="w-80 px-4 border-r border-gray-200">
                <div className="flex items-center space-x-2">
                  <StatusIndicator 
                    status={task.status}
                    onClick={() => onStatusChange?.(task.id, task.status)}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {task.title}
                    </p>
                    {task.assignee && (
                      <p className="text-xs text-gray-500 truncate">
                        {task.assignee.name}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* 时间轴区域 */}
              <div className="flex-1 relative h-12 px-2">
                <TaskBar
                  task={task}
                  startDate={timelineStart}
                  endDate={timelineEnd}
                  dayWidth={dayWidth}
                  onTaskClick={onTaskClick}
                  onStatusChange={onStatusChange}
                />
              </div>
            </div>
          ))}

          {tasks.length === 0 && (
            <div className="flex items-center justify-center h-32 text-gray-500">
              暂无任务数据
            </div>
          )}
        </div>
      </div>
    );
  }
);

Timeline.displayName = 'Timeline';

export type TimelineViewMode = 'day' | 'week' | 'month';