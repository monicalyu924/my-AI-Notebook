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
};

// AI API
export const aiAPI = {
  processText: (request) => api.post('/ai/process', request),
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

export default api;
