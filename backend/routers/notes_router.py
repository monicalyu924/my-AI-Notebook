from typing import List, Optional
from fastapi import APIRouter, HTTPException, status, Depends, Query
from database_sqlite import notes_repo
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
