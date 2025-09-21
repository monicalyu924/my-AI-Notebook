import React, { useState, useCallback, useMemo, memo } from 'react';
import { DndContext, DragOverlay, closestCorners } from '@dnd-kit/core';
import { useProjects } from '../../context/ProjectContext';
import ListComponent from './ListComponent';
import CreateListModal from './CreateListModal';
import CardDetailModal from './CardDetailModal';
import CardComponent from './CardComponent';
import BoardStats from './BoardStats';
import ListCard from './ListCard';
import SearchFilter from './SearchFilter';
import { CheckCircle2, X, Layout, Columns } from 'lucide-react';
import { Kanban } from '../atlassian-ui/Kanban';
import { Button } from '../atlassian-ui';

const BoardView = memo(({ board }) => {
  const { createList, updateCard } = useProjects();
  const [showCreateListModal, setShowCreateListModal] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
  const [viewMode, setViewMode] = useState('board'); // 'board', 'list', or 'kanban'
  const [activeCard, setActiveCard] = useState(null);
  const [draggedOverList, setDraggedOverList] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [notification, setNotification] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState({
    priority: '',
    status: '',
    assignee: '',
    hasDeadline: false
  });

  // 显示通知
  const showNotification = useCallback((message, type = 'success') => {
    setNotification({ message, type });
    // 3秒后自动隐藏
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  }, []);

  const handleCreateList = useCallback(async (listData) => {
    try {
      setIsUpdating(true);
      await createList(board.id, listData);
      setShowCreateListModal(false);
      showNotification('列表创建成功', 'success');
    } catch (error) {
      showNotification('列表创建失败，请重试', 'error');
    } finally {
      setIsUpdating(false);
    }
  }, [createList, board.id]);

  const handleCardClick = useCallback((card) => {
    setSelectedCard(card);
  }, []);

  const handleCloseCardModal = useCallback(() => {
    setSelectedCard(null);
  }, []);

  // 搜索和筛选处理函数
  const handleSearch = useCallback((term) => {
    setSearchTerm(term);
  }, []);

  const handleFilter = useCallback((filters) => {
    setActiveFilters(filters);
  }, []);

  // 筛选卡片逻辑
  const filteredBoard = useMemo(() => {
    if (!searchTerm && !Object.values(activeFilters).some(value => 
      value === true || (typeof value === 'string' && value !== '')
    )) {
      return board;
    }

    const filteredLists = board.lists.map(list => {
      const filteredCards = list.cards.filter(card => {
        // 搜索条件
        const matchesSearch = !searchTerm || 
          card.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (card.description && card.description.toLowerCase().includes(searchTerm.toLowerCase()));

        // 优先级筛选
        const matchesPriority = !activeFilters.priority || card.priority === activeFilters.priority;

        // 状态筛选
        const matchesStatus = !activeFilters.status || 
          (activeFilters.status === 'completed' && card.completed) ||
          (activeFilters.status === 'active' && !card.completed);

        // 截止日期筛选
        const matchesDeadline = !activeFilters.hasDeadline || !!card.due_date;

        // 指派人筛选（暂时忽略，因为assignee字段可能不完整）
        const matchesAssignee = !activeFilters.assignee || card.assignee === activeFilters.assignee;

        return matchesSearch && matchesPriority && matchesStatus && matchesDeadline && matchesAssignee;
      });

      return {
        ...list,
        cards: filteredCards
      };
    });

    return {
      ...board,
      lists: filteredLists
    };
  }, [board, searchTerm, activeFilters]);

  // 计算统计数据
  const totalCards = useMemo(() => 
    board.lists.reduce((acc, list) => acc + list.cards.length, 0), 
    [board.lists]
  );

  const filteredCards = useMemo(() => 
    filteredBoard.lists.reduce((acc, list) => acc + list.cards.length, 0), 
    [filteredBoard.lists]
  );

  const handleDragStart = useCallback((event) => {
    const { active } = event;
    setIsDragging(true);
    
    // 找到被拖拽的卡片
    let draggedCard = null;
    for (const list of filteredBoard.lists) {
      const card = list.cards.find(card => card.id === active.id);
      if (card) {
        draggedCard = card;
        break;
      }
    }
    setActiveCard(draggedCard);
  }, [filteredBoard.lists]);
  
  const handleDragOver = useCallback((event) => {
    const { over } = event;
    if (!over) {
      setDraggedOverList(null);
      return;
    }
    
    // 找到目标列表
    let targetListId = over.id;
    const targetList = filteredBoard.lists.find(list => list.id === targetListId);
    
    if (!targetList) {
      // 可能拖到了卡片上，找到该卡片所属的列表
      for (const list of filteredBoard.lists) {
        if (list.cards.find(card => card.id === targetListId)) {
          targetListId = list.id;
          break;
        }
      }
    }
    
    setDraggedOverList(targetListId);
  }, [filteredBoard.lists]);

  const handleDragEnd = useCallback(async (event) => {
    const { active, over } = event;
    setActiveCard(null);
    setIsDragging(false);
    setDraggedOverList(null);
    
    if (!over) return;
    
    const cardId = active.id;
    const targetListId = over.id;
    
    // 如果拖到的是卡片，需要找到其所属的列表
    let finalTargetListId = targetListId;
    if (targetListId !== cardId) {
      // 检查target是否是列表ID
      const targetList = board.lists.find(list => list.id === targetListId);
      if (!targetList) {
        // 可能拖到了另一个卡片上，找到该卡片所属的列表
        for (const list of board.lists) {
          if (list.cards.find(card => card.id === targetListId)) {
            finalTargetListId = list.id;
            break;
          }
        }
      }
    }
    
    // 找到源列表
    let sourceListId = null;
    let sourceCard = null;
    for (const list of board.lists) {
      const card = list.cards.find(card => card.id === cardId);
      if (card) {
        sourceListId = list.id;
        sourceCard = card;
        break;
      }
    }
    
    // 如果没有真正移动，则不执行更新
    if (sourceListId === finalTargetListId) {
      return;
    }
    
    // 找到目标列表名称用于显示
    const targetList = board.lists.find(list => list.id === finalTargetListId);
    const sourceList = board.lists.find(list => list.id === sourceListId);
    
    try {
      setIsUpdating(true);
      // 调用API更新卡片所属列表
      await updateCard(cardId, { list_id: finalTargetListId });
      
      // 显示成功消息
      if (sourceCard && targetList && sourceList) {
        showNotification(`已将“${sourceCard.title}”移动到“${targetList.title}”`, 'success');
      }
    } catch (error) {
      console.error('移动卡片失败:', error);
      showNotification('移动卡片失败，请重试', 'error');
    } finally {
      setIsUpdating(false);
    }
  }, [board.lists, updateCard]);

  // Kanban数据转换
  const kanbanData = useMemo(() => {
    const columns = filteredBoard.lists.map(list => ({
      id: list.id,
      title: list.name,
      type: list.name.toLowerCase().includes('todo') ? 'todo' : 
            list.name.toLowerCase().includes('progress') ? 'progress' : 
            list.name.toLowerCase().includes('done') ? 'done' : 'default',
      description: list.description || '',
      progress: list.cards ? Math.round((list.cards.filter(card => card.status === 'completed').length / list.cards.length) * 100) || 0 : 0
    }));

    const cards = filteredBoard.lists.flatMap(list => 
      list.cards?.map(card => ({
        id: card.id,
        columnId: list.id,
        title: card.title,
        description: card.description,
        priority: card.priority,
        dueDate: card.due_date,
        assignee: card.assignee ? { name: card.assignee } : null,
        labels: card.labels || [],
        progress: card.progress || 0
      })) || []
    );

    return { columns, cards };
  }, [filteredBoard.lists]);

  const handleKanbanCardClick = useCallback((card) => {
    // 从原始数据中找到完整的卡片信息
    const fullCard = filteredBoard.lists
      .flatMap(list => list.cards || [])
      .find(c => c.id === card.id);
    if (fullCard) {
      setSelectedCard(fullCard);
    }
  }, [filteredBoard.lists]);

  const handleKanbanCardMove = useCallback(async (cardId, newColumnId) => {
    try {
      setIsUpdating(true);
      // 找到原始卡片数据
      const card = filteredBoard.lists
        .flatMap(list => list.cards || [])
        .find(c => c.id === cardId);
      
      if (card) {
        await updateCard(cardId, { list_id: newColumnId });
        showNotification('卡片移动成功', 'success');
      }
    } catch (error) {
      showNotification('卡片移动失败，请重试', 'error');
    } finally {
      setIsUpdating(false);
    }
  }, [filteredBoard.lists, updateCard, showNotification]);

  const kanbanViewContent = useMemo(() => (
    <div className="h-full">
      <Kanban
        columns={kanbanData.columns}
        cards={kanbanData.cards}
        onCardClick={handleKanbanCardClick}
        onCardMove={handleKanbanCardMove}
        className="h-full"
      />
    </div>
  ), [kanbanData.columns, kanbanData.cards, handleKanbanCardClick, handleKanbanCardMove]);

  // 记忆化渲染内容以避免不必要的重新计算
  const boardViewContent = useMemo(() => (
    <DndContext
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      collisionDetection={closestCorners}
    >
      <div className="h-full overflow-x-auto overflow-y-hidden trello-scrollbar">
        <div className="flex h-full gap-4 sm:gap-6 p-4 sm:p-6 min-w-max">
          {filteredBoard.lists.map((list) => (
            <ListComponent
              key={list.id}
              list={list}
              onCardClick={handleCardClick}
            />
          ))}
          
          {/* 添加列表按钮 */}
          <div className="flex-shrink-0">
            <button
              onClick={() => setShowCreateListModal(true)}
              className="flex items-center gap-3 p-4 w-64 sm:w-72 bg-white/60 backdrop-blur-sm hover:bg-white/80 rounded-xl text-gray-600 hover:text-gray-800 transition-all border-2 border-dashed border-white/50 hover:border-white/70 shadow-trello-card hover:shadow-trello-card-hover"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="font-medium text-sm sm:text-base">添加新列表</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* 拖拽预览 */}
      <DragOverlay>
        {activeCard && (
          <div className="rotate-6 scale-105">
            <CardComponent card={activeCard} onClick={() => {}} />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  ), [filteredBoard.lists, activeCard, handleDragStart, handleDragOver, handleDragEnd, handleCardClick]);

  const listViewContent = useMemo(() => (
    <div className="h-full overflow-y-auto p-3 sm:p-6 trello-scrollbar">
      <div className="w-full mx-auto space-y-4 sm:space-y-6">
        <SearchFilter 
          onSearch={handleSearch}
          onFilter={handleFilter}
          totalCards={totalCards}
          filteredCards={filteredCards}
        />
        <BoardStats lists={filteredBoard.lists} />
        
        {/* 列表内容 */}
        {filteredBoard.lists.map((list) => (
          <ListCard key={list.id} list={list} onCardClick={handleCardClick} />
        ))}
        
        {/* 添加新列表按钮 */}
        <div className="text-center pt-8">
          <button
            onClick={() => setShowCreateListModal(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-trello-500 text-white rounded-xl hover:bg-trello-600 transition-all shadow-trello-card hover:shadow-trello-card-hover"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            添加新列表
          </button>
        </div>
      </div>
    </div>
  ), [filteredBoard.lists, handleCardClick, handleSearch, handleFilter, totalCards, filteredCards]);

  return (
    <div className="h-full flex flex-col">
      {/* 视图切换工具栏 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-4 sm:px-6 py-3 bg-white/90 backdrop-blur-md shadow-trello-card space-y-3 sm:space-y-0">
        <div className="flex items-center gap-4">
          {/* 看板描述 */}
          {board.description && (
            <p className="text-sm text-gray-600 truncate">{board.description}</p>
          )}
        </div>
        
        {/* 视图切换按钮 */}
        <div className="flex items-center gap-1 bg-white/60 backdrop-blur-sm rounded-xl p-1 w-full sm:w-auto shadow-trello-card">
          <Button
            variant={viewMode === 'board' ? 'primary' : 'ghost'}
            size="small"
            onClick={() => setViewMode('board')}
            leftIcon={<Layout className="w-4 h-4" />}
            className="flex-1 sm:flex-none"
          >
            <span className="hidden sm:inline">看板</span>
            <span className="sm:hidden">看板</span>
          </Button>
          
          <Button
            variant={viewMode === 'kanban' ? 'primary' : 'ghost'}
            size="small"
            onClick={() => setViewMode('kanban')}
            leftIcon={<Columns className="w-4 h-4" />}
            className="flex-1 sm:flex-none"
          >
            <span className="hidden sm:inline">Kanban</span>
            <span className="sm:hidden">K</span>
          </Button>
          
          <Button
            variant={viewMode === 'list' ? 'primary' : 'ghost'}
            size="small"
            onClick={() => setViewMode('list')}
            leftIcon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            }
            className="flex-1 sm:flex-none"
          >
            <span className="hidden sm:inline">列表</span>
            <span className="sm:hidden">列表</span>
          </Button>
        </div>
      </div>

      {/* 主要内容区域 */}
      <div className="flex-1 overflow-hidden">
        {viewMode === 'board' ? boardViewContent : 
         viewMode === 'kanban' ? kanbanViewContent : 
         listViewContent}
      </div>

      {/* 模态框 */}
      {showCreateListModal && (
        <CreateListModal
          onClose={() => setShowCreateListModal(false)}
          onSubmit={handleCreateList}
        />
      )}

      {selectedCard && (
        <CardDetailModal
          card={selectedCard}
          onClose={handleCloseCardModal}
        />
      )}

      {/* 通知组件 - 增强动画效果 */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2 duration-300">
          <div className={`trello-notification flex items-center gap-3 px-4 py-3 rounded-xl shadow-trello-card-hover max-w-sm transform transition-all duration-200 hover:scale-105 ${
            notification.type === 'success' 
              ? 'bg-green-50 text-green-800' 
              : 'bg-red-50 text-red-800'
          }`}>
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-green-600 animate-pulse" />
            ) : (
              <X className="w-5 h-5 text-red-600 animate-bounce" />
            )}
            <p className="text-sm font-medium">{notification.message}</p>
            <button
              onClick={() => setNotification(null)}
              className="ml-auto text-gray-400 hover:text-gray-600 transition-colors duration-150 hover:scale-110 transform"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 加载遮罩 - 增强设计 */}
      {isUpdating && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-40 backdrop-blur-sm">
          <div className="trello-modal p-6 shadow-trello-modal transform transition-all duration-200 animate-in zoom-in-50">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-6 h-6 border-3 border-trello-200 rounded-full"></div>
                <div className="absolute top-0 left-0 w-6 h-6 border-3 border-trello-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
              <div>
                <p className="text-gray-900 font-semibold">正在处理</p>
                <p className="text-gray-500 text-sm">请稍候...</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

BoardView.displayName = 'BoardView';

export default BoardView;