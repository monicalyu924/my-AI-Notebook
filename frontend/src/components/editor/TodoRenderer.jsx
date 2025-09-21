import React, { useState, useCallback } from 'react';
import { Check, Square, Calendar, User, AlertCircle, Clock } from 'lucide-react';

const TodoRenderer = ({ content, onContentChange, readOnly = false }) => {
  const [todos, setTodos] = useState([]);

  // 解析Markdown中的待办事项
  const parseTodos = useCallback((text) => {
    const todoRegex = /^(\s*)-\s*\[([x\s])\]\s*(.+)$/gm;
    const matches = [];
    let match;

    while ((match = todoRegex.exec(text)) !== null) {
      const [fullMatch, indent, checked, task] = match;
      const level = Math.floor(indent.length / 2); // 计算缩进级别
      
      // 解析任务的额外信息（优先级、截止日期、负责人等）
      const taskInfo = parseTaskInfo(task);
      
      matches.push({
        id: `todo-${match.index}`,
        fullMatch,
        startIndex: match.index,
        endIndex: match.index + fullMatch.length,
        checked: checked === 'x',
        task: taskInfo.task,
        priority: taskInfo.priority,
        dueDate: taskInfo.dueDate,
        assignee: taskInfo.assignee,
        level,
        indent
      });
    }
    
    return matches;
  }, []);

  // 解析任务的额外信息
  const parseTaskInfo = (taskText) => {
    let task = taskText;
    let priority = null;
    let dueDate = null;
    let assignee = null;

    // 提取优先级 !high, !medium, !low
    const priorityMatch = task.match(/!\s*(high|medium|low)/i);
    if (priorityMatch) {
      priority = priorityMatch[1].toLowerCase();
      task = task.replace(priorityMatch[0], '').trim();
    }

    // 提取截止日期 @2024-01-01 或 @今天 @明天
    const dueDateMatch = task.match(/@\s*(\d{4}-\d{2}-\d{2}|今天|明天|下周)/);
    if (dueDateMatch) {
      dueDate = dueDateMatch[1];
      task = task.replace(dueDateMatch[0], '').trim();
    }

    // 提取负责人 #张三
    const assigneeMatch = task.match(/#\s*([^\s]+)/);
    if (assigneeMatch) {
      assignee = assigneeMatch[1];
      task = task.replace(assigneeMatch[0], '').trim();
    }

    return { task, priority, dueDate, assignee };
  };

  // 切换待办事项状态
  const toggleTodo = useCallback((todoIndex) => {
    if (readOnly) return;

    const todoList = parseTodos(content);
    const todo = todoList[todoIndex];
    
    if (todo) {
      const newChecked = todo.checked ? ' ' : 'x';
      const newLine = `${todo.indent}- [${newChecked}] ${todo.task}`;
      
      // 重新构建任务文本，包含额外信息
      let fullTask = todo.task;
      if (todo.priority) fullTask += ` !${todo.priority}`;
      if (todo.dueDate) fullTask += ` @${todo.dueDate}`;
      if (todo.assignee) fullTask += ` #${todo.assignee}`;
      
      const newFullLine = `${todo.indent}- [${newChecked}] ${fullTask}`;
      
      const newContent = content.substring(0, todo.startIndex) + 
                        newFullLine + 
                        content.substring(todo.endIndex);
      
      onContentChange(newContent);
    }
  }, [content, onContentChange, readOnly, parseTodos]);

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
    if (diffDays === 0) return { status: 'today', text: '今天到期', color: 'text-orange-600' };
    if (diffDays === 1) return { status: 'tomorrow', text: '明天到期', color: 'text-yellow-600' };
    if (diffDays <= 7) return { status: 'week', text: `${diffDays}天后`, color: 'text-blue-600' };
    return { status: 'future', text: `${diffDays}天后`, color: 'text-gray-600' };
  };

  // 渲染带有待办事项的内容
  const renderContent = () => {
    if (!content) {
      return <div className="text-gray-500 italic">暂无内容</div>;
    }
    
    const todoList = parseTodos(content);
    
    if (todoList.length === 0) {
      return <div className="text-gray-500 italic">暂无待办事项</div>;
    }

    let lastIndex = 0;
    const elements = [];

    todoList.forEach((todo, index) => {
      // 添加待办事项前的内容
      if (todo.startIndex > lastIndex) {
        const beforeText = content.substring(lastIndex, todo.startIndex);
        if (beforeText.trim()) {
          elements.push(
            <div key={`before-${index}`} className="whitespace-pre-wrap">
              {beforeText}
            </div>
          );
        }
      }

      // 添加待办事项
      const dueDateStatus = getDueDateStatus(todo.dueDate);
      
      elements.push(
        <div
          key={todo.id}
          className={`flex items-start space-x-2 py-2 px-3 rounded-lg border transition-all duration-200 ${
            todo.checked 
              ? 'bg-gray-50 border-gray-200 opacity-75' 
              : 'bg-white border-gray-300 hover:border-blue-300 hover:shadow-sm'
          }`}
          style={{ marginLeft: `${todo.level * 20}px` }}
        >
          {/* 复选框 */}
          <button
            onClick={() => toggleTodo(index)}
            disabled={readOnly}
            className={`mt-0.5 transition-colors ${
              readOnly ? 'cursor-default' : 'cursor-pointer hover:text-blue-600'
            }`}
          >
            {todo.checked ? (
              <Check className="h-4 w-4 text-green-600" />
            ) : (
              <Square className="h-4 w-4 text-gray-400" />
            )}
          </button>

          {/* 任务内容 */}
          <div className="flex-1 min-w-0">
            <div className={`${todo.checked ? 'line-through text-gray-500' : 'text-gray-900'}`}>
              {todo.task}
            </div>
            
            {/* 任务元信息 */}
            {(todo.priority || todo.dueDate || todo.assignee) && (
              <div className="flex items-center space-x-2 mt-1">
                {/* 优先级 */}
                {todo.priority && (
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getPriorityColor(todo.priority)}`}>
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {todo.priority}
                  </span>
                )}
                
                {/* 截止日期 */}
                {todo.dueDate && (
                  <span className={`inline-flex items-center text-xs ${dueDateStatus?.color || 'text-gray-600'}`}>
                    <Calendar className="h-3 w-3 mr-1" />
                    {dueDateStatus?.text || todo.dueDate}
                  </span>
                )}
                
                {/* 负责人 */}
                {todo.assignee && (
                  <span className="inline-flex items-center text-xs text-purple-600">
                    <User className="h-3 w-3 mr-1" />
                    {todo.assignee}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      );

      lastIndex = todo.endIndex;
    });

    // 添加最后的内容
    if (lastIndex < content.length) {
      const afterText = content.substring(lastIndex);
      if (afterText.trim()) {
        elements.push(
          <div key="after" className="whitespace-pre-wrap">
            {afterText}
          </div>
        );
      }
    }

    return elements;
  };

  return (
    <div className="space-y-2">
      {renderContent()}
    </div>
  );
};

export default TodoRenderer;
