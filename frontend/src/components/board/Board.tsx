import React, { useState, useEffect } from 'react';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { createPortal } from 'react-dom';
import List from './List';
import Card from './Card';
import { Plus, Settings, Filter, Search } from 'lucide-react';
import { useProjectBoardStore } from '../../store/projectBoardStore';
import { CardData, ListData, BoardData } from './index';
import { useResponsiveLayout, useDragOptimization } from '../../hooks/useResponsiveLayout';

const Board: React.FC = () => {
  const { currentBoard, updateBoard, createList, updateList, moveCard } = useProjectBoardStore();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draggedCard, setDraggedCard] = useState<CardData | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [boardTitle, setBoardTitle] = useState(currentBoard?.title || '项目管理看板');
  
  const { isMobile, isTablet, getResponsiveClasses } = useResponsiveLayout();
  const dragOptimization = useDragOptimization();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: dragOptimization.activationConstraint,
    }),
    useSensor(PointerSensor, {
      activationConstraint: { distance: 0 },
    })
  );

  useEffect(() => {
    if (currentBoard) {
      setBoardTitle(currentBoard.title);
    }
  }, [currentBoard]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    
    // Find the dragged card
    if (currentBoard) {
      for (const list of currentBoard.lists) {
        const card = list.cards.find(c => c.id === event.active.id);
        if (card) {
          setDraggedCard(card);
          break;
        }
      }
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || !currentBoard) {
      setActiveId(null);
      setDraggedCard(null);
      return;
    }

    const activeId = active.id as string;
    const overId = over.id as string;

    // Find source and destination lists
    let sourceListId: string | null = null;
    let destListId: string | null = null;

    currentBoard.lists.forEach((list) => {
      const hasCard = list.cards.some(card => card.id === activeId);
      if (hasCard) {
        sourceListId = list.id;
      }
      if (list.cards.some(card => card.id === overId) || list.id === overId) {
        destListId = list.id;
      }
    });

    if (sourceListId && destListId && sourceListId !== destListId) {
      moveCard(currentBoard.id, sourceListId, destListId, activeId);
    }

    setActiveId(null);
    setDraggedCard(null);
  };

  const handleBoardTitleChange = (newTitle: string) => {
    setBoardTitle(newTitle);
    if (currentBoard) {
      updateBoard(currentBoard.id, { title: newTitle });
    }
  };

  const addNewList = () => {
    console.log('添加新列表按钮被点击');
    if (currentBoard) {
      console.log('当前看板存在，尝试创建列表', currentBoard.id);
      createList(currentBoard.id, '新列表');
    } else {
      console.log('当前看板不存在，无法创建列表');
    }
  };

  if (!currentBoard) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="text-6xl mb-4">📋</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">暂无看板</h2>
          <p className="text-gray-600 mb-4">创建你的第一个项目看板开始管理任务</p>
          <button
            onClick={() => {
              // Create a new board
              window.location.reload();
            }}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            创建看板
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
      {/* Board Header */}
      <div className="p-4 sm:p-6 pb-4 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex-1">
            <input
              type="text"
              value={boardTitle}
              onChange={(e) => handleBoardTitleChange(e.target.value)}
              className="text-3xl font-bold text-gray-800 bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded px-2 py-1 -ml-2"
            />
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="搜索卡片..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 bg-white bg-opacity-80 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            {/* Filter */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-lg transition-colors ${
                showFilters 
                  ? 'bg-blue-100 text-blue-600' 
                  : 'bg-white bg-opacity-80 text-gray-600 hover:bg-opacity-100'
              }`}
            >
              <Filter className="w-4 h-4" />
            </button>
            
            {/* Settings */}
            <button className="p-2 bg-white bg-opacity-80 text-gray-600 rounded-lg hover:bg-opacity-100 transition-colors">
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {/* Board Stats */}
        <div className="flex items-center space-x-2 sm:space-x-4 text-sm text-gray-600 flex-wrap gap-2">
          <span className="bg-white bg-opacity-80 px-2 sm:px-3 py-1 rounded-full shadow-sm">
            {currentBoard.lists.length} 个列表
          </span>
          <span className="bg-white bg-opacity-80 px-2 sm:px-3 py-1 rounded-full shadow-sm">
            {currentBoard.lists.reduce((total, list) => total + list.cards.length, 0)} 张卡片
          </span>
          <span className="bg-white bg-opacity-80 px-2 sm:px-3 py-1 rounded-full shadow-sm">
            {currentBoard.lists.reduce((total, list) => 
              total + list.cards.filter(card => 
                card.dueDate && new Date(card.dueDate) < new Date()
              ).length, 0
            )} 个逾期
          </span>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div 
          className={`
            flex-1 flex space-x-4 both-scroll touch-scroll
            px-3 sm:px-4 md:px-6 pb-4 md:pb-6
            ${isMobile ? 'min-h-[calc(100vh-200px)]' : 'min-h-[calc(100vh-180px)]'}
          `}
          style={{ touchAction: dragOptimization.touchAction }}
          id="board-container"
        >
          <SortableContext 
            items={currentBoard.lists.map(list => list.id)}
            strategy={horizontalListSortingStrategy}
          >
            {currentBoard.lists.map((list) => (
              <List
                key={list.id}
                list={list}
                searchTerm={searchTerm}
                isMobile={isMobile}
                isTablet={isTablet}
              />
            ))}
          </SortableContext>
          
          {/* Add New List Button */}
          <div className="flex-shrink-0">
            <button
              onClick={addNewList}
              className={`
                bg-white bg-opacity-80 hover:bg-opacity-100 rounded-lg shadow-sm border-2 border-dashed border-gray-300 hover:border-gray-400 transition-all duration-200 flex items-center justify-center space-x-2 text-gray-600 hover:text-gray-800
                ${isMobile ? 'w-64 h-10 text-sm' : 'w-80 h-12'}
              `}
            >
              <Plus className={isMobile ? 'w-4 h-4' : 'w-5 h-5'} />
              <span>添加列表</span>
            </button>
          </div>
        </div>

        {createPortal(
          <DragOverlay dropAnimation={null}>
            {draggedCard ? (
              <div className={`opacity-80 ${
                isMobile ? 'scale-95' : ''
              }`}>
                <Card card={draggedCard} isDragging isMobile={isMobile} isTablet={isTablet} />
              </div>
            ) : null}
          </DragOverlay>,
          document.body
        )}
      </DndContext>
    </div>
  );
};

export default Board;