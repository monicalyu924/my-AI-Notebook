import React, { useState, useEffect } from 'react';
import { TrendingUp, Clock, Target, AlertCircle, X, RefreshCw, Calendar, BarChart3 } from 'lucide-react';
import { useAIProjectStore } from '../../store/aiProjectStore';
import { useProjectBoardStore } from '../../store/projectBoardStore';

const AIPredictionsPanel = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('timeline'); // timeline, workload, bottleneck
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const { 
    aiPredictions, 
    isAIProcessing, 
    generateAIPredictions,
    clearAIPredictions 
  } = useAIProjectStore();
  
  const { currentBoard } = useProjectBoardStore();

  useEffect(() => {
    if (isOpen && aiPredictions.length === 0) {
      handleGeneratePredictions();
    }
  }, [isOpen]);

  const handleGeneratePredictions = async () => {
    if (!currentBoard) return;
    
    setIsRefreshing(true);
    await generateAIPredictions(currentBoard);
    setIsRefreshing(false);
  };

  const getPredictionIcon = (type) => {
    switch (type) {
      case 'completion_date':
        return Calendar;
      case 'workload':
        return BarChart3;
      case 'bottleneck':
        return AlertCircle;
      default:
        return Target;
    }
  };

  const getPredictionColor = (type) => {
    switch (type) {
      case 'completion_date':
        return 'text-blue-500 bg-blue-50 border-blue-200';
      case 'workload':
        return 'text-green-500 bg-green-50 border-green-200';
      case 'bottleneck':
        return 'text-orange-500 bg-orange-50 border-orange-200';
      default:
        return 'text-gray-500 bg-gray-50 border-gray-200';
    }
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.8) return 'text-green-600 bg-green-100';
    if (confidence >= 0.6) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const tabs = [
    { key: 'timeline', label: '时间线预测', icon: Calendar },
    { key: 'workload', label: '工作量分析', icon: BarChart3 },
    { key: 'bottleneck', label: '瓶颈预警', icon: AlertCircle }
  ];

  const filteredPredictions = aiPredictions.filter(prediction => {
    if (activeTab === 'timeline') return prediction.type === 'completion_date';
    if (activeTab === 'workload') return prediction.type === 'workload';
    if (activeTab === 'bottleneck') return prediction.type === 'bottleneck';
    return true;
  });

  const renderTimelineChart = () => {
    const timelinePredictions = aiPredictions.filter(p => p.type === 'completion_date');
    if (timelinePredictions.length === 0) return null;

    const prediction = timelinePredictions[0];
    const currentProgress = prediction.data?.currentProgress || 0;
    const predictedDate = prediction.data?.predictedDate || '未知';

    return (
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-blue-900">项目完成时间预测</h3>
          <div className="flex items-center space-x-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getConfidenceColor(prediction.confidence)}`}>
              {Math.round(prediction.confidence * 100)}% 置信度
            </span>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-blue-700 font-medium">当前进度</span>
            <span className="text-blue-900 font-bold">{currentProgress}%</span>
          </div>
          
          <div className="w-full bg-blue-200 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-blue-500 to-indigo-600 h-3 rounded-full transition-all duration-500"
              style={{ width: `${currentProgress}%` }}
            />
          </div>
          
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              <span className="text-blue-700">预测完成日期:</span>
            </div>
            <span className="text-xl font-bold text-blue-900">{predictedDate}</span>
          </div>
        </div>
      </div>
    );
  };

  const renderWorkloadAnalysis = () => {
    const workloadPredictions = aiPredictions.filter(p => p.type === 'workload');
    if (workloadPredictions.length === 0) return null;

    const prediction = workloadPredictions[0];
    const peakDays = prediction.data?.peakDays || [];
    const estimatedHours = prediction.data?.estimatedHours || 0;

    return (
      <div className="space-y-4">
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-xl border border-green-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-green-900">工作量预测分析</h3>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getConfidenceColor(prediction.confidence)}`}>
              {Math.round(prediction.confidence * 100)}% 置信度
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-lg">
              <h4 className="font-medium text-green-800 mb-2">预计总工时</h4>
              <div className="text-3xl font-bold text-green-900">{estimatedHours}h</div>
            </div>
            
            <div className="bg-white p-4 rounded-lg">
              <h4 className="font-medium text-green-800 mb-2">工作高峰期</h4>
              <div className="space-y-1">
                {peakDays.slice(0, 3).map((day, index) => (
                  <div key={day} className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span className="text-sm text-green-700">{new Date(day).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderBottleneckWarning = () => {
    const bottleneckPredictions = aiPredictions.filter(p => p.type === 'bottleneck');
    if (bottleneckPredictions.length === 0) return null;

    return (
      <div className="space-y-4">
        {bottleneckPredictions.map((prediction, index) => (
          <div key={prediction.id} className="bg-gradient-to-r from-orange-50 to-red-50 p-6 rounded-xl border border-orange-200"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-orange-900">{prediction.title}</h3>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getConfidenceColor(prediction.confidence)}`}>
                {Math.round(prediction.confidence * 100)}% 置信度
              </span>
            </div>
            
            <p className="text-orange-800 mb-4">{prediction.description}</p>
            
            {prediction.data && (
              <div className="bg-white p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-orange-600 font-medium">瓶颈类型: </span>
                    <span className="text-orange-800">{prediction.data.bottleneckPhase}</span>
                  </div>
                  <div>
                    <span className="text-orange-600 font-medium">严重程度: </span>
                    <span className={`px-2 py-1 rounded text-xs ${
                      prediction.data.severity === 'high' ? 'bg-red-100 text-red-800' :
                      prediction.data.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {prediction.data.severity === 'high' ? '高' :
                       prediction.data.severity === 'medium' ? '中' : '低'}
                    </span>
                  </div>
                </div>
              </div>
            )}
            
            <div className="mt-4 flex space-x-3">
              <button className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm"
              >
                查看解决方案
              </button>
              <button className="px-4 py-2 border border-orange-300 text-orange-700 rounded-lg hover:bg-orange-50 transition-colors text-sm"
              >
                设置预警
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-green-500 to-blue-600 rounded-lg">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">AI 预测分析</h2>
              <p className="text-sm text-gray-600">基于历史数据的智能预测</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleGeneratePredictions}
              disabled={isAIProcessing || isRefreshing}
              className="flex items-center space-x-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>重新预测</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center space-x-2 px-6 py-4 border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? 'border-green-500 text-green-600 bg-green-50'
                    : 'border-transparent text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isAIProcessing && aiPredictions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-600 rounded-full flex items-center justify-center animate-pulse">
                  <TrendingUp className="w-8 h-8 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-400 rounded-full flex items-center justify-center">
                  <div className="w-3 h-3 bg-green-600 rounded-full animate-ping" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-2">AI正在生成预测分析</h3>
              <p className="text-gray-600 text-center max-w-md">
                正在分析历史数据、当前进度和团队表现，为您生成精准的项目预测...
              </p>
              <div className="mt-4 flex space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}} />
                <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}} />
              </div>
            </div>
          ) : filteredPredictions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <TrendingUp className="w-16 h-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium mb-2">暂无预测数据</h3>
              <p className="text-center max-w-md mb-4">
                {currentBoard ? '点击"重新预测"按钮来获取AI预测分析' : '请先选择一个项目看板'}
              </p>
              {currentBoard && (
                <button
                  onClick={handleGeneratePredictions}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>开始预测</span>
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {activeTab === 'timeline' && renderTimelineChart()}
              {activeTab === 'workload' && renderWorkloadAnalysis()}
              {activeTab === 'bottleneck' && renderBottleneckWarning()}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4" />
              <span>基于时间序列分析和机器学习算法</span>
            </div>
            <div className="flex items-center space-x-4">
              <span>{aiPredictions.length} 条预测</span>
              <button
                onClick={clearAIPredictions}
                className="text-red-600 hover:text-red-700"
              >
                清除所有
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIPredictionsPanel;