import React, { useState, useEffect } from 'react';
import { Search, Plus, Settings, LogOut, Menu, X, FileText, CheckSquare, MessageCircle, Clock, Kanban, Brain, Sparkles, Home } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotes } from '../../context/NotesContext';
import { useTodos } from '../../context/TodoContext';
import { useFolders } from '../../context/FolderContext';
import { useResponsiveLayout } from '../../hooks/useResponsiveLayout';
import { Link } from 'react-router-dom';
import EnhancedFolderTree from '../folders/EnhancedFolderTree';
import { Button } from '../atlassian-ui';

const ResponsiveSidebar = ({ currentView, onViewChange }) => {
  const { isMobile, isTablet } = useResponsiveLayout();
  const [isOpen, setIsOpen] = useState(!isMobile);
  const { logout, user } = useAuth();
  const { createNote, searchTerm, setSearchTerm, currentFolderId } = useNotes();
  const { setSelectedTodo, setIsCreating } = useTodos();
  
  // 响应式处理：在移动端自动关闭侧边栏
  useEffect(() => {
    if (isMobile) {
      setIsOpen(false);
    } else {
      setIsOpen(true);
    }
  }, [isMobile]);
  
  // 移动端点击遮罩关闭侧边栏
  const handleOverlayClick = () => {
    if (isMobile) {
      setIsOpen(false);
    }
  };
  
  // 移动端选择视图后自动关闭侧边栏
  const handleViewChange = (view) => {
    onViewChange(view);
    if (isMobile) {
      setIsOpen(false);
    }
  };

  const handleNewNote = async () => {
    await createNote({
      title: 'Untitled',
      content: '',
      tags: [],
      folder_id: currentFolderId
    });
    if (isMobile) setIsOpen(false);
  };

  const handleNewTodo = () => {
    setSelectedTodo(null);
    setIsCreating(true);
    if (isMobile) setIsOpen(false);
  };

  const handleLogout = () => {
    logout();
  };

  // 导航项配置
  const navigationItems = [
    {
      id: 'workspace',
      label: 'AI工作台',
      icon: Brain,
      color: 'text-purple-600 bg-purple-100',
      special: true
    },
    { id: 'notes', label: '笔记', icon: FileText },
    { id: 'todos', label: '待办', icon: CheckSquare },
    { id: 'projects', label: '项目', icon: Kanban },
    { id: 'chat', label: '对话', icon: MessageCircle },
    { id: 'pomodoro', label: '番茄钟', icon: Clock }
  ];

  return (
    <>
      {/* 移动端菜单按钮 */}
      {isMobile && (
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-lg border border-gray-200 lg:hidden"
          aria-label="打开菜单"
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      )}

      {/* 遮罩层 - 仅移动端 */}
      {isMobile && isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={handleOverlayClick}
          aria-hidden="true"
        />
      )}

      {/* 侧边栏主体 */}
      <aside
        className={`
          ${isMobile ? 'fixed' : 'relative'} 
          ${isMobile ? 'inset-y-0 left-0' : ''} 
          ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
          ${isMobile ? 'w-80' : isTablet ? 'w-64' : 'w-72'} 
          ${isMobile ? 'z-40' : 'z-10'}
          trello-sidebar flex flex-col h-full 
          transition-transform duration-300 ease-in-out
          bg-white/95 backdrop-blur-md border-r border-gray-200
        `}
        aria-label="主导航"
      >
        {/* 用户信息区域 */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3 min-w-0 flex-1">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                {user?.full_name ? user.full_name.charAt(0).toUpperCase() : user?.email.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.full_name || user?.email}
                </p>
                <p className="text-xs text-gray-500">
                  {isMobile ? '移动版' : '桌面版'}
                </p>
              </div>
            </div>
            <div className="flex space-x-1 flex-shrink-0">
              <Link
                to="/settings"
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
                title="设置"
              >
                <Settings className="h-4 w-4" />
              </Link>
              <button
                onClick={handleLogout}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
                title="退出登录"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
          
          {/* 搜索框 */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="搜索..."
              className="w-full pl-10 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-300 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* 导航区域 */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <div className="space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              
              if (item.special) {
                return (
                  <button
                    key={item.id}
                    onClick={() => handleViewChange(item.id)}
                    className={`w-full flex items-center px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                      isActive 
                        ? 'bg-purple-600 text-white shadow-lg' 
                        : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
                    }`}
                  >
                    <Icon className="h-5 w-5 mr-3" />
                    <span>{item.label}</span>
                    <Sparkles className="h-4 w-4 ml-auto" />
                  </button>
                );
              }
              
              return (
                <button
                  key={item.id}
                  onClick={() => handleViewChange(item.id)}
                  className={`w-full flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive 
                      ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="h-4 w-4 mr-3" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* 动态内容区域 */}
          <div className="mt-6">
            {currentView === 'notes' && (
              <>
                <button
                  onClick={handleNewNote}
                  className="w-full flex items-center px-3 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-all mb-4"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  新建笔记
                </button>
                <EnhancedFolderTree />
              </>
            )}
            
            {currentView === 'todos' && (
              <button
                onClick={handleNewTodo}
                className="w-full flex items-center px-3 py-2.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-all"
              >
                <Plus className="h-4 w-4 mr-2" />
                新建待办
              </button>
            )}
          </div>
        </nav>

        {/* 底部信息 */}
        <div className="p-4 border-t border-gray-100">
          <div className="text-xs text-gray-400 text-center">
            AI Notebook v2.0
          </div>
        </div>
      </aside>
    </>
  );
};

export default ResponsiveSidebar;