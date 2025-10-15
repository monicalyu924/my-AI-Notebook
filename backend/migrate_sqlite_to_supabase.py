"""
SQLite到Supabase数据迁移脚本
自动迁移所有用户、笔记、项目等数据
"""

import sqlite3
import json
from datetime import datetime
from supabase import create_client, Client
from supabase.lib.client_options import ClientOptions
from config import settings
import sys
import httpx
import time

# SQLite数据库路径
SQLITE_DB_PATH = "notebook.db"

def retry_on_timeout(max_retries=3, delay=2):
    """重试装饰器,用于处理超时错误"""
    def decorator(func):
        def wrapper(*args, **kwargs):
            for attempt in range(max_retries):
                try:
                    return func(*args, **kwargs)
                except (httpx.ConnectTimeout, httpx.ReadTimeout, httpx.WriteTimeout) as e:
                    if attempt < max_retries - 1:
                        wait_time = delay * (attempt + 1)
                        print(f"   ⏳ 超时,{wait_time}秒后重试 ({attempt + 1}/{max_retries})...")
                        time.sleep(wait_time)
                    else:
                        raise e
            return None
        return wrapper
    return decorator

def get_sqlite_connection():
    """获取SQLite连接"""
    conn = sqlite3.connect(SQLITE_DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def get_supabase_client() -> Client:
    """获取Supabase客户端,带有扩展超时设置"""
    # 创建ClientOptions并设置更长的超时
    options = ClientOptions(
        postgrest_client_timeout=60,  # PostgREST客户端超时60秒
        storage_client_timeout=60      # Storage客户端超时60秒
    )

    return create_client(
        settings.SUPABASE_URL,
        settings.SUPABASE_SERVICE_ROLE_KEY,
        options=options
    )

def migrate_users(sqlite_conn, supabase: Client):
    """迁移用户数据"""
    print("\n📊 迁移用户数据...")
    cursor = sqlite_conn.cursor()

    cursor.execute("SELECT * FROM users")
    users = cursor.fetchall()

    print(f"   找到 {len(users)} 个用户")

    migrated_count = 0
    user_id_mapping = {}  # SQLite ID -> Supabase UUID映射

    for user in users:
        user_dict = dict(user)
        old_id = user_dict['id']

        # 准备数据
        supabase_user = {
            'email': user_dict['email'],
            'password_hash': user_dict['password_hash'],
            'full_name': user_dict.get('full_name'),
            'role': user_dict.get('role', 'user'),
            'openrouter_api_key': user_dict.get('openrouter_api_key'),
            'created_at': user_dict['created_at'],
            'updated_at': user_dict['updated_at']
        }

        try:
            # 插入到Supabase,带重试
            @retry_on_timeout(max_retries=3, delay=3)
            def insert_user():
                return supabase.table('users').insert(supabase_user).execute()

            result = insert_user()
            new_id = result.data[0]['id']
            user_id_mapping[old_id] = new_id
            migrated_count += 1
            print(f"   ✅ 迁移用户: {user_dict['email']}")
        except Exception as e:
            if "duplicate" in str(e).lower() or "unique" in str(e).lower():
                # 用户已存在,获取其ID
                try:
                    result = supabase.table('users').select('id').eq('email', user_dict['email']).execute()
                    if result.data:
                        new_id = result.data[0]['id']
                        user_id_mapping[old_id] = new_id
                        print(f"   ℹ️  用户已存在,跳过: {user_dict['email']}")
                except:
                    print(f"   ❌ 无法处理用户: {user_dict['email']}")
            else:
                print(f"   ❌ 迁移用户失败: {user_dict['email']} - {str(e)}")

    print(f"   成功迁移 {migrated_count}/{len(users)} 个用户")
    return user_id_mapping

def migrate_notes(sqlite_conn, supabase: Client, user_id_mapping):
    """迁移笔记数据"""
    print("\n📝 迁移笔记数据...")
    cursor = sqlite_conn.cursor()

    cursor.execute("SELECT * FROM notes")
    notes = cursor.fetchall()

    print(f"   找到 {len(notes)} 条笔记")

    migrated_count = 0

    for note in notes:
        note_dict = dict(note)
        old_user_id = note_dict['user_id']

        # 检查用户ID映射
        if old_user_id not in user_id_mapping:
            print(f"   ⚠️  笔记的用户ID未找到,跳过: {note_dict['title']}")
            continue

        # 准备数据
        supabase_note = {
            'title': note_dict['title'],
            'content': note_dict.get('content', ''),
            'tags': json.loads(note_dict.get('tags', '[]')),
            'user_id': user_id_mapping[old_user_id],
            'created_at': note_dict['created_at'],
            'updated_at': note_dict['updated_at']
        }

        try:
            supabase.table('notes').insert(supabase_note).execute()
            migrated_count += 1
            if migrated_count % 10 == 0:
                print(f"   已迁移 {migrated_count} 条笔记...")
        except Exception as e:
            print(f"   ❌ 迁移笔记失败: {note_dict['title']} - {str(e)}")

    print(f"   成功迁移 {migrated_count}/{len(notes)} 条笔记")

def migrate_chat_sessions(sqlite_conn, supabase: Client, user_id_mapping):
    """迁移聊天会话数据"""
    print("\n💬 迁移聊天会话...")
    cursor = sqlite_conn.cursor()

    try:
        cursor.execute("SELECT * FROM chat_sessions")
        sessions = cursor.fetchall()
    except sqlite3.OperationalError:
        print("   ℹ️  chat_sessions表不存在,跳过")
        return {}

    print(f"   找到 {len(sessions)} 个聊天会话")

    migrated_count = 0
    session_id_mapping = {}

    for session in sessions:
        session_dict = dict(session)
        old_id = session_dict['id']
        old_user_id = session_dict['user_id']

        if old_user_id not in user_id_mapping:
            continue

        supabase_session = {
            'title': session_dict['title'],
            'model': session_dict['model'],
            'user_id': user_id_mapping[old_user_id],
            'created_at': session_dict['created_at'],
            'updated_at': session_dict['updated_at']
        }

        try:
            result = supabase.table('chat_sessions').insert(supabase_session).execute()
            new_id = result.data[0]['id']
            session_id_mapping[old_id] = new_id
            migrated_count += 1
        except Exception as e:
            print(f"   ❌ 迁移会话失败: {session_dict['title']} - {str(e)}")

    print(f"   成功迁移 {migrated_count}/{len(sessions)} 个聊天会话")
    return session_id_mapping

def migrate_chat_messages(sqlite_conn, supabase: Client, session_id_mapping):
    """迁移聊天消息数据"""
    print("\n💭 迁移聊天消息...")
    cursor = sqlite_conn.cursor()

    try:
        cursor.execute("SELECT * FROM chat_messages")
        messages = cursor.fetchall()
    except sqlite3.OperationalError:
        print("   ℹ️  chat_messages表不存在,跳过")
        return

    print(f"   找到 {len(messages)} 条聊天消息")

    migrated_count = 0

    for message in messages:
        message_dict = dict(message)
        old_session_id = message_dict['session_id']

        if old_session_id not in session_id_mapping:
            continue

        supabase_message = {
            'session_id': session_id_mapping[old_session_id],
            'content': message_dict['content'],
            'role': message_dict['role'],
            'created_at': message_dict['created_at']
        }

        try:
            supabase.table('chat_messages').insert(supabase_message).execute()
            migrated_count += 1
            if migrated_count % 50 == 0:
                print(f"   已迁移 {migrated_count} 条消息...")
        except Exception as e:
            print(f"   ❌ 迁移消息失败: {str(e)}")

    print(f"   成功迁移 {migrated_count}/{len(messages)} 条聊天消息")

def migrate_boards(sqlite_conn, supabase: Client, user_id_mapping):
    """迁移项目看板数据"""
    print("\n📋 迁移项目看板...")
    cursor = sqlite_conn.cursor()

    try:
        cursor.execute("SELECT * FROM boards")
        boards = cursor.fetchall()
    except sqlite3.OperationalError:
        print("   ℹ️  boards表不存在,跳过")
        return {}

    print(f"   找到 {len(boards)} 个项目看板")

    migrated_count = 0
    board_id_mapping = {}

    for board in boards:
        board_dict = dict(board)
        old_id = board_dict['id']
        old_user_id = board_dict['user_id']

        if old_user_id not in user_id_mapping:
            continue

        supabase_board = {
            'name': board_dict['name'],
            'description': board_dict.get('description'),
            'color': board_dict.get('color', '#3b82f6'),
            'user_id': user_id_mapping[old_user_id],
            'created_at': board_dict['created_at'],
            'updated_at': board_dict['updated_at']
        }

        try:
            result = supabase.table('boards').insert(supabase_board).execute()
            new_id = result.data[0]['id']
            board_id_mapping[old_id] = new_id
            migrated_count += 1
        except Exception as e:
            print(f"   ❌ 迁移看板失败: {board_dict['name']} - {str(e)}")

    print(f"   成功迁移 {migrated_count}/{len(boards)} 个项目看板")
    return board_id_mapping

def migrate_user_roles(sqlite_conn, supabase: Client, user_id_mapping):
    """迁移用户角色关联"""
    print("\n👥 迁移用户角色关联...")
    cursor = sqlite_conn.cursor()

    try:
        cursor.execute("SELECT * FROM user_roles")
        user_roles = cursor.fetchall()
    except sqlite3.OperationalError:
        print("   ℹ️  user_roles表不存在,为所有用户分配默认user角色")
        # 为所有用户分配默认user角色
        try:
            # 获取user角色ID
            role_result = supabase.table('roles').select('id').eq('name', 'user').execute()
            if role_result.data:
                user_role_id = role_result.data[0]['id']
                for new_user_id in user_id_mapping.values():
                    try:
                        supabase.table('user_roles').insert({
                            'user_id': new_user_id,
                            'role_id': user_role_id,
                            'assigned_at': datetime.utcnow().isoformat() + 'Z'
                        }).execute()
                    except:
                        pass  # 可能已存在
                print(f"   ✅ 为 {len(user_id_mapping)} 个用户分配了默认角色")
        except Exception as e:
            print(f"   ⚠️  分配默认角色失败: {str(e)}")
        return

    print(f"   找到 {len(user_roles)} 条用户角色关联")

    # 获取所有角色的映射
    roles_result = supabase.table('roles').select('id, name').execute()
    role_name_to_id = {role['name']: role['id'] for role in roles_result.data}

    migrated_count = 0

    for user_role in user_roles:
        ur_dict = dict(user_role)
        old_user_id = ur_dict['user_id']
        old_role_id = ur_dict['role_id']

        if old_user_id not in user_id_mapping:
            continue

        # 从SQLite获取角色名称
        cursor.execute("SELECT name FROM roles WHERE id = ?", (old_role_id,))
        role_row = cursor.fetchone()
        if not role_row:
            continue

        role_name = role_row['name']
        if role_name not in role_name_to_id:
            continue

        supabase_user_role = {
            'user_id': user_id_mapping[old_user_id],
            'role_id': role_name_to_id[role_name],
            'assigned_at': ur_dict.get('assigned_at', datetime.utcnow().isoformat() + 'Z'),
            'expires_at': ur_dict.get('expires_at')
        }

        try:
            supabase.table('user_roles').insert(supabase_user_role).execute()
            migrated_count += 1
        except Exception as e:
            if "duplicate" not in str(e).lower():
                print(f"   ⚠️  迁移用户角色失败: {str(e)}")

    print(f"   成功迁移 {migrated_count}/{len(user_roles)} 条用户角色关联")

def main(auto_confirm=False):
    """主迁移流程"""
    print("=" * 60)
    print("  SQLite → Supabase 数据迁移")
    print("=" * 60)

    # 检查SQLite数据库
    try:
        sqlite_conn = get_sqlite_connection()
        print(f"\n✅ 成功连接到SQLite数据库: {SQLITE_DB_PATH}")
    except Exception as e:
        print(f"\n❌ 无法连接到SQLite数据库: {str(e)}")
        sys.exit(1)

    # 检查Supabase连接
    try:
        supabase = get_supabase_client()
        print(f"✅ 成功连接到Supabase")
    except Exception as e:
        print(f"❌ 无法连接到Supabase: {str(e)}")
        sys.exit(1)

    # 确认迁移
    if not auto_confirm:
        print("\n" + "⚠️  " * 20)
        print("警告: 此操作将把SQLite数据迁移到Supabase")
        print("请确保:")
        print("1. 已在Supabase SQL编辑器中执行了 supabase_schema.sql")
        print("2. 已备份了SQLite数据库")
        print("3. 网络连接稳定")
        print("⚠️  " * 20)

        response = input("\n确认开始迁移? (yes/no): ").strip().lower()
        if response != 'yes':
            print("❌ 迁移已取消")
            sys.exit(0)
    else:
        print("\n🤖 自动确认模式已启用,跳过交互式确认...")

    print("\n🚀 开始迁移...")
    start_time = datetime.now()

    try:
        # 1. 迁移用户
        user_id_mapping = migrate_users(sqlite_conn, supabase)

        if not user_id_mapping:
            print("\n❌ 没有用户数据被迁移,停止迁移")
            sys.exit(1)

        # 2. 迁移笔记
        migrate_notes(sqlite_conn, supabase, user_id_mapping)

        # 3. 迁移聊天数据
        session_id_mapping = migrate_chat_sessions(sqlite_conn, supabase, user_id_mapping)
        migrate_chat_messages(sqlite_conn, supabase, session_id_mapping)

        # 4. 迁移项目看板
        board_id_mapping = migrate_boards(sqlite_conn, supabase, user_id_mapping)

        # 5. 迁移用户角色
        migrate_user_roles(sqlite_conn, supabase, user_id_mapping)

        # 完成
        end_time = datetime.now()
        duration = (end_time - start_time).total_seconds()

        print("\n" + "=" * 60)
        print("  ✅ 迁移完成!")
        print("=" * 60)
        print(f"\n⏱️  总耗时: {duration:.2f}秒")
        print(f"👥 迁移用户: {len(user_id_mapping)} 个")

        print("\n📝 下一步:")
        print("1. 验证Supabase中的数据")
        print("2. 更新backend/main.py使用Supabase")
        print("3. 测试应用功能")
        print("4. 备份SQLite数据库(notebook.db)")

    except Exception as e:
        print(f"\n❌ 迁移过程中发生错误: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        sqlite_conn.close()

if __name__ == "__main__":
    import sys
    # 支持 --auto-confirm 参数跳过确认
    auto_confirm = len(sys.argv) > 1 and sys.argv[1] == '--auto-confirm'
    main(auto_confirm=auto_confirm)
