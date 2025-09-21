import React, { useState, useEffect } from 'react';
import { useProjects } from '../../context/ProjectContext';
import BoardList from './BoardList';
import BoardView from './BoardView';
import CreateBoardModal from './CreateBoardModal';
import EnhancedProjectPage from './EnhancedProjectPage';
import LoadingSpinner from '../common/LoadingSpinner';
import { ArrowLeft, Home } from 'lucide-react';

function ProjectPage({ onViewChange }) {
  // 使用增强版项目管理页面
  const [useEnhancedVersion] = useState(true); // 可以切换版本
  
  if (useEnhancedVersion) {
    return <EnhancedProjectPage onViewChange={onViewChange} />;
  }
  
  // 原始版本作为备选
  const { 
    loading, 
    boards, 
    currentBoard,
    loadBoards, 
    loadBoardWithData,
    createBoard 
  } = useProjects();
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedBoardId, setSelectedBoardId] = useState(null);

  useEffect(() => {
    loadBoards();
  }, [loadBoards]);

  useEffect(() => {
    if (selectedBoardId && selectedBoardId !== currentBoard?.id) {
      loadBoardWithData(selectedBoardId);
    }
  }, [selectedBoardId, currentBoard?.id, loadBoardWithData]);

  const handleBoardSelect = (boardId) => {
    setSelectedBoardId(boardId);
  };

  const handleBackToList = () => {
    setSelectedBoardId(null);
  };

  const handleCreateBoard = async (boardData) => {
    try {
      const newBoard = await createBoard(boardData);
      setShowCreateModal(false);
      setSelectedBoardId(newBoard.id);
    } catch (error) {
      // Error已经在context中处理了
    }
  };

  // 渲染加载骨架屏
  const renderLoadingSkeleton = () => (
    <div className="h-full flex flex-col min-h-screen bg-gradient-to-br from-purple-600 via-purple-500 to-purple-400">
      {/* 头部骨架 */}
      <div className="flex items-center justify-between p-4 bg-white/10 backdrop-blur-md border-b border-white/20">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 bg-white/20 rounded-lg animate-pulse"></div>
          <div className="w-24 h-6 bg-white/20 rounded animate-pulse"></div>
          <div className="w-32 h-5 bg-white/10 rounded animate-pulse"></div>
        </div>
        <div className="w-24 h-9 bg-white/20 rounded-lg animate-pulse"></div>
      </div>
      
      {/* 内容骨架 */}
      <div className="flex-1 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-white/30 p-6 trello-slide-in">
              <div className="w-full h-4 bg-gray-200 rounded animate-pulse mb-3"></div>
              <div className="w-3/4 h-3 bg-gray-100 rounded animate-pulse mb-4"></div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg animate-pulse mb-4"></div>
              <div className="flex gap-2 mb-3">
                <div className="w-16 h-6 bg-purple-100 rounded-full animate-pulse"></div>
                <div className="w-20 h-6 bg-purple-100 rounded-full animate-pulse"></div>
              </div>
              <div className="w-full h-3 bg-gray-100 rounded animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  if (loading && boards.length === 0) {
    return renderLoadingSkeleton();
  }

  return (
    <div className="h-full flex flex-col min-h-screen bg-gradient-to-br from-purple-600 via-purple-500 to-purple-400">
      {/* 头部工具栏 */}
      <div className="flex items-center justify-between p-4 bg-white/10 backdrop-blur-md border-b border-white/20">
        <div className="flex items-center gap-4">
          {/* 返回主界面按钮 */}
          <button
            onClick={() => onViewChange?.('workspace')}
            className="flex items-center gap-2 px-3 py-2 text-white/90 hover:text-white hover:bg-white/20 rounded-lg transition-all duration-200 trello-focus-ring"
            title="返回AI工作台"
          >
            <Home className="w-5 h-5" />
            <span className="hidden sm:inline">主界面</span>
          </button>

          {selectedBoardId && (
            <button
              onClick={handleBackToList}
              className="flex items-center gap-2 px-3 py-2 text-white/90 hover:text-white hover:bg-white/20 rounded-lg transition-all duration-200 trello-focus-ring"
            >
              <ArrowLeft className="w-5 h-5" />
              返回看板列表
            </button>
          )}
          
          <h1 className="text-xl font-semibold text-white drop-shadow-sm">
            {selectedBoardId && currentBoard ? currentBoard.name : '项目管理'}
          </h1>
        </div>

        {!selectedBoardId && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-lg hover:bg-white/30 hover:scale-105 transition-all duration-200 border border-white/30 trello-focus-ring"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            新建看板
          </button>
        )}
      </div>

      {/* 主要内容区域 */}
      <div className="flex-1 overflow-hidden">
        {selectedBoardId && currentBoard ? (
          <BoardView board={currentBoard} />
        ) : (
          <BoardList 
            boards={boards} 
            onBoardSelect={handleBoardSelect}
            onCreateBoard={() => setShowCreateModal(true)}
          />
        )}
      </div>

      {/* 创建看板模态框 */}
      {showCreateModal && (
        <CreateBoardModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateBoard}
        />
      )}
    </div>
  );
}

export default ProjectPage;