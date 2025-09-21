import React, { useState, useEffect } from 'react';
import { Button, Input } from '../atlassian-ui';
import { useProjects } from '../../context/ProjectContext';
import { PRIORITY_OPTIONS, getPriorityInfo } from '../../utils/projectApi';

function CardDetailModal({ card, onClose }) {
  const { updateCard, deleteCard } = useProjects();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    due_date: '',
    assignee: '',
    tags: '',
    completed: false
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (card) {
      setFormData({
        title: card.title,
        description: card.description || '',
        priority: card.priority,
        due_date: card.due_date ? card.due_date.split('T')[0] : '',
        assignee: card.assignee || '',
        tags: card.tags.join(', '),
        completed: card.completed
      });
    }
  }, [card]);

  const handleSave = async () => {
    if (!formData.title.trim()) {
      return;
    }

    setIsSaving(true);
    try {
      const updateData = {
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        priority: formData.priority,
        due_date: formData.due_date || null,
        assignee: formData.assignee.trim() || null,
        tags: formData.tags 
          ? formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
          : [],
        completed: formData.completed
      };

      await updateCard(card.id, updateData);
      setIsEditing(false);
    } catch (error) {
      // Error handling is done in context
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset form data
    setFormData({
      title: card.title,
      description: card.description || '',
      priority: card.priority,
      due_date: card.due_date ? card.due_date.split('T')[0] : '',
      assignee: card.assignee || '',
      tags: card.tags.join(', '),
      completed: card.completed
    });
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (confirm(`确定要删除卡片 "${card.title}" 吗？`)) {
      setIsDeleting(true);
      try {
        await deleteCard(card.id);
        onClose();
      } catch (error) {
        // Error handling is done in context
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const toggleCompleted = async () => {
    const newCompletedState = !card.completed;
    try {
      await updateCard(card.id, { completed: newCompletedState });
    } catch (error) {
      // Error handling is done in context
    }
  };

  const priorityInfo = getPriorityInfo(card.priority);
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={handleOverlayClick}>
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* 模态框头部 */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold text-gray-900">卡片详情</h2>
            {card.completed && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                ✓ 已完成
              </span>
            )}
          </div>
          <Button
            onClick={onClose}
            variant="subtle"
            iconOnly={true}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </Button>
        </div>

        {/* 模态框内容 */}
        <div className="p-6">
          {isEditing ? (
            /* 编辑模式 */
            <div className="space-y-4">
              {/* 标题 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  标题 *
                </label>
                <Input
                  value={formData.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  placeholder="输入卡片标题"
                  maxLength={100}
                  required
                />
              </div>

              {/* 描述 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  描述
                </label>
                <Input
                  as="textarea"
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="输入卡片描述"
                  rows={4}
                  maxLength={500}
                  resize="none"
                />
              </div>

              {/* 优先级和截止日期 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    优先级
                  </label>
                  <Input
                    as="select"
                    value={formData.priority}
                    onChange={(e) => handleChange('priority', e.target.value)}
                  >
                    {PRIORITY_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Input>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    截止日期
                  </label>
                  <Input
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => handleChange('due_date', e.target.value)}
                    min={today}
                  />
                </div>
              </div>

              {/* 指派人 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  指派给
                </label>
                <Input
                  type="text"
                  value={formData.assignee}
                  onChange={(e) => handleChange('assignee', e.target.value)}
                  placeholder="输入负责人姓名"
                  maxLength={50}
                />
              </div>

              {/* 标签 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  标签
                </label>
                <Input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => handleChange('tags', e.target.value)}
                  placeholder="用逗号分隔多个标签"
                />
              </div>

              {/* 完成状态 */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="completed"
                  checked={formData.completed}
                  onChange={(e) => handleChange('completed', e.target.checked)}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="completed" className="text-sm text-gray-700">
                  标记为已完成
                </label>
              </div>

              {/* 编辑模式按钮 */}
              <div className="flex items-center justify-between pt-4 border-t">
                <Button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  variant="subtle"
                  appearance="danger"
                  isLoading={isDeleting}
                >
                  {isDeleting ? '删除中...' : '删除卡片'}
                </Button>
                
                <div className="flex items-center gap-3">
                  <Button
                    onClick={handleCancel}
                    variant="subtle"
                    disabled={isSaving}
                  >
                    取消
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={!formData.title.trim() || isSaving}
                    appearance="primary"
                    isLoading={isSaving}
                  >
                    {isSaving ? '保存中...' : '保存'}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            /* 查看模式 */
            <div className="space-y-6">
              {/* 标题和操作按钮 */}
              <div className="flex items-start justify-between">
                <h3 className="text-2xl font-semibold text-gray-900 flex-1">{card.title}</h3>
                <div className="flex items-center gap-2 ml-4">
                  <Button
                    onClick={toggleCompleted}
                    variant="subtle"
                    appearance={card.completed ? "success" : "default"}
                    size="compact"
                  >
                    {card.completed ? '标记未完成' : '标记完成'}
                  </Button>
                  <Button
                    onClick={() => setIsEditing(true)}
                    appearance="primary"
                    variant="subtle"
                    size="compact"
                  >
                    编辑
                  </Button>
                </div>
              </div>

              {/* 描述 */}
              {card.description && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">描述</h4>
                  <p className="text-gray-700 whitespace-pre-wrap">{card.description}</p>
                </div>
              )}

              {/* 卡片属性 */}
              <div className="grid grid-cols-2 gap-6">
                {/* 优先级 */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">优先级</h4>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: priorityInfo.color }}
                    />
                    <span className="text-gray-700">{priorityInfo.label}</span>
                  </div>
                </div>

                {/* 截止日期 */}
                {card.due_date && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">截止日期</h4>
                    <p className="text-gray-700">
                      {new Date(card.due_date).toLocaleDateString('zh-CN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                )}
              </div>

              {/* 指派人 */}
              {card.assignee && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">指派给</h4>
                  <p className="text-gray-700">{card.assignee}</p>
                </div>
              )}

              {/* 标签 */}
              {card.tags.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">标签</h4>
                  <div className="flex flex-wrap gap-2">
                    {card.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* 时间信息 */}
              <div className="pt-4 border-t text-sm text-gray-500">
                <p>创建时间：{new Date(card.created_at).toLocaleString('zh-CN')}</p>
                <p>更新时间：{new Date(card.updated_at).toLocaleString('zh-CN')}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CardDetailModal;