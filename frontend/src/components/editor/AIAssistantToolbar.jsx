import React, { useState } from 'react';
import {
  Sparkles, FileText, Tags, Folder, Lightbulb, Loader2
} from 'lucide-react';
import { aiAPI } from '../../utils/api';

/**
 * AI智能助手工具栏
 * Phase 3.2 - AI增强功能UI组件
 */
const AIAssistantToolbar = ({ noteId, onUpdate }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [activeAction, setActiveAction] = useState(null);

  // 智能摘要
  const handleSummarize = async () => {
    setIsProcessing(true);
    setActiveAction('summarize');
    try {
      const response = await aiAPI.summarizeNote(noteId);
      setResult({
        type: 'summary',
        content: response.data.summary,
        title: '智能摘要'
      });
    } catch (error) {
      console.error('Summarize failed:', error);
      setResult({
        type: 'error',
        content: error.response?.data?.detail || '摘要生成失败',
        title: '错误'
      });
    } finally {
      setIsProcessing(false);
      setActiveAction(null);
    }
  };

  // 自动分类
  const handleAutoClassify = async () => {
    setIsProcessing(true);
    setActiveAction('classify');
    try {
      const response = await aiAPI.autoClassifyNote(noteId);
      setResult({
        type: 'classification',
        content: response.data,
        title: '智能分类建议'
      });

      // 如果用户确认，自动应用建议的标签
      if (onUpdate && response.data.suggested_tags) {
        // 可以在这里显示确认对话框
        const apply = window.confirm(
          `建议的标签: ${response.data.suggested_tags.join(', ')}\n\n是否应用这些标签？`
        );
        if (apply) {
          onUpdate({ tags: response.data.suggested_tags });
        }
      }
    } catch (error) {
      console.error('Auto-classify failed:', error);
      setResult({
        type: 'error',
        content: error.response?.data?.detail || '自动分类失败',
        title: '错误'
      });
    } finally {
      setIsProcessing(false);
      setActiveAction(null);
    }
  };

  // 关闭结果面板
  const handleCloseResult = () => {
    setResult(null);
  };

  return (
    <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-3">
      {/* AI工具按钮 */}
      <div className="flex items-center space-x-2">
        <div className="flex items-center space-x-1 text-purple-600">
          <Sparkles className="h-4 w-4" />
          <span className="text-sm font-medium">AI助手</span>
        </div>

        <div className="h-4 w-px bg-purple-300"></div>

        <button
          onClick={handleSummarize}
          disabled={isProcessing}
          className="flex items-center space-x-1 px-3 py-1.5 text-sm bg-white border border-purple-200 rounded-lg hover:bg-purple-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="生成笔记摘要"
        >
          {activeAction === 'summarize' ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <FileText className="h-3.5 w-3.5" />
          )}
          <span>智能摘要</span>
        </button>

        <button
          onClick={handleAutoClassify}
          disabled={isProcessing}
          className="flex items-center space-x-1 px-3 py-1.5 text-sm bg-white border border-purple-200 rounded-lg hover:bg-purple-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="AI自动分类和标签建议"
        >
          {activeAction === 'classify' ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Tags className="h-3.5 w-3.5" />
          )}
          <span>智能分类</span>
        </button>

        {isProcessing && (
          <span className="text-xs text-purple-600 flex items-center space-x-1">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span>AI处理中...</span>
          </span>
        )}
      </div>

      {/* 结果显示面板 */}
      {result && (
        <div className="mt-3 bg-white rounded-lg border border-purple-200 p-4">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Lightbulb className="h-4 w-4 text-purple-600" />
              <h4 className="text-sm font-semibold text-gray-900">{result.title}</h4>
            </div>
            <button
              onClick={handleCloseResult}
              className="text-gray-400 hover:text-gray-600 text-lg leading-none"
            >
              ×
            </button>
          </div>

          {result.type === 'summary' && (
            <div className="text-sm text-gray-700 leading-relaxed">
              {result.content}
            </div>
          )}

          {result.type === 'classification' && (
            <div className="space-y-3">
              <div>
                <span className="text-xs font-medium text-gray-500">建议的标签:</span>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {result.content.suggested_tags?.map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <span className="text-xs font-medium text-gray-500">建议的分类:</span>
                <div className="flex items-center space-x-1.5 mt-1">
                  <Folder className="h-3.5 w-3.5 text-purple-600" />
                  <span className="text-sm text-gray-700">{result.content.category}</span>
                </div>
              </div>
              {result.content.reason && (
                <div>
                  <span className="text-xs font-medium text-gray-500">理由:</span>
                  <p className="text-sm text-gray-600 mt-1">{result.content.reason}</p>
                </div>
              )}
            </div>
          )}

          {result.type === 'error' && (
            <div className="text-sm text-red-600">
              {result.content}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AIAssistantToolbar;
