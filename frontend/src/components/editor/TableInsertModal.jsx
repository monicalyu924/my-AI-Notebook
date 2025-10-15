import React, { useState } from 'react';
import { X, Table, Check, Plus, Minus } from 'lucide-react';

/**
 * 表格插入模态框
 * 快速创建和插入简单表格
 */
const TableInsertModal = ({ onClose, onInsert }) => {
  const [rows, setRows] = useState(3);
  const [cols, setCols] = useState(3);
  const [hasHeader, setHasHeader] = useState(true);

  const handleInsert = () => {
    if (rows < 1 || cols < 1) {
      alert('行数和列数必须至少为1');
      return;
    }

    if (rows > 20 || cols > 10) {
      alert('表格最大为 20行 x 10列');
      return;
    }

    // 生成表格 HTML
    let tableHTML = '<table style="width: 100%; border-collapse: collapse; margin: 1em 0;">';

    // 表头
    if (hasHeader) {
      tableHTML += '<thead>';
      tableHTML += '<tr style="background-color: #f3f4f6;">';
      for (let i = 0; i < cols; i++) {
        tableHTML += `<th style="border: 1px solid #d1d5db; padding: 12px; text-align: left; font-weight: 600; background-color: #e5e7eb;">列 ${i + 1}</th>`;
      }
      tableHTML += '</tr>';
      tableHTML += '</thead>';
    }

    // 表体
    tableHTML += '<tbody>';
    const startRow = hasHeader ? 1 : 0;
    for (let i = startRow; i < rows; i++) {
      tableHTML += '<tr>';
      for (let j = 0; j < cols; j++) {
        tableHTML += '<td style="border: 1px solid #d1d5db; padding: 12px;">单元格</td>';
      }
      tableHTML += '</tr>';
    }
    tableHTML += '</tbody>';
    tableHTML += '</table>';
    tableHTML += '<p><br></p>'; // 在表格后添加空行

    onInsert(tableHTML);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-lg overflow-hidden flex flex-col">
        {/* 头部 */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Table className="w-5 h-5 text-green-600" />
            <h2 className="text-lg font-semibold text-gray-900">插入表格</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* 内容 */}
        <div className="p-6">
          {/* 表格尺寸 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              表格尺寸
            </label>

            {/* 行数 */}
            <div className="mb-4 flex items-center gap-4">
              <span className="text-sm text-gray-600 w-12">行数:</span>
              <button
                onClick={() => setRows(Math.max(1, rows - 1))}
                className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <Minus className="w-4 h-4" />
              </button>
              <input
                type="number"
                value={rows}
                onChange={(e) => setRows(Math.max(1, Math.min(20, parseInt(e.target.value) || 1)))}
                className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-green-500"
                min="1"
                max="20"
              />
              <button
                onClick={() => setRows(Math.min(20, rows + 1))}
                className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
              <span className="text-xs text-gray-500">(最多20行)</span>
            </div>

            {/* 列数 */}
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600 w-12">列数:</span>
              <button
                onClick={() => setCols(Math.max(1, cols - 1))}
                className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <Minus className="w-4 h-4" />
              </button>
              <input
                type="number"
                value={cols}
                onChange={(e) => setCols(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
                className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-green-500"
                min="1"
                max="10"
              />
              <button
                onClick={() => setCols(Math.min(10, cols + 1))}
                className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
              <span className="text-xs text-gray-500">(最多10列)</span>
            </div>
          </div>

          {/* 表头选项 */}
          <div className="mb-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={hasHeader}
                onChange={(e) => setHasHeader(e.target.checked)}
                className="w-4 h-4 text-green-600 rounded border-gray-300 focus:ring-green-500"
              />
              <span className="text-sm text-gray-700">包含表头行</span>
            </label>
          </div>

          {/* 预览 */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              预览
            </label>
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 overflow-x-auto">
              <table className="w-full border-collapse text-xs">
                {hasHeader && (
                  <thead>
                    <tr className="bg-gray-200">
                      {Array.from({ length: cols }).map((_, i) => (
                        <th key={i} className="border border-gray-300 px-2 py-1 font-semibold">
                          列 {i + 1}
                        </th>
                      ))}
                    </tr>
                  </thead>
                )}
                <tbody>
                  {Array.from({ length: hasHeader ? rows - 1 : rows }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: cols }).map((_, j) => (
                        <td key={j} className="border border-gray-300 px-2 py-1 bg-white">
                          单元格
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* 底部操作 */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center bg-gray-50">
          <div className="text-sm text-gray-500">
            <span>将插入 {rows} x {cols} 的表格</span>
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleInsert}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              插入表格
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TableInsertModal;
