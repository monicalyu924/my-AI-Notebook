import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotes } from '../../context/NotesContext';
import { useProjects } from '../../context/ProjectContext';
import { useTodos } from '../../context/TodoContext';
import { Brain, Target, Clock, TrendingUp, Calendar, FileText, CheckCircle2, Users, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function WorkspaceDashboard({ onViewChange }) {
  const { user } = useAuth();
  const { notes, createNote } = useNotes();
  const { boards, createBoard } = useProjects();
  const { todos, createTodo, setSelectedTodo, setIsCreating } = useTodos();
  const navigate = useNavigate();

  const [aiInsights, setAiInsights] = useState([
    "根据您的工作模式，建议在上午专注于创意工作",
    "您有3个项目进度滞后，建议优先处理'UI设计'项目", 
    "本周笔记数量增长120%，知识积累效果显著",
    "建议为'AI工作台'项目设置更详细的里程碑"
  ]);

  // 使用useMemo缓存统计计算
  const workspaceStats = useMemo(() => {
    const completedTodosCount = todos.filter(todo => todo.completed).length;
    const weeklyProgress = todos.length > 0 ? (completedTodosCount / todos.length) * 100 : 0;

    return {
      totalNotes: notes.length,
      totalProjects: boards.length,
      completedTodos: completedTodosCount,
      totalTodos: todos.length,
      weeklyProgress: weeklyProgress,
      focusTime: Math.floor(Math.random() * 180) + 60 // 模拟专注时间
    };
  }, [notes.length, boards.length, todos]);

  // 移除旧的状态，直接使用计算结果
  // const [workspaceStats, setWorkspaceStats] = useState({ ... });

  const StatCard = React.memo(({ icon: Icon, title, value, subtitle, color = "blue" }) => {
    const colorClasses = {
      blue: { bg: 'bg-blue-50', text: 'text-blue-600' },
      green: { bg: 'bg-green-50', text: 'text-green-600' },
      purple: { bg: 'bg-purple-50', text: 'text-purple-600' },
      orange: { bg: 'bg-orange-50', text: 'text-orange-600' },
      red: { bg: 'bg-red-50', text: 'text-red-600' }
    };
    
    const colors = colorClasses[color] || colorClasses.blue;
    
    return (
      <div className="bg-white/95 backdrop-blur-sm rounded-xl p-4 sm:p-6 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300 float-animation glow-effect">
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-xs sm:text-sm font-medium text-gray-600 mb-1 truncate">{title}</p>
            <p className="text-lg sm:text-2xl font-bold text-gray-900">{value}</p>
            {subtitle && <p className="text-xs text-gray-500 mt-1 truncate">{subtitle}</p>}
          </div>
          <div className={`p-2 sm:p-3 rounded-lg ${colors.bg} flex-shrink-0 ml-2 shadow-md`}>
            <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${colors.text}`} />
          </div>
        </div>
      </div>
    );
  });

  // QuickAction 组件已移除，功能直接集成到主模块中

  const handleNewNote = useCallback(async () => {
    try {
      await createNote({
        title: 'Untitled',
        content: '',
        tags: []
      });
      onViewChange?.('notes');
    } catch (error) {
      console.error('创建笔记失败:', error);
    }
  }, [createNote, onViewChange]);

  const handleNewProject = useCallback(async () => {
    try {
      await createBoard({
        name: `新项目 ${new Date().toLocaleDateString()}`,
        description: '新创建的项目',
        color: '#3b82f6'
      });
      onViewChange?.('projects');
    } catch (error) {
      console.error('创建项目失败:', error);
    }
  }, [createBoard, onViewChange]);

  const handleNewTodo = useCallback(async () => {
    try {
      setSelectedTodo(null);
      setIsCreating(true);
      onViewChange?.('todos');
    } catch (error) {
      console.error('创建待办失败:', error);
    }
  }, [setSelectedTodo, setIsCreating, onViewChange]);

  const handleAIChat = useCallback(() => {
    onViewChange?.('chat');
  }, [onViewChange]);

  const handlePomodoro = useCallback(() => {
    onViewChange?.('pomodoro');
  }, [onViewChange]);

  const handleSettings = useCallback(() => {
    navigate('/settings');
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 头部欢迎区域 */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="mb-4 sm:mb-0">
              <h1 className="text-2xl sm:text-3xl font-bold mb-2">
                🤖 AI工作台
              </h1>
              <p className="text-blue-100 text-sm sm:text-base">
                欢迎回来，{user?.full_name || '用户'}！让我们开始高效的一天
              </p>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-sm text-blue-100">今天是</p>
              <p className="text-base sm:text-lg font-semibold">
                {new Date().toLocaleDateString('zh-CN', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* 统计卡片 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
          <StatCard
            icon={FileText}
            title="知识库"
            value={workspaceStats.totalNotes}
            subtitle="篇笔记"
            color="blue"
          />
          <StatCard
            icon={Target}
            title="项目管理"
            value={workspaceStats.totalProjects}
            subtitle="个活跃项目"
            color="green"
          />
          <StatCard
            icon={CheckCircle2}
            title="任务完成"
            value={`${workspaceStats.completedTodos}/${workspaceStats.totalTodos}`}
            subtitle={`完成率 ${Math.round(workspaceStats.weeklyProgress)}%`}
            color="purple"
          />
          <StatCard
            icon={Clock}
            title="专注时间"
            value={`${workspaceStats.focusTime}分钟`}
            subtitle="本周累计"
            color="orange"
          />
        </div>

        {/* 主要功能模块 */}
        <div className="mb-6 sm:mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">功能中心</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-6">
            {/* 记事本 */}
            <div className="group">
              <button
                onClick={handleNewNote}
                className="w-full p-6 bg-white rounded-2xl border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300 text-left group-hover:scale-105"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-blue-100 transition-colors">
                    <FileText className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">记事本</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">记录想法和灵感，管理知识库</p>
                  <div className="mt-3 text-xs text-blue-600 font-medium">
                    {workspaceStats.totalNotes} 篇笔记
                  </div>
                </div>
              </button>
            </div>

            {/* 项目管理 */}
            <div className="group">
              <button
                onClick={handleNewProject}
                className="w-full p-6 bg-white rounded-2xl border border-gray-200 hover:border-green-300 hover:shadow-lg transition-all duration-300 text-left group-hover:scale-105"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-green-100 transition-colors">
                    <Target className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">项目管理</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">看板式项目管理和任务跟踪</p>
                  <div className="mt-3 text-xs text-green-600 font-medium">
                    {workspaceStats.totalProjects} 个项目
                  </div>
                </div>
              </button>
            </div>

            {/* 待办事项 */}
            <div className="group">
              <button
                onClick={handleNewTodo}
                className="w-full p-6 bg-white rounded-2xl border border-gray-200 hover:border-purple-300 hover:shadow-lg transition-all duration-300 text-left group-hover:scale-105"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-purple-100 transition-colors">
                    <CheckCircle2 className="w-8 h-8 text-purple-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">待办事项</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">管理日常任务和待办清单</p>
                  <div className="mt-3 text-xs text-purple-600 font-medium">
                    {workspaceStats.completedTodos}/{workspaceStats.totalTodos} 已完成
                  </div>
                </div>
              </button>
            </div>

            {/* AI对话 */}
            <div className="group">
              <button
                onClick={handleAIChat}
                className="w-full p-6 bg-white rounded-2xl border border-gray-200 hover:border-orange-300 hover:shadow-lg transition-all duration-300 text-left group-hover:scale-105"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-orange-100 transition-colors">
                    <Brain className="w-8 h-8 text-orange-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">AI对话</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">与AI助手交流和协作</p>
                  <div className="mt-3 text-xs text-orange-600 font-medium">
                    智能助手
                  </div>
                </div>
              </button>
            </div>

            {/* 番茄工作法 */}
            <div className="group">
              <button
                onClick={handlePomodoro}
                className="w-full p-6 bg-white rounded-2xl border border-gray-200 hover:border-red-300 hover:shadow-lg transition-all duration-300 text-left group-hover:scale-105"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-red-100 transition-colors">
                    <Clock className="w-8 h-8 text-red-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">专注工作</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">番茄工作法提升专注力</p>
                  <div className="mt-3 text-xs text-red-600 font-medium">
                    {workspaceStats.focusTime}分钟
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 sm:gap-8">
          {/* AI智能建议 - 缩小版本 */}
          <div className="lg:col-span-3">
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 sm:p-5 border border-blue-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-1.5 bg-gradient-to-r from-purple-100 to-blue-100 rounded-lg">
                  <Brain className="w-5 h-5 text-purple-600" />
                </div>
                <h2 className="text-base sm:text-lg font-semibold text-gray-900">AI智能建议</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {aiInsights.slice(0, 4).map((insight, index) => (
                  <div key={index} className="flex items-start gap-2 p-3 bg-white/70 rounded-lg">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></div>
                    <p className="text-sm text-gray-700 leading-relaxed">{insight}</p>
                  </div>
                ))}
              </div>

              <button className="w-full mt-4 px-3 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-sm rounded-lg hover:from-blue-600 hover:to-purple-600 transition-colors">
                获取更多建议
              </button>
            </div>
          </div>

          {/* 应用设置 */}
          <div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-5">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">系统设置</h2>
              
              <button
                onClick={handleSettings}
                className="w-full flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-gray-600 hover:text-gray-800 transition-all border border-gray-200 hover:border-gray-300"
              >
                <Settings className="w-5 h-5 text-purple-600" />
                <div className="text-left">
                  <div className="font-medium text-sm">应用设置</div>
                  <div className="text-xs text-gray-500">配置和偏好</div>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* 最近活动 */}
        <div className="mt-6 sm:mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">最近活动</h2>
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center gap-3 text-xs sm:text-sm text-gray-600">
              <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
              <span className="flex-shrink-0">2小时前</span>
              <span className="truncate">完成了项目"AI工作台"的3个任务</span>
            </div>
            <div className="flex items-center gap-3 text-xs sm:text-sm text-gray-600">
              <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
              <span className="flex-shrink-0">4小时前</span>
              <span className="truncate">创建了新笔记"功能整合方案"</span>
            </div>
            <div className="flex items-center gap-3 text-xs sm:text-sm text-gray-600">
              <div className="w-2 h-2 bg-purple-500 rounded-full flex-shrink-0"></div>
              <span className="flex-shrink-0">1天前</span>
              <span className="truncate">与AI助手进行了产品设计讨论</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default WorkspaceDashboard;