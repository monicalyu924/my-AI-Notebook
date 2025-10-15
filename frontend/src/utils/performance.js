/**
 * 性能优化工具函数
 */

/**
 * 防抖函数 - 延迟执行，只执行最后一次
 * @param {Function} func - 要执行的函数
 * @param {number} wait - 等待时间（毫秒）
 * @returns {Function} - 防抖后的函数
 */
export function debounce(func, wait = 300) {
  let timeout;

  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };

    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * 节流函数 - 固定时间内只执行一次
 * @param {Function} func - 要执行的函数
 * @param {number} limit - 时间限制（毫秒）
 * @returns {Function} - 节流后的函数
 */
export function throttle(func, limit = 300) {
  let inThrottle;

  return function executedFunction(...args) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

/**
 * 请求动画帧节流
 * @param {Function} func - 要执行的函数
 * @returns {Function} - 节流后的函数
 */
export function rafThrottle(func) {
  let rafId = null;

  return function executedFunction(...args) {
    if (rafId) {
      return;
    }

    rafId = requestAnimationFrame(() => {
      func(...args);
      rafId = null;
    });
  };
}

/**
 * 图片懒加载
 * @param {HTMLImageElement} img - 图片元素
 * @param {string} src - 图片源地址
 */
export function lazyLoadImage(img, src) {
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          img.src = src;
          observer.unobserve(img);
        }
      });
    });

    observer.observe(img);
  } else {
    // 降级方案
    img.src = src;
  }
}

/**
 * 批量处理函数 - 将多次调用合并为一次
 * @param {Function} func - 要执行的函数
 * @param {number} wait - 等待时间
 * @returns {Function} - 批量处理后的函数
 */
export function batchProcess(func, wait = 50) {
  let pending = [];
  let timeout;

  return function(...args) {
    pending.push(args);

    clearTimeout(timeout);
    timeout = setTimeout(() => {
      const batch = pending;
      pending = [];
      func(batch);
    }, wait);
  };
}

/**
 * 内存优化 - 清理大对象
 * @param {Object} obj - 要清理的对象
 */
export function cleanupLargeObject(obj) {
  if (obj && typeof obj === 'object') {
    Object.keys(obj).forEach(key => {
      delete obj[key];
    });
  }
}

/**
 * 计算文本长度（考虑中文）
 * @param {string} text - 文本内容
 * @returns {number} - 字符长度
 */
export function getTextLength(text) {
  if (!text) return 0;
  // 中文字符算2个字符
  return text.replace(/[\u4e00-\u9fa5]/g, 'aa').length;
}

/**
 * 格式化文件大小
 * @param {number} bytes - 字节数
 * @returns {string} - 格式化后的大小
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
