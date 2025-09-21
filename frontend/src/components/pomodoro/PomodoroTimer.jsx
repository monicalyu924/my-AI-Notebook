import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  Square, 
  Settings, 
  Clock,
  Coffee,
  RotateCcw,
  Volume2,
  VolumeX
} from 'lucide-react';

const PomodoroTimer = ({ isFloating = false, onClose, onComplete, buttonPosition }) => {
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25分钟，单位为秒
  const [isActive, setIsActive] = useState(false);
  const [currentMode, setCurrentMode] = useState('work'); // 'work', 'shortBreak', 'longBreak'
  const [completedPomodoros, setCompletedPomodoros] = useState(0);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [settings, setSettings] = useState({
    workDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 15,
    longBreakInterval: 4, // 完成4个番茄钟后进行长休息
  });

  const intervalRef = useRef(null);
  const audioRef = useRef(null);

  // 模式配置
  const modes = {
    work: {
      name: '专注时间',
      icon: Clock,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      buttonColor: 'bg-red-600 hover:bg-red-700',
      duration: settings.workDuration * 60
    },
    shortBreak: {
      name: '短休息',
      icon: Coffee,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      buttonColor: 'bg-green-600 hover:bg-green-700',
      duration: settings.shortBreakDuration * 60
    },
    longBreak: {
      name: '长休息',
      icon: Coffee,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      buttonColor: 'bg-blue-600 hover:bg-blue-700',
      duration: settings.longBreakDuration * 60
    }
  };

  const currentModeConfig = modes[currentMode];

  // 格式化时间显示
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 计算进度百分比
  const progress = ((currentModeConfig.duration - timeLeft) / currentModeConfig.duration) * 100;

  // 定时器效果
  useEffect(() => {
    if (isActive && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }

    // 时间结束时的处理
    if (timeLeft === 0 && isActive) {
      handleTimerComplete();
    }

    return () => clearInterval(intervalRef.current);
  }, [isActive, timeLeft]);

  // 处理计时器完成
  const handleTimerComplete = () => {
    setIsActive(false);
    
    // 播放提醒音
    if (soundEnabled && audioRef.current) {
      audioRef.current.play().catch(console.error);
    }

    // 根据当前模式决定下一个模式
    if (currentMode === 'work') {
      const newCompletedCount = completedPomodoros + 1;
      setCompletedPomodoros(newCompletedCount);
      
      // 通知父组件番茄钟完成
      if (onComplete) {
        onComplete();
      }
      
      // 每完成指定数量的番茄钟后进行长休息
      const nextMode = newCompletedCount % settings.longBreakInterval === 0 ? 'longBreak' : 'shortBreak';
      switchMode(nextMode);
    } else {
      // 休息结束，切换到工作模式
      switchMode('work');
    }

    // 显示通知
    showNotification();
  };

  // 显示浏览器通知
  const showNotification = () => {
    if ('Notification' in window && Notification.permission === 'granted') {
      const message = currentMode === 'work' 
        ? '专注时间结束，该休息一下了！' 
        : '休息时间结束，继续专注工作吧！';
      
      new Notification('番茄钟提醒', {
        body: message,
        icon: '/favicon.ico'
      });
    }
  };

  // 请求通知权限
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // 切换模式
  const switchMode = (mode) => {
    setCurrentMode(mode);
    setTimeLeft(modes[mode].duration);
    setIsActive(false);
  };

  // 开始/暂停
  const toggleTimer = () => {
    setIsActive(!isActive);
  };

  // 停止并重置
  const stopTimer = () => {
    setIsActive(false);
    setTimeLeft(currentModeConfig.duration);
  };

  // 重置所有数据
  const resetAll = () => {
    setIsActive(false);
    setCurrentMode('work');
    setTimeLeft(settings.workDuration * 60);
    setCompletedPomodoros(0);
  };

  // 更新设置
  const updateSettings = (newSettings) => {
    setSettings(newSettings);
    // 如果当前计时器未运行，更新时间
    if (!isActive) {
      const currentDuration = newSettings[`${currentMode === 'work' ? 'work' : currentMode === 'shortBreak' ? 'shortBreak' : 'longBreak'}Duration`] * 60;
      setTimeLeft(currentDuration);
    }
  };

  // 浮动组件样式和位置计算
  const getFloatingStyles = () => {
    if (!isFloating) return "w-full max-w-md mx-auto";
    
    if (!buttonPosition) {
      return "fixed bottom-6 right-20 z-50 w-80 shadow-xl rounded-lg";
    }
    
    // 计算番茄钟定时器的智能位置
    const timerWidth = 320; // w-80 = 320px
    const timerHeight = 400; // 估计高度
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    
    let left = buttonPosition.x;
    let top = buttonPosition.y;
    
    // 水平位置调整 - 尝试放在按钮右侧
    if (left + timerWidth + 70 > screenWidth) {
      // 右侧空间不够，放在左侧
      left = buttonPosition.x - timerWidth - 10;
    } else {
      // 放在右侧
      left = buttonPosition.x + 70; // 按钮宽度 + 间距
    }
    
    // 垂直位置调整 - 尝试与按钮对齐
    if (top + timerHeight > screenHeight) {
      // 下方空间不够，向上调整
      top = screenHeight - timerHeight - 20;
    }
    
    // 确保不超出屏幕边界
    left = Math.max(10, Math.min(left, screenWidth - timerWidth - 10));
    top = Math.max(10, top);
    
    return `fixed z-50 w-80 shadow-xl rounded-lg`;
  };
  
  const floatingStyles = getFloatingStyles();
  
  // 获取内联样式
  const getInlineStyles = () => {
    if (!isFloating || !buttonPosition) return {};
    
    const timerWidth = 320;
    const timerHeight = 400;
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    
    let left = buttonPosition.x;
    let top = buttonPosition.y;
    
    if (left + timerWidth + 70 > screenWidth) {
      left = buttonPosition.x - timerWidth - 10;
    } else {
      left = buttonPosition.x + 70;
    }
    
    if (top + timerHeight > screenHeight) {
      top = screenHeight - timerHeight - 20;
    }
    
    left = Math.max(10, Math.min(left, screenWidth - timerWidth - 10));
    top = Math.max(10, top);
    
    return { left: `${left}px`, top: `${top}px` };
  };

  return (
    <div 
      className={`${floatingStyles} ${currentModeConfig.bgColor} border ${currentModeConfig.borderColor} p-6`}
      style={getInlineStyles()}
    >
      {/* 音频元素 */}
      <audio ref={audioRef} preload="auto">
        <source src="data:audio/mpeg;base64,//uQRAAAAWMSLwUIDAAgAAAADAAAABA8PDw4BAQACgAAAAYAAAAAAAAAAAFBAAEBUYAAgAAASIgQJBAAAQDARAAmAQARAQGEAAgAAASIgQJBAAAQDARAAmAQARAQGEAAgAAASIgQJBAAAQDARAAmAQARAQGEAAgAAASIgQJBAAAQDARAAmAQARAQGEAAgAAASIgQJBAAAQDARAAmAQARAQGEAAgAAASIgQJBAAAQDARAAmAQARAQGEAAgAAASIgQJBAAAQDARAAmAQARAQGEAAgAAASIgQJBAAAQDARAAmAQARAQGEAAgAAASIgQJBAAAQDARAAmAQARAQGEAAgAAASIgQJBAAAQDARAAmAQARAQGEAAgAAASIgQJBAAAQDARAAmAQARAQGEAAgAAASIgQJBAAAQDARAAmAQARAQGEAAgAAASIgQJBAAAQDARAAmAQARAQGEAAgAAASIgQJBAAAQDARAAmAQARAQGEAAgAAASIgQJBAAAQDARAAmAQARAQGEAAgAAASIgQJBAAAQDARAAmAQARAQGEAAgAAASIgQJBAAAQDARAAmAQARAQGEAAgAAASIgQJBAAAQDARAAmAQARAQGEAAgAAASIgQJBAAAQDARAAmAQARAQGEAAgAAASIgQJBAAAQDARAAmAQARAQGEAAgAAASIgQJBAAAQDARAAmAQARAQGEAAgAAASIgQJBAAAQDARAAmAQARAQGEAAgAAASIgQJBAAAQDARAAmAQARAQGEAAgAAASIgQJBAAAQDARAAmAQARAQGEAAgAAASIgQJBAAAQDARAAmAQARAQGEAAgAAASIgQJBAAAQDARAAmAQARAQGEAAgAAASIgQJBAAAQDARAAmAQARAQGEAAgAAASIgQJBAAAQDARAAmAQARAQGEAAgAAASIgQJBAAAQDARAAmAQARAQGEAAgAAASIgQJBAAAQDARAAmAQARAQGEAAgAAASIgQJBAAAQDARAAmAQARAQGEAAgAAASIgQJBAAAQDARAAmAQARAQGEAAgAAASIgQJBAAAQDARAAmAQARAQGEAAgAAASIgQJBAAAQDARAAmAQARAQGEAAgAAASIgQJBAAAQDARAAmAQARAQGEAAgAAASIgQJBAAAQDARAAmAQARAQGEAAgAAASIgQJBAAAQDARAAmAQARAQGEAAgAAASIgQJBAAAQDARAAmAQARAQGEAAgAAASIgQJBAAAQDARAAmAQARAQGEAAgAAASIgQJBAAAQDARAAmAQARAQGEAAgAAASIgQJBAAAQDARAAmAQARAQGEAAgAAASIgQJBAAAQDARAAmAQARAQGEAAgAAASIgQJBAAAQDARAAmAQARAQGEAAgAAASIgQJBAAAQDARAAmAQARAQGEAAgAAASIgQJBAAAQDARAAmAQARAQGEAAgAAASIgQJBAAAQDARAAmAQARAQGEAAgAAASIgQJBAAAQDARAAmAQARAQGEAAgAAASIgQJBAAAQDARAAmAQARAQGEAAgAAASIgQJBAAAQDARAAmAQARAQGEAAgAAASIgQJBAAAQDARAAmAQARAQGEAAgAAASIgQJBAAAQDARAAmAQARAQGEAAgAAA" type="audio/mpeg" />
      </audio>

      {/* 头部 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <currentModeConfig.icon className={`h-5 w-5 ${currentModeConfig.color}`} />
          <h2 className={`font-semibold ${currentModeConfig.color}`}>
            {currentModeConfig.name}
          </h2>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-1 text-gray-500 hover:text-gray-700 rounded"
            title={soundEnabled ? "关闭声音" : "开启声音"}
          >
            {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </button>
          <button
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            className="p-1 text-gray-500 hover:text-gray-700 rounded"
            title="设置"
          >
            <Settings className="h-4 w-4" />
          </button>
          {isFloating && onClose && (
            <button
              onClick={onClose}
              className="p-1 text-gray-500 hover:text-gray-700 rounded"
              title="关闭"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* 进度环 */}
      <div className="relative mb-6">
        <div className="w-48 h-48 mx-auto relative">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            {/* 背景圆环 */}
            <circle
              cx="50"
              cy="50"
              r="45"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
              className="text-gray-200"
            />
            {/* 进度圆环 */}
            <circle
              cx="50"
              cy="50"
              r="45"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
              className={currentModeConfig.color}
              strokeDasharray={`${283} 283`}
              strokeDashoffset={283 - (283 * progress) / 100}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 0.5s ease-in-out' }}
            />
          </svg>
          {/* 时间显示 */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900 mb-1">
                {formatTime(timeLeft)}
              </div>
              <div className="text-sm text-gray-500">
                {Math.floor(progress)}% 完成
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 控制按钮 */}
      <div className="flex justify-center space-x-3 mb-4">
        <button
          onClick={toggleTimer}
          className={`flex items-center px-4 py-2 text-white rounded-lg font-medium ${currentModeConfig.buttonColor}`}
        >
          {isActive ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
          {isActive ? '暂停' : '开始'}
        </button>
        
        <button
          onClick={stopTimer}
          className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700"
        >
          <Square className="h-4 w-4 mr-2" />
          停止
        </button>
        
        <button
          onClick={resetAll}
          className="flex items-center px-4 py-2 bg-gray-400 text-white rounded-lg font-medium hover:bg-gray-500"
          title="重置所有"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
      </div>

      {/* 模式切换 */}
      <div className="flex justify-center space-x-2 mb-4">
        {Object.entries(modes).map(([key, mode]) => (
          <button
            key={key}
            onClick={() => switchMode(key)}
            className={`px-3 py-1 text-sm rounded-full font-medium transition-colors ${
              currentMode === key
                ? `${mode.color} bg-white border-2 ${mode.borderColor}`
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {mode.name}
          </button>
        ))}
      </div>

      {/* 统计信息 */}
      <div className="text-center text-sm text-gray-600">
        今日完成：{completedPomodoros} 个番茄钟
      </div>

      {/* 设置面板 */}
      {isSettingsOpen && (
        <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200">
          <h3 className="font-medium mb-3">番茄钟设置</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-gray-700 mb-1">专注时间 (分钟)</label>
              <input
                type="number"
                min="1"
                max="60"
                value={settings.workDuration}
                onChange={(e) => updateSettings({
                  ...settings,
                  workDuration: parseInt(e.target.value) || 25
                })}
                className="w-full px-3 py-1 border border-gray-300 rounded-md text-sm"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">短休息 (分钟)</label>
              <input
                type="number"
                min="1"
                max="30"
                value={settings.shortBreakDuration}
                onChange={(e) => updateSettings({
                  ...settings,
                  shortBreakDuration: parseInt(e.target.value) || 5
                })}
                className="w-full px-3 py-1 border border-gray-300 rounded-md text-sm"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">长休息 (分钟)</label>
              <input
                type="number"
                min="1"
                max="60"
                value={settings.longBreakDuration}
                onChange={(e) => updateSettings({
                  ...settings,
                  longBreakDuration: parseInt(e.target.value) || 15
                })}
                className="w-full px-3 py-1 border border-gray-300 rounded-md text-sm"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">长休息间隔 (个番茄钟)</label>
              <input
                type="number"
                min="1"
                max="10"
                value={settings.longBreakInterval}
                onChange={(e) => updateSettings({
                  ...settings,
                  longBreakInterval: parseInt(e.target.value) || 4
                })}
                className="w-full px-3 py-1 border border-gray-300 rounded-md text-sm"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PomodoroTimer;