import React from 'react';
import { Link } from 'react-router-dom';
import { 
  BookOpen, 
  Brain, 
  Cloud, 
  Edit3, 
  Search, 
  Zap,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { Button } from './atlassian-ui';
import { SparklesCore } from './ui/sparkles';

const WelcomePage = () => {
  const features = [
    {
      icon: Edit3,
      title: "智能编辑器",
      description: "支持Markdown的富文本编辑器，实时预览和自动保存"
    },
    {
      icon: Brain,
      title: "AI助手",
      description: "文本续写、润色、翻译、摘要等多种AI功能"
    },
    {
      icon: Cloud,
      title: "云端同步",
      description: "数据安全存储在云端，随时随地访问您的笔记"
    },
    {
      icon: Search,
      title: "智能搜索",
      description: "快速搜索笔记内容、标题和标签"
    },
    {
      icon: Zap,
      title: "高效体验",
      description: "简洁的界面设计，专注于内容创作"
    },
    {
      icon: BookOpen,
      title: "知识管理",
      description: "标签系统帮助您更好地组织和管理知识"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-notion-bg via-white to-blue-50">
      {/* Header */}
      <header className="relative overflow-hidden">
        {/* Background Sparkles - Enhanced */}
        <div className="absolute inset-0 w-full h-full">
          <SparklesCore
            background="transparent"
            minSize={0.8}
            maxSize={2.5}
            particleDensity={300}
            className="w-full h-full"
            particleColor="#60A5FA"
            speed={2}
          />
          <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-blue-50 via-white to-purple-50 [mask-image:radial-gradient(60%_60%_at_center,transparent_30%,white)]"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="flex items-center justify-center mb-6">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-blue-600 rounded-xl relative z-10">
                  <Sparkles className="h-8 w-8 text-white" />
                </div>
                <h1 className="text-4xl font-bold text-notion-dark relative z-10">
                  AI Notebook
                </h1>
              </div>
            </div>
            
            <p className="text-xl text-notion-gray max-w-3xl mx-auto mb-8">
              AI驱动的云端同步记事本，让您的创作更加高效智能
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register">
                <Button variant="primary" size="large" rightIcon={<ArrowRight className="w-4 h-4" />}>
                  开始使用
                </Button>
              </Link>
              
              <Link to="/login">
                <Button variant="secondary" size="large">
                  登录账号
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-notion-dark mb-4">
              强大的功能特性
            </h2>
            <p className="text-lg text-notion-gray max-w-2xl mx-auto">
              集成最新AI技术，为您提供前所未有的笔记体验
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="p-6 bg-gray-50 rounded-xl hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center mb-4">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <feature.icon className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="ml-3 text-lg font-semibold text-notion-dark">
                    {feature.title}
                  </h3>
                </div>
                <p className="text-notion-gray">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            准备开始您的智能写作之旅？
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            免费注册，立即体验AI驱动的笔记应用
          </p>
          
          <Link to="/register">
            <Button variant="secondary" size="large" rightIcon={<ArrowRight className="w-4 h-4" />} className="bg-white text-blue-600 hover:bg-gray-100 border-white">
              免费注册
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-gray-600">
            <p>&copy; 2025 AI Notebook. 让AI成为您的创作伙伴.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default WelcomePage;
