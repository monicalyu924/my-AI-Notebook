/**
 * Service Worker注册和管理
 */

/**
 * 注册Service Worker
 */
export async function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

      console.log('[SW] Service Worker registered successfully:', registration.scope);

      // 监听更新
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        console.log('[SW] New Service Worker installing...');

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // 新的Service Worker已安装，但旧的仍在控制页面
            console.log('[SW] New Service Worker installed, waiting to activate');

            // 提示用户刷新页面
            if (confirm('发现新版本，是否立即刷新页面以应用更新？')) {
              newWorker.postMessage({ type: 'SKIP_WAITING' });
              window.location.reload();
            }
          }
        });
      });

      // 监听Service Worker控制器变化
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });

      return registration;
    } catch (error) {
      console.error('[SW] Service Worker registration failed:', error);
      throw error;
    }
  } else {
    console.warn('[SW] Service Workers are not supported in this browser');
    return null;
  }
}

/**
 * 注销Service Worker
 */
export async function unregisterServiceWorker() {
  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      await registration.unregister();
      console.log('[SW] Service Worker unregistered');
    }
  }
}

/**
 * 向Service Worker发送消息
 * @param {Object} message - 消息对象
 */
export async function sendMessageToSW(message) {
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage(message);
  }
}

/**
 * 清除所有缓存
 */
export async function clearAllCaches() {
  if ('caches' in window) {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map(name => caches.delete(name)));
    console.log('[SW] All caches cleared');
  }

  // 同时发送消息给Service Worker
  await sendMessageToSW({ type: 'CLEAR_CACHE' });
}

/**
 * 预缓存指定的URL列表
 * @param {Array<string>} urls - URL列表
 */
export async function cacheUrls(urls) {
  await sendMessageToSW({
    type: 'CACHE_URLS',
    payload: { urls }
  });
}

/**
 * 获取缓存信息
 */
export async function getCacheInfo() {
  return new Promise((resolve, reject) => {
    if (!navigator.serviceWorker.controller) {
      reject(new Error('No active service worker'));
      return;
    }

    const messageChannel = new MessageChannel();

    messageChannel.port1.onmessage = (event) => {
      resolve(event.data);
    };

    navigator.serviceWorker.controller.postMessage(
      { type: 'GET_CACHE_INFO' },
      [messageChannel.port2]
    );

    // 设置超时
    setTimeout(() => reject(new Error('Timeout')), 5000);
  });
}

/**
 * 检查是否在线
 */
export function isOnline() {
  return navigator.onLine;
}

/**
 * 监听在线/离线状态变化
 * @param {Function} callback - 回调函数
 */
export function watchOnlineStatus(callback) {
  const handleOnline = () => callback(true);
  const handleOffline = () => callback(false);

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  // 返回清理函数
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}

/**
 * 注册后台同步
 * @param {string} tag - 同步标签
 */
export async function registerBackgroundSync(tag) {
  if ('serviceWorker' in navigator && 'sync' in ServiceWorkerRegistration.prototype) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.sync.register(tag);
      console.log(`[SW] Background sync registered: ${tag}`);
      return true;
    } catch (error) {
      console.error('[SW] Background sync registration failed:', error);
      return false;
    }
  } else {
    console.warn('[SW] Background Sync is not supported');
    return false;
  }
}

/**
 * 请求持久化存储
 */
export async function requestPersistentStorage() {
  if ('storage' in navigator && 'persist' in navigator.storage) {
    const isPersisted = await navigator.storage.persist();
    console.log(`[SW] Persistent storage ${isPersisted ? 'granted' : 'denied'}`);
    return isPersisted;
  }
  return false;
}

/**
 * 检查是否已持久化
 */
export async function isStoragePersisted() {
  if ('storage' in navigator && 'persisted' in navigator.storage) {
    return await navigator.storage.persisted();
  }
  return false;
}

console.log('[SW] Service Worker register module loaded');
