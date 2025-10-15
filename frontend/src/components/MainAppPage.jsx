import React from 'react';
import Sidebar from './layout/Sidebar';
import ResponsiveSidebar from './layout/ResponsiveSidebar';
import NoteList from './layout/NoteList';
import Editor from './editor/Editor';
import EditorHelp from './editor/EditorHelp';
import TodoList from './todo/TodoList';
import TodoEditor from './todo/TodoEditor';
import ChatPage from './chat/ChatPage';
import PomodoroPage from './pomodoro/PomodoroPage';
import ProjectPage from './project/ProjectPage';
import WorkspacePage from './workspace/WorkspacePage';
import NotesStatistics from './notes/NotesStatistics';
import AdminDashboard from './admin/AdminDashboard';
import FloatingPomodoroButton from './pomodoro/FloatingPomodoroButton';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';

const MainAppPage = ({ currentView = 'workspace', onViewChange }) => {
  console.log('MainAppPage渲染, currentView:', currentView, 'onViewChange:', onViewChange);
  const { isMobile, isTablet } = useResponsiveLayout();
  
  const handleViewChange = (view) => {
    console.log('视图切换请求:', view);
    onViewChange(view);
  };

  // 全屏页面，不需要侧边栏
  const fullScreenViews = ['workspace', 'chat', 'pomodoro', 'projects', 'statistics', 'admin'];

  if (fullScreenViews.includes(currentView)) {
    return (
      <div className="h-screen bg-transparent">
        {currentView === 'workspace' && <WorkspacePage onViewChange={handleViewChange} />}
        {currentView === 'chat' && <ChatPage onViewChange={handleViewChange} />}
        {currentView === 'pomodoro' && <PomodoroPage onViewChange={handleViewChange} />}
        {currentView === 'projects' && <ProjectPage onViewChange={handleViewChange} />}
        {currentView === 'statistics' && <NotesStatistics />}
        {currentView === 'admin' && <AdminDashboard />}

        {/* 浮动番茄钟按钮 - 除了番茄钟页面和工作空间外的所有页面都显示 */}
        {currentView !== 'pomodoro' && currentView !== 'workspace' && <FloatingPomodoroButton />}
      </div>
    );
  }

  // 移动端布局
  if (isMobile) {
    return (
      <div className="flex flex-col h-screen bg-transparent relative">
        {/* 响应式侧边栏 */}
        <ResponsiveSidebar currentView={currentView} onViewChange={handleViewChange} />
        
        {/* 主内容区域 */}
        <main className="flex-1 overflow-hidden">
          {currentView === 'notes' ? (
            <div className="h-full flex flex-col">
              {/* 移动端：笔记列表和编辑器垂直堆叠 */}
              <div className="h-1/3 border-b border-gray-200">
                <NoteList />
              </div>
              <div className="flex-1">
                <Editor />
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col">
              {/* 移动端：待办列表和编辑器垂直堆叠 */}
              <div className="h-1/3 border-b border-gray-200">
                <TodoList />
              </div>
              <div className="flex-1">
                <TodoEditor />
              </div>
            </div>
          )}
        </main>
        
        <FloatingPomodoroButton />
      </div>
    );
  }

  // 平板端布局
  if (isTablet) {
    return (
      <div className="flex h-screen bg-transparent">
        {/* 响应式侧边栏 */}
        <ResponsiveSidebar currentView={currentView} onViewChange={handleViewChange} />
        
        {/* 主内容区域 */}
        <main className="flex-1 flex overflow-hidden">
          {currentView === 'notes' ? (
            <>
              <div className="w-1/3 border-r border-gray-200">
                <NoteList />
              </div>
              <div className="flex-1">
                <Editor />
              </div>
            </>
          ) : (
            <>
              <div className="w-1/3 border-r border-gray-200">
                <TodoList />
              </div>
              <div className="flex-1">
                <TodoEditor />
              </div>
            </>
          )}
        </main>
        
        <FloatingPomodoroButton />
      </div>
    );
  }

  // 桌面端布局（保持原有三栏布局）
  return (
    <div className="flex h-screen bg-transparent">
      {/* 侧边栏 */}
      <Sidebar currentView={currentView} onViewChange={handleViewChange} />

      {currentView === 'notes' ? (
        <>
          {/* Note List */}
          <NoteList />
          {/* Editor */}
          <Editor />
          {/* Editor Help */}
          <EditorHelp />
        </>
      ) : (
        <>
          {/* Todo List */}
          <TodoList />
          {/* Todo Editor */}
          <TodoEditor />
        </>
      )}
      
      <FloatingPomodoroButton />
    </div>
  );
};

export default MainAppPage;
