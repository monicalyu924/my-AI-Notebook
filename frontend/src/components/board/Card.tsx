import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Calendar, User, Clock, Edit3, Trash2, MoreHorizontal } from 'lucide-react';
import { useProjectBoardStore } from '../../store/projectBoardStore';

interface CardData {
  id: string;
  title: string;
  description?: string;
  labels?: string[];
  dueDate?: string;
  assignees?: string[];
}

interface CardProps {
  card: CardData;
  listId: string;
  isDragging?: boolean;
  isMobile?: boolean;
  isTablet?: boolean;
}

const Card: React.FC<CardProps> = ({ card, listId, isDragging = false, isMobile = false, isTablet = false }) => {
  const { currentBoard, updateCard, deleteCard } = useProjectBoardStore();
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(card.title);
  const [showMenu, setShowMenu] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({
    id: card.id,
    data: {
      type: 'Card',
      card,
    },
  });

  // 拖拽手柄专用属性和监听器
  const dragHandleProps = {
    ...attributes,
    ...listeners,
  };

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const labelColors: { [key: string]: string } = {
    '高优先级': 'bg-red-100 text-red-800 border-red-200',
    '设计': 'bg-purple-100 text-purple-800 border-purple-200',
    '开发': 'bg-blue-100 text-blue-800 border-blue-200',
    '文档': 'bg-green-100 text-green-800 border-green-200',
    '设置': 'bg-gray-100 text-gray-800 border-gray-200',
    '核心功能': 'bg-orange-100 text-orange-800 border-orange-200',
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return '今天';
    if (diffDays === 1) return '明天';
    if (diffDays === -1) return '昨天';
    if (diffDays > 0) return `${diffDays}天后`;
    return `${Math.abs(diffDays)}天前`;
  };

  const isOverdue = card.dueDate ? new Date(card.dueDate) < new Date() : false;

  const handleTitleSubmit = () => {
    if (editedTitle.trim() && editedTitle !== card.title && currentBoard) {
      updateCard(currentBoard.id, listId, card.id, { title: editedTitle.trim() });
    }
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (currentBoard && window.confirm('确定要删除这张卡片吗？')) {
      deleteCard(currentBoard.id, listId, card.id);
    }
    setShowMenu(false);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white rounded-lg shadow-sm border border-gray-200 cursor-pointer transition-all duration-200 hover:shadow-md group ${
        isDragging || isSortableDragging ? 'opacity-50 rotate-2' : 'hover:scale-[1.02]'
      } ${
        isMobile ? 'p-3' : 'p-4'
      }`}
    >
      {/* Drag Handle - 只在移动端显示，避免点击冲突 */}
      {isMobile && (
        <div 
          className="absolute left-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity cursor-move z-10"
          {...dragHandleProps}
        >
          <div className="w-4 h-4 bg-gray-300 rounded flex items-center justify-center">
            <div className="w-2 h-2 bg-gray-600 rounded-sm"></div>
          </div>
        </div>
      )}
      
      {/* Card Content - 拖拽区域或普通区域 */}
      <div className={isMobile ? '' : 'cursor-pointer'} {...(!isMobile ? dragHandleProps : {})}>
        {/* Card Menu */}
        <div className={`absolute right-2 opacity-0 group-hover:opacity-100 transition-opacity ${
          isMobile ? 'top-1' : 'top-2'
        }`}>
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className={`hover:bg-gray-100 rounded transition-colors ${
                isMobile ? 'p-1.5' : 'p-1'
              }`}
            >
              <MoreHorizontal className={`text-gray-500 ${
                isMobile ? 'w-3.5 h-3.5' : 'w-4 h-4'
              }`} />
            </button>
            
            {showMenu && (
              <div className="absolute right-0 top-8 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 min-w-[120px]">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsEditing(true);
                    setShowMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>编辑</span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete();
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>删除</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Labels */}
        {card.labels && card.labels.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {card.labels.map((label, index) => (
              <span
                key={index}
                className={`px-2 py-1 text-xs font-medium rounded-full border ${
                  labelColors[label] || 'bg-gray-100 text-gray-800 border-gray-200'
                }`}
              >
                {label}
              </span>
            ))}
          </div>
        )}

        {/* Title */}
        <div className="mb-3">
          {isEditing ? (
            <textarea
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              onBlur={handleTitleSubmit}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleTitleSubmit();
                }
                if (e.key === 'Escape') {
                  setEditedTitle(card.title);
                  setIsEditing(false);
                }
              }}
              className="w-full font-medium text-gray-800 bg-transparent border-b border-blue-500 focus:outline-none focus:border-blue-600 resize-none"
              rows={2}
              autoFocus
            />
          ) : (
            <h4 className="font-medium text-gray-800 leading-tight group-hover:text-blue-600 transition-colors"
                 onClick={(e) => {
                   e.stopPropagation();
                   setIsEditing(true);
                 }}
            >
              {card.title}
            </h4>
          )}
        </div>

        {/* Description */}
        {card.description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-3">
            {card.description}
          </p>
        )}

        {/* Card Footer */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center space-x-4">
            {/* Due Date */}
            {card.dueDate && (
              <div className={`flex items-center space-x-1 ${
                isOverdue ? 'text-red-600 bg-red-50 px-2 py-1 rounded' : ''
              }`}>
                <Calendar className="w-3 h-3" />
                <span>{formatDate(card.dueDate)}</span>
              </div>
            )}

            {/* Assignees */}
            {card.assignees && card.assignees.length > 0 && (
              <div className="flex items-center space-x-1">
                <User className="w-3 h-3" />
                <span>{card.assignees.length}</span>
              </div>
            )}
          </div>

          {/* Additional metadata */}
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1">
              <Clock className="w-3 h-3" />
              <span>{/* TODO: Add last modified time */}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Card;