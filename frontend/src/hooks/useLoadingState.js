import { useState, useCallback, useRef, useEffect } from 'react';

// 加载状态管理Hook
export const useLoadingState = (initialState = false) => {
  const [isLoading, setIsLoading] = useState(initialState);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const loadingRef = useRef(false);
  const requestId = useRef(0);

  // 开始加载
  const startLoading = useCallback(() => {
    setIsLoading(true);
    setError(null);
    loadingRef.current = true;
  }, []);

  // 停止加载
  const stopLoading = useCallback(() => {
    setIsLoading(false);
    loadingRef.current = false;
  }, []);

  // 设置错误
  const setLoadingError = useCallback((error) => {
    setError(error);
    setIsLoading(false);
    loadingRef.current = false;
  }, []);

  // 设置数据
  const setLoadingData = useCallback((newData) => {
    setData(newData);
    setError(null);
    setIsLoading(false);
    loadingRef.current = false;
  }, []);

  // 执行异步操作
  const execute = useCallback(async (asyncFunction) => {
    const currentRequestId = ++requestId.current;
    
    try {
      startLoading();
      const result = await asyncFunction();
      
      // 检查是否是最新的请求
      if (currentRequestId === requestId.current) {
        setLoadingData(result);
      }
      
      return result;
    } catch (error) {
      // 检查是否是最新的请求
      if (currentRequestId === requestId.current) {
        setLoadingError(error);
      }
      throw error;
    }
  }, [startLoading, setLoadingData, setLoadingError]);

  // 重置状态
  const reset = useCallback(() => {
    setIsLoading(false);
    setError(null);
    setData(null);
    loadingRef.current = false;
    requestId.current = 0;
  }, []);

  return {
    isLoading,
    error,
    data,
    startLoading,
    stopLoading,
    setError: setLoadingError,
    setData: setLoadingData,
    execute,
    reset
  };
};

// 多状态加载管理Hook
export const useMultipleLoadingStates = (states = {}) => {
  const [loadingStates, setLoadingStates] = useState(
    Object.keys(states).reduce((acc, key) => {
      acc[key] = { isLoading: states[key] || false, error: null, data: null };
      return acc;
    }, {})
  );

  const updateState = useCallback((key, updates) => {
    setLoadingStates(prev => ({
      ...prev,
      [key]: { ...prev[key], ...updates }
    }));
  }, []);

  const startLoading = useCallback((key) => {
    updateState(key, { isLoading: true, error: null });
  }, [updateState]);

  const stopLoading = useCallback((key) => {
    updateState(key, { isLoading: false });
  }, [updateState]);

  const setError = useCallback((key, error) => {
    updateState(key, { isLoading: false, error });
  }, [updateState]);

  const setData = useCallback((key, data) => {
    updateState(key, { isLoading: false, error: null, data });
  }, [updateState]);

  const execute = useCallback(async (key, asyncFunction) => {
    try {
      startLoading(key);
      const result = await asyncFunction();
      setData(key, result);
      return result;
    } catch (error) {
      setError(key, error);
      throw error;
    }
  }, [startLoading, setData, setError]);

  const getState = useCallback((key) => {
    return loadingStates[key] || { isLoading: false, error: null, data: null };
  }, [loadingStates]);

  const isAnyLoading = Object.values(loadingStates).some(state => state.isLoading);
  const hasAnyError = Object.values(loadingStates).some(state => state.error);

  return {
    states: loadingStates,
    getState,
    startLoading,
    stopLoading,
    setError,
    setData,
    execute,
    isAnyLoading,
    hasAnyError
  };
};

// 分页加载Hook
export const usePaginatedLoading = (fetchFunction, initialPage = 1, pageSize = 20) => {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(initialPage);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const { isLoading, error, execute } = useLoadingState();

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;

    try {
      const result = await execute(() => fetchFunction(page, pageSize));
      
      if (result) {
        const { data = [], total = 0, hasNext = false } = result;
        
        setItems(prev => page === 1 ? data : [...prev, ...data]);
        setTotalCount(total);
        setHasMore(hasNext);
        setPage(prev => prev + 1);
      }
    } catch (error) {
      console.error('Failed to load more items:', error);
    }
  }, [fetchFunction, page, pageSize, isLoading, hasMore, execute]);

  const refresh = useCallback(async () => {
    setPage(1);
    setItems([]);
    setHasMore(true);
    setTotalCount(0);
    
    try {
      const result = await execute(() => fetchFunction(1, pageSize));
      
      if (result) {
        const { data = [], total = 0, hasNext = false } = result;
        
        setItems(data);
        setTotalCount(total);
        setHasMore(hasNext);
        setPage(2);
      }
    } catch (error) {
      console.error('Failed to refresh items:', error);
    }
  }, [fetchFunction, pageSize, execute]);

  // 初始加载
  useEffect(() => {
    refresh();
  }, []);

  return {
    items,
    isLoading,
    error,
    hasMore,
    totalCount,
    currentPage: page - 1,
    loadMore,
    refresh
  };
};

// 防抖加载Hook
export const useDebouncedLoading = (asyncFunction, delay = 500) => {
  const { isLoading, error, data, execute } = useLoadingState();
  const timeoutRef = useRef(null);

  const debouncedExecute = useCallback((...args) => {
    // 清除之前的定时器
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // 设置新的定时器
    timeoutRef.current = setTimeout(() => {
      execute(() => asyncFunction(...args));
    }, delay);
  }, [asyncFunction, delay, execute]);

  // 立即执行（不防抖）
  const executeImmediately = useCallback((...args) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    return execute(() => asyncFunction(...args));
  }, [asyncFunction, execute]);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    isLoading,
    error,
    data,
    execute: debouncedExecute,
    executeImmediately
  };
};

// 轮询加载Hook
export const usePollingLoading = (asyncFunction, interval = 5000, enabled = true) => {
  const { isLoading, error, data, execute } = useLoadingState();
  const intervalRef = useRef(null);

  const startPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      execute(asyncFunction);
    }, interval);

    // 立即执行一次
    execute(asyncFunction);
  }, [asyncFunction, interval, execute]);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // 自动开始/停止轮询
  useEffect(() => {
    if (enabled) {
      startPolling();
    } else {
      stopPolling();
    }

    return stopPolling;
  }, [enabled, startPolling, stopPolling]);

  return {
    isLoading,
    error,
    data,
    startPolling,
    stopPolling,
    isPolling: !!intervalRef.current
  };
};

// 加载状态工具函数
export const createLoadingState = (initialData = null) => ({
  isLoading: false,
  error: null,
  data: initialData
});

export const withLoading = (state, isLoading, error = null) => ({
  ...state,
  isLoading,
  error
});

export const withError = (state, error) => ({
  ...state,
  isLoading: false,
  error
});

export const withData = (state, data) => ({
  ...state,
  isLoading: false,
  error: null,
  data
});

// 导出主要Hook
export default useLoadingState;