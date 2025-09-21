import React, { useState, useRef } from 'react';
import { 
  Folder, 
  FolderOpen, 
  ChevronRight, 
  ChevronDown, 
  Plus, 
  MoreHorizontal,
  Edit3,
  Trash2,
  FolderPlus
} from 'lucide-react';
import { useFolders } from '../../context/FolderContext';
import { useNotes } from '../../context/NotesContext';

const FolderTree = () => {
  const { 
    foldersTree, 
    selectedFolder, 
    setSelectedFolder,
    expandedFolders, 
    toggleFolderExpanded,
    createFolder,
    updateFolder,
    deleteFolder,
    loading
  } = useFolders();
  
  const { fetchNotes, currentFolderId, updateNote } = useNotes();
  
  const [editingFolder, setEditingFolder] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newFolderParent, setNewFolderParent] = useState(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [showMenu, setShowMenu] = useState(null);
  const [dropTarget, setDropTarget] = useState(null);
  const menuRef = useRef(null);
  
  // 处理文件夹选择
  const handleFolderSelect = async (folder) => {
    setSelectedFolder(folder);
    await fetchNotes(folder.id);
  };
  
  // 处理显示所有笔记
  const handleShowAllNotes = async () => {
    setSelectedFolder(null);
    await fetchNotes(null);
  };
  
  // 处理显示未分类笔记
  const handleShowUncategorized = async () => {
    setSelectedFolder({ id: null, name: '未分类' });
    await fetchNotes('null'); // 特殊值表示获取未分类笔记
  };
  
  // 处理创建文件夹
  const handleCreateFolder = async (parentId = null) => {
    if (!newFolderName.trim()) return;
    
    const result = await createFolder({
      name: newFolderName.trim(),
      parent_id: parentId
    });
    
    if (result.success) {
      setNewFolderName('');
      setShowCreateForm(false);
      setNewFolderParent(null);
    }
  };
  
  // 开始编辑文件夹名称
  const startEditing = (folder) => {
    setEditingFolder(folder.id);
    setEditingName(folder.name);
    setShowMenu(null);
  };
  
  // 保存编辑
  const saveEdit = async (folderId) => {
    if (!editingName.trim()) return;
    
    const result = await updateFolder(folderId, { name: editingName.trim() });
    if (result.success) {
      setEditingFolder(null);
      setEditingName('');
    }
  };
  
  // 取消编辑
  const cancelEdit = () => {
    setEditingFolder(null);
    setEditingName('');
  };
  
  // 删除文件夹
  const handleDeleteFolder = async (folderId) => {
    if (window.confirm('确定要删除这个文件夹吗？')) {
      const result = await deleteFolder(folderId);
      if (result.success) {
        setShowMenu(null);
        // 如果删除的是当前选中的文件夹，切换到所有笔记视图
        if (selectedFolder && selectedFolder.id === folderId) {
          handleShowAllNotes();
        }
      }
    }
  };
  
  // 拖拽处理函数
  const handleDragOver = (e, folderId = null) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDropTarget(folderId);
  };

  const handleDragLeave = (e) => {
    // 检查是否真正离开了drop zone
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDropTarget(null);
    }
  };

  const handleDrop = async (e, folderId = null) => {
    e.preventDefault();
    setDropTarget(null);
    
    try {
      const noteData = JSON.parse(e.dataTransfer.getData('text/json'));
      
      // 如果拖拽到同一个文件夹，不执行操作
      if (noteData.folder_id === folderId) {
        return;
      }
      
      // 更新笔记的文件夹
      const result = await updateNote(noteData.id, {
        folder_id: folderId
      });
      
      if (result.success) {
        // 刷新当前视图
        await fetchNotes(selectedFolder?.id || null);
      }
    } catch (error) {
      console.error('移动笔记失败:', error);
    }
  };
  
  // 递归渲染文件夹树
  const renderFolder = (folder, level = 0) => {
    const isExpanded = expandedFolders.has(folder.id);
    const isSelected = selectedFolder && selectedFolder.id === folder.id;
    const hasChildren = folder.children && folder.children.length > 0;
    const paddingLeft = level * 16 + 8;
    const isDropTarget = dropTarget === folder.id;
    
    return (
      <div key={folder.id}>
        {/* 文件夹项 */}
        <div 
          className={`group flex items-center py-1 px-2 mx-1 rounded cursor-pointer transition-colors ${
            isSelected 
              ? 'bg-blue-100 text-blue-700' 
              : 'hover:bg-gray-100'
          } ${isDropTarget ? 'bg-green-100 border-2 border-green-300 border-dashed' : ''}`}
          style={{ paddingLeft: `${paddingLeft}px` }}
          onDragOver={(e) => handleDragOver(e, folder.id)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, folder.id)}
        >
          {/* 展开/收起图标 */}
          {hasChildren && (
            <button
              onClick={() => toggleFolderExpanded(folder.id)}
              className="p-1 hover:bg-gray-200 rounded mr-1"
            >
              {isExpanded ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
            </button>
          )}
          
          {/* 文件夹图标 */}
          <div className="mr-2">
            {isExpanded ? (
              <FolderOpen className="h-4 w-4 text-blue-500" />
            ) : (
              <Folder className="h-4 w-4 text-gray-600" />
            )}
          </div>
          
          {/* 文件夹名称 */}
          {editingFolder === folder.id ? (
            <input
              value={editingName}
              onChange={(e) => setEditingName(e.target.value)}
              onBlur={() => saveEdit(folder.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  saveEdit(folder.id);
                } else if (e.key === 'Escape') {
                  cancelEdit();
                }
              }}
              className="flex-1 px-1 py-0 text-sm border border-blue-300 rounded outline-none focus:border-blue-500"
              autoFocus
            />
          ) : (
            <span 
              className="flex-1 text-sm truncate"
              onClick={() => handleFolderSelect(folder)}
            >
              {folder.name}
            </span>
          )}
          
          {/* 操作菜单 */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(showMenu === folder.id ? null : folder.id)}
              className="p-1 rounded hover:bg-gray-200 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreHorizontal className="h-3 w-3" />
            </button>
            
            {showMenu === folder.id && (
              <div
                ref={menuRef}
                className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50 min-w-[120px]"
              >
                <button
                  onClick={() => {
                    setNewFolderParent(folder.id);
                    setShowCreateForm(true);
                    setShowMenu(null);
                  }}
                  className="w-full px-3 py-1 text-left text-sm hover:bg-gray-100 flex items-center"
                >
                  <FolderPlus className="h-3 w-3 mr-2" />
                  新建子文件夹
                </button>
                <button
                  onClick={() => startEditing(folder)}
                  className="w-full px-3 py-1 text-left text-sm hover:bg-gray-100 flex items-center"
                >
                  <Edit3 className="h-3 w-3 mr-2" />
                  重命名
                </button>
                <button
                  onClick={() => handleDeleteFolder(folder.id)}
                  className="w-full px-3 py-1 text-left text-sm hover:bg-gray-100 text-red-600 flex items-center"
                >
                  <Trash2 className="h-3 w-3 mr-2" />
                  删除
                </button>
              </div>
            )}
          </div>
        </div>
        
        {/* 子文件夹 */}
        {isExpanded && hasChildren && (
          <div>
            {folder.children.map(child => renderFolder(child, level + 1))}
          </div>
        )}
      </div>
    );
  };
  
  return (
    <div className="folder-tree">
      {/* 顶部导航 */}
      <div className="mb-4">
        {/* 所有笔记 */}
        <div
          className={`flex items-center py-2 px-3 mx-1 rounded cursor-pointer transition-colors ${
            !selectedFolder || (selectedFolder && selectedFolder.id !== null)
              ? ''
              : 'bg-blue-100 text-blue-700'
          }`}
          onClick={handleShowAllNotes}
        >
          <Folder className="h-4 w-4 mr-2 text-gray-600" />
          <span className="text-sm">所有笔记</span>
        </div>
        
        {/* 未分类笔记 */}
        <div
          className={`flex items-center py-2 px-3 mx-1 rounded cursor-pointer transition-colors ${
            selectedFolder && selectedFolder.id === null
              ? 'bg-blue-100 text-blue-700'
              : 'hover:bg-gray-100'
          } ${dropTarget === null ? 'bg-green-100 border-2 border-green-300 border-dashed' : ''}`}
          onClick={handleShowUncategorized}
          onDragOver={(e) => handleDragOver(e, null)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, null)}
        >
          <Folder className="h-4 w-4 mr-2 text-gray-600" />
          <span className="text-sm">未分类</span>
        </div>
        
        <div className="border-t border-gray-200 my-2"></div>
      </div>
      
      {/* 文件夹列表标题 */}
      <div className="flex items-center justify-between mb-2 px-2">
        <h3 className="text-sm font-medium text-gray-700">文件夹</h3>
        <button
          onClick={() => {
            setNewFolderParent(null);
            setShowCreateForm(true);
          }}
          className="p-1 hover:bg-gray-200 rounded transition-colors"
          title="新建文件夹"
        >
          <Plus className="h-4 w-4 text-gray-600" />
        </button>
      </div>
      
      {/* 创建文件夹表单 */}
      {showCreateForm && (
        <div className="mb-2 px-2">
          <input
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            placeholder="文件夹名称"
            className="w-full px-2 py-1 text-sm border border-blue-300 rounded outline-none focus:border-blue-500"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleCreateFolder(newFolderParent);
              } else if (e.key === 'Escape') {
                setShowCreateForm(false);
                setNewFolderName('');
                setNewFolderParent(null);
              }
            }}
            autoFocus
          />
          <div className="flex justify-end mt-1 space-x-1">
            <button
              onClick={() => {
                setShowCreateForm(false);
                setNewFolderName('');
                setNewFolderParent(null);
              }}
              className="px-2 py-1 text-xs text-gray-600 hover:text-gray-800"
            >
              取消
            </button>
            <button
              onClick={() => handleCreateFolder(newFolderParent)}
              disabled={!newFolderName.trim()}
              className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              创建
            </button>
          </div>
        </div>
      )}
      
      {/* 加载状态 */}
      {loading && (
        <div className="px-2 py-4 text-center text-sm text-gray-500">
          加载中...
        </div>
      )}
      
      {/* 文件夹树 */}
      {!loading && (
        <div className="folder-list max-h-96 overflow-y-auto">
          {foldersTree.length === 0 ? (
            <div className="px-2 py-4 text-center text-sm text-gray-500">
              还没有文件夹，点击上方 + 按钮创建第一个文件夹
            </div>
          ) : (
            foldersTree.map(folder => renderFolder(folder))
          )}
        </div>
      )}
    </div>
  );
};

export default FolderTree;
