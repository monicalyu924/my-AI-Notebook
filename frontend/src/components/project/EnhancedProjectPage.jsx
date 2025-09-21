import React, { useState, useEffect } from 'react';
import { Board } from '../board';
import { useProjects } from '../../context/ProjectContext';
import { useAIProjectStore } from '../../store/aiProjectStore';
import { Plus, Layout, Clock, Users, BarChart3, Settings, Filter, Search, Brain, TrendingUp, Bot } from 'lucide-react';
import UnifiedLayout from '../layout/UnifiedLayout';
import { SparklesCore } from '../ui/sparkles';
import AIInsightsPanel from './AIInsightsPanel';
import AIPredictionsPanel from './AIPredictionsPanel';
import AIAssistant from './AIAssistant';
import AutoAssignmentPanel from './AutoAssignmentPanel';

const EnhancedProjectPage = ({ onViewChange }) => {
  const { 
    currentBoard, 
    boards, 
    loading,
    loadBoards, 
    loadBoardWithData,
    createBoard 
  } = useProjects();
  const { 
    aiInsights, 
    aiPredictions, 
    aiAssistantOpen,
    setAIAssistantOpen,
    generateAIInsights,
    generateAIPredictions
  } = useAIProjectStore();
  
  const [activeTab, setActiveTab] = useState('board');
  const [showNewBoardModal, setShowNewBoardModal] = useState(false);
  const [showAIInsights, setShowAIInsights] = useState(false);
  const [showAIPredictions, setShowAIPredictions] = useState(false);
  const [showAutoAssignment, setShowAutoAssignment] = useState(false);
  const [newBoardTitle, setNewBoardTitle] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Add responsive layout detection
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Load boards on component mount
  useEffect(() => {
    loadBoards();
  }, [loadBoards]);

  const handleCreateBoard = async () => {
    if (newBoardTitle.trim()) {
      try {
        await createBoard({
          name: newBoardTitle.trim(),
          description: '',
          color: '#3B82F6'
        });
        setNewBoardTitle('');
        setShowNewBoardModal(false);
      } catch (error) {
        console.error('Failed to create board:', error);
      }
    }
  };

  const getProjectStats = () => {
    if (!currentBoard) return { total: 0, todo: 0, inProgress: 0, completed: 0 };
    
    const todo = currentBoard.lists.find(l => l.title.includes('待办'))?.cards.length || 0;
    const inProgress = currentBoard.lists.find(l => l.title.includes('进行中'))?.cards.length || 0;
    const completed = currentBoard.lists.find(l => l.title.includes('已完成'))?.cards.length || 0;
    const total = currentBoard.lists.reduce((sum, list) => sum + list.cards.length, 0);
    
    return { total, todo, inProgress, completed };
  };

  const stats = getProjectStats();
  const completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  // 使用useEffect来检查项目进度并触发AI事件
  useEffect(() => {
    if (currentBoard && currentBoard.lists && currentBoard.lists.length > 0) {
      // 检查项目进度逻辑可以在这里实现
      console.log('Current board loaded:', currentBoard);
    }
  }, [currentBoard]);

  return (
    <UnifiedLayout showGradient={false} className="bg-gradient-to-br from-gray-50 to-blue-50 relative overflow-hidden">
      {/* Background Sparkles for AI Project Management */}
      <div className="absolute inset-0 w-full h-full opacity-20 pointer-events-none">
        <SparklesCore
          background="transparent"
          minSize={0.6}
          maxSize={2}
          particleDensity={150}
          className="w-full h-full"
          particleColor="#3B82F6"
          speed={1}
        />
      </div>
      
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 p-6 mb-6 rounded-xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => {
                console.log('返回按钮被点击');
                onViewChange?.('workspace');
              }}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              ← 返回工作空间
            </button>
            <h1 className="text-3xl font-bold text-gray-900">项目管理</h1>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* AI功能按钮 */}
            <div className="flex items-center space-x-2 bg-gradient-to-r from-purple-100 to-blue-100 rounded-lg p-1">
              <button
                onClick={() => setShowAIInsights(true)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-md transition-colors ${
                  aiInsights.length > 0 
                    ? 'bg-white text-purple-600 shadow-sm' 
                    : 'text-purple-600 hover:text-purple-700 hover:bg-white/50'
                }`}
                title="AI洞察分析"
              >
                <Brain className="w-4 h-4" />
                {aiInsights.length > 0 && (<span className="text-xs font-medium bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded-full">{aiInsights.length}</span>)}
              </button>
              
              <button
                onClick={() => setShowAIPredictions(true)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-md transition-colors ${
                  aiPredictions.length > 0
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-blue-600 hover:text-blue-700 hover:bg-white/50'
                }`}
                title="AI预测分析"
              >
                <TrendingUp className="w-4 h-4" />
                {aiPredictions.length > 0 && (<span className="text-xs font-medium bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full">{aiPredictions.length}</span>)}
              </button>
              
              <button
                onClick={() => setShowAutoAssignment(true)}
                className="flex items-center space-x-2 px-3 py-2 rounded-md text-orange-600 hover:text-orange-700 hover:bg-white/50 transition-colors"
                title="智能分配"
              >
                <Users className="w-4 h-4" />
              </button>
              
              <button
                onClick={() => setAIAssistantOpen(true)}
                className="flex items-center space-x-2 px-3 py-2 rounded-md text-green-600 hover:text-green-700 hover:bg-white/50 transition-colors"
                title="AI助手"
              >
                <Bot className="w-4 h-4" />
              </button>
            </div>
            
            <button
              onClick={() => setShowNewBoardModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>新建看板</span>
            </button>
            
            <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
              {[
                { id: 'board', icon: Layout, label: '看板' },
                { id: 'timeline', icon: Clock, label: '时间线' },
                { id: 'team', icon: Users, label: '团队' },
                { id: 'analytics', icon: BarChart3, label: '分析' }
              ].map(({ id, icon: Icon, label }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md transition-colors ${
                    activeTab === id
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Project Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">总任务</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Layout className="w-8 h-8 text-blue-200" />
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm">待办</p>
                <p className="text-2xl font-bold">{stats.todo}</p>
              </div>
              <Clock className="w-8 h-8 text-orange-200" />
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-lg p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-100 text-sm">进行中</p>
                <p className="text-2xl font-bold">{stats.inProgress}</p>
              </div>
              <Users className="w-8 h-8 text-yellow-200" />
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">已完成</p>
                <p className="text-2xl font-bold">{stats.completed}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-green-200" />
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">项目进度</span>
            <span className="text-sm text-gray-600">{completionRate}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${completionRate}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {activeTab === 'board' && (
          <div className="h-full">
            <Board />
          </div>
        )}
        
        {activeTab === 'timeline' && (
          <div className="h-full bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
            <div className={`bg-white rounded-2xl shadow-lg text-center max-w-md mx-4 ${
              isMobile ? 'p-6' : 'p-8'
            }`}>
              <div className="bg-blue-100 rounded-full p-4 w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                <Clock className="w-10 h-10 text-blue-600" />
              </div>
              <h3 className={`font-bold text-gray-800 mb-3 ${
                isMobile ? 'text-xl' : 'text-2xl'
              }`}>时间线视图</h3>
              <p className="text-gray-600 mb-4 leading-relaxed">
                以甘特图形式展示项目时间线和任务依赖关系，帮助您更好地规划项目进度。
              </p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-yellow-800 flex items-center justify-center">
                  <span className="mr-2">🚧</span>
                  功能开发中，敬请期待
                </p>
              </div>
              <div className="flex justify-center space-x-2 text-xs text-gray-500">
                <span className="bg-gray-100 px-2 py-1 rounded">甘特图</span>
                <span className="bg-gray-100 px-2 py-1 rounded">依赖关系</span>
                <span className="bg-gray-100 px-2 py-1 rounded">进度跟踪</span>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'team' && (
          <div className="h-full bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
            <div className={`bg-white rounded-2xl shadow-lg text-center max-w-md mx-4 ${
              isMobile ? 'p-6' : 'p-8'
            }`}>
              <div className="bg-green-100 rounded-full p-4 w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                <Users className="w-10 h-10 text-green-600" />
              </div>
              <h3 className={`font-bold text-gray-800 mb-3 ${
                isMobile ? 'text-xl' : 'text-2xl'
              }`}>团队管理</h3>
              <p className="text-gray-600 mb-4 leading-relaxed">
                管理团队成员、分配任务、设置权限，让团队协作更加高效有序。
              </p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-yellow-800 flex items-center justify-center">
                  <span className="mr-2">🚧</span>
                  功能开发中，敬请期待
                </p>
              </div>
              <div className="flex justify-center space-x-2 text-xs text-gray-500">
                <span className="bg-gray-100 px-2 py-1 rounded">成员管理</span>
                <span className="bg-gray-100 px-2 py-1 rounded">权限设置</span>
                <span className="bg-gray-100 px-2 py-1 rounded">任务分配</span>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'analytics' && (
          <div className="h-full bg-gradient-to-br from-purple-50 to-pink-100 flex items-center justify-center">
            <div className={`bg-white rounded-2xl shadow-lg text-center max-w-md mx-4 ${
              isMobile ? 'p-6' : 'p-8'
            }`}>
              <div className="bg-purple-100 rounded-full p-4 w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                <BarChart3 className="w-10 h-10 text-purple-600" />
              </div>
              <h3 className={`font-bold text-gray-800 mb-3 ${
                isMobile ? 'text-xl' : 'text-2xl'
              }`}>数据分析</h3>
              <p className="text-gray-600 mb-4 leading-relaxed">
                通过可视化图表分析项目进度、团队效率和任务完成情况，助力数据驱动决策。
              </p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-yellow-800 flex items-center justify-center">
                  <span className="mr-2">🚧</span>
                  功能开发中，敬请期待
                </p>
              </div>
              <div className="flex justify-center space-x-2 text-xs text-gray-500">
                <span className="bg-gray-100 px-2 py-1 rounded">项目统计</span>
                <span className="bg-gray-100 px-2 py-1 rounded">效率分析</span>
                <span className="bg-gray-100 px-2 py-1 rounded">趋势图表</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* New Board Modal */}
      {showNewBoardModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-90vw">
            <h2 className="text-xl font-bold text-gray-900 mb-4">创建新看板</h2>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                看板名称
              </label>
              <input
                type="text"
                value={newBoardTitle}
                onChange={(e) => setNewBoardTitle(e.target.value)}
                placeholder="输入看板名称..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleCreateBoard();
                  }
                }}
              />
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={handleCreateBoard}
                disabled={!newBoardTitle.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                创建
              </button>
              <button
                onClick={() => {
                  setShowNewBoardModal(false);
                  setNewBoardTitle('');
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* AI Panels */}
      <AIInsightsPanel 
        isOpen={showAIInsights} 
        onClose={() => setShowAIInsights(false)} 
      />
      
      <AIPredictionsPanel 
        isOpen={showAIPredictions} 
        onClose={() => setShowAIPredictions(false)} 
      />
      
      <AIAssistant 
        isOpen={aiAssistantOpen} 
        onClose={() => setAIAssistantOpen(false)} 
      />
      
      <AutoAssignmentPanel 
        isOpen={showAutoAssignment} 
        onClose={() => setShowAutoAssignment(false)} 
      />
    </UnifiedLayout>
  );
};

export default EnhancedProjectPage;