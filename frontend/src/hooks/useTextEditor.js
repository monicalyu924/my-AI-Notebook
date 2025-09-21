import { useState, useRef, useCallback } from 'react';

export const useTextEditor = (initialContent = '', onContentChange) => {
  const [content, setContent] = useState(initialContent);
  const [history, setHistory] = useState([initialContent]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const textareaRef = useRef(null);

  // 添加历史记录
  const addToHistory = useCallback((newContent) => {
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(newContent);
      // 限制历史记录数量
      if (newHistory.length > 50) {
        newHistory.shift();
        return newHistory;
      }
      return newHistory;
    });
    setHistoryIndex(prev => prev + 1);
  }, [historyIndex]);

  // 设置内容
  const updateContent = useCallback((newContent, addHistory = true) => {
    setContent(newContent);
    if (addHistory && newContent !== content) {
      addToHistory(newContent);
    }
    if (onContentChange) {
      onContentChange(newContent);
    }
  }, [content, addToHistory, onContentChange]);

  // 撤销
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      const newContent = history[newIndex];
      setContent(newContent);
      if (onContentChange) {
        onContentChange(newContent);
      }
    }
  }, [history, historyIndex, onContentChange]);

  // 重做
  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      const newContent = history[newIndex];
      setContent(newContent);
      if (onContentChange) {
        onContentChange(newContent);
      }
    }
  }, [history, historyIndex, onContentChange]);

  // 获取当前光标位置
  const getCursorPosition = useCallback(() => {
    if (textareaRef.current) {
      return {
        start: textareaRef.current.selectionStart,
        end: textareaRef.current.selectionEnd
      };
    }
    return { start: 0, end: 0 };
  }, []);

  // 设置光标位置
  const setCursorPosition = useCallback((start, end = start) => {
    if (textareaRef.current) {
      setTimeout(() => {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(start, end);
      }, 0);
    }
  }, []);

  // 获取选中文本
  const getSelectedText = useCallback(() => {
    const { start, end } = getCursorPosition();
    return content.substring(start, end);
  }, [content, getCursorPosition]);

  // 插入文本
  const insertText = useCallback((text, selectInserted = false) => {
    const { start, end } = getCursorPosition();
    const newContent = content.substring(0, start) + text + content.substring(end);
    updateContent(newContent);
    
    if (selectInserted) {
      setCursorPosition(start, start + text.length);
    } else {
      setCursorPosition(start + text.length);
    }
  }, [content, getCursorPosition, setCursorPosition, updateContent]);

  // 包裹选中文本
  const wrapSelectedText = useCallback((prefix, suffix = '', placeholder = '') => {
    const { start, end } = getCursorPosition();
    const selectedText = content.substring(start, end);
    const text = selectedText || placeholder;
    
    const newContent = content.substring(0, start) + prefix + text + suffix + content.substring(end);
    updateContent(newContent);
    
    if (!selectedText && placeholder) {
      // 选中占位符文本
      setCursorPosition(start + prefix.length, start + prefix.length + text.length);
    } else {
      // 光标放在包裹文本之后
      setCursorPosition(start + prefix.length + text.length + suffix.length);
    }
  }, [content, getCursorPosition, setCursorPosition, updateContent]);

  // 在行开头插入文本
  const insertAtLineStart = useCallback((prefix) => {
    const { start } = getCursorPosition();
    const lineStart = content.lastIndexOf('\n', start - 1) + 1;
    const beforeLine = content.substring(0, lineStart);
    const afterLine = content.substring(lineStart);
    
    const newContent = beforeLine + prefix + afterLine;
    updateContent(newContent);
    setCursorPosition(lineStart + prefix.length);
  }, [content, getCursorPosition, setCursorPosition, updateContent]);

  // 格式化选中的列表
  const formatList = useCallback((type = 'unordered') => {
    const { start, end } = getCursorPosition();
    const selectedText = content.substring(start, end);
    
    if (!selectedText) {
      // 没有选中文本，插入单行列表
      const prefix = type === 'ordered' ? '1. ' : type === 'task' ? '- [ ] ' : '- ';
      insertAtLineStart(prefix);
    } else {
      // 有选中文本，格式化多行
      const lines = selectedText.split('\n');
      const formattedLines = lines.map((line, index) => {
        const prefix = type === 'ordered' ? `${index + 1}. ` : type === 'task' ? '- [ ] ' : '- ';
        return prefix + line.trim();
      });
      
      const newContent = content.substring(0, start) + formattedLines.join('\n') + content.substring(end);
      updateContent(newContent);
    }
  }, [content, getCursorPosition, insertAtLineStart, updateContent]);

  // 重置历史记录
  const resetHistory = useCallback((newContent = '') => {
    setContent(newContent);
    setHistory([newContent]);
    setHistoryIndex(0);
    if (onContentChange) {
      onContentChange(newContent);
    }
  }, [onContentChange]);

  return {
    content,
    textareaRef,
    updateContent,
    undo,
    redo,
    canUndo: historyIndex > 0,
    canRedo: historyIndex < history.length - 1,
    getCursorPosition,
    setCursorPosition,
    getSelectedText,
    insertText,
    wrapSelectedText,
    insertAtLineStart,
    formatList,
    resetHistory
  };
};
