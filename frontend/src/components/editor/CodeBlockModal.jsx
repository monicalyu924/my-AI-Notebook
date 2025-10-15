import React, { useState } from 'react';
import { X, Code, Check } from 'lucide-react';

/**
 * 代码块插入模态框
 * 支持多种编程语言和语法高亮
 */
const CodeBlockModal = ({ onClose, onInsert }) => {
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');

  const languages = [
    { value: 'javascript', label: 'JavaScript' },
    { value: 'typescript', label: 'TypeScript' },
    { value: 'python', label: 'Python' },
    { value: 'java', label: 'Java' },
    { value: 'cpp', label: 'C++' },
    { value: 'csharp', label: 'C#' },
    { value: 'go', label: 'Go' },
    { value: 'rust', label: 'Rust' },
    { value: 'php', label: 'PHP' },
    { value: 'ruby', label: 'Ruby' },
    { value: 'swift', label: 'Swift' },
    { value: 'kotlin', label: 'Kotlin' },
    { value: 'sql', label: 'SQL' },
    { value: 'html', label: 'HTML' },
    { value: 'css', label: 'CSS' },
    { value: 'json', label: 'JSON' },
    { value: 'yaml', label: 'YAML' },
    { value: 'markdown', label: 'Markdown' },
    { value: 'bash', label: 'Bash' },
    { value: 'plaintext', label: 'Plain Text' },
  ];

  const handleInsert = () => {
    if (!code.trim()) {
      alert('请输入代码内容');
      return;
    }

    // 生成带样式的代码块 HTML
    const codeHTML = `
      <div class="code-block-wrapper" contenteditable="false" style="margin: 1em 0; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; background: #1f2937;">
        <div style="background: #374151; padding: 0.5em 1em; font-size: 12px; color: #9ca3af; display: flex; justify-content: space-between; align-items: center;">
          <span>${languages.find(l => l.value === language)?.label || language}</span>
          <button onclick="navigator.clipboard.writeText(this.parentElement.nextElementSibling.innerText)" style="background: #4b5563; color: white; border: none; padding: 4px 12px; border-radius: 4px; cursor: pointer; font-size: 11px;">复制</button>
        </div>
        <pre style="margin: 0; padding: 1em; overflow-x: auto; background: #1f2937; color: #e5e7eb;"><code class="language-${language}">${escapeHtml(code)}</code></pre>
      </div>
      <p><br></p>
    `.trim();

    onInsert(codeHTML);
    onClose();
  };

  const escapeHtml = (text) => {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* 头部 */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Code className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">插入代码块</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* 内容 */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* 语言选择 */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              编程语言
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {languages.map((lang) => (
                <option key={lang.value} value={lang.value}>
                  {lang.label}
                </option>
              ))}
            </select>
          </div>

          {/* 代码输入 */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              代码内容
            </label>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="在此粘贴或输入代码..."
              className="w-full h-96 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm resize-none"
              style={{
                fontFamily: '"Fira Code", "Consolas", "Monaco", "Courier New", monospace',
                tabSize: 2,
              }}
              spellCheck={false}
            />
          </div>

          {/* 预览 */}
          {code && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                预览
              </label>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-700 px-4 py-2 text-xs text-gray-300 flex justify-between items-center">
                  <span>{languages.find(l => l.value === language)?.label || language}</span>
                  <span className="text-gray-400">预览模式</span>
                </div>
                <pre className="p-4 bg-gray-900 text-gray-100 text-sm overflow-x-auto">
                  <code>{code}</code>
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* 底部操作 */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center bg-gray-50">
          <div className="text-sm text-gray-500">
            <span>Tip: 代码块插入后不可直接编辑，如需修改请重新插入</span>
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
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              插入代码块
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodeBlockModal;
