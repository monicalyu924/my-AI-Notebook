/**
 * IndexedDB封装库 - 用于离线数据存储
 */

const DB_NAME = 'AINotebookDB';
const DB_VERSION = 1;

/**
 * 打开数据库连接
 */
export function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('IndexedDB open error:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // 创建笔记对象存储
      if (!db.objectStoreNames.contains('notes')) {
        const notesStore = db.createObjectStore('notes', { keyPath: 'id' });
        notesStore.createIndex('updated_at', 'updated_at', { unique: false });
        notesStore.createIndex('user_id', 'user_id', { unique: false });
      }

      // 创建待同步队列
      if (!db.objectStoreNames.contains('syncQueue')) {
        const syncStore = db.createObjectStore('syncQueue', { keyPath: 'id', autoIncrement: true });
        syncStore.createIndex('timestamp', 'timestamp', { unique: false });
        syncStore.createIndex('type', 'type', { unique: false });
      }

      // 创建用户设置存储
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'key' });
      }

      // 创建待办事项存储
      if (!db.objectStoreNames.contains('todos')) {
        const todosStore = db.createObjectStore('todos', { keyPath: 'id' });
        todosStore.createIndex('user_id', 'user_id', { unique: false });
      }

      console.log('IndexedDB database upgraded to version', DB_VERSION);
    };
  });
}

/**
 * 通用的添加/更新数据方法
 * @param {string} storeName - 对象存储名称
 * @param {*} data - 要存储的数据
 */
export async function setItem(storeName, data) {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.put(data);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);

    transaction.oncomplete = () => db.close();
  });
}

/**
 * 获取数据
 * @param {string} storeName - 对象存储名称
 * @param {*} key - 键值
 */
export async function getItem(storeName, key) {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.get(key);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);

    transaction.oncomplete = () => db.close();
  });
}

/**
 * 获取所有数据
 * @param {string} storeName - 对象存储名称
 */
export async function getAllItems(storeName) {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);

    transaction.oncomplete = () => db.close();
  });
}

/**
 * 删除数据
 * @param {string} storeName - 对象存储名称
 * @param {*} key - 键值
 */
export async function deleteItem(storeName, key) {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.delete(key);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);

    transaction.oncomplete = () => db.close();
  });
}

/**
 * 清空对象存储
 * @param {string} storeName - 对象存储名称
 */
export async function clearStore(storeName) {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.clear();

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);

    transaction.oncomplete = () => db.close();
  });
}

// ===== 笔记相关操作 =====

/**
 * 保存笔记到IndexedDB
 */
export async function saveNoteOffline(note) {
  return setItem('notes', {
    ...note,
    offlineUpdatedAt: new Date().toISOString()
  });
}

/**
 * 获取所有离线笔记
 */
export async function getAllNotesOffline() {
  return getAllItems('notes');
}

/**
 * 获取单个离线笔记
 */
export async function getNoteOffline(noteId) {
  return getItem('notes', noteId);
}

/**
 * 删除离线笔记
 */
export async function deleteNoteOffline(noteId) {
  return deleteItem('notes', noteId);
}

// ===== 同步队列操作 =====

/**
 * 添加到同步队列
 * @param {string} type - 操作类型 (create, update, delete)
 * @param {string} entity - 实体类型 (note, todo, etc.)
 * @param {*} data - 数据
 */
export async function addToSyncQueue(type, entity, data) {
  const syncItem = {
    type,
    entity,
    data,
    timestamp: new Date().toISOString(),
    retryCount: 0
  };

  return setItem('syncQueue', syncItem);
}

/**
 * 获取所有待同步项
 */
export async function getSyncQueue() {
  return getAllItems('syncQueue');
}

/**
 * 清空同步队列
 */
export async function clearSyncQueue() {
  return clearStore('syncQueue');
}

/**
 * 删除同步队列中的某一项
 */
export async function removeSyncItem(itemId) {
  return deleteItem('syncQueue', itemId);
}

// ===== 设置相关操作 =====

/**
 * 保存设置
 */
export async function saveSetting(key, value) {
  return setItem('settings', { key, value });
}

/**
 * 获取设置
 */
export async function getSetting(key) {
  const result = await getItem('settings', key);
  return result?.value;
}

// ===== 待办事项操作 =====

/**
 * 保存待办事项
 */
export async function saveTodoOffline(todo) {
  return setItem('todos', {
    ...todo,
    offlineUpdatedAt: new Date().toISOString()
  });
}

/**
 * 获取所有离线待办事项
 */
export async function getAllTodosOffline() {
  return getAllItems('todos');
}

/**
 * 删除离线待办事项
 */
export async function deleteTodoOffline(todoId) {
  return deleteItem('todos', todoId);
}

/**
 * 批量保存笔记
 * @param {Array} notes - 笔记数组
 */
export async function batchSaveNotes(notes) {
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['notes'], 'readwrite');
    const store = transaction.objectStore('notes');

    const promises = notes.map(note => {
      return new Promise((res, rej) => {
        const request = store.put({
          ...note,
          offlineSyncedAt: new Date().toISOString()
        });
        request.onsuccess = () => res();
        request.onerror = () => rej(request.error);
      });
    });

    Promise.all(promises)
      .then(() => resolve())
      .catch(reject);

    transaction.oncomplete = () => db.close();
  });
}

/**
 * 检查IndexedDB是否可用
 */
export function isIndexedDBAvailable() {
  return 'indexedDB' in window;
}

/**
 * 获取数据库使用情况
 */
export async function getStorageEstimate() {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    const estimate = await navigator.storage.estimate();
    return {
      usage: estimate.usage,
      quota: estimate.quota,
      percentUsed: ((estimate.usage / estimate.quota) * 100).toFixed(2)
    };
  }
  return null;
}

console.log('[IndexedDB] Library loaded');
