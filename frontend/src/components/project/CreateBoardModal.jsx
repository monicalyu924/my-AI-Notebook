import React, { useState } from 'react';
import { Button, Input } from '../atlassian-ui';

const COLOR_OPTIONS = [
  { value: '#3b82f6', name: '蓝色' },
  { value: '#ef4444', name: '红色' },
  { value: '#10b981', name: '绿色' },
  { value: '#f59e0b', name: '黄色' },
  { value: '#8b5cf6', name: '紫色' },
  { value: '#ec4899', name: '粉色' },
  { value: '#06b6d4', name: '青色' },
  { value: '#84cc16', name: '柠檬绿' }
];

function CreateBoardModal({ onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: COLOR_OPTIONS[0].value
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        color: formData.color
      });
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={handleOverlayClick}>
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* 模态框头部 */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">创建新看板</h2>
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
        <form onSubmit={handleSubmit} className="p-6">
          {/* 看板名称 */}
          <div className="mb-4">
            <label htmlFor="boardName" className="block text-sm font-medium text-gray-700 mb-2">
              看板名称 *
            </label>
            <Input
              type="text"
              id="boardName"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="输入看板名称"
              maxLength={100}
              required
            />
          </div>

          {/* 看板描述 */}
          <div className="mb-4">
            <label htmlFor="boardDescription" className="block text-sm font-medium text-gray-700 mb-2">
              看板描述
            </label>
            <Input
              as="textarea"
              id="boardDescription"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="输入看板描述（可选）"
              rows={3}
              maxLength={500}
              resize="none"
            />
          </div>

          {/* 看板颜色 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              选择颜色
            </label>
            <div className="grid grid-cols-4 gap-3">
              {COLOR_OPTIONS.map((color) => (
                <Button
                  key={color.value}
                  variant="subtle"
                  onClick={() => handleChange('color', color.value)}
                  className={`relative p-3 rounded-lg border-2 transition-all ${
                    formData.color === color.value 
                      ? 'border-gray-900 scale-105' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  title={color.name}
                >
                  <div 
                    className="w-full h-8 rounded"
                    style={{ backgroundColor: color.value }}
                  />
                  {formData.color === color.value && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <svg className="w-6 h-6 text-white drop-shadow-lg" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </Button>
              ))}
            </div>
          </div>

          {/* 模态框按钮 */}
          <div className="flex items-center justify-end gap-3">
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
              disabled={!formData.name.trim() || isSubmitting}
              appearance="primary"
              isLoading={isSubmitting}
            >
              {isSubmitting ? '创建中...' : '创建看板'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateBoardModal;