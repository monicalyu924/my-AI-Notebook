import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../utils/api';
import { getToken, setToken, removeToken, getUser, setUser, isAuthenticated } from '../utils/auth';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUserState] = useState(getUser());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      if (isAuthenticated()) {
        try {
          const response = await authAPI.getProfile();
          setUserState(response.data);
          setUser(response.data);
        } catch (error) {
          console.error('Failed to get user profile:', error);
          logout();
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (credentials) => {
    try {
      const response = await authAPI.login(credentials);
      const { access_token } = response.data;
      
      setToken(access_token);
      
      // Get user profile
      const profileResponse = await authAPI.getProfile();
      const userData = profileResponse.data;
      
      setUserState(userData);
      setUser(userData);
      
      return { success: true };
    } catch (error) {
      console.error('Login failed:', error);
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Login failed' 
      };
    }
  };

  const register = async (userData) => {
    try {
      console.log('发起注册请求...', userData);
      const response = await authAPI.register(userData);
      console.log('注册响应:', response);
      
      const { access_token } = response.data;
      
      setToken(access_token);
      
      // 延迟获取用户资料，避免立即认证问题
      setTimeout(async () => {
        try {
          const profileResponse = await authAPI.getProfile();
          const userProfile = profileResponse.data;
          
          setUserState(userProfile);
          setUser(userProfile);
          console.log('用户资料获取成功:', userProfile);
        } catch (profileError) {
          console.warn('获取用户资料失败，但注册成功:', profileError);
          // 创建基本用户信息
          const basicUser = {
            email: userData.email,
            full_name: userData.full_name
          };
          setUserState(basicUser);
          setUser(basicUser);
        }
      }, 100);
      
      return { success: true };
    } catch (error) {
      console.error('注册失败详细信息:', error);
      const errorMessage = error.response?.data?.detail || error.message || '注册失败';
      return { 
        success: false, 
        error: errorMessage
      };
    }
  };

  const logout = () => {
    removeToken();
    setUserState(null);
  };

  const updateUser = (userData) => {
    setUserState(userData);
    setUser(userData);
  };

  const value = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
