import React, { useState } from 'react';
import { useNotes } from '../../context/NotesContext';
import { useFolders } from '../../context/FolderContext';
import { formatDistanceToNow } from 'date-fns';
import { FileText, Trash2, GripVertical, Clock, Tag } from 'lucide-react';
import { Card, CardContent, Button } from '../atlassian-ui';

const NoteList = () => {
  const { notes, filteredNotes, selectedNote, setSelectedNote, deleteNote, updateNote, isLoading } = useNotes();
  const { selectedFolder } = useFolders();
  const [draggedNote, setDraggedNote] = useState(null);

  const handleSelectNote = (note) => {
    setSelectedNote(note);
  };

  const handleDeleteNote = async (e, noteId) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this note?')) {
      await deleteNote(noteId);
    }
  };

  const formatDate = (dateString) => {
    try {
      console.log('Formatting date:', dateString, 'Current time:', new Date().toISOString());
      
      // 确保时间字符串有正确的时区信息
      let dateToFormat = dateString;
      if (dateString && !dateString.includes('T')) {
        // 如果是简单的日期字符串，添加时间部分
        dateToFormat = dateString + 'T00:00:00Z';
      } else if (dateString && !dateString.includes('Z') && !dateString.includes('+')) {
        // 如果没有时区信息，假定为UTC
        dateToFormat = dateString + 'Z';
      }
      
      const date = new Date(dateToFormat);
      if (isNaN(date.getTime())) {
        console.error('Invalid date:', dateString);
        return 'Invalid date';
      }
      
      const result = formatDistanceToNow(date, { addSuffix: true });
      console.log('Formatted result:', result);
      return result;
    } catch (error) {
      console.error('Error formatting date:', error, dateString);
      return 'Unknown';
    }
  };

  const truncateContent = (content, maxLength = 100) => {
    if (!content) return 'No content';
    
    // 将HTML转换为纯文本
    const htmlToText = (html) => {
      // 创建一个临时div元素来解析HTML
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = html;
      
      // 获取纯文本内容
      let text = tempDiv.textContent || tempDiv.innerText || '';
      
      // 清理多余的空白字符
      text = text.replace(/\s+/g, ' ').trim();
      
      return text;
    };
    
    const plainText = htmlToText(content);
    if (plainText.length <= maxLength) return plainText;
    return plainText.substring(0, maxLength) + '...';
  };

  // 拖拽处理函数
  const handleDragStart = (e, note) => {
    setDraggedNote(note);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/json', JSON.stringify(note));
    
    // 设置拖拽图像为半透明
    e.target.style.opacity = '0.5';
  };

  const handleDragEnd = (e) => {
    e.target.style.opacity = '1';
    setDraggedNote(null);
  };

  if (isLoading) {
    return (
      <div className="w-80 trello-sidebar flex items-center justify-center">
        <div className="text-gray-600">Loading notes...</div>
      </div>
    );
  }

  return (
    <div className="w-80 trello-sidebar flex flex-col h-full">
      <div className="p-4">
        <h2 className="text-lg font-semibold text-gray-800">
          Notes ({filteredNotes.length})
        </h2>
      </div>
      
      <div className="flex-1 overflow-y-auto trello-scrollbar">
        {filteredNotes.length === 0 ? (
          <div className="p-8 text-center text-gray-600">
            <FileText className="h-16 w-16 mx-auto mb-4 text-trello-300" />
            {notes.length === 0 ? (
              <>
                <h3 className="text-lg font-medium text-gray-800 mb-2">开始您的创作之旅</h3>
                <p className="text-sm text-gray-600 mb-4">
                  创建您的第一篇笔记，体验AI驱动的智能写作
                </p>
                <div className="space-y-2 text-xs text-gray-500">
                  <p>💡 支持富文本编辑</p>
                  <p>🤖 AI助手帮您润色内容</p>
                  <p>☁️ 自动云端同步</p>
                </div>
              </>
            ) : (
              <>
                <h3 className="text-lg font-medium text-gray-800 mb-2">未找到匹配的笔记</h3>
                <p className="text-sm text-gray-600">
                  尝试调整搜索关键词或创建新笔记
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-3 p-3">
            {filteredNotes.map((note) => (
              <Card
                key={note.id}
                className={`cursor-pointer transition-all duration-200 hover:shadow-md group ${
                  selectedNote?.id === note.id ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                } ${draggedNote?.id === note.id ? 'opacity-50 scale-95' : ''}`}
                draggable
                onDragStart={(e) => handleDragStart(e, note)}
                onDragEnd={handleDragEnd}
                onClick={() => handleSelectNote(note)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-2 flex-1">
                      {/* 拖拽手柄 */}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing">
                        <GripVertical className="h-4 w-4 text-gray-400 mt-1" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        {/* 标题 */}
                        <h3 className="text-sm font-semibold text-gray-800 truncate mb-1">
                          {note.title || 'Untitled'}
                        </h3>
                        
                        {/* 时间和图标 */}
                        <div className="flex items-center text-xs text-gray-500 mb-2">
                          <Clock className="h-3 w-3 mr-1" />
                          {formatDate(note.updated_at)}
                        </div>
                        
                        {/* 内容预览 */}
                        <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                          {truncateContent(note.content)}
                        </p>
                        
                        {/* 标签 */}
                        {note.tags && note.tags.length > 0 && (
                          <div className="flex items-center flex-wrap gap-1">
                            <Tag className="h-3 w-3 text-gray-400" />
                            {note.tags.slice(0, 3).map((tag, index) => (
                              <span
                                key={index}
                                className="inline-block px-2 py-0.5 text-xs bg-trello-100 text-trello-700 rounded-lg"
                              >
                                {tag}
                              </span>
                            ))}
                            {note.tags.length > 3 && (
                              <span className="text-xs text-gray-400">
                                +{note.tags.length - 3}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* 删除按钮 */}
                    <Button
                      variant="ghost"
                      size="small"
                      onClick={(e) => handleDeleteNote(e, note.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-600 p-1"
                      title="Delete note"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NoteList;
