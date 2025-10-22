"""
Supabase数据库访问层
提供与SQLite版本相同的接口,便于迁移
"""

from supabase import create_client, Client
from supabase.lib.client_options import ClientOptions
from config import settings
from typing import Optional, List, Dict, Any
from datetime import datetime
import json

# 全局Supabase客户端
_supabase_client: Optional[Client] = None

def get_supabase_client() -> Client:
    """获取或创建Supabase客户端单例"""
    global _supabase_client

    if _supabase_client is None:
        options = ClientOptions(
            postgrest_client_timeout=60,
            storage_client_timeout=60
        )
        _supabase_client = create_client(
            settings.SUPABASE_URL,
            settings.SUPABASE_SERVICE_ROLE_KEY,
            options=options
        )

    return _supabase_client

# ===========================================
# 用户相关操作
# ===========================================

def create_user(email: str, password_hash: str, full_name: Optional[str] = None,
                role: str = 'user', openrouter_api_key: Optional[str] = None,
                google_api_key: Optional[str] = None) -> Dict[str, Any]:
    """创建新用户"""
    supabase = get_supabase_client()

    user_data = {
        'email': email,
        'password_hash': password_hash,
        'full_name': full_name,
        'role': role,
        'openrouter_api_key': openrouter_api_key,
        'google_api_key': google_api_key
    }

    result = supabase.table('users').insert(user_data).execute()
    return result.data[0]

def get_user_by_email(email: str) -> Optional[Dict[str, Any]]:
    """通过邮箱获取用户"""
    supabase = get_supabase_client()

    result = supabase.table('users').select('*').eq('email', email).execute()
    return result.data[0] if result.data else None

def get_user_by_id(user_id: str) -> Optional[Dict[str, Any]]:
    """通过ID获取用户"""
    supabase = get_supabase_client()

    result = supabase.table('users').select('*').eq('id', user_id).execute()
    return result.data[0] if result.data else None

def update_user(user_id: str, **kwargs) -> Dict[str, Any]:
    """更新用户信息"""
    supabase = get_supabase_client()

    result = supabase.table('users').update(kwargs).eq('id', user_id).execute()
    return result.data[0]

def delete_user(user_id: str) -> bool:
    """删除用户"""
    supabase = get_supabase_client()

    supabase.table('users').delete().eq('id', user_id).execute()
    return True

# ===========================================
# 笔记相关操作
# ===========================================

def create_note(title: str, content: str, user_id: str, tags: Optional[List[str]] = None) -> Dict[str, Any]:
    """创建新笔记"""
    supabase = get_supabase_client()

    note_data = {
        'title': title,
        'content': content,
        'user_id': user_id,
        'tags': tags or []
    }

    result = supabase.table('notes').insert(note_data).execute()
    return result.data[0]

def get_notes_by_user(user_id: str, limit: Optional[int] = None, offset: int = 0) -> List[Dict[str, Any]]:
    """获取用户的所有笔记"""
    supabase = get_supabase_client()

    query = supabase.table('notes').select('*').eq('user_id', user_id).order('updated_at', desc=True)

    if limit:
        query = query.limit(limit).offset(offset)

    result = query.execute()
    return result.data

def get_note_by_id(note_id: str) -> Optional[Dict[str, Any]]:
    """通过ID获取笔记"""
    supabase = get_supabase_client()

    result = supabase.table('notes').select('*').eq('id', note_id).execute()
    return result.data[0] if result.data else None

def update_note(note_id: str, **kwargs) -> Dict[str, Any]:
    """更新笔记"""
    supabase = get_supabase_client()

    # 确保tags是列表格式
    if 'tags' in kwargs and isinstance(kwargs['tags'], str):
        kwargs['tags'] = json.loads(kwargs['tags']) if kwargs['tags'] else []

    result = supabase.table('notes').update(kwargs).eq('id', note_id).execute()
    return result.data[0]

def delete_note(note_id: str) -> bool:
    """删除笔记"""
    supabase = get_supabase_client()

    supabase.table('notes').delete().eq('id', note_id).execute()
    return True

def search_notes(user_id: str, query: str) -> List[Dict[str, Any]]:
    """搜索笔记(使用PostgreSQL全文搜索)"""
    supabase = get_supabase_client()

    # 使用RPC调用自定义搜索函数
    try:
        result = supabase.rpc('search_notes', {
            'search_query': query,
            'user_uuid': user_id
        }).execute()
        return result.data
    except:
        # 如果RPC失败,使用简单的ilike搜索
        result = supabase.table('notes').select('*').eq('user_id', user_id)\
            .or_(f'title.ilike.%{query}%,content.ilike.%{query}%').execute()
        return result.data

# ===========================================
# 项目看板相关操作
# ===========================================

def create_board(name: str, user_id: str, description: Optional[str] = None,
                 color: str = '#3b82f6') -> Dict[str, Any]:
    """创建新看板"""
    supabase = get_supabase_client()

    board_data = {
        'name': name,
        'user_id': user_id,
        'description': description,
        'color': color
    }

    result = supabase.table('boards').insert(board_data).execute()
    return result.data[0]

def get_boards_by_user(user_id: str) -> List[Dict[str, Any]]:
    """获取用户的所有看板"""
    supabase = get_supabase_client()

    result = supabase.table('boards').select('*').eq('user_id', user_id).order('updated_at', desc=True).execute()
    return result.data

def get_board_by_id(board_id: str) -> Optional[Dict[str, Any]]:
    """通过ID获取看板"""
    supabase = get_supabase_client()

    result = supabase.table('boards').select('*').eq('id', board_id).execute()
    return result.data[0] if result.data else None

def update_board(board_id: str, **kwargs) -> Dict[str, Any]:
    """更新看板"""
    supabase = get_supabase_client()

    result = supabase.table('boards').update(kwargs).eq('id', board_id).execute()
    return result.data[0]

def delete_board(board_id: str) -> bool:
    """删除看板"""
    supabase = get_supabase_client()

    supabase.table('boards').delete().eq('id', board_id).execute()
    return True

# ===========================================
# 列表相关操作
# ===========================================

def create_list(title: str, board_id: str, position: int = 0) -> Dict[str, Any]:
    """创建新列表"""
    supabase = get_supabase_client()

    list_data = {
        'title': title,
        'board_id': board_id,
        'position': position
    }

    result = supabase.table('lists').insert(list_data).execute()
    return result.data[0]

def get_lists_by_board(board_id: str) -> List[Dict[str, Any]]:
    """获取看板的所有列表"""
    supabase = get_supabase_client()

    result = supabase.table('lists').select('*').eq('board_id', board_id).order('position').execute()
    return result.data

def update_list(list_id: str, **kwargs) -> Dict[str, Any]:
    """更新列表"""
    supabase = get_supabase_client()

    result = supabase.table('lists').update(kwargs).eq('id', list_id).execute()
    return result.data[0]

def delete_list(list_id: str) -> bool:
    """删除列表"""
    supabase = get_supabase_client()

    supabase.table('lists').delete().eq('id', list_id).execute()
    return True

# ===========================================
# 卡片相关操作
# ===========================================

def create_card(title: str, list_id: str, description: Optional[str] = None,
                priority: str = 'medium', tags: Optional[List[str]] = None,
                position: int = 0) -> Dict[str, Any]:
    """创建新卡片"""
    supabase = get_supabase_client()

    card_data = {
        'title': title,
        'list_id': list_id,
        'description': description,
        'priority': priority,
        'tags': tags or [],
        'position': position
    }

    result = supabase.table('cards').insert(card_data).execute()
    return result.data[0]

def get_cards_by_list(list_id: str) -> List[Dict[str, Any]]:
    """获取列表的所有卡片"""
    supabase = get_supabase_client()

    result = supabase.table('cards').select('*').eq('list_id', list_id).order('position').execute()
    return result.data

def update_card(card_id: str, **kwargs) -> Dict[str, Any]:
    """更新卡片"""
    supabase = get_supabase_client()

    # 确保tags是列表格式
    if 'tags' in kwargs and isinstance(kwargs['tags'], str):
        kwargs['tags'] = json.loads(kwargs['tags']) if kwargs['tags'] else []

    result = supabase.table('cards').update(kwargs).eq('id', card_id).execute()
    return result.data[0]

def delete_card(card_id: str) -> bool:
    """删除卡片"""
    supabase = get_supabase_client()

    supabase.table('cards').delete().eq('id', card_id).execute()
    return True

# ===========================================
# RBAC权限相关操作
# ===========================================

def get_all_roles() -> List[Dict[str, Any]]:
    """获取所有角色"""
    supabase = get_supabase_client()

    result = supabase.table('roles').select('*').order('level', desc=True).execute()
    return result.data

def get_user_roles(user_id: str) -> List[Dict[str, Any]]:
    """获取用户的所有角色"""
    supabase = get_supabase_client()

    result = supabase.table('user_roles').select('role_id, roles(*)').eq('user_id', user_id).execute()
    return [item['roles'] for item in result.data if item.get('roles')]

def assign_role_to_user(user_id: str, role_id: str, assigned_by: Optional[str] = None) -> Dict[str, Any]:
    """为用户分配角色"""
    supabase = get_supabase_client()

    assignment_data = {
        'user_id': user_id,
        'role_id': role_id,
        'assigned_by': assigned_by
    }

    result = supabase.table('user_roles').insert(assignment_data).execute()
    return result.data[0]

def get_role_permissions(role_id: str) -> List[Dict[str, Any]]:
    """获取角色的所有权限"""
    supabase = get_supabase_client()

    result = supabase.table('role_permissions').select('permission_id, permissions(*)').eq('role_id', role_id).execute()
    return [item['permissions'] for item in result.data if item.get('permissions')]

def get_user_permissions(user_id: str) -> List[str]:
    """获取用户的所有权限名称列表"""
    supabase = get_supabase_client()

    # 获取用户通过角色获得的权限
    user_roles = get_user_roles(user_id)
    role_permissions = set()

    for role in user_roles:
        perms = get_role_permissions(role['id'])
        role_permissions.update([p['name'] for p in perms])

    # 获取用户直接被授予的权限
    result = supabase.table('user_permissions').select('permission_id, permissions(name)').eq('user_id', user_id).execute()
    direct_permissions = {item['permissions']['name'] for item in result.data if item.get('permissions')}

    return list(role_permissions | direct_permissions)

# ===========================================
# 聊天相关操作
# ===========================================

def create_chat_session(title: str, model: str, user_id: str) -> Dict[str, Any]:
    """创建新的聊天会话"""
    supabase = get_supabase_client()

    session_data = {
        'title': title,
        'model': model,
        'user_id': user_id
    }

    result = supabase.table('chat_sessions').insert(session_data).execute()
    return result.data[0]

def get_chat_sessions_by_user(user_id: str) -> List[Dict[str, Any]]:
    """获取用户的所有聊天会话"""
    supabase = get_supabase_client()

    result = supabase.table('chat_sessions').select('*').eq('user_id', user_id).order('updated_at', desc=True).execute()
    return result.data

def create_chat_message(session_id: str, content: str, role: str) -> Dict[str, Any]:
    """创建新的聊天消息"""
    supabase = get_supabase_client()

    message_data = {
        'session_id': session_id,
        'content': content,
        'role': role
    }

    result = supabase.table('chat_messages').insert(message_data).execute()
    return result.data[0]

def get_messages_by_session(session_id: str) -> List[Dict[str, Any]]:
    """获取会话的所有消息"""
    supabase = get_supabase_client()

    result = supabase.table('chat_messages').select('*').eq('session_id', session_id).order('created_at').execute()
    return result.data

# ===========================================
# 数据库初始化和健康检查
# ===========================================

def check_database_health() -> Dict[str, Any]:
    """检查数据库健康状态"""
    supabase = get_supabase_client()

    try:
        # 尝试查询用户表
        result = supabase.table('users').select('count', count='exact').limit(1).execute()
        return {
            'status': 'healthy',
            'database': 'supabase',
            'user_count': result.count
        }
    except Exception as e:
        return {
            'status': 'error',
            'database': 'supabase',
            'error': str(e)
        }

def init_database():
    """初始化数据库(Supabase版本中表已通过SQL创建,此函数仅用于兼容性)"""
    pass

def get_connection():
    """获取数据库连接（为了兼容SQLite接口）"""
    return get_supabase_client()

# ===========================================
# Repository类封装 - 与SQLite版本保持接口一致
# ===========================================

class SupabaseUserRepository:
    """用户数据操作类 - 兼容SQLite接口"""
    
    def create_user(self, email: str, password_hash: str, full_name: Optional[str] = None, role: str = 'user') -> dict:
        return create_user(email, password_hash, full_name, role)
    
    def get_user_by_email(self, email: str) -> Optional[dict]:
        return get_user_by_email(email)
    
    def get_user_by_id(self, user_id: str) -> Optional[dict]:
        return get_user_by_id(user_id)
    
    def update_user(self, user_id: str, **kwargs) -> Optional[dict]:
        return update_user(user_id, **kwargs)
    
    def get_all_users(self) -> List[dict]:
        supabase = get_supabase_client()
        result = supabase.table('users').select('*').order('created_at', desc=True).execute()
        return result.data
    
    def get_user_stats(self, user_id: str) -> dict:
        supabase = get_supabase_client()
        stats = {'notes_count': 0, 'todos_count': 0}
        
        # 统计笔记数
        result = supabase.table('notes').select('id', count='exact').eq('user_id', user_id).execute()
        stats['notes_count'] = result.count or 0
        
        # 统计待办数
        try:
            result = supabase.table('todos').select('id', count='exact').eq('user_id', user_id).execute()
            stats['todos_count'] = result.count or 0
        except:
            pass
        
        return stats
    
    def delete_user(self, user_id: str) -> bool:
        return delete_user(user_id)


class SupabaseNotesRepository:
    """笔记数据操作类 - 兼容SQLite接口"""
    
    def create_note(self, title: str, content: str, tags: List[str], user_id: str) -> dict:
        return create_note(title, content, user_id, tags)
    
    def get_notes_by_user(self, user_id: str) -> List[dict]:
        return get_notes_by_user(user_id)
    
    def get_note_by_id(self, note_id: str, user_id: str) -> Optional[dict]:
        note = get_note_by_id(note_id)
        if note and note.get('user_id') == user_id:
            return note
        return None
    
    def update_note(self, note_id: str, user_id: str, **kwargs) -> Optional[dict]:
        # 验证所有权
        note = self.get_note_by_id(note_id, user_id)
        if not note:
            return None
        return update_note(note_id, **kwargs)
    
    def delete_note(self, note_id: str, user_id: str) -> bool:
        # 验证所有权
        note = self.get_note_by_id(note_id, user_id)
        if not note:
            return False
        return delete_note(note_id)
    
    def search_notes(self, user_id: str, query: str, limit: int = 50) -> List[dict]:
        return search_notes(user_id, query)


class SupabaseBoardRepository:
    """看板数据操作类 - 兼容SQLite接口"""
    
    def create_board(self, name: str, description: Optional[str], color: str, user_id: str) -> dict:
        return create_board(name, user_id, description, color)
    
    def get_boards_by_user(self, user_id: str) -> List[dict]:
        return get_boards_by_user(user_id)
    
    def get_board_by_id(self, board_id: str, user_id: str) -> Optional[dict]:
        board = get_board_by_id(board_id)
        if board and board.get('user_id') == user_id:
            return board
        return None
    
    def get_board_with_data(self, board_id: str, user_id: str) -> Optional[dict]:
        board = self.get_board_by_id(board_id, user_id)
        if not board:
            return None
        
        # 获取所有列表和卡片
        lists = get_lists_by_board(board_id)
        for list_item in lists:
            list_item['cards'] = get_cards_by_list(list_item['id'])
        
        board['lists'] = lists
        return board
    
    def update_board(self, board_id: str, user_id: str, **kwargs) -> Optional[dict]:
        # 验证所有权
        board = self.get_board_by_id(board_id, user_id)
        if not board:
            return None
        return update_board(board_id, **kwargs)
    
    def delete_board(self, board_id: str, user_id: str) -> bool:
        # 验证所有权
        board = self.get_board_by_id(board_id, user_id)
        if not board:
            return False
        return delete_board(board_id)


class SupabaseListRepository:
    """列表数据操作类 - 兼容SQLite接口"""
    
    def create_list(self, title: str, position: int, board_id: str) -> dict:
        return create_list(title, board_id, position)
    
    def update_list(self, list_id: str, **kwargs) -> Optional[dict]:
        result = update_list(list_id, **kwargs)
        return result
    
    def get_list_by_id(self, list_id: str) -> Optional[dict]:
        supabase = get_supabase_client()
        result = supabase.table('lists').select('*').eq('id', list_id).execute()
        return result.data[0] if result.data else None
    
    def delete_list(self, list_id: str) -> bool:
        return delete_list(list_id)


class SupabaseCardRepository:
    """卡片数据操作类 - 兼容SQLite接口"""
    
    def create_card(self, title: str, description: Optional[str], priority: str,
                   due_date: Optional[str], assignee: Optional[str], tags: List[str],
                   position: int, list_id: str) -> dict:
        return create_card(title, list_id, description, priority, tags, position)
    
    def update_card(self, card_id: str, **kwargs) -> Optional[dict]:
        return update_card(card_id, **kwargs)
    
    def get_card_by_id(self, card_id: str) -> Optional[dict]:
        supabase = get_supabase_client()
        result = supabase.table('cards').select('*').eq('id', card_id).execute()
        return result.data[0] if result.data else None
    
    def delete_card(self, card_id: str) -> bool:
        return delete_card(card_id)


class SupabaseCardCommentRepository:
    """卡片评论数据操作类 - 兼容SQLite接口"""
    
    def create_comment(self, card_id: str, content: str, user_id: str) -> dict:
        supabase = get_supabase_client()
        comment_data = {
            'card_id': card_id,
            'content': content,
            'user_id': user_id
        }
        result = supabase.table('card_comments').insert(comment_data).execute()
        return result.data[0]
    
    def get_comments_by_card(self, card_id: str) -> List[dict]:
        supabase = get_supabase_client()
        result = supabase.table('card_comments').select('*').eq('card_id', card_id).order('created_at').execute()
        return result.data


# 创建全局实例 - 与SQLite版本保持一致
user_repo = SupabaseUserRepository()
notes_repo = SupabaseNotesRepository()
board_repo = SupabaseBoardRepository()
list_repo = SupabaseListRepository()
card_repo = SupabaseCardRepository()
card_comment_repo = SupabaseCardCommentRepository()

if __name__ == "__main__":
    # 测试数据库连接
    health = check_database_health()
    print(f"Database Health: {health}")
