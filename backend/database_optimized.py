import sqlite3
import threading
import time
from contextlib import contextmanager
from typing import Optional, Any, Dict, List
from datetime import datetime
import logging
import json

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

DATABASE_PATH = "notebook.db"

class DatabaseConnectionPool:
    """数据库连接池管理器"""
    
    def __init__(self, max_connections=10, timeout=30):
        self.max_connections = max_connections
        self.timeout = timeout
        self.connections = []
        self.used_connections = set()
        self.lock = threading.Lock()
        
        # 预创建连接
        self._create_initial_connections()
    
    def _create_initial_connections(self):
        """创建初始连接"""
        for _ in range(min(3, self.max_connections)):
            conn = self._create_connection()
            if conn:
                self.connections.append(conn)
    
    def _create_connection(self):
        """创建单个数据库连接"""
        try:
            conn = sqlite3.connect(
                DATABASE_PATH,
                timeout=self.timeout,
                check_same_thread=False,
                isolation_level=None  # 启用自动提交
            )
            
            # 启用WAL模式以提高并发性能
            conn.execute("PRAGMA journal_mode = WAL")
            
            # 优化性能设置
            conn.execute("PRAGMA synchronous = NORMAL")  # 平衡安全性和性能
            conn.execute("PRAGMA cache_size = -64000")   # 64MB缓存
            conn.execute("PRAGMA temp_store = MEMORY")    # 内存临时存储
            conn.execute("PRAGMA mmap_size = 268435456")  # 256MB内存映射
            
            # 启用外键约束
            conn.execute("PRAGMA foreign_keys = ON")
            
            # 设置行工厂
            conn.row_factory = sqlite3.Row
            
            return conn
        except Exception as e:
            logger.error(f"创建数据库连接失败: {e}")
            return None
    
    @contextmanager
    def get_connection(self):
        """获取数据库连接（上下文管理器）"""
        conn = None
        try:
            with self.lock:
                if self.connections:
                    conn = self.connections.pop()
                    self.used_connections.add(conn)
                elif len(self.used_connections) < self.max_connections:
                    conn = self._create_connection()
                    if conn:
                        self.used_connections.add(conn)
            
            if not conn:
                raise Exception("无法获取数据库连接")
            
            yield conn
            
        except Exception as e:
            logger.error(f"数据库操作错误: {e}")
            if conn:
                try:
                    conn.rollback()
                except:
                    pass
            raise
        finally:
            if conn:
                with self.lock:
                    self.used_connections.discard(conn)
                    if len(self.connections) < 3:  # 保持最少3个空闲连接
                        self.connections.append(conn)
                    else:
                        conn.close()
    
    def close_all(self):
        """关闭所有连接"""
        with self.lock:
            for conn in self.connections + list(self.used_connections):
                try:
                    conn.close()
                except:
                    pass
            self.connections.clear()
            self.used_connections.clear()

# 全局连接池实例
db_pool = DatabaseConnectionPool()

class QueryOptimizer:
    """查询优化器"""
    
    @staticmethod
    def add_indexes():
        """添加数据库索引以提高查询性能"""
        indexes = [
            # 用户表索引
            "CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)",
            
            # 笔记表索引
            "CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id)",
            "CREATE INDEX IF NOT EXISTS idx_notes_created_at ON notes(created_at)",
            "CREATE INDEX IF NOT EXISTS idx_notes_updated_at ON notes(updated_at)",
            "CREATE INDEX IF NOT EXISTS idx_notes_title ON notes(title)",
            
            # 文件夹表索引
            "CREATE INDEX IF NOT EXISTS idx_folders_user_id ON folders(user_id)",
            "CREATE INDEX IF NOT EXISTS idx_folders_parent_id ON folders(parent_id)",
            
            # 待办事项表索引
            "CREATE INDEX IF NOT EXISTS idx_todos_user_id ON todos(user_id)",
            "CREATE INDEX IF NOT EXISTS idx_todos_completed ON todos(completed)",
            "CREATE INDEX IF NOT EXISTS idx_todos_due_date ON todos(due_date)",
            
            # 聊天会话表索引
            "CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON chat_sessions(user_id)",
            "CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id)",
            
            # 版本历史表索引
            "CREATE INDEX IF NOT EXISTS idx_note_versions_note_id ON note_versions(note_id)",
            "CREATE INDEX IF NOT EXISTS idx_note_versions_created_at ON note_versions(created_at)",
            
            # 项目管理表索引
            "CREATE INDEX IF NOT EXISTS idx_boards_user_id ON boards(user_id)",
            "CREATE INDEX IF NOT EXISTS idx_board_lists_board_id ON board_lists(board_id)",
            "CREATE INDEX IF NOT EXISTS idx_board_cards_list_id ON board_cards(list_id)",
        ]
        
        with db_pool.get_connection() as conn:
            for index_sql in indexes:
                try:
                    conn.execute(index_sql)
                    logger.info(f"索引创建成功: {index_sql.split('ON')[1].split('(')[0]}")
                except Exception as e:
                    logger.warning(f"索引创建失败: {e}")
    
    @staticmethod
    def analyze_database():
        """分析数据库以优化查询计划"""
        with db_pool.get_connection() as conn:
            try:
                conn.execute("ANALYZE")
                logger.info("数据库分析完成")
            except Exception as e:
                logger.error(f"数据库分析失败: {e}")
    
    @staticmethod
    def vacuum_database():
        """清理数据库碎片"""
        with db_pool.get_connection() as conn:
            try:
                conn.execute("VACUUM")
                logger.info("数据库清理完成")
            except Exception as e:
                logger.error(f"数据库清理失败: {e}")

class CacheManager:
    """简单的内存缓存管理器"""
    
    def __init__(self, max_size=1000, ttl=300):  # 5分钟TTL
        self.cache = {}
        self.max_size = max_size
        self.ttl = ttl
        self.lock = threading.Lock()
    
    def get(self, key: str) -> Optional[Any]:
        """获取缓存值"""
        with self.lock:
            if key in self.cache:
                value, timestamp = self.cache[key]
                if time.time() - timestamp < self.ttl:
                    return value
                else:
                    del self.cache[key]
            return None
    
    def set(self, key: str, value: Any):
        """设置缓存值"""
        with self.lock:
            if len(self.cache) >= self.max_size:
                # 删除最旧的缓存项
                oldest_key = min(self.cache.keys(), 
                               key=lambda k: self.cache[k][1])
                del self.cache[oldest_key]
            
            self.cache[key] = (value, time.time())
    
    def delete(self, key: str):
        """删除缓存值"""
        with self.lock:
            self.cache.pop(key, None)
    
    def clear(self):
        """清空缓存"""
        with self.lock:
            self.cache.clear()
    
    def clear_pattern(self, pattern: str):
        """清除匹配模式的缓存"""
        with self.lock:
            keys_to_delete = [k for k in self.cache.keys() if pattern in k]
            for key in keys_to_delete:
                del self.cache[key]

# 全局缓存实例
cache_manager = CacheManager()

class OptimizedDatabase:
    """优化的数据库操作类"""
    
    @staticmethod
    def get_user_notes_optimized(user_id: str, folder_id: Optional[str] = None, 
                               limit: int = 50, offset: int = 0) -> List[Dict]:
        """优化的获取用户笔记方法"""
        cache_key = f"user_notes_{user_id}_{folder_id}_{limit}_{offset}"
        
        # 尝试从缓存获取
        cached_result = cache_manager.get(cache_key)
        if cached_result:
            return cached_result
        
        with db_pool.get_connection() as conn:
            if folder_id:
                query = """
                    SELECT n.*, f.name as folder_name 
                    FROM notes n
                    LEFT JOIN folders f ON n.folder_id = f.id
                    WHERE n.user_id = ? AND n.folder_id = ?
                    ORDER BY n.updated_at DESC
                    LIMIT ? OFFSET ?
                """
                params = (user_id, folder_id, limit, offset)
            else:
                query = """
                    SELECT n.*, f.name as folder_name 
                    FROM notes n
                    LEFT JOIN folders f ON n.folder_id = f.id
                    WHERE n.user_id = ?
                    ORDER BY n.updated_at DESC
                    LIMIT ? OFFSET ?
                """
                params = (user_id, limit, offset)
            
            cursor = conn.execute(query, params)
            notes = [dict(row) for row in cursor.fetchall()]
            
            # 缓存结果
            cache_manager.set(cache_key, notes)
            
            return notes
    
    @staticmethod
    def create_note_optimized(user_id: str, title: str, content: str, 
                            folder_id: Optional[str] = None) -> str:
        """优化的创建笔记方法"""
        note_id = str(uuid.uuid4())
        now = datetime.now().isoformat()
        
        with db_pool.get_connection() as conn:
            conn.execute("""
                INSERT INTO notes (id, title, content, folder_id, user_id, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (note_id, title, content, folder_id, user_id, now, now))
            
            # 清除相关缓存
            cache_manager.clear_pattern(f"user_notes_{user_id}")
            
            return note_id
    
    @staticmethod
    def update_note_optimized(note_id: str, user_id: str, **updates) -> bool:
        """优化的更新笔记方法"""
        if not updates:
            return False
        
        # 构建动态更新查询
        set_clauses = []
        params = []
        
        for field, value in updates.items():
            if field in ['title', 'content', 'folder_id', 'tags']:
                set_clauses.append(f"{field} = ?")
                params.append(value)
        
        if not set_clauses:
            return False
        
        set_clauses.append("updated_at = ?")
        params.append(datetime.now().isoformat())
        params.extend([note_id, user_id])
        
        query = f"""
            UPDATE notes 
            SET {', '.join(set_clauses)}
            WHERE id = ? AND user_id = ?
        """
        
        with db_pool.get_connection() as conn:
            cursor = conn.execute(query, params)
            
            if cursor.rowcount > 0:
                # 清除相关缓存
                cache_manager.clear_pattern(f"user_notes_{user_id}")
                cache_manager.delete(f"note_{note_id}")
                return True
            
            return False

# 性能监控装饰器
def monitor_performance(func):
    """性能监控装饰器"""
    def wrapper(*args, **kwargs):
        start_time = time.time()
        try:
            result = func(*args, **kwargs)
            execution_time = time.time() - start_time
            
            if execution_time > 1.0:  # 超过1秒的查询记录警告
                logger.warning(f"慢查询警告: {func.__name__} 耗时 {execution_time:.2f}秒")
            
            return result
        except Exception as e:
            execution_time = time.time() - start_time
            logger.error(f"查询错误: {func.__name__} 耗时 {execution_time:.2f}秒, 错误: {e}")
            raise
    
    return wrapper

def init_optimized_database():
    """初始化优化的数据库"""
    logger.info("开始初始化优化数据库...")
    
    # 执行原始的数据库初始化
    from database_sqlite import init_database
    init_database()
    
    # 添加索引
    QueryOptimizer.add_indexes()
    
    # 分析数据库
    QueryOptimizer.analyze_database()
    
    logger.info("优化数据库初始化完成")

# 清理函数
def cleanup_database():
    """清理数据库资源"""
    db_pool.close_all()
    cache_manager.clear()
    logger.info("数据库资源清理完成")