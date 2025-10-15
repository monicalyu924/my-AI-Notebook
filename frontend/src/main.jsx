import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { registerServiceWorker } from './utils/sw-register'

// 注册Service Worker实现PWA离线支持
if (import.meta.env.PROD) {
  registerServiceWorker()
    .then(() => console.log('[PWA] Service Worker registered successfully'))
    .catch(err => console.error('[PWA] Service Worker registration failed:', err));
} else {
  console.log('[PWA] Service Worker disabled in development mode');
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
