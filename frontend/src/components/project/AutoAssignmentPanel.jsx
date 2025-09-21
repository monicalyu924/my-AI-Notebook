import React, { useState, useEffect } from 'react';
import { Users, UserPlus, TrendingUp, Clock, Target, X, RefreshCw, AlertCircle } from 'lucide-react';
import { useProjectBoardStore } from '../../store/projectBoardStore';
import { useAIProjectStore } from '../../store/aiProjectStore';
import { aiEventSystem } from '../../utils/aiEventSystem';

const AutoAssignmentPanel = ({ isOpen, onClose }) => {
  const [assignments, setAssignments] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedAssignments, setSelectedAssignments] = useState(new Set());
  
  const { currentBoard, updateCard } = useProjectBoardStore();
  const { addAIInsight } = useAIProjectStore();

  useEffect(() => {
    if (isOpen) {
      analyzeAndSuggestAssignments();
    }
  }, [isOpen, currentBoard]);

  const analyzeAndSuggestAssignments = async () => {
    if (!currentBoard) return;
    
    setIsAnalyzing(true);
    
    // 模拟AI分析
    setTimeout(() => {
      const suggestions = generateAssignmentSuggestions();
      setAssignments(suggestions);
      setIsAnalyzing(false);
    }, 2000);
  };

  const generateAssignmentSuggestions = () => {
    const suggestions = [];
    
    // 获取未分配的任务
    const unassignedCards = currentBoard.lists
      .flatMap(list => list.cards)
      .filter(card => !card.assignees || card.assignees.length === 0);
    
    if (unassignedCards.length === 0) return suggestions;
    
    // 获取所有成员
    const allMembers = extractMembersFromBoard(currentBoard);
    
    // 计算成员工作量
    const memberWorkload = calculateMemberWorkload(currentBoard, allMembers);
    
    // 为每个未分配任务找到最佳成员
    unassignedCards.forEach(card => {
      const bestMember = findBestMemberForCard(card, memberWorkload, allMembers);
      
      if (bestMember) {
        const workloadInfo = memberWorkload[bestMember] || { taskCount: 0, complexity: 'medium' };
        
        suggestions.push({
          id: `assignment-${card.id}-${bestMember}`,
          cardId: card.id,
          cardTitle: card.title,
          suggestedMember: bestMember,
          currentWorkload: workloadInfo.taskCount,
          confidence: calculateAssignmentConfidence(card, bestMember, workloadInfo),
          reasoning: generateAssignmentReasoning(card, bestMember, workloadInfo),
          metadata: {
            cardType: categorizeTask(card.title),
            workloadLevel: getWorkloadLevel(workloadInfo.taskCount),
            skillMatch: calculateSkillMatch(card.title, bestMember)
          }
        });
      }
    });
    
    return suggestions.sort((a, b) => b.confidence - a.confidence);
  };

  const extractMembersFromBoard = (board) => {
    const members = new Set();
    
    board.lists?.forEach(list => {
      list.cards?.forEach(card => {
        if (card.assignees) {
          card.assignees.forEach(member => members.add(member));
        }
      });
    });
    
    // 如果没有成员，返回默认成员
    if (members.size === 0) {
      return ['张三', '李四', '王五', '赵六'];
    }
    
    return Array.from(members);
  };

  const calculateMemberWorkload = (board, members) => {
    const workload = {};
    
    // 初始化
    members.forEach(member => {
      workload[member] = { taskCount: 0, complexity: 'medium' };
    });
    
    // 计算任务数量
    board.lists?.forEach(list => {
      list.cards?.forEach(card => {
        if (card.assignees) {
          card.assignees.forEach(member => {
            if (workload[member]) {
              workload[member].taskCount++;
            }
          });
        }
      });
    });
    
    return workload;
  };

  const findBestMemberForCard = (card, memberWorkload, members) => {
    let bestMember = null;
    let bestScore = -1;
    
    members.forEach(member => {
      const workload = memberWorkload[member] || { taskCount: 0 };
      
      // 计算分数（工作量越少分数越高）
      let score = 100 - (workload.taskCount * 10);
      
      // 技能匹配加分
      const skillMatch = calculateSkillMatch(card.title, member);
      score += skillMatch * 20;
      
      // 可用性加分
      if (workload.taskCount < 3) {
        score += 15;
      }
      
      if (score > bestScore) {
        bestScore = score;
        bestMember = member;
      }
    });
    
    return bestMember;
  };

  const calculateAssignmentConfidence = (card, member, workloadInfo) => {
    let confidence = 0.5; // 基础置信度
    
    // 工作量因素
    if (workloadInfo.taskCount < 2) {
      confidence += 0.3;
    } else if (workloadInfo.taskCount < 5) {
      confidence += 0.2;
    } else {
      confidence -= 0.1;
    }
    
    // 技能匹配因素
    const skillMatch = calculateSkillMatch(card.title, member);
    confidence += skillMatch * 0.2;
    
    return Math.min(0.95, confidence);
  };

  const calculateSkillMatch = (cardTitle, member) => {
    // 简单的技能匹配算法
    const title = cardTitle.toLowerCase();
    
    // 预定义的技能映射
    const skillMap = {
      '张三': ['设计', 'ui', '界面', '原型'],
      '李四': ['开发', '编码', '代码', '程序'],
      '王五': ['测试', '质量', 'bug', '缺陷'],
      '赵六': ['文档', '说明', '规范', '流程']
    };
    
    const memberSkills = skillMap[member] || [];
    
    let matchCount = 0;
    memberSkills.forEach(skill => {
      if (title.includes(skill.toLowerCase())) {
        matchCount++;
      }
    });
    
    return matchCount > 0 ? 0.8 : 0.3;
  };

  const generateAssignmentReasoning = (card, member, workloadInfo) => {
    const reasons = [];
    
    if (workloadInfo.taskCount < 2) {
      reasons.push('当前工作量较少');
    }
    
    const skillMatch = calculateSkillMatch(card.title, member);
    if (skillMatch > 0.5) {
      reasons.push('技能匹配度高');
    }
    
    if (workloadInfo.taskCount < 5) {
      reasons.push('有充足的时间处理新任务');
    }
    
    return reasons.join('，');
  };

  const getWorkloadLevel = (taskCount) => {
    if (taskCount < 2) return 'light';
    if (taskCount < 5) return 'moderate';
    return 'heavy';
  };

  const categorizeTask = (title) => {
    const lowerTitle = title.toLowerCase();
    
    if (lowerTitle.includes('设计') || lowerTitle.includes('ui')) return 'design';
    if (lowerTitle.includes('开发') || lowerTitle.includes('编码')) return 'development';
    if (lowerTitle.includes('测试') || lowerTitle.includes('bug')) return 'testing';
    if (lowerTitle.includes('文档') || lowerTitle.includes('说明')) return 'documentation';
    
    return 'general';
  };

  const toggleAssignment = (assignmentId) => {
    const newSelected = new Set(selectedAssignments);
    if (newSelected.has(assignmentId)) {
      newSelected.delete(assignmentId);
    } else {
      newSelected.add(assignmentId);
    }
    setSelectedAssignments(newSelected);
  };

  const applySelectedAssignments = () => {
    const selectedList = assignments.filter(a => selectedAssignments.has(a.id));
    
    selectedList.forEach(assignment => {
      const currentBoard = useProjectBoardStore.getState().currentBoard;
      if (!currentBoard) return;
      
      // 找到卡片所在的列表
      const listWithCard = currentBoard.lists.find(list => 
        list.cards.some(card => card.id === assignment.cardId)
      );
      
      if (listWithCard) {
        // 更新卡片分配
        const card = listWithCard.cards.find(c => c.id === assignment.cardId);
        if (card) {
          const updatedCard = {
            ...card,
            assignees: [assignment.suggestedMember]
          };
          
          updateCard(currentBoard.id, listWithCard.id, assignment.cardId, updatedCard);
          
          // 发送AI事件
          aiEventSystem.sendMemberEvent('assigned', {
            card: updatedCard,
            member: assignment.suggestedMember,
            reasoning: assignment.reasoning
          });
        }
      }
    });
    
    // 添加AI洞察
    addAIInsight({
      id: `auto-assignment-${Date.now()}`,
      type: 'suggestion',
      title: `自动分配了${selectedList.length}个任务`,
      description: '基于AI分析的智能任务分配已完成',
      confidence: 0.85,
      timestamp: new Date().toISOString(),
      relatedCards: selectedList.map(a => a.cardId)
    });
    
    // 清除选择并重新分析
    setSelectedAssignments(new Set());
    setTimeout(() => analyzeAndSuggestAssignments(), 1000);
  };

  const getIcon = (type) => {
    switch (type) {
      case 'design':
        return Target;
      case 'development':
        return TrendingUp;
      case 'testing':
        return AlertCircle;
      default:
        return Users;
    }
  };

  const getWorkloadColor = (level) => {
    switch (level) {
      case 'light':
        return 'text-green-600 bg-green-100';
      case 'moderate':
        return 'text-yellow-600 bg-yellow-100';
      case 'heavy':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-green-500 to-blue-600 rounded-lg">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">智能任务分配</h2>
              <p className="text-sm text-gray-600">基于工作负载和技能的自动分配</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={analyzeAndSuggestAssignments}
              disabled={isAnalyzing}
              className="flex items-center space-x-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isAnalyzing ? (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-600 rounded-full flex items-center justify-center animate-pulse">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-400 rounded-full flex items-center justify-center">
                  <div className="w-3 h-3 bg-green-600 rounded-full animate-ping" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-2">AI正在分析任务分配</h3>
              <p className="text-gray-600 text-center max-w-md">
                正在分析团队成员工作负载、技能匹配度和任务复杂度，为您生成最优分配方案...
              </p>
              <div className="mt-4 flex space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}} />
                <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}} />
              </div>
            </div>
          ) : assignments.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <Users className="w-16 h-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium mb-2">暂无分配建议</h3>
              <p className="text-center max-w-md mb-4">
                {currentBoard ? '所有任务都已分配，或当前数据不足以生成分配建议' : '请先选择一个项目看板'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-200 mb-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-blue-900">分配建议概览</h3>
                  <span className="text-sm text-blue-700">{assignments.length} 个待分配任务</span>
                </div>
              </div>
              
              {assignments.map((assignment) => {
                const Icon = getIcon(assignment.metadata.cardType);
                const isSelected = selectedAssignments.has(assignment.id);
                
                return (
                  <div key={assignment.id} className={`p-4 rounded-xl border-2 transition-all ${
                    isSelected 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                  }`}
                  >
                    <div className="flex items-start space-x-4">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleAssignment(assignment.id)}
                        className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      
                      <div className="flex-shrink-0">
                        <Icon className="w-6 h-6 text-gray-600" />
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-gray-900">{assignment.cardTitle}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            getConfidenceColor(assignment.confidence)
                          }`}>
                            {Math.round(assignment.confidence * 100)}% 匹配
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-4 mb-3">
                          <div className="flex items-center space-x-1">
                            <User className="w-4 h-4 text-gray-500" />
                            <span className="text-sm text-gray-700">{assignment.suggestedMember}</span>
                          </div>
                          
                          <div className="flex items-center space-x-1">
                            <Clock className="w-4 h-4 text-gray-500" />
                            <span className="text-sm text-gray-600">{assignment.currentWorkload} 个任务</span>
                          </div>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-2">{assignment.reasoning}</p>
                        
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          <span className={`px-2 py-1 rounded ${getWorkloadColor(assignment.metadata.workloadLevel)}`}>
                            {assignment.metadata.workloadLevel === 'light' ? '轻负载' :
                             assignment.metadata.workloadLevel === 'moderate' ? '中等负载' : '高负载'}
                          </span>
                          <span className="px-2 py-1 bg-gray-100 rounded">
                            技能匹配: {Math.round(assignment.metadata.skillMatch * 100)}%
                          </span>
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
        {assignments.length > 0 && (
          <div className="p-4 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                已选择 {selectedAssignments.size} 个分配建议
              </div>
              <button
                onClick={applySelectedAssignments}
                disabled={selectedAssignments.size === 0}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                <UserPlus className="w-4 h-4" />
                <span>应用选中分配</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AutoAssignmentPanel;