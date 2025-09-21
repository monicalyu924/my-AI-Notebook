import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { 
  Plus, 
  MoreHorizontal, 
  Calendar, 
  User, 
  CheckCircle2,
  Clock,
  AlertCircle,
  Star
} from 'lucide-react';

// Kanban 列组件
const KanbanColumn = ({ 
  column, 
  cards, 
  onCardClick, 
  onAddCard,
  onCardDrop,
  isDragOver,
  onDragOver,
  onDragLeave 
}) => {
  const getColumnStyles = (type) => {
    const styles = {
      'project-resources': 'bg-blue-50 border-blue-200',
      'questions': 'bg-cyan-50 border-cyan-200', 
      'todo': 'bg-yellow-50 border-yellow-200',
      'pending': 'bg-purple-50 border-purple-200',
      'blocked': 'bg-red-50 border-red-200',
      'done': 'bg-green-50 border-green-200',
    };
    return styles[type] || 'bg-gray-50 border-gray-200';
  };

  return (
    <motion.div
      className={clsx(
        'flex flex-col w-80 max-h-full bg-white rounded-xl border-2 transition-all duration-200',
        isDragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-200',
        'shadow-sm hover:shadow-md'
      )}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onCardDrop}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* 列头部 */}
      <div className={clsx(
        'p-4 border-b border-gray-200 rounded-t-xl',
        getColumnStyles(column.type)
      )}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-gray-900 text-sm">
            {column.title}
          </h3>
          <div className="flex items-center space-x-2">
            <span className="bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded-full">
              {cards.length}
            </span>
            <button className="p-1 hover:bg-gray-200 rounded transition-colors">
              <MoreHorizontal className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>
        
        {column.description && (
          <p className="text-xs text-gray-600 mb-3">
            {column.description}
          </p>
        )}

        {/* 进度条 */}
        {column.progress !== undefined && (
          <div className="w-full bg-gray-200 rounded-full h-1 mb-3">
            <div 
              className={clsx(
                'h-1 rounded-full transition-all duration-300',
                column.type === 'done' ? 'bg-green-500' : 'bg-blue-500'
              )}
              style={{ width: `${column.progress}%` }}
            />
          </div>
        )}
      </div>

      {/* 卡片列表 */}
      <div className="flex-1 p-3 space-y-3 overflow-y-auto">
        <AnimatePresence>
          {cards.map((card, index) => (
            <KanbanCard
              key={card.id}
              card={card}
              index={index}
              onClick={() => onCardClick(card)}
            />
          ))}
        </AnimatePresence>

        {/* 添加卡片按钮 */}
        <motion.button
          onClick={() => onAddCard(column.id)}
          className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors text-gray-600 hover:text-blue-600 text-sm"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Plus className="w-4 h-4 mx-auto mb-1" />
          Add a card
        </motion.button>
      </div>
    </motion.div>
  );
};

// Kanban 卡片组件
const KanbanCard = ({ card, index, onClick }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragStart = (e) => {
    setIsDragging(true);
    e.dataTransfer.setData('text/plain', card.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const getCardTypeStyles = (type) => {
    const styles = {
      'tip': 'border-l-4 border-l-blue-500',
      'task': 'border-l-4 border-l-green-500',
      'question': 'border-l-4 border-l-yellow-500',
      'blocked': 'border-l-4 border-l-red-500',
      'done': 'border-l-4 border-l-gray-500',
    };
    return styles[type] || '';
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'high':
        return <AlertCircle className="w-3 h-3 text-red-500" />;
      case 'medium':
        return <Clock className="w-3 h-3 text-yellow-500" />;
      case 'low':
        return <CheckCircle2 className="w-3 h-3 text-green-500" />;
      default:
        return null;
    }
  };

  return (
    <motion.div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={onClick}
      className={clsx(
        'bg-white rounded-lg border border-gray-200 p-3 cursor-pointer transition-all duration-200',
        'hover:shadow-md hover:border-gray-300',
        isDragging && 'opacity-50 transform rotate-2',
        getCardTypeStyles(card.type)
      )}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.2, delay: index * 0.05 }}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* 卡片头部 */}
      {card.tip && (
        <div className="flex items-start space-x-2 mb-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
          <p className="text-xs text-blue-600 font-medium">
            Trello Tip: {card.tip}
          </p>
        </div>
      )}

      {/* 主要内容 */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-gray-900 line-clamp-2">
          {card.title}
        </h4>

        {card.description && (
          <p className="text-xs text-gray-600 line-clamp-2">
            {card.description}
          </p>
        )}

        {/* 图片 */}
        {card.image && (
          <img 
            src={card.image} 
            alt={card.title}
            className="w-full h-24 object-cover rounded-md"
          />
        )}

        {/* 进度条 */}
        {card.progress !== undefined && (
          <div className="w-full bg-gray-200 rounded-full h-1">
            <div 
              className="bg-green-500 h-1 rounded-full transition-all duration-300"
              style={{ width: `${card.progress}%` }}
            />
          </div>
        )}
      </div>

      {/* 卡片底部 */}
      <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100">
        <div className="flex items-center space-x-2">
          {/* 优先级 */}
          {card.priority && getPriorityIcon(card.priority)}
          
          {/* 日期 */}
          {card.dueDate && (
            <div className="flex items-center space-x-1">
              <Calendar className="w-3 h-3 text-gray-400" />
              <span className="text-xs text-gray-500">
                {new Date(card.dueDate).toLocaleDateString('zh-CN')}
              </span>
            </div>
          )}

          {/* 标签 */}
          {card.labels && card.labels.map(label => (
            <span 
              key={label.id}
              className={clsx(
                'px-2 py-0.5 rounded-full text-xs font-medium',
                `bg-${label.color}-100 text-${label.color}-700`
              )}
            >
              {label.name}
            </span>
          ))}
        </div>

        <div className="flex items-center space-x-2">
          {/* 负责人 */}
          {card.assignee && (
            <div className="flex items-center space-x-1">
              <User className="w-3 h-3 text-gray-400" />
              <span className="text-xs text-gray-500">
                {card.assignee.name}
              </span>
            </div>
          )}

          {/* 收藏 */}
          {card.starred && (
            <Star className="w-3 h-3 text-yellow-500 fill-current" />
          )}
        </div>
      </div>
    </motion.div>
  );
};

// 主 Kanban 组件
const Kanban = ({ 
  columns = [], 
  cards = [], 
  onCardClick,
  onAddCard,
  onCardMove,
  className 
}) => {
  const [dragOverColumn, setDragOverColumn] = useState(null);

  const handleDragOver = (e, columnId) => {
    e.preventDefault();
    setDragOverColumn(columnId);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = (e, columnId) => {
    e.preventDefault();
    setDragOverColumn(null);
    
    const cardId = e.dataTransfer.getData('text/plain');
    if (onCardMove) {
      onCardMove(cardId, columnId);
    }
  };

  const getColumnCards = (columnId) => {
    return cards.filter(card => card.columnId === columnId);
  };

  return (
    <div className={clsx('flex space-x-4 p-6 min-h-screen overflow-x-auto', className)}>
      {columns.map(column => (
        <KanbanColumn
          key={column.id}
          column={column}
          cards={getColumnCards(column.id)}
          onCardClick={onCardClick}
          onAddCard={onAddCard}
          onCardDrop={(e) => handleDrop(e, column.id)}
          isDragOver={dragOverColumn === column.id}
          onDragOver={(e) => handleDragOver(e, column.id)}
          onDragLeave={handleDragLeave}
        />
      ))}
    </div>
  );
};

export { Kanban, KanbanColumn, KanbanCard };
export default Kanban;