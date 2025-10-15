import sqlite3
import uuid
from datetime import datetime
from typing import Optional, List
import json

DATABASE_PATH = "notebook.db"

def init_database():
    """初始化SQLite数据库和表"""
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row  # 使返回结果可以像字典一样访问
    cursor = conn.cursor()
    
    # 创建用户表
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            full_name TEXT,
            role TEXT DEFAULT 'user' NOT NULL,
            openrouter_api_key TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )
    ''')

    # 为已存在的users表添加role列（如果不存在）
    try:
        cursor.execute("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user' NOT NULL")
    except sqlite3.OperationalError:
        # 列已存在，忽略错误
        pass
    
    # 创建笔记表
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS notes (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            content TEXT,
            tags TEXT,  -- JSON格式存储标签数组
            user_id TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        )
    ''')
    
    # 创建聊天会话表
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS chat_sessions (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            model TEXT NOT NULL,
            user_id TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        )
    ''')
    
    # 创建聊天消息表
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS chat_messages (
            id TEXT PRIMARY KEY,
            session_id TEXT NOT NULL,
            content TEXT NOT NULL,
            role TEXT NOT NULL,
            created_at TEXT NOT NULL,
            FOREIGN KEY (session_id) REFERENCES chat_sessions (id) ON DELETE CASCADE
        )
    ''')
    
    # 创建项目看板表
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS boards (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT,
            color TEXT DEFAULT '#3b82f6',
            user_id TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        )
    ''')
    
    # 创建看板列表表
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS lists (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            position INTEGER DEFAULT 0,
            board_id TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (board_id) REFERENCES boards (id) ON DELETE CASCADE
        )
    ''')
    
    # 创建任务卡片表
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS cards (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            description TEXT,
            priority TEXT DEFAULT 'medium',
            due_date TEXT,
            assignee TEXT,
            tags TEXT,  -- JSON格式存储标签数组
            position INTEGER DEFAULT 0,
            list_id TEXT NOT NULL,
            completed BOOLEAN DEFAULT 0,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (list_id) REFERENCES lists (id) ON DELETE CASCADE
        )
    ''')
    
    # 创建卡片评论表
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS card_comments (
            id TEXT PRIMARY KEY,
            card_id TEXT NOT NULL,
            content TEXT NOT NULL,
            user_id TEXT NOT NULL,
            created_at TEXT NOT NULL,
            FOREIGN KEY (card_id) REFERENCES cards (id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        )
    ''')

    # 创建全文搜索虚拟表（FTS5）
    cursor.execute('''
        CREATE VIRTUAL TABLE IF NOT EXISTS notes_fts USING fts5(
            note_id UNINDEXED,
            title,
            content,
            user_id UNINDEXED,
            tokenize = 'porter unicode61'
        )
    ''')

    # 创建触发器：插入笔记时同步到FTS表
    cursor.execute('''
        CREATE TRIGGER IF NOT EXISTS notes_ai AFTER INSERT ON notes BEGIN
            INSERT INTO notes_fts(note_id, title, content, user_id)
            VALUES (new.id, new.title, new.content, new.user_id);
        END
    ''')

    # 创建触发器：更新笔记时同步到FTS表
    cursor.execute('''
        CREATE TRIGGER IF NOT EXISTS notes_au AFTER UPDATE ON notes BEGIN
            UPDATE notes_fts SET title = new.title, content = new.content
            WHERE note_id = new.id;
        END
    ''')

    # 创建触发器：删除笔记时从FTS表删除
    cursor.execute('''
        CREATE TRIGGER IF NOT EXISTS notes_ad AFTER DELETE ON notes BEGIN
            DELETE FROM notes_fts WHERE note_id = old.id;
        END
    ''')

    # ===== RBAC多身份用户系统 =====

    # 创建角色表
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS roles (
            id TEXT PRIMARY KEY,
            name TEXT UNIQUE NOT NULL,
            display_name TEXT NOT NULL,
            description TEXT,
            level INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )
    ''')

    # 创建权限表
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS permissions (
            id TEXT PRIMARY KEY,
            name TEXT UNIQUE NOT NULL,
            display_name TEXT NOT NULL,
            resource TEXT NOT NULL,
            action TEXT NOT NULL,
            description TEXT,
            created_at TEXT NOT NULL
        )
    ''')

    # 创建角色-权限关联表（多对多）
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS role_permissions (
            role_id TEXT NOT NULL,
            permission_id TEXT NOT NULL,
            created_at TEXT NOT NULL,
            PRIMARY KEY (role_id, permission_id),
            FOREIGN KEY (role_id) REFERENCES roles (id) ON DELETE CASCADE,
            FOREIGN KEY (permission_id) REFERENCES permissions (id) ON DELETE CASCADE
        )
    ''')

    # 创建用户-角色关联表（多对多，支持用户拥有多个角色）
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS user_roles (
            user_id TEXT NOT NULL,
            role_id TEXT NOT NULL,
            assigned_at TEXT NOT NULL,
            assigned_by TEXT,
            expires_at TEXT,
            PRIMARY KEY (user_id, role_id),
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
            FOREIGN KEY (role_id) REFERENCES roles (id) ON DELETE CASCADE
        )
    ''')

    # 创建用户自定义权限表（特殊情况下直接授予用户权限）
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS user_permissions (
            user_id TEXT NOT NULL,
            permission_id TEXT NOT NULL,
            granted_at TEXT NOT NULL,
            granted_by TEXT,
            expires_at TEXT,
            PRIMARY KEY (user_id, permission_id),
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
            FOREIGN KEY (permission_id) REFERENCES permissions (id) ON DELETE CASCADE
        )
    ''')

    # 初始化默认角色和权限
    now = datetime.utcnow().isoformat() + 'Z'

    # 插入默认角色（如果不存在）
    default_roles = [
        ('super_admin', '超级管理员', '拥有系统所有权限', 100),
        ('admin', '管理员', '管理用户和系统配置', 80),
        ('editor', '编辑', '创建和编辑所有内容', 60),
        ('collaborator', '协作者', '查看和评论共享内容', 40),
        ('user', '普通用户', '管理自己的笔记和待办', 20),
        ('guest', '访客', '只读权限', 10)
    ]

    for role_name, display_name, description, level in default_roles:
        role_id = str(uuid.uuid4())
        cursor.execute('''
            INSERT OR IGNORE INTO roles (id, name, display_name, description, level, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (role_id, role_name, display_name, description, level, now, now))

    # 插入默认权限
    default_permissions = [
        # 笔记权限
        ('notes.create', '创建笔记', 'notes', 'create', '创建新笔记'),
        ('notes.read', '查看笔记', 'notes', 'read', '查看笔记内容'),
        ('notes.update', '编辑笔记', 'notes', 'update', '编辑笔记内容'),
        ('notes.delete', '删除笔记', 'notes', 'delete', '删除笔记'),
        ('notes.share', '分享笔记', 'notes', 'share', '分享笔记给其他用户'),

        # 待办权限
        ('todos.create', '创建待办', 'todos', 'create', '创建新待办事项'),
        ('todos.read', '查看待办', 'todos', 'read', '查看待办事项'),
        ('todos.update', '编辑待办', 'todos', 'update', '编辑待办事项'),
        ('todos.delete', '删除待办', 'todos', 'delete', '删除待办事项'),

        # 项目权限
        ('projects.create', '创建项目', 'projects', 'create', '创建新项目'),
        ('projects.read', '查看项目', 'projects', 'read', '查看项目内容'),
        ('projects.update', '编辑项目', 'projects', 'update', '编辑项目内容'),
        ('projects.delete', '删除项目', 'projects', 'delete', '删除项目'),

        # 用户管理权限
        ('users.create', '创建用户', 'users', 'create', '创建新用户账号'),
        ('users.read', '查看用户', 'users', 'read', '查看用户信息'),
        ('users.update', '编辑用户', 'users', 'update', '编辑用户信息'),
        ('users.delete', '删除用户', 'users', 'delete', '删除用户账号'),

        # 角色权限管理
        ('roles.manage', '管理角色', 'roles', 'manage', '管理系统角色和权限'),

        # 系统配置权限
        ('system.config', '系统配置', 'system', 'config', '修改系统配置'),
        ('system.stats', '系统统计', 'system', 'stats', '查看系统统计信息'),
    ]

    for perm_name, display_name, resource, action, description in default_permissions:
        perm_id = str(uuid.uuid4())
        cursor.execute('''
            INSERT OR IGNORE INTO permissions (id, name, display_name, resource, action, description, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (perm_id, perm_name, display_name, resource, action, description, now))

    # 为默认角色分配权限
    # 获取角色和权限ID
    cursor.execute('SELECT id, name FROM roles')
    roles_map = {row['name']: row['id'] for row in cursor.fetchall()}

    cursor.execute('SELECT id, name FROM permissions')
    perms_map = {row['name']: row['id'] for row in cursor.fetchall()}

    # 超级管理员 - 所有权限
    if 'super_admin' in roles_map:
        for perm_id in perms_map.values():
            cursor.execute('''
                INSERT OR IGNORE INTO role_permissions (role_id, permission_id, created_at)
                VALUES (?, ?, ?)
            ''', (roles_map['super_admin'], perm_id, now))

    # 管理员 - 除系统配置外的大部分权限
    if 'admin' in roles_map:
        admin_perms = ['users.create', 'users.read', 'users.update', 'users.delete',
                       'notes.read', 'todos.read', 'projects.read', 'system.stats']
        for perm_name in admin_perms:
            if perm_name in perms_map:
                cursor.execute('''
                    INSERT OR IGNORE INTO role_permissions (role_id, permission_id, created_at)
                    VALUES (?, ?, ?)
                ''', (roles_map['admin'], perms_map[perm_name], now))

    # 编辑 - 内容创建和编辑权限
    if 'editor' in roles_map:
        editor_perms = ['notes.create', 'notes.read', 'notes.update', 'notes.delete', 'notes.share',
                        'todos.create', 'todos.read', 'todos.update', 'todos.delete',
                        'projects.create', 'projects.read', 'projects.update', 'projects.delete']
        for perm_name in editor_perms:
            if perm_name in perms_map:
                cursor.execute('''
                    INSERT OR IGNORE INTO role_permissions (role_id, permission_id, created_at)
                    VALUES (?, ?, ?)
                ''', (roles_map['editor'], perms_map[perm_name], now))

    # 协作者 - 查看和分享权限
    if 'collaborator' in roles_map:
        collab_perms = ['notes.read', 'notes.share', 'todos.read', 'projects.read']
        for perm_name in collab_perms:
            if perm_name in perms_map:
                cursor.execute('''
                    INSERT OR IGNORE INTO role_permissions (role_id, permission_id, created_at)
                    VALUES (?, ?, ?)
                ''', (roles_map['collaborator'], perms_map[perm_name], now))

    # 普通用户 - 基础CRUD权限
    if 'user' in roles_map:
        user_perms = ['notes.create', 'notes.read', 'notes.update', 'notes.delete',
                      'todos.create', 'todos.read', 'todos.update', 'todos.delete',
                      'projects.create', 'projects.read', 'projects.update', 'projects.delete']
        for perm_name in user_perms:
            if perm_name in perms_map:
                cursor.execute('''
                    INSERT OR IGNORE INTO role_permissions (role_id, permission_id, created_at)
                    VALUES (?, ?, ?)
                ''', (roles_map['user'], perms_map[perm_name], now))

    # 访客 - 只读权限
    if 'guest' in roles_map:
        guest_perms = ['notes.read', 'todos.read', 'projects.read']
        for perm_name in guest_perms:
            if perm_name in perms_map:
                cursor.execute('''
                    INSERT OR IGNORE INTO role_permissions (role_id, permission_id, created_at)
                    VALUES (?, ?, ?)
                ''', (roles_map['guest'], perms_map[perm_name], now))

    # 迁移现有用户到新系统
    # 将所有现有用户添加到user_roles表
    cursor.execute('SELECT id, role FROM users')
    existing_users = cursor.fetchall()

    for user_row in existing_users:
        user_id = user_row['id']
        old_role = user_row['role']

        # 根据旧角色分配新角色
        role_name = old_role if old_role in roles_map else 'user'
        if role_name in roles_map:
            cursor.execute('''
                INSERT OR IGNORE INTO user_roles (user_id, role_id, assigned_at)
                VALUES (?, ?, ?)
            ''', (user_id, roles_map[role_name], now))

    conn.commit()
    conn.close()

def get_connection():
    """获取数据库连接"""
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row  # 使返回结果可以像字典一样访问
    return conn

class SQLiteUserRepository:
    """用户数据操作类"""
    
    def create_user(self, email: str, password_hash: str, full_name: Optional[str] = None, role: str = 'user') -> dict:
        """创建新用户"""
        conn = get_connection()
        cursor = conn.cursor()

        user_id = str(uuid.uuid4())
        now = datetime.utcnow().isoformat() + 'Z'  # 添加UTC时区标识

        cursor.execute('''
            INSERT INTO users (id, email, password_hash, full_name, role, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (user_id, email, password_hash, full_name, role, now, now))

        conn.commit()

        # 获取创建的用户
        cursor.execute('SELECT * FROM users WHERE id = ?', (user_id,))
        user_row = cursor.fetchone()
        conn.close()

        return dict(user_row)
    
    def get_user_by_email(self, email: str) -> Optional[dict]:
        """根据邮箱获取用户"""
        conn = get_connection()
        cursor = conn.cursor()
        
        cursor.execute('SELECT * FROM users WHERE email = ?', (email,))
        user_row = cursor.fetchone()
        conn.close()
        
        return dict(user_row) if user_row else None
    
    def get_user_by_id(self, user_id: str) -> Optional[dict]:
        """根据ID获取用户"""
        conn = get_connection()
        cursor = conn.cursor()
        
        cursor.execute('SELECT * FROM users WHERE id = ?', (user_id,))
        user_row = cursor.fetchone()
        conn.close()
        
        return dict(user_row) if user_row else None
    
    def update_user(self, user_id: str, **kwargs) -> Optional[dict]:
        """更新用户信息"""
        conn = get_connection()
        cursor = conn.cursor()
        
        # 构建更新语句
        update_fields = []
        values = []
        
        for field, value in kwargs.items():
            if field in ['full_name', 'openrouter_api_key', 'role']:
                update_fields.append(f'{field} = ?')
                values.append(value)
        
        if not update_fields:
            conn.close()
            return self.get_user_by_id(user_id)
        
        update_fields.append('updated_at = ?')
        values.append(datetime.utcnow().isoformat() + 'Z')  # 添加UTC时区标识
        values.append(user_id)
        
        cursor.execute(f'''
            UPDATE users SET {', '.join(update_fields)}
            WHERE id = ?
        ''', values)
        
        conn.commit()
        conn.close()

        return self.get_user_by_id(user_id)

    def get_all_users(self) -> List[dict]:
        """获取所有用户（管理员功能）"""
        conn = get_connection()
        cursor = conn.cursor()

        cursor.execute('SELECT * FROM users ORDER BY created_at DESC')
        users = []
        for row in cursor.fetchall():
            users.append(dict(row))

        conn.close()
        return users

    def get_user_stats(self, user_id: str) -> dict:
        """获取用户统计信息（笔记数、待办数等）"""
        conn = get_connection()
        cursor = conn.cursor()

        stats = {'notes_count': 0, 'todos_count': 0}

        # 统计笔记数
        cursor.execute('SELECT COUNT(*) as count FROM notes WHERE user_id = ?', (user_id,))
        result = cursor.fetchone()
        stats['notes_count'] = result['count'] if result else 0

        # 统计待办数（如果有todos表）
        try:
            cursor.execute('SELECT COUNT(*) as count FROM todos WHERE user_id = ?', (user_id,))
            result = cursor.fetchone()
            stats['todos_count'] = result['count'] if result else 0
        except sqlite3.OperationalError:
            pass

        conn.close()
        return stats

    def delete_user(self, user_id: str) -> bool:
        """删除用户（管理员功能，会级联删除用户的所有数据）"""
        conn = get_connection()
        cursor = conn.cursor()

        cursor.execute('DELETE FROM users WHERE id = ?', (user_id,))
        deleted = cursor.rowcount > 0

        conn.commit()
        conn.close()

        return deleted

class SQLiteNotesRepository:
    """笔记数据操作类"""
    
    def create_note(self, title: str, content: str, tags: List[str], user_id: str) -> dict:
        """创建新笔记"""
        conn = get_connection()
        cursor = conn.cursor()
        
        note_id = str(uuid.uuid4())
        now = datetime.utcnow().isoformat() + 'Z'  # 添加UTC时区标识
        tags_json = json.dumps(tags)
        
        cursor.execute('''
            INSERT INTO notes (id, title, content, tags, user_id, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (note_id, title, content, tags_json, user_id, now, now))
        
        conn.commit()
        
        # 获取创建的笔记
        cursor.execute('SELECT * FROM notes WHERE id = ?', (note_id,))
        note_row = cursor.fetchone()
        conn.close()
        
        note_dict = dict(note_row)
        note_dict['tags'] = json.loads(note_dict['tags'])
        return note_dict
    
    def get_notes_by_user(self, user_id: str) -> List[dict]:
        """获取用户的所有笔记"""
        conn = get_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT * FROM notes WHERE user_id = ?
            ORDER BY updated_at DESC
        ''', (user_id,))
        
        notes = []
        for row in cursor.fetchall():
            note_dict = dict(row)
            note_dict['tags'] = json.loads(note_dict['tags'])
            notes.append(note_dict)
        
        conn.close()
        return notes
    
    def get_note_by_id(self, note_id: str, user_id: str) -> Optional[dict]:
        """获取指定笔记"""
        conn = get_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT * FROM notes WHERE id = ? AND user_id = ?
        ''', (note_id, user_id))
        
        note_row = cursor.fetchone()
        conn.close()
        
        if note_row:
            note_dict = dict(note_row)
            note_dict['tags'] = json.loads(note_dict['tags'])
            return note_dict
        return None
    
    def update_note(self, note_id: str, user_id: str, **kwargs) -> Optional[dict]:
        """更新笔记"""
        conn = get_connection()
        cursor = conn.cursor()
        
        # 构建更新语句
        update_fields = []
        values = []
        
        for field, value in kwargs.items():
            if field == 'tags':
                update_fields.append('tags = ?')
                values.append(json.dumps(value))
            elif field in ['title', 'content']:
                update_fields.append(f'{field} = ?')
                values.append(value)
        
        if not update_fields:
            return self.get_note_by_id(note_id, user_id)
        
        update_fields.append('updated_at = ?')
        values.append(datetime.utcnow().isoformat() + 'Z')  # 添加UTC时区标识
        values.extend([note_id, user_id])
        
        cursor.execute(f'''
            UPDATE notes SET {', '.join(update_fields)}
            WHERE id = ? AND user_id = ?
        ''', values)
        
        conn.commit()
        conn.close()
        
        return self.get_note_by_id(note_id, user_id)
    
    def delete_note(self, note_id: str, user_id: str) -> bool:
        """删除笔记"""
        conn = get_connection()
        cursor = conn.cursor()

        cursor.execute('''
            DELETE FROM notes WHERE id = ? AND user_id = ?
        ''', (note_id, user_id))

        deleted = cursor.rowcount > 0
        conn.commit()
        conn.close()

        return deleted

    def search_notes(self, user_id: str, query: str, limit: int = 50) -> List[dict]:
        """全文搜索笔记"""
        if not query or not query.strip():
            return []

        conn = get_connection()
        cursor = conn.cursor()

        # 使用FTS5搜索，并通过JOIN获取完整笔记信息
        # 使用MATCH进行全文搜索，支持AND、OR、NOT等操作符
        cursor.execute('''
            SELECT
                n.*,
                bm25(notes_fts) as rank
            FROM notes_fts
            JOIN notes n ON notes_fts.note_id = n.id
            WHERE notes_fts MATCH ? AND notes_fts.user_id = ?
            ORDER BY rank
            LIMIT ?
        ''', (query, user_id, limit))

        notes = []
        for row in cursor.fetchall():
            note_dict = dict(row)
            # 移除rank字段
            if 'rank' in note_dict:
                del note_dict['rank']
            note_dict['tags'] = json.loads(note_dict['tags'])
            notes.append(note_dict)

        conn.close()
        return notes

    def advanced_search(self, user_id: str, query: str, filters: dict, sort_by: str = 'updated_at', sort_order: str = 'desc', limit: int = 50) -> List[dict]:
        """
        高级搜索：结合全文搜索和过滤条件
        filters可包含：tags, folder_id, date_from, date_to
        """
        if not query or not query.strip():
            return self.filter_notes(user_id, filters, sort_by, sort_order, limit)

        conn = get_connection()
        cursor = conn.cursor()

        # 构建WHERE子句
        where_conditions = ["notes_fts MATCH ?", "notes_fts.user_id = ?"]
        params = [query, user_id]

        # 添加日期范围过滤
        if 'date_from' in filters:
            where_conditions.append("n.updated_at >= ?")
            params.append(filters['date_from'])

        if 'date_to' in filters:
            where_conditions.append("n.updated_at <= ?")
            params.append(filters['date_to'])

        # 添加文件夹过滤
        if 'folder_id' in filters:
            where_conditions.append("n.folder_id = ?")
            params.append(filters['folder_id'])

        where_clause = " AND ".join(where_conditions)

        # 构建排序子句（验证字段名防止SQL注入）
        allowed_sort_fields = ['updated_at', 'created_at', 'title']
        if sort_by not in allowed_sort_fields:
            sort_by = 'updated_at'

        sort_order = 'DESC' if sort_order.lower() == 'desc' else 'ASC'
        order_clause = f"ORDER BY n.{sort_by} {sort_order}"

        # 如果按相关度排序，使用bm25
        if sort_by == 'updated_at' and sort_order == 'DESC':
            order_clause = "ORDER BY bm25(notes_fts)"

        params.append(limit)

        # 执行查询
        sql = f'''
            SELECT
                n.*,
                bm25(notes_fts) as rank
            FROM notes_fts
            JOIN notes n ON notes_fts.note_id = n.id
            WHERE {where_clause}
            {order_clause}
            LIMIT ?
        '''

        cursor.execute(sql, params)

        notes = []
        for row in cursor.fetchall():
            note_dict = dict(row)
            if 'rank' in note_dict:
                del note_dict['rank']
            note_dict['tags'] = json.loads(note_dict['tags'])

            # 标签过滤（在Python层面处理）
            if 'tags' in filters and filters['tags']:
                note_tags_set = set(note_dict['tags'])
                filter_tags_set = set(filters['tags'])
                if not filter_tags_set.intersection(note_tags_set):
                    continue

            notes.append(note_dict)

        conn.close()
        return notes[:limit]  # 确保不超过限制

    def filter_notes(self, user_id: str, filters: dict, sort_by: str = 'updated_at', sort_order: str = 'desc', limit: int = 50) -> List[dict]:
        """
        按条件过滤笔记（不使用全文搜索）
        filters可包含：tags, folder_id, date_from, date_to
        """
        conn = get_connection()
        cursor = conn.cursor()

        # 构建WHERE子句
        where_conditions = ["user_id = ?"]
        params = [user_id]

        # 添加日期范围过滤
        if 'date_from' in filters:
            where_conditions.append("updated_at >= ?")
            params.append(filters['date_from'])

        if 'date_to' in filters:
            where_conditions.append("updated_at <= ?")
            params.append(filters['date_to'])

        # 添加文件夹过滤
        if 'folder_id' in filters:
            where_conditions.append("folder_id = ?")
            params.append(filters['folder_id'])

        where_clause = " AND ".join(where_conditions)

        # 构建排序子句
        allowed_sort_fields = ['updated_at', 'created_at', 'title']
        if sort_by not in allowed_sort_fields:
            sort_by = 'updated_at'

        sort_order = 'DESC' if sort_order.lower() == 'desc' else 'ASC'
        order_clause = f"ORDER BY {sort_by} {sort_order}"

        params.append(limit)

        # 执行查询
        cursor.execute(f'''
            SELECT * FROM notes
            WHERE {where_clause}
            {order_clause}
            LIMIT ?
        ''', params)

        notes = []
        for row in cursor.fetchall():
            note_dict = dict(row)
            note_dict['tags'] = json.loads(note_dict['tags'])

            # 标签过滤
            if 'tags' in filters and filters['tags']:
                note_tags_set = set(note_dict['tags'])
                filter_tags_set = set(filters['tags'])
                if not filter_tags_set.intersection(note_tags_set):
                    continue

            notes.append(note_dict)

        conn.close()
        return notes[:limit]

class SQLiteBoardRepository:
    """看板数据操作类"""
    
    def create_board(self, name: str, description: Optional[str], color: str, user_id: str) -> dict:
        """创建新看板"""
        conn = get_connection()
        cursor = conn.cursor()
        
        board_id = str(uuid.uuid4())
        now = datetime.utcnow().isoformat() + 'Z'
        
        cursor.execute('''
            INSERT INTO boards (id, name, description, color, user_id, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (board_id, name, description, color, user_id, now, now))
        
        conn.commit()
        conn.close()
        
        return self.get_board_by_id(board_id, user_id)
    
    def get_boards_by_user(self, user_id: str) -> List[dict]:
        """获取用户的所有看板"""
        conn = get_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT * FROM boards WHERE user_id = ?
            ORDER BY updated_at DESC
        ''', (user_id,))
        
        boards = [dict(row) for row in cursor.fetchall()]
        conn.close()
        return boards
    
    def get_board_by_id(self, board_id: str, user_id: str) -> Optional[dict]:
        """获取指定看板"""
        conn = get_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT * FROM boards WHERE id = ? AND user_id = ?
        ''', (board_id, user_id))
        
        board_row = cursor.fetchone()
        conn.close()
        
        return dict(board_row) if board_row else None
    
    def get_board_with_data(self, board_id: str, user_id: str) -> Optional[dict]:
        """获取看板及其完整数据（包含列表和卡片）"""
        board = self.get_board_by_id(board_id, user_id)
        if not board:
            return None
        
        conn = get_connection()
        cursor = conn.cursor()
        
        # 获取看板的所有列表
        cursor.execute('''
            SELECT * FROM lists WHERE board_id = ?
            ORDER BY position ASC
        ''', (board_id,))
        
        lists = []
        for list_row in cursor.fetchall():
            list_dict = dict(list_row)
            
            # 获取列表的所有卡片
            cursor.execute('''
                SELECT * FROM cards WHERE list_id = ?
                ORDER BY position ASC
            ''', (list_dict['id'],))
            
            cards = []
            for card_row in cursor.fetchall():
                card_dict = dict(card_row)
                card_dict['tags'] = json.loads(card_dict['tags']) if card_dict['tags'] else []
                card_dict['completed'] = bool(card_dict['completed'])
                cards.append(card_dict)
            
            list_dict['cards'] = cards
            lists.append(list_dict)
        
        conn.close()
        board['lists'] = lists
        return board
    
    def update_board(self, board_id: str, user_id: str, **kwargs) -> Optional[dict]:
        """更新看板"""
        conn = get_connection()
        cursor = conn.cursor()
        
        update_fields = []
        values = []
        
        for field, value in kwargs.items():
            if field in ['name', 'description', 'color']:
                update_fields.append(f'{field} = ?')
                values.append(value)
        
        if not update_fields:
            return self.get_board_by_id(board_id, user_id)
        
        update_fields.append('updated_at = ?')
        values.append(datetime.utcnow().isoformat() + 'Z')
        values.extend([board_id, user_id])
        
        cursor.execute(f'''
            UPDATE boards SET {', '.join(update_fields)}
            WHERE id = ? AND user_id = ?
        ''', values)
        
        conn.commit()
        conn.close()
        
        return self.get_board_by_id(board_id, user_id)
    
    def delete_board(self, board_id: str, user_id: str) -> bool:
        """删除看板"""
        conn = get_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            DELETE FROM boards WHERE id = ? AND user_id = ?
        ''', (board_id, user_id))
        
        deleted = cursor.rowcount > 0
        conn.commit()
        conn.close()
        
        return deleted

class SQLiteListRepository:
    """列表数据操作类"""
    
    def create_list(self, title: str, position: int, board_id: str) -> dict:
        """创建新列表"""
        conn = get_connection()
        cursor = conn.cursor()
        
        list_id = str(uuid.uuid4())
        now = datetime.utcnow().isoformat() + 'Z'
        
        cursor.execute('''
            INSERT INTO lists (id, title, position, board_id, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (list_id, title, position, board_id, now, now))
        
        conn.commit()
        
        cursor.execute('SELECT * FROM lists WHERE id = ?', (list_id,))
        list_row = cursor.fetchone()
        conn.close()
        
        return dict(list_row)
    
    def update_list(self, list_id: str, **kwargs) -> Optional[dict]:
        """更新列表"""
        conn = get_connection()
        cursor = conn.cursor()
        
        update_fields = []
        values = []
        
        for field, value in kwargs.items():
            if field in ['title', 'position']:
                update_fields.append(f'{field} = ?')
                values.append(value)
        
        if not update_fields:
            return self.get_list_by_id(list_id)
        
        update_fields.append('updated_at = ?')
        values.append(datetime.utcnow().isoformat() + 'Z')
        values.append(list_id)
        
        cursor.execute(f'''
            UPDATE lists SET {', '.join(update_fields)}
            WHERE id = ?
        ''', values)
        
        conn.commit()
        conn.close()
        
        return self.get_list_by_id(list_id)
    
    def get_list_by_id(self, list_id: str) -> Optional[dict]:
        """获取指定列表"""
        conn = get_connection()
        cursor = conn.cursor()
        
        cursor.execute('SELECT * FROM lists WHERE id = ?', (list_id,))
        list_row = cursor.fetchone()
        conn.close()
        
        return dict(list_row) if list_row else None
    
    def delete_list(self, list_id: str) -> bool:
        """删除列表"""
        conn = get_connection()
        cursor = conn.cursor()
        
        cursor.execute('DELETE FROM lists WHERE id = ?', (list_id,))
        
        deleted = cursor.rowcount > 0
        conn.commit()
        conn.close()
        
        return deleted

class SQLiteCardRepository:
    """卡片数据操作类"""
    
    def create_card(self, title: str, description: Optional[str], priority: str, 
                   due_date: Optional[str], assignee: Optional[str], tags: List[str], 
                   position: int, list_id: str) -> dict:
        """创建新卡片"""
        conn = get_connection()
        cursor = conn.cursor()
        
        card_id = str(uuid.uuid4())
        now = datetime.utcnow().isoformat() + 'Z'
        tags_json = json.dumps(tags)
        
        cursor.execute('''
            INSERT INTO cards (id, title, description, priority, due_date, assignee, 
                             tags, position, list_id, completed, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (card_id, title, description, priority, due_date, assignee, 
              tags_json, position, list_id, False, now, now))
        
        conn.commit()
        
        cursor.execute('SELECT * FROM cards WHERE id = ?', (card_id,))
        card_row = cursor.fetchone()
        conn.close()
        
        card_dict = dict(card_row)
        card_dict['tags'] = json.loads(card_dict['tags'])
        card_dict['completed'] = bool(card_dict['completed'])
        return card_dict
    
    def update_card(self, card_id: str, **kwargs) -> Optional[dict]:
        """更新卡片"""
        conn = get_connection()
        cursor = conn.cursor()
        
        update_fields = []
        values = []
        
        for field, value in kwargs.items():
            if field == 'tags':
                update_fields.append('tags = ?')
                values.append(json.dumps(value))
            elif field in ['title', 'description', 'priority', 'due_date', 
                          'assignee', 'position', 'list_id', 'completed']:
                update_fields.append(f'{field} = ?')
                values.append(value)
        
        if not update_fields:
            return self.get_card_by_id(card_id)
        
        update_fields.append('updated_at = ?')
        values.append(datetime.utcnow().isoformat() + 'Z')
        values.append(card_id)
        
        cursor.execute(f'''
            UPDATE cards SET {', '.join(update_fields)}
            WHERE id = ?
        ''', values)
        
        conn.commit()
        conn.close()
        
        return self.get_card_by_id(card_id)
    
    def get_card_by_id(self, card_id: str) -> Optional[dict]:
        """获取指定卡片"""
        conn = get_connection()
        cursor = conn.cursor()
        
        cursor.execute('SELECT * FROM cards WHERE id = ?', (card_id,))
        card_row = cursor.fetchone()
        conn.close()
        
        if card_row:
            card_dict = dict(card_row)
            card_dict['tags'] = json.loads(card_dict['tags'])
            card_dict['completed'] = bool(card_dict['completed'])
            return card_dict
        return None
    
    def delete_card(self, card_id: str) -> bool:
        """删除卡片"""
        conn = get_connection()
        cursor = conn.cursor()
        
        cursor.execute('DELETE FROM cards WHERE id = ?', (card_id,))
        
        deleted = cursor.rowcount > 0
        conn.commit()
        conn.close()
        
        return deleted

class SQLiteCardCommentRepository:
    """卡片评论数据操作类"""
    
    def create_comment(self, card_id: str, content: str, user_id: str) -> dict:
        """创建新评论"""
        conn = get_connection()
        cursor = conn.cursor()
        
        comment_id = str(uuid.uuid4())
        now = datetime.utcnow().isoformat() + 'Z'
        
        cursor.execute('''
            INSERT INTO card_comments (id, card_id, content, user_id, created_at)
            VALUES (?, ?, ?, ?, ?)
        ''', (comment_id, card_id, content, user_id, now))
        
        conn.commit()
        
        cursor.execute('SELECT * FROM card_comments WHERE id = ?', (comment_id,))
        comment_row = cursor.fetchone()
        conn.close()
        
        return dict(comment_row)
    
    def get_comments_by_card(self, card_id: str) -> List[dict]:
        """获取卡片的所有评论"""
        conn = get_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT * FROM card_comments WHERE card_id = ?
            ORDER BY created_at ASC
        ''', (card_id,))
        
        comments = [dict(row) for row in cursor.fetchall()]
        conn.close()
        return comments

# 初始化数据库
init_database()

# 创建全局实例
user_repo = SQLiteUserRepository()
notes_repo = SQLiteNotesRepository()
board_repo = SQLiteBoardRepository()
list_repo = SQLiteListRepository()
card_repo = SQLiteCardRepository()
card_comment_repo = SQLiteCardCommentRepository()
