import React, { useState } from 'react';
import { GitBranch, Clock, Save } from 'lucide-react';
import VersionHistory from './VersionHistory';
import { versionAPI } from '../../utils/versionApi';

const VersionHistoryButton = ({ noteId, onVersionRestore, disabled = false }) => {
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [isManualSaving, setIsManualSaving] = useState(false);

  const handleManualSave = async (e) => {
    e.stopPropagation();
    if (!noteId || isManualSaving) return;

    try {
      setIsManualSaving(true);
      const comment = prompt('请输入版本备注（可选）：');
      if (comment === null) return; // 用户取消

      await versionAPI.createManualVersion(noteId, comment);
      
      // 显示成功提示
      const button = e.target.closest('button');
      if (button) {
        const originalText = button.textContent;
        button.textContent = '已保存';
        button.classList.add('bg-green-600');
        setTimeout(() => {
          button.textContent = originalText;
          button.classList.remove('bg-green-600');
        }, 1500);
      }
    } catch (error) {
      console.error('Failed to create manual version:', error);
      alert('保存版本失败，请重试');
    } finally {
      setIsManualSaving(false);
    }
  };

  if (!noteId) return null;

  return (
    <>
      <div className="flex items-center space-x-1">
        {/* 版本历史按钮 */}
        <button
          onClick={() => setShowVersionHistory(true)}
          disabled={disabled}
          className={`flex items-center px-2 py-1 text-sm rounded-lg transition-colors ${
            disabled
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
          title="查看版本历史"
        >
          <GitBranch className="h-3 w-3 mr-1" />
          <span className="hidden sm:inline">历史</span>
        </button>

        {/* 手动保存按钮 */}
        <button
          onClick={handleManualSave}
          disabled={disabled || isManualSaving}
          className={`flex items-center px-2 py-1 text-sm rounded-lg transition-colors ${
            disabled || isManualSaving
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
          }`}
          title="手动创建版本"
        >
          {isManualSaving ? (
            <Clock className="h-3 w-3 mr-1 animate-spin" />
          ) : (
            <Save className="h-3 w-3 mr-1" />
          )}
          <span className="hidden sm:inline">
            {isManualSaving ? '保存中...' : '保存版本'}
          </span>
        </button>
      </div>

      {/* 版本历史对话框 */}
      <VersionHistory
        noteId={noteId}
        isOpen={showVersionHistory}
        onClose={() => setShowVersionHistory(false)}
        onVersionRestore={onVersionRestore}
      />
    </>
  );
};

export default VersionHistoryButton;