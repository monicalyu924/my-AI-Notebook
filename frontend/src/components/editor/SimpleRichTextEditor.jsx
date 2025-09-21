import React, { useRef, useEffect, useState, useCallback } from 'react';
import { 
  Bold, 
  Italic, 
  Underline, 
  Strikethrough,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link,
  Image,
  Quote,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Type,
  Palette,
  Highlighter,
  Undo,
  Redo
} from 'lucide-react';

const SimpleRichTextEditor = ({ 
  value = '', 
  onChange, 
  onSave,
  placeholder = '开始编写你的笔记...',
  disabled = false 
}) => {
  const editorRef = useRef(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [colorPickerType, setColorPickerType] = useState('text'); // 'text' or 'background'

  // 动态调整编辑器高度
  const adjustEditorHeight = useCallback(() => {
    if (editorRef.current) {
      const editor = editorRef.current;
      const contentHeight = editor.scrollHeight;
      const minHeight = 120; // 最小高度120px
      const maxHeight = 600; // 最大高度600px
      
      // 如果内容高度小于最小高度，使用最小高度
      // 如果内容高度大于最大高度，使用最大高度并显示滚动条
      if (contentHeight <= minHeight) {
        editor.style.height = minHeight + 'px';
        editor.style.overflowY = 'hidden';
      } else if (contentHeight >= maxHeight) {
        editor.style.height = maxHeight + 'px';
        editor.style.overflowY = 'auto';
      } else {
        editor.style.height = contentHeight + 'px';
        editor.style.overflowY = 'hidden';
      }
    }
  }, []);

  // 初始化编辑器内容
  useEffect(() => {
    if (editorRef.current) {
      // 只有当内容真正发生变化时才更新
      if (editorRef.current.innerHTML !== value) {
        editorRef.current.innerHTML = value || '';
        // 内容更新后调整高度
        setTimeout(() => adjustEditorHeight(), 10);
      }
      setIsInitialized(true);
    }
  }, [value, adjustEditorHeight]);

  // 点击外部关闭颜色选择器
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showColorPicker && !event.target.closest('.rich-text-editor')) {
        setShowColorPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showColorPicker]);

  // 监听内容变化
  const handleInput = useCallback(() => {
    if (editorRef.current && onChange) {
      const content = editorRef.current.innerHTML;
      onChange(content);
      
      // 动态调整高度
      adjustEditorHeight();
    }
  }, [onChange, adjustEditorHeight]);

  // 执行格式化命令
  const execCommand = useCallback((command, value = null) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    handleInput();
  }, [handleInput]);

  // 插入HTML内容
  const insertHTML = useCallback((html) => {
    if (document.queryCommandSupported('insertHTML')) {
      execCommand('insertHTML', html);
    } else {
      // 备用方案
      const selection = window.getSelection();
      if (selection.getRangeAt && selection.rangeCount) {
        const range = selection.getRangeAt(0);
        range.deleteContents();
        const div = document.createElement('div');
        div.innerHTML = html;
        const frag = document.createDocumentFragment();
        let node;
        while ((node = div.firstChild)) {
          frag.appendChild(node);
        }
        range.insertNode(frag);
      }
      handleInput();
    }
  }, [execCommand, handleInput]);

  // 工具栏按钮
  const ToolButton = ({ icon: Icon, title, onClick, isActive = false }) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`p-2 rounded-lg transition-colors ${
        isActive 
          ? 'bg-blue-100 text-blue-600' 
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
      }`}
    >
      <Icon className="h-4 w-4" />
    </button>
  );

  // 处理键盘快捷键
  const handleKeyDown = useCallback((e) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 's':
          e.preventDefault();
          if (onSave) onSave();
          break;
        case 'b':
          e.preventDefault();
          execCommand('bold');
          break;
        case 'i':
          e.preventDefault();
          execCommand('italic');
          break;
        case 'u':
          e.preventDefault();
          execCommand('underline');
          break;
        default:
          break;
      }
    }
  }, [execCommand, onSave]);

  // 插入链接
  const insertLink = useCallback(() => {
    const url = prompt('请输入链接地址:', 'https://');
    if (url) {
      execCommand('createLink', url);
    }
  }, [execCommand]);

  // 插入图片
  const insertImage = useCallback(() => {
    const url = prompt('请输入图片地址:', 'https://');
    if (url) {
      insertHTML(`<img src="${url}" alt="图片" style="max-width: 100%; height: auto;" />`);
    }
  }, [insertHTML]);

  // 预设颜色
  const presetColors = [
    '#000000', '#333333', '#666666', '#999999', '#cccccc', '#ffffff',
    '#ff0000', '#ff6600', '#ffcc00', '#00ff00', '#0066ff', '#6600ff',
    '#ff3366', '#ff9900', '#ffff00', '#33ff66', '#3366ff', '#9933ff'
  ];

  // 应用颜色
  const applyColor = useCallback((color, type) => {
    if (type === 'text') {
      execCommand('foreColor', color);
    } else {
      execCommand('backColor', color);
    }
    setShowColorPicker(false);
    editorRef.current?.focus();
  }, [execCommand]);

  // 改变文字颜色
  const changeTextColor = useCallback(() => {
    setColorPickerType('text');
    setShowColorPicker(true);
  }, []);

  // 改变背景颜色
  const changeBackgroundColor = useCallback(() => {
    setColorPickerType('background');
    setShowColorPicker(true);
  }, []);

  // 插入标题
  const insertHeading = useCallback((level) => {
    execCommand('formatBlock', `h${level}`);
  }, [execCommand]);

  return (
    <div className="rich-text-editor border border-gray-300 rounded-lg overflow-hidden relative">
      {/* 工具栏 */}
      <div className="border-b border-gray-200 bg-gray-50 p-2 relative">
        <div className="flex flex-wrap items-center gap-1">
          {/* 撤销重做 */}
          <ToolButton
            icon={Undo}
            title="撤销 (Ctrl+Z)"
            onClick={() => execCommand('undo')}
          />
          <ToolButton
            icon={Redo}
            title="重做 (Ctrl+Y)"
            onClick={() => execCommand('redo')}
          />
          
          <div className="w-px h-6 bg-gray-300 mx-1" />
          
          {/* 标题 */}
          <ToolButton
            icon={Heading1}
            title="一级标题"
            onClick={() => insertHeading(1)}
          />
          <ToolButton
            icon={Heading2}
            title="二级标题"
            onClick={() => insertHeading(2)}
          />
          <ToolButton
            icon={Heading3}
            title="三级标题"
            onClick={() => insertHeading(3)}
          />
          
          <div className="w-px h-6 bg-gray-300 mx-1" />
          
          {/* 基础格式 */}
          <ToolButton
            icon={Bold}
            title="粗体 (Ctrl+B)"
            onClick={() => execCommand('bold')}
          />
          <ToolButton
            icon={Italic}
            title="斜体 (Ctrl+I)"
            onClick={() => execCommand('italic')}
          />
          <ToolButton
            icon={Underline}
            title="下划线 (Ctrl+U)"
            onClick={() => execCommand('underline')}
          />
          <ToolButton
            icon={Strikethrough}
            title="删除线"
            onClick={() => execCommand('strikeThrough')}
          />
          
          <div className="w-px h-6 bg-gray-300 mx-1" />
          
          {/* 对齐 */}
          <ToolButton
            icon={AlignLeft}
            title="左对齐"
            onClick={() => execCommand('justifyLeft')}
          />
          <ToolButton
            icon={AlignCenter}
            title="居中对齐"
            onClick={() => execCommand('justifyCenter')}
          />
          <ToolButton
            icon={AlignRight}
            title="右对齐"
            onClick={() => execCommand('justifyRight')}
          />
          
          <div className="w-px h-6 bg-gray-300 mx-1" />
          
          {/* 列表 */}
          <ToolButton
            icon={List}
            title="无序列表"
            onClick={() => execCommand('insertUnorderedList')}
          />
          <ToolButton
            icon={ListOrdered}
            title="有序列表"
            onClick={() => execCommand('insertOrderedList')}
          />
          
          <div className="w-px h-6 bg-gray-300 mx-1" />
          
          {/* 插入 */}
          <ToolButton
            icon={Link}
            title="插入链接"
            onClick={insertLink}
          />
          <ToolButton
            icon={Image}
            title="插入图片"
            onClick={insertImage}
          />
          <ToolButton
            icon={Quote}
            title="引用"
            onClick={() => execCommand('formatBlock', 'blockquote')}
          />
          
          <div className="w-px h-6 bg-gray-300 mx-1" />
          
          {/* 颜色和格式 */}
          <ToolButton
            icon={Palette}
            title="文字颜色"
            onClick={changeTextColor}
          />
          <ToolButton
            icon={Highlighter}
            title="背景颜色/高亮"
            onClick={changeBackgroundColor}
          />
          <ToolButton
            icon={Type}
            title="清除格式"
            onClick={() => execCommand('removeFormat')}
          />
        </div>
        
        {/* 颜色选择面板 */}
        {showColorPicker && (
          <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-50">
            <div className="mb-2">
              <h4 className="text-sm font-medium text-gray-700">
                {colorPickerType === 'text' ? '选择文字颜色' : '选择背景颜色'}
              </h4>
            </div>
            <div className="grid grid-cols-6 gap-2 mb-3">
              {presetColors.map((color) => (
                <button
                  key={color}
                  onClick={() => applyColor(color, colorPickerType)}
                  className="w-8 h-8 rounded border-2 border-gray-300 hover:border-blue-400 transition-colors"
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="color"
                onChange={(e) => applyColor(e.target.value, colorPickerType)}
                className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
                title="自定义颜色"
              />
              <span className="text-xs text-gray-500">自定义颜色</span>
              <button
                onClick={() => setShowColorPicker(false)}
                className="ml-auto px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
              >
                关闭
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* 编辑区域 */}
      <div
        ref={editorRef}
        contentEditable={!disabled}
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        className="p-4 outline-none focus:ring-0"
        style={{
          lineHeight: '1.6',
          fontSize: '14px',
          fontFamily: '"PingFang SC", "Microsoft YaHei", Arial, sans-serif'
        }}
        suppressContentEditableWarning={true}
        data-placeholder={placeholder}
      />
      
      {/* 底部状态栏 */}
      <div className="border-t border-gray-200 bg-gray-50 px-4 py-2 text-xs text-gray-500 flex justify-between items-center">
        <div className="flex space-x-4">
          <span>富文本编辑器</span>
          <span>•</span>
          <span>Ctrl+S 保存</span>
          <span>•</span>
          <span>Ctrl+B 粗体</span>
          <span>•</span>
          <span>Ctrl+I 斜体</span>
        </div>
        <div>
          Word风格编辑体验
        </div>
      </div>
      
      {/* 内联样式用于编辑器内容 */}
      <style dangerouslySetInnerHTML={{
        __html: `
          .rich-text-editor [contenteditable]:empty::before {
            content: attr(data-placeholder);
            color: #9ca3af;
            pointer-events: none;
          }
          
          .rich-text-editor h1 {
            font-size: 2em;
            font-weight: bold;
            margin: 0.5em 0;
            color: #1f2937;
          }
          
          .rich-text-editor h2 {
            font-size: 1.5em;
            font-weight: bold;
            margin: 0.5em 0;
            color: #1f2937;
          }
          
          .rich-text-editor h3 {
            font-size: 1.2em;
            font-weight: bold;
            margin: 0.5em 0;
            color: #1f2937;
          }
          
          .rich-text-editor p {
            margin: 0.5em 0;
          }
          
          .rich-text-editor ul, .rich-text-editor ol {
            margin: 0.5em 0;
            padding-left: 2em;
          }
          
          .rich-text-editor li {
            margin: 0.25em 0;
          }
          
          .rich-text-editor blockquote {
            margin: 1em 0;
            padding: 0.5em 1em;
            border-left: 4px solid #d1d5db;
            background-color: #f9fafb;
            font-style: italic;
          }
          
          .rich-text-editor a {
            color: #3b82f6;
            text-decoration: underline;
          }
          
          .rich-text-editor img {
            max-width: 100%;
            height: auto;
            margin: 0.5em 0;
          }
        `
      }} />
    </div>
  );
};

export default SimpleRichTextEditor;
