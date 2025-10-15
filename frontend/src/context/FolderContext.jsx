import React, { createContext, useContext, useState, useEffect } from 'react';
import { folderAPI } from '../utils/folderApi';

const FolderContext = createContext();

export const useFolders = () => {
  const context = useContext(FolderContext);
  if (!context) {
    throw new Error('useFolders must be used within a FolderProvider');
  }
  return context;
};

export const FolderProvider = ({ children }) => {
  const [folders, setFolders] = useState([]);
  const [foldersTree, setFoldersTree] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 获取文件夹列表
  const fetchFolders = async (parentId = null) => {
    try {
      setLoading(true);
      
      // 模拟数据，避免后端依赖
      const mockData = [
        {
          id: '1',
          name: '项目文档',
          parent_id: parentId,
          created_at: new Date().toISOString()
        },
        {
          id: '2', 
          name: '会议记录',
          parent_id: parentId,
          created_at: new Date().toISOString()
        }
      ];
      
      setFolders(mockData);
      return { success: true, data: mockData };
      
    } catch (err) {
      setError('使用本地数据模式');
      return { success: true, data: [] };
    } finally {
      setLoading(false);
    }
  };

  // 获取文件夹树结构
  const fetchFoldersTree = async () => {
    try {
      setLoading(true);
      
      // 模拟API响应，避免后端依赖
      const mockData = [
        {
          id: 'default',
          name: '默认文件夹',
          parent_id: null,
          created_at: new Date().toISOString(),
          children: []
        }
      ];
      
      // 如果没有后端API，使用模拟数据
      setFoldersTree(mockData);
      return { success: true, data: mockData };
      
    } catch (err) {
      // 如果API调用失败，使用模拟数据作为fallback
      const mockData = [
        {
          id: 'default',
          name: '默认文件夹',
          parent_id: null,
          created_at: new Date().toISOString(),
          children: []
        }
      ];
      
      setFoldersTree(mockData);
      setError('使用本地数据模式');
      return { success: true, data: mockData };
    } finally {
      setLoading(false);
    }
  };

  // 获取单个文件夹
  const getFolder = async (folderId) => {
    try {
      setLoading(true);
      const response = await folderAPI.getFolder(folderId);
      return { success: true, data: response.data };
    } catch (err) {
      setError(err.response?.data?.detail || '获取文件夹失败');
      return { success: false, error: err.response?.data?.detail || '获取文件夹失败' };
    } finally {
      setLoading(false);
    }
  };

  // 创建文件夹
  const createFolder = async (folderData) => {
    try {
      setLoading(true);
      
      // 模拟创建文件夹
      const newFolder = {
        id: `folder-${Date.now()}`,
        ...folderData,
        created_at: new Date().toISOString()
      };
      
      // 更新本地状态
      setFolders(prev => [newFolder, ...prev]);
      
      // 刷新文件夹树
      await fetchFoldersTree();
      
      return { success: true, data: newFolder };
      
    } catch (err) {
      setError('创建文件夹失败');
      return { success: false, error: '创建文件夹失败' };
    } finally {
      setLoading(false);
    }
  };

  // 更新文件夹
  const updateFolder = async (folderId, folderData) => {
    try {
      setLoading(true);
      
      // 模拟更新文件夹
      const updatedFolder = {
        id: folderId,
        ...folderData,
        updated_at: new Date().toISOString()
      };
      
      // 更新本地状态
      setFolders(prev => prev.map(folder => 
        folder.id === folderId ? updatedFolder : folder
      ));
      
      // 如果更新的是当前选中的文件夹，也更新selectedFolder
      if (selectedFolder && selectedFolder.id === folderId) {
        setSelectedFolder(updatedFolder);
      }
      
      // 刷新文件夹树
      await fetchFoldersTree();
      
      return { success: true, data: updatedFolder };
      
    } catch (err) {
      setError('更新文件夹失败');
      return { success: false, error: '更新文件夹失败' };
    } finally {
      setLoading(false);
    }
  };

  // 删除文件夹
  const deleteFolder = async (folderId, force = false) => {
    try {
      setLoading(true);
      
      // 模拟删除文件夹
      // 更新本地状态
      setFolders(prev => prev.filter(folder => folder.id !== folderId));
      
      // 如果删除的是当前选中的文件夹，清除选中状态
      if (selectedFolder && selectedFolder.id === folderId) {
        setSelectedFolder(null);
      }
      
      // 刷新文件夹树
      await fetchFoldersTree();
      
      return { success: true };
      
    } catch (err) {
      setError('删除文件夹失败');
      return { success: false, error: '删除文件夹失败' };
    } finally {
      setLoading(false);
    }
  };

  // 展开/收起文件夹树节点的状态管理（带持久化）
  const [expandedFolders, setExpandedFolders] = useState(() => {
    // 从 localStorage 加载折叠状态
    try {
      const saved = localStorage.getItem('expandedFolders');
      if (saved) {
        const arr = JSON.parse(saved);
        return new Set(arr);
      }
    } catch (error) {
      console.error('加载文件夹折叠状态失败:', error);
    }
    return new Set();
  });

  // 当 expandedFolders 改变时保存到 localStorage
  useEffect(() => {
    try {
      const arr = Array.from(expandedFolders);
      localStorage.setItem('expandedFolders', JSON.stringify(arr));
    } catch (error) {
      console.error('保存文件夹折叠状态失败:', error);
    }
  }, [expandedFolders]);

  const toggleFolderExpanded = (folderId) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        newSet.add(folderId);
      }
      return newSet;
    });
  };

  const expandFolder = (folderId) => {
    setExpandedFolders(prev => new Set(prev).add(folderId));
  };

  const collapseFolder = (folderId) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      newSet.delete(folderId);
      return newSet;
    });
  };

  // 清除错误
  const clearError = () => {
    setError(null);
  };

  // 初始化时获取文件夹树
  useEffect(() => {
    fetchFoldersTree();
  }, []);

  const value = {
    // 状态
    folders,
    foldersTree,
    selectedFolder,
    loading,
    error,
    expandedFolders,
    
    // 方法
    fetchFolders,
    fetchFoldersTree,
    getFolder,
    createFolder,
    updateFolder,
    deleteFolder,
    setSelectedFolder,
    toggleFolderExpanded,
    expandFolder,
    collapseFolder,
    clearError
  };

  return (
    <FolderContext.Provider value={value}>
      {children}
    </FolderContext.Provider>
  );
};

export default FolderContext;
