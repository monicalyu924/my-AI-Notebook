// 离线数据存储管理器
class OfflineStorage {
  constructor() {
    this.dbName = 'AINotebookDB';
    this.dbVersion = 1;
    this.db = null;
    this.isSupported = this.checkSupport();
  }

  // 检查浏览器支持
  checkSupport() {
    return 'indexedDB' in window && 'serviceWorker' in navigator;
  }

  // 初始化数据库
  async init() {
    if (!this.isSupported) {
      throw new Error('离线存储不被支持');
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // 创建笔记存储
        if (!db.objectStoreNames.contains('notes')) {
          const notesStore = db.createObjectStore('notes', { keyPath: 'id' });
          notesStore.createIndex('userId', 'userId', { unique: false });
          notesStore.createIndex('folderId', 'folderId', { unique: false });
          notesStore.createIndex('updatedAt', 'updatedAt', { unique: false });
        }

        // 创建文件夹存储
        if (!db.objectStoreNames.contains('folders')) {
          const foldersStore = db.createObjectStore('folders', { keyPath: 'id' });
          foldersStore.createIndex('userId', 'userId', { unique: false });
          foldersStore.createIndex('parentId', 'parentId', { unique: false });
        }

        // 创建待办事项存储
        if (!db.objectStoreNames.contains('todos')) {
          const todosStore = db.createObjectStore('todos', { keyPath: 'id' });
          todosStore.createIndex('userId', 'userId', { unique: false });
          todosStore.createIndex('completed', 'completed', { unique: false });
          todosStore.createIndex('dueDate', 'dueDate', { unique: false });
        }

        // 创建同步队列存储
        if (!db.objectStoreNames.contains('syncQueue')) {
          const syncStore = db.createObjectStore('syncQueue', { keyPath: 'id', autoIncrement: true });
          syncStore.createIndex('type', 'type', { unique: false });
          syncStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // 创建用户设置存储
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }

        // 创建缓存元数据存储
        if (!db.objectStoreNames.contains('cacheMetadata')) {
          const cacheStore = db.createObjectStore('cacheMetadata', { keyPath: 'key' });
          cacheStore.createIndex('expireAt', 'expireAt', { unique: false });
        }
      };
    });
  }

  // 通用数据库操作方法
  async transaction(storeName, mode = 'readonly') {
    if (!this.db) {
      await this.init();
    }
    return this.db.transaction([storeName], mode).objectStore(storeName);
  }

  // 添加或更新数据
  async put(storeName, data) {
    const store = await this.transaction(storeName, 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.put({
        ...data,
        _lastModified: Date.now(),
        _syncStatus: 'pending'
      });
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // 获取单个数据
  async get(storeName, id) {
    const store = await this.transaction(storeName);
    return new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // 获取所有数据
  async getAll(storeName, indexName = null, query = null) {
    const store = await this.transaction(storeName);
    const source = indexName ? store.index(indexName) : store;
    
    return new Promise((resolve, reject) => {
      const request = query ? source.getAll(query) : source.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // 删除数据
  async delete(storeName, id) {
    const store = await this.transaction(storeName, 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // 清空存储
  async clear(storeName) {
    const store = await this.transaction(storeName, 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // 计数
  async count(storeName, indexName = null, query = null) {
    const store = await this.transaction(storeName);
    const source = indexName ? store.index(indexName) : store;
    
    return new Promise((resolve, reject) => {
      const request = query ? source.count(query) : source.count();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // 笔记相关方法
  async saveNote(note) {
    return this.put('notes', note);
  }

  async getNote(id) {
    return this.get('notes', id);
  }

  async getNotesByUser(userId) {
    return this.getAll('notes', 'userId', userId);
  }

  async getNotesByFolder(folderId) {
    return this.getAll('notes', 'folderId', folderId);
  }

  async deleteNote(id) {
    return this.delete('notes', id);
  }

  // 文件夹相关方法
  async saveFolder(folder) {
    return this.put('folders', folder);
  }

  async getFolder(id) {
    return this.get('folders', id);
  }

  async getFoldersByUser(userId) {
    return this.getAll('folders', 'userId', userId);
  }

  async deleteFolder(id) {
    return this.delete('folders', id);
  }

  // 待办事项相关方法
  async saveTodo(todo) {
    return this.put('todos', todo);
  }

  async getTodo(id) {
    return this.get('todos', id);
  }

  async getTodosByUser(userId) {
    return this.getAll('todos', 'userId', userId);
  }

  async deleteTodo(id) {
    return this.delete('todos', id);
  }

  // 同步队列方法
  async addToSyncQueue(operation) {
    const queueItem = {
      type: operation.type,
      method: operation.method,
      url: operation.url,
      data: operation.data,
      timestamp: Date.now(),
      retryCount: 0
    };
    
    return this.put('syncQueue', queueItem);
  }

  async getSyncQueue() {
    return this.getAll('syncQueue');
  }

  async removeSyncQueueItem(id) {
    return this.delete('syncQueue', id);
  }

  async clearSyncQueue() {
    return this.clear('syncQueue');
  }

  // 设置方法
  async saveSetting(key, value) {
    return this.put('settings', { key, value, timestamp: Date.now() });
  }

  async getSetting(key) {
    const result = await this.get('settings', key);
    return result?.value;
  }

  // 缓存元数据方法
  async setCacheMetadata(key, metadata, ttl = 300000) { // 默认5分钟TTL
    const expireAt = Date.now() + ttl;
    return this.put('cacheMetadata', { key, metadata, expireAt });
  }

  async getCacheMetadata(key) {
    const result = await this.get('cacheMetadata', key);
    if (result && result.expireAt > Date.now()) {
      return result.metadata;
    }
    if (result) {
      // 过期了，删除
      await this.delete('cacheMetadata', key);
    }
    return null;
  }

  // 清理过期缓存
  async cleanupExpiredCache() {
    const store = await this.transaction('cacheMetadata', 'readwrite');
    const index = store.index('expireAt');
    const range = IDBKeyRange.upperBound(Date.now());
    
    return new Promise((resolve) => {
      const request = index.openCursor(range);
      let deletedCount = 0;
      
      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          cursor.delete();
          deletedCount++;
          cursor.continue();
        } else {
          resolve(deletedCount);
        }
      };
    });
  }

  // 数据同步状态管理
  async markAsSynced(storeName, id) {
    const data = await this.get(storeName, id);
    if (data) {
      data._syncStatus = 'synced';
      return this.put(storeName, data);
    }
  }

  async getPendingSyncData(storeName) {
    const allData = await this.getAll(storeName);
    return allData.filter(item => item._syncStatus === 'pending');
  }

  // 导出数据（用于备份）
  async exportData() {
    const data = {};
    const storeNames = ['notes', 'folders', 'todos', 'settings'];
    
    for (const storeName of storeNames) {
      data[storeName] = await this.getAll(storeName);
    }
    
    return {
      version: this.dbVersion,
      timestamp: Date.now(),
      data
    };
  }

  // 导入数据（用于恢复）
  async importData(exportedData) {
    const { data } = exportedData;
    
    for (const [storeName, items] of Object.entries(data)) {
      if (Array.isArray(items)) {
        for (const item of items) {
          await this.put(storeName, item);
        }
      }
    }
  }

  // 获取存储使用情况
  async getStorageUsage() {
    const usage = {};
    const storeNames = ['notes', 'folders', 'todos', 'syncQueue', 'settings', 'cacheMetadata'];
    
    for (const storeName of storeNames) {
      usage[storeName] = await this.count(storeName);
    }
    
    return usage;
  }

  // 关闭数据库连接
  close() {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

// Service Worker通信类
class ServiceWorkerManager {
  constructor() {
    this.isSupported = 'serviceWorker' in navigator;
    this.registration = null;
  }

  // 注册Service Worker
  async register() {
    if (!this.isSupported) {
      throw new Error('Service Worker不被支持');
    }

    try {
      this.registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker注册成功:', this.registration);

      // 监听更新
      this.registration.addEventListener('updatefound', () => {
        console.log('发现Service Worker更新');
        this.handleUpdate();
      });

      return this.registration;
    } catch (error) {
      console.error('Service Worker注册失败:', error);
      throw error;
    }
  }

  // 处理更新
  handleUpdate() {
    const newWorker = this.registration.installing;
    
    newWorker.addEventListener('statechange', () => {
      if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
        // 显示更新提示
        this.showUpdateNotification();
      }
    });
  }

  // 显示更新通知
  showUpdateNotification() {
    // 这里可以显示一个通知，询问用户是否要重新加载页面
    if (confirm('应用有新版本可用，是否立即更新？')) {
      this.skipWaiting();
    }
  }

  // 跳过等待，立即激活新的Service Worker
  async skipWaiting() {
    if (this.registration && this.registration.waiting) {
      this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  }

  // 清理缓存
  async clearCache(cacheName) {
    if (this.registration && this.registration.active) {
      this.registration.active.postMessage({
        type: 'CLEAR_CACHE',
        payload: { cacheName }
      });
    }
  }

  // 预缓存URL
  async cacheUrls(urls) {
    if (this.registration && this.registration.active) {
      this.registration.active.postMessage({
        type: 'CACHE_URLS',
        payload: { urls }
      });
    }
  }

  // 获取缓存信息
  async getCacheInfo() {
    return new Promise((resolve) => {
      if (this.registration && this.registration.active) {
        const channel = new MessageChannel();
        
        channel.port1.onmessage = (event) => {
          resolve(event.data);
        };
        
        this.registration.active.postMessage(
          { type: 'GET_CACHE_INFO' },
          [channel.port2]
        );
      } else {
        resolve({});
      }
    });
  }

  // 注册后台同步
  async registerBackgroundSync(tag) {
    if (this.registration && 'sync' in this.registration) {
      return this.registration.sync.register(tag);
    }
  }
}

// 创建全局实例
export const offlineStorage = new OfflineStorage();
export const serviceWorkerManager = new ServiceWorkerManager();

// 离线状态管理
export class OfflineManager {
  constructor() {
    this.isOnline = navigator.onLine;
    this.listeners = [];
    
    // 监听网络状态变化
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.notifyListeners('online');
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.notifyListeners('offline');
    });
  }

  // 添加状态变化监听器
  addListener(callback) {
    this.listeners.push(callback);
  }

  // 移除监听器
  removeListener(callback) {
    this.listeners = this.listeners.filter(listener => listener !== callback);
  }

  // 通知监听器
  notifyListeners(status) {
    this.listeners.forEach(callback => callback(status, this.isOnline));
  }

  // 获取网络状态
  getNetworkStatus() {
    return this.isOnline;
  }
}

export const offlineManager = new OfflineManager();

// 导出默认实例
export default {
  storage: offlineStorage,
  serviceWorker: serviceWorkerManager,
  manager: offlineManager
};