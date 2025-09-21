import React from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // You can also log the error to an error reporting service
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <AlertCircle className="h-8 w-8 text-red-500" />
              <h1 className="text-xl font-semibold text-gray-900">出现错误</h1>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-600 mb-4">
                很抱歉，应用遇到了一个错误。请尝试刷新页面或返回主页。
              </p>
              
              {this.state.error && (
                <details className="mb-4">
                  <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                    查看错误详情
                  </summary>
                  <div className="mt-2 p-3 bg-gray-100 rounded text-xs font-mono text-red-600 whitespace-pre-wrap">
                    {this.state.error && this.state.error.toString()}
                    {this.state.errorInfo.componentStack}
                  </div>
                </details>
              )}
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => window.location.reload()}
                className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                <span>刷新页面</span>
              </button>
              
              <button
                onClick={() => window.location.href = '/'}
                className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
              >
                <Home className="h-4 w-4" />
                <span>返回主页</span>
              </button>
            </div>
            
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>开发提示：</strong>
              </p>
              <ul className="text-xs text-yellow-700 mt-1 space-y-1">
                <li>• 检查浏览器开发者工具的控制台</li>
                <li>• 确认后端服务器正在运行</li>
                <li>• 验证网络连接是否正常</li>
                <li>• 检查是否有未处理的Promise rejection</li>
              </ul>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
