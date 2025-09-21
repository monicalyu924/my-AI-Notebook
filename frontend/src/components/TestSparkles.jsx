import React from 'react';
import { SparklesCore } from './ui/sparkles';

const TestSparkles = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-5xl font-bold text-white mb-8 text-center relative z-10">
          ✨ Sparkles 闪光效果展示
        </h1>
        
        {/* 主要展示 - 超明显版本 */}
        <div className="mb-16 relative">
          <div className="h-[30rem] w-full bg-black rounded-2xl overflow-hidden relative border border-blue-500/30">
            {/* 背景闪光 */}
            <div className="absolute inset-0">
              <SparklesCore
                background="transparent"
                minSize={1.2}
                maxSize={3.5}
                particleDensity={800}
                className="w-full h-full"
                particleColor="#00D4FF"
                speed={1.5}
              />
            </div>
            
            {/* 渐变遮罩 */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20"></div>
            
            {/* 内容 */}
            <div className="relative z-10 h-full flex flex-col items-center justify-center text-white">
              <h2 className="text-6xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                震撼视觉效果
              </h2>
              <p className="text-xl text-gray-300 max-w-2xl text-center">
                超明显的粒子动画，让您清晰看到每一个闪光细节
              </p>
            </div>
          </div>
        </div>
        
        {/* 不同风格展示 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          {/* 电光蓝版本 */}
          <div className="bg-black rounded-xl p-6 border border-cyan-500/30">
            <h3 className="text-xl text-cyan-400 mb-4 font-bold">⚡ 电光蓝版本</h3>
            <div className="h-80 bg-black rounded-lg overflow-hidden relative">
              <SparklesCore
                background="transparent"
                minSize={1.5}
                maxSize={4}
                particleDensity={600}
                className="w-full h-full"
                particleColor="#00FFFF"
                speed={2}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
              <div className="absolute bottom-4 left-4 text-cyan-400">
                <p className="text-sm">高亮度电光效果</p>
              </div>
            </div>
          </div>
          
          {/* 热情红版本 */}
          <div className="bg-black rounded-xl p-6 border border-red-500/30">
            <h3 className="text-xl text-red-400 mb-4 font-bold">🔥 热情红版本</h3>
            <div className="h-80 bg-black rounded-lg overflow-hidden relative">
              <SparklesCore
                background="transparent"
                minSize={1.8}
                maxSize={4.5}
                particleDensity={700}
                className="w-full h-full"
                particleColor="#FF4444"
                speed={1.8}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
              <div className="absolute bottom-4 left-4 text-red-400">
                <p className="text-sm">炽热粒子效果</p>
              </div>
            </div>
          </div>
          
          {/* 神秘紫版本 */}
          <div className="bg-black rounded-xl p-6 border border-purple-500/30">
            <h3 className="text-xl text-purple-400 mb-4 font-bold">💜 神秘紫版本</h3>
            <div className="h-80 bg-black rounded-lg overflow-hidden relative">
              <SparklesCore
                background="transparent"
                minSize={1.3}
                maxSize={3.8}
                particleDensity={650}
                className="w-full h-full"
                particleColor="#A855F7"
                speed={1.2}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
              <div className="absolute bottom-4 left-4 text-purple-400">
                <p className="text-sm">神秘梦幻效果</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* 使用说明 */}
        <div className="mt-12 bg-gray-800 rounded-lg p-6">
          <h2 className="text-2xl font-bold text-white mb-4">组件使用说明</h2>
          <div className="space-y-4 text-gray-300">
            <p>✅ SparklesCore 组件已成功集成</p>
            <p>✅ 支持自定义粒子颜色、大小和密度</p>
            <p>✅ 支持平滑动画效果</p>
            <p>✅ 响应式设计，适配不同屏幕尺寸</p>
            <p>✅ 轻量级实现，性能优化</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestSparkles;