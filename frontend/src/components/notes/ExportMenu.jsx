import React, { useState } from 'react';
import {
  Download, FileText, File, Archive, Check
} from 'lucide-react';
import { exportAPI } from '../../utils/api';

/**
 * 笔记导出菜单组件
 * Phase 3.3 - 导入导出功能
 */
const ExportMenu = ({ noteId, noteIds = [], showBatchExport = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState('html');
  const [isExporting, setIsExporting] = useState(false);

  // 单个笔记导出
  const handleSingleExport = (format) => {
    if (format === 'pdf') {
      exportAPI.exportToPDF(noteId);
    } else if (format === 'html') {
      exportAPI.exportToHTML(noteId);
    }
    setIsOpen(false);
  };

  // 批量导出
  const handleBatchExport = async () => {
    if (!noteIds || noteIds.length === 0) {
      alert('请先选择要导出的笔记');
      return;
    }

    if (noteIds.length > 100) {
      alert('一次最多导出100个笔记');
      return;
    }

    setIsExporting(true);
    try {
      const response = await exportAPI.batchExport(noteIds, exportFormat);

      // 创建下载链接
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `notes_export_${new Date().getTime()}.zip`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setIsOpen(false);
    } catch (error) {
      console.error('Batch export failed:', error);
      alert('批量导出失败: ' + (error.response?.data?.detail || error.message));
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="relative">
      {/* 导出按钮 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-1.5 px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        title="导出笔记"
      >
        <Download className="h-4 w-4 text-gray-600" />
        <span className="text-gray-700">导出</span>
      </button>

      {/* 下拉菜单 */}
      {isOpen && (
        <>
          {/* 遮罩层 */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* 菜单内容 */}
          <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
            <div className="p-2">
              {/* 单个笔记导出 */}
              {noteId && !showBatchExport && (
                <div className="space-y-1">
                  <div className="px-3 py-1.5 text-xs font-medium text-gray-500 uppercase">
                    导出单个笔记
                  </div>
                  <button
                    onClick={() => handleSingleExport('html')}
                    className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                  >
                    <FileText className="h-4 w-4 text-blue-600" />
                    <span>导出为 HTML</span>
                  </button>
                  <button
                    onClick={() => handleSingleExport('pdf')}
                    className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                  >
                    <File className="h-4 w-4 text-red-600" />
                    <span>导出为 PDF</span>
                  </button>
                </div>
              )}

              {/* 批量导出 */}
              {showBatchExport && (
                <div className="space-y-2">
                  <div className="px-3 py-1.5 text-xs font-medium text-gray-500 uppercase">
                    批量导出 ({noteIds?.length || 0} 个笔记)
                  </div>

                  {/* 格式选择 */}
                  <div className="px-3 space-y-1">
                    <label className="text-xs text-gray-600">导出格式:</label>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setExportFormat('html')}
                        className={`flex-1 px-2 py-1.5 text-xs rounded-md transition-colors ${
                          exportFormat === 'html'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        HTML
                      </button>
                      <button
                        onClick={() => setExportFormat('pdf')}
                        className={`flex-1 px-2 py-1.5 text-xs rounded-md transition-colors ${
                          exportFormat === 'pdf'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        PDF
                      </button>
                    </div>
                  </div>

                  {/* 导出按钮 */}
                  <button
                    onClick={handleBatchExport}
                    disabled={isExporting || !noteIds || noteIds.length === 0}
                    className="w-full flex items-center justify-center space-x-2 px-3 py-2 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isExporting ? (
                      <>
                        <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                        <span>导出中...</span>
                      </>
                    ) : (
                      <>
                        <Archive className="h-4 w-4" />
                        <span>导出为 ZIP</span>
                      </>
                    )}
                  </button>

                  {noteIds && noteIds.length > 0 && (
                    <div className="px-3 py-2 bg-blue-50 rounded-md">
                      <p className="text-xs text-blue-700">
                        <Check className="inline h-3 w-3 mr-1" />
                        已选择 {noteIds.length} 个笔记
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* 帮助说明 */}
              <div className="mt-3 px-3 py-2 bg-gray-50 rounded-md border-t border-gray-200">
                <p className="text-xs text-gray-500">
                  💡 提示: 批量导出将生成ZIP压缩包，包含所有选中的笔记文件。
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ExportMenu;
