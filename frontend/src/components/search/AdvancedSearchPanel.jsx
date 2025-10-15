import React, { useState, useEffect } from 'react';
import {
  Search, X, Calendar, Tag, Folder, SlidersHorizontal,
  ArrowDownAZ, ArrowUpAZ
} from 'lucide-react';
import { notesAPI } from '../../utils/api';

const AdvancedSearchPanel = ({ isOpen, onClose, onResultsFound }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortBy, setSortBy] = useState('updated_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState([]);

  // 可用标签列表（从现有笔记中提取）
  const [availableTags, setAvailableTags] = useState([]);
  const [folders, setFolders] = useState([]);

  // 加载可用标签和文件夹
  useEffect(() => {
    if (isOpen) {
      loadAvailableFilters();
    }
  }, [isOpen]);

  const loadAvailableFilters = async () => {
    try {
      // 加载所有笔记以提取标签
      const notesResponse = await notesAPI.getNotes();
      const allNotes = notesResponse.data;

      // 提取唯一标签
      const tagsSet = new Set();
      allNotes.forEach(note => {
        if (note.tags && Array.isArray(note.tags)) {
          note.tags.forEach(tag => tagsSet.add(tag));
        }
      });
      setAvailableTags(Array.from(tagsSet).sort());

      // 加载文件夹
      // TODO: 如果有文件夹API，在这里加载
      // const foldersResponse = await foldersAPI.getFolders();
      // setFolders(foldersResponse.data);
    } catch (error) {
      console.error('Failed to load filters:', error);
    }
  };

  const handleSearch = async () => {
    setIsSearching(true);
    try {
      // 构建查询参数
      const params = new URLSearchParams();

      if (searchQuery.trim()) {
        params.append('q', searchQuery.trim());
      }
      if (selectedTags.length > 0) {
        params.append('tags', selectedTags.join(','));
      }
      if (selectedFolder) {
        params.append('folder_id', selectedFolder);
      }
      if (dateFrom) {
        params.append('date_from', dateFrom);
      }
      if (dateTo) {
        params.append('date_to', dateTo);
      }
      params.append('sort_by', sortBy);
      params.append('sort_order', sortOrder);
      params.append('limit', '100');

      const response = await notesAPI.advancedSearch(params.toString());
      setResults(response.data);

      // 通知父组件搜索结果
      if (onResultsFound) {
        onResultsFound(response.data);
      }
    } catch (error) {
      console.error('Search failed:', error);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedTags([]);
    setSelectedFolder('');
    setDateFrom('');
    setDateTo('');
    setSortBy('updated_at');
    setSortOrder('desc');
    setResults([]);
  };

  const toggleTag = (tag) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <SlidersHorizontal className="h-5 w-5 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">高级搜索</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Search Form */}
        <div className="p-6 space-y-6">
          {/* 关键词搜索 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Search className="inline h-4 w-4 mr-1" />
              搜索关键词
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="输入标题或内容关键词..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>

          {/* 标签过滤 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Tag className="inline h-4 w-4 mr-1" />
              选择标签
            </label>
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto border border-gray-200 rounded-lg p-3">
              {availableTags.length === 0 ? (
                <span className="text-sm text-gray-500">暂无可用标签</span>
              ) : (
                availableTags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-1 rounded-full text-sm transition-colors ${
                      selectedTags.includes(tag)
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {tag}
                  </button>
                ))
              )}
            </div>
            {selectedTags.length > 0 && (
              <div className="mt-2 text-sm text-gray-600">
                已选择: {selectedTags.join(', ')}
              </div>
            )}
          </div>

          {/* 文件夹过滤 */}
          {folders.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Folder className="inline h-4 w-4 mr-1" />
                选择文件夹
              </label>
              <select
                value={selectedFolder}
                onChange={(e) => setSelectedFolder(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">全部文件夹</option>
                {folders.map(folder => (
                  <option key={folder.id} value={folder.id}>
                    {folder.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* 日期范围 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="inline h-4 w-4 mr-1" />
                起始日期
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="inline h-4 w-4 mr-1" />
                结束日期
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* 排序选项 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                排序字段
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="updated_at">更新时间</option>
                <option value="created_at">创建时间</option>
                <option value="title">标题</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                排序方向
              </label>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="desc">
                  {sortBy === 'title' ? '降序 (Z-A)' : '新到旧'}
                </option>
                <option value="asc">
                  {sortBy === 'title' ? '升序 (A-Z)' : '旧到新'}
                </option>
              </select>
            </div>
          </div>
        </div>

        {/* 搜索结果统计 */}
        {results.length > 0 && (
          <div className="px-6 py-3 bg-blue-50 border-y border-blue-100">
            <p className="text-sm text-blue-700">
              找到 <span className="font-semibold">{results.length}</span> 条匹配的笔记
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="sticky bottom-0 bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-200">
          <button
            onClick={handleClearFilters}
            className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
          >
            清除筛选
          </button>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleSearch}
              disabled={isSearching}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isSearching ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                  <span>搜索中...</span>
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  <span>搜索</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedSearchPanel;
