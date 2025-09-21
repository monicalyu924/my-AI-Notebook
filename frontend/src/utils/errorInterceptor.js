import { ERROR_TYPES } from '../components/common/ErrorHandler';

// 错误拦截器配置
export const setupErrorInterceptor = (api, errorHandler) => {
  // 请求拦截器
  api.interceptors.request.use(
    (config) => {
      // 添加请求时间戳用于超时检测
      config.metadata = { startTime: new Date() };
      return config;
    },
    (error) => {
      // 请求配置错误
      const errorObj = {
        message: '请求配置错误',
        type: ERROR_TYPES.CLIENT,
        originalError: error
      };
      
      if (errorHandler) {
        errorHandler.addError(errorObj);
      }
      
      return Promise.reject(error);
    }
  );

  // 响应拦截器
  api.interceptors.response.use(
    (response) => {
      // 计算请求耗时
      if (response.config.metadata) {
        const endTime = new Date();
        const duration = endTime - response.config.metadata.startTime;
        
        // 如果请求时间过长，给出提示
        if (duration > 5000) {
          errorHandler?.warning('请求响应较慢，请检查网络连接');
        }
      }
      
      return response;
    },
    (error) => {
      // 处理不同类型的错误
      const errorObj = createErrorObject(error);
      
      // 特殊错误处理
      if (errorObj.type === ERROR_TYPES.AUTH) {
        handleAuthError(error);
      }
      
      // 添加到错误处理系统
      if (errorHandler) {
        errorHandler.addError(errorObj, {
          url: error.config?.url,
          method: error.config?.method,
          timestamp: new Date()
        });
      }
      
      return Promise.reject(error);
    }
  );
};

// 创建错误对象
const createErrorObject = (error) => {
  const response = error.response;
  const request = error.request;
  
  // 网络错误
  if (!response && request) {
    return {
      message: '网络连接失败',
      type: ERROR_TYPES.NETWORK,
      code: 'NETWORK_ERROR',
      originalError: error
    };
  }
  
  // HTTP错误
  if (response) {
    const status = response.status;
    const data = response.data;
    
    return {
      message: data?.message || getDefaultErrorMessage(status),
      type: getErrorType(status),
      code: status,
      details: data?.details,
      originalError: error
    };
  }
  
  // 请求配置错误或其他错误
  return {
    message: error.message || '未知错误',
    type: ERROR_TYPES.CLIENT,
    code: 'UNKNOWN_ERROR',
    originalError: error
  };
};

// 根据状态码获取错误类型
const getErrorType = (status) => {
  if (status === 401 || status === 403) {
    return ERROR_TYPES.AUTH;
  }
  
  if (status >= 400 && status < 500) {
    return ERROR_TYPES.VALIDATION;
  }
  
  if (status >= 500) {
    return ERROR_TYPES.SERVER;
  }
  
  return ERROR_TYPES.CLIENT;
};

// 获取默认错误消息
const getDefaultErrorMessage = (status) => {
  const errorMessages = {
    400: '请求参数错误',
    401: '未授权访问',
    403: '权限不足',
    404: '资源不存在',
    405: '请求方法不允许',
    408: '请求超时',
    409: '数据冲突',
    422: '数据验证失败',
    429: '请求过于频繁',
    500: '服务器内部错误',
    502: '网关错误',
    503: '服务暂时不可用',
    504: '网关超时'
  };
  
  return errorMessages[status] || `请求失败 (${status})`;
};

// 处理认证错误
const handleAuthError = (error) => {
  const status = error.response?.status;
  
  if (status === 401) {
    // 清除本地存储的认证信息
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // 重定向到登录页面
    setTimeout(() => {
      window.location.href = '/login';
    }, 1500);
  }
};

// 重试机制
export const createRetryInterceptor = (api, maxRetries = 3, retryDelay = 1000) => {
  api.interceptors.response.use(
    (response) => response,
    async (error) => {
      const config = error.config;
      
      // 检查是否应该重试
      if (shouldRetry(error) && (!config._retryCount || config._retryCount < maxRetries)) {
        config._retryCount = config._retryCount || 0;
        config._retryCount++;
        
        // 计算延迟时间（指数退避）
        const delay = retryDelay * Math.pow(2, config._retryCount - 1);
        
        // 等待后重试
        await new Promise(resolve => setTimeout(resolve, delay));
        
        return api(config);
      }
      
      return Promise.reject(error);
    }
  );
};

// 判断是否应该重试
const shouldRetry = (error) => {
  // 网络错误时重试
  if (!error.response) {
    return true;
  }
  
  const status = error.response.status;
  
  // 5xx服务器错误时重试
  if (status >= 500 && status < 600) {
    return true;
  }
  
  // 429 请求过于频繁时重试
  if (status === 429) {
    return true;
  }
  
  // 408 请求超时时重试
  if (status === 408) {
    return true;
  }
  
  return false;
};

// 请求取消器管理
export class RequestCanceller {
  constructor() {
    this.pendingRequests = new Map();
  }
  
  // 添加请求
  addRequest(config) {
    const controller = new AbortController();
    const requestKey = this.getRequestKey(config);
    
    // 取消之前的相同请求
    if (this.pendingRequests.has(requestKey)) {
      this.cancelRequest(requestKey);
    }
    
    config.signal = controller.signal;
    this.pendingRequests.set(requestKey, controller);
    
    return config;
  }
  
  // 移除请求
  removeRequest(config) {
    const requestKey = this.getRequestKey(config);
    this.pendingRequests.delete(requestKey);
  }
  
  // 取消特定请求
  cancelRequest(key) {
    const controller = this.pendingRequests.get(key);
    if (controller) {
      controller.abort();
      this.pendingRequests.delete(key);
    }
  }
  
  // 取消所有请求
  cancelAllRequests() {
    this.pendingRequests.forEach(controller => controller.abort());
    this.pendingRequests.clear();
  }
  
  // 生成请求键
  getRequestKey(config) {
    return `${config.method?.toUpperCase()}_${config.url}`;
  }
}

// 导出默认配置
export const defaultErrorConfig = {
  enableRetry: true,
  maxRetries: 3,
  retryDelay: 1000,
  enableCancellation: true,
  enableLogging: process.env.NODE_ENV === 'development'
};