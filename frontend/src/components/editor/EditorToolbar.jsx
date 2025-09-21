import React, { useState, memo, useCallback } from 'react';
import { 
  Bold, 
  Italic, 
  Strikethrough, 
  Underline,
  Quote,
  Code,
  Code2,
  List,
  ListOrdered,
  CheckSquare,
  Link,
  Image,
  Table,
  Heading1,
  Heading2,
  Heading3,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Minus,
  MoreHorizontal,
  Calendar,
  Tag,
  FileText,
  Undo,
  Redo
} from 'lucide-react';

const EditorToolbar = ({ onInsertText, selectedText = '', textareaRef, onUndo, onRedo, canUndo = false, canRedo = false }) => {
  const [showMoreTools, setShowMoreTools] = useState(false);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');

  // 获取当前光标位置
  const getCursorPosition = () => {
    if (textareaRef?.current) {
      return {
        start: textareaRef.current.selectionStart,
        end: textareaRef.current.selectionEnd
      };
    }
    return { start: 0, end: 0 };
  };

  // 包裹选中文本的函数
  const wrapSelectedText = (prefix, suffix = '', placeholder = '') => {
    const position = getCursorPosition();
    const text = selectedText || placeholder;
    
    if (selectedText) {
      onInsertText(`${prefix}${text}${suffix}`);
    } else {
      onInsertText(`${prefix}${text}${suffix}`);
      // 选中占位符文本
      setTimeout(() => {
        if (textareaRef?.current) {
          const newStart = position.start + prefix.length;
          const newEnd = newStart + text.length;
          textareaRef.current.setSelectionRange(newStart, newEnd);
        }
      }, 10);
    }
  };

  // 在行开头插入文本
  const insertAtLineStart = (prefix) => {
    const position = getCursorPosition();
    if (textareaRef?.current) {
      const content = textareaRef.current.value;
      const lineStart = content.lastIndexOf('\n', position.start - 1) + 1;
      const beforeCursor = content.substring(0, position.start);
      const afterCursor = content.substring(position.start);
      
      // 如果光标在行首，直接插入前缀
      if (position.start === lineStart) {
        onInsertText(`${beforeCursor}${prefix}${afterCursor}`);
      } else {
        // 否则在新行插入
        const textToInsert = position.start === lineStart ? prefix : `\n${prefix}`;
        onInsertText(`${beforeCursor}${textToInsert}${afterCursor}`);
      }
      
      // 设置光标位置到插入文本之后
      setTimeout(() => {
        if (textareaRef?.current) {
          const newPos = position.start + (position.start === lineStart ? prefix.length : prefix.length + 1);
          textareaRef.current.setSelectionRange(newPos, newPos);
          textareaRef.current.focus();
        }
      }, 10);
    }
  };

  // 工具栏按钮组件
  const ToolButton = ({ icon: Icon, title, onClick, isActive = false, size = "h-4 w-4" }) => (
    <button
      onClick={onClick}
      title={title}
      className={`p-2 rounded-lg transition-colors ${
        isActive 
          ? 'bg-blue-100 text-blue-600' 
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
      }`}
    >
      <Icon className={size} />
    </button>
  );

  // 分隔线组件
  const Divider = () => <div className="w-px h-6 bg-gray-300 mx-1" />;

  // 处理链接插入
  const handleInsertLink = useCallback(() => {
    if (linkUrl) {
      const linkMarkdown = `[${linkText || selectedText || '链接文本'}](${linkUrl})`;
      onInsertText(linkMarkdown);
      setShowLinkDialog(false);
      setLinkUrl('');
      setLinkText('');
    }
  }, [linkUrl, linkText, selectedText, onInsertText]);

  const basicTools = [
    {
      icon: Bold,
      title: '加粗 (Ctrl+B)',
      onClick: () => wrapSelectedText('**', '**', '粗体文本'),
    },
    {
      icon: Italic,
      title: '斜体 (Ctrl+I)', 
      onClick: () => wrapSelectedText('*', '*', '斜体文本'),
    },
    {
      icon: Strikethrough,
      title: '删除线',
      onClick: () => wrapSelectedText('~~', '~~', '删除线文本'),
    },
    {
      icon: Code,
      title: '行内代码 (`)',
      onClick: () => wrapSelectedText('`', '`', '代码'),
    },
  ];

  const headingTools = [
    {
      icon: Heading1,
      title: '一级标题 (H1)',
      onClick: () => insertAtLineStart('# '),
    },
    {
      icon: Heading2,
      title: '二级标题 (H2)',
      onClick: () => insertAtLineStart('## '),
    },
    {
      icon: Heading3,
      title: '三级标题 (H3)',
      onClick: () => insertAtLineStart('### '),
    },
  ];

  const listTools = [
    {
      icon: List,
      title: '无序列表 (-)',
      onClick: () => insertAtLineStart('- '),
    },
    {
      icon: ListOrdered,
      title: '有序列表 (1.)',
      onClick: () => insertAtLineStart('1. '),
    },
    {
      icon: CheckSquare,
      title: '任务列表 (- [ ])',
      onClick: () => insertAtLineStart('- [ ] '),
    },
  ];

  const insertTools = [
    {
      icon: Link,
      title: '插入链接 (Ctrl+K)',
      onClick: () => {
        setLinkText(selectedText);
        setShowLinkDialog(true);
      },
    },
    {
      icon: Image,
      title: '插入图片 (![alt](url))',
      onClick: () => wrapSelectedText('![', '](图片链接)', '图片描述'),
    },
    {
      icon: Quote,
      title: '引用块 (>)',
      onClick: () => insertAtLineStart('> '),
    },
    {
      icon: Code2,
      title: '插入代码块',
      onClick: () => {
        const position = getCursorPosition();
        const codeBlockMarkdown = '\n\n```\n代码内容\n```\n\n';
        
        if (textareaRef?.current) {
          const content = textareaRef.current.value;
          const beforeCursor = content.substring(0, position.start);
          const afterCursor = content.substring(position.start);
          
          onInsertText(`${beforeCursor}${codeBlockMarkdown}${afterCursor}`);
          
          // 选中"代码内容"文本
          setTimeout(() => {
            if (textareaRef?.current) {
              const codeStartPos = position.start + codeBlockMarkdown.indexOf('代码内容');
              textareaRef.current.setSelectionRange(codeStartPos, codeStartPos + 4);
              textareaRef.current.focus();
            }
          }, 10);
        }
      },
    },
  ];

  // 插入表格的专用函数
  const insertTable = () => {
    const position = getCursorPosition();
    const tableMarkdown = '\n\n| 列1 | 列2 | 列3 |\n|------|------|------|\n| 内容 | 内容 | 内容 |\n\n';
    
    if (textareaRef?.current) {
      const content = textareaRef.current.value;
      const beforeCursor = content.substring(0, position.start);
      const afterCursor = content.substring(position.start);
      
      onInsertText(`${beforeCursor}${tableMarkdown}${afterCursor}`);
      
      // 设置光标位置到表格第一个单元格
      setTimeout(() => {
        if (textareaRef?.current) {
          const newPos = position.start + tableMarkdown.indexOf('列1');
          textareaRef.current.setSelectionRange(newPos, newPos + 2);
          textareaRef.current.focus();
        }
      }, 10);
    }
  };

  // 插入分隔线的专用函数
  const insertDivider = () => {
    const position = getCursorPosition();
    const dividerMarkdown = '\n\n---\n\n';
    
    if (textareaRef?.current) {
      const content = textareaRef.current.value;
      const beforeCursor = content.substring(0, position.start);
      const afterCursor = content.substring(position.start);
      
      onInsertText(`${beforeCursor}${dividerMarkdown}${afterCursor}`);
      
      setTimeout(() => {
        if (textareaRef?.current) {
          const newPos = position.start + dividerMarkdown.length;
          textareaRef.current.setSelectionRange(newPos, newPos);
          textareaRef.current.focus();
        }
      }, 10);
    }
  };

  const moreTools = [
    {
      icon: Table,
      title: '插入表格',
      onClick: insertTable,
    },
    {
      icon: Minus,
      title: '插入分隔线',
      onClick: insertDivider,
    },
    {
      icon: Calendar,
      title: '插入当前日期',
      onClick: () => {
        const now = new Date();
        const dateStr = now.toLocaleDateString('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        });
        const position = getCursorPosition();
        if (textareaRef?.current) {
          const content = textareaRef.current.value;
          const beforeCursor = content.substring(0, position.start);
          const afterCursor = content.substring(position.start);
          onInsertText(`${beforeCursor}${dateStr}${afterCursor}`);
          
          setTimeout(() => {
            if (textareaRef?.current) {
              const newPos = position.start + dateStr.length;
              textareaRef.current.setSelectionRange(newPos, newPos);
              textareaRef.current.focus();
            }
          }, 10);
        }
      },
    },
    {
      icon: Tag,
      title: '插入标签',
      onClick: () => wrapSelectedText('#', '', '标签'),
    },
  ];

  return (
    <div className="border-b border-gray-200 bg-gray-50">
      <div className="flex items-center px-4 py-2 space-x-1 overflow-x-auto">
        {/* 撤销/重做工具 */}
        <ToolButton
          icon={Undo}
          title="撤销 (Ctrl+Z)"
          onClick={() => {
            if (textareaRef?.current) {
              document.execCommand('undo');
              textareaRef.current.focus();
            }
          }}
          isActive={false}
        />
        <ToolButton
          icon={Redo}
          title="重做 (Ctrl+Y / Ctrl+Shift+Z)"
          onClick={() => {
            if (textareaRef?.current) {
              document.execCommand('redo');
              textareaRef.current.focus();
            }
          }}
          isActive={false}
        />
        
        <Divider />
        
        {/* 基础格式化工具 */}
        {basicTools.map((tool, index) => (
          <ToolButton key={index} {...tool} />
        ))}
        
        <Divider />
        
        {/* 标题工具 */}
        {headingTools.map((tool, index) => (
          <ToolButton key={index} {...tool} />
        ))}
        
        <Divider />
        
        {/* 列表工具 */}
        {listTools.map((tool, index) => (
          <ToolButton key={index} {...tool} />
        ))}
        
        <Divider />
        
        {/* 插入工具 */}
        {insertTools.map((tool, index) => (
          <ToolButton key={index} {...tool} />
        ))}
        
        <Divider />
        
        {/* 更多工具切换 */}
        <ToolButton
          icon={MoreHorizontal}
          title="显示更多工具"
          onClick={() => setShowMoreTools(!showMoreTools)}
          isActive={showMoreTools}
        />
        
        {/* 更多工具（条件显示） */}
        {showMoreTools && (
          <>
            <Divider />
            {moreTools.map((tool, index) => (
              <ToolButton key={index} {...tool} />
            ))}
          </>
        )}
      </div>
      
      {/* 快捷键提示 */}
      <div className="px-4 py-1 text-xs text-gray-500 border-t border-gray-200">
        <span>快捷键: Ctrl+Z 撤销, Ctrl+Y 重做, Ctrl+B 粗体, Ctrl+I 斜体, Ctrl+K 链接, Ctrl+S 保存</span>
      </div>
      
      {/* 链接对话框 */}
      {showLinkDialog && (
        <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 shadow-lg z-50 p-4">
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">插入链接</h4>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                链接文本
              </label>
              <input
                type="text"
                value={linkText}
                onChange={(e) => setLinkText(e.target.value)}
                placeholder="链接显示文本"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                链接地址
              </label>
              <input
                type="url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://example.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                autoFocus
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => {
                  setShowLinkDialog(false);
                  setLinkUrl('');
                  setLinkText('');
                }}
                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
              >
                取消
              </button>
              <button
                onClick={handleInsertLink}
                disabled={!linkUrl}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                插入
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default memo(EditorToolbar);
