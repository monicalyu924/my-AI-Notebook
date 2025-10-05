import httpx
import json
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from typing import List
from auth import get_current_user
from models import User, ChatRequest

router = APIRouter(prefix="/chat", tags=["chat"])

async def call_openrouter_streaming(api_key: str, messages: List[dict], model: str = "anthropic/claude-3-sonnet"):
    """调用OpenRouter API - 流式响应"""
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    
    data = {
        "model": model,
        "messages": messages,
        "max_tokens": 2000,
        "stream": True
    }
    
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers=headers,
                json=data
            )
            
            if response.status_code != 200:
                # 透出更多错误信息，便于识别凭证受限等问题
                try:
                    err = response.json()
                    error_msg = err.get("error", {})
                    if isinstance(error_msg, dict):
                        detail_text = error_msg.get("message", str(error_msg))
                    else:
                        detail_text = str(error_msg)
                    
                    # 检测 Claude Code 限制错误
                    if "only authorized for use with Claude Code" in detail_text:
                        raise HTTPException(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            detail=(
                                "API密钥错误：你使用的是Claude Code专用密钥，无法用于其他API调用。"
                                "请到OpenRouter.ai获取以'sk-or-'开头的正确密钥。"
                            )
                        )
                        
                except Exception:
                    detail_text = response.text
                    
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"AI服务错误 ({response.status_code}): {detail_text}"
                )
            
            async for line in response.aiter_lines():
                if line.startswith("data: "):
                    data_str = line[6:]  # Remove "data: " prefix
                    if data_str.strip() == "[DONE]":
                        break
                    try:
                        chunk_data = json.loads(data_str)
                        if chunk_data.get("choices") and len(chunk_data["choices"]) > 0:
                            delta = chunk_data["choices"][0].get("delta", {})
                            if "content" in delta:
                                yield f"data: {json.dumps({'content': delta['content']})}\n\n"
                    except json.JSONDecodeError:
                        continue
                        
    except httpx.RequestError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Failed to call AI service: {str(e)}"
        )

@router.get("/sessions")
async def get_chat_sessions(current_user: User = Depends(get_current_user)):
    """获取聊天会话列表 - 演示版本（返回空数组）"""
    return []

@router.post("/sessions")
async def create_chat_session(current_user: User = Depends(get_current_user)):
    """创建新的聊天会话 - 演示版本"""
    return {"id": "demo-session", "title": "演示会话", "model": "anthropic/claude-3-sonnet"}

@router.get("/sessions/{session_id}/messages")
async def get_chat_messages(session_id: str, current_user: User = Depends(get_current_user)):
    """获取聊天消息 - 演示版本（返回空数组）"""
    return []

@router.post("/chat")
async def quick_chat(
    chat_request: ChatRequest,
    current_user: User = Depends(get_current_user)
):
    """快速聊天 - 不需要会话管理"""
    if not current_user.openrouter_api_key:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="请先在设置中配置你的 OpenRouter API 密钥"
        )
    if not current_user.openrouter_api_key.startswith("sk-or-"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "无效的 OpenRouter API 密钥。请在设置中保存以 sk-or- 开头的密钥。"
                "Claude Code/Anthropic 控制台的密钥无法在此使用。"
            )
        )
    
    messages = [{"role": "user", "content": chat_request.message}]
    model = chat_request.model or "anthropic/claude-3-sonnet"
    
    async def generate_response():
        yield "data: {\"status\": \"start\"}\n\n"
        try:
            async for chunk in call_openrouter_streaming(current_user.openrouter_api_key, messages, model):
                yield chunk
        except Exception as e:
            yield f"data: {{\"error\": \"{str(e)}\"}}\n\n"
        finally:
            yield "data: {\"status\": \"end\"}\n\n"
    
    return StreamingResponse(
        generate_response(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        }
    )