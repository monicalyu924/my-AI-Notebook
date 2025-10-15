# RBAC权限系统使用指南

## 📋 目录

1. [系统概述](#系统概述)
2. [核心概念](#核心概念)
3. [数据库结构](#数据库结构)
4. [API使用](#api使用)
5. [代码示例](#代码示例)
6. [最佳实践](#最佳实践)

---

## 系统概述

本系统实现了完整的RBAC(基于角色的访问控制)权限管理,支持:

- ✅ **多角色支持**: 用户可以拥有多个角色
- ✅ **灵活的权限分配**: 支持角色权限和直接用户权限
- ✅ **权限继承**: 通过角色级别实现权限层级
- ✅ **权限缓存**: 自动缓存提升性能
- ✅ **过期机制**: 支持角色和权限的过期时间

---

## 核心概念

### 1. 角色 (Roles)

系统预定义了6种角色,按权限级别从高到低:

| 角色 | 名称 | 级别 | 说明 |
|-----|------|------|------|
| `super_admin` | 超级管理员 | 100 | 拥有系统所有权限 |
| `admin` | 管理员 | 80 | 管理用户和系统配置 |
| `editor` | 编辑 | 60 | 创建和编辑所有内容 |
| `collaborator` | 协作者 | 40 | 查看和评论共享内容 |
| `user` | 普通用户 | 20 | 管理自己的笔记和待办 |
| `guest` | 访客 | 10 | 只读权限 |

### 2. 权限 (Permissions)

权限格式: `resource.action`

#### 笔记权限
- `notes.create` - 创建笔记
- `notes.read` - 查看笔记
- `notes.update` - 编辑笔记
- `notes.delete` - 删除笔记
- `notes.share` - 分享笔记

#### 待办权限
- `todos.create` - 创建待办
- `todos.read` - 查看待办
- `todos.update` - 编辑待办
- `todos.delete` - 删除待办

#### 项目权限
- `projects.create` - 创建项目
- `projects.read` - 查看项目
- `projects.update` - 编辑项目
- `projects.delete` - 删除项目

#### 用户管理权限
- `users.create` - 创建用户
- `users.read` - 查看用户
- `users.update` - 编辑用户
- `users.delete` - 删除用户

#### 系统权限
- `roles.manage` - 管理角色和权限
- `system.config` - 修改系统配置
- `system.stats` - 查看系统统计

### 3. 权限获取方式

用户可以通过两种方式获得权限:

1. **角色权限**: 通过分配的角色自动获得该角色的所有权限
2. **直接权限**: 管理员直接授予用户特定权限(特殊情况使用)

---

## 数据库结构

### 主要表结构

```sql
-- 角色表
CREATE TABLE roles (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    description TEXT,
    level INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

-- 权限表
CREATE TABLE permissions (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    resource TEXT NOT NULL,
    action TEXT NOT NULL,
    description TEXT,
    created_at TEXT NOT NULL
);

-- 角色-权限关联表
CREATE TABLE role_permissions (
    role_id TEXT NOT NULL,
    permission_id TEXT NOT NULL,
    created_at TEXT NOT NULL,
    PRIMARY KEY (role_id, permission_id)
);

-- 用户-角色关联表(支持多角色)
CREATE TABLE user_roles (
    user_id TEXT NOT NULL,
    role_id TEXT NOT NULL,
    assigned_at TEXT NOT NULL,
    assigned_by TEXT,
    expires_at TEXT,  -- 可选的过期时间
    PRIMARY KEY (user_id, role_id)
);

-- 用户直接权限表
CREATE TABLE user_permissions (
    user_id TEXT NOT NULL,
    permission_id TEXT NOT NULL,
    granted_at TEXT NOT NULL,
    granted_by TEXT,
    expires_at TEXT,
    PRIMARY KEY (user_id, permission_id)
);
```

---

## API使用

### 基础URL

所有RBAC API路径前缀: `/api/rbac`

### 1. 查询当前用户权限

```bash
GET /api/rbac/me/permissions
Authorization: Bearer {token}

# 响应
{
  "user_id": "xxx",
  "email": "user@example.com",
  "roles": [
    {
      "id": "role-id",
      "name": "user",
      "display_name": "普通用户",
      "level": 20,
      "assigned_at": "2025-01-01T00:00:00Z"
    }
  ],
  "permissions": [
    "notes.create",
    "notes.read",
    "notes.update",
    "notes.delete",
    ...
  ],
  "role_level": 20
}
```

### 2. 检查特定权限

```bash
GET /api/rbac/me/check-permission/{permission}
Authorization: Bearer {token}

# 示例
GET /api/rbac/me/check-permission/notes.create

# 响应
{
  "permission": "notes.create",
  "has_permission": true
}
```

### 3. 检查用户角色

```bash
GET /api/rbac/me/check-role/{role_name}
Authorization: Bearer {token}

# 示例
GET /api/rbac/me/check-role/admin

# 响应
{
  "role_name": "admin",
  "has_role": false
}
```

### 4. 管理员功能

#### 获取所有角色

```bash
GET /api/rbac/roles
Authorization: Bearer {token}
需要权限: roles.manage

# 响应
[
  {
    "id": "role-id",
    "name": "admin",
    "display_name": "管理员",
    "description": "管理用户和系统配置",
    "level": 80,
    "created_at": "2025-01-01T00:00:00Z",
    "updated_at": "2025-01-01T00:00:00Z"
  },
  ...
]
```

#### 为用户分配角色

```bash
POST /api/rbac/users/{user_id}/roles
Authorization: Bearer {token}
需要权限: roles.manage
Content-Type: application/json

{
  "user_id": "user-id",
  "role_id": "role-id",
  "expires_at": null  // 可选,null表示永久有效
}

# 响应
{
  "message": "角色分配成功",
  "user_id": "user-id",
  "role_id": "role-id"
}
```

#### 撤销用户角色

```bash
DELETE /api/rbac/users/{user_id}/roles/{role_id}
Authorization: Bearer {token}
需要权限: roles.manage

# 响应
{
  "message": "角色撤销成功",
  "user_id": "user-id",
  "role_id": "role-id"
}
```

#### 获取用户权限

```bash
GET /api/rbac/users/{user_id}/permissions
Authorization: Bearer {token}
需要权限: roles.manage (或查询自己)

# 响应
{
  "user_id": "user-id",
  "roles": [...],
  "permissions": [...],
  "role_level": 20
}
```

---

## 代码示例

### 1. 在路由中使用权限检查

#### 示例1: 要求单个权限

```python
from fastapi import APIRouter, Depends
from auth import get_current_user, require_permission
from models import User

router = APIRouter()

@router.get("/notes")
async def get_notes(
    current_user: User = Depends(require_permission("notes.read"))
):
    """获取笔记列表 - 需要notes.read权限"""
    # 业务逻辑
    return {"notes": []}
```

#### 示例2: 要求多个权限(任一)

```python
from auth import require_any_permission

@router.get("/content")
async def get_content(
    current_user: User = Depends(require_any_permission("notes.read", "todos.read"))
):
    """获取内容 - 需要notes.read或todos.read权限"""
    return {"content": []}
```

#### 示例3: 要求多个权限(全部)

```python
from auth import require_all_permissions

@router.post("/admin-action")
async def admin_action(
    current_user: User = Depends(require_all_permissions("users.manage", "system.config"))
):
    """管理员操作 - 需要users.manage和system.config权限"""
    return {"success": True}
```

#### 示例4: 要求特定角色

```python
from auth import require_role

@router.get("/admin-panel")
async def admin_panel(
    current_user: User = Depends(require_role("admin"))
):
    """管理员面板 - 需要admin角色"""
    return {"panel": "admin"}
```

#### 示例5: 要求最低角色级别

```python
from auth import require_min_role_level

@router.get("/editor-content")
async def editor_content(
    current_user: User = Depends(require_min_role_level(60))
):
    """编辑内容 - 需要级别≥60的角色(editor及以上)"""
    return {"content": "editor"}
```

### 2. 资源所有权检查

```python
from auth import check_resource_access
from database_sqlite import notes_repo

@router.get("/notes/{note_id}")
async def get_note(
    note_id: str,
    current_user: User = Depends(get_current_user)
):
    """获取笔记 - 检查是否为所有者或拥有权限"""
    # 获取笔记
    note = notes_repo.get_note_by_id(note_id, current_user.id)

    if not note:
        raise HTTPException(status_code=404, detail="笔记不存在")

    # 检查访问权限
    # 如果是笔记所有者,自动允许
    # 否则需要notes.read权限
    await check_resource_access(
        resource_owner_id=note['user_id'],
        required_permission="notes.read",
        current_user=current_user
    )

    return note
```

### 3. 手动权限检查

```python
from middleware import rbac_checker

@router.post("/complex-action")
async def complex_action(
    current_user: User = Depends(get_current_user)
):
    """复杂操作 - 手动检查多个权限"""

    # 检查是否有创建权限
    can_create = rbac_checker.has_permission(current_user.id, "notes.create")

    # 检查是否有分享权限
    can_share = rbac_checker.has_permission(current_user.id, "notes.share")

    # 获取用户角色级别
    role_level = rbac_checker.get_highest_role_level(current_user.id)

    # 根据权限执行不同逻辑
    if can_create and can_share and role_level >= 40:
        # 执行完整操作
        return {"action": "full"}
    elif can_create:
        # 执行基础操作
        return {"action": "basic"}
    else:
        raise HTTPException(status_code=403, detail="权限不足")
```

### 4. 获取用户权限列表

```python
from auth import get_user_permissions, get_user_roles_info

@router.get("/my-profile")
async def get_my_profile(
    current_user: User = Depends(get_current_user),
    permissions: List[str] = Depends(get_user_permissions),
    roles: List[dict] = Depends(get_user_roles_info)
):
    """获取用户资料(包含权限和角色信息)"""
    return {
        "user": current_user,
        "permissions": permissions,
        "roles": roles
    }
```

---

## 最佳实践

### 1. 权限命名规范

- 使用 `resource.action` 格式
- 资源名用复数: `notes`, `users`, `projects`
- 操作名用标准CRUD: `create`, `read`, `update`, `delete`
- 特殊操作清晰命名: `share`, `export`, `manage`

### 2. 角色设计原则

- **最小权限原则**: 每个角色只分配必要的权限
- **职责分离**: 不同职责使用不同角色
- **层级设计**: 使用level字段实现权限继承
- **避免过多角色**: 保持角色数量在合理范围

### 3. 权限检查位置

```python
# ✅ 推荐: 在路由依赖项中检查
@router.get("/notes", dependencies=[Depends(require_permission("notes.read"))])
async def get_notes(): ...

# ✅ 推荐: 在参数中检查
@router.get("/notes")
async def get_notes(user: User = Depends(require_permission("notes.read"))): ...

# ⚠️ 可用: 在函数内部检查(复杂逻辑时)
@router.get("/notes")
async def get_notes(user: User = Depends(get_current_user)):
    if not rbac_checker.has_permission(user.id, "notes.read"):
        raise HTTPException(403)
    ...
```

### 4. 缓存管理

```python
from middleware import rbac_checker

# 用户权限变更后,清除缓存
rbac_checker.clear_user_cache(user_id)

# 系统会自动缓存用户权限5分钟
# 无需手动管理大部分情况
```

### 5. 资源所有权 vs 权限

```python
# 对于用户自己的资源,允许直接访问
if current_user.id == resource.owner_id:
    # 允许操作
    pass
# 对于他人资源,需要检查权限
elif rbac_checker.has_permission(current_user.id, "notes.read"):
    # 允许操作
    pass
else:
    # 拒绝访问
    raise HTTPException(403)
```

### 6. 前端权限控制

```javascript
// 在前端也应该检查权限来隐藏/禁用UI元素
// 但后端验证是必须的!

// 获取用户权限
const permissions = await api.get('/api/rbac/me/permissions');

// 检查权限
if (permissions.permissions.includes('notes.create')) {
  // 显示创建按钮
}

// 检查角色
if (permissions.role_level >= 80) {
  // 显示管理员功能
}
```

---

## 故障排查

### 问题1: 权限检查总是失败

**可能原因**:
- 用户没有分配角色
- 角色没有分配权限
- 权限已过期

**解决方法**:
```sql
-- 检查用户角色
SELECT * FROM user_roles WHERE user_id = 'xxx';

-- 检查角色权限
SELECT p.name
FROM role_permissions rp
JOIN permissions p ON rp.permission_id = p.id
WHERE rp.role_id = 'xxx';
```

### 问题2: 权限缓存不更新

**解决方法**:
```python
from middleware import rbac_checker

# 手动清除用户缓存
rbac_checker.clear_user_cache(user_id)
```

### 问题3: 新用户没有默认权限

**解决方法**:
数据库初始化时会自动为所有现有用户分配角色。新注册用户需要在注册后分配角色:

```python
# 在用户注册后
from database_sqlite import get_connection
import uuid

conn = get_connection()
cursor = conn.cursor()

# 获取user角色ID
cursor.execute("SELECT id FROM roles WHERE name = 'user'")
user_role = cursor.fetchone()

if user_role:
    cursor.execute('''
        INSERT INTO user_roles (user_id, role_id, assigned_at)
        VALUES (?, ?, ?)
    ''', (new_user_id, user_role['id'], datetime.utcnow().isoformat() + 'Z'))
    conn.commit()

conn.close()
```

---

## 测试

运行测试脚本:

```bash
cd backend
python test_rbac.py
```

测试覆盖:
- ✅ 用户注册和认证
- ✅ 获取用户权限
- ✅ 检查特定权限
- ✅ 检查用户角色
- ✅ 权限拒绝机制

---

## 更多信息

- **数据库文件**: `backend/notebook.db`
- **中间件代码**: `backend/middleware.py`
- **认证代码**: `backend/auth.py`
- **路由代码**: `backend/routers/rbac_router.py`
- **数据库初始化**: `backend/database_sqlite.py`

---

**文档版本**: 1.0.0
**最后更新**: 2025-10-14
**作者**: Claude Code Assistant
