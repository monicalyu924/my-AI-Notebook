import React, { useState } from 'react';
import { useAdvancedResponsive } from '../../hooks/useAdvancedResponsive';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import List from './List';
import Card from './Card';

interface ResponsiveBoardProps {
  board: any;
  onUpdateBoard: (board: any) => void;
  onCreateList: (title: string) => void;
  children?: React.ReactNode;
}

const ResponsiveBoard: React.FC<ResponsiveBoardProps> = ({
  board,
  onUpdateBoard,
  onCreateList,
  children
}) => {
  const { isMobile, isTablet, getResponsiveValue, getLayoutConfig } = useAdvancedResponsive();
  const [currentListIndex, setCurrentListIndex] = useState(0);
  const [showListSelector, setShowListSelector] = useState(false);
  
  const layoutConfig = getLayoutConfig();
  
  if (!board || !board.lists) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">暂无看板数据</div>
      </div>
    );
  }

  // 移动端：单列垂直布局
  if (isMobile) {
    return (
      <div className="h-full flex flex-col bg-gray-50">
        {/* 移动端头部 - 列表选择器 */}
        <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentListIndex(Math.max(0, currentListIndex - 1))}
              disabled={currentListIndex === 0}
              className="p-2 rounded-lg bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="上一列"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            <button
              onClick={() => setShowListSelector(!showListSelector)}
              className="flex items-center space-x-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg"
            >
              <span className="font-medium">
                {board.lists[currentListIndex]?.title || '选择列表'}
              </span>
              <MoreHorizontal className="w-4 h-4" />
            </button>
            
            <button
              onClick={() => setCurrentListIndex(Math.min(board.lists.length - 1, currentListIndex + 1))}
              disabled={currentListIndex === board.lists.length - 1}
              className="p-2 rounded-lg bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="下一列"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          
          <div className="text-sm text-gray-500">
            {currentListIndex + 1} / {board.lists.length}
          </div>
        </div>

        {/* 列表选择器下拉菜单 */}
        {showListSelector && (
          <div className="absolute top-20 left-4 right-4 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
            {board.lists.map((list: any, index: number) => (
              <button
                key={list.id}
                onClick={() => {
                  setCurrentListIndex(index);
                  setShowListSelector(false);
                }}
                className={`w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 ${
                  index === currentListIndex ? 'bg-blue-50 text-blue-700' : ''
                }`}
              >
                <div className="font-medium">{list.title}</div>
                <div className="text-sm text-gray-500">
                  {list.cards?.length || 0} 张卡片
                </div>
              </button>
            ))}
          </div>
        )}

        {/* 移动端内容区域 */}
        <div className="flex-1 overflow-auto p-4">
          {board.lists[currentListIndex] && (
            <div className="space-y-3">
              {board.lists[currentListIndex].cards?.map((card: any) => (
                <div key={card.id} className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                  <h3 className="font-medium text-gray-900 mb-2">{card.title}</h3>
                  {card.description && (
                    <p className="text-sm text-gray-600 mb-3">{card.description}</p>
                  )}
                  
                  {/* 卡片标签 */}
                  {card.labels && card.labels.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {card.labels.map((label: any, idx: number) => (
                        <span
                          key={idx}
                          className="px-2 py-1 text-xs rounded-full"
                          style={{ 
                            backgroundColor: label.color || '#e5e7eb',
                            color: '#374151'
                          }}
                        >
                          {label.name}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  {/* 卡片元信息 */}
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    {card.assignee && (
                      <div className="flex items-center space-x-1">
                        <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs">
                          {card.assignee.charAt(0).toUpperCase()}
                        </div>
                        <span>{card.assignee}</span>
                      </div>
                    )}
                    
                    {card.dueDate && (
                      <div className={`px-2 py-1 rounded text-xs ${
                        new Date(card.dueDate) < new Date() 
                          ? 'bg-red-100 text-red-700' 
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {new Date(card.dueDate).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {/* 添加新卡片按钮 */}
              <button className="w-full py-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors">
                + 添加新卡片
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 平板端：优化的双列布局
  if (isTablet) {
    return (
      <div className="h-full overflow-auto">
        <div className="grid grid-cols-2 gap-4 p-4 min-h-full">
          {board.lists.map((list: any, index: number) => (
            <div key={list.id} className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">{list.title}</h3>
                <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  {list.cards?.length || 0}
                </span>
              </div>
              
              <div className="space-y-3 max-h-96 overflow-auto">
                {list.cards?.map((card: any) => (
                  <Card key={card.id} card={card} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 桌面端：水平滚动布局（保持原有逻辑）
  return (
    <div className="h-full overflow-x-auto overflow-y-hidden">
      <div className="flex gap-6 p-6 h-full min-w-max">
        {board.lists.map((list: any) => (
          <div key={list.id} className="w-80 flex-shrink-0">
            <List list={list} />
          </div>
        ))}
        
        {/* 添加新列表按钮 */}
        <div className="w-80 flex-shrink-0">
          <button 
            onClick={() => {
              const title = prompt('请输入列表名称：');
              if (title) onCreateList(title);
            }}
            className="w-full h-12 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors"
          >
            + 添加新列表
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResponsiveBoard;