import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, X, Loader, Sparkles, Brain, TrendingUp, AlertTriangle } from 'lucide-react';
import { useAIProjectStore } from '../../store/aiProjectStore';
import { useProjectBoardStore } from '../../store/projectBoardStore';

const AIAssistant = ({ isOpen, onClose }) => {
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const { 
    aiChatMessages, 
    isAIProcessing, 
    addAIChatMessage, 
    clearAIChat,
    generateAIInsights,
    generateAIPredictions
  } = useAIProjectStore();

  const { currentBoard } = useProjectBoardStore();

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [aiChatMessages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isAIProcessing) return;

    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date().toISOString(),
      context: currentBoard ? `当前项目: ${currentBoard.title}` : ''
    };

    addAIChatMessage(userMessage);
    setInputMessage('');

    // 生成AI回复
    await generateAIResponse(inputMessage);
  };

  const generateAIResponse = async (message) => {
    // 模拟AI处理
    setTimeout(() => {
      let aiResponse = '';
      
      // 根据用户输入生成不同的回复
      if (message.toLowerCase().includes('分析') || message.toLowerCase().includes('insight')) {
        generateAIInsights(currentBoard);
        aiResponse = '正在分析项目数据，请稍候...我已经开始生成关于项目进度、风险和机会的洞察。';
      } else if (message.toLowerCase().includes('预测') || message.toLowerCase().includes('prediction')) {
        generateAIPredictions(currentBoard);
        aiResponse = '基于历史数据和当前进度，我正在生成项目完成时间、工作量预测和潜在瓶颈分析。';
      } else if (message.toLowerCase().includes('建议') || message.toLowerCase().includes('suggest')) {
        aiResponse = `根据当前项目状态，我建议：\n\n1. 优先处理即将到期的任务\n2. 重新分配工作负载较重的成员的任务\n3. 考虑将大任务拆分为更小的子任务\n\n需要我提供更详细的建议吗？`;
      } else if (message.toLowerCase().includes('自动化') || message.toLowerCase().includes('automation')) {
        aiResponse = '我可以帮您设置自动化规则，比如：\n- 自动移动逾期任务\n- 智能分配新任务\n- 进度预警提醒\n\n您希望配置哪种自动化？';
      } else {
        aiResponse = '我是您的AI项目管理助手。我可以帮您：\n\n🔍 分析项目数据和洞察\n📊 生成进度预测和风险评估  \n💡 提供任务管理建议\n⚡ 配置自动化规则\n\n请告诉我您需要什么帮助！';
      }

      const aiMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date().toISOString()
      };

      addAIChatMessage(aiMessage);
    }, 1000);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const quickActions = [
    {
      icon: Brain,
      title: '分析项目',
      description: '获取AI洞察',
      action: () => {
        const message = '请分析当前项目状态';
        setInputMessage(message);
        setTimeout(() => handleSendMessage(), 100);
      }
    },
    {
      icon: TrendingUp,
      title: '预测进度',
      description: '生成进度预测',
      action: () => {
        const message = '预测项目完成时间';
        setInputMessage(message);
        setTimeout(() => handleSendMessage(), 100);
      }
    },
    {
      icon: AlertTriangle,
      title: '风险识别',
      description: '识别潜在风险',
      action: () => {
        const message = '识别项目中的潜在风险';
        setInputMessage(message);
        setTimeout(() => handleSendMessage(), 100);
      }
    }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">AI项目管理助手</h2>
              <p className="text-sm text-gray-600">智能分析 • 预测 • 建议</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Quick Actions */}
        <div className="p-4 border-b border-gray-100">
          <div className="grid grid-cols-3 gap-3">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={action.action}
                className="flex flex-col items-center p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors text-center"
              >
                <action.icon className="w-5 h-5 text-blue-600 mb-2" />
                <div className="text-sm font-medium text-gray-900 mb-1">{action.title}</div>
                <div className="text-xs text-gray-600">{action.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {aiChatMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <Sparkles className="w-16 h-16 mb-4 text-gray-300" />
              <h3 className="text-lg font-medium mb-2">开始AI对话</h3>
              <p className="text-center max-w-md">
                我是您的AI项目管理助手，可以帮您分析项目、预测进度、识别风险等。试试上面的快捷操作或直接输入您的问题！
              </p>
            </div>
          ) : (
            aiChatMessages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex max-w-[80%] ${
                  message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                }`}>
                  {/* Avatar */}
                  <div className={`flex-shrink-0 ${message.role === 'user' ? 'ml-3' : 'mr-3'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      message.role === 'user' 
                        ? 'bg-blue-600' 
                        : 'bg-gradient-to-r from-blue-500 to-purple-600'
                    }`}>
                      {message.role === 'user' ? (
                        <User className="w-4 h-4 text-white" />
                      ) : (
                        <Bot className="w-4 h-4 text-white" />
                      )}
                    </div>
                  </div>

                  {/* Message Content */}
                  <div className={`rounded-lg px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                    <div className={`text-xs mt-2 ${
                      message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
          
          {isAIProcessing && (
            <div className="flex justify-start">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-gray-100 rounded-lg px-4 py-3">
                  <div className="flex items-center space-x-2">
                    <Loader className="w-4 h-4 animate-spin text-blue-600" />
                    <span className="text-sm text-gray-600">AI正在思考...</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-end space-x-3">
            <div className="flex-1">
              <textarea
                ref={inputRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="输入您的问题... (Enter发送，Shift+Enter换行)"
                className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                disabled={isAIProcessing}
              />
            </div>
            <button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isAIProcessing}
              className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {isAIProcessing ? (
                <Loader className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;