import { useState, useCallback, useRef, useEffect } from 'react';
import { useAdvancedResponsive } from './useAdvancedResponsive';

export const usePerformanceLoader = () => {
  const [loadingStates, setLoadingStates] = useState({});
  const [errors, setErrors] = useState({});
  const [progress, setProgress] = useState({});
  const timeoutRefs = useRef({});
  const { isMobile } = useAdvancedResponsive();
  
  // 设置加载状态
  const setLoading = useCallback((key, isLoading, options = {}) => {
    const { 
      timeout = 10000, // 10秒超时
      showSkeleton = isMobile, // 移动端默认显示骨架屏
      skeletonType = 'default',
      autoRetry = false,
      retryCount = 0,
      maxRetries = 3
    } = options;
    
    setLoadingStates(prev => ({
      ...prev,
      [key]: {
        loading: isLoading,
        showSkeleton,
        skeletonType,
        autoRetry,
        retryCount,
        maxRetries,
        startTime: isLoading ? Date.now() : null
      }
    }));
    
    // 清除错误状态
    if (isLoading) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[key];
        return newErrors;
      });
      
      // 设置超时
      if (timeout > 0) {
        timeoutRefs.current[key] = setTimeout(() => {
          setErrors(prev => ({
            ...prev,
            [key]: {
              message: '请求超时，请检查网络连接',
              type: 'timeout',
              timestamp: Date.now()
            }
          }));
          setLoading(key, false);
        }, timeout);
      }
    } else {
      // 清除超时
      if (timeoutRefs.current[key]) {
        clearTimeout(timeoutRefs.current[key]);
        delete timeoutRefs.current[key];
      }
      
      // 清除进度
      setProgress(prev => {
        const newProgress = { ...prev };
        delete newProgress[key];
        return newProgress;
      });
    }
  }, [isMobile]);
  
  // 设置错误状态
  const setError = useCallback((key, error, options = {}) => {
    const { 
      autoRetry = false,
      retryDelay = 2000,
      showToast = true
    } = options;
    
    const currentState = loadingStates[key];
    const retryCount = currentState?.retryCount || 0;
    const maxRetries = currentState?.maxRetries || 3;
    
    setErrors(prev => ({
      ...prev,
      [key]: {
        message: error.message || error,
        type: error.type || 'error',
        timestamp: Date.now(),
        showToast,
        canRetry: autoRetry && retryCount < maxRetries
      }
    }));
    
    setLoading(key, false);
    
    // 自动重试
    if (autoRetry && retryCount < maxRetries) {
      setTimeout(() => {
        setLoading(key, true, {
          ...currentState,
          retryCount: retryCount + 1
        });
      }, retryDelay);
    }
  }, [loadingStates, setLoading]);
  
  // 设置进度
  const setProgressValue = useCallback((key, value, total = 100) => {
    const percentage = Math.round((value / total) * 100);
    setProgress(prev => ({
      ...prev,
      [key]: {
        value,
        total,
        percentage,
        timestamp: Date.now()
      }
    }));
  }, []);
  
  // 清除状态
  const clearState = useCallback((key) => {
    setLoadingStates(prev => {
      const newStates = { ...prev };
      delete newStates[key];
      return newStates;
    });
    
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[key];
      return newErrors;
    });
    
    setProgress(prev => {
      const newProgress = { ...prev };
      delete newProgress[key];
      return newProgress;
    });
    
    if (timeoutRefs.current[key]) {
      clearTimeout(timeoutRefs.current[key]);
      delete timeoutRefs.current[key];
    }
  }, []);
  
  // 包装异步函数
  const wrapAsync = useCallback((key, asyncFn, options = {}) => {
    return async (...args) => {
      try {
        setLoading(key, true, options);
        const result = await asyncFn(...args);
        setLoading(key, false);
        return result;
      } catch (error) {
        setError(key, error, options);
        throw error;
      }
    };
  }, [setLoading, setError]);
  
  // 获取加载状态
  const getLoadingState = useCallback((key) => {
    return loadingStates[key]?.loading || false;
  }, [loadingStates]);
  
  // 获取错误状态
  const getError = useCallback((key) => {
    return errors[key] || null;
  }, [errors]);
  
  // 获取进度
  const getProgress = useCallback((key) => {
    return progress[key] || null;
  }, [progress]);
  
  // 性能监控
  const getPerformanceInfo = useCallback((key) => {
    const state = loadingStates[key];
    if (!state?.startTime) return null;
    
    return {
      duration: Date.now() - state.startTime,
      isLongRunning: Date.now() - state.startTime > 3000, // 3秒算长时间运行
      retryCount: state.retryCount || 0
    };
  }, [loadingStates]);
  
  // 清理所有超时
  useEffect(() => {
    return () => {
      Object.values(timeoutRefs.current).forEach(timeout => {
        clearTimeout(timeout);
      });
    };
  }, []);
  
  return {
    // 状态设置
    setLoading,
    setError,
    setProgress: setProgressValue,
    clearState,
    
    // 状态获取
    getLoadingState,
    getError,
    getProgress,
    getPerformanceInfo,
    
    // 实用工具
    wrapAsync,
    
    // 批量状态
    loadingStates,
    errors,
    progress,
    
    // 便捷方法
    isLoading: (key) => getLoadingState(key),
    hasError: (key) => !!getError(key),
    isAnyLoading: Object.values(loadingStates).some(state => state?.loading),
    errorCount: Object.keys(errors).length,
    activeLoaders: Object.keys(loadingStates).filter(key => loadingStates[key]?.loading)
  };
};

export default usePerformanceLoader;