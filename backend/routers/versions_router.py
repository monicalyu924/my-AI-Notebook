from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from auth import get_current_user
from models import User

router = APIRouter(prefix="/api/versions", tags=["versions"])

@router.get("/note/{note_id}")
async def get_note_versions(
    note_id: str,
    limit: int = 50,
    offset: int = 0,
    current_user: User = Depends(get_current_user)
):
    """获取笔记的版本历史 - 演示版本（返回空数组）"""
    return []

@router.post("/note/{note_id}/manual-save")
async def create_manual_version(
    note_id: str,
    current_user: User = Depends(get_current_user)
):
    """手动创建版本保存 - 演示版本"""
    return {"id": "demo-version", "note_id": note_id, "version_number": 1}

@router.post("/note/{note_id}/restore")
async def restore_version(
    note_id: str,
    current_user: User = Depends(get_current_user)
):
    """恢复版本 - 演示版本"""
    return {"message": "版本恢复功能暂不可用（演示模式）"}

@router.get("/note/{note_id}/compare")
async def compare_versions(
    note_id: str,
    version1_id: str,
    version2_id: str,
    current_user: User = Depends(get_current_user)
):
    """比较两个版本 - 演示版本"""
    return {"message": "版本比较功能暂不可用（演示模式）"}