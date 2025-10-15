from datetime import datetime, timedelta
from typing import Optional, List, Callable
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import HTTPException, status, Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from database import user_repo
from config import settings
from models import User, TokenData

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT token handling
security = HTTPBearer()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(credentials.credentials, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        token_data = TokenData(email=email)
    except JWTError:
        raise credentials_exception
    
    user_data = user_repo.get_user_by_email(token_data.email)
    
    if not user_data:
        raise credentials_exception
    
    return User(**user_data)

async def authenticate_user(email: str, password: str) -> Optional[User]:
    user_data = user_repo.get_user_by_email(email)

    if not user_data:
        return None

    if not verify_password(password, user_data["password_hash"]):
        return None

    return User(**user_data)

async def get_current_admin_user(current_user: User = Depends(get_current_user)) -> User:
    """验证当前用户是否为管理员"""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="只有管理员可以执行此操作"
        )
    return current_user

def require_admin(current_user: User = Depends(get_current_user)) -> User:
    """要求管理员权限的依赖项(兼容旧版本)"""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="需要管理员权限才能访问此资源"
        )
    return current_user

# ===== RBAC权限依赖项 =====

def require_permission(permission: str) -> Callable:
    """
    创建一个权限检查依赖项

    用法:
        @app.get("/notes", dependencies=[Depends(require_permission("notes.read"))])
        async def get_notes(): ...
    """
    async def permission_checker(current_user: User = Depends(get_current_user)) -> User:
        from middleware import rbac_checker

        if not rbac_checker.has_permission(current_user.id, permission):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"缺少必要权限: {permission}"
            )
        return current_user

    return permission_checker

def require_any_permission(*permissions: str) -> Callable:
    """
    创建一个权限检查依赖项(需要拥有任一权限)

    用法:
        @app.get("/content", dependencies=[Depends(require_any_permission("notes.read", "todos.read"))])
        async def get_content(): ...
    """
    async def permission_checker(current_user: User = Depends(get_current_user)) -> User:
        from middleware import rbac_checker

        if not rbac_checker.has_any_permission(current_user.id, list(permissions)):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"缺少以下任一权限: {', '.join(permissions)}"
            )
        return current_user

    return permission_checker

def require_all_permissions(*permissions: str) -> Callable:
    """
    创建一个权限检查依赖项(需要拥有所有权限)

    用法:
        @app.post("/admin-action", dependencies=[Depends(require_all_permissions("users.manage", "system.config"))])
        async def admin_action(): ...
    """
    async def permission_checker(current_user: User = Depends(get_current_user)) -> User:
        from middleware import rbac_checker

        if not rbac_checker.has_all_permissions(current_user.id, list(permissions)):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"缺少以下所有权限: {', '.join(permissions)}"
            )
        return current_user

    return permission_checker

def require_role(role_name: str) -> Callable:
    """
    创建一个角色检查依赖项

    用法:
        @app.get("/admin-panel", dependencies=[Depends(require_role("admin"))])
        async def admin_panel(): ...
    """
    async def role_checker(current_user: User = Depends(get_current_user)) -> User:
        from middleware import rbac_checker

        if not rbac_checker.has_role(current_user.id, role_name):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"需要角色: {role_name}"
            )
        return current_user

    return role_checker

def require_min_role_level(min_level: int) -> Callable:
    """
    创建一个角色级别检查依赖项

    用法:
        @app.get("/editor-content", dependencies=[Depends(require_min_role_level(60))])
        async def editor_content(): ...
    """
    async def level_checker(current_user: User = Depends(get_current_user)) -> User:
        from middleware import rbac_checker

        user_level = rbac_checker.get_highest_role_level(current_user.id)
        if user_level < min_level:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"需要角色级别至少为 {min_level},当前级别: {user_level}"
            )
        return current_user

    return level_checker

async def check_resource_access(
    resource_owner_id: str,
    required_permission: str,
    current_user: User = Depends(get_current_user)
) -> User:
    """
    检查用户是否可以访问特定资源
    - 如果是资源所有者,允许访问
    - 如果拥有所需权限,允许访问

    用法:
        @app.get("/notes/{note_id}")
        async def get_note(
            note_id: str,
            current_user: User = Depends(get_current_user)
        ):
            note = get_note_from_db(note_id)
            await check_resource_access(note.user_id, "notes.read", current_user)
            return note
    """
    from middleware import rbac_checker

    if not rbac_checker.can_access_resource(current_user.id, resource_owner_id, required_permission):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"您没有权限访问此资源"
        )

    return current_user

def get_user_permissions(current_user: User = Depends(get_current_user)) -> List[str]:
    """
    获取当前用户的所有权限(可用于依赖注入)

    用法:
        @app.get("/permissions")
        async def get_my_permissions(permissions: List[str] = Depends(get_user_permissions)):
            return {"permissions": permissions}
    """
    from middleware import rbac_checker

    return list(rbac_checker.get_user_permissions(current_user.id))

def get_user_roles_info(current_user: User = Depends(get_current_user)) -> List[dict]:
    """
    获取当前用户的所有角色信息(可用于依赖注入)

    用法:
        @app.get("/roles")
        async def get_my_roles(roles: List[dict] = Depends(get_user_roles_info)):
            return {"roles": roles}
    """
    from middleware import rbac_checker

    return rbac_checker.get_user_roles(current_user.id)
