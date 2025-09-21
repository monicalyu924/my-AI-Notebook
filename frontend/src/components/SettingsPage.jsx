import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Key, User, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { userAPI } from '../utils/api';
import { Button, Input, Card, CardHeader, CardContent } from './atlassian-ui';

const SettingsPage = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  
  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    openrouter_api_key: user?.openrouter_api_key || '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' or 'error'

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    try {
      const response = await userAPI.updateProfile(formData);
      updateUser(response.data);
      setMessage('Settings saved successfully!');
      setMessageType('success');
    } catch (error) {
      console.error('Failed to update profile:', error);
      setMessage(error.response?.data?.detail || 'Failed to save settings');
      setMessageType('error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-notion-bg">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-4">
            <Link
              to="/app"
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <form onSubmit={handleSubmit}>
            {/* Profile Section */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3 mb-4">
                <User className="h-5 w-5 text-gray-400" />
                <h2 className="text-lg font-semibold text-gray-900">个人信息</h2>
              </div>
              
              <div className="space-y-4">
                <Input
                  label="邮箱地址"
                  type="email"
                  value={user?.email || ''}
                  disabled
                  helperText="邮箱地址无法修改"
                  leftIcon={<User className="h-5 w-5" />}
                />
                
                <Input
                  label="姓名"
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  placeholder="请输入您的姓名"
                  leftIcon={<User className="h-5 w-5" />}
                />
              </div>
            </div>

            {/* API Configuration Section */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3 mb-4">
                <Key className="h-5 w-5 text-gray-400" />
                <h2 className="text-lg font-semibold text-gray-900">API Configuration</h2>
              </div>
              
              <div className="space-y-4">
                <Input
                  label="OpenRouter API Key"
                  type="password"
                  name="openrouter_api_key"
                  value={formData.openrouter_api_key}
                  onChange={handleChange}
                  placeholder="Enter your OpenRouter API key"
                  leftIcon={<Key className="h-5 w-5" />}
                />
                  <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <Shield className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-blue-800">
                        <p className="font-medium mb-1">About OpenRouter API Key</p>
                        <p>
                          Your API key is required to use AI features. Get your key from{' '}
                          <a
                            href="https://openrouter.ai"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium underline hover:no-underline"
                          >
                            OpenRouter.ai
                          </a>
                          . Your key is stored securely and only used for your AI requests.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            {/* Message */}
            {message && (
              <div className="p-6 border-b border-gray-200">
                <div className={`p-3 rounded-lg ${
                  messageType === 'success' 
                    ? 'bg-green-50 border border-green-200 text-green-700'
                    : 'bg-red-50 border border-red-200 text-red-700'
                }`}>
                  {message}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  提交表单后，修改将自动保存。
                </div>
                <Button
                  type="submit"
                  variant="primary"
                  size="medium"
                  loading={isLoading}
                  disabled={isLoading}
                  leftIcon={<Save className="h-4 w-4" />}
                >
                  {isLoading ? '保存中...' : '保存设置'}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
