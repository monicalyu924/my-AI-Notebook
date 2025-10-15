import React, { useState, useEffect, useCallback } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { useNotes } from '../../context/NotesContext';

const NoteSearchBar = () => {
  const { searchNotes, clearSearch, isSearching, searchTerm } = useNotes();
  const [inputValue, setInputValue] = useState('');
  const [debouncedValue, setDebouncedValue] = useState('');

  // 防抖处理：用户停止输入 500ms 后才执行搜索
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(inputValue);
    }, 500);

    return () => clearTimeout(timer);
  }, [inputValue]);

  // 当防抖值变化时，执行搜索
  useEffect(() => {
    if (debouncedValue) {
      searchNotes(debouncedValue);
    } else {
      clearSearch();
    }
  }, [debouncedValue]);

  const handleClear = useCallback(() => {
    setInputValue('');
    setDebouncedValue('');
    clearSearch();
  }, [clearSearch]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') {
      handleClear();
    }
  }, [handleClear]);

  return (
    <div className="relative">
      <div className="relative flex items-center">
        {/* 搜索图标 */}
        <div className="absolute left-3 pointer-events-none">
          {isSearching ? (
            <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
          ) : (
            <Search className="w-5 h-5 text-gray-400" />
          )}
        </div>

        {/* 搜索输入框 */}
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="搜索笔记标题和内容... (支持关键词搜索)"
          className="w-full pl-10 pr-10 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
        />

        {/* 清除按钮 */}
        {inputValue && (
          <button
            onClick={handleClear}
            className="absolute right-3 p-1 hover:bg-gray-100 rounded-full transition-colors"
            title="清除搜索 (Esc)"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        )}
      </div>

      {/* 搜索提示 */}
      {searchTerm && (
        <div className="mt-2 text-xs text-gray-500 flex items-center gap-2">
          <span>搜索: "{searchTerm}"</span>
          {isSearching && <span className="text-blue-500">正在搜索...</span>}
        </div>
      )}
    </div>
  );
};

export default React.memo(NoteSearchBar);
