import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';
import TodoRenderer from './TodoRenderer';

const MarkdownRenderer = ({ content, onContentChange, readOnly = true }) => {
  // 检查是否包含待办事项
  const hasTodos = /^(\s*)-\s*\[([x\s])\]\s*(.+)$/m.test(content);

  if (hasTodos && onContentChange && !readOnly) {
    // 如果有待办事项且可以编辑，使用TodoRenderer
    return (
      <div className="prose prose-gray max-w-none">
        <TodoRenderer 
          content={content} 
          onContentChange={onContentChange}
          readOnly={readOnly}
        />
      </div>
    );
  }

  return (
    <div className="prose prose-gray max-w-none">
      <ReactMarkdown
        components={{
          // 代码高亮
          code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            return !inline && match ? (
              <SyntaxHighlighter
                style={tomorrow}
                language={match[1]}
                PreTag="div"
                className="rounded-lg"
                {...props}
              >
                {String(children).replace(/\n$/, '')}
              </SyntaxHighlighter>
            ) : (
              <code className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono" {...props}>
                {children}
              </code>
            );
          },
          
          // 自定义链接渲染
          a({ href, children, ...props }) {
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 underline"
                {...props}
              >
                {children}
              </a>
            );
          },
          
          // 自定义表格样式
          table({ children, ...props }) {
            return (
              <div className="overflow-x-auto my-4">
                <table className="min-w-full border-collapse border border-gray-300" {...props}>
                  {children}
                </table>
              </div>
            );
          },
          
          th({ children, ...props }) {
            return (
              <th className="border border-gray-300 bg-gray-50 px-4 py-2 text-left font-semibold" {...props}>
                {children}
              </th>
            );
          },
          
          td({ children, ...props }) {
            return (
              <td className="border border-gray-300 px-4 py-2" {...props}>
                {children}
              </td>
            );
          },
          
          // 自定义引用块
          blockquote({ children, ...props }) {
            return (
              <blockquote className="border-l-4 border-blue-500 pl-4 py-2 my-4 bg-blue-50 italic" {...props}>
                {children}
              </blockquote>
            );
          },
          
          // 自定义列表
          ul({ children, ...props }) {
            return (
              <ul className="list-disc list-inside space-y-1 my-4" {...props}>
                {children}
              </ul>
            );
          },
          
          ol({ children, ...props }) {
            return (
              <ol className="list-decimal list-inside space-y-1 my-4" {...props}>
                {children}
              </ol>
            );
          },
          
          // 自定义标题
          h1({ children, ...props }) {
            return (
              <h1 className="text-3xl font-bold mb-4 mt-6 text-gray-900 border-b border-gray-200 pb-2" {...props}>
                {children}
              </h1>
            );
          },
          
          h2({ children, ...props }) {
            return (
              <h2 className="text-2xl font-semibold mb-3 mt-5 text-gray-900" {...props}>
                {children}
              </h2>
            );
          },
          
          h3({ children, ...props }) {
            return (
              <h3 className="text-xl font-medium mb-2 mt-4 text-gray-900" {...props}>
                {children}
              </h3>
            );
          },
          
          // 自定义段落
          p({ children, ...props }) {
            return (
              <p className="mb-4 leading-relaxed text-gray-700" {...props}>
                {children}
              </p>
            );
          },
          
          // 分隔线
          hr({ ...props }) {
            return (
              <hr className="my-8 border-t-2 border-gray-200" {...props} />
            );
          },
          
          // 图片
          img({ src, alt, ...props }) {
            return (
              <div className="my-4">
                <img
                  src={src}
                  alt={alt}
                  className="max-w-full h-auto rounded-lg shadow-md"
                  {...props}
                />
                {alt && (
                  <p className="text-sm text-gray-500 text-center mt-2 italic">
                    {alt}
                  </p>
                )}
              </div>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;
