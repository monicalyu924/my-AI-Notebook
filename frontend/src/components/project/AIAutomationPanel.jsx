import React, { useState } from 'react';
import { Zap, Settings, ToggleLeft, ToggleRight, Plus, Edit3, Trash2, Clock, AlertCircle, CheckCircle, Play, Pause } from 'lucide-react';
import { useAIProjectStore } from '../../store/aiProjectStore';

const AIAutomationPanel = ({ isOpen, onClose }) => {
  const [showAddRule, setShowAddRule] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [newRule, setNewRule] = useState({
    name: '',
    trigger: '',
    action: '',
    enabled: true,
    conditions: []
  });

  const { aiAutomations, toggleAIAutomation, addAIAutomation, removeAIAutomation } = useAIProjectStore();

  const automationTemplates = [
    {
      name: '自动移动逾期卡片',
      description: '当卡片逾期超过3天时，自动移动到"需要关注"列表',
      trigger: 'card_overdue',
      action: 'move_card',
      icon: Clock,
      color: 'text-orange-600 bg-orange-50'
    },
    {
      name: '智能分配任务',
      description: '基于团队成员工作负载自动分配新任务',
      trigger: 'new_card_created',
      action: 'assign_member',
      icon: Settings,
      color: 'text-blue-600 bg-blue-50'
    },
    {
      name: '完成度预警',
      description: '项目进度低于预期时发送预警通知',
      trigger: 'progress_below_threshold',
      action: 'send_notification',
      icon: AlertCircle,
      color: 'text-red-600 bg-red-50'
    },
    {
      name: '自动归档已完成任务',
      description: '任务完成后7天自动归档到历史记录',
      trigger: 'card_completed',
      action: 'archive_card',
      icon: CheckCircle,
      color: 'text-green-600 bg-green-50'
    }
  ];

  const handleToggleAutomation = (id) => {
    toggleAIAutomation(id);
  };

  const handleAddRule = () => {
    if (newRule.name && newRule.trigger && newRule.action) {
      const automation = {
        id: Date.now().toString(),
        name: newRule.name,
        trigger: newRule.trigger,
        action: newRule.action,
        enabled: newRule.enabled,
        conditions: newRule.conditions || [],
        lastExecuted: undefined
      };
      
      addAIAutomation(automation);
      setShowAddRule(false);
      setNewRule({ name: '', trigger: '', action: '', enabled: true, conditions: [] });
    }
  };

  const getTriggerIcon = (trigger) => {
    switch (trigger) {
      case 'card_overdue':
        return Clock;
      case 'new_card_created':
        return Plus;
      case 'progress_below_threshold':
        return AlertCircle;
      case 'card_completed':
        return CheckCircle;
      default:
        return Settings;
    }
  };

  const getActionColor = (action) => {
    switch (action) {
      case 'move_card':
        return 'text-blue-600';
      case 'assign_member':
        return 'text-green-600';
      case 'send_notification':
        return 'text-orange-600';
      case 'archive_card':
        return 'text-gray-600';
      default:
        return 'text-gray-600';
    }
  };

  const getExecutionStatus = (automation) => {
    if (!automation.enabled) return { text: '已停用', color: 'text-gray-500 bg-gray-100' };
    if (automation.lastExecuted) return { text: '运行中', color: 'text-green-600 bg-green-100' };
    return { text: '待运行', color: 'text-blue-600 bg-blue-100' };
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-lg">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">AI 自动化引擎</h2>
              <p className="text-sm text-gray-600">智能规则自动化管理</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowAddRule(true)}
              className="flex items-center space-x-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>新建规则</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Quick Templates */}
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">推荐自动化模板</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4"
            {automationTemplates.map((template, index) => {
              const Icon = template.icon;
              return (
                <div key={index} className={`p-4 rounded-xl border-2 ${template.color} cursor-pointer hover:shadow-md transition-all`}
                  onClick={() => {
                    setNewRule({
                      name: template.name,
                      trigger: template.trigger,
                      action: template.action,
                      enabled: true,
                      conditions: []
                    });
                    setShowAddRule(true);
                  }}
                >
                  <div className="flex items-start space-x-3">
                    <Icon className="w-6 h-6 flex-shrink-0" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-1">{template.name}</h4>
                      <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                      <div className="flex items-center space-x-2"
                        <span className="text-xs bg-white px-2 py-1 rounded">{template.trigger}</span>
                        <span className="text-xs">→</span>
                        <span className="text-xs bg-white px-2 py-1 rounded">{template.action}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Current Automations */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">当前自动化规则</h3>
            
            {aiAutomations.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Zap className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h4 className="text-lg font-medium mb-2">暂无自动化规则</h4>
                <p className="text-sm">从上方模板中选择一个开始配置您的自动化规则</p>
              </div>
            ) : (
              <div className="space-y-4">
                {aiAutomations.map((automation) => {
                  const TriggerIcon = getTriggerIcon(automation.trigger);
                  const executionStatus = getExecutionStatus(automation);
                  
                  return (
                    <div key={automation.id} className="p-4 rounded-xl border border-gray-200 hover:shadow-md transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="p-2 bg-gray-100 rounded-lg">
                            <TriggerIcon className="w-5 h-5 text-gray-600" />
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center space-x-3"
                              <h4 className="font-semibold text-gray-900">{automation.name}</h4>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${executionStatus.color}`}
                              >
                                {executionStatus.text}
                              </span>
                            </div>
                            
                            <div className="flex items-center space-x-2 mt-1 text-sm text-gray-600"
                              <span className="font-medium">触发条件:</span>
                              <span>{automation.trigger}</span>
                              <span>→</span>
                              <span className={getActionColor(automation.action)}>{automation.action}</span>
                            </div>
                            
                            {automation.lastExecuted && (
                              <div className="flex items-center space-x-1 mt-1 text-xs text-gray-500"
                                <Clock className="w-3 h-3" />
                                <span>最后执行: {new Date(automation.lastExecuted).toLocaleString()}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleToggleAutomation(automation.id)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            title={automation.enabled ? '停用规则' : '启用规则'}
                          >
                            {automation.enabled ? (
                              <ToggleRight className="w-5 h-5 text-green-600" />
                            ) : (
                              <ToggleLeft className="w-5 h-5 text-gray-400" />
                            )}
                          </button>
                          
                          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="编辑规则"
                            <Edit3 className="w-4 h-4 text-gray-500" />
                          </button>
                          
                          <button 
                            onClick={() => removeAIAutomation(automation.id)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="删除规则"
                          >
                            <Trash2 className="w-4 h-4 text-gray-500" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center space-x-2">
              <Zap className="w-4 h-4" />
              <span>自动化规则基于项目事件触发执行</span>
            </div>
            <div className="flex items-center space-x-4">
              <span>{aiAutomations.filter(a => a.enabled).length} 个已启用</span>
              <span>{aiAutomations.length} 个总规则</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAutomationPanel;