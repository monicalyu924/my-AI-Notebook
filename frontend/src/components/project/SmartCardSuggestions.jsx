import React, { useState, useEffect } from 'react';
import { Sparkles, Plus, Clock, User, Tag, X, ChevronRight, Lightbulb, TrendingUp } from 'lucide-react';
import { useProjectBoardStore } from '../../store/projectBoardStore';
import { useAIProjectStore } from '../../store/aiProjectStore';
import { aiEventSystem } from '../../utils/aiEventSystem';

const SmartCardSuggestions = ({ isOpen, onClose, listId }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState(null);
  
  const { currentBoard } = useProjectBoardStore();
  const { addAIInsight } = useAIProjectStore();

  useEffect(() => {
    if (isOpen) {
      generateSmartSuggestions();
    }
  }, [isOpen, currentBoard, listId]);

  const generateSmartSuggestions = async () => {
    if (!currentBoard) return;
    
    setIsGenerating(true);
    
    // 模拟AI分析生成建议
    setTimeout(() => {
      const newSuggestions = analyzeBoardAndGenerateSuggestions();
      setSuggestions(newSuggestions);
      setIsGenerating(false);
    }, 1500);
  };

  const analyzeBoardAndGenerateSuggestions = () => {
    const suggestions = [];
    
    // 分析当前看板数据
    const allCards = currentBoard.lists.flatMap(list => list.cards);
    const completedCards = currentBoard.lists
      .filter(list => list.title.includes('已完成'))
      .flatMap(list => list.cards);
    
    // 基于历史数据生成建议
    if (completedCards.length > 0) {
      const commonPatterns = analyzeCompletedTasks(completedCards);
      suggestions.push(...commonPatterns);
    }
    
    // 基于当前待办事项生成建议
    const pendingCards = currentBoard.lists
      .filter(list => list.title.includes('待办') || list.title.includes('进行中'))
      .flatMap(list => list.cards);
    
    if (pendingCards.length > 0) {
      const workflowSuggestions = analyzeWorkflowGaps(pendingCards);
      suggestions.push(...workflowSuggestions);
    }
    
    // 基于时间模式生成建议
    const timeBasedSuggestions = generateTimeBasedSuggestions();
    suggestions.push(...timeBasedSuggestions);
    
    return suggestions.slice(0, 5); // 限制建议数量
  };

  const analyzeCompletedTasks = (completedCards) => {
    const suggestions = [];
    
    // 分析常见任务类型
    const taskTypes = {};
    completedCards.forEach(card => {
      const type = categorizeTask(card.title);
      taskTypes[type] = (taskTypes[type] || 0) + 1;
    });
    
    // 找出最常见的任务类型
    const commonTypes = Object.entries(taskTypes)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3);
    
    commonTypes.forEach(([type, count]) => {
      if (count >= 2) {
        suggestions.push({
          id: `pattern-${type}`,
          type: 'pattern',
          title: `创建${getTypeLabel(type)}任务`,
          description: `基于历史数据，您经常创建${getTypeLabel(type)}类型的任务`,
          confidence: Math.min(0.9, count * 0.2),
          metadata: { type, count }
        });
      }
    });
    
    return suggestions;
  };

  const analyzeWorkflowGaps = (pendingCards) => {
    const suggestions = [];
    
    // 检查是否有阻塞任务
    const blockingTasks = pendingCards.filter(card => 
      card.title.toLowerCase().includes('阻塞') || 
      card.title.toLowerCase().includes('依赖')
    );
    
    if (blockingTasks.length > 0) {
      suggestions.push({
        id: 'workflow-unblock',
        type: 'workflow',
        title: '解决阻塞任务',
        description: `检测到${blockingTasks.length}个任务可能被阻塞，建议优先处理`,
        confidence: 0.85,
        metadata: { blockingCount: blockingTasks.length }
      });
    }
    
    // 检查是否有即将到期的任务
    const upcomingDeadlines = pendingCards.filter(card => {
      if (!card.dueDate) return false;
      const dueDate = new Date(card.dueDate);
      const today = new Date();
      const daysUntil = Math.floor((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return daysUntil > 0 && daysUntil <= 3;
    });
    
    if (upcomingDeadlines.length > 0) {
      suggestions.push({
        id: 'workflow-deadline',
        type: 'workflow',
        title: '处理即将到期的任务',
        description: `${upcomingDeadlines.length}个任务将在3天内到期`,
        confidence: 0.9,
        metadata: { deadlineCount: upcomingDeadlines.length }
      });
    }
    
    return suggestions;
  };

  const generateTimeBasedSuggestions = () => {
    const suggestions = [];
    const hour = new Date().getHours();
    const day = new Date().getDay();
    
    // 基于时间的建议
    if (hour >= 9 && hour <= 11) {
      suggestions.push({
        id: 'time-morning',
        type: 'time',
        title: '规划今日重点任务',
        description: '上午是规划一天工作的好时机',
        confidence: 0.8,
        metadata: { timeOfDay: 'morning' }
      });
    }
    
    if (day === 1) { // 周一
      suggestions.push({
        id: 'time-weekly-planning',
        type: 'time',
        title: '制定本周计划',
        description: '新的一周开始，建议制定周计划',
        confidence: 0.85,
        metadata: { dayOfWeek: 'monday' }
      });
    }
    
    return suggestions;
  };

  const categorizeTask = (title) => {
    const lowerTitle = title.toLowerCase();
    
    if (lowerTitle.includes('设计') || lowerTitle.includes('ui')) return 'design';
    if (lowerTitle.includes('开发') || lowerTitle.includes('编码')) return 'development';
    if (lowerTitle.includes('测试') || lowerTitle.includes('bug')) return 'testing';
    if (lowerTitle.includes('文档') || lowerTitle.includes('说明')) return 'documentation';
    if (lowerTitle.includes('会议') || lowerTitle.includes('讨论')) return 'meeting';
    
    return 'other';
  };

  const getTypeLabel = (type) => {
    const labels = {
      design: '设计',
      development: '开发',
      testing: '测试',
      documentation: '文档',
      meeting: '会议',
      other: '其他'
    };
    return labels[type] || '任务';
  };

  const applySuggestion = (suggestion) => {
    if (!currentBoard || !listId) return;
    
    const { useProjectBoardStore } = require('../../store/projectBoardStore');
    const { createCard } = useProjectBoardStore.getState();
    
    let cardTitle = '';
    let cardDescription = '';
    
    switch (suggestion.type) {
      case 'pattern':
        cardTitle = `新的${getTypeLabel(suggestion.metadata.type)}任务`;
        cardDescription = `基于AI分析创建的${getTypeLabel(suggestion.metadata.type)}任务`;
        break;
      case 'workflow':
        if (suggestion.id === 'workflow-unblock') {
          cardTitle = '解决项目阻塞问题';
          cardDescription = '识别和解决当前项目中的阻塞任务';
        } else if (suggestion.id === 'workflow-deadline') {
          cardTitle = '紧急任务处理';
          cardDescription = `处理${suggestion.metadata.deadlineCount}个即将到期的任务`;
        }
        break;
      case 'time':
        if (suggestion.id === 'time-morning') {
          cardTitle = '今日重点任务规划';
          cardDescription = '规划和安排今天最重要的工作任务';
        } else if (suggestion.id === 'time-weekly-planning') {
          cardTitle = '本周工作计划';
          cardDescription = '制定本周的工作目标和计划安排';
        }
        break;
      default:
        cardTitle = suggestion.title;
        cardDescription = suggestion.description;
    }
    
    createCard(currentBoard.id, listId, cardTitle);
    
    // 添加AI洞察
    addAIInsight({
      id: `suggestion-applied-${Date.now()}`,
      type: 'suggestion',
      title: '智能建议已应用',
      description: `基于AI分析创建了任务: ${cardTitle}`,
      confidence: suggestion.confidence,
      timestamp: new Date().toISOString(),
      relatedCards: []
    });
    
    setSelectedSuggestion(suggestion);
    setTimeout(() => setSelectedSuggestion(null), 2000);
  };

  const getIcon = (type) => {
    switch (type) {
      case 'pattern':
        return TrendingUp;
      case 'workflow':
        return Lightbulb;
      case 'time':
        return Clock;
      default:
        return Sparkles;
    }
  };

  const getColor = (type) => {
    switch (type) {
      case 'pattern':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'workflow':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'time':
        return 'text-purple-600 bg-purple-50 border-purple-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl h-[70vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">智能卡片建议</h2>
              <p className="text-sm text-gray-600">基于AI分析的个性化建议</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isGenerating ? (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center animate-pulse">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                  <div className="w-3 h-3 bg-yellow-600 rounded-full animate-ping" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-2">AI正在分析项目数据</h3>
              <p className="text-gray-600 text-center max-w-md">
                正在分析历史任务、工作模式和项目进度，为您生成个性化建议...
              </p>
              <div className="mt-4 flex space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}} />
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}} />
              </div>
            </div>
          ) : suggestions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <Sparkles className="w-16 h-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium mb-2">暂无建议</h3>
              <p className="text-center max-w-md">
                当前项目数据不足以生成个性化建议，继续添加任务以获得更多AI建议
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {suggestions.map((suggestion) => {
                const Icon = getIcon(suggestion.type);
                const colorClass = getColor(suggestion.type);
                
                return (
                  <div key={suggestion.id} className={`p-4 rounded-xl border-2 ${colorClass} transition-all hover:shadow-md`}>
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        <Icon className="w-6 h-6" />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-gray-900">{suggestion.title}</h3>
                          <span className="text-xs text-gray-500">
                            {Math.round(suggestion.confidence * 100)}% 置信度
                          </span>
                        </div>
                        
                        <p className="text-gray-700 mb-3">{suggestion.description}</p>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2 text-xs text-gray-500">
                            <Tag className="w-3 h-3" />
                            <span>{getTypeLabel(suggestion.type)}</span>
                          </div>
                          
                          <button
                            onClick={() => applySuggestion(suggestion)}
                            className="flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                          >
                            <Plus className="w-3 h-3" />
                            <span>应用建议</span>
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    {selectedSuggestion?.id === suggestion.id && (
                      <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center space-x-2 text-green-700">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                          <span className="text-sm font-medium">建议已应用！</span>
                        </div>
                      </div>
                    )}
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
              <Sparkles className="w-4 h-4" />
              <span>基于机器学习算法分析</span>
            </div>
            <button
              onClick={generateSmartSuggestions}
              className="flex items-center space-x-1 px-3 py-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <Sparkles className="w-3 h-3" />
              <span>重新生成</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SmartCardSuggestions;