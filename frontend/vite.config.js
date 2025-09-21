import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    // 生成压缩的代码
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // 生产环境移除console
        drop_debugger: true // 移除debugger
      }
    },
    // 代码分割策略
    rollupOptions: {
      output: {
        manualChunks: {
          // 将React相关的库打包到单独的chunk
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          // 将大型UI库打包到单独的chunk
          'ui-vendor': ['framer-motion', 'lucide-react', '@dnd-kit/core', '@dnd-kit/sortable'],
          // 将工具库打包到单独的chunk
          'utils-vendor': ['axios', 'date-fns', 'zustand']
        }
      }
    },
    // 启用gzip压缩
    reportCompressedSize: true,
    // chunk大小警告限制
    chunkSizeWarningLimit: 1000
  },
  // 优化依赖预构建
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'axios', 'zustand']
  }
})
