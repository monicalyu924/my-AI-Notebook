from fastapi import APIRouter, HTTPException, status, Depends
import re
from database import user_repo
from auth import get_current_user
from models import User, UserUpdate

router = APIRouter(prefix="/user", tags=["user"])

@router.put("/profile", response_model=User)
async def update_user_profile(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_user)
):
    # Prepare update data
    update_data = {}
    if user_update.full_name is not None:
        update_data["full_name"] = user_update.full_name
    if user_update.openrouter_api_key is not None:
        key = (user_update.openrouter_api_key or "").strip()
        # 仅允许 OpenRouter 密钥（通常以 sk-or- 开头）。
        # 来自 Anthropic/Claude Code 的密钥或其他提供商的密钥将被拒绝，以避免后续 400 错误。
        if key and not key.startswith("sk-or-"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "无效的 OpenRouter API 密钥。请使用以 sk-or- 开头的 OpenRouter 密钥。"
                    "注意：Claude Code/Anthropic 控制台生成的密钥不能用于本应用。"
                ),
            )
        update_data["openrouter_api_key"] = key
    
    if not update_data:
        return current_user
    
    updated_user = user_repo.update_user(current_user.id, **update_data)
    if not updated_user:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update user profile"
        )
    
    return User(**updated_user)
