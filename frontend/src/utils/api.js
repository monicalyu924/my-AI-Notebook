import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000'; // 直接硬编码正确的地址
console.log('API_BASE_URL设置为:', API_BASE_URL);

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (userData) => {
    console.log('调用 authAPI.register', userData);
    return api.post('/api/auth/register', userData);
  },
  login: (credentials) => api.post('/api/auth/login', credentials),
  getProfile: () => api.get('/api/auth/me'),
};

// Notes API
export const notesAPI = {
  getNotes: (folderId = null) => {
    const params = folderId !== null ? { folder_id: folderId } : {};
    return api.get('/notes/', { params });
  },
  getNote: (id) => api.get(`/notes/${id}`),
  createNote: (noteData) => api.post('/notes/', noteData),
  updateNote: (id, noteData) => api.put(`/notes/${id}`, noteData),
  deleteNote: (id) => api.delete(`/notes/${id}`),
  searchNotes: (query, limit = 50) => api.get('/notes/search/query', {
    params: { q: query, limit }
  }),
  // Phase 3.4 - 高级搜索
  advancedSearch: (queryParams) => api.get(`/notes/search/advanced?${queryParams}`),
};

// AI API
export const aiAPI = {
  processText: (request) => api.post('/ai/process', request),
  // Phase 3.2 - AI智能助手增强
  summarizeNote: (noteId) => api.post(`/api/ai/summarize/${noteId}`),
  getRecommendations: () => api.get('/api/ai/recommend'),
  autoClassifyNote: (noteId) => api.post(`/api/ai/auto-classify/${noteId}`),
};

// Export API - Phase 3.3
export const exportAPI = {
  exportToPDF: (noteId) => {
    const token = localStorage.getItem('token');
    window.open(`${API_BASE_URL}/export/pdf/${noteId}?token=${token}`, '_blank');
  },
  exportToHTML: (noteId) => {
    const token = localStorage.getItem('token');
    window.open(`${API_BASE_URL}/export/html/${noteId}?token=${token}`, '_blank');
  },
  batchExport: (noteIds, format = 'html') =>
    api.post('/export/batch', noteIds, {
      params: { format },
      responseType: 'blob'
    }),
};

// User API
export const userAPI = {
  updateProfile: (userData) => api.put('/user/profile', userData),
};

// Chat API
export const chatAPI = {
  getSessions: () => api.get('/chat/sessions'),
  createSession: (sessionData) => api.post('/chat/sessions', sessionData),
  updateSession: (sessionId, sessionData) => api.put(`/chat/sessions/${sessionId}`, sessionData),
  deleteSession: (sessionId) => api.delete(`/chat/sessions/${sessionId}`),
  getMessages: (sessionId) => api.get(`/chat/sessions/${sessionId}/messages`),
  sendMessage: (sessionId, message) => {
    // 流式响应处理
    return fetch(`${API_BASE_URL}/chat/sessions/${sessionId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify({ message }),
    });
  },
  quickChat: (message, model = null) => {
    return fetch(`${API_BASE_URL}/chat/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify({ message, model }),
    });
  },
};

// Admin API
export const adminAPI = {
  getAllUsers: () => api.get('/admin/users'),
  getUserDetails: (userId) => api.get(`/admin/users/${userId}`),
  updateUser: (userId, userData) => api.put(`/admin/users/${userId}`, userData),
  deleteUser: (userId) => api.delete(`/admin/users/${userId}`),
  getSystemStats: () => api.get('/admin/stats'),
};

// Tags API
export const tagsAPI = {
  // 获取标签统计信息
  getStats: () => api.get('/tags/stats'),

  // 重命名标签
  renameTag: (oldTag, newTag) => api.post('/tags/rename', null, {
    params: { old_tag: oldTag, new_tag: newTag }
  }),

  // 合并多个标签
  mergeTags: (sourceTags, targetTag) => api.post('/tags/merge', null, {
    params: { source_tags: sourceTags.join(','), target_tag: targetTag }
  }),

  // 删除标签
  deleteTag: (tag) => api.delete(`/tags/${encodeURIComponent(tag)}`),

  // 获取智能标签建议
  getSuggestions: (text = '') => api.get('/tags/suggestions', { params: { text } }),
};

export default api;
