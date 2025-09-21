// Service Worker for AI智能记事本
const CACHE_NAME = 'ai-notebook-v2.0.0';
const STATIC_CACHE = 'static-v2.0.0';
const DYNAMIC_CACHE = 'dynamic-v2.0.0';
const API_CACHE = 'api-v2.0.0';

// 需要缓存的静态资源
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/vite.svg',
  '/offline.html', // 离线页面
];

// API缓存策略
const API_CACHE_STRATEGIES = {
  // 缓存优先（适用于不经常变化的数据）
  CACHE_FIRST: 'cache-first',
  // 网络优先（适用于经常变化的数据）
  NETWORK_FIRST: 'network-first',
  // 仅缓存（适用于静态资源）
  CACHE_ONLY: 'cache-only',
  // 仅网络（适用于敏感数据）
  NETWORK_ONLY: 'network-only'
};

// API路由缓存配置
const API_ROUTES = {
  '/api/folders': { strategy: API_CACHE_STRATEGIES.CACHE_FIRST, ttl: 300000 }, // 5分钟
  '/api/notes': { strategy: API_CACHE_STRATEGIES.NETWORK_FIRST, ttl: 60000 },  // 1分钟
  '/api/todos': { strategy: API_CACHE_STRATEGIES.NETWORK_FIRST, ttl: 60000 },   // 1分钟
  '/api/user': { strategy: API_CACHE_STRATEGIES.NETWORK_FIRST, ttl: 600000 },   // 10分钟
  '/api/auth': { strategy: API_CACHE_STRATEGIES.NETWORK_ONLY, ttl: 0 },         // 不缓存
  '/api/ai': { strategy: API_CACHE_STRATEGIES.NETWORK_ONLY, ttl: 0 },           // 不缓存
};

// 安装事件
self.addEventListener('install', event => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    Promise.all([
      // 缓存静态资源
      caches.open(STATIC_CACHE).then(cache => {
        console.log('Service Worker: Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      }),
      // 强制激活新的Service Worker
      self.skipWaiting()
    ])
  );
});

// 激活事件
self.addEventListener('activate', event => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    Promise.all([
      // 清理旧缓存
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== STATIC_CACHE && 
                cacheName !== DYNAMIC_CACHE && 
                cacheName !== API_CACHE) {
              console.log('Service Worker: Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // 立即控制所有页面
      self.clients.claim()
    ])
  );
});

// 获取事件
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  
  // 只处理同源请求
  if (url.origin !== self.location.origin) {
    return;
  }
  
  // 根据请求类型选择缓存策略
  if (request.url.includes('/api/')) {
    event.respondWith(handleApiRequest(request));
  } else if (request.destination === 'document') {
    event.respondWith(handleDocumentRequest(request));
  } else {
    event.respondWith(handleStaticRequest(request));
  }
});

// 处理API请求
async function handleApiRequest(request) {
  const url = new URL(request.url);
  const pathname = url.pathname;
  
  // 查找匹配的API路由配置
  const routeConfig = Object.keys(API_ROUTES).find(route => 
    pathname.startsWith(route)
  );
  
  if (!routeConfig) {
    // 默认策略：网络优先
    return handleNetworkFirst(request, API_CACHE);
  }
  
  const config = API_ROUTES[routeConfig];
  
  switch (config.strategy) {
    case API_CACHE_STRATEGIES.CACHE_FIRST:
      return handleCacheFirst(request, API_CACHE, config.ttl);
    case API_CACHE_STRATEGIES.NETWORK_FIRST:
      return handleNetworkFirst(request, API_CACHE, config.ttl);
    case API_CACHE_STRATEGIES.CACHE_ONLY:
      return handleCacheOnly(request, API_CACHE);
    case API_CACHE_STRATEGIES.NETWORK_ONLY:
      return handleNetworkOnly(request);
    default:
      return handleNetworkFirst(request, API_CACHE);
  }
}

// 处理文档请求
async function handleDocumentRequest(request) {
  try {
    // 尝试从网络获取
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // 缓存成功的响应
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
    
    throw new Error('Network response not ok');
  } catch (error) {
    // 网络失败时从缓存获取
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // 返回离线页面
    return caches.match('/offline.html') || new Response('Offline');
  }
}

// 处理静态资源请求
async function handleStaticRequest(request) {
  // 缓存优先策略
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok && request.method === 'GET') {
      // 缓存新的静态资源
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // 静态资源加载失败时的后备方案
    if (request.destination === 'image') {
      return new Response('', { status: 404 });
    }
    
    throw error;
  }
}

// 缓存优先策略
async function handleCacheFirst(request, cacheName, ttl = 0) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    // 检查缓存是否过期
    const cacheDate = new Date(cachedResponse.headers.get('sw-cache-date') || 0);
    const now = new Date();
    
    if (ttl === 0 || (now - cacheDate) < ttl) {
      // 后台更新缓存（不阻塞响应）
      updateCacheInBackground(request, cache);
      return cachedResponse;
    }
  }
  
  // 缓存未命中或已过期，从网络获取
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const responseClone = networkResponse.clone();
      // 添加缓存时间戳
      const headers = new Headers(responseClone.headers);
      headers.set('sw-cache-date', new Date().toISOString());
      
      const cachedResponse = new Response(await responseClone.blob(), {
        status: responseClone.status,
        statusText: responseClone.statusText,
        headers: headers
      });
      
      cache.put(request, cachedResponse);
    }
    
    return networkResponse;
  } catch (error) {
    // 网络失败时返回缓存（即使已过期）
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
}

// 网络优先策略
async function handleNetworkFirst(request, cacheName, ttl = 0) {
  const cache = await caches.open(cacheName);
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const responseClone = networkResponse.clone();
      // 添加缓存时间戳
      const headers = new Headers(responseClone.headers);
      headers.set('sw-cache-date', new Date().toISOString());
      
      const cachedResponse = new Response(await responseClone.blob(), {
        status: responseClone.status,
        statusText: responseClone.statusText,
        headers: headers
      });
      
      cache.put(request, cachedResponse);
    }
    
    return networkResponse;
  } catch (error) {
    // 网络失败时从缓存获取
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    throw error;
  }
}

// 仅缓存策略
async function handleCacheOnly(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  return new Response('', { status: 404 });
}

// 仅网络策略
async function handleNetworkOnly(request) {
  return fetch(request);
}

// 后台更新缓存
async function updateCacheInBackground(request, cache) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const headers = new Headers(networkResponse.headers);
      headers.set('sw-cache-date', new Date().toISOString());
      
      const cachedResponse = new Response(await networkResponse.clone().blob(), {
        status: networkResponse.status,
        statusText: networkResponse.statusText,
        headers: headers
      });
      
      cache.put(request, cachedResponse);
    }
  } catch (error) {
    console.log('Background cache update failed:', error);
  }
}

// 消息事件处理
self.addEventListener('message', event => {
  const { type, payload } = event.data;
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'CLEAR_CACHE':
      clearCache(payload?.cacheName);
      break;
      
    case 'CACHE_URLS':
      cacheUrls(payload?.urls || []);
      break;
      
    case 'GET_CACHE_INFO':
      getCacheInfo().then(info => {
        event.ports[0].postMessage(info);
      });
      break;
  }
});

// 清理缓存
async function clearCache(cacheName) {
  if (cacheName) {
    await caches.delete(cacheName);
  } else {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map(name => caches.delete(name)));
  }
}

// 预缓存URL
async function cacheUrls(urls) {
  const cache = await caches.open(DYNAMIC_CACHE);
  await cache.addAll(urls);
}

// 获取缓存信息
async function getCacheInfo() {
  const cacheNames = await caches.keys();
  const cacheInfo = {};
  
  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    cacheInfo[cacheName] = keys.length;
  }
  
  return cacheInfo;
}

// 同步事件（后台同步）
self.addEventListener('sync', event => {
  console.log('Service Worker: Background sync triggered');
  
  switch (event.tag) {
    case 'sync-notes':
      event.waitUntil(syncNotes());
      break;
    case 'sync-todos':
      event.waitUntil(syncTodos());
      break;
  }
});

// 同步笔记数据
async function syncNotes() {
  try {
    // 这里可以实现具体的同步逻辑
    console.log('Syncing notes data...');
    
    // 获取待同步的数据
    const pendingNotes = await getStoredData('pending-notes');
    
    for (const note of pendingNotes) {
      try {
        const response = await fetch('/api/notes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${note.token}`
          },
          body: JSON.stringify(note.data)
        });
        
        if (response.ok) {
          // 同步成功，移除待同步数据
          await removeStoredData('pending-notes', note.id);
        }
      } catch (error) {
        console.error('Failed to sync note:', error);
      }
    }
  } catch (error) {
    console.error('Notes sync failed:', error);
  }
}

// 同步待办事项数据
async function syncTodos() {
  try {
    console.log('Syncing todos data...');
    // 实现待办事项同步逻辑
  } catch (error) {
    console.error('Todos sync failed:', error);
  }
}

// 获取存储的数据
async function getStoredData(key) {
  // 这里可以使用IndexedDB存储离线数据
  return [];
}

// 移除存储的数据
async function removeStoredData(key, id) {
  // 实现数据移除逻辑
}

console.log('Service Worker: Script loaded');