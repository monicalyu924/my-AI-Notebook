"""
数据库抽象层 - 统一的数据库接口
根据配置自动选择SQLite或Supabase
"""

from config import settings

# 根据配置导入相应的数据库模块
if settings.DATABASE_TYPE == "supabase":
    print(f"🚀 使用 Supabase 数据库: {settings.SUPABASE_URL}")
    from database_supabase import *
else:
    print("💾 使用 SQLite 数据库")
    from database_sqlite import *

# 导出数据库类型信息
DATABASE_INFO = {
    "type": settings.DATABASE_TYPE,
    "url": settings.SUPABASE_URL if settings.DATABASE_TYPE == "supabase" else "notebook.db"
}
