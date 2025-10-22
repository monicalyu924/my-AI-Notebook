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
    google_api_key: user?.google_api_key || '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' or 'error'
  const [keyWarning, setKeyWarning] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setMessage('');
    if (e.target.name === 'openrouter_api_key') {
      const value = (e.target.value || '').trim();
      if (value && !value.startsWith('sk-or-')) {
        setKeyWarning('这看起来不像是 OpenRouter 密钥（应以 sk-or- 开头）。Claude Code/Anthropic 控制台的密钥无法在此使用。');
      } else {
        setKeyWarning('');
      }
    }
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
              {keyWarning && (
                <div className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-md p-2">
                  {keyWarning}
                </div>
              )}
                  <div className="mt-2 space-y-3">
                    {/* 错误提示 */}
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-start space-x-2">
                        <div className="text-red-600 text-lg">❌</div>
                        <div className="text-sm text-red-800">
                          <p className="font-medium mb-1">Claude Code 密钥错误</p>
                          <p className="mb-2">
                            如果你看到错误："This credential is only authorized for use with Claude Code"
                          </p>
                          <p>
                            这说明你使用了 Claude Code 专用密钥，它不能用于其他 API 调用。
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* 正确做法 */}
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-start space-x-2">
                        <div className="text-green-600 text-lg">✅</div>
                        <div className="text-sm text-green-800">
                          <p className="font-medium mb-2">正确的设置步骤</p>
                          <ol className="space-y-1 list-decimal list-inside">
                            <li>
                              访问{' '}
                              <a
                                href="https://openrouter.ai"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-medium underline hover:no-underline"
                              >
                                OpenRouter.ai
                              </a>
                              {' '}注册账号
                            </li>
                            <li>在 Credits 页面购买积分</li>
                            <li>在 Keys 页面创建新的 API 密钥</li>
                            <li>确保密钥以 <code className="bg-green-100 px-1 rounded font-mono">sk-or-</code> 开头</li>
                            <li>将密钥粘贴到上方输入框中</li>
                          </ol>
                        </div>
                      </div>
                    </div>

                    {/* 提示信息 */}
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-start space-x-2">
                        <div className="text-blue-600 text-lg">💡</div>
                        <div className="text-sm text-blue-800">
                          <p className="font-medium mb-1">关于 OpenRouter</p>
                          <p>
                            OpenRouter 提供多种 AI 模型的统一访问，包括 Claude、GPT、Gemini 等。
                            你只需要一个 OpenRouter 密钥就能使用所有支持的模型。
                            你的密钥会被安全存储，仅用于你的 AI 请求。
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                {/* Google API Key */}
                <div className="mt-6">
                  <Input
                    label="Google API Key (用于 Nano Banana 图像生成)"
                    type="password"
                    name="google_api_key"
                    value={formData.google_api_key}
                    onChange={handleChange}
                    placeholder="输入你的 Google API 密钥"
                    leftIcon={<Key className="h-5 w-5" />}
                  />

                  <div className="mt-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <div className="text-purple-600 text-lg">🎨</div>
                      <div className="text-sm text-purple-800">
                        <p className="font-medium mb-2">配置 Nano Banana 图像生成</p>
                        <ol className="space-y-1 list-decimal list-inside">
                          <li>
                            访问{' '}
                            <a
                              href="https://aistudio.google.com/app/apikey"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-medium underline hover:no-underline"
                            >
                              Google AI Studio
                            </a>
                            {' '}创建 API 密钥
                          </li>
                          <li>点击"Create API Key"生成新密钥</li>
                          <li>将密钥粘贴到上方输入框中</li>
                          <li>保存后即可在 <a href="/image-generator" className="underline">图像生成器</a> 中使用</li>
                        </ol>
                        <p className="mt-2 text-xs">
                          💡 Nano Banana 使用 Google Gemini 2.5 Flash Image Preview 模型，支持文本生成图像和图像编辑功能。
                        </p>
                      </div>
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
