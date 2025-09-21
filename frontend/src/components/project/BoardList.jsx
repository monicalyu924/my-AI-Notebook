import React, { useState } from 'react';
import { useProjects } from '../../context/ProjectContext';

function BoardList({ boards, onBoardSelect, onCreateBoard }) {
  const { deleteBoard } = useProjects();
  const [deletingBoard, setDeletingBoard] = useState(null);

  const handleDeleteBoard = async (boardId, boardName, e) => {
    e.stopPropagation();
    
    if (confirm(`确定要删除看板 "${boardName}" 吗？这将删除看板中的所有列表和卡片。`)) {
      setDeletingBoard(boardId);
      try {
        await deleteBoard(boardId);
      } catch (error) {
        // Error已经在context中处理了
      } finally {
        setDeletingBoard(null);
      }
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (boards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-white/90 p-8">
        <div className="text-6xl mb-4 trello-float">📋</div>
        <h2 className="text-xl font-medium mb-2 text-white drop-shadow-sm">还没有项目看板</h2>
        <p className="text-white/70 mb-6">创建你的第一个项目看板，开始管理任务</p>
        <button
          onClick={onCreateBoard}
          className="flex items-center gap-2 px-6 py-3 bg-white/20 backdrop-blur-sm text-white rounded-lg hover:bg-white/30 hover:scale-105 transition-all duration-200 border border-white/30 trello-focus-ring"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          创建看板
        </button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {boards.map((board) => (
          <div
            key={board.id}
            onClick={() => onBoardSelect(board.id)}
            className="group relative bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-white/30 hover:shadow-xl hover:scale-105 transition-all duration-200 cursor-pointer overflow-hidden trello-slide-in"
          >
            {/* 看板颜色条 */}
            <div 
              className="h-3 w-full"
              style={{ backgroundColor: board.color }}
            />
            
            {/* 看板内容 */}
            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-medium text-gray-900 group-hover:text-purple-600 transition-colors line-clamp-2">
                  {board.name}
                </h3>
                
                {/* 删除按钮 */}
                <button
                  onClick={(e) => handleDeleteBoard(board.id, board.name, e)}
                  disabled={deletingBoard === board.id}
                  className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-all trello-focus-ring"
                >
                  {deletingBoard === board.id ? (
                    <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  )}
                </button>
              </div>
              
              {board.description && (
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                  {board.description}
                </p>
              )}
              
              {/* 看板信息 */}
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>创建于 {formatDate(board.created_at)}</span>
                <div className="flex items-center gap-2">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
            
            {/* 悬停效果 */}
            <div className="absolute inset-0 bg-purple-100/20 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        ))}
        
        {/* 新建看板卡片 */}
        <div
          onClick={onCreateBoard}
          className="flex flex-col items-center justify-center min-h-[180px] bg-white/70 backdrop-blur-sm border-2 border-dashed border-white/50 rounded-xl hover:border-white hover:bg-white/80 hover:scale-105 transition-all cursor-pointer group trello-focus-ring"
        >
          <div className="text-white/70 group-hover:text-white transition-colors">
            <svg className="w-12 h-12 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <p className="text-sm font-medium drop-shadow">新建看板</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BoardList;