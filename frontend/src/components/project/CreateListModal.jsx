import React, { useState } from 'react';
import { Button, Input } from '../atlassian-ui';

function CreateListModal({ onClose, onSubmit }) {
  const [title, setTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!title.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        title: title.trim()
      });
    } catch (error) {
      // Error handling is done in parent
    } finally {
      setIsSubmitting(false);
    }
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
          <h2 className="text-xl font-semibold text-gray-900">创建新列表</h2>
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
          <div className="mb-6">
            <label htmlFor="listTitle" className="block text-sm font-medium text-gray-700 mb-2">
              列表标题 *
            </label>
            <Input
              type="text"
              id="listTitle"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例如：待办事项、进行中、已完成"
              maxLength={50}
              required
              autoFocus
            />
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
              disabled={!title.trim() || isSubmitting}
              appearance="primary"
              isLoading={isSubmitting}
            >
              {isSubmitting ? '创建中...' : '创建列表'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateListModal;