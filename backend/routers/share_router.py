"""
笔记分享和评论路由
提供笔记分享链接生成、公开访问和评论功能
"""
from fastapi import APIRouter, HTTPException, status, Depends
from typing import List, Optional
from datetime import datetime, timedelta
from auth import get_current_user
from models import (
    User, NoteShareCreate, NoteShare, NoteSharePublic,
    SharedNoteView, Comment, CommentCreate, CommentUpdate
)
import secrets
import hashlib

router = APIRouter(prefix="/share", tags=["share"])

# 临时内存存储（实际应使用数据库）
shares_db = {}
comments_db = {}

def generate_share_token():
    """生成唯一的分享token"""
    return secrets.token_urlsafe(32)

def hash_password(password: str) -> str:
    """哈希密码"""
    return hashlib.sha256(password.encode()).hexdigest()

@router.post("/notes/{note_id}", response_model=NoteShare)
async def create_share_link(
    note_id: str,
    share_data: NoteShareCreate,
    current_user: User = Depends(get_current_user)
):
    """
    创建笔记分享链接
    需要用户登录并拥有该笔记
    """
    # 验证笔记所有权
    from database_sqlite import notes_repo
    note = notes_repo.get_note(note_id)

    if not note:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="笔记不存在"
        )

    if note['user_id'] != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="无权限分享此笔记"
        )

    # 生成分享记录
    share_token = generate_share_token()
    share_id = secrets.token_urlsafe(16)

    share = {
        'id': share_id,
        'note_id': note_id,
        'user_id': current_user.id,
        'share_token': share_token,
        'permission': share_data.permission,
        'expires_at': share_data.expires_at,
        'password': hash_password(share_data.password) if share_data.password else None,
        'view_count': 0,
        'created_at': datetime.now(),
        'updated_at': datetime.now()
    }

    shares_db[share_token] = share

    return NoteShare(**share)

@router.get("/view/{share_token}", response_model=SharedNoteView)
async def get_shared_note(
    share_token: str,
    password: Optional[str] = None
):
    """
    通过分享链接查看笔记（无需登录）
    """
    share = shares_db.get(share_token)

    if not share:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="分享链接不存在或已失效"
        )

    # 检查是否过期
    if share['expires_at'] and datetime.now() > share['expires_at']:
        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail="分享链接已过期"
        )

    # 检查密码
    if share['password']:
        if not password:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="需要提供访问密码"
            )
        if hash_password(password) != share['password']:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="密码错误"
            )

    # 增加查看次数
    share['view_count'] += 1

    # 获取笔记内容
    from database_sqlite import notes_repo
    note = notes_repo.get_note(share['note_id'])

    if not note:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="笔记不存在"
        )

    # 获取评论
    note_comments = [
        Comment(**c) for c in comments_db.values()
        if c['share_token'] == share_token
    ]

    return SharedNoteView(
        note=note,
        share_info=NoteSharePublic(
            id=share['id'],
            note_id=share['note_id'],
            permission=share['permission'],
            view_count=share['view_count'],
            created_at=share['created_at']
        ),
        comments=note_comments
    )

@router.post("/view/{share_token}/comments", response_model=Comment)
async def add_comment(
    share_token: str,
    comment_data: CommentCreate,
    current_user: Optional[User] = None
):
    """
    添加评论到分享的笔记
    游客和登录用户都可以评论
    """
    share = shares_db.get(share_token)

    if not share:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="分享链接不存在"
        )

    # 检查权限
    if share['permission'] != 'can_comment':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="此分享链接不允许评论"
        )

    # 创建评论
    comment_id = secrets.token_urlsafe(16)
    comment = {
        'id': comment_id,
        'note_id': share['note_id'],
        'share_token': share_token,
        'content': comment_data.content,
        'author_name': comment_data.author_name or "匿名",
        'author_email': comment_data.author_email,
        'user_id': current_user.id if current_user else None,
        'created_at': datetime.now(),
        'updated_at': datetime.now()
    }

    comments_db[comment_id] = comment

    return Comment(**comment)

@router.get("/my-shares", response_model=List[NoteShare])
async def get_my_shares(current_user: User = Depends(get_current_user)):
    """
    获取当前用户创建的所有分享链接
    """
    user_shares = [
        NoteShare(**s) for s in shares_db.values()
        if s['user_id'] == current_user.id
    ]

    return user_shares

@router.delete("/{share_id}")
async def delete_share(
    share_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    删除分享链接
    """
    # 查找要删除的分享
    share_to_delete = None
    token_to_delete = None

    for token, share in shares_db.items():
        if share['id'] == share_id:
            if share['user_id'] != current_user.id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="无权限删除此分享"
                )
            share_to_delete = share
            token_to_delete = token
            break

    if not share_to_delete:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="分享不存在"
        )

    # 删除分享和相关评论
    del shares_db[token_to_delete]

    # 删除相关评论
    comments_to_delete = [
        cid for cid, c in comments_db.items()
        if c['share_token'] == token_to_delete
    ]
    for cid in comments_to_delete:
        del comments_db[cid]

    return {"success": True, "message": "分享链接已删除"}

@router.delete("/comments/{comment_id}")
async def delete_comment(
    comment_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    删除评论（仅笔记所有者或评论者本人可删除）
    """
    comment = comments_db.get(comment_id)

    if not comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="评论不存在"
        )

    # 检查权限
    share = shares_db.get(comment['share_token'])
    if not share:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="关联的分享不存在"
        )

    # 只有笔记所有者或评论者本人可以删除
    is_note_owner = share['user_id'] == current_user.id
    is_comment_author = comment.get('user_id') == current_user.id

    if not (is_note_owner or is_comment_author):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="无权限删除此评论"
        )

    del comments_db[comment_id]

    return {"success": True, "message": "评论已删除"}
