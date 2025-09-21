import axios from 'axios';
import { getAuthHeaders } from './auth';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// 创建axios实例
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// 添加请求拦截器
api.interceptors.request.use(
  (config) => {
    const authHeaders = getAuthHeaders();
    if (authHeaders.Authorization) {
      config.headers.Authorization = authHeaders.Authorization;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const versionAPI = {
  // 获取笔记的版本历史
  getNoteVersions: (noteId, limit = 50, offset = 0) => {
    return api.get(`/api/versions/note/${noteId}`, {
      params: { limit, offset }
    });
  },

  // 手动创建版本
  createManualVersion: (noteId, comment = null) => {
    return api.post(`/api/versions/note/${noteId}/manual-save`, {
      comment
    });
  },

  // 恢复到指定版本
  restoreVersion: (versionId, comment = null) => {
    return api.post('/api/versions/restore', {
      version_id: versionId,
      comment
    });
  },

  // 删除版本
  deleteVersion: (versionId) => {
    return api.delete(`/api/versions/${versionId}`);
  },

  // 比较两个版本
  compareVersions: (noteId, version1Id, version2Id) => {
    return api.get(`/api/versions/note/${noteId}/compare/${version1Id}/${version2Id}`);
  }
};