import React, { useState } from 'react';
import { Button, Input } from '../atlassian-ui';
import { PRIORITY_OPTIONS } from '../../utils/projectApi';

function CreateCardModal({ onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    due_date: '',
    assignee: '',
    tags: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const submitData = {
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        priority: formData.priority,
        due_date: formData.due_date || null,
        assignee: formData.assignee.trim() || null,
        tags: formData.tags 
          ? formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
          : []
      };

      await onSubmit(submitData);
    } catch (error) {
      // Error handling is done in parent
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // 获取今天的日期（用于设置最小日期）
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={handleOverlayClick}>
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* 模态框头部 */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">创建新卡片</h2>
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* 卡片标题 */}
          <div>
            <label htmlFor="cardTitle" className="block text-sm font-medium text-gray-700 mb-2">
              卡片标题 *
            </label>
            <Input
              type="text"
              id="cardTitle"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="输入卡片标题"
              maxLength={100}
              required
              autoFocus
            />
          </div>

          {/* 卡片描述 */}
          <div>
            <label htmlFor="cardDescription" className="block text-sm font-medium text-gray-700 mb-2">
              描述
            </label>
            <Input
              as="textarea"
              id="cardDescription"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="输入卡片描述（可选）"
              rows={3}
              maxLength={500}
              resize="none"
            />
          </div>

          {/* 优先级和截止日期 */}
          <div className="grid grid-cols-2 gap-4">
            {/* 优先级 */}
            <div>
              <label htmlFor="cardPriority" className="block text-sm font-medium text-gray-700 mb-2">
                优先级
              </label>
              <Input
                as="select"
                id="cardPriority"
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

            {/* 截止日期 */}
            <div>
              <label htmlFor="cardDueDate" className="block text-sm font-medium text-gray-700 mb-2">
                截止日期
              </label>
              <Input
                type="date"
                id="cardDueDate"
                value={formData.due_date}
                onChange={(e) => handleChange('due_date', e.target.value)}
                min={today}
              />
            </div>
          </div>

          {/* 指派人 */}
          <div>
            <label htmlFor="cardAssignee" className="block text-sm font-medium text-gray-700 mb-2">
              指派给
            </label>
            <Input
              type="text"
              id="cardAssignee"
              value={formData.assignee}
              onChange={(e) => handleChange('assignee', e.target.value)}
              placeholder="输入负责人姓名（可选）"
              maxLength={50}
            />
          </div>

          {/* 标签 */}
          <div>
            <label htmlFor="cardTags" className="block text-sm font-medium text-gray-700 mb-2">
              标签
            </label>
            <Input
              type="text"
              id="cardTags"
              value={formData.tags}
              onChange={(e) => handleChange('tags', e.target.value)}
              placeholder="输入标签，用逗号分隔（例如：前端,React,紧急）"
            />
            <p className="text-xs text-gray-500 mt-1">用逗号分隔多个标签</p>
          </div>

          {/* 模态框按钮 */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              onClick={onClose}
              variant="subtle"
              disabled={isSubmitting}
            >
              取消
            </Button>
            <Button
              type="submit"
              disabled={!formData.title.trim() || isSubmitting}
              appearance="primary"
              isLoading={isSubmitting}
            >
              {isSubmitting ? '创建中...' : '创建卡片'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateCardModal;