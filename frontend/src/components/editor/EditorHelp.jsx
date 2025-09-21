import React, { useState } from 'react';
import { HelpCircle, X, Keyboard, Edit, Eye, Zap, CheckSquare } from 'lucide-react';

const EditorHelp = () => {
  const [showHelp, setShowHelp] = useState(false);

  const shortcuts = [
    { key: 'Ctrl + B', desc: '加粗选中文本' },
    { key: 'Ctrl + I', desc: '斜体选中文本' },
    { key: 'Ctrl + K', desc: '插入链接' },
    { key: 'Ctrl + /', desc: '行内代码' },
    { key: 'Ctrl + S', desc: '保存笔记' },
    { key: 'Ctrl + Z', desc: '撤销' },
    { key: 'Ctrl + Y', desc: '重做' },
    { key: 'Tab', desc: '插入缩进' },
    { key: 'Ctrl + Shift + Enter', desc: '插入分隔线' },
  ];

  const markdownTips = [
    { syntax: '# 标题', desc: '一级标题' },
    { syntax: '## 标题', desc: '二级标题' },
    { syntax: '**粗体**', desc: '粗体文本' },
    { syntax: '*斜体*', desc: '斜体文本' },
    { syntax: '~~删除线~~', desc: '删除线文本' },
    { syntax: '`代码`', desc: '行内代码' },
    { syntax: '```代码块```', desc: '代码块' },
    { syntax: '- 列表项', desc: '无序列表' },
    { syntax: '1. 列表项', desc: '有序列表' },
    { syntax: '- [ ] 任务', desc: '待办事项' },
    { syntax: '- [x] 已完成', desc: '已完成任务' },
    { syntax: '- [ ] 任务 !high', desc: '高优先级任务' },
    { syntax: '- [ ] 任务 @明天', desc: '带截止日期任务' },
    { syntax: '- [ ] 任务 #张三', desc: '指派任务' },
    { syntax: '> 引用', desc: '引用块' },
    { syntax: '[链接](url)', desc: '超链接' },
    { syntax: '![图片](url)', desc: '图片' },
    { syntax: '---', desc: '分隔线' },
  ];

  if (!showHelp) {
    return (
      <button
        onClick={() => setShowHelp(true)}
        className="fixed bottom-4 right-4 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors z-40"
        title="编辑器帮助"
      >
        <HelpCircle className="h-5 w-5" />
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <Edit className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">编辑器使用指南</h2>
          </div>
          <button
            onClick={() => setShowHelp(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* 快捷键部分 */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <Keyboard className="h-5 w-5 text-purple-600" />
              <h3 className="text-lg font-medium text-gray-900">键盘快捷键</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {shortcuts.map((shortcut, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="font-mono text-sm bg-white px-2 py-1 rounded border">
                    {shortcut.key}
                  </span>
                  <span className="text-gray-700">{shortcut.desc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Markdown 语法部分 */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <Zap className="h-5 w-5 text-green-600" />
              <h3 className="text-lg font-medium text-gray-900">Markdown 语法</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {markdownTips.map((tip, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <code className="text-sm bg-white px-2 py-1 rounded border font-mono text-blue-600">
                    {tip.syntax}
                  </code>
                  <span className="text-gray-700">{tip.desc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 工具栏说明 */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <Eye className="h-5 w-5 text-orange-600" />
              <h3 className="text-lg font-medium text-gray-900">工具栏功能</h3>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <p className="text-gray-700">
                <strong>格式化工具：</strong>快速为选中文本添加粗体、斜体、删除线等格式
              </p>
              <p className="text-gray-700">
                <strong>标题工具：</strong>快速插入不同级别的标题
              </p>
              <p className="text-gray-700">
                <strong>列表工具：</strong>创建有序、无序和任务列表
              </p>
              <p className="text-gray-700">
                <strong>插入工具：</strong>添加链接、图片、引用、代码块等元素
              </p>
              <p className="text-gray-700">
                <strong>更多工具：</strong>表格、分隔线、日期、标签等高级功能
              </p>
            </div>
          </div>

          {/* 待办事项功能 */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <CheckSquare className="h-5 w-5 text-indigo-600" />
              <h3 className="text-lg font-medium text-gray-900">待办事项功能</h3>
            </div>
            <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200 space-y-3">
              <h4 className="font-medium text-indigo-900 mb-2">✅ 强大的任务管理</h4>
              <div className="text-indigo-800 space-y-2 text-sm">
                <div>
                  <strong>基础语法：</strong>
                  <code className="ml-2 bg-white px-2 py-1 rounded">- [ ] 待办任务</code>
                  <code className="ml-2 bg-white px-2 py-1 rounded">- [x] 已完成</code>
                </div>
                <div>
                  <strong>优先级：</strong>
                  <code className="ml-2 bg-white px-2 py-1 rounded">!high</code>
                  <code className="ml-2 bg-white px-2 py-1 rounded">!medium</code>
                  <code className="ml-2 bg-white px-2 py-1 rounded">!low</code>
                </div>
                <div>
                  <strong>截止日期：</strong>
                  <code className="ml-2 bg-white px-2 py-1 rounded">@今天</code>
                  <code className="ml-2 bg-white px-2 py-1 rounded">@明天</code>
                  <code className="ml-2 bg-white px-2 py-1 rounded">@2024-01-01</code>
                </div>
                <div>
                  <strong>指派任务：</strong>
                  <code className="ml-2 bg-white px-2 py-1 rounded">#张三</code>
                  <code className="ml-2 bg-white px-2 py-1 rounded">#team</code>
                </div>
                <p className="text-xs mt-2 text-indigo-700">
                  💡 在预览模式下可以直接点击复选框切换任务状态，点击侧边栏"待办事项"查看所有任务汇总
                </p>
              </div>
            </div>
          </div>

          {/* 实时预览说明 */}
          <div>
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-900 mb-2">💡 使用技巧</h4>
              <ul className="text-blue-800 space-y-1 text-sm">
                <li>• 使用预览模式查看最终效果</li>
                <li>• 状态栏显示实时字数统计和阅读时间</li>
                <li>• 支持自动保存，无需担心数据丢失</li>
                <li>• 拖拽选择文本，然后点击工具栏按钮快速格式化</li>
                <li>• 使用 AI 助手帮助改进文章内容</li>
                <li>• 在待办事项中使用优先级、截止日期和指派功能</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-center">
            <button
              onClick={() => setShowHelp(false)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              开始使用
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditorHelp;
