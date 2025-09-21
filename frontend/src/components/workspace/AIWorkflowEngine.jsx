import React, { useState, useEffect } from 'react';
import { Brain, ArrowRight, Sparkles, Target, FileText, CheckCircle2, MessageSquare } from 'lucide-react';
import { useNotes } from '../../context/NotesContext';
import { useProjects } from '../../context/ProjectContext';
import { useTodos } from '../../context/TodoContext';
import { aiAPI } from '../../utils/api';

function AIWorkflowEngine() {
  const { createNote } = useNotes();
  const { createBoard, createList, createCard } = useProjects();
  const { createTodo } = useTodos();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState(null);
  const [workflowInput, setWorkflowInput] = useState('');
  const [workflowResults, setWorkflowResults] = useState([]);

  // 预定义的AI工作流模板
  const workflowTemplates = [
    {
      id: 'idea-to-project',
      title: '💡 想法转项目',
      description: '将一个想法自动转换成完整的项目计划',
      steps: ['分析想法', '生成项目结构', '创建任务列表', '设置里程碑'],
      icon: Target,
      color: 'blue'
    },
    {
      id: 'note-to-todo',
      title: '📝 笔记转待办',
      description: '从笔记内容中提取和生成可执行的待办事项',
      steps: ['分析笔记内容', '识别行动项', '创建待办任务', '设置优先级'],
      icon: CheckCircle2,
      color: 'green'
    },
    {
      id: 'chat-to-knowledge',
      title: '💬 对话转知识',
      description: '将AI对话内容整理成结构化的知识笔记',
      steps: ['总结对话要点', '提取关键信息', '生成知识卡片', '智能分类'],
      icon: FileText,
      color: 'purple'
    },
    {
      id: 'auto-planning',
      title: '🎯 智能规划',
      description: '基于当前工作负载智能规划日程和任务',
      steps: ['分析工作负载', '评估优先级', '生成工作计划', '设置提醒'],
      icon: Brain,
      color: 'orange'
    }
  ];

  const executeWorkflow = async (workflowId, input) => {
    setIsProcessing(true);
    setWorkflowResults([]);

    try {
      switch (workflowId) {
        case 'idea-to-project':
          await executeIdeaToProject(input);
          break;
        case 'note-to-todo':
          await executeNoteToTodo(input);
          break;
        case 'chat-to-knowledge':
          await executeChatToKnowledge(input);
          break;
        case 'auto-planning':
          await executeAutoPlanning(input);
          break;
      }
    } catch (error) {
      console.error('工作流执行失败:', error);
      let errorMessage = '工作流执行失败，请重试';
      
      if (error.response?.status === 400 && error.response?.data?.detail?.includes('OpenRouter API key')) {
        errorMessage = '❌ 请先在设置中配置 OpenRouter API 密钥才能使用 AI 工作流功能';
      } else if (error.response?.status === 503) {
        errorMessage = '❌ AI 服务暂时不可用，请稍后重试';
      } else if (error.message === 'Network Error') {
        errorMessage = '❌ 网络连接错误，请检查网络连接';
      }
      
      setWorkflowResults([{ type: 'error', content: errorMessage }]);
    } finally {
      setIsProcessing(false);
    }
  };

  const executeIdeaToProject = async (idea) => {
    // Step 1: AI分析想法
    setWorkflowResults([{ type: 'step', content: '🔍 AI正在分析您的想法...' }]);
    
    const analysisResult = await aiAPI.processText({
      text: idea,
      action: 'analyze_project_idea',
      instruction: '分析这个想法，提取关键要素，生成项目结构建议'
    });

    setWorkflowResults(prev => [...prev, { 
      type: 'result', 
      content: `✅ 想法分析完成：${analysisResult.data.processed_text}` 
    }]);

    // Step 2: 创建项目看板
    setWorkflowResults(prev => [...prev, { type: 'step', content: '📋 创建项目看板...' }]);
    
    const board = await createBoard({
      name: `项目：${idea.substring(0, 20)}...`,
      description: `基于想法"${idea}"自动生成的项目`,
      color: '#3b82f6'
    });

    // Step 3: 创建默认列表
    const lists = ['待办事项', '进行中', '已完成'];
    for (const listTitle of lists) {
      await createList(board.id, { title: listTitle });
    }

    setWorkflowResults(prev => [...prev, { 
      type: 'success', 
      content: `🎉 成功创建项目"${board.name}"，包含3个工作列表` 
    }]);
  };

  const executeNoteToTodo = async (noteContent) => {
    setWorkflowResults([{ type: 'step', content: '📝 分析笔记内容...' }]);
    
    const todoResult = await aiAPI.processText({
      text: noteContent,
      action: 'extract_todos',
      instruction: '从这段文本中提取可执行的待办事项，每个事项一行'
    });

    const todos = todoResult.data.processed_text.split('\n').filter(todo => todo.trim());
    
    setWorkflowResults(prev => [...prev, { 
      type: 'step', 
      content: `📋 发现${todos.length}个待办事项，正在创建...` 
    }]);

    for (const todoText of todos) {
      if (todoText.trim()) {
        await createTodo({
          title: todoText.trim(),
          priority: 'medium',
          due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7天后
        });
      }
    }

    setWorkflowResults(prev => [...prev, { 
      type: 'success', 
      content: `✅ 成功创建${todos.length}个待办事项` 
    }]);
  };

  const executeChatToKnowledge = async (chatContent) => {
    setWorkflowResults([{ type: 'step', content: '💬 整理对话内容...' }]);
    
    const summaryResult = await aiAPI.processText({
      text: chatContent,
      action: 'summarize',
      instruction: '将这段对话整理成结构化的知识笔记，包含要点总结和关键信息'
    });

    setWorkflowResults(prev => [...prev, { type: 'step', content: '📚 生成知识笔记...' }]);

    const note = await createNote({
      title: `AI对话总结 - ${new Date().toLocaleDateString()}`,
      content: summaryResult.data.processed_text,
      tags: ['AI对话', '知识整理']
    });

    setWorkflowResults(prev => [...prev, { 
      type: 'success', 
      content: `📝 成功创建知识笔记"${note.title}"` 
    }]);
  };

  const executeAutoPlanning = async (context) => {
    setWorkflowResults([{ type: 'step', content: '🎯 分析当前工作负载...' }]);
    
    const planResult = await aiAPI.processText({
      text: context,
      action: 'generate_plan',
      instruction: '基于当前情况生成今日/本周的工作计划建议'
    });

    setWorkflowResults(prev => [...prev, { 
      type: 'result', 
      content: `📋 AI工作规划建议：${planResult.data.processed_text}` 
    }]);

    setWorkflowResults(prev => [...prev, { 
      type: 'success', 
      content: '🎉 智能工作规划完成！建议已生成' 
    }]);
  };

  const WorkflowCard = ({ workflow }) => {
    const Icon = workflow.icon;
    
    const colorClasses = {
      blue: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-500' },
      green: { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-500' },
      purple: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-500' },
      orange: { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-500' },
      red: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-500' }
    };
    
    const colors = colorClasses[workflow.color] || colorClasses.blue;
    
    return (
      <button
        onClick={() => setSelectedWorkflow(workflow)}
        className={`w-full p-6 bg-white rounded-xl border-2 transition-all text-left hover:shadow-lg ${
          selectedWorkflow?.id === workflow.id 
            ? `${colors.border} shadow-lg` 
            : 'border-gray-200 hover:border-gray-300'
        }`}
      >
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-lg ${colors.bg}`}>
            <Icon className={`w-6 h-6 ${colors.text}`} />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 mb-2">{workflow.title}</h3>
            <p className="text-sm text-gray-600 mb-3">{workflow.description}</p>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              {workflow.steps.map((step, index) => (
                <React.Fragment key={index}>
                  <span>{step}</span>
                  {index < workflow.steps.length - 1 && (
                    <ArrowRight className="w-3 h-3" />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </button>
    );
  };

  return (
    <div className="w-full mx-auto p-4 sm:p-6 lg:px-8">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="p-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl">
            <Sparkles className="w-8 h-8 text-purple-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">AI工作流引擎</h1>
        </div>
        <p className="text-gray-600">选择一个AI工作流，让AI帮助您自动化工作过程</p>
      </div>

      {/* 工作流模板选择 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {workflowTemplates.map((workflow) => (
          <WorkflowCard key={workflow.id} workflow={workflow} />
        ))}
      </div>

      {/* 工作流执行界面 */}
      {selectedWorkflow && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold mb-4">
            执行工作流：{selectedWorkflow.title}
          </h2>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              输入内容
            </label>
            <textarea
              value={workflowInput}
              onChange={(e) => setWorkflowInput(e.target.value)}
              placeholder={`请输入相关内容来执行"${selectedWorkflow.title}"工作流...`}
              className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <button
            onClick={() => executeWorkflow(selectedWorkflow.id, workflowInput)}
            disabled={isProcessing || !workflowInput.trim()}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isProcessing ? '🤖 AI正在处理...' : '🚀 执行工作流'}
          </button>

          {/* 工作流执行结果 */}
          {workflowResults.length > 0 && (
            <div className="mt-6">
              <h3 className="font-medium text-gray-900 mb-3">执行结果</h3>
              <div className="space-y-2">
                {workflowResults.map((result, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg text-sm ${
                      result.type === 'step' ? 'bg-blue-50 text-blue-800' :
                      result.type === 'success' ? 'bg-green-50 text-green-800' :
                      result.type === 'error' ? 'bg-red-50 text-red-800' :
                      'bg-gray-50 text-gray-700'
                    }`}
                  >
                    {result.content}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default AIWorkflowEngine;