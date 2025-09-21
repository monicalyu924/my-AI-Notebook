import React, { memo, useMemo } from 'react';

const StatCard = memo(({ icon, title, value, color, bgColor }) => (
  <div className="bg-white/95 backdrop-blur-sm p-3 sm:p-4 rounded-xl shadow-lg border border-white/30 hover:scale-105 transition-all duration-200 trello-slide-in">
    <div className="flex items-center">
      <div className="flex-shrink-0">
        <svg className={`h-6 w-6 sm:h-8 sm:w-8 ${color}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          {icon}
        </svg>
      </div>
      <div className="ml-3">
        <p className="text-xs sm:text-sm font-medium text-gray-900">{title}</p>
        <p className={`text-lg sm:text-2xl font-semibold ${color}`}>
          {value}
        </p>
      </div>
    </div>
  </div>
));

StatCard.displayName = 'StatCard';

const BoardStats = memo(({ lists }) => {
  const stats = useMemo(() => {
    let totalTasks = 0;
    let completedTasks = 0;
    let inProgressTasks = 0;
    let highPriorityTasks = 0;

    lists.forEach(list => {
      const cards = list.cards || [];
      totalTasks += cards.length;
      
      cards.forEach(card => {
        if (card.completed) {
          completedTasks++;
        } else {
          inProgressTasks++;
        }
        
        if (card.priority === 'urgent' || card.priority === 'high') {
          highPriorityTasks++;
        }
      });
    });

    return {
      totalTasks,
      completedTasks,
      inProgressTasks,
      highPriorityTasks
    };
  }, [lists]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
      <StatCard
        icon={
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        }
        title="总任务"
        value={stats.totalTasks}
        color="text-blue-600"
      />
      
      <StatCard
        icon={
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        }
        title="已完成"
        value={stats.completedTasks}
        color="text-green-600"
      />
      
      <StatCard
        icon={
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        }
        title="进行中"
        value={stats.inProgressTasks}
        color="text-orange-600"
      />
      
      <StatCard
        icon={
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        }
        title="高优先级"
        value={stats.highPriorityTasks}
        color="text-red-600"
      />
    </div>
  );
});

BoardStats.displayName = 'BoardStats';

export default BoardStats;