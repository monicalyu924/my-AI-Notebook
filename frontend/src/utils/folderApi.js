import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// 创建axios实例
const folderApi = axios.create({
  baseURL: `${API_BASE_URL}/api/folders`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器 - 添加认证token
folderApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器 - 处理认证错误
folderApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token过期或无效，清除本地存储并重定向到登录页
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// 文件夹API方法
export const folderAPI = {
  // 获取文件夹列表
  getFolders: (parentId = null) => {
    const params = parentId ? { parent_id: parentId } : {};
    return folderApi.get('/', { params });
  },

  // 获取文件夹树结构
  getFoldersTree: () => {
    return folderApi.get('/tree');
  },

  // 获取单个文件夹
  getFolder: (folderId) => {
    return folderApi.get(`/${folderId}`);
  },

  // 创建文件夹
  createFolder: (folderData) => {
    return folderApi.post('/', folderData);
  },

  // 更新文件夹
  updateFolder: (folderId, folderData) => {
    return folderApi.put(`/${folderId}`, folderData);
  },

  // 删除文件夹
  deleteFolder: (folderId) => {
    return folderApi.delete(`/${folderId}`);
  },

  // 强制删除文件夹（包括所有内容）
  forceDeleteFolder: (folderId) => {
    return folderApi.delete(`/${folderId}/force`);
  },
};

export default folderAPI;
