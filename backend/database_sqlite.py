import sqlite3
import uuid
from datetime import datetime
from typing import Optional, List
import json

DATABASE_PATH = "notebook.db"

def init_database():
    """初始化SQLite数据库和表"""
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    
    # 创建用户表
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            full_name TEXT,
            openrouter_api_key TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )
    ''')
    
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
    
    conn.commit()
    conn.close()

def get_connection():
    """获取数据库连接"""
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row  # 使返回结果可以像字典一样访问
    return conn

class SQLiteUserRepository:
    """用户数据操作类"""
    
    def create_user(self, email: str, password_hash: str, full_name: Optional[str] = None) -> dict:
        """创建新用户"""
        conn = get_connection()
        cursor = conn.cursor()
        
        user_id = str(uuid.uuid4())
        now = datetime.utcnow().isoformat() + 'Z'  # 添加UTC时区标识
        
        cursor.execute('''
            INSERT INTO users (id, email, password_hash, full_name, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (user_id, email, password_hash, full_name, now, now))
        
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
            if field in ['full_name', 'openrouter_api_key']:
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
