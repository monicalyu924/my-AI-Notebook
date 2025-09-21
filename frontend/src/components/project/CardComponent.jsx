import React from 'react';
import { getPriorityInfo } from '../../utils/projectApi';

function CardComponent({ card, onClick }) {
  const priorityInfo = getPriorityInfo(card.priority);
  
  const formatDueDate = (dateString) => {
    if (!dateString) return null;
    
    const dueDate = new Date(dateString);
    const now = new Date();
    const diffTime = dueDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    let dueDateClass = 'text-gray-600';
    let dueDateText = dueDate.toLocaleDateString('zh-CN', { 
      month: 'short', 
      day: 'numeric' 
    });
    
    if (diffDays < 0) {
      dueDateClass = 'text-red-600';
      dueDateText = `已逾期 ${Math.abs(diffDays)} 天`;
    } else if (diffDays === 0) {
      dueDateClass = 'text-orange-600';
      dueDateText = '今天到期';
    } else if (diffDays === 1) {
      dueDateClass = 'text-orange-600';
      dueDateText = '明天到期';
    } else if (diffDays <= 3) {
      dueDateClass = 'text-yellow-600';
      dueDateText = `${diffDays} 天后到期`;
    }
    
    return { class: dueDateClass, text: dueDateText };
  };

  const dueDateInfo = formatDueDate(card.due_date);

  return (
    <div
      onClick={onClick}
      className="trello-card p-3 cursor-pointer group transition-all duration-200 hover:scale-105"
    >
      {/* 卡片标题 */}
      <h4 className="font-medium text-gray-900 mb-2 line-clamp-2 group-hover:text-trello-600 transition-colors">
        {card.title}
      </h4>
      
      {/* 卡片描述 */}
      {card.description && (
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {card.description}
        </p>
      )}
      
      {/* 标签 */}
      {card.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {card.tags.slice(0, 3).map((tag, index) => (
            <span
              key={index}
              className="inline-flex items-center px-2 py-1 rounded-lg text-xs bg-trello-100 text-trello-800"
            >
              {tag}
            </span>
          ))}
          {card.tags.length > 3 && (
            <span className="text-xs text-gray-500 px-2 py-1">
              +{card.tags.length - 3}
            </span>
          )}
        </div>
      )}
      
      {/* 底部信息 */}
      <div className="flex items-center justify-between text-xs">
        {/* 左侧：优先级 */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <div 
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: priorityInfo.color }}
            />
            <span className="text-gray-600">{priorityInfo.label}</span>
          </div>
          
          {/* 完成状态 */}
          {card.completed && (
            <span className="inline-flex items-center px-2 py-1 rounded-lg bg-green-100 text-green-800 shadow-sm">
              ✓ 已完成
            </span>
          )}
        </div>
        
        {/* 右侧：截止日期 */}
        {dueDateInfo && (
          <div className={`flex items-center gap-1 ${dueDateInfo.class}`}>
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>{dueDateInfo.text}</span>
          </div>
        )}
      </div>
      
      {/* 指派人 */}
      {card.assignee && (
        <div className="mt-2 pt-2 border-t border-gray-50">
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span>指派给: {card.assignee}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default CardComponent;