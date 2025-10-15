from typing import List, Optional
from fastapi import APIRouter, HTTPException, status, Depends, Query
from database import notes_repo
from auth import get_current_user
from models import Note, NoteCreate, NoteUpdate, User

router = APIRouter(prefix="/notes", tags=["notes"])

@router.get("/", response_model=List[Note])
async def get_notes(
    folder_id: Optional[str] = Query(None, description="过滤指定文件夹的笔记，null获取未分类笔记"),
    current_user: User = Depends(get_current_user)
):
    notes_data = notes_repo.get_notes_by_user(current_user.id)
    return [Note(**note) for note in notes_data]

@router.get("/{note_id}", response_model=Note)
async def get_note(note_id: str, current_user: User = Depends(get_current_user)):
    note_data = notes_repo.get_note_by_id(note_id, current_user.id)
    
    if not note_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Note not found"
        )
    
    return Note(**note_data)

@router.post("/", response_model=Note)
async def create_note(note: NoteCreate, current_user: User = Depends(get_current_user)):
    try:
        created_note = notes_repo.create_note(
            title=note.title,
            content=note.content,
            tags=note.tags,
            user_id=current_user.id
        )
        return Note(**created_note)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create note: {str(e)}"
        )

@router.put("/{note_id}", response_model=Note)
async def update_note(note_id: str, note_update: NoteUpdate, current_user: User = Depends(get_current_user)):
    # Prepare update data
    update_data = {}
    if note_update.title is not None:
        update_data["title"] = note_update.title
    if note_update.content is not None:
        update_data["content"] = note_update.content
    if note_update.tags is not None:
        update_data["tags"] = note_update.tags
    
    updated_note = notes_repo.update_note(note_id, current_user.id, **update_data)
    if not updated_note:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Note not found"
        )
    
    return Note(**updated_note)

@router.delete("/{note_id}")
async def delete_note(note_id: str, current_user: User = Depends(get_current_user)):
    success = notes_repo.delete_note(note_id, current_user.id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Note not found"
        )

    return {"message": "Note deleted successfully"}

@router.get("/search/query", response_model=List[Note])
async def search_notes(
    q: str = Query(..., min_length=1, description="搜索关键词"),
    limit: int = Query(50, ge=1, le=100, description="返回结果数量限制"),
    current_user: User = Depends(get_current_user)
):
    """
    全文搜索笔记
    - 支持搜索标题和内容
    - 按相关度排序
    - 支持FTS5语法：AND、OR、NOT等
    """
    notes_data = notes_repo.search_notes(current_user.id, q, limit)
    return [Note(**note) for note in notes_data]

# Phase 3.4 - 高级搜索功能
@router.get("/search/advanced", response_model=List[Note])
async def advanced_search_notes(
    q: Optional[str] = Query(None, description="搜索关键词（可选）"),
    tags: Optional[str] = Query(None, description="标签过滤（逗号分隔）"),
    folder_id: Optional[str] = Query(None, description="文件夹ID过滤"),
    date_from: Optional[str] = Query(None, description="起始日期（YYYY-MM-DD）"),
    date_to: Optional[str] = Query(None, description="结束日期（YYYY-MM-DD）"),
    sort_by: str = Query("updated_at", description="排序字段：updated_at, created_at, title"),
    sort_order: str = Query("desc", description="排序方向：asc, desc"),
    limit: int = Query(50, ge=1, le=200, description="返回结果数量限制"),
    current_user: User = Depends(get_current_user)
):
    """
    高级搜索笔记
    - 支持多条件组合搜索
    - 可按标签、文件夹、日期范围过滤
    - 支持自定义排序
    """
    from datetime import datetime

    # 构建查询条件
    filters = {}

    # 标签过滤
    if tags:
        tag_list = [t.strip() for t in tags.split(',') if t.strip()]
        filters['tags'] = tag_list

    # 文件夹过滤
    if folder_id:
        filters['folder_id'] = folder_id

    # 日期范围过滤
    if date_from:
        try:
            filters['date_from'] = datetime.strptime(date_from, '%Y-%m-%d').isoformat()
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date_from format. Use YYYY-MM-DD")

    if date_to:
        try:
            # 添加一天以包含整个结束日期
            date_to_dt = datetime.strptime(date_to, '%Y-%m-%d')
            filters['date_to'] = date_to_dt.replace(hour=23, minute=59, second=59).isoformat()
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date_to format. Use YYYY-MM-DD")

    # 如果有搜索关键词，使用全文搜索
    if q:
        notes_data = notes_repo.advanced_search(
            user_id=current_user.id,
            query=q,
            filters=filters,
            sort_by=sort_by,
            sort_order=sort_order,
            limit=limit
        )
    else:
        # 没有关键词，只按条件过滤
        notes_data = notes_repo.filter_notes(
            user_id=current_user.id,
            filters=filters,
            sort_by=sort_by,
            sort_order=sort_order,
            limit=limit
        )

    return [Note(**note) for note in notes_data]
