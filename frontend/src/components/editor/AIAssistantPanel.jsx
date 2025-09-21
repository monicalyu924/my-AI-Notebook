import React, { useState } from 'react';
import { 
  X, 
  Wand2, 
  Edit3, 
  Languages, 
  FileText, 
  MessageCircle,
  Lightbulb,
  Hash,
  Settings
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { aiAPI } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';

const AIAssistantPanel = ({ onClose, onInsertText, currentContent }) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState('');
  const [question, setQuestion] = useState('');
  const [targetLanguage, setTargetLanguage] = useState('English');
  const [error, setError] = useState('');
  const [selectedModel, setSelectedModel] = useState('anthropic/claude-3-sonnet');

  // 默认AI模型
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

  // 读取自定义模型
  const [customModels, setCustomModels] = useState(() => {
    const saved = localStorage.getItem('customChatModels');
    return saved ? JSON.parse(saved) : [];
  });

  // 合并模型列表
  const models = [...defaultModels, ...customModels];

  const handleAIAction = async (action, customText = null, additionalParams = {}) => {
    if (!user?.openrouter_api_key) {
      setError('请先在设置中配置你的 OpenRouter API 密钥');
      return;
    }

    const textToProcess = customText || currentContent;
    if (!textToProcess.trim()) {
      setError('请先选择一些文本或输入内容');
      return;
    }

    setIsLoading(true);
    setError('');
    setResult('');

    try {
      const request = {
        action,
        text: textToProcess,
        model: selectedModel, // 添加选择的模型
        ...additionalParams
      };

      const response = await aiAPI.processText(request);
      setResult(response.data.result);
    } catch (error) {
      console.error('AI processing failed:', error);
      setError(error.response?.data?.detail || 'AI processing failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinueWriting = () => {
    handleAIAction('continue');
  };

  const handlePolishText = () => {
    handleAIAction('polish');
  };

  const handleTranslate = () => {
    handleAIAction('translate', null, { target_language: targetLanguage });
  };

  const handleSummarize = () => {
    handleAIAction('summarize', currentContent);
  };

  const handleAskQuestion = () => {
    if (!question.trim()) {
      setError('请输入问题');
      return;
    }
    handleAIAction('question', currentContent, { question });
  };

  const handleGenerateTitle = () => {
    handleAIAction('generate_title', currentContent);
  };

  const handleGenerateTags = () => {
    handleAIAction('generate_tags', currentContent);
  };

  const insertResult = () => {
    if (result) {
      onInsertText(result);
      setResult('');
    }
  };

  return (
    <div className="w-80 bg-gray-50 border-l border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900">AI 助手</h3>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        
        {/* 模型选择器 */}
        <div className="mb-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            选择模型
          </label>
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {models.map((model) => (
              <option key={model.value} value={model.value}>
                {model.label} ({model.provider})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        {/* API Key Warning */}
        {!user?.openrouter_api_key && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <Settings className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-sm font-medium text-yellow-800 mb-1">
                  需要配置API密钥
                </h4>
                <p className="text-sm text-yellow-700 mb-2">
                  请先在设置中配置OpenRouter API密钥以使用AI功能
                </p>
                <Link
                  to="/settings"
                  className="inline-flex items-center text-sm text-yellow-800 hover:text-yellow-900 font-medium"
                >
                  前往设置 →
                </Link>
              </div>
            </div>
          </div>
        )}
        {/* 文本操作 */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">文本操作</h4>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleContinueWriting}
              disabled={isLoading || !currentContent}
              className="flex items-center p-3 text-sm bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Wand2 className="h-4 w-4 mr-2 text-purple-600" />
              继续写作
            </button>
            
            <button
              onClick={handlePolishText}
              disabled={isLoading || !currentContent}
              className="flex items-center p-3 text-sm bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Edit3 className="h-4 w-4 mr-2 text-blue-600" />
              优化润色
            </button>
          </div>
        </div>

        {/* 翻译 */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">翻译</h4>
          <div className="space-y-2">
            <select
              value={targetLanguage}
              onChange={(e) => setTargetLanguage(e.target.value)}
              className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="English">英文</option>
              <option value="Chinese">中文</option>
              <option value="Spanish">西班牙文</option>
              <option value="French">法文</option>
              <option value="German">德文</option>
              <option value="Japanese">日文</option>
            </select>
            <button
              onClick={handleTranslate}
              disabled={isLoading || !currentContent}
              className="w-full flex items-center justify-center p-3 text-sm bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Languages className="h-4 w-4 mr-2 text-green-600" />
              翻译
            </button>
          </div>
        </div>

        {/* 文档操作 */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">文档操作</h4>
          <div className="grid grid-cols-1 gap-2">
            <button
              onClick={handleSummarize}
              disabled={isLoading || !currentContent.trim()}
              className="flex items-center p-3 text-sm bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FileText className="h-4 w-4 mr-2 text-orange-600" />
              生成摘要
            </button>
            
            <button
              onClick={handleGenerateTitle}
              disabled={isLoading || !currentContent.trim()}
              className="flex items-center p-3 text-sm bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Lightbulb className="h-4 w-4 mr-2 text-yellow-600" />
              生成标题
            </button>
            
            <button
              onClick={handleGenerateTags}
              disabled={isLoading || !currentContent.trim()}
              className="flex items-center p-3 text-sm bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Hash className="h-4 w-4 mr-2 text-indigo-600" />
              生成标签
            </button>
          </div>
        </div>

        {/* 问答 */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">提问</h4>
          <div className="space-y-2">
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="问一个关于你笔记的问题..."
              className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
              rows={3}
            />
            <button
              onClick={handleAskQuestion}
              disabled={isLoading || !question.trim() || !currentContent.trim()}
              className="w-full flex items-center justify-center p-3 text-sm bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <MessageCircle className="h-4 w-4 mr-2 text-pink-600" />
              提问
            </button>
          </div>
        </div>

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-center p-4">
            <LoadingSpinner size="md" text="AI处理中..." />
          </div>
        )}

        {/* Error message */}
        {error && (
          <ErrorMessage
            message={error}
            onClose={() => setError('')}
            type="error"
          />
        )}

        {/* 结果 */}
        {result && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">AI 生成结果</h4>
            <div className="p-3 bg-white border border-gray-200 rounded-lg">
              <p className="text-sm text-gray-900 whitespace-pre-wrap">{result}</p>
            </div>
            <button
              onClick={insertResult}
              className="w-full p-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
            >
              插入到笔记
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIAssistantPanel;
