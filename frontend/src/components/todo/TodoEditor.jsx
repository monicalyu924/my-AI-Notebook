import React, { useState, useEffect } from 'react';
import {
  Calendar,
  AlertCircle,
  User,
  Tag,
  Clock,
  Edit3,
  Save,
  X,
  Trash2,
  CheckSquare,
  Square,
  Plus
} from 'lucide-react';
import { useTodos } from '../../context/TodoContext';

const TodoEditor = () => {
  const { 
    selectedTodo, 
    isCreating,
    loading, 
    updateTodo, 
    deleteTodo, 
    toggleTodo, 
    createTodo,
    setSelectedTodo,
    setIsCreating
  } = useTodos();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    due_date: '',
    category: 'work',
    assignee: '',
    tags: []
  });

  // 当选中的待办事项改变时，更新表单数据
  useEffect(() => {
    if (selectedTodo && !isCreating) {
      setFormData({
        title: selectedTodo.title || '',
        description: selectedTodo.description || '',
        priority: selectedTodo.priority || 'medium',
        due_date: selectedTodo.due_date || '',
        category: selectedTodo.category || 'work',
        assignee: selectedTodo.assignee || '',
        tags: selectedTodo.tags || []
      });
      setIsEditing(false);
    } else if (isCreating) {
      // 如果是创建模式，重置表单并进入编辑状态
      setFormData({
        title: '',
        description: '',
        priority: 'medium',
        due_date: '',
        category: 'work',
        assignee: '',
        tags: []
      });
      setIsEditing(true);
    }
  }, [selectedTodo, isCreating]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleTagsChange = (value) => {
    const tags = value.split(',').map(tag => tag.trim()).filter(tag => tag);
    setFormData(prev => ({ ...prev, tags }));
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      alert('请输入标题');
      return;
    }

    try {
      if (isCreating) {
        const result = await createTodo({
          ...formData,
          due_date: formData.due_date || null
        });
        if (result.success) {
          setIsCreating(false);
          setSelectedTodo(result.data);
        }
      } else {
        const result = await updateTodo(selectedTodo.id, {
          ...formData,
          due_date: formData.due_date || null
        });
        if (result.success) {
          setIsEditing(false);
        }
      }
    } catch (error) {
      console.error('Save failed:', error);
    }
  };

  const handleCancel = () => {
    if (isCreating) {
      setIsCreating(false);
      setSelectedTodo(null);
    } else {
      setIsEditing(false);
      // 重置表单数据
      if (selectedTodo) {
        setFormData({
          title: selectedTodo.title || '',
          description: selectedTodo.description || '',
          priority: selectedTodo.priority || 'medium',
          due_date: selectedTodo.due_date || '',
          category: selectedTodo.category || 'work',
          assignee: selectedTodo.assignee || '',
          tags: selectedTodo.tags || []
        });
      }
    }
  };

  const handleDelete = async () => {
    if (window.confirm('确定要删除这个待办事项吗？')) {
      const result = await deleteTodo(selectedTodo.id);
      if (result.success) {
        setSelectedTodo(null);
      }
    }
  };

  const handleToggle = async () => {
    await toggleTodo(selectedTodo.id);
  };

  const handleCreateNew = () => {
    setIsCreating(true);
    setIsEditing(true);
    setFormData({
      title: '',
      description: '',
      priority: 'medium',
      due_date: '',
      category: 'work',
      assignee: '',
      tags: []
    });
    setSelectedTodo(null);
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
    if (diffDays <= 7) return { status: 'week', text: `${diffDays}天后到期`, color: 'text-blue-600' };
    return { status: 'future', text: `${diffDays}天后到期`, color: 'text-gray-600' };
  };

  if (!selectedTodo && !isCreating) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <CheckSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">选择一个待办事项</h3>
          <p className="text-gray-500 mb-4">从左侧列表中选择待办事项查看详情</p>
          <button
            onClick={handleCreateNew}
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            创建新待办
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-white flex flex-col">
      {/* 头部 */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {!isCreating && selectedTodo && (
              <button
                onClick={handleToggle}
                className="transition-colors hover:text-blue-600"
                disabled={loading}
              >
                {selectedTodo.completed ? (
                  <CheckSquare className="h-5 w-5 text-green-600" />
                ) : (
                  <Square className="h-5 w-5 text-gray-400" />
                )}
              </button>
            )}
            <h1 className="text-xl font-semibold text-gray-900">
              {isCreating ? '创建新待办' : '待办详情'}
            </h1>
          </div>
          
          <div className="flex items-center space-x-2">
            {isEditing || isCreating ? (
              <>
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="flex items-center px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  <Save className="h-4 w-4 mr-1" />
                  保存
                </button>
                <button
                  onClick={handleCancel}
                  className="flex items-center px-3 py-1.5 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <X className="h-4 w-4 mr-1" />
                  取消
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center px-3 py-1.5 text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  <Edit3 className="h-4 w-4 mr-1" />
                  编辑
                </button>
                {selectedTodo && (
                  <button
                    onClick={handleDelete}
                    className="flex items-center px-3 py-1.5 text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    删除
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl space-y-6">
          {/* 标题 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              标题 *
            </label>
            {isEditing || isCreating ? (
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="输入待办事项标题..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            ) : (
              <h2 className={`text-lg font-medium ${
                selectedTodo?.completed ? 'line-through text-gray-500' : 'text-gray-900'
              }`}>
                {selectedTodo?.title || '无标题'}
              </h2>
            )}
          </div>

          {/* 描述 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              描述
            </label>
            {isEditing || isCreating ? (
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="输入详细描述..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            ) : (
              <div className="min-h-[100px] p-3 bg-gray-50 rounded-lg text-gray-700">
                {selectedTodo?.description || '暂无描述'}
              </div>
            )}
          </div>

          {/* 属性网格 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 优先级 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                优先级
              </label>
              {isEditing || isCreating ? (
                <select
                  value={formData.priority}
                  onChange={(e) => handleInputChange('priority', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="low">低</option>
                  <option value="medium">中</option>
                  <option value="high">高</option>
                </select>
              ) : (
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-sm font-medium ${
                  selectedTodo?.priority === 'high' ? 'bg-red-100 text-red-800' :
                  selectedTodo?.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {selectedTodo?.priority || 'medium'}
                </span>
              )}
            </div>

            {/* 分类 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                分类
              </label>
              {isEditing || isCreating ? (
                <select
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="work">工作</option>
                  <option value="personal">个人</option>
                  <option value="study">学习</option>
                </select>
              ) : (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
                  <Tag className="h-4 w-4 mr-1" />
                  {selectedTodo?.category === 'work' ? '工作' : 
                   selectedTodo?.category === 'personal' ? '个人' : '学习'}
                </span>
              )}
            </div>

            {/* 截止日期 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                截止日期
              </label>
              {isEditing || isCreating ? (
                <input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => handleInputChange('due_date', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              ) : (
                <div>
                  {selectedTodo?.due_date ? (
                    <span className={`inline-flex items-center text-sm ${
                      getDueDateStatus(selectedTodo.due_date)?.color || 'text-gray-600'
                    }`}>
                      <Calendar className="h-4 w-4 mr-1" />
                      {getDueDateStatus(selectedTodo.due_date)?.text || selectedTodo.due_date}
                    </span>
                  ) : (
                    <span className="text-gray-500 text-sm">未设置</span>
                  )}
                </div>
              )}
            </div>

            {/* 负责人 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                负责人
              </label>
              {isEditing || isCreating ? (
                <input
                  type="text"
                  value={formData.assignee}
                  onChange={(e) => handleInputChange('assignee', e.target.value)}
                  placeholder="输入负责人..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              ) : (
                <span className="inline-flex items-center text-sm text-purple-600">
                  <User className="h-4 w-4 mr-1" />
                  {selectedTodo?.assignee || '未分配'}
                </span>
              )}
            </div>
          </div>

          {/* 标签 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              标签
            </label>
            {isEditing || isCreating ? (
              <input
                type="text"
                value={formData.tags.join(', ')}
                onChange={(e) => handleTagsChange(e.target.value)}
                placeholder="输入标签，用逗号分隔..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            ) : (
              <div className="flex flex-wrap gap-2">
                {selectedTodo?.tags && selectedTodo.tags.length > 0 ? (
                  selectedTodo.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-1 rounded-full text-sm bg-gray-100 text-gray-800"
                    >
                      <Tag className="h-3 w-3 mr-1" />
                      {tag}
                    </span>
                  ))
                ) : (
                  <span className="text-gray-500 text-sm">无标签</span>
                )}
              </div>
            )}
          </div>

          {/* 创建和更新时间 */}
          {selectedTodo && !isCreating && (
            <div className="pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-500">
                <div>
                  <span className="inline-flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    创建时间: {new Date(selectedTodo.created_at).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="inline-flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    更新时间: {new Date(selectedTodo.updated_at).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TodoEditor;
