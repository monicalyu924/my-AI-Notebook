import React, { createContext, useContext, useState, useEffect } from 'react';
import todoAPI from '../utils/todoApi';

const TodoContext = createContext();

export const useTodos = () => {
  const context = useContext(TodoContext);
  if (!context) {
    throw new Error('useTodos must be used within a TodoProvider');
  }
  return context;
};

export const TodoProvider = ({ children }) => {
  const [todos, setTodos] = useState([]);
  const [selectedTodo, setSelectedTodo] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    pending: 0,
    overdue: 0,
    by_priority: { high: 0, medium: 0, low: 0 },
    by_category: { work: 0, personal: 0, study: 0 }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 获取待办事项列表
  const fetchTodos = async (filters = {}) => {
    try {
      setLoading(true);
      setError(null);
      const response = await todoAPI.getTodos(filters);
      setTodos(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || '获取待办事项失败');
      console.error('Error fetching todos:', err);
    } finally {
      setLoading(false);
    }
  };

  // 获取统计信息
  const fetchStats = async () => {
    try {
      const response = await todoAPI.getStats();
      setStats(response.data);
    } catch (err) {
      console.error('Error fetching todo stats:', err);
    }
  };

  // 创建待办事项
  const createTodo = async (todoData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await todoAPI.createTodo(todoData);
      setTodos(prev => [response.data, ...prev]);
      await fetchStats(); // 更新统计信息
      return { success: true, data: response.data };
    } catch (err) {
      const errorMsg = err.response?.data?.detail || '创建待办事项失败';
      setError(errorMsg);
      console.error('Error creating todo:', err);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  // 更新待办事项
  const updateTodo = async (id, updateData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await todoAPI.updateTodo(id, updateData);
      setTodos(prev => prev.map(todo => 
        todo.id === id ? response.data : todo
      ));
      await fetchStats(); // 更新统计信息
      return { success: true, data: response.data };
    } catch (err) {
      const errorMsg = err.response?.data?.detail || '更新待办事项失败';
      setError(errorMsg);
      console.error('Error updating todo:', err);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  // 切换完成状态
  const toggleTodo = async (id) => {
    try {
      const response = await todoAPI.toggleTodo(id);
      setTodos(prev => prev.map(todo => 
        todo.id === id ? response.data : todo
      ));
      await fetchStats(); // 更新统计信息
      return { success: true, data: response.data };
    } catch (err) {
      const errorMsg = err.response?.data?.detail || '切换状态失败';
      setError(errorMsg);
      console.error('Error toggling todo:', err);
      return { success: false, error: errorMsg };
    }
  };

  // 删除待办事项
  const deleteTodo = async (id) => {
    try {
      setLoading(true);
      setError(null);
      await todoAPI.deleteTodo(id);
      setTodos(prev => prev.filter(todo => todo.id !== id));
      await fetchStats(); // 更新统计信息
      return { success: true };
    } catch (err) {
      const errorMsg = err.response?.data?.detail || '删除待办事项失败';
      setError(errorMsg);
      console.error('Error deleting todo:', err);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  // 获取单个待办事项
  const getTodo = async (id) => {
    try {
      const response = await todoAPI.getTodo(id);
      return { success: true, data: response.data };
    } catch (err) {
      const errorMsg = err.response?.data?.detail || '获取待办事项失败';
      console.error('Error getting todo:', err);
      return { success: false, error: errorMsg };
    }
  };

  // 清除错误
  const clearError = () => {
    setError(null);
  };

  const value = {
    // 状态
    todos,
    selectedTodo,
    isCreating,
    stats,
    loading,
    error,
    
    // 方法
    fetchTodos,
    fetchStats,
    createTodo,
    updateTodo,
    toggleTodo,
    deleteTodo,
    getTodo,
    clearError,
    setSelectedTodo,
    setIsCreating
  };

  return (
    <TodoContext.Provider value={value}>
      {children}
    </TodoContext.Provider>
  );
};
