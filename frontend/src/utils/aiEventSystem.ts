import { useAIProjectStore } from '../store/aiProjectStore';

export class AIEventSystem {
  private static instance: AIEventSystem;
  private aiStore = useAIProjectStore.getState();

  static getInstance(): AIEventSystem {
    if (!AIEventSystem.instance) {
      AIEventSystem.instance = new AIEventSystem();
    }
    return AIEventSystem.instance;
  }

  // 发送卡片相关事件
  sendCardEvent(type: string, cardData: any) {
    const event = {
      type: `card_${type}`,
      data: cardData,
      timestamp: new Date().toISOString()
    };
    
    this.aiStore.processAIEvent(event);
    console.log('AI事件 - 卡片:', event);
  }

  // 发送进度更新事件
  sendProgressEvent(progress: number, boardData: any) {
    const event = {
      type: 'progress_updated',
      data: { progress, board: boardData },
      timestamp: new Date().toISOString()
    };
    
    this.aiStore.processAIEvent(event);
    console.log('AI事件 - 进度:', event);
  }

  // 发送成员分配事件
  sendMemberEvent(type: string, memberData: any) {
    const event = {
      type: `member_${type}`,
      data: memberData,
      timestamp: new Date().toISOString()
    };
    
    this.aiStore.processAIEvent(event);
    console.log('AI事件 - 成员:', event);
  }

  // 发送列表移动事件
  sendListEvent(type: string, listData: any) {
    const event = {
      type: `list_${type}`,
      data: listData,
      timestamp: new Date().toISOString()
    };
    
    this.aiStore.processAIEvent(event);
    console.log('AI事件 - 列表:', event);
  }

  // 检查卡片是否逾期
  checkCardOverdue(card: any) {
    if (!card.dueDate) return false;
    
    const now = new Date();
    const dueDate = new Date(card.dueDate);
    const daysOverdue = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
    
    return daysOverdue > 0;
  }

  // 检查项目进度
  checkProjectProgress(boardData: any) {
    if (!boardData || !boardData.lists) return 0;
    
    const totalCards = boardData.lists.reduce((sum: number, list: any) => 
      sum + (list.cards?.length || 0), 0
    );
    
    const completedCards = boardData.lists
      .filter((list: any) => list.title?.includes('已完成'))
      .reduce((sum: number, list: any) => sum + (list.cards?.length || 0), 0);
    
    return totalCards > 0 ? Math.round((completedCards / totalCards) * 100) : 0;
  }

  // 智能任务分配建议
  generateAssignmentSuggestions(boardData: any, newCard: any) {
    if (!boardData || !boardData.lists) return null;
    
    const members = this.extractMembersFromBoard(boardData);
    const memberWorkload = this.calculateMemberWorkload(boardData, members);
    
    // 找到工作量最少的成员
    const leastBusyMember = Object.entries(memberWorkload)
      .sort(([,a], [,b]) => a - b)[0];
    
    if (leastBusyMember) {
      return {
        suggestedMember: leastBusyMember[0],
        currentWorkload: leastBusyMember[1],
        reason: '工作量最少，适合分配新任务'
      };
    }
    
    return null;
  }

  // 提取板子中的成员
  private extractMembersFromBoard(boardData: any): string[] {
    const members = new Set<string>();
    
    boardData.lists?.forEach((list: any) => {
      list.cards?.forEach((card: any) => {
        if (card.assignee) {
          members.add(card.assignee);
        }
      });
    });
    
    return Array.from(members);
  }

  // 计算成员工作量
  private calculateMemberWorkload(boardData: any, members: string[]): { [key: string]: number } {
    const workload: { [key: string]: number } = {};
    
    // 初始化工作量
    members.forEach(member => {
      workload[member] = 0;
    });
    
    // 计算每个成员的任务数
    boardData.lists?.forEach((list: any) => {
      list.cards?.forEach((card: any) => {
        if (card.assignee && workload[card.assignee] !== undefined) {
          workload[card.assignee]++;
        }
      });
    });
    
    return workload;
  }
}

// 创建全局事件系统实例
export const aiEventSystem = AIEventSystem.getInstance();