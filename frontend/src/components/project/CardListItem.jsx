import React, { memo, useMemo } from 'react';

const StatusIndicator = memo(({ card }) => {
  const statusConfig = useMemo(() => {
    if (card.completed) return 'bg-green-500';
    
    switch (card.priority) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      default: return 'bg-gray-400';
    }
  }, [card.completed, card.priority]);

  return <div className={`w-3 h-3 rounded-full mt-2 flex-shrink-0 ${statusConfig}`} />;
});

StatusIndicator.displayName = 'StatusIndicator';

const PriorityBadge = memo(({ priority }) => {
  const badgeConfig = useMemo(() => {
    switch (priority) {
      case 'urgent': 
        return { 
          className: 'bg-red-100 text-red-800 ring-1 ring-red-200',
          text: '🔥 紧急'
        };
      case 'high':
        return {
          className: 'bg-orange-100 text-orange-800 ring-1 ring-orange-200',
          text: '⚠️ 高'
        };
      case 'medium':
        return {
          className: 'bg-yellow-100 text-yellow-800 ring-1 ring-yellow-200',
          text: '🟡 中'
        };
      default:
        return {
          className: 'bg-green-100 text-green-800 ring-1 ring-green-200',
          text: '🟢 低'
        };
    }
  }, [priority]);

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${badgeConfig.className}`}>
      {badgeConfig.text}
    </span>
  );
});

PriorityBadge.displayName = 'PriorityBadge';

const TagList = memo(({ tags }) => {
  if (!tags || tags.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {tags.slice(0, 3).map((tag, index) => (
        <span key={index} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-indigo-100 text-indigo-800">
          #{tag}
        </span>
      ))}
      {tags.length > 3 && (
        <span className="text-xs text-gray-500 px-2 py-1 bg-gray-100 rounded-md font-medium">
          +{tags.length - 3} 更多
        </span>
      )}
    </div>
  );
});

TagList.displayName = 'TagList';

const CardListItem = memo(({ card, onCardClick }) => {
  const handleClick = () => {
    onCardClick(card);
  };

  const formattedDate = useMemo(() => {
    if (!card.due_date) return null;
    return new Date(card.due_date).toLocaleDateString('zh-CN');
  }, [card.due_date]);

  return (
    <div
      onClick={handleClick}
      className="group flex items-start justify-between p-4 sm:p-5 bg-gray-50 rounded-lg sm:rounded-xl hover:bg-gray-100 hover:shadow-md cursor-pointer transition-all duration-200 border border-transparent hover:border-blue-200"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-3">
          <StatusIndicator card={card} />
          
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-gray-900 text-lg group-hover:text-blue-700 transition-colors">
              {card.title}
            </h4>
            {card.description && (
              <p className="text-sm text-gray-600 mt-2 line-clamp-2 leading-relaxed">
                {card.description}
              </p>
            )}
            
            <div className="flex flex-wrap items-center gap-3 mt-3">
              <PriorityBadge priority={card.priority} />
              
              {formattedDate && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  📅 {formattedDate}
                </span>
              )}
              
              {card.assignee && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  👤 {card.assignee}
                </span>
              )}
              
              <TagList tags={card.tags} />
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-3 ml-4">
        {card.completed && (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800">
            ✓ 已完成
          </span>
        )}
        <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </div>
  );
});

CardListItem.displayName = 'CardListItem';

export default CardListItem;