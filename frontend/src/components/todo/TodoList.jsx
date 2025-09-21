import React, { useState, useEffect } from 'react';
import { 
  CheckSquare, 
  Square, 
  Calendar, 
  AlertCircle, 
  User, 
  Tag, 
  Clock,
  Filter,
  Plus
} from 'lucide-react';
import { useTodos } from '../../context/TodoContext';

const TodoList = () => {
  const { 
    todos, 
    stats, 
    loading, 
    error, 
    fetchTodos, 
    fetchStats, 
    toggleTodo,
    selectedTodo,
    setSelectedTodo,
    setIsCreating
  } = useTodos();

  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchTodos();
    fetchStats();
  }, []);

  // 过滤待办事项
  const filteredTodos = todos.filter(todo => {
    // 基础过滤
    if (filter === 'pending' && todo.completed) return false;
    if (filter === 'completed' && !todo.completed) return false;
    if (filter === 'today') {
      const today = new Date().toISOString().split('T')[0];
      if (todo.due_date !== today) return false;
    }
    if (filter === 'overdue') {
      const now = new Date().toISOString().split('T')[0];
      if (todo.completed || !todo.due_date || todo.due_date >= now) return false;
    }

    // 搜索过滤
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        todo.title.toLowerCase().includes(searchLower) ||
        (todo.description && todo.description.toLowerCase().includes(searchLower)) ||
        (todo.tags && todo.tags.some(tag => tag.toLowerCase().includes(searchLower)))
      );
    }

    return true;
  });

  // 获取优先级颜色
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'border-l-red-400 bg-red-50';
      case 'medium': return 'border-l-yellow-400 bg-yellow-50';
      case 'low': return 'border-l-green-400 bg-green-50';
      default: return 'border-l-gray-400 bg-gray-50';
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
    if (diffDays === 0) return { status: 'today', text: '今天', color: 'text-orange-600' };
    if (diffDays === 1) return { status: 'tomorrow', text: '明天', color: 'text-yellow-600' };
    if (diffDays <= 7) return { status: 'week', text: `${diffDays}天后`, color: 'text-blue-600' };
    return { status: 'future', text: `${diffDays}天后`, color: 'text-gray-600' };
  };

  const handleToggle = async (id, event) => {
    event.stopPropagation();
    await toggleTodo(id);
  };

  const handleTodoClick = (todo) => {
    setSelectedTodo(todo);
  };

  const handleCreateNew = () => {
    setSelectedTodo(null);
    setIsCreating(true);
  };

  if (loading && todos.length === 0) {
    return (
      <div className="w-80 bg-white border-r border-gray-200 flex items-center justify-center">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* 头部 */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">待办事项</h2>
          <button 
            onClick={handleCreateNew}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        {/* 统计 */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="bg-blue-50 rounded-lg p-2 text-center">
            <div className="text-lg font-bold text-blue-600">{stats.total}</div>
            <div className="text-xs text-blue-600">总计</div>
          </div>
          <div className="bg-green-50 rounded-lg p-2 text-center">
            <div className="text-lg font-bold text-green-600">{stats.completed}</div>
            <div className="text-xs text-green-600">已完成</div>
          </div>
        </div>

        {/* 过滤器 */}
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          {[
            { key: 'all', label: '全部' },
            { key: 'pending', label: '待办' },
            { key: 'completed', label: '完成' }
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`flex-1 px-2 py-1 text-xs rounded-md transition-all ${
                filter === f.key 
                  ? 'bg-white text-blue-600 shadow-sm font-medium' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* 待办事项列表 */}
      <div className="flex-1 overflow-y-auto">
        {filteredTodos.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <CheckSquare className="h-12 w-12 text-gray-300 mb-2" />
            <p className="text-sm">暂无待办事项</p>
            <p className="text-xs text-gray-400 mt-1">点击上方 + 创建第一个任务</p>
          </div>
        ) : (
          <div className="p-2 space-y-2">
            {filteredTodos.map((todo) => {
              const dueDateStatus = getDueDateStatus(todo.due_date);
              const isSelected = selectedTodo?.id === todo.id;
              
              return (
                <div
                  key={todo.id}
                  onClick={() => handleTodoClick(todo)}
                  className={`p-3 rounded-lg border-l-4 cursor-pointer transition-all ${
                    getPriorityColor(todo.priority)
                  } ${
                    isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:shadow-sm'
                  } ${
                    todo.completed ? 'opacity-60' : ''
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    {/* 复选框 */}
                    <button
                      onClick={(e) => handleToggle(todo.id, e)}
                      className="mt-1 transition-colors hover:text-blue-600"
                    >
                      {todo.completed ? (
                        <CheckSquare className="h-4 w-4 text-green-600" />
                      ) : (
                        <Square className="h-4 w-4 text-gray-400" />
                      )}
                    </button>

                    {/* 内容 */}
                    <div className="flex-1 min-w-0">
                      <h3 className={`text-sm font-medium ${
                        todo.completed ? 'line-through text-gray-500' : 'text-gray-900'
                      }`}>
                        {todo.title}
                      </h3>
                      
                      {todo.description && (
                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                          {todo.description}
                        </p>
                      )}

                      {/* 元信息 */}
                      <div className="flex items-center space-x-3 mt-2">
                        {/* 优先级 */}
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${
                          todo.priority === 'high' ? 'bg-red-100 text-red-800' :
                          todo.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
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
                      </div>

                      {/* 标签 */}
                      {todo.tags && todo.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {todo.tags.slice(0, 2).map((tag, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs bg-blue-100 text-blue-800"
                            >
                              <Tag className="h-2 w-2 mr-1" />
                              {tag}
                            </span>
                          ))}
                          {todo.tags.length > 2 && (
                            <span className="text-xs text-gray-500">+{todo.tags.length - 2}</span>
                          )}
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

      {error && (
        <div className="p-2 m-2 bg-red-100 border border-red-400 text-red-700 text-sm rounded">
          {error}
        </div>
      )}
    </div>
  );
};

export default TodoList;
