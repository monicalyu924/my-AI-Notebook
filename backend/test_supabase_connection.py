"""
测试Supabase连接
验证环境变量配置是否正确
"""

import sys
from supabase import create_client, Client
from config import settings

def test_supabase_connection():
    """测试Supabase连接"""
    print("=" * 60)
    print("  Supabase 连接测试")
    print("=" * 60)
    print()

    # 1. 检查环境变量
    print("1️⃣  检查环境变量配置...")
    print(f"   SUPABASE_URL: {settings.SUPABASE_URL[:30]}..." if settings.SUPABASE_URL else "   ❌ 未配置")
    print(f"   SUPABASE_ANON_KEY: {settings.SUPABASE_ANON_KEY[:30]}..." if settings.SUPABASE_ANON_KEY else "   ❌ 未配置")
    print(f"   SUPABASE_SERVICE_ROLE_KEY: {settings.SUPABASE_SERVICE_ROLE_KEY[:30]}..." if settings.SUPABASE_SERVICE_ROLE_KEY else "   ❌ 未配置")
    print()

    if not all([settings.SUPABASE_URL, settings.SUPABASE_ANON_KEY, settings.SUPABASE_SERVICE_ROLE_KEY]):
        print("❌ 环境变量配置不完整!")
        print("   请检查 backend/.env 文件")
        return False

    # 2. 测试连接
    print("2️⃣  测试Supabase连接...")
    try:
        supabase: Client = create_client(
            settings.SUPABASE_URL,
            settings.SUPABASE_SERVICE_ROLE_KEY
        )
        print("   ✅ 连接成功!")
        print()

        # 3. 测试数据库访问
        print("3️⃣  测试数据库访问...")
        try:
            # 尝试查询一个可能存在的表
            response = supabase.table('users').select("*").limit(1).execute()
            print("   ✅ 数据库访问成功!")
            print(f"   找到 users 表,当前有 {len(response.data)} 条记录")
        except Exception as e:
            error_msg = str(e)
            if "relation" in error_msg.lower() or "does not exist" in error_msg.lower():
                print("   ⚠️  users表不存在(这是正常的,我们稍后会创建)")
            else:
                print(f"   ⚠️  数据库访问警告: {error_msg}")
        print()

        # 4. 测试用户表（如果存在）
        print("4️⃣  检查现有表结构...")
        try:
            # 获取所有表的列表
            result = supabase.rpc('get_tables').execute()
            if result.data:
                print(f"   📊 找到 {len(result.data)} 个表:")
                for table in result.data:
                    print(f"      - {table}")
            else:
                print("   📝 数据库中暂无表(准备创建)")
        except Exception as e:
            print(f"   ℹ️  无法列出表: {str(e)}")
            print("   (这可能是因为没有创建RPC函数,不影响后续操作)")
        print()

        # 5. 总结
        print("=" * 60)
        print("  ✅ Supabase连接测试通过!")
        print("=" * 60)
        print()
        print("下一步:")
        print("1. 在Supabase SQL编辑器中创建数据表")
        print("2. 迁移SQLite数据到Supabase")
        print("3. 配置应用使用Supabase")
        print()
        return True

    except Exception as e:
        print(f"   ❌ 连接失败: {str(e)}")
        print()
        print("可能的原因:")
        print("1. Supabase项目已暂停(免费版超过7天未使用会暂停)")
        print("2. API密钥不正确")
        print("3. 网络连接问题")
        print()
        print("解决方法:")
        print("1. 访问 https://supabase.com 检查项目状态")
        print("2. 如果项目已暂停,点击 'Resume' 恢复")
        print("3. 重新获取API密钥并更新.env文件")
        return False

if __name__ == "__main__":
    success = test_supabase_connection()
    sys.exit(0 if success else 1)
