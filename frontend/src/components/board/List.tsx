import React, { useState } from 'react';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Card from './Card';
import SmartCardSuggestions from '../project/SmartCardSuggestions';
import { Plus, MoreHorizontal, Trash2, Edit3, Sparkles } from 'lucide-react';
import { useProjectBoardStore } from '../../store/projectBoardStore';
import { CardData, ListData } from './index';

interface ListProps {
  list: ListData;
  searchTerm?: string;
  isMobile?: boolean;
  isTablet?: boolean;
}

const List: React.FC<ListProps> = ({ list, searchTerm = '', isMobile = false, isTablet = false }) => {
  const { 
    currentBoard, 
    createCard, 
    updateList, 
    deleteList 
  } = useProjectBoardStore();
  
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [title, setTitle] = useState(list.title);
  const [showMenu, setShowMenu] = useState(false);
  const [showSmartSuggestions, setShowSmartSuggestions] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: list.id,
    data: {
      type: 'List',
      list,
    },
    // 移动端优化 - 只在标题区域拖拽
    disabled: isMobile,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleAddCard = () => {
    console.log('处理添加卡片，标题:', newCardTitle);
    if (newCardTitle.trim() && currentBoard) {
      console.log('条件满足，创建卡片:', newCardTitle.trim());
      createCard(currentBoard.id, list.id, newCardTitle.trim());
      setNewCardTitle('');
      setIsAddingCard(false);
    } else {
      console.log('条件不满足，无法创建卡片');
    }
  };

  const handleTitleSubmit = () => {
    if (title.trim() && title !== list.title && currentBoard) {
      updateList(currentBoard.id, list.id, { title: title.trim() });
    }
    setIsEditingTitle(false);
  };

  const handleDeleteList = () => {
    if (currentBoard && window.confirm('确定要删除这个列表吗？所有卡片也将被删除。')) {
      deleteList(currentBoard.id, list.id);
    }
    setShowMenu(false);
  };

  const labelColors: { [key: string]: string } = {
    '高优先级': 'bg-red-100 text-red-800 border-red-200',
    '设计': 'bg-purple-100 text-purple-800 border-purple-200',
    '开发': 'bg-blue-100 text-blue-800 border-blue-200',
    '文档': 'bg-green-100 text-green-800 border-green-200',
    '设置': 'bg-gray-100 text-gray-800 border-gray-200',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        flex-shrink-0 bg-white bg-opacity-90 rounded-lg shadow-sm border border-gray-200 ${
          isDragging ? 'opacity-50' : ''
        }
        ${isMobile ? 'w-80' : isTablet ? 'w-76' : 'w-80'}
      `}
    >
      {/* List Header */}
      <div className={`border-b border-gray-100 ${
        isMobile ? 'p-3' : 'p-4'
      }`}>
        <div className="flex items-center justify-between group">
          {isEditingTitle ? (
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleTitleSubmit}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleTitleSubmit();
                }
                if (e.key === 'Escape') {
                  setTitle(list.title);
                  setIsEditingTitle(false);
                }
              }}
              className={`font-semibold text-gray-800 bg-transparent border-b border-blue-500 focus:outline-none focus:border-blue-600 flex-1 ${
                isMobile ? 'text-sm' : ''
              }`}
              autoFocus
            />
          ) : (
            <h3
              className={`font-semibold text-gray-800 cursor-pointer hover:text-blue-600 flex-1 ${
                isMobile ? 'text-sm' : ''
              }`}
              onClick={() => setIsEditingTitle(true)}
              // 移动端只在标题区域拖拽，避免整个列表干扰点击
              {...(isMobile ? {} : {...attributes, ...listeners})}
            >
              {list.title}
            </h3>
          )}
          
          <div className="relative">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className={`opacity-0 group-hover:opacity-100 hover:bg-gray-100 rounded transition-all ${
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
                    setIsEditingTitle(true);
                    setShowMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>重命名</span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteList();
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
        
        <div className="flex items-center space-x-2 mt-2">
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
            {list.cards.length} 张卡片
          </span>
        </div>
      </div>

      {/* Cards */}
      <div className={`min-h-[100px] vertical-scroll ${
        isMobile ? 'p-3 space-y-2' : 'p-4 space-y-3'
      }`}>
        <SortableContext 
          items={list.cards.map(card => card.id)}
          strategy={verticalListSortingStrategy}
        >
          {list.cards
            .filter(card => 
              !searchTerm || 
              card.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
              card.description?.toLowerCase().includes(searchTerm.toLowerCase())
            )
            .map((card) => (
              <Card key={card.id} card={card} listId={list.id} isMobile={isMobile} isTablet={isTablet} />
            ))
          }
        </SortableContext>
      </div>

      {/* Add Card */}
      <div className={`border-t border-gray-100 ${
        isMobile ? 'p-3' : 'p-4'
      }`}>
        {isAddingCard ? (
          <div className="space-y-3">
            <textarea
              value={newCardTitle}
              onChange={(e) => setNewCardTitle(e.target.value)}
              placeholder="输入卡片标题..."
              className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              autoFocus
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleAddCard();
                }
                if (e.key === 'Escape') {
                  setIsAddingCard(false);
                  setNewCardTitle('');
                }
              }}
            />
            <div className="flex space-x-2">
              <button
                onClick={handleAddCard}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                添加卡片
              </button>
              <button
                onClick={() => {
                  setIsAddingCard(false);
                  setNewCardTitle('');
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm"
              >
                取消
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <button
              onClick={() => setShowSmartSuggestions(true)}
              className={`w-full flex items-center justify-center space-x-2 text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded-lg transition-all duration-200 border-2 border-dashed border-purple-300 hover:border-purple-400 ${
                isMobile ? 'p-2 text-xs' : 'p-3 text-sm'
              }`}
            >
              <Sparkles className={isMobile ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
              <span className={`font-medium ${
                isMobile ? 'text-xs' : 'text-sm'
              }`}>智能建议</span>
            </button>
            
            <button
              onClick={() => setIsAddingCard(true)}
              className={`w-full flex items-center justify-center space-x-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-all duration-200 border-2 border-dashed border-gray-300 hover:border-gray-400 ${
                isMobile ? 'p-2 text-xs' : 'p-3 text-sm'
              }`}
            >
              <Plus className={isMobile ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
              <span className={`font-medium ${
                isMobile ? 'text-xs' : 'text-sm'
              }`}>添加卡片</span>
            </button>
          </div>
        )}
      </div>
      
      {/* Smart Card Suggestions Modal */}
      <SmartCardSuggestions
        isOpen={showSmartSuggestions}
        onClose={() => setShowSmartSuggestions(false)}
        listId={list.id}
      />
    </div>
  );
};

export default List;