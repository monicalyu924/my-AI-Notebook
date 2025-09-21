import React, { useState, useEffect } from 'react';
import { Clock, BarChart3, Calendar, Target, ArrowLeft, RotateCcw, Settings } from 'lucide-react';
import PomodoroTimer from './PomodoroTimer';

const PomodoroPage = ({ onViewChange }) => {
  // 从localStorage读取统计数据，或者使用默认值
  const [stats, setStats] = useState(() => {
    const saved = localStorage.getItem('pomodoroStats');
    return saved ? JSON.parse(saved) : {
      todayCompleted: 0,
      weekCompleted: 0,
      totalCompleted: 0,
      streak: 0,
      lastActiveDate: new Date().toDateString()
    };
  });

  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // 保存统计数据到localStorage
  useEffect(() => {
    localStorage.setItem('pomodoroStats', JSON.stringify(stats));
  }, [stats]);

  // 检查日期变化，重置今日数据
  useEffect(() => {
    const today = new Date().toDateString();
    if (stats.lastActiveDate !== today) {
      setStats(prev => ({
        ...prev,
        todayCompleted: 0,
        lastActiveDate: today
      }));
    }
  }, []);

  // 完成一个番茄钟时调用
  const onPomodoroComplete = () => {
    setStats(prev => ({
      ...prev,
      todayCompleted: prev.todayCompleted + 1,
      weekCompleted: prev.weekCompleted + 1,
      totalCompleted: prev.totalCompleted + 1,
      streak: prev.streak + 1,
      lastActiveDate: new Date().toDateString()
    }));
  };

  // 重置所有数据
  const resetAllStats = () => {
    setStats({
      todayCompleted: 0,
      weekCompleted: 0,
      totalCompleted: 0,
      streak: 0,
      lastActiveDate: new Date().toDateString()
    });
    setShowResetConfirm(false);
  };

  // 重置今日数据
  const resetTodayStats = () => {
    setStats(prev => ({
      ...prev,
      todayCompleted: 0
    }));
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* 主内容区域 */}
      <div className="flex-1 flex flex-col">
        {/* 头部 */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center mb-2">
                <button
                  onClick={() => onViewChange && onViewChange('workspace')}
                  className="flex items-center text-gray-600 hover:text-gray-900 text-sm mr-4"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  返回主界面
                </button>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">番茄钟工作法</h1>
              <p className="text-gray-600 mt-1">保持专注，提升效率</p>
            </div>
            <div className="flex items-center space-x-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.todayCompleted}</div>
                <div className="text-sm text-gray-500">今日完成</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{stats.streak}</div>
                <div className="text-sm text-gray-500">连续天数</div>
              </div>
              {/* 重置按钮 */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={resetTodayStats}
                  className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="重置今日数据"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setShowResetConfirm(true)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="重置所有数据"
                >
                  <Settings className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 内容区域 */}
        <div className="flex-1 p-6">
          <div className="w-full mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* 番茄钟计时器 */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                  <PomodoroTimer onComplete={onPomodoroComplete} />
                </div>
              </div>

              {/* 侧边栏 - 统计和说明 */}
              <div className="space-y-6">
                {/* 统计卡片 */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                    <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
                    统计数据
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                        <span className="text-sm text-gray-600">本周完成</span>
                      </div>
                      <span className="font-medium text-gray-900">{stats.weekCompleted}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Target className="h-4 w-4 mr-2 text-gray-400" />
                        <span className="text-sm text-gray-600">总计完成</span>
                      </div>
                      <span className="font-medium text-gray-900">{stats.totalCompleted}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2 text-gray-400" />
                        <span className="text-sm text-gray-600">专注时长</span>
                      </div>
                      <span className="font-medium text-gray-900">{Math.floor(stats.totalCompleted * 25 / 60)}小时</span>
                    </div>
                  </div>
                </div>

                {/* 番茄工作法说明 */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">番茄工作法</h3>
                  <div className="text-sm text-gray-600 space-y-3">
                    <div className="flex items-start">
                      <div className="w-6 h-6 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-xs font-medium mr-3 mt-0.5">
                        1
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">专注工作</div>
                        <div>专注工作25分钟，避免任何干扰</div>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs font-medium mr-3 mt-0.5">
                        2
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">短暂休息</div>
                        <div>休息5分钟，放松身心</div>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium mr-3 mt-0.5">
                        3
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">重复循环</div>
                        <div>重复步骤1-2，每4个番茄钟后进行长休息</div>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xs font-medium mr-3 mt-0.5">
                        4
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">长休息</div>
                        <div>休息15-30分钟，彻底放松</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 提示卡片 */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="font-medium text-yellow-800 mb-2">💡 使用提示</h4>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    <li>• 选择一个具体的任务开始</li>
                    <li>• 关闭通知和干扰源</li>
                    <li>• 记录完成的番茄钟数量</li>
                    <li>• 休息时间远离工作区域</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 重置确认对话框 */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <RotateCcw className="h-5 w-5 text-red-600" />
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-gray-900">重置所有数据</h3>
                <p className="text-sm text-gray-500 mt-1">此操作将清除所有番茄钟统计数据</p>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">将被重置的数据：</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• 今日完成：{stats.todayCompleted} 个番茄钟</li>
                <li>• 本周完成：{stats.weekCompleted} 个番茄钟</li>
                <li>• 总计完成：{stats.totalCompleted} 个番茄钟</li>
                <li>• 连续天数：{stats.streak} 天</li>
                <li>• 专注时长：{Math.floor(stats.totalCompleted * 25 / 60)} 小时</li>
              </ul>
            </div>

            <div className="flex space-x-3 justify-end">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={resetAllStats}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
              >
                确认重置
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PomodoroPage;