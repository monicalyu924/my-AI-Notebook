import axios from 'axios';

// 使用环境变量，默认值为localhost
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// 创建axios实例
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10秒超时
});

// 简单的内存缓存
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5分钟缓存

// 缓存键生成器
const getCacheKey = (config) => {
  return `${config.method}:${config.url}:${JSON.stringify(config.params || {})}`;
};

// 请求重试配置
const retryConfig = {
  retries: 3,
  retryDelay: 1000,
  retryCondition: (error) => {
    // 网络错误或5xx服务器错误时重试
    return !error.response || (error.response.status >= 500 && error.response.status < 600);
  }
};

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    // 添加认证token
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // GET请求缓存检查
    if (config.method === 'get' && config.cache !== false) {
      const cacheKey = getCacheKey(config);
      const cachedData = cache.get(cacheKey);
      
      if (cachedData && Date.now() - cachedData.timestamp < CACHE_DURATION) {
        // 返回缓存的数据
        config.adapter = () => {
          return Promise.resolve({
            data: cachedData.data,
            status: 200,
            statusText: 'OK (from cache)',
            headers: {},
            config
          });
        };
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    // 缓存GET请求的响应
    if (response.config.method === 'get' && response.config.cache !== false) {
      const cacheKey = getCacheKey(response.config);
      cache.set(cacheKey, {
        data: response.data,
        timestamp: Date.now()
      });
    }

    return response;
  },
  async (error) => {
    const { config } = error;

    // 处理401认证错误
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
      return Promise.reject(error);
    }

    // 重试逻辑
    if (config && !config._retry && retryConfig.retryCondition(error)) {
      config._retry = true;
      config._retryCount = config._retryCount || 0;

      if (config._retryCount < retryConfig.retries) {
        config._retryCount++;
        
        // 等待后重试
        await new Promise(resolve => setTimeout(resolve, retryConfig.retryDelay * config._retryCount));
        
        return api(config);
      }
    }

    return Promise.reject(error);
  }
);

// 清除缓存的工具函数
export const clearCache = (pattern) => {
  if (pattern) {
    // 清除匹配模式的缓存
    for (const [key] of cache) {
      if (key.includes(pattern)) {
        cache.delete(key);
      }
    }
  } else {
    // 清除所有缓存
    cache.clear();
  }
};

// 预加载数据的工具函数
export const preloadData = async (requests) => {
  const promises = requests.map(req => api(req));
  await Promise.all(promises);
};

// API方法导出
export const authAPI = {
  register: (userData) => api.post('/api/auth/register', userData),
  login: (credentials) => api.post('/api/auth/login', credentials),
  getProfile: () => api.get('/api/auth/me'),
};

export const notesAPI = {
  getNotes: (folderId = null) => {
    const params = folderId ? { folder_id: folderId } : {};
    return api.get('/api/notes', { params });
  },
  getNote: (id) => api.get(`/api/notes/${id}`),
  createNote: (noteData) => api.post('/api/notes', noteData),
  updateNote: (id, noteData) => {
    clearCache(`/api/notes`); // 清除笔记相关缓存
    return api.put(`/api/notes/${id}`, noteData);
  },
  deleteNote: (id) => {
    clearCache(`/api/notes`); // 清除笔记相关缓存
    return api.delete(`/api/notes/${id}`);
  },
  searchNotes: (query) => api.get('/api/notes/search', { params: { q: query }, cache: false }),
};

export const foldersAPI = {
  getFolders: () => api.get('/api/folders'),
  createFolder: (folderData) => {
    clearCache('/api/folders');
    return api.post('/api/folders', folderData);
  },
  updateFolder: (id, folderData) => {
    clearCache('/api/folders');
    return api.put(`/api/folders/${id}`, folderData);
  },
  deleteFolder: (id) => {
    clearCache('/api/folders');
    return api.delete(`/api/folders/${id}`);
  },
  batchUpdateFolders: (updates) => {
    clearCache('/api/folders');
    return api.post('/api/folders/batch', updates);
  },
};

export const todosAPI = {
  getTodos: () => api.get('/api/todos'),
  createTodo: (todoData) => {
    clearCache('/api/todos');
    return api.post('/api/todos', todoData);
  },
  updateTodo: (id, todoData) => {
    clearCache('/api/todos');
    return api.put(`/api/todos/${id}`, todoData);
  },
  deleteTodo: (id) => {
    clearCache('/api/todos');
    return api.delete(`/api/todos/${id}`);
  },
  toggleTodo: (id) => {
    clearCache('/api/todos');
    return api.patch(`/api/todos/${id}/toggle`);
  },
};

export const aiAPI = {
  generateContent: (data) => api.post('/api/ai/generate', data, { cache: false }),
  improveContent: (data) => api.post('/api/ai/improve', data, { cache: false }),
  translateContent: (data) => api.post('/api/ai/translate', data, { cache: false }),
  summarizeContent: (data) => api.post('/api/ai/summarize', data, { cache: false }),
  askQuestion: (data) => api.post('/api/ai/ask', data, { cache: false }),
};

export const userAPI = {
  updateProfile: (data) => api.put('/api/user/profile', data),
  updatePassword: (data) => api.put('/api/user/password', data),
  updateApiKey: (apiKey) => api.put('/api/user/api-key', { api_key: apiKey }),
};

export default api;