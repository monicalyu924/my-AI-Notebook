"""
RBAC权限管理路由
用于管理角色、权限和用户角色分配
"""

from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from datetime import datetime
from pydantic import BaseModel

from auth import get_current_user, require_role, require_permission
from models import User
from database_sqlite import get_connection
from middleware import rbac_checker
import uuid

router = APIRouter(prefix="/api/rbac", tags=["RBAC权限管理"])

# ===== Pydantic 模型 =====

class RoleResponse(BaseModel):
    """角色响应模型"""
    id: str
    name: str
    display_name: str
    description: str = None
    level: int
    created_at: str
    updated_at: str

class PermissionResponse(BaseModel):
    """权限响应模型"""
    id: str
    name: str
    display_name: str
    resource: str
    action: str
    description: str = None
    created_at: str

class UserRoleAssignment(BaseModel):
    """用户角色分配模型"""
    user_id: str
    role_id: str
    expires_at: str = None

class UserPermissionGrant(BaseModel):
    """用户权限授予模型"""
    user_id: str
    permission_id: str
    expires_at: str = None

class UserPermissionsResponse(BaseModel):
    """用户权限响应"""
    user_id: str
    roles: List[dict]
    permissions: List[str]
    role_level: int

# ===== 角色管理接口 =====

@router.get("/roles", response_model=List[RoleResponse])
async def get_all_roles(
    current_user: User = Depends(require_permission("roles.manage"))
):
    """获取所有角色列表(需要roles.manage权限)"""
    conn = get_connection()
    cursor = conn.cursor()

    try:
        cursor.execute('''
            SELECT * FROM roles ORDER BY level DESC
        ''')

        roles = [dict(row) for row in cursor.fetchall()]
        return roles

    finally:
        conn.close()

@router.get("/roles/{role_id}", response_model=RoleResponse)
async def get_role(
    role_id: str,
    current_user: User = Depends(require_permission("roles.manage"))
):
    """获取单个角色详情"""
    conn = get_connection()
    cursor = conn.cursor()

    try:
        cursor.execute('SELECT * FROM roles WHERE id = ?', (role_id,))
        role = cursor.fetchone()

        if not role:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="角色不存在"
            )

        return dict(role)

    finally:
        conn.close()

@router.get("/roles/{role_id}/permissions", response_model=List[PermissionResponse])
async def get_role_permissions(
    role_id: str,
    current_user: User = Depends(require_permission("roles.manage"))
):
    """获取角色拥有的所有权限"""
    conn = get_connection()
    cursor = conn.cursor()

    try:
        cursor.execute('''
            SELECT p.*
            FROM role_permissions rp
            JOIN permissions p ON rp.permission_id = p.id
            WHERE rp.role_id = ?
        ''', (role_id,))

        permissions = [dict(row) for row in cursor.fetchall()]
        return permissions

    finally:
        conn.close()

# ===== 权限管理接口 =====

@router.get("/permissions", response_model=List[PermissionResponse])
async def get_all_permissions(
    current_user: User = Depends(require_permission("roles.manage"))
):
    """获取所有权限列表"""
    conn = get_connection()
    cursor = conn.cursor()

    try:
        cursor.execute('''
            SELECT * FROM permissions ORDER BY resource, action
        ''')

        permissions = [dict(row) for row in cursor.fetchall()]
        return permissions

    finally:
        conn.close()

@router.get("/permissions/by-resource/{resource}")
async def get_permissions_by_resource(
    resource: str,
    current_user: User = Depends(require_permission("roles.manage"))
):
    """按资源获取权限"""
    conn = get_connection()
    cursor = conn.cursor()

    try:
        cursor.execute('''
            SELECT * FROM permissions WHERE resource = ?
        ''', (resource,))

        permissions = [dict(row) for row in cursor.fetchall()]
        return permissions

    finally:
        conn.close()

# ===== 用户角色管理接口 =====

@router.post("/users/{user_id}/roles")
async def assign_role_to_user(
    user_id: str,
    assignment: UserRoleAssignment,
    current_user: User = Depends(require_permission("roles.manage"))
):
    """为用户分配角色"""
    conn = get_connection()
    cursor = conn.cursor()

    try:
        # 检查用户是否存在
        cursor.execute('SELECT id FROM users WHERE id = ?', (user_id,))
        if not cursor.fetchone():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="用户不存在"
            )

        # 检查角色是否存在
        cursor.execute('SELECT id FROM roles WHERE id = ?', (assignment.role_id,))
        if not cursor.fetchone():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="角色不存在"
            )

        # 分配角色
        now = datetime.utcnow().isoformat() + 'Z'
        cursor.execute('''
            INSERT OR REPLACE INTO user_roles
            (user_id, role_id, assigned_at, assigned_by, expires_at)
            VALUES (?, ?, ?, ?, ?)
        ''', (user_id, assignment.role_id, now, current_user.id, assignment.expires_at))

        conn.commit()

        # 清除用户权限缓存
        rbac_checker.clear_user_cache(user_id)

        return {
            "message": "角色分配成功",
            "user_id": user_id,
            "role_id": assignment.role_id
        }

    finally:
        conn.close()

@router.delete("/users/{user_id}/roles/{role_id}")
async def revoke_role_from_user(
    user_id: str,
    role_id: str,
    current_user: User = Depends(require_permission("roles.manage"))
):
    """撤销用户的角色"""
    conn = get_connection()
    cursor = conn.cursor()

    try:
        cursor.execute('''
            DELETE FROM user_roles
            WHERE user_id = ? AND role_id = ?
        ''', (user_id, role_id))

        if cursor.rowcount == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="用户角色关联不存在"
            )

        conn.commit()

        # 清除用户权限缓存
        rbac_checker.clear_user_cache(user_id)

        return {
            "message": "角色撤销成功",
            "user_id": user_id,
            "role_id": role_id
        }

    finally:
        conn.close()

@router.get("/users/{user_id}/roles")
async def get_user_roles(
    user_id: str,
    current_user: User = Depends(get_current_user)
):
    """获取用户的所有角色"""
    # 只能查看自己的角色或需要roles.manage权限
    if current_user.id != user_id and not rbac_checker.has_permission(current_user.id, "roles.manage"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="无权查看其他用户的角色"
        )

    roles = rbac_checker.get_user_roles(user_id)
    return {"user_id": user_id, "roles": roles}

# ===== 用户权限管理接口 =====

@router.post("/users/{user_id}/permissions")
async def grant_permission_to_user(
    user_id: str,
    grant: UserPermissionGrant,
    current_user: User = Depends(require_permission("roles.manage"))
):
    """直接为用户授予权限(特殊情况使用)"""
    conn = get_connection()
    cursor = conn.cursor()

    try:
        # 检查用户是否存在
        cursor.execute('SELECT id FROM users WHERE id = ?', (user_id,))
        if not cursor.fetchone():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="用户不存在"
            )

        # 检查权限是否存在
        cursor.execute('SELECT id FROM permissions WHERE id = ?', (grant.permission_id,))
        if not cursor.fetchone():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="权限不存在"
            )

        # 授予权限
        now = datetime.utcnow().isoformat() + 'Z'
        cursor.execute('''
            INSERT OR REPLACE INTO user_permissions
            (user_id, permission_id, granted_at, granted_by, expires_at)
            VALUES (?, ?, ?, ?, ?)
        ''', (user_id, grant.permission_id, now, current_user.id, grant.expires_at))

        conn.commit()

        # 清除用户权限缓存
        rbac_checker.clear_user_cache(user_id)

        return {
            "message": "权限授予成功",
            "user_id": user_id,
            "permission_id": grant.permission_id
        }

    finally:
        conn.close()

@router.delete("/users/{user_id}/permissions/{permission_id}")
async def revoke_permission_from_user(
    user_id: str,
    permission_id: str,
    current_user: User = Depends(require_permission("roles.manage"))
):
    """撤销用户的直接权限"""
    conn = get_connection()
    cursor = conn.cursor()

    try:
        cursor.execute('''
            DELETE FROM user_permissions
            WHERE user_id = ? AND permission_id = ?
        ''', (user_id, permission_id))

        if cursor.rowcount == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="用户权限关联不存在"
            )

        conn.commit()

        # 清除用户权限缓存
        rbac_checker.clear_user_cache(user_id)

        return {
            "message": "权限撤销成功",
            "user_id": user_id,
            "permission_id": permission_id
        }

    finally:
        conn.close()

@router.get("/users/{user_id}/permissions", response_model=UserPermissionsResponse)
async def get_user_permissions(
    user_id: str,
    current_user: User = Depends(get_current_user)
):
    """获取用户的所有权限(包括角色权限和直接权限)"""
    # 只能查看自己的权限或需要roles.manage权限
    if current_user.id != user_id and not rbac_checker.has_permission(current_user.id, "roles.manage"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="无权查看其他用户的权限"
        )

    roles = rbac_checker.get_user_roles(user_id)
    permissions = list(rbac_checker.get_user_permissions(user_id))
    role_level = rbac_checker.get_highest_role_level(user_id)

    return {
        "user_id": user_id,
        "roles": roles,
        "permissions": permissions,
        "role_level": role_level
    }

# ===== 当前用户权限查询接口 =====

@router.get("/me/permissions")
async def get_my_permissions(
    current_user: User = Depends(get_current_user)
):
    """获取当前用户的所有权限"""
    roles = rbac_checker.get_user_roles(current_user.id)
    permissions = list(rbac_checker.get_user_permissions(current_user.id))
    role_level = rbac_checker.get_highest_role_level(current_user.id)

    return {
        "user_id": current_user.id,
        "email": current_user.email,
        "roles": roles,
        "permissions": permissions,
        "role_level": role_level
    }

@router.get("/me/check-permission/{permission}")
async def check_my_permission(
    permission: str,
    current_user: User = Depends(get_current_user)
):
    """检查当前用户是否拥有指定权限"""
    has_perm = rbac_checker.has_permission(current_user.id, permission)

    return {
        "permission": permission,
        "has_permission": has_perm
    }

@router.get("/me/check-role/{role_name}")
async def check_my_role(
    role_name: str,
    current_user: User = Depends(get_current_user)
):
    """检查当前用户是否拥有指定角色"""
    has_role = rbac_checker.has_role(current_user.id, role_name)

    return {
        "role_name": role_name,
        "has_role": has_role
    }
