import { useEffect, useCallback } from 'react';

const useKeyboardShortcuts = (shortcuts) => {
  const handleKeyDown = useCallback((event) => {
    // 检查是否在输入框中，如果是则不处理大部分快捷键
    const isInInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName);
    
    // 处理每个快捷键
    shortcuts.forEach(({ key, ctrlKey, metaKey, shiftKey, altKey, callback, allowInInput }) => {
      // 如果在输入框中且不允许在输入框中执行，则跳过
      if (isInInput && !allowInInput) return;
      
      // 检查按键组合是否匹配
      const keyMatches = key && event.key && event.key.toLowerCase() === key.toLowerCase();
      const ctrlMatches = !!ctrlKey === (event.ctrlKey || event.metaKey); // Mac使用metaKey
      const metaMatches = !!metaKey === event.metaKey;
      const shiftMatches = !!shiftKey === event.shiftKey;
      const altMatches = !!altKey === event.altKey;
      
      if (keyMatches && ctrlMatches && metaMatches && shiftMatches && altMatches) {
        event.preventDefault();
        event.stopPropagation();
        callback(event);
      }
    });
  }, [shortcuts]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
};

export default useKeyboardShortcuts;