import React, { useState, useEffect } from 'react';
import { tagsAPI } from '../../utils/api';
import { Tag, Edit2, Trash2, GitMerge, TrendingUp, X, Check } from 'lucide-react';

/**
 * 标签管理器组件
 * 提供标签统计、重命名、合并、删除功能
 */
const TagManager = ({ onClose }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTags, setSelectedTags] = useState(new Set());
  const [editingTag, setEditingTag] = useState(null);
  const [newTagName, setNewTagName] = useState('');
  const [mergeTarget, setMergeTarget] = useState('');
  const [showMergeModal, setShowMergeModal] = useState(false);

  useEffect(() => {
    loadTagStats();
  }, []);

  const loadTagStats = async () => {
    try {
      setLoading(true);
      const response = await tagsAPI.getStats();
      if (response.data) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('加载标签统计失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRenameTag = async (oldTag) => {
    if (!newTagName || newTagName === oldTag) {
      setEditingTag(null);
      return;
    }

    try {
      const response = await tagsAPI.renameTag(oldTag, newTagName);
      if (response.data && response.data.success) {
        await loadTagStats();
        setEditingTag(null);
        setNewTagName('');
      }
    } catch (error) {
      console.error('重命名标签失败:', error);
      alert('重命名失败：' + (error.response?.data?.detail || error.message));
    }
  };

  const handleDeleteTag = async (tag) => {
    if (!confirm(`确定要删除标签 "${tag}" 吗？这将从所有笔记和待办事项中移除此标签。`)) {
      return;
    }

    try {
      const response = await tagsAPI.deleteTag(tag);
      if (response.data && response.data.success) {
        await loadTagStats();
      }
    } catch (error) {
      console.error('删除标签失败:', error);
      alert('删除失败：' + (error.response?.data?.detail || error.message));
    }
  };

  const handleMergeTags = async () => {
    if (!mergeTarget || selectedTags.size === 0) {
      alert('请选择源标签和输入目标标签');
      return;
    }

    const sourceTags = Array.from(selectedTags);
    if (sourceTags.includes(mergeTarget)) {
      alert('目标标签不能在源标签列表中');
      return;
    }

    try {
      const response = await tagsAPI.mergeTags(sourceTags, mergeTarget);
      if (response.data && response.data.success) {
        await loadTagStats();
        setSelectedTags(new Set());
        setMergeTarget('');
        setShowMergeModal(false);
      }
    } catch (error) {
      console.error('合并标签失败:', error);
      alert('合并失败：' + (error.response?.data?.detail || error.message));
    }
  };

  const toggleTagSelection = (tag) => {
    const newSelected = new Set(selectedTags);
    if (newSelected.has(tag)) {
      newSelected.delete(tag);
    } else {
      newSelected.add(tag);
    }
    setSelectedTags(newSelected);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">加载标签数据...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* 头部 */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Tag className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">标签管理</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* 统计信息 */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-200">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats?.total_tags || 0}</div>
              <div className="text-sm text-gray-600">总标签数</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{stats?.total_usages || 0}</div>
              <div className="text-sm text-gray-600">总使用次数</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{selectedTags.size}</div>
              <div className="text-sm text-gray-600">已选择</div>
            </div>
          </div>
        </div>

        {/* 操作栏 */}
        {selectedTags.size > 0 && (
          <div className="px-6 py-3 bg-blue-50 border-b border-blue-200 flex items-center justify-between">
            <div className="text-sm text-blue-800">
              已选择 {selectedTags.size} 个标签
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowMergeModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm"
              >
                <GitMerge className="w-4 h-4" />
                合并标签
              </button>
              <button
                onClick={() => setSelectedTags(new Set())}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm"
              >
                取消选择
              </button>
            </div>
          </div>
        )}

        {/* 标签列表 */}
        <div className="flex-1 overflow-y-auto p-6">
          {stats?.tags && stats.tags.length > 0 ? (
            <div className="space-y-2">
              {stats.tags.map((tagData) => (
                <div
                  key={tagData.tag}
                  className={`p-4 rounded-xl border transition-all ${
                    selectedTags.has(tagData.tag)
                      ? 'border-blue-400 bg-blue-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    {/* 选择框 */}
                    <input
                      type="checkbox"
                      checked={selectedTags.has(tagData.tag)}
                      onChange={() => toggleTagSelection(tagData.tag)}
                      className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    />

                    {/* 标签信息 */}
                    <div className="flex-1">
                      {editingTag === tagData.tag ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={newTagName}
                            onChange={(e) => setNewTagName(e.target.value)}
                            className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="新标签名"
                            autoFocus
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                handleRenameTag(tagData.tag);
                              }
                            }}
                          />
                          <button
                            onClick={() => handleRenameTag(tagData.tag)}
                            className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setEditingTag(null);
                              setNewTagName('');
                            }}
                            className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: tagData.color }}
                            ></div>
                            <span className="font-medium text-gray-900">{tagData.tag}</span>
                            <span className="text-sm text-gray-500">
                              使用 {tagData.total_count} 次
                            </span>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="flex gap-3 text-sm text-gray-600">
                              <span>{tagData.notes_count} 笔记</span>
                              <span>{tagData.todos_count} 待办</span>
                            </div>
                            <div className="flex gap-1">
                              <button
                                onClick={() => {
                                  setEditingTag(tagData.tag);
                                  setNewTagName(tagData.tag);
                                }}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                title="重命名"
                              >
                                <Edit2 className="w-4 h-4 text-gray-500" />
                              </button>
                              <button
                                onClick={() => handleDeleteTag(tagData.tag)}
                                className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                                title="删除"
                              >
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Tag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">还没有任何标签</p>
              <p className="text-sm text-gray-400 mt-2">在笔记或待办事项中添加标签后，这里会显示标签统计</p>
            </div>
          )}
        </div>

        {/* 合并标签模态框 */}
        {showMergeModal && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">合并标签</h3>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  源标签 ({selectedTags.size} 个)
                </label>
                <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-lg">
                  {Array.from(selectedTags).map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  目标标签
                </label>
                <input
                  type="text"
                  value={mergeTarget}
                  onChange={(e) => setMergeTarget(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="输入目标标签名"
                />
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setShowMergeModal(false);
                    setMergeTarget('');
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleMergeTags}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  确认合并
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TagManager;
