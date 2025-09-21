import React, { useState } from 'react';
import {
  Folder,
  FolderOpen,
  BookOpen,
  Briefcase,
  Heart,
  Star,
  Archive,
  Home,
  Settings,
  User,
  Coffee,
  Music,
  Camera,
  Palette,
  Code,
  FileText,
  Search,
  CheckCircle
} from 'lucide-react';

// 可用图标
const FOLDER_ICONS = [
  { name: 'folder', icon: Folder, label: '默认' },
  { name: 'folder-open', icon: FolderOpen, label: '打开' },
  { name: 'book-open', icon: BookOpen, label: '书籍' },
  { name: 'briefcase', icon: Briefcase, label: '工作' },
  { name: 'heart', icon: Heart, label: '收藏' },
  { name: 'star', icon: Star, label: '重要' },
  { name: 'archive', icon: Archive, label: '归档' },
  { name: 'home', icon: Home, label: '个人' },
  { name: 'settings', icon: Settings, label: '设置' },
  { name: 'user', icon: User, label: '用户' },
  { name: 'coffee', icon: Coffee, label: '生活' },
  { name: 'music', icon: Music, label: '娱乐' },
  { name: 'camera', icon: Camera, label: '媒体' },
  { name: 'palette', icon: Palette, label: '创意' },
  { name: 'code', icon: Code, label: '开发' },
  { name: 'file-text', icon: FileText, label: '文档' }
];

// 可用颜色
const FOLDER_COLORS = [
  { name: 'default', color: 'text-gray-600', bg: 'bg-gray-100', label: '默认' },
  { name: 'blue', color: 'text-blue-600', bg: 'bg-blue-100', label: '蓝色' },
  { name: 'green', color: 'text-green-600', bg: 'bg-green-100', label: '绿色' },
  { name: 'red', color: 'text-red-600', bg: 'bg-red-100', label: '红色' },
  { name: 'yellow', color: 'text-yellow-600', bg: 'bg-yellow-100', label: '黄色' },
  { name: 'purple', color: 'text-purple-600', bg: 'bg-purple-100', label: '紫色' },
  { name: 'pink', color: 'text-pink-600', bg: 'bg-pink-100', label: '粉色' },
  { name: 'indigo', color: 'text-indigo-600', bg: 'bg-indigo-100', label: '靛蓝' },
  { name: 'orange', color: 'text-orange-600', bg: 'bg-orange-100', label: '橙色' },
  { name: 'teal', color: 'text-teal-600', bg: 'bg-teal-100', label: '青色' }
];

const FolderCustomization = ({ 
  folder, 
  isOpen, 
  onClose, 
  onSave 
}) => {
  const [selectedIcon, setSelectedIcon] = useState(folder?.icon || 'folder');
  const [selectedColor, setSelectedColor] = useState(folder?.color || 'default');
  const [folderName, setFolderName] = useState(folder?.name || '');

  const handleSave = () => {
    onSave({
      ...folder,
      name: folderName,
      icon: selectedIcon,
      color: selectedColor
    });
    onClose();
  };

  if (!isOpen) return null;

  const selectedIconData = FOLDER_ICONS.find(icon => icon.name === selectedIcon);
  const selectedColorData = FOLDER_COLORS.find(color => color.name === selectedColor);
  const IconComponent = selectedIconData?.icon || Folder;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">自定义文件夹</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>

          {/* 预览 */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center">
              <div className={`p-2 rounded-lg ${selectedColorData?.bg}`}>
                <IconComponent className={`h-6 w-6 ${selectedColorData?.color}`} />
              </div>
              <span className="ml-3 font-medium">{folderName || '文件夹名称'}</span>
            </div>
          </div>

          {/* 文件夹名称 */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              文件夹名称
            </label>
            <input
              type="text"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="输入文件夹名称"
            />
          </div>

          {/* 图标选择 */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              选择图标
            </label>
            <div className="grid grid-cols-8 gap-2">
              {FOLDER_ICONS.map((iconData) => {
                const Icon = iconData.icon;
                return (
                  <button
                    key={iconData.name}
                    onClick={() => setSelectedIcon(iconData.name)}
                    className={`p-2 rounded-lg border-2 transition-all ${
                      selectedIcon === iconData.name
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    title={iconData.label}
                  >
                    <Icon className={`h-5 w-5 ${selectedColorData?.color}`} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* 颜色选择 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              选择颜色
            </label>
            <div className="grid grid-cols-5 gap-2">
              {FOLDER_COLORS.map((colorData) => (
                <button
                  key={colorData.name}
                  onClick={() => setSelectedColor(colorData.name)}
                  className={`p-3 rounded-lg border-2 transition-all ${colorData.bg} ${
                    selectedColor === colorData.name
                      ? 'border-gray-800 ring-2 ring-gray-300'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  title={colorData.label}
                >
                  <Folder className={`h-5 w-5 ${colorData.color} mx-auto`} />
                </button>
              ))}
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              取消
            </button>
            <button
              onClick={handleSave}
              disabled={!folderName.trim()}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              保存
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FolderCustomization;

// 导出图标和颜色数据供其他组件使用
export { FOLDER_ICONS, FOLDER_COLORS };