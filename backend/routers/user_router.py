from fastapi import APIRouter, HTTPException, status, Depends
from database_sqlite import user_repo
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
        update_data["openrouter_api_key"] = user_update.openrouter_api_key
    
    if not update_data:
        return current_user
    
    updated_user = user_repo.update_user(current_user.id, **update_data)
    if not updated_user:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update user profile"
        )
    
    return User(**updated_user)
