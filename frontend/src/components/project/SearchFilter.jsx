import React, { useState, useCallback } from 'react';
import { Search, Filter, X, Tag, Calendar, User, CheckCircle2 } from 'lucide-react';

const SearchFilter = ({ onSearch, onFilter, totalCards, filteredCards }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState({
    priority: '',
    status: '',
    assignee: '',
    hasDeadline: false
  });
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSearchChange = useCallback((e) => {
    const value = e.target.value;
    setSearchTerm(value);
    onSearch(value);
  }, [onSearch]);

  const handleFilterChange = useCallback((filterType, value) => {
    const newFilters = {
      ...activeFilters,
      [filterType]: activeFilters[filterType] === value ? '' : value
    };
    setActiveFilters(newFilters);
    onFilter(newFilters);
  }, [activeFilters, onFilter]);

  const handleToggleFilter = useCallback((filterType) => {
    const newFilters = {
      ...activeFilters,
      [filterType]: !activeFilters[filterType]
    };
    setActiveFilters(newFilters);
    onFilter(newFilters);
  }, [activeFilters, onFilter]);

  const clearAllFilters = useCallback(() => {
    const emptyFilters = {
      priority: '',
      status: '',
      assignee: '',
      hasDeadline: false
    };
    setActiveFilters(emptyFilters);
    setSearchTerm('');
    onSearch('');
    onFilter(emptyFilters);
  }, [onSearch, onFilter]);

  const hasActiveFilters = searchTerm || Object.values(activeFilters).some(value => 
    value === true || (typeof value === 'string' && value !== '')
  );

  const priorityOptions = [
    { value: 'urgent', label: '🔥 紧急', color: 'bg-red-100 text-red-800 border-red-200' },
    { value: 'high', label: '⚠️ 高', color: 'bg-orange-100 text-orange-800 border-orange-200' },
    { value: 'medium', label: '🟡 中', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
    { value: 'low', label: '🟢 低', color: 'bg-green-100 text-green-800 border-green-200' }
  ];

  const statusOptions = [
    { value: 'completed', label: '✅ 已完成', color: 'bg-green-100 text-green-800 border-green-200' },
    { value: 'active', label: '🔄 进行中', color: 'bg-blue-100 text-blue-800 border-blue-200' }
  ];

  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-white/30 p-4 sm:p-6 mb-6 trello-slide-in">
      {/* 搜索栏 */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="relative flex-1 min-w-0">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="搜索卡片标题、描述..."
            className="block w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm placeholder-gray-500 trello-focus-ring"
          />
          {searchTerm && (
            <button
              onClick={() => {
                setSearchTerm('');
                onSearch('');
              }}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
            </button>
          )}
        </div>

        {/* 快速筛选和高级筛选切换 */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`flex items-center gap-2 px-4 py-3 border rounded-lg text-sm font-medium transition-all duration-200 trello-focus-ring ${
              showAdvanced || hasActiveFilters
                ? 'bg-purple-50 text-purple-700 border-purple-300'
                : 'bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100'
            }`}
          >
            <Filter className="h-4 w-4" />
            <span className="hidden sm:inline">筛选</span>
            {hasActiveFilters && (
              <span className="bg-purple-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {Object.values(activeFilters).filter(v => v === true || (typeof v === 'string' && v !== '')).length + (searchTerm ? 1 : 0)}
              </span>
            )}
          </button>

          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="text-sm text-gray-500 hover:text-gray-700 underline"
            >
              清除筛选
            </button>
          )}
        </div>
      </div>

      {/* 结果统计 */}
      {hasActiveFilters && (
        <div className="mt-4 text-sm text-gray-600">
          显示 {filteredCards} 个结果，共 {totalCards} 个卡片
        </div>
      )}

      {/* 高级筛选面板 */}
      {showAdvanced && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* 优先级筛选 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                <Tag className="inline w-4 h-4 mr-2" />
                优先级
              </label>
              <div className="space-y-2">
                {priorityOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleFilterChange('priority', option.value)}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium border rounded-lg transition-all ${
                      activeFilters.priority === option.value
                        ? option.color + ' ring-2 ring-blue-200'
                        : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    <span>{option.label}</span>
                    {activeFilters.priority === option.value && (
                      <CheckCircle2 className="w-4 h-4" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* 状态筛选 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                <CheckCircle2 className="inline w-4 h-4 mr-2" />
                状态
              </label>
              <div className="space-y-2">
                {statusOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleFilterChange('status', option.value)}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium border rounded-lg transition-all ${
                      activeFilters.status === option.value
                        ? option.color + ' ring-2 ring-blue-200'
                        : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    <span>{option.label}</span>
                    {activeFilters.status === option.value && (
                      <CheckCircle2 className="w-4 h-4" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* 截止日期筛选 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                <Calendar className="inline w-4 h-4 mr-2" />
                截止日期
              </label>
              <div className="space-y-2">
                <button
                  onClick={() => handleToggleFilter('hasDeadline')}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium border rounded-lg transition-all ${
                    activeFilters.hasDeadline
                      ? 'bg-blue-100 text-blue-800 border-blue-200 ring-2 ring-blue-200'
                      : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <span>📅 有截止日期</span>
                  {activeFilters.hasDeadline && (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* 指派人筛选 (预留) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                <User className="inline w-4 h-4 mr-2" />
                指派人
              </label>
              <div className="text-xs text-gray-500 italic p-3 bg-gray-50 rounded-lg border border-gray-200">
                功能开发中...
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchFilter;