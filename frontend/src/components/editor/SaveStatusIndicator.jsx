import React from 'react';
import { Check, Loader2, AlertCircle, Cloud, CloudOff } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

const SaveStatusIndicator = ({
  isSaving,
  hasUnsavedChanges,
  lastSaved,
  saveError = null
}) => {
  // 根据状态显示不同的图标和文字
  const getStatusDisplay = () => {
    if (isSaving) {
      return {
        icon: <Loader2 className="w-4 h-4 animate-spin" />,
        text: '保存中...',
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200'
      };
    }

    if (saveError) {
      return {
        icon: <AlertCircle className="w-4 h-4" />,
        text: '保存失败',
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200'
      };
    }

    if (hasUnsavedChanges) {
      return {
        icon: <CloudOff className="w-4 h-4" />,
        text: '未保存',
        color: 'text-amber-600',
        bgColor: 'bg-amber-50',
        borderColor: 'border-amber-200'
      };
    }

    if (lastSaved) {
      const timeAgo = formatDistanceToNow(lastSaved, {
        addSuffix: true,
        locale: zhCN
      });
      return {
        icon: <Cloud className="w-4 h-4" />,
        text: `已保存 · ${timeAgo}`,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200'
      };
    }

    return {
      icon: <Check className="w-4 h-4" />,
      text: '已同步',
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200'
    };
  };

  const status = getStatusDisplay();

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${status.bgColor} ${status.borderColor} ${status.color} transition-all duration-200`}>
      {status.icon}
      <span className="text-xs font-medium">{status.text}</span>
    </div>
  );
};

export default React.memo(SaveStatusIndicator);
