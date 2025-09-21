import React from 'react';
import { Search, Plus, Settings, LogOut, FileText, Star, Tag, CheckSquare, MessageCircle, Clock, Kanban, Brain, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotes } from '../../context/NotesContext';
import { useTodos } from '../../context/TodoContext';
import { useFolders } from '../../context/FolderContext';
import { Link } from 'react-router-dom';
import EnhancedFolderTree from '../folders/EnhancedFolderTree';
import { Button, Input } from '../atlassian-ui';

const Sidebar = ({ currentView, onViewChange }) => {
  const { logout, user } = useAuth();
  const { createNote, searchTerm, setSearchTerm, currentFolderId } = useNotes();
  const { setSelectedTodo, setIsCreating } = useTodos();
  const { selectedFolder } = useFolders();

  const handleNewNote = async () => {
    await createNote({
      title: 'Untitled',
      content: '',
      tags: [],
      folder_id: currentFolderId // 在当前文件夹中创建笔记
    });
  };

  const handleLogout = () => {
    logout();
  };

  const handleNewTodo = () => {
    // 触发创建新待办事项
    setSelectedTodo(null);
    setIsCreating(true);
  };

  return (
    <div className="w-64 trello-sidebar flex flex-col h-full">
      {/* User info and actions */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-trello-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
              {user?.full_name ? user.full_name.charAt(0).toUpperCase() : user?.email.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-800 truncate">
                {user?.full_name || user?.email}
              </p>
            </div>
          </div>
          <div className="flex space-x-1">
            <Link
              to="/settings"
              className="p-1 text-gray-500 hover:text-gray-700 rounded-lg transition-colors"
              title="Settings"
            >
              <Settings className="h-4 w-4" />
            </Link>
            <Button
              variant="ghost"
              size="small"
              onClick={handleLogout}
              className="p-1 text-gray-500 hover:text-gray-700"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* AI工作台入口 */}
        <button
          onClick={() => onViewChange('workspace')}
          className={`w-full flex items-center justify-center px-3 py-3 mb-3 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-trello-500 ${
            currentView === 'workspace' 
              ? 'bg-trello-500 text-white shadow-trello-card-hover' 
              : 'bg-white/80 text-trello-600 hover:bg-white shadow-trello-card hover:shadow-trello-card-hover'
          }`}
          aria-label="切换到AI工作台"
        >
          <Brain className="h-5 w-5 mr-2" />
          <span className="font-medium">🤖 AI工作台</span>
          <Sparkles className="h-4 w-4 ml-2" />
        </button>
        
        {/* 视图切换 */}
        <div className="grid grid-cols-3 gap-1 p-1 bg-white/60 backdrop-blur-sm rounded-xl mb-2">
          <button
            onClick={() => onViewChange('notes')}
            className={`flex items-center justify-center px-2 py-2 text-xs rounded-lg transition-all ${
              currentView === 'notes' 
                ? 'bg-white text-trello-600 shadow-trello-card font-medium' 
                : 'text-gray-600 hover:text-gray-800 hover:bg-white/50'
            }`}
          >
            <FileText className="h-3 w-3 mr-1" />
            笔记
          </button>
          <button
            onClick={() => onViewChange('todos')}
            className={`flex items-center justify-center px-2 py-2 text-xs rounded-lg transition-all ${
              currentView === 'todos' 
                ? 'bg-white text-trello-600 shadow-trello-card font-medium' 
                : 'text-gray-600 hover:text-gray-800 hover:bg-white/50'
            }`}
          >
            <CheckSquare className="h-3 w-3 mr-1" />
            待办
          </button>
          <button
            onClick={() => onViewChange('projects')}
            className={`flex items-center justify-center px-2 py-2 text-xs rounded-lg transition-all ${
              currentView === 'projects' 
                ? 'bg-white text-trello-600 shadow-trello-card font-medium' 
                : 'text-gray-600 hover:text-gray-800 hover:bg-white/50'
            }`}
          >
            <Kanban className="h-3 w-3 mr-1" />
            项目
          </button>
        </div>
        
        <div className="grid grid-cols-2 gap-1 p-1 bg-white/60 backdrop-blur-sm rounded-xl mb-4">
          <button
            onClick={() => onViewChange('chat')}
            className={`flex items-center justify-center px-2 py-2 text-xs rounded-lg transition-all ${
              currentView === 'chat' 
                ? 'bg-white text-trello-600 shadow-trello-card font-medium' 
                : 'text-gray-600 hover:text-gray-800 hover:bg-white/50'
            }`}
          >
            <MessageCircle className="h-3 w-3 mr-1" />
            对话
          </button>
          <button
            onClick={() => onViewChange('pomodoro')}
            className={`flex items-center justify-center px-2 py-2 text-xs rounded-lg transition-all ${
              currentView === 'pomodoro' 
                ? 'bg-white text-trello-600 shadow-trello-card font-medium' 
                : 'text-gray-600 hover:text-gray-800 hover:bg-white/50'
            }`}
          >
            <Clock className="h-3 w-3 mr-1" />
            番茄钟
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder={
              currentView === 'notes' ? "搜索笔记..." : 
              currentView === 'todos' ? "搜索待办事项..." : 
              "搜索对话..."
            }
            className="w-full pl-10 pr-3 py-3 bg-white/80 backdrop-blur-sm border border-white/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-trello-500 focus:border-trello-300 transition-all shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <div className="space-y-2">
          {currentView === 'notes' ? (
            <>
              {/* New Note Button */}
              <button
                onClick={handleNewNote}
                className="w-full flex items-center px-3 py-2 text-sm font-medium text-white bg-trello-500 hover:bg-trello-600 rounded-xl transition-all shadow-trello-card hover:shadow-trello-card-hover"
              >
                <Plus className="h-4 w-4 mr-2" />
                新建笔记
              </button>

              {/* Enhanced Folder Tree */}
              <div className="mt-6">
                <EnhancedFolderTree />
              </div>
            </>
          ) : currentView === 'todos' ? (
            <>
              {/* New Todo Button */}
              <button
                onClick={handleNewTodo}
                className="w-full flex items-center px-3 py-2 text-sm font-medium text-white bg-green-500 hover:bg-green-600 rounded-xl transition-all shadow-trello-card hover:shadow-trello-card-hover"
              >
                <Plus className="h-4 w-4 mr-2" />
                新建待办
              </button>

              {/* Todo Filters */}
              <div className="mt-6">
                <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  筛选
                </h3>
                <div className="mt-2 space-y-1">
                  <div className="sidebar-item">
                    <CheckSquare className="h-4 w-4 mr-2" />
                    <span className="text-sm">全部任务</span>
                  </div>
                  <div className="sidebar-item">
                    <div className="h-4 w-4 mr-2 rounded-full bg-yellow-400"></div>
                    <span className="text-sm">待完成</span>
                  </div>
                  <div className="sidebar-item">
                    <div className="h-4 w-4 mr-2 rounded-full bg-green-400"></div>
                    <span className="text-sm">已完成</span>
                  </div>
                  <div className="sidebar-item">
                    <div className="h-4 w-4 mr-2 rounded-full bg-red-400"></div>
                    <span className="text-sm">逾期</span>
                  </div>
                </div>
              </div>

              {/* Todo Categories */}
              <div className="mt-6">
                <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  分类
                </h3>
                <div className="mt-2 space-y-1">
                  <div className="sidebar-item">
                    <Tag className="h-4 w-4 mr-2" />
                    <span className="text-sm">工作</span>
                  </div>
                  <div className="sidebar-item">
                    <Tag className="h-4 w-4 mr-2" />
                    <span className="text-sm">个人</span>
                  </div>
                  <div className="sidebar-item">
                    <Tag className="h-4 w-4 mr-2" />
                    <span className="text-sm">学习</span>
                  </div>
                </div>
              </div>
            </>
          ) : currentView === 'chat' ? (
            <>
              {/* AI Chat Info */}
              <div className="p-3 bg-white/80 backdrop-blur-sm rounded-xl shadow-trello-card">
                <div className="flex items-center mb-2">
                  <MessageCircle className="h-4 w-4 mr-2 text-blue-600" />
                  <span className="text-sm font-medium text-trello-700">AI 对话</span>
                </div>
                <p className="text-xs text-gray-600">
                  与AI助手进行智能对话，支持多种模型。
                </p>
              </div>

              {/* Model Info */}
              <div className="mt-4">
                <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  可用模型
                </h3>
                <div className="mt-2 space-y-1">
                  <div className="sidebar-item">
                    <div className="h-4 w-4 mr-2 rounded bg-purple-400"></div>
                    <span className="text-sm">Claude 3 Sonnet</span>
                  </div>
                  <div className="sidebar-item">
                    <div className="h-4 w-4 mr-2 rounded bg-purple-300"></div>
                    <span className="text-sm">Claude 3 Haiku</span>
                  </div>
                  <div className="sidebar-item">
                    <div className="h-4 w-4 mr-2 rounded bg-green-400"></div>
                    <span className="text-sm">GPT-4 Turbo</span>
                  </div>
                  <div className="sidebar-item">
                    <div className="h-4 w-4 mr-2 rounded bg-green-300"></div>
                    <span className="text-sm">GPT-3.5 Turbo</span>
                  </div>
                </div>
              </div>
            </>
          ) : currentView === 'pomodoro' ? (
            <>
              {/* Pomodoro Info */}
              <div className="p-3 bg-white/80 backdrop-blur-sm rounded-xl shadow-trello-card">
                <div className="flex items-center mb-2">
                  <Clock className="h-4 w-4 mr-2 text-red-600" />
                  <span className="text-sm font-medium text-red-700">番茄工作法</span>
                </div>
                <p className="text-xs text-gray-600">
                  通过专注工作和规律休息来提升效率。
                </p>
              </div>

              {/* Pomodoro Tips */}
              <div className="mt-4">
                <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  使用建议
                </h3>
                <div className="mt-2 space-y-2">
                  <div className="px-3 py-2 text-xs text-gray-600 bg-white/70 rounded-lg shadow-sm">
                    <div className="font-medium text-gray-800 mb-1">🎯 设定目标</div>
                    在开始前明确本次番茄钟要完成的任务
                  </div>
                  <div className="px-3 py-2 text-xs text-gray-600 bg-white/70 rounded-lg shadow-sm">
                    <div className="font-medium text-gray-800 mb-1">🔕 避免干扰</div>
                    关闭通知，专注于当前任务
                  </div>
                  <div className="px-3 py-2 text-xs text-gray-600 bg-white/70 rounded-lg shadow-sm">
                    <div className="font-medium text-gray-800 mb-1">💪 坚持完成</div>
                    不要在中途停止，培养专注习惯
                  </div>
                  <div className="px-3 py-2 text-xs text-gray-600 bg-white/70 rounded-lg shadow-sm">
                    <div className="font-medium text-gray-800 mb-1">🎉 记录成果</div>
                    完成后记录学习成果和感受
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </div>
      </nav>
    </div>
  );
};

export default Sidebar;
