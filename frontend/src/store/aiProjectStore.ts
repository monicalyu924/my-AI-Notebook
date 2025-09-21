import { create } from 'zustand';

export interface AIInsight {
  id: string;
  type: 'risk' | 'opportunity' | 'suggestion' | 'prediction';
  title: string;
  description: string;
  confidence: number;
  timestamp: string;
  relatedCards?: string[];
}

export interface AIPrediction {
  id: string;
  type: 'completion_date' | 'workload' | 'bottleneck';
  title: string;
  description: string;
  confidence: number;
  timestamp: string;
  data?: any;
}

export interface AIAutomation {
  id: string;
  name: string;
  trigger: string;
  action: string;
  enabled: boolean;
  lastExecuted?: string;
  conditions?: AICondition[];
}

export interface AICondition {
  field: string;
  operator: 'equals' | 'greater_than' | 'less_than' | 'contains' | 'exists';
  value: any;
}

export interface AIEvent {
  type: string;
  data: any;
  timestamp: string;
}

interface AIProjectState {
  aiInsights: AIInsight[];
  aiPredictions: AIPrediction[];
  aiAutomations: AIAutomation[];
  isAIProcessing: boolean;
  aiAssistantOpen: boolean;
  aiRecommendations: string[];
  
  // AI功能方法
  generateAIInsights: (boardData: any) => Promise<void>;
  generateAIPredictions: (boardData: any) => Promise<void>;
  addAIInsight: (insight: AIInsight) => void;
  addAIPrediction: (prediction: AIPrediction) => void;
  toggleAIAutomation: (id: string) => void;
  setAIAssistantOpen: (open: boolean) => void;
  setAIProcessing: (processing: boolean) => void;
  clearAIInsights: () => void;
  clearAIPredictions: () => void;
  
  // AI自动化规则
  addAIAutomation: (automation: AIAutomation) => void;
  removeAIAutomation: (id: string) => void;
  executeAIAutomation: (event: AIEvent) => void;
  processAIEvent: (event: AIEvent) => void;
  
  // AI助手对话
  aiChatMessages: AIChatMessage[];
  addAIChatMessage: (message: AIChatMessage) => void;
  clearAIChat: () => void;
}

export interface AIChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  context?: string;
}

export const useAIProjectStore = create<AIProjectState>((set, get) => ({
  aiInsights: [],
  aiPredictions: [],
  aiAutomations: [
    {
      id: '1',
      name: '自动移动逾期卡片',
      trigger: '卡片逾期超过3天',
      action: '移动到"需要关注"列表',
      enabled: true
    },
    {
      id: '2', 
      name: '智能分配任务',
      trigger: '新卡片创建且无负责人',
      action: '基于工作量自动分配',
      enabled: false
    },
    {
      id: '3',
      name: '完成度预测提醒',
      trigger: '项目进度低于预期',
      action: '发送预警通知',
      enabled: true
    }
  ],
  isAIProcessing: false,
  aiAssistantOpen: false,
  aiRecommendations: [],
  aiChatMessages: [],

  generateAIInsights: async (boardData) => {
    set({ isAIProcessing: true });
    
    // 模拟AI分析项目数据
    setTimeout(() => {
      const insights: AIInsight[] = [
        {
          id: '1',
          type: 'risk',
          title: '项目进度风险',
          description: '根据当前进度和任务完成率，项目可能延期2-3天',
          confidence: 0.85,
          timestamp: new Date().toISOString(),
          relatedCards: ['card1', 'card2']
        },
        {
          id: '2', 
          type: 'opportunity',
          title: '资源优化建议',
          description: '检测到张三的工作负载较低，可以分配更多任务',
          confidence: 0.72,
          timestamp: new Date().toISOString()
        },
        {
          id: '3',
          type: 'suggestion',
          title: '任务优先级调整',
          description: '建议将"用户界面设计"任务的优先级提高，因为它阻塞了后续开发',
          confidence: 0.91,
          timestamp: new Date().toISOString(),
          relatedCards: ['card3']
        }
      ];
      
      set({ 
        aiInsights: insights,
        isAIProcessing: false
      });
    }, 1500);
  },

  generateAIPredictions: async (boardData) => {
    set({ isAIProcessing: true });
    
    setTimeout(() => {
      const predictions: AIPrediction[] = [
        {
          id: '1',
          type: 'completion_date',
          title: '项目完成预测',
          description: '基于当前进度，项目预计将在2024年3月15日完成',
          confidence: 0.78,
          timestamp: new Date().toISOString(),
          data: { predictedDate: '2024-03-15', currentProgress: 65 }
        },
        {
          id: '2',
          type: 'workload',
          title: '工作量预测',
          description: '下周团队工作量将达到峰值，建议提前安排资源',
          confidence: 0.83,
          timestamp: new Date().toISOString(),
          data: { peakDays: ['2024-03-08', '2024-03-09'], estimatedHours: 120 }
        },
        {
          id: '3',
          type: 'bottleneck',
          title: '潜在瓶颈预警',
          description: '开发阶段可能出现资源瓶颈，建议增加前端开发人员',
          confidence: 0.69,
          timestamp: new Date().toISOString(),
          data: { bottleneckPhase: 'frontend', severity: 'medium' }
        }
      ];
      
      set({ 
        aiPredictions: predictions,
        isAIProcessing: false
      });
    }, 2000);
  },

  addAIInsight: (insight) => {
    set((state) => ({
      aiInsights: [insight, ...state.aiInsights]
    }));
  },

  addAIPrediction: (prediction) => {
    set((state) => ({
      aiPredictions: [prediction, ...state.aiPredictions]
    }));
  },

  toggleAIAutomation: (id) => {
    set((state) => ({
      aiAutomations: state.aiAutomations.map(auto => 
        auto.id === id ? { ...auto, enabled: !auto.enabled } : auto
      )
    }));
  },

  setAIAssistantOpen: (open) => {
    set({ aiAssistantOpen: open });
  },

  setAIProcessing: (processing) => {
    set({ isAIProcessing: processing });
  },

  clearAIInsights: () => {
    set({ aiInsights: [] });
  },

  clearAIPredictions: () => {
    set({ aiPredictions: [] });
  },

  addAIChatMessage: (message) => {
    set((state) => ({
      aiChatMessages: [...state.aiChatMessages, message]
    }));
  },

  clearAIChat: () => {
    set({ aiChatMessages: [] });
  },

  addAIAutomation: (automation) => {
    set((state) => ({
      aiAutomations: [...state.aiAutomations, automation]
    }));
  },

  removeAIAutomation: (id) => {
    set((state) => ({
      aiAutomations: state.aiAutomations.filter(auto => auto.id !== id)
    }));
  },

  executeAIAutomation: (event) => {
    const state = get();
    const enabledAutomations = state.aiAutomations.filter(auto => auto.enabled);
    
    enabledAutomations.forEach(automation => {
      if (shouldTriggerAutomation(automation, event)) {
        executeAutomationAction(automation, event);
        
        // 更新最后执行时间
        set((state) => ({
          aiAutomations: state.aiAutomations.map(auto => 
            auto.id === automation.id 
              ? { ...auto, lastExecuted: new Date().toISOString() }
              : auto
          )
        }));
      }
    });
  },

  processAIEvent: (event) => {
    // 处理AI事件，可以在这里添加事件日志或预处理
    get().executeAIAutomation(event);
  }
}));

// 判断是否应该触发自动化规则
function shouldTriggerAutomation(automation: AIAutomation, event: AIEvent): boolean {
  // 简单的触发器匹配逻辑
  const triggerMap: { [key: string]: string[] } = {
    'card_overdue': ['card_overdue', 'card_updated'],
    'new_card_created': ['card_created'],
    'progress_below_threshold': ['progress_updated'],
    'card_completed': ['card_completed'],
    'card_moved': ['card_moved'],
    'member_assigned': ['member_assigned']
  };
  
  const applicableEvents = triggerMap[automation.trigger] || [];
  return applicableEvents.includes(event.type);
}

// 执行自动化动作
function executeAutomationAction(automation: AIAutomation, event: AIEvent) {
  console.log(`执行自动化规则: ${automation.name}`, { automation, event });
  
  // 这里可以集成实际的项目管理操作
  const actionMap: { [key: string]: Function } = {
    'move_card': (data: any) => {
      console.log('移动卡片到指定列表:', data);
      // 实际实现：调用项目管理API移动卡片
    },
    'assign_member': (data: any) => {
      console.log('自动分配成员:', data);
      // 实际实现：调用项目管理API分配成员
    },
    'send_notification': (data: any) => {
      console.log('发送通知:', data);
      // 实际实现：调用通知API发送通知
    },
    'archive_card': (data: any) => {
      console.log('归档卡片:', data);
      // 实际实现：调用项目管理API归档卡片
    },
    'update_priority': (data: any) => {
      console.log('更新优先级:', data);
      // 实际实现：调用项目管理API更新优先级
    }
  };
  
  const actionHandler = actionMap[automation.action];
  if (actionHandler) {
    actionHandler(event.data);
  }
}