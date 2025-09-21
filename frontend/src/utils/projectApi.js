import api from './api';

// Board API
export const boardApi = {
  // 获取所有看板
  getBoards: () => api.get('/api/boards').then(res => res.data),
  
  // 创建看板
  createBoard: (boardData) => api.post('/api/boards', boardData).then(res => res.data),
  
  // 获取看板详情（包含列表和卡片）
  getBoardWithData: (boardId) => api.get(`/api/boards/${boardId}`).then(res => res.data),
  
  // 更新看板
  updateBoard: (boardId, boardData) => api.put(`/api/boards/${boardId}`, boardData).then(res => res.data),
  
  // 删除看板
  deleteBoard: (boardId) => api.delete(`/api/boards/${boardId}`).then(res => res.data)
};

// List API
export const listApi = {
  // 创建列表
  createList: (boardId, listData) => api.post(`/api/boards/${boardId}/lists`, listData).then(res => res.data),
  
  // 更新列表
  updateList: (listId, listData) => api.put(`/api/lists/${listId}`, listData).then(res => res.data),
  
  // 删除列表
  deleteList: (listId) => api.delete(`/api/lists/${listId}`).then(res => res.data)
};

// Card API
export const cardApi = {
  // 创建卡片
  createCard: (listId, cardData) => api.post(`/api/lists/${listId}/cards`, cardData).then(res => res.data),
  
  // 更新卡片
  updateCard: (cardId, cardData) => api.put(`/api/cards/${cardId}`, cardData).then(res => res.data),
  
  // 删除卡片
  deleteCard: (cardId) => api.delete(`/api/cards/${cardId}`).then(res => res.data),
  
  // 获取卡片评论
  getCardComments: (cardId) => api.get(`/api/cards/${cardId}/comments`).then(res => res.data),
  
  // 添加卡片评论
  addCardComment: (cardId, commentData) => api.post(`/api/cards/${cardId}/comments`, commentData).then(res => res.data)
};

// 优先级选项
export const PRIORITY_OPTIONS = [
  { value: 'low', label: '低', color: '#10b981' },
  { value: 'medium', label: '中', color: '#f59e0b' },
  { value: 'high', label: '高', color: '#ef4444' },
  { value: 'urgent', label: '紧急', color: '#dc2626' }
];

// 获取优先级显示信息
export const getPriorityInfo = (priority) => {
  return PRIORITY_OPTIONS.find(opt => opt.value === priority) || PRIORITY_OPTIONS[1];
};

export default {
  boardApi,
  listApi,
  cardApi,
  PRIORITY_OPTIONS,
  getPriorityInfo
};