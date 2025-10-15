from fastapi import APIRouter, HTTPException, Depends
from typing import List
from auth import get_current_user
from models import (
    User, Board, BoardCreate, BoardUpdate, BoardWithData,
    BoardList as ListModel, ListCreate, ListUpdate, ListWithCards,
    Card, CardCreate, CardUpdate, CardComment, CardCommentCreate
)
from database import board_repo, list_repo, card_repo, card_comment_repo

router = APIRouter(
    prefix="/api",
    tags=["projects"]
)

# Board endpoints
@router.get("/boards", response_model=List[Board])
async def get_user_boards(current_user: User = Depends(get_current_user)):
    """获取用户的所有看板"""
    try:
        boards = board_repo.get_boards_by_user(current_user.id)
        return boards
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/boards", response_model=Board)
async def create_board(board_data: BoardCreate, current_user: User = Depends(get_current_user)):
    """创建新看板"""
    try:
        board = board_repo.create_board(
            name=board_data.name,
            description=board_data.description,
            color=board_data.color,
            user_id=current_user.id
        )
        return board
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/boards/{board_id}", response_model=BoardWithData)
async def get_board_with_data(board_id: str, current_user: User = Depends(get_current_user)):
    """获取看板及其完整数据（包含列表和卡片）"""
    try:
        board = board_repo.get_board_with_data(board_id, current_user.id)
        if not board:
            raise HTTPException(status_code=404, detail="Board not found")
        return board
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/boards/{board_id}", response_model=Board)
async def update_board(board_id: str, board_data: BoardUpdate, current_user: User = Depends(get_current_user)):
    """更新看板"""
    try:
        # 验证看板存在且属于当前用户
        existing_board = board_repo.get_board_by_id(board_id, current_user.id)
        if not existing_board:
            raise HTTPException(status_code=404, detail="Board not found")
        
        # 更新看板
        update_data = board_data.dict(exclude_unset=True)
        updated_board = board_repo.update_board(board_id, current_user.id, **update_data)
        return updated_board
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/boards/{board_id}")
async def delete_board(board_id: str, current_user: User = Depends(get_current_user)):
    """删除看板"""
    try:
        # 验证看板存在且属于当前用户
        existing_board = board_repo.get_board_by_id(board_id, current_user.id)
        if not existing_board:
            raise HTTPException(status_code=404, detail="Board not found")
        
        success = board_repo.delete_board(board_id, current_user.id)
        if not success:
            raise HTTPException(status_code=500, detail="Failed to delete board")
        
        return {"message": "Board deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# List endpoints
@router.post("/boards/{board_id}/lists", response_model=ListModel)
async def create_list(board_id: str, list_data: ListCreate, current_user: User = Depends(get_current_user)):
    """在指定看板下创建新列表"""
    try:
        # 验证看板存在且属于当前用户
        board = board_repo.get_board_by_id(board_id, current_user.id)
        if not board:
            raise HTTPException(status_code=404, detail="Board not found")
        
        # 如果没有指定位置，设置为最后
        if list_data.position is None:
            # 获取当前看板的最大位置
            board_data = board_repo.get_board_with_data(board_id, current_user.id)
            max_position = max([lst.get('position', 0) for lst in board_data['lists']], default=-1)
            list_data.position = max_position + 1
        
        list_obj = list_repo.create_list(
            title=list_data.title,
            position=list_data.position,
            board_id=board_id
        )
        return list_obj
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/lists/{list_id}", response_model=ListModel)
async def update_list(list_id: str, list_data: ListUpdate, current_user: User = Depends(get_current_user)):
    """更新列表"""
    try:
        # 验证列表存在
        existing_list = list_repo.get_list_by_id(list_id)
        if not existing_list:
            raise HTTPException(status_code=404, detail="List not found")
        
        # 验证列表所属看板是否属于当前用户
        board = board_repo.get_board_by_id(existing_list['board_id'], current_user.id)
        if not board:
            raise HTTPException(status_code=404, detail="Board not found")
        
        update_data = list_data.dict(exclude_unset=True)
        updated_list = list_repo.update_list(list_id, **update_data)
        return updated_list
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/lists/{list_id}")
async def delete_list(list_id: str, current_user: User = Depends(get_current_user)):
    """删除列表"""
    try:
        # 验证列表存在
        existing_list = list_repo.get_list_by_id(list_id)
        if not existing_list:
            raise HTTPException(status_code=404, detail="List not found")
        
        # 验证列表所属看板是否属于当前用户
        board = board_repo.get_board_by_id(existing_list['board_id'], current_user.id)
        if not board:
            raise HTTPException(status_code=404, detail="Board not found")
        
        success = list_repo.delete_list(list_id)
        if not success:
            raise HTTPException(status_code=500, detail="Failed to delete list")
        
        return {"message": "List deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Card endpoints
@router.post("/lists/{list_id}/cards", response_model=Card)
async def create_card(list_id: str, card_data: CardCreate, current_user: User = Depends(get_current_user)):
    """在指定列表下创建新卡片"""
    try:
        # 验证列表存在
        existing_list = list_repo.get_list_by_id(list_id)
        if not existing_list:
            raise HTTPException(status_code=404, detail="List not found")
        
        # 验证列表所属看板是否属于当前用户
        board = board_repo.get_board_by_id(existing_list['board_id'], current_user.id)
        if not board:
            raise HTTPException(status_code=404, detail="Board not found")
        
        # 如果没有指定位置，设置为最后
        if card_data.position is None:
            # 获取当前列表的最大位置
            board_data = board_repo.get_board_with_data(existing_list['board_id'], current_user.id)
            target_list = next((lst for lst in board_data['lists'] if lst['id'] == list_id), None)
            if target_list:
                max_position = max([card.get('position', 0) for card in target_list['cards']], default=-1)
                card_data.position = max_position + 1
            else:
                card_data.position = 0
        
        due_date_str = card_data.due_date.isoformat() + 'Z' if card_data.due_date else None
        
        card = card_repo.create_card(
            title=card_data.title,
            description=card_data.description,
            priority=card_data.priority.value,
            due_date=due_date_str,
            assignee=card_data.assignee,
            tags=card_data.tags or [],
            position=card_data.position,
            list_id=list_id
        )
        return card
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/cards/{card_id}", response_model=Card)
async def update_card(card_id: str, card_data: CardUpdate, current_user: User = Depends(get_current_user)):
    """更新卡片"""
    try:
        # 验证卡片存在
        existing_card = card_repo.get_card_by_id(card_id)
        if not existing_card:
            raise HTTPException(status_code=404, detail="Card not found")
        
        # 验证卡片所属看板是否属于当前用户
        existing_list = list_repo.get_list_by_id(existing_card['list_id'])
        board = board_repo.get_board_by_id(existing_list['board_id'], current_user.id)
        if not board:
            raise HTTPException(status_code=404, detail="Board not found")
        
        update_data = card_data.dict(exclude_unset=True)
        
        # 处理日期格式
        if 'due_date' in update_data and update_data['due_date']:
            update_data['due_date'] = update_data['due_date'].isoformat() + 'Z'
        
        # 处理优先级枚举
        if 'priority' in update_data and update_data['priority']:
            update_data['priority'] = update_data['priority'].value
        
        updated_card = card_repo.update_card(card_id, **update_data)
        return updated_card
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/cards/{card_id}")
async def delete_card(card_id: str, current_user: User = Depends(get_current_user)):
    """删除卡片"""
    try:
        # 验证卡片存在
        existing_card = card_repo.get_card_by_id(card_id)
        if not existing_card:
            raise HTTPException(status_code=404, detail="Card not found")
        
        # 验证卡片所属看板是否属于当前用户
        existing_list = list_repo.get_list_by_id(existing_card['list_id'])
        board = board_repo.get_board_by_id(existing_list['board_id'], current_user.id)
        if not board:
            raise HTTPException(status_code=404, detail="Board not found")
        
        success = card_repo.delete_card(card_id)
        if not success:
            raise HTTPException(status_code=500, detail="Failed to delete card")
        
        return {"message": "Card deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Card comment endpoints
@router.post("/cards/{card_id}/comments", response_model=CardComment)
async def create_card_comment(card_id: str, comment_data: CardCommentCreate, current_user: User = Depends(get_current_user)):
    """为卡片添加评论"""
    try:
        # 验证卡片存在
        existing_card = card_repo.get_card_by_id(card_id)
        if not existing_card:
            raise HTTPException(status_code=404, detail="Card not found")
        
        # 验证卡片所属看板是否属于当前用户
        existing_list = list_repo.get_list_by_id(existing_card['list_id'])
        board = board_repo.get_board_by_id(existing_list['board_id'], current_user.id)
        if not board:
            raise HTTPException(status_code=404, detail="Board not found")
        
        comment = card_comment_repo.create_comment(
            card_id=card_id,
            content=comment_data.content,
            user_id=current_user.id
        )
        return comment
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/cards/{card_id}/comments", response_model=List[CardComment])
async def get_card_comments(card_id: str, current_user: User = Depends(get_current_user)):
    """获取卡片的所有评论"""
    try:
        # 验证卡片存在
        existing_card = card_repo.get_card_by_id(card_id)
        if not existing_card:
            raise HTTPException(status_code=404, detail="Card not found")
        
        # 验证卡片所属看板是否属于当前用户
        existing_list = list_repo.get_list_by_id(existing_card['list_id'])
        board = board_repo.get_board_by_id(existing_list['board_id'], current_user.id)
        if not board:
            raise HTTPException(status_code=404, detail="Board not found")
        
        comments = card_comment_repo.get_comments_by_card(card_id)
        return comments
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))