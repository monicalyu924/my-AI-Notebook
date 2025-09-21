import React, { useState, useEffect } from 'react';
import { Brain, TrendingUp, AlertTriangle, Lightbulb, X, RefreshCw, Filter, Clock } from 'lucide-react';
import { useAIProjectStore } from '../../store/aiProjectStore';
import { useProjectBoardStore } from '../../store/projectBoardStore';

const AIInsightsPanel = ({ isOpen, onClose }) => {
  const [filter, setFilter] = useState('all'); // all, risk, opportunity, suggestion
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const { 
    aiInsights, 
    isAIProcessing, 
    generateAIInsights,
    clearAIInsights 
  } = useAIProjectStore();
  
  const { currentBoard } = useProjectBoardStore();

  useEffect(() => {
    if (isOpen && aiInsights.length === 0) {
      handleGenerateInsights();
    }
  }, [isOpen]);

  const handleGenerateInsights = async () => {
    if (!currentBoard) return;
    
    setIsRefreshing(true);
    await generateAIInsights(currentBoard);
    setIsRefreshing(false);
  };

  const filteredInsights = filter === 'all' 
    ? aiInsights 
    : aiInsights.filter(insight => insight.type === filter);

  const getInsightIcon = (type) => {
    switch (type) {
      case 'risk':
        return AlertTriangle;
      case 'opportunity':
        return TrendingUp;
      case 'suggestion':
        return Lightbulb;
      default:
        return Brain;
    }
  };

  const getInsightColor = (type) => {
    switch (type) {
      case 'risk':
        return 'text-red-500 bg-red-50 border-red-200';
      case 'opportunity':
        return 'text-green-500 bg-green-50 border-green-200';
      case 'suggestion':
        return 'text-blue-500 bg-blue-50 border-blue-200';
      default:
        return 'text-gray-500 bg-gray-50 border-gray-200';
    }
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.8) return 'text-green-600 bg-green-100';
    if (confidence >= 0.6) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const filterOptions = [
    { key: 'all', label: '全部洞察', icon: Brain },
    { key: 'risk', label: '风险识别', icon: AlertTriangle },
    { key: 'opportunity', label: '机会发现', icon: TrendingUp },
    { key: 'suggestion', label: '智能建议', icon: Lightbulb }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">AI 洞察分析</h2>
              <p className="text-sm text-gray-600">基于项目数据的智能分析</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleGenerateInsights}
              disabled={isAIProcessing || isRefreshing}
              className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>重新分析</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <div className="flex space-x-2">
              {filterOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.key}
                    onClick={() => setFilter(option.key)}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                      filter === option.key
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm">{option.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isAIProcessing && aiInsights.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center animate-pulse">
                  <Brain className="w-8 h-8 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                  <div className="w-3 h-3 bg-yellow-600 rounded-full animate-ping" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-2">AI正在分析项目数据</h3>
              <p className="text-gray-600 text-center max-w-md">
                正在运用机器学习算法分析项目进度、团队工作负载和历史数据，为您生成精准洞察...
              </p>
              <div className="mt-4 flex space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}} />
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}} />
              </div>
            </div>
          ) : filteredInsights.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <Brain className="w-16 h-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium mb-2">暂无洞察数据</h3>
              <p className="text-center max-w-md mb-4">
                {currentBoard ? '点击"重新分析"按钮来获取AI洞察' : '请先选择一个项目看板'}
              </p>
              {currentBoard && (
                <button
                  onClick={handleGenerateInsights}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>开始分析</span>
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredInsights.map((insight) => {
                const Icon = getInsightIcon(insight.type);
                const colorClass = getInsightColor(insight.type);
                
                return (
                  <div key={insight.id} className={`p-4 rounded-xl border-2 ${colorClass}`}>
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        <Icon className="w-6 h-6" />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-gray-900">{insight.title}</h3>
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getConfidenceColor(insight.confidence)}`}>
                              {Math.round(insight.confidence * 100)}% 置信度
                            </span>
                            <Clock className="w-4 h-4 text-gray-400" />
                            <span className="text-xs text-gray-500">
                              {new Date(insight.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                        </div>
                        
                        <p className="text-gray-700 mb-3">{insight.description}</p>
                        
                        {insight.relatedCards && insight.relatedCards.length > 0 && (
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-gray-500">相关卡片:</span>
                            {insight.relatedCards.map((cardId, index) => (
                              <span key={cardId} className="text-xs bg-gray-100 px-2 py-1 rounded">
                                卡片 {index + 1}
                              </span>
                            ))}
                          </div>
                        )}
                        
                        <div className="mt-3 flex items-center justify-between">
                          <div className="flex space-x-2">
                            <button className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                              查看详情
                            </button>
                            <button className="text-xs text-gray-500 hover:text-gray-700">
                              标记已读
                            </button>
                          </div>
                          
                          <div className="flex items-center space-x-1">
                            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                            <span className="text-xs text-gray-500">AI生成</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center space-x-2">
              <Brain className="w-4 h-4" />
              <span>基于机器学习算法分析</span>
            </div>
            <div className="flex items-center space-x-4">
              <span>{filteredInsights.length} 条洞察</span>
              <button
                onClick={clearAIInsights}
                className="text-red-600 hover:text-red-700"
              >
                清除所有
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIInsightsPanel;