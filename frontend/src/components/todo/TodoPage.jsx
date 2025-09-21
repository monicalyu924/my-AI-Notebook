import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Calendar, 
  Filter, 
  Search, 
  CheckSquare, 
  Square, 
  Clock, 
  AlertCircle, 
  User, 
  Trash2, 
  Edit3,
  MoreVertical,
  Tag,
  BarChart3,
  Loader
} from 'lucide-react';
import { useTodos } from '../../context/TodoContext';

const TodoPage = () => {
  const { 
    todos, 
    stats, 
    loading, 
    error, 
    fetchTodos, 
    fetchStats, 
    createTodo, 
    updateTodo, 
    toggleTodo, 
    deleteTodo,
    clearError 
  } = useTodos();
  
  const [filter, setFilter] = useState('all'); // all, pending, completed, today, overdue
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState('list'); // list, calendar, kanban

  // 初始化数据
  useEffect(() => {
    fetchTodos();
    fetchStats();
  }, []);

  // 当过滤条件改变时重新获取数据
  useEffect(() => {
    const filters = {};
    if (selectedCategory !== 'all') filters.category = selectedCategory;
    if (filter === 'pending') filters.completed = false;
    if (filter === 'completed') filters.completed = true;
    if (searchTerm) filters.search = searchTerm;
    
    fetchTodos(filters);
  }, [filter, selectedCategory, searchTerm]);

  // 本地过滤（主要用于today和overdue，因为API没有直接支持）
  const filteredTodos = todos.filter(todo => {
    if (filter === 'today') {
      const today = new Date().toISOString().split('T')[0];
      return todo.due_date === today;
    }
    if (filter === 'overdue') {
      const now = new Date().toISOString().split('T')[0];
      return !todo.completed && todo.due_date && todo.due_date < now;
    }
    return true;
  });

  // 获取优先级颜色
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  // 获取截止日期状态
  const getDueDateStatus = (dueDate) => {
    if (!dueDate) return null;
    
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return { status: 'overdue', text: '已逾期', color: 'text-red-600' };
    if (diffDays === 0) return { status: 'today', text: '今天到期', color: 'text-orange-600' };
    if (diffDays === 1) return { status: 'tomorrow', text: '明天到期', color: 'text-yellow-600' };
    if (diffDays <= 7) return { status: 'week', text: `${diffDays}天后`, color: 'text-blue-600' };
    return { status: 'future', text: `${diffDays}天后`, color: 'text-gray-600' };
  };

  // 切换任务完成状态
  const handleToggleTodo = async (id) => {
    const result = await toggleTodo(id);
    if (!result.success) {
      alert(result.error || '操作失败');
    }
  };

  // 删除任务
  const handleDeleteTodo = async (id) => {
    if (window.confirm('确定要删除这个任务吗？')) {
      const result = await deleteTodo(id);
      if (!result.success) {
        alert(result.error || '删除失败');
      }
    }
  };

  // 添加新任务
  const handleAddTodo = async (todoData) => {
    const todoPayload = {
      title: todoData.title,
      description: todoData.description || '',
      priority: todoData.priority || 'medium',
      due_date: todoData.dueDate || null,
      category: todoData.category || 'work',
      assignee: todoData.assignee || '我',
      tags: todoData.tags || []
    };
    
    const result = await createTodo(todoPayload);
    if (result.success) {
      setShowAddForm(false);
    } else {
      alert(result.error || '创建失败');
    }
  };

  const categories = [
    { key: 'all', label: '全部', icon: BarChart3 },
    { key: 'work', label: '工作', icon: CheckSquare },
    { key: 'personal', label: '个人', icon: User },
    { key: 'study', label: '学习', icon: Edit3 }
  ];

  const filters = [
    { key: 'all', label: '全部', count: stats.total },
    { key: 'pending', label: '待完成', count: stats.pending },
    { key: 'completed', label: '已完成', count: stats.completed },
    { key: 'today', label: '今天', count: todos.filter(t => t.due_date === new Date().toISOString().split('T')[0]).length },
    { key: 'overdue', label: '逾期', count: stats.overdue }
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* 左侧边栏 */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* 头部 */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <CheckSquare className="h-7 w-7 mr-3 text-blue-600" />
              待办事项
            </h1>
            <button
              onClick={() => setShowAddForm(true)}
              className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              title="添加新任务"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>

          {/* 统计卡片 */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="text-xs text-blue-600 font-medium">总计</div>
              <div className="text-xl font-bold text-blue-900">{stats.total}</div>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <div className="text-xs text-green-600 font-medium">已完成</div>
              <div className="text-xl font-bold text-green-900">{stats.completed}</div>
            </div>
            <div className="bg-yellow-50 p-3 rounded-lg">
              <div className="text-xs text-yellow-600 font-medium">待完成</div>
              <div className="text-xl font-bold text-yellow-900">{stats.pending}</div>
            </div>
            <div className="bg-red-50 p-3 rounded-lg">
              <div className="text-xs text-red-600 font-medium">逾期</div>
              <div className="text-xl font-bold text-red-900">{stats.overdue}</div>
            </div>
          </div>

          {/* 搜索框 */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="搜索任务..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* 分类过滤 */}
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-sm font-medium text-gray-700 mb-3">分类</h3>
          <div className="space-y-1">
            {categories.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setSelectedCategory(key)}
                className={`w-full flex items-center px-3 py-2 text-sm rounded-lg transition-colors ${
                  selectedCategory === key
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Icon className="h-4 w-4 mr-3" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* 状态过滤 */}
        <div className="p-4 flex-1">
          <h3 className="text-sm font-medium text-gray-700 mb-3">状态</h3>
          <div className="space-y-1">
            {filters.map(({ key, label, count }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors ${
                  filter === key
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <span>{label}</span>
                <span className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full text-xs">
                  {count}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 主内容区 */}
      <div className="flex-1 flex flex-col">
        {/* 工具栏 */}
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h2 className="text-lg font-semibold text-gray-900">
                {filter === 'all' && '全部任务'}
                {filter === 'pending' && '待完成任务'}
                {filter === 'completed' && '已完成任务'}
                {filter === 'today' && '今天的任务'}
                {filter === 'overdue' && '逾期任务'}
              </h2>
              <span className="text-sm text-gray-500">
                共 {filteredTodos.length} 个任务
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'list' 
                    ? 'bg-blue-100 text-blue-600' 
                    : 'text-gray-400 hover:text-gray-600'
                }`}
                title="列表视图"
              >
                <BarChart3 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('calendar')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'calendar' 
                    ? 'bg-blue-100 text-blue-600' 
                    : 'text-gray-400 hover:text-gray-600'
                }`}
                title="日历视图"
              >
                <Calendar className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* 任务列表 */}
        <div className="flex-1 overflow-y-auto p-6">
          {filteredTodos.length === 0 ? (
            <div className="text-center py-12">
              <CheckSquare className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">暂无任务</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || filter !== 'all' || selectedCategory !== 'all'
                  ? '没有找到符合条件的任务'
                  : '创建您的第一个任务开始管理工作'}
              </p>
              <button
                onClick={() => setShowAddForm(true)}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                添加任务
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTodos.map((todo) => {
                const dueDateStatus = getDueDateStatus(todo.due_date);
                
                return (
                  <div
                    key={todo.id}
                    className={`bg-white rounded-lg border p-4 transition-all duration-200 ${
                      todo.completed 
                        ? 'opacity-75 border-gray-200' 
                        : 'border-gray-300 hover:border-blue-300 hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      {/* 复选框 */}
                      <button
                        onClick={() => handleToggleTodo(todo.id)}
                        className="mt-1 transition-colors hover:text-blue-600"
                        disabled={loading}
                      >
                        {todo.completed ? (
                          <CheckSquare className="h-5 w-5 text-green-600" />
                        ) : (
                          <Square className="h-5 w-5 text-gray-400" />
                        )}
                      </button>

                      {/* 任务内容 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className={`font-medium ${
                              todo.completed 
                                ? 'line-through text-gray-500' 
                                : 'text-gray-900'
                            }`}>
                              {todo.title}
                            </h3>
                            {todo.description && (
                              <p className={`text-sm mt-1 ${
                                todo.completed 
                                  ? 'line-through text-gray-400' 
                                  : 'text-gray-600'
                              }`}>
                                {todo.description}
                              </p>
                            )}
                          </div>
                          
                          {/* 操作按钮 */}
                          <div className="flex items-center space-x-1 ml-4">
                            <button
                              onClick={() => {/* TODO: 编辑功能 */}}
                              className="p-1 text-gray-400 hover:text-gray-600 rounded"
                              title="编辑"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteTodo(todo.id)}
                              className="p-1 text-gray-400 hover:text-red-600 rounded"
                              title="删除"
                              disabled={loading}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        {/* 任务元信息 */}
                        <div className="flex items-center space-x-4 mt-3">
                          {/* 优先级 */}
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(todo.priority)}`}>
                            <AlertCircle className="h-3 w-3 mr-1" />
                            {todo.priority}
                          </span>
                          
                          {/* 截止日期 */}
                          {todo.due_date && (
                            <span className={`inline-flex items-center text-xs ${dueDateStatus?.color || 'text-gray-600'}`}>
                              <Calendar className="h-3 w-3 mr-1" />
                              {dueDateStatus?.text || todo.due_date}
                            </span>
                          )}
                          
                          {/* 负责人 */}
                          <span className="inline-flex items-center text-xs text-purple-600">
                            <User className="h-3 w-3 mr-1" />
                            {todo.assignee}
                          </span>

                          {/* 分类 */}
                          <span className="inline-flex items-center text-xs text-blue-600">
                            <Tag className="h-3 w-3 mr-1" />
                            {todo.category === 'work' ? '工作' : 
                             todo.category === 'personal' ? '个人' : 
                             todo.category === 'study' ? '学习' : todo.category}
                          </span>
                        </div>

                        {/* 标签 */}
                        {todo.tags && todo.tags.length > 0 && (
                          <div className="flex items-center space-x-1 mt-2">
                            {todo.tags.map((tag, index) => (
                              <span
                                key={index}
                                className="inline-block px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 添加任务弹窗 */}
      {showAddForm && (
        <AddTodoModal 
          onClose={() => setShowAddForm(false)}
          onAdd={handleAddTodo}
          loading={loading}
        />
      )}

      {/* 加载指示器 */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-40">
          <div className="bg-white rounded-lg p-4 flex items-center space-x-3">
            <Loader className="h-5 w-5 animate-spin text-blue-600" />
            <span>处理中...</span>
          </div>
        </div>
      )}

      {/* 错误提示 */}
      {error && (
        <div className="fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded z-50 max-w-sm">
          <div className="flex justify-between items-start">
            <span>{error}</span>
            <button
              onClick={clearError}
              className="ml-2 text-red-400 hover:text-red-600"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// 添加任务弹窗组件
const AddTodoModal = ({ onClose, onAdd, loading = false }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    dueDate: '',
    category: 'work',
    assignee: '我',
    tags: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;
    
    const todoData = {
      ...formData,
      tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
    };
    
    onAdd(todoData);
    setFormData({
      title: '',
      description: '',
      priority: 'medium',
      dueDate: '',
      category: 'work',
      assignee: '我',
      tags: ''
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">添加新任务</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                任务标题 *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="输入任务标题..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                任务描述
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="输入任务描述..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  优先级
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="low">低</option>
                  <option value="medium">中</option>
                  <option value="high">高</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  分类
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="work">工作</option>
                  <option value="personal">个人</option>
                  <option value="study">学习</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  截止日期
                </label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  负责人
                </label>
                <input
                  type="text"
                  value={formData.assignee}
                  onChange={(e) => setFormData({ ...formData, assignee: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="负责人..."
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                标签
              </label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="用逗号分隔多个标签..."
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '添加中...' : '添加任务'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TodoPage;
