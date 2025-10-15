from typing import List
from fastapi import APIRouter, HTTPException, status, Depends
from database import user_repo, notes_repo
from auth import get_current_admin_user, require_admin
from models import User, UserListResponse, AdminUserUpdate, SystemStats

router = APIRouter(prefix="/admin", tags=["admin"])

@router.get("/users", response_model=List[UserListResponse])
async def get_all_users(admin_user: User = Depends(require_admin)):
    """
    获取所有用户列表（仅管理员）
    """
    users_data = user_repo.get_all_users()

    # 为每个用户添加统计信息
    users_with_stats = []
    for user_data in users_data:
        stats = user_repo.get_user_stats(user_data['id'])
        user_response = UserListResponse(
            **user_data,
            notes_count=stats.get('notes_count', 0),
            todos_count=stats.get('todos_count', 0)
        )
        users_with_stats.append(user_response)

    return users_with_stats

@router.get("/users/{user_id}", response_model=UserListResponse)
async def get_user_details(
    user_id: str,
    admin_user: User = Depends(require_admin)
):
    """
    获取指定用户详情（仅管理员）
    """
    user_data = user_repo.get_user_by_id(user_id)

    if not user_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="用户不存在"
        )

    stats = user_repo.get_user_stats(user_id)
    return UserListResponse(
        **user_data,
        notes_count=stats.get('notes_count', 0),
        todos_count=stats.get('todos_count', 0)
    )

@router.put("/users/{user_id}", response_model=User)
async def update_user(
    user_id: str,
    user_update: AdminUserUpdate,
    admin_user: User = Depends(require_admin)
):
    """
    更新用户信息（仅管理员）
    可以修改角色、姓名等
    """
    # 检查用户是否存在
    existing_user = user_repo.get_user_by_id(user_id)
    if not existing_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="用户不存在"
        )

    # 防止删除最后一个管理员
    if user_update.role == "user" and existing_user.get('role') == 'admin':
        # 检查是否还有其他管理员
        all_users = user_repo.get_all_users()
        admin_count = sum(1 for u in all_users if u.get('role') == 'admin')
        if admin_count <= 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="不能删除最后一个管理员账户"
            )

    # 准备更新数据
    update_data = {}
    if user_update.full_name is not None:
        update_data["full_name"] = user_update.full_name
    if user_update.role is not None:
        update_data["role"] = user_update.role
    if user_update.openrouter_api_key is not None:
        update_data["openrouter_api_key"] = user_update.openrouter_api_key

    updated_user = user_repo.update_user(user_id, **update_data)
    return User(**updated_user)

@router.delete("/users/{user_id}")
async def delete_user(
    user_id: str,
    admin_user: User = Depends(require_admin)
):
    """
    删除用户（仅管理员）
    会级联删除该用户的所有数据
    """
    # 不能删除自己
    if user_id == admin_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="不能删除自己的账户"
        )

    # 检查用户是否存在
    existing_user = user_repo.get_user_by_id(user_id)
    if not existing_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="用户不存在"
        )

    # 防止删除最后一个管理员
    if existing_user.get('role') == 'admin':
        all_users = user_repo.get_all_users()
        admin_count = sum(1 for u in all_users if u.get('role') == 'admin')
        if admin_count <= 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="不能删除最后一个管理员账户"
            )

    success = user_repo.delete_user(user_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="删除用户失败"
        )

    return {"message": "用户已删除", "user_id": user_id}

@router.get("/stats", response_model=SystemStats)
async def get_system_stats(admin_user: User = Depends(require_admin)):
    """
    获取系统统计信息（仅管理员）
    """
    all_users = user_repo.get_all_users()

    # 统计用户角色
    admin_users = sum(1 for u in all_users if u.get('role') == 'admin')
    regular_users = len(all_users) - admin_users

    # 统计笔记总数
    total_notes = 0
    total_todos = 0
    for user in all_users:
        stats = user_repo.get_user_stats(user['id'])
        total_notes += stats.get('notes_count', 0)
        total_todos += stats.get('todos_count', 0)

    # 统计项目数（如果有boards表）
    total_projects = 0
    try:
        import sqlite3
        conn = sqlite3.connect('notebook.db')
        cursor = conn.cursor()
        cursor.execute('SELECT COUNT(*) as count FROM boards')
        result = cursor.fetchone()
        total_projects = result[0] if result else 0
        conn.close()
    except:
        pass

    return SystemStats(
        total_users=len(all_users),
        total_notes=total_notes,
        total_todos=total_todos,
        total_projects=total_projects,
        admin_users=admin_users,
        regular_users=regular_users
    )
