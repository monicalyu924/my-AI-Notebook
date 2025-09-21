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
  FolderPlus,
  Palette,
  CheckSquare,
  Square,
  Settings
} from 'lucide-react';
import { useFolders } from '../../context/FolderContext';
import { useNotes } from '../../context/NotesContext';
import FolderCustomization, { FOLDER_ICONS, FOLDER_COLORS } from './FolderCustomization';
import FolderBatchActions from './FolderBatchActions';

const EnhancedFolderTree = () => {
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
  const [showCustomization, setShowCustomization] = useState(false);
  const [customizationFolder, setCustomizationFolder] = useState(null);
  const [showBatchActions, setShowBatchActions] = useState(false);
  const [selectedFolders, setSelectedFolders] = useState([]);
  const menuRef = useRef(null);
  
  // 获取文件夹图标组件
  const getFolderIcon = (folder, isExpanded = false) => {
    const iconName = folder?.icon || 'folder';
    const colorName = folder?.color || 'default';
    
    // 如果是展开状态且没有自定义图标，使用默认的打开图标
    if (isExpanded && iconName === 'folder') {
      const IconComponent = FolderOpen;
      const colorData = FOLDER_COLORS.find(c => c.name === colorName) || FOLDER_COLORS[0];
      return <IconComponent className={`h-4 w-4 ${colorData.color}`} />;
    }
    
    const iconData = FOLDER_ICONS.find(i => i.name === iconName) || FOLDER_ICONS[0];
    const colorData = FOLDER_COLORS.find(c => c.name === colorName) || FOLDER_COLORS[0];
    const IconComponent = iconData.icon;
    
    return <IconComponent className={`h-4 w-4 ${colorData.color}`} />;
  };

  // 获取文件夹背景色
  const getFolderBackgroundColor = (folder, isSelected) => {
    if (isSelected) {
      const colorName = folder?.color || 'default';
      const colorData = FOLDER_COLORS.find(c => c.name === colorName);
      return colorData && colorName !== 'default' ? colorData.bg : 'bg-blue-100';
    }
    return 'hover:bg-gray-100';
  };

  // 处理文件夹选择
  const handleFolderSelect = async (folder) => {
    if (showBatchActions) return; // 在批量操作模式下不处理文件夹选择
    setSelectedFolder(folder);
    await fetchNotes(folder.id);
  };
  
  // 处理批量选择
  const handleBatchFolderSelect = (folderId, isSelected) => {
    setSelectedFolders(prev => {
      if (isSelected) {
        return [...prev, folderId];
      } else {
        return prev.filter(id => id !== folderId);
      }
    });
  };

  // 处理显示所有笔记
  const handleShowAllNotes = async () => {
    if (showBatchActions) return;
    setSelectedFolder(null);
    await fetchNotes(null);
  };
  
  // 处理显示未分类笔记
  const handleShowUncategorized = async () => {
    if (showBatchActions) return;
    setSelectedFolder({ id: null, name: '未分类' });
    await fetchNotes('null');
  };
  
  // 处理创建文件夹
  const handleCreateFolder = async (parentId = null) => {
    if (!newFolderName.trim()) return;
    
    const result = await createFolder({
      name: newFolderName.trim(),
      parent_id: parentId,
      icon: 'folder',
      color: 'default'
    });
    
    if (result.success) {
      setNewFolderName('');
      setShowCreateForm(false);
      setNewFolderParent(null);
    }
  };

  // 处理文件夹自定义
  const handleCustomizeFolder = (folder) => {
    setCustomizationFolder(folder);
    setShowCustomization(true);
    setShowMenu(null);
  };

  // 保存文件夹自定义
  const handleSaveCustomization = async (folderData) => {
    const result = await updateFolder(folderData.id, {
      name: folderData.name,
      icon: folderData.icon,
      color: folderData.color
    });
    
    if (result.success) {
      setShowCustomization(false);
      setCustomizationFolder(null);
    }
  };

  // 批量操作处理函数
  const handleBatchDelete = async (folderIds) => {
    if (window.confirm(`确定要删除选中的 ${folderIds.length} 个文件夹吗？`)) {
      for (const folderId of folderIds) {
        await deleteFolder(folderId);
      }
      setSelectedFolders([]);
    }
  };

  const handleBatchMove = async (folderIds, targetFolderId) => {
    for (const folderId of folderIds) {
      await updateFolder(folderId, { parent_id: targetFolderId });
    }
    setSelectedFolders([]);
  };

  const handleBatchUpdate = async (folderIds, action) => {
    // 根据不同的批量操作执行相应逻辑
    if (action === 'rename' && folderIds.length === 1) {
      const folder = foldersTree.find(f => f.id === folderIds[0]);
      if (folder) {
        setEditingFolder(folder.id);
        setEditingName(folder.name);
      }
    } else if (action === 'archive') {
      // 这里可以添加归档逻辑
      console.log('Archive folders:', folderIds);
    }
    setSelectedFolders([]);
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
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDropTarget(null);
    }
  };

  const handleDrop = async (e, folderId = null) => {
    e.preventDefault();
    setDropTarget(null);
    
    try {
      const noteData = JSON.parse(e.dataTransfer.getData('text/json'));
      
      if (noteData.folder_id === folderId) {
        return;
      }
      
      const result = await updateNote(noteData.id, {
        folder_id: folderId
      });
      
      if (result.success) {
        await fetchNotes(selectedFolder?.id || null);
      }
    } catch (error) {
      console.error('移动笔记失败:', error);
    }
  };

  // 扁平化文件夹列表（用于批量操作）
  const flattenFolders = (folders) => {
    const result = [];
    const traverse = (folderList) => {
      folderList.forEach(folder => {
        result.push(folder);
        if (folder.children && folder.children.length > 0) {
          traverse(folder.children);
        }
      });
    };
    traverse(folders);
    return result;
  };

  const allFolders = flattenFolders(foldersTree);
  
  // 递归渲染文件夹树
  const renderFolder = (folder, level = 0) => {
    const isExpanded = expandedFolders.has(folder.id);
    const isSelected = selectedFolder && selectedFolder.id === folder.id;
    const hasChildren = folder.children && folder.children.length > 0;
    const paddingLeft = level * 16 + 8;
    const isDropTarget = dropTarget === folder.id;
    const isBatchSelected = selectedFolders.includes(folder.id);
    
    return (
      <div key={folder.id}>
        {/* 文件夹项 */}
        <div 
          className={`group flex items-center py-1 px-2 mx-1 rounded cursor-pointer transition-colors ${
            showBatchActions 
              ? (isBatchSelected ? 'bg-blue-100 border border-blue-300' : 'hover:bg-gray-50')
              : isSelected 
                ? getFolderBackgroundColor(folder, true)
                : getFolderBackgroundColor(folder, false)
          } ${isDropTarget ? 'bg-green-100 border-2 border-green-300 border-dashed' : ''}`}
          style={{ paddingLeft: `${paddingLeft}px` }}
          onDragOver={(e) => handleDragOver(e, folder.id)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, folder.id)}
          onClick={() => {
            if (showBatchActions) {
              handleBatchFolderSelect(folder.id, !isBatchSelected);
            } else {
              handleFolderSelect(folder);
            }
          }}
        >
          {/* 批量选择复选框 */}
          {showBatchActions && (
            <div className="mr-2">
              {isBatchSelected ? (
                <CheckSquare className="h-4 w-4 text-blue-600" />
              ) : (
                <Square className="h-4 w-4 text-gray-400" />
              )}
            </div>
          )}

          {/* 展开/收起图标 */}
          {hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleFolderExpanded(folder.id);
              }}
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
            {getFolderIcon(folder, isExpanded)}
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
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span className="flex-1 text-sm truncate">
              {folder.name}
            </span>
          )}
          
          {/* 操作菜单 */}
          {!showBatchActions && (
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(showMenu === folder.id ? null : folder.id);
                }}
                className="p-1 rounded hover:bg-gray-200 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreHorizontal className="h-3 w-3" />
              </button>
              
              {showMenu === folder.id && (
                <div
                  ref={menuRef}
                  className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50 min-w-[140px]"
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
                    onClick={() => handleCustomizeFolder(folder)}
                    className="w-full px-3 py-1 text-left text-sm hover:bg-gray-100 flex items-center"
                  >
                    <Palette className="h-3 w-3 mr-2" />
                    自定义外观
                  </button>
                  <div className="border-t border-gray-100 my-1"></div>
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
          )}
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
        {/* 工具栏 */}
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-700">文件夹管理</h3>
          <div className="flex space-x-1">
            <button
              onClick={() => setShowBatchActions(!showBatchActions)}
              className={`p-1 rounded transition-colors ${
                showBatchActions 
                  ? 'bg-blue-100 text-blue-600' 
                  : 'hover:bg-gray-200 text-gray-600'
              }`}
              title="批量操作"
            >
              <Settings className="h-4 w-4" />
            </button>
            <button
              onClick={() => {
                setNewFolderParent(null);
                setShowCreateForm(true);
              }}
              className="p-1 hover:bg-gray-200 rounded transition-colors text-gray-600"
              title="新建文件夹"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>

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

      {/* 批量操作面板 */}
      {showBatchActions && (
        <FolderBatchActions
          folders={allFolders}
          selectedFolders={selectedFolders}
          onFolderSelect={handleBatchFolderSelect}
          onBatchDelete={handleBatchDelete}
          onBatchMove={handleBatchMove}
          onBatchUpdate={handleBatchUpdate}
          onClose={() => {
            setShowBatchActions(false);
            setSelectedFolders([]);
          }}
        />
      )}

      {/* 文件夹自定义对话框 */}
      <FolderCustomization
        folder={customizationFolder}
        isOpen={showCustomization}
        onClose={() => {
          setShowCustomization(false);
          setCustomizationFolder(null);
        }}
        onSave={handleSaveCustomization}
      />
    </div>
  );
};

export default EnhancedFolderTree;