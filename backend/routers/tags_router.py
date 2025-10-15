"""
标签管理路由
提供标签统计、管理和智能建议功能
"""
from fastapi import APIRouter, HTTPException, status, Depends
from typing import List, Dict
from database import notes_repo
from auth import get_current_user
from models import User
from collections import Counter

router = APIRouter(prefix="/tags", tags=["tags"])

@router.get("/stats")
async def get_tags_statistics(current_user: User = Depends(get_current_user)):
    """
    获取用户的标签统计信息
    返回所有标签及其使用次数，按使用频率排序
    """
    try:
        # 获取用户的所有笔记
        notes = notes_repo.get_notes_by_user(current_user.id)

        # 收集所有标签
        all_tags = []

        # 从笔记中提取标签
        for note in notes:
            if note.get('tags'):
                all_tags.extend(note['tags'])

        # 统计标签使用频率
        tag_counter = Counter(all_tags)

        # 构建统计结果
        stats = []
        for tag, count in tag_counter.most_common():
            # 计算该标签在笔记中的分布
            notes_count = sum(1 for note in notes if tag in note.get('tags', []))

            stats.append({
                'tag': tag,
                'total_count': count,
                'notes_count': notes_count,
                'todos_count': 0,  # 待办事项功能待实现
                'color': _get_tag_color(tag)  # 为标签分配颜色
            })

        return {
            'total_tags': len(tag_counter),
            'total_usages': sum(tag_counter.values()),
            'tags': stats
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"获取标签统计失败: {str(e)}"
        )

@router.post("/rename")
async def rename_tag(
    old_tag: str,
    new_tag: str,
    current_user: User = Depends(get_current_user)
):
    """
    重命名标签
    将所有笔记和待办事项中的旧标签名替换为新标签名
    """
    if not old_tag or not new_tag:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="标签名不能为空"
        )

    if old_tag == new_tag:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="新旧标签名相同"
        )

    try:
        updated_notes = 0

        # 更新笔记中的标签
        notes = notes_repo.get_notes_by_user(current_user.id)
        for note in notes:
            if old_tag in note.get('tags', []):
                new_tags = [new_tag if t == old_tag else t for t in note['tags']]
                notes_repo.update_note(note['id'], tags=new_tags)
                updated_notes += 1

        return {
            'success': True,
            'message': f'成功将标签 "{old_tag}" 重命名为 "{new_tag}"',
            'updated_notes': updated_notes,
            'updated_todos': 0
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"重命名标签失败: {str(e)}"
        )

@router.post("/merge")
async def merge_tags(
    source_tags: List[str],
    target_tag: str,
    current_user: User = Depends(get_current_user)
):
    """
    合并多个标签为一个标签
    将所有源标签统一替换为目标标签
    """
    if not source_tags or not target_tag:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="源标签和目标标签不能为空"
        )

    if target_tag in source_tags:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="目标标签不能在源标签列表中"
        )

    try:
        updated_notes = 0

        # 更新笔记中的标签
        notes = notes_repo.get_notes_by_user(current_user.id)
        for note in notes:
            tags = note.get('tags', [])
            has_source = any(tag in source_tags for tag in tags)

            if has_source:
                # 移除所有源标签，添加目标标签（避免重复）
                new_tags = [t for t in tags if t not in source_tags]
                if target_tag not in new_tags:
                    new_tags.append(target_tag)

                notes_repo.update_note(note['id'], tags=new_tags)
                updated_notes += 1

        return {
            'success': True,
            'message': f'成功将 {len(source_tags)} 个标签合并为 "{target_tag}"',
            'updated_notes': updated_notes,
            'updated_todos': 0
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"合并标签失败: {str(e)}"
        )

@router.delete("/{tag}")
async def delete_tag(
    tag: str,
    current_user: User = Depends(get_current_user)
):
    """
    删除标签
    从所有笔记和待办事项中移除指定标签
    """
    if not tag:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="标签名不能为空"
        )

    try:
        updated_notes = 0

        # 从笔记中删除标签
        notes = notes_repo.get_notes_by_user(current_user.id)
        for note in notes:
            if tag in note.get('tags', []):
                new_tags = [t for t in note['tags'] if t != tag]
                notes_repo.update_note(note['id'], tags=new_tags)
                updated_notes += 1

        return {
            'success': True,
            'message': f'成功删除标签 "{tag}"',
            'updated_notes': updated_notes,
            'updated_todos': 0
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"删除标签失败: {str(e)}"
        )

@router.get("/suggestions")
async def get_tag_suggestions(
    text: str = "",
    current_user: User = Depends(get_current_user)
):
    """
    获取智能标签建议
    基于用户历史标签和文本内容推荐标签
    """
    try:
        # 获取用户的所有历史标签
        notes = notes_repo.get_notes_by_user(current_user.id)

        all_tags = []
        for note in notes:
            if note.get('tags'):
                all_tags.extend(note['tags'])

        # 统计标签频率
        tag_counter = Counter(all_tags)

        # 基于文本内容的智能匹配（简单实现）
        suggestions = []
        text_lower = text.lower()

        for tag, count in tag_counter.most_common(20):
            # 如果文本包含标签关键词，提高优先级
            score = count
            if tag.lower() in text_lower:
                score += 100

            suggestions.append({
                'tag': tag,
                'score': score,
                'usage_count': count
            })

        # 按分数排序
        suggestions.sort(key=lambda x: x['score'], reverse=True)

        return {
            'suggestions': suggestions[:10]  # 返回前10个建议
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"获取标签建议失败: {str(e)}"
        )

def _get_tag_color(tag: str) -> str:
    """
    为标签分配颜色（基于标签名的哈希值）
    确保相同标签始终有相同颜色
    """
    colors = [
        '#3b82f6',  # blue
        '#10b981',  # green
        '#f59e0b',  # amber
        '#ef4444',  # red
        '#8b5cf6',  # violet
        '#ec4899',  # pink
        '#06b6d4',  # cyan
        '#f97316',  # orange
    ]

    # 使用标签名的哈希值选择颜色
    hash_value = sum(ord(c) for c in tag)
    color_index = hash_value % len(colors)

    return colors[color_index]
