"""
RBAC权限系统测试脚本
用于验证RBAC系统的基本功能
"""

import requests
import json
from datetime import datetime

# API基础URL
BASE_URL = "http://localhost:8000"

def print_section(title):
    """打印分节标题"""
    print(f"\n{'='*60}")
    print(f"  {title}")
    print(f"{'='*60}\n")

def print_result(description, success, data=None):
    """打印测试结果"""
    status = "✓" if success else "✗"
    print(f"{status} {description}")
    if data:
        print(f"  数据: {json.dumps(data, indent=2, ensure_ascii=False)}")
    print()

def test_rbac_system():
    """测试RBAC系统"""

    print_section("RBAC权限系统测试")

    # 1. 测试创建测试用户
    print_section("1. 创建测试用户")

    # 创建普通用户
    register_data = {
        "email": f"testuser_{datetime.now().timestamp()}@example.com",
        "password": "testpass123",
        "full_name": "测试用户"
    }

    try:
        response = requests.post(f"{BASE_URL}/api/auth/register", json=register_data)
        if response.status_code == 200:
            user_data = response.json()
            token = user_data.get("access_token")
            print_result("创建普通用户", True, {"email": register_data["email"]})
        else:
            print_result("创建普通用户", False, response.json())
            return
    except Exception as e:
        print_result("创建普通用户", False, {"error": str(e)})
        return

    # 设置认证头
    headers = {"Authorization": f"Bearer {token}"}

    # 2. 测试获取当前用户权限
    print_section("2. 获取当前用户权限")

    try:
        response = requests.get(f"{BASE_URL}/api/rbac/me/permissions", headers=headers)
        if response.status_code == 200:
            permissions_data = response.json()
            print_result("获取用户权限", True, permissions_data)
        else:
            print_result("获取用户权限", False, response.json())
    except Exception as e:
        print_result("获取用户权限", False, {"error": str(e)})

    # 3. 测试检查特定权限
    print_section("3. 检查特定权限")

    test_permissions = ["notes.create", "notes.read", "users.manage", "roles.manage"]

    for permission in test_permissions:
        try:
            response = requests.get(
                f"{BASE_URL}/api/rbac/me/check-permission/{permission}",
                headers=headers
            )
            if response.status_code == 200:
                perm_data = response.json()
                has_perm = perm_data.get("has_permission", False)
                print_result(
                    f"检查权限 {permission}",
                    True,
                    {"has_permission": has_perm}
                )
            else:
                print_result(f"检查权限 {permission}", False, response.json())
        except Exception as e:
            print_result(f"检查权限 {permission}", False, {"error": str(e)})

    # 4. 测试检查角色
    print_section("4. 检查用户角色")

    test_roles = ["user", "admin", "editor", "super_admin"]

    for role in test_roles:
        try:
            response = requests.get(
                f"{BASE_URL}/api/rbac/me/check-role/{role}",
                headers=headers
            )
            if response.status_code == 200:
                role_data = response.json()
                has_role = role_data.get("has_role", False)
                print_result(
                    f"检查角色 {role}",
                    True,
                    {"has_role": has_role}
                )
            else:
                print_result(f"检查角色 {role}", False, response.json())
        except Exception as e:
            print_result(f"检查角色 {role}", False, {"error": str(e)})

    # 5. 测试无权限访问(应该失败)
    print_section("5. 测试无权限访问(预期失败)")

    try:
        response = requests.get(f"{BASE_URL}/api/rbac/roles", headers=headers)
        if response.status_code == 403:
            print_result("无权限访问被正确拒绝", True, response.json())
        elif response.status_code == 200:
            print_result("无权限访问被正确拒绝", False, {"error": "应该返回403但返回了200"})
        else:
            print_result("无权限访问被正确拒绝", False, response.json())
    except Exception as e:
        print_result("无权限访问被正确拒绝", False, {"error": str(e)})

    # 6. 总结
    print_section("测试总结")
    print("""
    RBAC权限系统基础功能测试完成!

    测试覆盖:
    ✓ 用户注册和认证
    ✓ 获取用户权限列表
    ✓ 检查特定权限
    ✓ 检查用户角色
    ✓ 权限拒绝机制

    如需测试管理员功能,请:
    1. 使用数据库工具为用户分配admin角色
    2. 或使用管理员账号重新测试

    数据库位置: ./notebook.db
    相关表: users, roles, permissions, user_roles, role_permissions
    """)

if __name__ == "__main__":
    print("""
╔══════════════════════════════════════════════════════════╗
║         RBAC权限系统测试脚本                             ║
║                                                          ║
║  测试内容:                                               ║
║  1. 用户注册和权限分配                                   ║
║  2. 权限查询和验证                                       ║
║  3. 角色检查                                             ║
║  4. 权限拒绝机制                                         ║
╚══════════════════════════════════════════════════════════╝
    """)

    # 检查服务器是否运行
    try:
        response = requests.get(f"{BASE_URL}/health")
        if response.status_code == 200:
            print("✓ 服务器运行正常\n")
            test_rbac_system()
        else:
            print("✗ 服务器响应异常")
    except Exception as e:
        print(f"✗ 无法连接到服务器: {e}")
        print(f"\n请确保后端服务已启动:")
        print(f"  cd backend")
        print(f"  python main.py")
