import React, { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useProjects } from '../../context/ProjectContext';
import DraggableCard from './DraggableCard';
import CreateCardModal from './CreateCardModal';

function ListComponent({ list, onCardClick, isDraggedOver }) {
  const { updateList, deleteList, createCard } = useProjects();
  const { setNodeRef, isOver } = useDroppable({
    id: list.id,
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(list.title);
  const [showCreateCardModal, setShowCreateCardModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const handleTitleEdit = () => {
    setIsEditing(true);
    setEditTitle(list.title);
  };

  const handleTitleSave = async () => {
    if (editTitle.trim() && editTitle !== list.title) {
      try {
        await updateList(list.id, { title: editTitle.trim() });
      } catch (error) {
        setEditTitle(list.title); // 回滚
      }
    } else {
      setEditTitle(list.title); // 回滚
    }
    setIsEditing(false);
  };

  const handleTitleCancel = () => {
    setEditTitle(list.title);
    setIsEditing(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleTitleSave();
    } else if (e.key === 'Escape') {
      handleTitleCancel();
    }
  };

  const handleDeleteList = async () => {
    if (confirm(`确定要删除列表 "${list.title}" 吗？这将删除列表中的所有卡片。`)) {
      try {
        await deleteList(list.id);
      } catch (error) {
        // Error已经在context中处理了
      }
    }
    setShowMenu(false);
  };

  const handleCreateCard = async (cardData) => {
    try {
      await createCard(list.id, cardData);
      setShowCreateCardModal(false);
    } catch (error) {
      // Error已经在context中处理了
    }
  };

  return (
    <div className={`trello-list flex-shrink-0 w-64 sm:w-72 p-3 sm:p-4 h-fit max-h-full flex flex-col transition-all duration-200 ${
      isOver ? 'bg-white/80 backdrop-blur-md shadow-trello-card-hover' : ''
    }`}>
      {/* 列表头部 */}
      <div className="flex items-center justify-between mb-4">
        {isEditing ? (
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onBlur={handleTitleSave}
            onKeyDown={handleKeyPress}
            className="flex-1 px-2 py-1 text-sm font-medium bg-white border border-trello-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-trello-500 transition-all"
            autoFocus
            maxLength={50}
          />
        ) : (
          <h3 
            className="flex-1 text-sm font-medium text-gray-800 cursor-pointer hover:text-trello-600 transition-colors truncate"
            onClick={handleTitleEdit}
            title="点击编辑列表名称"
          >
            {list.title}
          </h3>
        )}
        
        {/* 列表菜单 */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01" />
            </svg>
          </button>
          
          {showMenu && (
            <>
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => setShowMenu(false)}
              />
              <div className="trello-dropdown absolute right-0 top-full mt-1 w-48 z-20">
                <div className="py-1">
                  <button
                    onClick={() => {
                      handleTitleEdit();
                      setShowMenu(false);
                    }}
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    重命名列表
                  </button>
                  <button
                    onClick={handleDeleteList}
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    删除列表
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 卡片数量 */}
      <div className="text-xs text-gray-500 mb-3">
        {list.cards.length} 个卡片
      </div>

      {/* 卡片列表 */}
      <div 
        ref={setNodeRef}
        className="flex-1 space-y-2 overflow-y-auto max-h-96 mb-4 trello-scrollbar"
      >
        <SortableContext 
          items={list.cards.map(card => card.id)}
          strategy={verticalListSortingStrategy}
        >
          {list.cards.map((card) => (
            <DraggableCard
              key={card.id}
              card={card}
              onClick={() => onCardClick(card)}
            />
          ))}
        </SortableContext>
      </div>

      {/* 添加卡片按钮 */}
      <button
        onClick={() => setShowCreateCardModal(true)}
        className="flex items-center gap-2 w-full p-2 text-gray-600 hover:text-gray-800 hover:bg-white/70 rounded-lg transition-all text-sm shadow-sm hover:shadow-trello-card"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        添加卡片
      </button>

      {/* 创建卡片模态框 */}
      {showCreateCardModal && (
        <CreateCardModal
          onClose={() => setShowCreateCardModal(false)}
          onSubmit={handleCreateCard}
        />
      )}
    </div>
  );
}

export default ListComponent;