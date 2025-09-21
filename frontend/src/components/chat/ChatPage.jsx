import React, { useState, useRef, useEffect } from 'react';
import { 
  ArrowLeft,
  Send, 
  Settings,
  Bot,
  User,
  Loader,
  ChevronDown,
  Plus,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { chatAPI } from '../../utils/api';

const ChatPage = ({ onViewChange }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState('anthropic/claude-3-sonnet');
  const [showModelSelector, setShowModelSelector] = useState(false);
  const [customModels, setCustomModels] = useState([]);
  const [showAddModel, setShowAddModel] = useState(false);
  const [newModel, setNewModel] = useState({ value: '', label: '', provider: '' });
  const messagesEndRef = useRef(null);

  // 默认模型列表
  const defaultModels = [
    // Claude 模型
    { value: 'anthropic/claude-3.5-sonnet', label: 'Claude 3.5 Sonnet', provider: 'Anthropic' },
    { value: 'anthropic/claude-3-sonnet', label: 'Claude 3 Sonnet', provider: 'Anthropic' },
    { value: 'anthropic/claude-3-haiku', label: 'Claude 3 Haiku', provider: 'Anthropic' },
    { value: 'anthropic/claude-3-opus', label: 'Claude 3 Opus', provider: 'Anthropic' },
    
    // OpenAI 模型
    { value: 'openai/gpt-4o', label: 'GPT-4o', provider: 'OpenAI' },
    { value: 'openai/gpt-4o-mini', label: 'GPT-4o Mini', provider: 'OpenAI' },
    { value: 'openai/gpt-4-turbo', label: 'GPT-4 Turbo', provider: 'OpenAI' },
    { value: 'openai/gpt-3.5-turbo', label: 'GPT-3.5 Turbo', provider: 'OpenAI' },
    
    // Google Gemini 模型
    { value: 'google/gemini-pro-1.5', label: 'Gemini 1.5 Pro', provider: 'Google' },
    { value: 'google/gemini-flash-1.5', label: 'Gemini 1.5 Flash', provider: 'Google' },
    { value: 'google/gemini-pro', label: 'Gemini Pro', provider: 'Google' },
    { value: 'google/gemini-pro-vision', label: 'Gemini Pro Vision', provider: 'Google' },
    
    // Meta Llama 模型
    { value: 'meta-llama/llama-3.1-70b-instruct', label: 'Llama 3.1 70B', provider: 'Meta' },
    { value: 'meta-llama/llama-3.1-8b-instruct', label: 'Llama 3.1 8B', provider: 'Meta' },
  ];

  // 合并默认模型和自定义模型
  const models = [...defaultModels, ...customModels];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 加载自定义模型
  useEffect(() => {
    const savedModels = localStorage.getItem('customChatModels');
    if (savedModels) {
      try {
        setCustomModels(JSON.parse(savedModels));
      } catch (error) {
        console.error('Failed to load custom models:', error);
      }
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 保存自定义模型
  const saveCustomModels = (models) => {
    localStorage.setItem('customChatModels', JSON.stringify(models));
    setCustomModels(models);
  };

  // 添加自定义模型
  const handleAddModel = () => {
    if (!newModel.value || !newModel.label || !newModel.provider) {
      alert('请填写完整的模型信息');
      return;
    }

    const updatedModels = [...customModels, newModel];
    saveCustomModels(updatedModels);
    setNewModel({ value: '', label: '', provider: '' });
    setShowAddModel(false);
  };

  // 删除自定义模型
  const handleDeleteModel = (modelValue) => {
    const updatedModels = customModels.filter(m => m.value !== modelValue);
    saveCustomModels(updatedModels);
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;
    if (!user?.openrouter_api_key) {
      alert('请先在设置中配置 OpenRouter API 密钥');
      return;
    }

    const userMessage = {
      id: Date.now(),
      content: inputMessage.trim(),
      role: 'user',
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await chatAPI.quickChat(userMessage.content, selectedModel);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      let aiContent = '';
      const aiMessage = {
        id: Date.now() + 1,
        content: '',
        role: 'assistant',
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, aiMessage]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data.trim() === '') continue;

            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                aiContent += parsed.content;
                setMessages(prev => prev.map(msg => 
                  msg.id === aiMessage.id 
                    ? { ...msg, content: aiContent }
                    : msg
                ));
              }
              if (parsed.status === 'end') {
                break;
              }
              if (parsed.error) {
                throw new Error(parsed.error);
              }
            } catch (parseError) {
              console.error('Error parsing stream data:', parseError);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        id: Date.now() + 1,
        content: `错误: ${error.message}`,
        role: 'assistant',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearConversation = () => {
    setMessages([]);
  };

  if (!user?.openrouter_api_key) {
    return (
      <div className="flex h-screen bg-gray-50">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center p-8 max-w-md">
            <Settings className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">需要配置 API 密钥</h2>
            <p className="text-gray-600 mb-6">请先在设置中配置 OpenRouter API 密钥以使用 AI 聊天功能</p>
            <div className="space-y-3">
              <button
                onClick={() => onViewChange && onViewChange('workspace')}
                className="flex items-center justify-center w-full px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                返回主界面
              </button>
              <button
                onClick={() => alert('请使用侧边栏的设置按钮前往设置页面')}
                className="flex items-center justify-center w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Settings className="h-4 w-4 mr-2" />
                前往设置
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* 主聊天区域 */}
      <div className="flex-1 flex flex-col">
        {/* 头部 */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => onViewChange && onViewChange('workspace')}
                className="flex items-center text-gray-600 hover:text-gray-900 text-sm"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                返回主界面
              </button>
              <div className="h-6 w-px bg-gray-300"></div>
              <h1 className="text-lg font-semibold text-gray-900">AI 对话</h1>
            </div>

            {/* 模型选择器 */}
            <div className="relative">
              <button
                onClick={() => setShowModelSelector(!showModelSelector)}
                className="flex items-center space-x-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <Bot className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">
                  {models.find(m => m.value === selectedModel)?.label}
                </span>
                <ChevronDown className="h-4 w-4 text-gray-600" />
              </button>

              {showModelSelector && (
                <div className="absolute right-0 top-full mt-1 w-72 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-96 overflow-y-auto">
                  {/* 默认模型 */}
                  <div className="border-b border-gray-100 p-2">
                    <div className="text-xs font-semibold text-gray-500 px-2 pb-2">默认模型</div>
                    {defaultModels.map((model) => (
                      <button
                        key={model.value}
                        onClick={() => {
                          setSelectedModel(model.value);
                          setShowModelSelector(false);
                        }}
                        className={`w-full text-left px-3 py-2 hover:bg-gray-50 rounded-md text-sm ${
                          selectedModel === model.value ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                        }`}
                      >
                        <div className="font-medium">{model.label}</div>
                        <div className="text-xs text-gray-500">{model.provider}</div>
                      </button>
                    ))}
                  </div>
                  
                  {/* 自定义模型 */}
                  {customModels.length > 0 && (
                    <div className="border-b border-gray-100 p-2">
                      <div className="text-xs font-semibold text-gray-500 px-2 pb-2">自定义模型</div>
                      {customModels.map((model) => (
                        <div key={model.value} className="flex items-center group">
                          <button
                            onClick={() => {
                              setSelectedModel(model.value);
                              setShowModelSelector(false);
                            }}
                            className={`flex-1 text-left px-3 py-2 hover:bg-gray-50 rounded-md text-sm ${
                              selectedModel === model.value ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                            }`}
                          >
                            <div className="font-medium">{model.label}</div>
                            <div className="text-xs text-gray-500">{model.provider}</div>
                          </button>
                          <button
                            onClick={() => handleDeleteModel(model.value)}
                            className="opacity-0 group-hover:opacity-100 p-1 text-red-500 hover:text-red-700"
                            title="删除模型"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* 添加模型按钮 */}
                  <div className="p-2">
                    <button
                      onClick={() => setShowAddModel(true)}
                      className="w-full flex items-center justify-center px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      添加自定义模型
                    </button>
                  </div>
                </div>
              )}
              
              {/* 添加模型弹窗 */}
              {showAddModel && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-white rounded-lg p-6 w-96 max-w-[90vw]">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold">添加自定义模型</h3>
                      <button
                        onClick={() => {
                          setShowAddModel(false);
                          setNewModel({ value: '', label: '', provider: '' });
                        }}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          模型标识 (如: anthropic/claude-3-opus)
                        </label>
                        <input
                          type="text"
                          value={newModel.value}
                          onChange={(e) => setNewModel({...newModel, value: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="anthropic/claude-3-opus"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          显示名称
                        </label>
                        <input
                          type="text"
                          value={newModel.label}
                          onChange={(e) => setNewModel({...newModel, label: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Claude 3 Opus"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          提供商
                        </label>
                        <input
                          type="text"
                          value={newModel.provider}
                          onChange={(e) => setNewModel({...newModel, provider: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Anthropic"
                        />
                      </div>
                    </div>
                    
                    <div className="flex justify-end space-x-3 mt-6">
                      <button
                        onClick={() => {
                          setShowAddModel(false);
                          setNewModel({ value: '', label: '', provider: '' });
                        }}
                        className="px-4 py-2 text-gray-600 hover:text-gray-800"
                      >
                        取消
                      </button>
                      <button
                        onClick={handleAddModel}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                      >
                        添加
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 对话区域 */}
        <div className="flex-1 overflow-auto both-scroll touch-scroll">
          <div className="h-full overflow-y-auto p-6">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <Bot className="h-16 w-16 mb-4 text-gray-300" />
                <h3 className="text-lg font-medium mb-2">开始与 AI 对话</h3>
                <p className="text-center max-w-md">
                  选择一个模型，然后在下方输入框中输入您的问题，开始一段有趣的对话！
                </p>
              </div>
            ) : (
              <div className="max-w-5xl mx-auto space-y-6">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex max-w-[80%] ${
                      message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                    }`}>
                      {/* 头像 */}
                      <div className={`flex-shrink-0 ${message.role === 'user' ? 'ml-3' : 'mr-3'}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          message.role === 'user' 
                            ? 'bg-blue-600' 
                            : 'bg-gray-700'
                        }`}>
                          {message.role === 'user' ? (
                            <User className="h-4 w-4 text-white" />
                          ) : (
                            <Bot className="h-4 w-4 text-white" />
                          )}
                        </div>
                      </div>

                      {/* 消息内容 */}
                      <div className={`rounded-lg px-4 py-3 ${
                        message.role === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-white border border-gray-200 text-gray-800'
                      }`}>
                        <p className="whitespace-pre-wrap">{message.content}</p>
                        <p className={`text-xs mt-2 ${
                          message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                        }`}>
                          {new Date(message.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}

                {/* 加载中指示器 */}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="flex max-w-[80%]">
                      <div className="flex-shrink-0 mr-3">
                        <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
                          <Bot className="h-4 w-4 text-white" />
                        </div>
                      </div>
                      <div className="bg-white border border-gray-200 rounded-lg px-4 py-3">
                        <div className="flex items-center space-x-2">
                          <Loader className="h-4 w-4 animate-spin text-gray-400" />
                          <span className="text-gray-500">AI 正在思考中...</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </div>

        {/* 输入区域 */}
        <div className="bg-white border-t border-gray-200 p-6">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center space-x-3">
              {messages.length > 0 && (
                <button
                  onClick={clearConversation}
                  className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  清空对话
                </button>
              )}
              
              <div className="flex-1 relative">
                <textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="输入您的问题..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={1}
                  style={{ minHeight: '48px', maxHeight: '120px' }}
                />
              </div>

              <button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isLoading}
                className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-gray-500 mt-2 text-center">
              按 Enter 发送消息，Shift + Enter 换行
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;