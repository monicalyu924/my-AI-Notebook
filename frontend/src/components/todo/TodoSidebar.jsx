import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { 
  CheckSquare, 
  Square, 
  Calendar, 
  User, 
  AlertCircle, 
  Filter,
  Plus,
  Search,
  Check,
  Clock,
  BarChart3
} from 'lucide-react';
import { useNotes } from '../../context/NotesContext';

const TodoSidebar = ({ isOpen, onToggle }) => {
  const { notes } = useNotes();
  const [filter, setFilter] = useState('all'); // all, pending, completed, overdue
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('priority'); // priority, dueDate, created

  // 解析任务的额外信息
  const parseTaskInfo = useCallback((taskText) => {
    let task = taskText;
    let priority = null;
    let dueDate = null;
    let assignee = null;

    // 提取优先级
    const priorityMatch = task.match(/!\s*(high|medium|low)/i);
    if (priorityMatch) {
      priority = priorityMatch[1].toLowerCase();
      task = task.replace(priorityMatch[0], '').trim();
    }

    // 提取截止日期
    const dueDateMatch = task.match(/@\s*(\d{4}-\d{2}-\d{2}|今天|明天|下周)/);
    if (dueDateMatch) {
      dueDate = dueDateMatch[1];
      task = task.replace(dueDateMatch[0], '').trim();
    }

    // 提取负责人
    const assigneeMatch = task.match(/#\s*([^\s]+)/);
    if (assigneeMatch) {
      assignee = assigneeMatch[1];
      task = task.replace(assigneeMatch[0], '').trim();
    }

    return { task, priority, dueDate, assignee };
  }, []);

  // 从所有笔记中提取待办事项
  const extractTodosFromNotes = useMemo(() => {
    const allTodos = [];
    
    if (!notes || notes.length === 0) return allTodos;
    
    notes.forEach(note => {
      if (!note.content) return;
      const todoRegex = /^(\s*)-\s*\[([x\s])\]\s*(.+)$/gm;
      let match;
      
      while ((match = todoRegex.exec(note.content)) !== null) {
        const [fullMatch, indent, checked, task] = match;
        const taskInfo = parseTaskInfo(task);
        
        allTodos.push({
          id: `${note.id}-${match.index}`,
          noteId: note.id,
          noteTitle: note.title,
          checked: checked === 'x',
          task: taskInfo.task,
          priority: taskInfo.priority,
          dueDate: taskInfo.dueDate,
          assignee: taskInfo.assignee,
          createdAt: note.created_at,
          fullMatch,
          startIndex: match.index
        });
      }
    });
    
    return allTodos;
  }, [notes, parseTaskInfo]);

  // 获取截止日期状态
  const getDueDateStatus = useCallback((dueDate) => {
    if (!dueDate) return null;
    
    const today = new Date();
    let targetDate;
    
    if (dueDate === '今天') {
      targetDate = today;
    } else if (dueDate === '明天') {
      targetDate = new Date(today);
      targetDate.setDate(today.getDate() + 1);
    } else if (dueDate === '下周') {
      targetDate = new Date(today);
      targetDate.setDate(today.getDate() + 7);
    } else {
      targetDate = new Date(dueDate);
    }
    
    const diffTime = targetDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return { status: 'overdue', text: '已逾期', color: 'text-red-600' };
    if (diffDays === 0) return { status: 'today', text: '今天', color: 'text-orange-600' };
    if (diffDays === 1) return { status: 'tomorrow', text: '明天', color: 'text-yellow-600' };
    if (diffDays <= 7) return { status: 'week', text: `${diffDays}天后`, color: 'text-blue-600' };
    return { status: 'future', text: `${diffDays}天后`, color: 'text-gray-600' };
  }, []);

  // 过滤和排序待办事项
  const filteredAndSortedTodos = useMemo(() => {
    let filtered = extractTodosFromNotes;

    // 搜索过滤
    if (searchTerm) {
      filtered = filtered.filter(todo => 
        todo.task.toLowerCase().includes(searchTerm.toLowerCase()) ||
        todo.noteTitle.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // 状态过滤
    switch (filter) {
      case 'pending':
        filtered = filtered.filter(todo => !todo.checked);
        break;
      case 'completed':
        filtered = filtered.filter(todo => todo.checked);
        break;
      case 'overdue':
        filtered = filtered.filter(todo => {
          if (todo.checked) return false;
          const status = getDueDateStatus(todo.dueDate);
          return status?.status === 'overdue';
        });
        break;
      default:
        break;
    }

    // 排序
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
        case 'dueDate':
          if (!a.dueDate && !b.dueDate) return 0;
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate) - new Date(b.dueDate);
        case 'created':
          return new Date(b.createdAt) - new Date(a.createdAt);
        default:
          return 0;
      }
    });

    return filtered;
  }, [extractTodosFromNotes, filter, searchTerm, sortBy, getDueDateStatus]);

  // 获取优先级颜色
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  // 统计信息
  const stats = useMemo(() => {
    const total = extractTodosFromNotes.length;
    const completed = extractTodosFromNotes.filter(todo => todo.checked).length;
    const pending = total - completed;
    const overdue = extractTodosFromNotes.filter(todo => {
      if (todo.checked) return false;
      const status = getDueDateStatus(todo.dueDate);
      return status?.status === 'overdue';
    }).length;
    
    return { total, completed, pending, overdue };
  }, [extractTodosFromNotes]);

  if (!isOpen) return null;

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <CheckSquare className="h-5 w-5 mr-2 text-blue-600" />
            待办事项
          </h2>
          <button
            onClick={onToggle}
            className="text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        </div>

        {/* 统计信息 */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="bg-blue-50 p-2 rounded-lg">
            <div className="text-xs text-blue-600 font-medium">总计</div>
            <div className="text-lg font-bold text-blue-900">{stats.total}</div>
          </div>
          <div className="bg-green-50 p-2 rounded-lg">
            <div className="text-xs text-green-600 font-medium">已完成</div>
            <div className="text-lg font-bold text-green-900">{stats.completed}</div>
          </div>
          <div className="bg-yellow-50 p-2 rounded-lg">
            <div className="text-xs text-yellow-600 font-medium">待完成</div>
            <div className="text-lg font-bold text-yellow-900">{stats.pending}</div>
          </div>
          <div className="bg-red-50 p-2 rounded-lg">
            <div className="text-xs text-red-600 font-medium">已逾期</div>
            <div className="text-lg font-bold text-red-900">{stats.overdue}</div>
          </div>
        </div>

        {/* 搜索 */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="搜索待办事项..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* 过滤器 */}
        <div className="flex space-x-1 mb-4">
          {[
            { key: 'all', label: '全部', icon: BarChart3 },
            { key: 'pending', label: '待完成', icon: Clock },
            { key: 'completed', label: '已完成', icon: Check },
            { key: 'overdue', label: '逾期', icon: AlertCircle }
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`flex-1 px-2 py-1 text-xs rounded-lg transition-colors ${
                filter === key
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Icon className="h-3 w-3 mx-auto mb-1" />
              {label}
            </button>
          ))}
        </div>

        {/* 排序 */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
        >
          <option value="priority">按优先级排序</option>
          <option value="dueDate">按截止日期排序</option>
          <option value="created">按创建时间排序</option>
        </select>
      </div>

      {/* 待办事项列表 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {filteredAndSortedTodos.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <CheckSquare className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>没有找到待办事项</p>
            <p className="text-sm mt-1">在笔记中使用 "- [ ] 任务" 格式创建待办事项</p>
          </div>
        ) : (
          filteredAndSortedTodos.map((todo) => {
            const dueDateStatus = getDueDateStatus(todo.dueDate);
            
            return (
              <div
                key={todo.id}
                className={`p-3 border rounded-lg transition-all duration-200 ${
                  todo.checked 
                    ? 'bg-gray-50 border-gray-200 opacity-75' 
                    : 'bg-white border-gray-300 hover:border-blue-300 hover:shadow-sm'
                }`}
              >
                {/* 任务头部 */}
                <div className="flex items-start space-x-2 mb-2">
                  <div className="mt-0.5">
                    {todo.checked ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Square className="h-4 w-4 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm ${todo.checked ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                      {todo.task}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      来自: {todo.noteTitle}
                    </div>
                  </div>
                </div>

                {/* 任务元信息 */}
                {(todo.priority || todo.dueDate || todo.assignee) && (
                  <div className="flex items-center space-x-2 text-xs">
                    {todo.priority && (
                      <span className={`flex items-center ${getPriorityColor(todo.priority)}`}>
                        <AlertCircle className="h-3 w-3 mr-1" />
                        {todo.priority}
                      </span>
                    )}
                    {todo.dueDate && (
                      <span className={`flex items-center ${dueDateStatus?.color || 'text-gray-600'}`}>
                        <Calendar className="h-3 w-3 mr-1" />
                        {dueDateStatus?.text || todo.dueDate}
                      </span>
                    )}
                    {todo.assignee && (
                      <span className="flex items-center text-purple-600">
                        <User className="h-3 w-3 mr-1" />
                        {todo.assignee}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default TodoSidebar;
