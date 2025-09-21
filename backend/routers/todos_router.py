from fastapi import APIRouter, Depends
from typing import List
from auth import get_current_user
from models import User

router = APIRouter(prefix="/todos", tags=["todos"])

@router.get("/")
async def get_todos(current_user: User = Depends(get_current_user)):
    """获取用户的待办事项列表 - 演示版本（返回空数组）"""
    return []

@router.get("/stats/summary")
async def get_todo_stats(current_user: User = Depends(get_current_user)):
    """获取待办事项统计信息 - 演示版本"""
    return {
        "total": 0,
        "completed": 0,
        "pending": 0,
        "overdue": 0
    }

@router.post("/")
async def create_todo(current_user: User = Depends(get_current_user)):
    """创建新的待办事项 - 演示版本"""
    return {"id": "demo-todo", "title": "演示待办事项", "completed": False}