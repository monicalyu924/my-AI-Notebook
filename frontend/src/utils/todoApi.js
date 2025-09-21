import api from './api';

// 待办事项API
export const todoAPI = {
  // 获取待办事项列表
  getTodos: (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.category) queryParams.append('category', params.category);
    if (params.priority) queryParams.append('priority', params.priority);
    if (params.completed !== undefined) queryParams.append('completed', params.completed);
    if (params.search) queryParams.append('search', params.search);
    
    const queryString = queryParams.toString();
    return api.get(`/todos/${queryString ? `?${queryString}` : ''}`);
  },

  // 获取特定待办事项
  getTodo: (id) => api.get(`/todos/${id}`),

  // 创建待办事项
  createTodo: (todoData) => api.post('/todos/', todoData),

  // 更新待办事项
  updateTodo: (id, todoData) => api.put(`/todos/${id}`, todoData),

  // 删除待办事项
  deleteTodo: (id) => api.delete(`/todos/${id}`),

  // 切换完成状态
  toggleTodo: (id) => api.patch(`/todos/${id}/toggle`),

  // 获取统计信息
  getStats: () => api.get('/todos/stats/summary')
};

export default todoAPI;
