import React, { useState, useEffect, useRef } from 'react';
import { useNotes } from '../../context/NotesContext';
import { Save, Eye, Edit3, FileText } from 'lucide-react';
import AIAssistantPanel from './AIAssistantPanel';
import AIAssistantToolbar from './AIAssistantToolbar';
import SimpleRichTextEditor from './SimpleRichTextEditor';
import EditorStatus from './EditorStatus';
import SaveStatusIndicator from './SaveStatusIndicator';
import EnhancedTagInput from '../tags/EnhancedTagInput';
import ExportMenu from '../notes/ExportMenu';
import WordCounter from './WordCounter';

const Editor = () => {
  const { selectedNote, updateNote } = useNotes();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [editorMode, setEditorMode] = useState('rich'); // 'rich' 或 'preview'
  const editorRef = useRef(null);
  const saveTimeoutRef = useRef(null);

  // Load selected note data
  useEffect(() => {
    if (selectedNote) {
      setTitle(selectedNote.title || '');
      setContent(selectedNote.content || '');
      setTags(selectedNote.tags || []);
      setHasUnsavedChanges(false);
    } else {
      setTitle('');
      setContent('');
      setTags([]);
      setHasUnsavedChanges(false);
    }
  }, [selectedNote]);

  // Auto-save functionality
  useEffect(() => {
    if (selectedNote && hasUnsavedChanges) {
      // Clear existing timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      
      // Set new timeout for auto-save
      saveTimeoutRef.current = setTimeout(() => {
        handleSave();
      }, 2000); // Auto-save after 2 seconds of inactivity
    }
    
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [title, content, tags, hasUnsavedChanges]);

  const handleSave = async () => {
    if (!selectedNote || !hasUnsavedChanges) return;
    
    setIsSaving(true);
    const result = await updateNote(selectedNote.id, {
      title: title || 'Untitled',
      content,
      tags
    });
    
    if (result.success) {
      setHasUnsavedChanges(false);
      setLastSaved(new Date());
    }
    setIsSaving(false);
  };

  const handleTitleChange = (e) => {
    setTitle(e.target.value);
    setHasUnsavedChanges(true);
  };

  const handleContentChange = (newContent) => {
    setContent(newContent);
    setHasUnsavedChanges(true);
  };

  const handleTagsChange = (newTags) => {
    setTags(newTags);
    setHasUnsavedChanges(true);
  };

  // 富文本编辑器保存处理
  const handleEditorSave = () => {
    handleSave();
  };

  // 版本恢复处理
  const handleVersionRestore = () => {
    // 重新加载当前选中的笔记
    if (selectedNote) {
      // 触发重新获取笔记数据
      setHasUnsavedChanges(false);
      // 可以通过context重新获取数据或简单重载
      window.location.reload();
    }
  };

  // 创建预览内容（从HTML转换为纯文本显示）
  const createPreviewContent = (htmlContent) => {
    // 创建一个临时div来解析HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    return tempDiv.textContent || tempDiv.innerText || '';
  };

  if (!selectedNote) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center text-gray-500">
          <Edit3 className="h-16 w-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium mb-2">Select a note to start editing</h3>
          <p className="text-sm">Choose a note from the sidebar or create a new one</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white relative">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-4 flex-1">
          <input
            type="text"
            value={title}
            onChange={handleTitleChange}
            placeholder="Note title..."
            className="text-2xl font-bold bg-transparent border-none outline-none flex-1"
          />
          {/* 保存状态指示器 */}
          <SaveStatusIndicator
            isSaving={isSaving}
            hasUnsavedChanges={hasUnsavedChanges}
            lastSaved={lastSaved}
          />
        </div>

        <div className="flex items-center space-x-2">
          <ExportMenu noteId={selectedNote?.id} />

          <button
            onClick={() => setEditorMode(editorMode === 'rich' ? 'preview' : 'rich')}
            className={`p-2 rounded-lg transition-colors ${
              editorMode === 'preview'
                ? 'bg-blue-100 text-blue-600'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            title={editorMode === 'preview' ? '编辑模式' : '预览模式'}
          >
            {editorMode === 'preview' ? <Edit3 className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>

          <button
            onClick={handleSave}
            disabled={!hasUnsavedChanges || isSaving}
            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Save note"
          >
            <Save className="h-4 w-4" />
          </button>

          <button
            onClick={() => setShowAIPanel(!showAIPanel)}
            className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
              showAIPanel
                ? 'bg-purple-100 text-purple-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            AI Assistant
          </button>
        </div>
      </div>

      {/* Tags - Enhanced */}
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
        <EnhancedTagInput
          tags={tags}
          onChange={handleTagsChange}
          text={content}
          className=""
        />
      </div>

      {/* AI Assistant Toolbar - Phase 3.2 */}
      <div className="px-4 py-3 border-b border-gray-100">
        <AIAssistantToolbar
          noteId={selectedNote?.id}
          onUpdate={(updates) => {
            if (updates.tags) {
              setTags(updates.tags);
              setHasUnsavedChanges(true);
            }
          }}
        />
      </div>

      {/* 字数统计 - 实时显示 */}
      <div className="px-4 py-2 border-b border-gray-200">
        <WordCounter content={content} />
      </div>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden">
          {editorMode === 'preview' ? (
            <div className="flex-1 p-6 overflow-y-auto">
              <div className="max-w-4xl mx-auto">
                <div 
                  className="prose prose-lg max-w-none"
                  dangerouslySetInnerHTML={{ __html: content }}
                />
                {!content && (
                  <div className="text-gray-400 text-center py-12">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>预览模式：此处将显示富文本内容</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-hidden">
              <SimpleRichTextEditor
                ref={editorRef}
                value={content}
                onChange={handleContentChange}
                onSave={handleEditorSave}
                placeholder="开始编写你的笔记..."
                disabled={isSaving}
              />
            </div>
          )}
        </div>
        
        {/* AI Assistant Panel */}
        {showAIPanel && (
          <AIAssistantPanel 
            onClose={() => setShowAIPanel(false)}
            onInsertText={(text) => {
              if (editorRef.current && editorRef.current.insertContent) {
                editorRef.current.insertContent(text);
              }
            }}
            currentContent={createPreviewContent(content)}
          />
        )}
      </div>

      {/* Editor Status */}
      <EditorStatus 
        content={createPreviewContent(content)}
        title={title}
        lastSaved={lastSaved}
        isPreview={editorMode === 'preview'}
        noteId={selectedNote?.id}
        onVersionRestore={handleVersionRestore}
      />
    </div>
  );
};

export default Editor;
