import React, { useState, useEffect, useRef } from 'react';
import { tagsAPI } from '../../utils/api';
import { Tag, X, Plus, Sparkles } from 'lucide-react';

/**
 * 增强标签输入组件
 * 提供自动完成、智能建议、标签管理功能
 */
const EnhancedTagInput = ({ tags = [], onChange, text = '', className = '' }) => {
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [smartSuggestions, setSmartSuggestions] = useState([]);
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);

  // 获取智能标签建议
  useEffect(() => {
    const fetchSmartSuggestions = async () => {
      if (text && text.length > 10) {
        try {
          const response = await tagsAPI.getSuggestions(text);
          if (response.data && response.data.suggestions) {
            // 过滤掉已有的标签
            const filtered = response.data.suggestions
              .filter(s => !tags.includes(s.tag))
              .slice(0, 5);
            setSmartSuggestions(filtered);
          }
        } catch (error) {
          console.error('获取智能建议失败:', error);
        }
      }
    };

    // 防抖处理
    const timer = setTimeout(fetchSmartSuggestions, 500);
    return () => clearTimeout(timer);
  }, [text, tags]);

  // 点击外部关闭建议列表
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target) &&
        !inputRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 监听输入变化，获取建议
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (inputValue.length > 0) {
        try {
          const response = await tagsAPI.getSuggestions(inputValue);
          if (response.data && response.data.suggestions) {
            // 过滤已有标签和匹配输入的标签
            const filtered = response.data.suggestions
              .filter(s => !tags.includes(s.tag))
              .filter(s => s.tag.toLowerCase().includes(inputValue.toLowerCase()));
            setSuggestions(filtered);
            setShowSuggestions(filtered.length > 0);
          }
        } catch (error) {
          console.error('获取建议失败:', error);
        }
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    };

    const timer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timer);
  }, [inputValue, tags]);

  const addTag = (tag) => {
    if (tag && !tags.includes(tag)) {
      onChange([...tags, tag]);
      setInputValue('');
      setShowSuggestions(false);
    }
  };

  const removeTag = (tagToRemove) => {
    onChange(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleInputKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const trimmedValue = inputValue.trim();
      if (trimmedValue) {
        addTag(trimmedValue);
      }
    } else if (e.key === 'Backspace' && inputValue === '' && tags.length > 0) {
      // 删除最后一个标签
      removeTag(tags[tags.length - 1]);
    }
  };

  const getTagColor = (tag) => {
    // 简单的颜色分配算法
    const colors = [
      'bg-blue-100 text-blue-700 border-blue-200',
      'bg-green-100 text-green-700 border-green-200',
      'bg-purple-100 text-purple-700 border-purple-200',
      'bg-orange-100 text-orange-700 border-orange-200',
      'bg-pink-100 text-pink-700 border-pink-200',
      'bg-indigo-100 text-indigo-700 border-indigo-200',
    ];
    const hash = tag.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  return (
    <div className={`relative ${className}`}>
      {/* 智能建议横幅（仅在有建议时显示） */}
      {smartSuggestions.length > 0 && (
        <div className="mb-3 p-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-medium text-purple-900">智能标签建议</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {smartSuggestions.map((suggestion) => (
              <button
                key={suggestion.tag}
                onClick={() => addTag(suggestion.tag)}
                className="px-3 py-1 bg-white hover:bg-purple-50 border border-purple-200 rounded-full text-sm text-purple-700 transition-colors flex items-center gap-1"
              >
                <Tag className="w-3 h-3" />
                {suggestion.tag}
                <span className="text-xs text-purple-500">({suggestion.usage_count})</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 标签输入区域 */}
      <div className="flex flex-wrap gap-2 p-3 border border-gray-200 rounded-lg bg-white focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all">
        {/* 已有标签 */}
        {tags.map((tag) => (
          <span
            key={tag}
            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border ${getTagColor(
              tag
            )}`}
          >
            <Tag className="w-3 h-3" />
            {tag}
            <button
              onClick={() => removeTag(tag)}
              className="hover:bg-black hover:bg-opacity-10 rounded-full p-0.5 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}

        {/* 输入框 */}
        <div className="flex-1 min-w-[120px] relative">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleInputKeyDown}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            className="w-full outline-none text-sm"
            placeholder={tags.length === 0 ? '添加标签 (按 Enter 或逗号)' : ''}
          />

          {/* 自动完成建议下拉框 */}
          {showSuggestions && suggestions.length > 0 && (
            <div
              ref={suggestionsRef}
              className="absolute top-full left-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto"
            >
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion.tag}
                  onClick={() => addTag(suggestion.tag)}
                  className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center justify-between text-sm transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-900">{suggestion.tag}</span>
                  </div>
                  <span className="text-xs text-gray-500">使用 {suggestion.usage_count} 次</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 提示文本 */}
      <div className="mt-2 text-xs text-gray-500">
        <span>按 Enter 或逗号添加标签</span>
        {tags.length > 0 && <span className="ml-3">按 Backspace 删除最后一个标签</span>}
      </div>
    </div>
  );
};

export default EnhancedTagInput;
