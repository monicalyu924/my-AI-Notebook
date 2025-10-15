#!/usr/bin/env python3
"""
创建管理员账户的脚本
用法: python create_admin.py
"""

from database_sqlite import user_repo, init_database
from auth import get_password_hash

def create_admin_user():
    """创建管理员账户"""
    init_database()

    email = "admin@example.com"
    password = "admin123"
    full_name = "系统管理员"

    # 检查用户是否已存在
    existing_user = user_repo.get_user_by_email(email)
    if existing_user:
        print(f"✓ 管理员账户已存在: {email}")
        print(f"  角色: {existing_user.get('role', 'user')}")

        # 如果已存在但不是管理员，升级为管理员
        if existing_user.get('role') != 'admin':
            user_repo.update_user(existing_user['id'], role='admin')
            print(f"✓ 已将用户升级为管理员")
        return existing_user

    # 创建新的管理员账户
    password_hash = get_password_hash(password)
    admin_user = user_repo.create_user(
        email=email,
        password_hash=password_hash,
        full_name=full_name,
        role='admin'
    )

    print("=" * 50)
    print("✓ 管理员账户创建成功！")
    print("=" * 50)
    print(f"邮箱: {email}")
    print(f"密码: {password}")
    print(f"角色: {admin_user.get('role', 'admin')}")
    print("=" * 50)
    print("\n请使用以上凭据登录管理员面板")

    return admin_user

if __name__ == "__main__":
    create_admin_user()
