import React from 'react';
import { FileText } from 'lucide-react';

/**
 * 字数统计组件
 * 实时显示笔记的字数、字符数和预计阅读时间
 */
const WordCounter = ({ content = '' }) => {
  // 计算字数（中文按字符数，英文按单词数）
  const getWordCount = (text) => {
    if (!text) return { words: 0, characters: 0, chineseChars: 0, englishWords: 0 };

    // 移除HTML标签
    const plainText = text.replace(/<[^>]*>/g, '');

    // 计算字符数
    const characters = plainText.length;

    // 计算中文字符数
    const chineseChars = (plainText.match(/[\u4e00-\u9fa5]/g) || []).length;

    // 计算英文单词数
    const englishText = plainText.replace(/[\u4e00-\u9fa5]/g, '');
    const englishWords = englishText.trim() ? englishText.trim().split(/\s+/).length : 0;

    // 总字数 = 中文字符 + 英文单词
    const words = chineseChars + englishWords;

    return { words, characters, chineseChars, englishWords };
  };

  // 计算预计阅读时间（假设中文300字/分钟，英文200词/分钟）
  const getReadingTime = (wordCount) => {
    const { chineseChars, englishWords } = wordCount;
    const minutes = Math.ceil((chineseChars / 300) + (englishWords / 200));
    return minutes < 1 ? '< 1' : minutes;
  };

  const stats = getWordCount(content);
  const readingTime = getReadingTime(stats);

  return (
    <div className="flex items-center space-x-4 text-sm text-gray-600 bg-gray-50 px-4 py-2 rounded-lg">
      <div className="flex items-center space-x-2">
        <FileText className="h-4 w-4 text-gray-400" />
        <span className="font-medium text-gray-700">字数统计</span>
      </div>

      <div className="flex items-center space-x-1">
        <span className="text-gray-500">总字数:</span>
        <span className="font-semibold text-blue-600">{stats.words}</span>
      </div>

      <div className="flex items-center space-x-1">
        <span className="text-gray-500">字符数:</span>
        <span className="font-semibold text-green-600">{stats.characters}</span>
      </div>

      <div className="flex items-center space-x-1">
        <span className="text-gray-500">预计阅读:</span>
        <span className="font-semibold text-purple-600">{readingTime} 分钟</span>
      </div>

      {/* 详细统计（可选显示） */}
      <div className="flex items-center space-x-3 text-xs text-gray-400 border-l border-gray-300 pl-3">
        <span>中文: {stats.chineseChars}</span>
        <span>英文: {stats.englishWords}</span>
      </div>
    </div>
  );
};

export default WordCounter;
