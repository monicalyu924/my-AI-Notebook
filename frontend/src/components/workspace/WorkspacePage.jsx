import React, { useState } from 'react';
import WorkspaceDashboard from './WorkspaceDashboard';
import AIWorkflowEngine from './AIWorkflowEngine';
import { Home, Zap, Settings, BarChart3 } from 'lucide-react';
import { SparklesCore } from '../ui/sparkles';
import AnimatedShaderBackground from '../ui/animated-shader-background.jsx';

function WorkspacePage({ onViewChange }) {
  const [activeTab, setActiveTab] = useState('dashboard');

  const tabs = [
    {
      id: 'dashboard',
      name: '工作台首页',
      icon: Home,
      component: WorkspaceDashboard
    },
    {
      id: 'workflow',
      name: 'AI工作流',
      icon: Zap,
      component: AIWorkflowEngine
    },
    {
      id: 'analytics',
      name: '效率分析',
      icon: BarChart3,
      component: () => (
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">效率分析</h3>
            <p className="text-gray-600">正在开发中，敬请期待...</p>
          </div>
        </div>
      )
    }
  ];

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component || WorkspaceDashboard;

  return (
    <div className="h-full flex flex-col relative overflow-hidden">
      {/* Beautiful Aurora Shader Background */}
      <AnimatedShaderBackground />
      
      {/* Optional: Keep some sparkles for extra magic */}
      <div className="absolute inset-0 w-full h-full opacity-10 pointer-events-none">
        <SparklesCore
          background="transparent"
          minSize={0.3}
          maxSize={1.2}
          particleDensity={60}
          className="w-full h-full"
          particleColor="#8B5CF6"
          speed={0.8}
        />
      </div>
      {/* 工作台导航 */}
      <div className="bg-white border-b border-gray-200">
        <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-4 sm:space-x-8 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="hidden sm:inline">{tab.name}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* 主要内容区域 */}
      <div className="flex-1 overflow-auto both-scroll touch-scroll relative z-10">
        <ActiveComponent onViewChange={onViewChange} />
      </div>
    </div>
  );
}

export default WorkspacePage;