import React, { useState, useEffect } from 'react';
import {
  Clock,
  RotateCcw,
  Save,
  Trash2,
  GitBranch,
  Eye,
  MessageCircle,
  ChevronRight,
  ChevronDown,
  AlertCircle,
  CheckCircle,
  User,
  FileText,
  Edit3
} from 'lucide-react';
import { versionAPI } from '../../utils/versionApi';
import LoadingSpinner from '../common/LoadingSpinner';
import ErrorMessage from '../common/ErrorMessage';

const VersionHistory = ({ noteId, isOpen, onClose, onVersionRestore }) => {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expandedVersions, setExpandedVersions] = useState(new Set());
  const [showCompareDialog, setShowCompareDialog] = useState(false);
  const [compareVersion1, setCompareVersion1] = useState(null);
  const [compareVersion2, setCompareVersion2] = useState(null);
  const [comparisonData, setComparisonData] = useState(null);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [restoreVersion, setRestoreVersion] = useState(null);
  const [restoreComment, setRestoreComment] = useState('');

  useEffect(() => {
    if (isOpen && noteId) {
      loadVersions();
    }
  }, [isOpen, noteId]);

  const loadVersions = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await versionAPI.getNoteVersions(noteId);
      setVersions(response.data);
    } catch (error) {
      console.error('Failed to load versions:', error);
      setError('加载版本历史失败');
    } finally {
      setLoading(false);
    }
  };

  const handleManualSave = async () => {
    try {
      const comment = prompt('请输入版本备注（可选）：');
      if (comment === null) return; // 用户取消

      const response = await versionAPI.createManualVersion(noteId, comment);
      setVersions(prev => [response.data, ...prev]);
    } catch (error) {
      console.error('Failed to create manual version:', error);
      setError('创建版本失败');
    }
  };

  const handleDeleteVersion = async (versionId) => {
    if (!window.confirm('确定要删除这个版本吗？此操作不可撤销。')) {
      return;
    }

    try {
      await versionAPI.deleteVersion(versionId);
      setVersions(prev => prev.filter(v => v.id !== versionId));
    } catch (error) {
      console.error('Failed to delete version:', error);
      setError('删除版本失败');
    }
  };

  const handleRestoreVersion = async () => {
    if (!restoreVersion) return;

    try {
      await versionAPI.restoreVersion(restoreVersion.id, restoreComment);
      setShowRestoreDialog(false);
      setRestoreVersion(null);
      setRestoreComment('');
      onVersionRestore && onVersionRestore();
      loadVersions(); // 重新加载版本列表
    } catch (error) {
      console.error('Failed to restore version:', error);
      setError('恢复版本失败');
    }
  };

  const handleCompareVersions = async () => {
    if (!compareVersion1 || !compareVersion2) return;

    try {
      const response = await versionAPI.compareVersions(
        noteId,
        compareVersion1.id,
        compareVersion2.id
      );
      setComparisonData(response.data);
    } catch (error) {
      console.error('Failed to compare versions:', error);
      setError('比较版本失败');
    }
  };

  const toggleVersionExpanded = (versionId) => {
    setExpandedVersions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(versionId)) {
        newSet.delete(versionId);
      } else {
        newSet.add(versionId);
      }
      return newSet;
    });
  };

  const getVersionIcon = (versionType) => {
    switch (versionType) {
      case 'manual_save':
        return <Save className="h-4 w-4 text-blue-600" />;
      case 'restore':
        return <RotateCcw className="h-4 w-4 text-green-600" />;
      case 'auto_save':
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getVersionTypeLabel = (versionType) => {
    switch (versionType) {
      case 'manual_save':
        return '手动保存';
      case 'restore':
        return '版本恢复';
      case 'auto_save':
      default:
        return '自动保存';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return '今天 ' + date.toLocaleTimeString('zh-CN', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else if (diffDays === 1) {
      return '昨天 ' + date.toLocaleTimeString('zh-CN', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else if (diffDays < 7) {
      return `${diffDays}天前`;
    } else {
      return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] mx-4 flex flex-col">
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <GitBranch className="h-5 w-5 text-blue-600" />
            <h2 className="text-xl font-semibold">版本历史</h2>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleManualSave}
              className="flex items-center px-3 py-1 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100"
            >
              <Save className="h-3 w-3 mr-1" />
              手动保存
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>
        </div>

        {/* 内容区域 */}
        <div className="flex-1 flex overflow-hidden">
          {/* 版本列表 */}
          <div className="w-1/2 border-r border-gray-200 overflow-y-auto">
            <div className="p-4">
              {error && (
                <ErrorMessage 
                  message={error} 
                  onClose={() => setError('')}
                  className="mb-4"
                />
              )}

              {loading ? (
                <div className="flex justify-center py-8">
                  <LoadingSpinner size="md" />
                </div>
              ) : (
                <div className="space-y-2">
                  {versions.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Clock className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                      <p>暂无版本历史</p>
                    </div>
                  ) : (
                    versions.map((version, index) => {
                      const isExpanded = expandedVersions.has(version.id);
                      const canDelete = version.version_type === 'manual_save';
                      
                      return (
                        <div
                          key={version.id}
                          className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50"
                        >
                          {/* 版本头部信息 */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3 flex-1">
                              <div className="flex items-center space-x-2">
                                {getVersionIcon(version.version_type)}
                                <span className="text-sm font-medium">
                                  {getVersionTypeLabel(version.version_type)}
                                </span>
                                {index === 0 && (
                                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                                    最新
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-1">
                              <button
                                onClick={() => toggleVersionExpanded(version.id)}
                                className="p-1 text-gray-400 hover:text-gray-600"
                                title="查看详情"
                              >
                                {isExpanded ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronRight className="h-4 w-4" />
                                )}
                              </button>
                            </div>
                          </div>

                          {/* 时间和备注 */}
                          <div className="mt-2 text-xs text-gray-500">
                            {formatDate(version.created_at)}
                          </div>
                          
                          {version.comment && (
                            <div className="mt-1 text-sm text-gray-700 flex items-start">
                              <MessageCircle className="h-3 w-3 mr-1 mt-0.5 text-gray-400" />
                              <span className="flex-1">{version.comment}</span>
                            </div>
                          )}

                          {/* 展开的详细信息 */}
                          {isExpanded && (
                            <div className="mt-3 pt-3 border-t border-gray-100">
                              <div className="grid grid-cols-2 gap-4 text-xs text-gray-600 mb-3">
                                <div>
                                  <span className="font-medium">标题长度：</span>
                                  {version.title.length} 字符
                                </div>
                                <div>
                                  <span className="font-medium">内容长度：</span>
                                  {version.content.length} 字符
                                </div>
                                <div>
                                  <span className="font-medium">标签数量：</span>
                                  {version.tags.length} 个
                                </div>
                                <div>
                                  <span className="font-medium">版本ID：</span>
                                  {version.id.slice(-8)}
                                </div>
                              </div>

                              {/* 操作按钮 */}
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => {
                                    setRestoreVersion(version);
                                    setShowRestoreDialog(true);
                                  }}
                                  className="flex items-center px-2 py-1 text-xs bg-green-50 text-green-700 rounded hover:bg-green-100"
                                  disabled={index === 0}
                                >
                                  <RotateCcw className="h-3 w-3 mr-1" />
                                  恢复
                                </button>
                                
                                <button
                                  onClick={() => {
                                    if (!compareVersion1) {
                                      setCompareVersion1(version);
                                    } else if (!compareVersion2 && version.id !== compareVersion1.id) {
                                      setCompareVersion2(version);
                                      setShowCompareDialog(true);
                                    }
                                  }}
                                  className="flex items-center px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded hover:bg-blue-100"
                                >
                                  <Eye className="h-3 w-3 mr-1" />
                                  比较
                                </button>
                                
                                {canDelete && (
                                  <button
                                    onClick={() => handleDeleteVersion(version.id)}
                                    className="flex items-center px-2 py-1 text-xs bg-red-50 text-red-700 rounded hover:bg-red-100"
                                  >
                                    <Trash2 className="h-3 w-3 mr-1" />
                                    删除
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 预览区域 */}
          <div className="w-1/2 overflow-y-auto">
            <div className="p-4">
              {comparisonData ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">版本比较</h3>
                    <button
                      onClick={() => {
                        setComparisonData(null);
                        setCompareVersion1(null);
                        setCompareVersion2(null);
                      }}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      ×
                    </button>
                  </div>
                  
                  {/* 比较结果 */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <h4 className="font-medium text-red-800 mb-2">版本 1</h4>
                      <div className="text-sm text-red-700 space-y-1">
                        <div><strong>时间：</strong>{formatDate(comparisonData.version1.created_at)}</div>
                        <div><strong>标题：</strong>{comparisonData.version1.title}</div>
                        <div><strong>内容长度：</strong>{comparisonData.version1.content.length} 字符</div>
                      </div>
                    </div>
                    
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <h4 className="font-medium text-green-800 mb-2">版本 2</h4>
                      <div className="text-sm text-green-700 space-y-1">
                        <div><strong>时间：</strong>{formatDate(comparisonData.version2.created_at)}</div>
                        <div><strong>标题：</strong>{comparisonData.version2.title}</div>
                        <div><strong>内容长度：</strong>{comparisonData.version2.content.length} 字符</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* 差异摘要 */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <h4 className="font-medium text-blue-800 mb-2">变更摘要</h4>
                    <div className="text-sm text-blue-700 space-y-1">
                      <div className="flex items-center">
                        {comparisonData.differences.title_changed ? (
                          <AlertCircle className="h-4 w-4 mr-2 text-yellow-500" />
                        ) : (
                          <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                        )}
                        标题{comparisonData.differences.title_changed ? '已修改' : '无变化'}
                      </div>
                      <div className="flex items-center">
                        {comparisonData.differences.content_changed ? (
                          <AlertCircle className="h-4 w-4 mr-2 text-yellow-500" />
                        ) : (
                          <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                        )}
                        内容{comparisonData.differences.content_changed ? '已修改' : '无变化'}
                      </div>
                      <div className="flex items-center">
                        {comparisonData.differences.tags_changed ? (
                          <AlertCircle className="h-4 w-4 mr-2 text-yellow-500" />
                        ) : (
                          <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                        )}
                        标签{comparisonData.differences.tags_changed ? '已修改' : '无变化'}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Eye className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p>选择版本查看详情或进行比较</p>
                  <p className="text-sm mt-1">点击版本项右侧的箭头查看详细信息</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 恢复确认对话框 */}
        {showRestoreDialog && restoreVersion && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-semibold mb-4">确认恢复版本</h3>
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mr-2 mt-0.5" />
                  <div className="text-sm text-yellow-800">
                    <p className="font-medium mb-1">恢复操作说明：</p>
                    <ul className="space-y-1 text-xs">
                      <li>• 当前内容将被替换为选定版本的内容</li>
                      <li>• 系统会自动保存当前状态作为恢复前快照</li>
                      <li>• 此操作可以通过版本历史再次恢复</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  恢复备注（可选）
                </label>
                <input
                  type="text"
                  value={restoreComment}
                  onChange={(e) => setRestoreComment(e.target.value)}
                  placeholder="添加恢复原因或备注"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowRestoreDialog(false);
                    setRestoreVersion(null);
                    setRestoreComment('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  onClick={handleRestoreVersion}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  确认恢复
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VersionHistory;