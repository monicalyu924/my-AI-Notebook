import React, { memo, useMemo } from 'react';
import { Clock, FileText, Type, Eye } from 'lucide-react';
import VersionHistoryButton from '../version/VersionHistoryButton';

const EditorStatus = ({ content, title, lastSaved, isPreview, noteId, onVersionRestore }) => {
  // 计算统计信息
  const getWordCount = (text) => {
    if (!text || text.trim() === '') return 0;
    // 中文字符计数
    const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
    // 英文单词计数
    const englishWords = text
      .replace(/[\u4e00-\u9fa5]/g, ' ')
      .split(/\s+/)
      .filter(word => word.trim() !== '').length;
    return chineseChars + englishWords;
  };

  const getCharCount = (text) => {
    return text ? text.length : 0;
  };

  const getLineCount = (text) => {
    return text ? text.split('\n').length : 1;
  };

  const getReadingTime = (wordCount) => {
    // 假设平均阅读速度为每分钟200字
    const minutes = Math.ceil(wordCount / 200);
    return minutes < 1 ? '< 1分钟' : `${minutes}分钟`;
  };

  const formatLastSaved = (timestamp) => {
    if (!timestamp) return '未保存';
    const now = new Date();
    const saved = new Date(timestamp);
    const diff = Math.floor((now - saved) / 1000);
    
    if (diff < 60) return '刚刚保存';
    if (diff < 3600) return `${Math.floor(diff / 60)}分钟前保存`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}小时前保存`;
    return saved.toLocaleDateString('zh-CN');
  };

  // 使用 useMemo 优化计算
  const stats = useMemo(() => {
    const wordCount = getWordCount(content);
    const charCount = getCharCount(content);
    const lineCount = getLineCount(content);
    const readingTime = getReadingTime(wordCount);
    return { wordCount, charCount, lineCount, readingTime };
  }, [content]);

  const { wordCount, charCount, lineCount, readingTime } = stats;

  return (
    <div className="bg-gray-50 border-t border-gray-200 px-4 py-2">
      <div className="flex items-center justify-between text-xs text-gray-600">
        <div className="flex items-center space-x-4">
          {/* 字数统计 */}
          <div className="flex items-center space-x-1">
            <Type className="h-3 w-3" />
            <span>{wordCount} 字</span>
          </div>
          
          {/* 字符数 */}
          <div className="flex items-center space-x-1">
            <FileText className="h-3 w-3" />
            <span>{charCount} 字符</span>
          </div>
          
          {/* 行数 */}
          <div className="flex items-center space-x-1">
            <span>{lineCount} 行</span>
          </div>
          
          {/* 预估阅读时间 */}
          <div className="flex items-center space-x-1">
            <Eye className="h-3 w-3" />
            <span>约 {readingTime}</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-4 pr-16">
          {/* 版本历史按钮 */}
          {noteId && (
            <VersionHistoryButton 
              noteId={noteId}
              onVersionRestore={onVersionRestore}
              disabled={isPreview}
            />
          )}
          
          {/* 当前模式 */}
          <span className="text-gray-500">
            {isPreview ? '预览模式' : '编辑模式'}
          </span>
          
          {/* 最后保存时间 */}
          <div className="flex items-center space-x-1">
            <Clock className="h-3 w-3" />
            <span>{formatLastSaved(lastSaved)}</span>
          </div>
        </div>
      </div>
      
      {/* 详细信息（当内容较多时显示） */}
      {wordCount > 100 && (
        <div className="mt-1 pt-1 border-t border-gray-300">
          <div className="flex justify-between text-xs text-gray-500">
            <span>标题: {title || '无标题'}</span>
            <span>
              字数分布: 中文 {(content.match(/[\u4e00-\u9fa5]/g) || []).length} | 
              英文 {content.replace(/[\u4e00-\u9fa5]/g, ' ').split(/\s+/).filter(word => word.trim() !== '').length} | 
              符号 {charCount - wordCount}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default memo(EditorStatus);
