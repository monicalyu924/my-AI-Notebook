from fastapi import APIRouter, Depends
from typing import List
from auth import get_current_user
from models import User

router = APIRouter(prefix="/api/folders", tags=["folders"])

@router.get("/tree")
async def get_folders_tree(current_user: User = Depends(get_current_user)):
    """获取完整的文件夹树结构 - 演示版本（返回空数组）"""
    return []

@router.get("/")
async def get_folders(current_user: User = Depends(get_current_user)):
    """获取用户的文件夹列表 - 演示版本（返回空数组）"""
    return []