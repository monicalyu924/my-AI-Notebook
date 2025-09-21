import React, { useState } from 'react';
import {
  CheckSquare,
  Square,
  Trash2,
  Edit3,
  FolderPlus,
  Move,
  Copy,
  Archive,
  Tag,
  X,
  MoreHorizontal
} from 'lucide-react';

const FolderBatchActions = ({ 
  folders = [],
  selectedFolders = [],
  onFolderSelect,
  onBatchDelete,
  onBatchMove,
  onBatchUpdate,
  onClose
}) => {
  const [showMoveDialog, setShowMoveDialog] = useState(false);
  const [targetFolderId, setTargetFolderId] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isAllSelected = selectedFolders.length === folders.length && folders.length > 0;
  const isSomeSelected = selectedFolders.length > 0 && selectedFolders.length < folders.length;

  const handleSelectAll = () => {
    if (isAllSelected) {
      // 取消全选
      selectedFolders.forEach(folderId => onFolderSelect(folderId, false));
    } else {
      // 全选
      folders.forEach(folder => {
        if (!selectedFolders.includes(folder.id)) {
          onFolderSelect(folder.id, true);
        }
      });
    }
  };

  const handleBatchDelete = () => {
    onBatchDelete(selectedFolders);
    setShowDeleteConfirm(false);
  };

  const handleBatchMove = () => {
    if (targetFolderId !== null) {
      onBatchMove(selectedFolders, targetFolderId);
      setShowMoveDialog(false);
      setTargetFolderId(null);
    }
  };

  return (
    <div className="bg-white border-t border-gray-200 p-4">
      {/* 批量操作工具栏 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          {/* 全选/取消全选 */}
          <button
            onClick={handleSelectAll}
            className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-800"
          >
            {isAllSelected ? (
              <CheckSquare className="h-4 w-4 text-blue-600" />
            ) : isSomeSelected ? (
              <div className="h-4 w-4 border-2 border-blue-600 bg-blue-600 relative">
                <div className="absolute inset-0 bg-white m-1"></div>
              </div>
            ) : (
              <Square className="h-4 w-4" />
            )}
            <span>全选 ({selectedFolders.length}/{folders.length})</span>
          </button>

          {/* 选中数量 */}
          {selectedFolders.length > 0 && (
            <span className="text-sm text-gray-500">
              已选择 {selectedFolders.length} 个文件夹
            </span>
          )}
        </div>

        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          className="p-1 text-gray-400 hover:text-gray-600"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* 批量操作按钮 */}
      {selectedFolders.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {/* 移动 */}
          <button
            onClick={() => setShowMoveDialog(true)}
            className="flex items-center px-3 py-1 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100"
          >
            <Move className="h-3 w-3 mr-1" />
            移动
          </button>

          {/* 重命名 */}
          <button
            onClick={() => {
              // 如果只选中一个文件夹，可以直接重命名
              if (selectedFolders.length === 1) {
                const folderId = selectedFolders[0];
                onBatchUpdate([folderId], 'rename');
              }
            }}
            disabled={selectedFolders.length !== 1}
            className={`flex items-center px-3 py-1 text-sm rounded-lg ${
              selectedFolders.length === 1
                ? 'bg-green-50 text-green-700 hover:bg-green-100'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            <Edit3 className="h-3 w-3 mr-1" />
            重命名
          </button>

          {/* 归档 */}
          <button
            onClick={() => onBatchUpdate(selectedFolders, 'archive')}
            className="flex items-center px-3 py-1 text-sm bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100"
          >
            <Archive className="h-3 w-3 mr-1" />
            归档
          </button>

          {/* 删除 */}
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center px-3 py-1 text-sm bg-red-50 text-red-700 rounded-lg hover:bg-red-100"
          >
            <Trash2 className="h-3 w-3 mr-1" />
            删除
          </button>
        </div>
      )}

      {/* 文件夹列表 */}
      <div className="mt-4 max-h-60 overflow-y-auto">
        {folders.map((folder) => (
          <div
            key={folder.id}
            className={`flex items-center p-2 rounded-lg cursor-pointer transition-colors ${
              selectedFolders.includes(folder.id)
                ? 'bg-blue-50 border border-blue-200'
                : 'hover:bg-gray-50'
            }`}
            onClick={() => onFolderSelect(folder.id, !selectedFolders.includes(folder.id))}
          >
            <div className="mr-3">
              {selectedFolders.includes(folder.id) ? (
                <CheckSquare className="h-4 w-4 text-blue-600" />
              ) : (
                <Square className="h-4 w-4 text-gray-400" />
              )}
            </div>
            <FolderPlus className="h-4 w-4 text-gray-500 mr-2" />
            <span className="flex-1 text-sm">{folder.name}</span>
            <span className="text-xs text-gray-400">
              {folder.notes_count || 0} 个笔记
            </span>
          </div>
        ))}
      </div>

      {/* 移动对话框 */}
      {showMoveDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">移动文件夹</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                选择目标位置
              </label>
              <select
                value={targetFolderId || ''}
                onChange={(e) => setTargetFolderId(e.target.value === '' ? null : e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">根目录</option>
                {folders
                  .filter(folder => !selectedFolders.includes(folder.id))
                  .map(folder => (
                    <option key={folder.id} value={folder.id}>
                      {folder.name}
                    </option>
                  ))
                }
              </select>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowMoveDialog(false);
                  setTargetFolderId(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleBatchMove}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                移动
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 删除确认对话框 */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4 text-red-600">确认删除</h3>
            <p className="text-gray-600 mb-4">
              确定要删除选中的 {selectedFolders.length} 个文件夹吗？此操作不可撤销。
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={handleBatchDelete}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FolderBatchActions;