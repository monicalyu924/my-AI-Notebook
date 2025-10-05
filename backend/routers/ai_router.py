import httpx
from fastapi import APIRouter, HTTPException, status, Depends
from auth import get_current_user
from models import User, AIRequest, AIResponse

router = APIRouter(prefix="/api/ai", tags=["ai"])

async def call_openrouter_api(api_key: str, prompt: str, system_message: str = None, model: str = "anthropic/claude-3-sonnet") -> str:
    """调用OpenRouter API"""
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    
    messages = []
    if system_message:
        messages.append({"role": "system", "content": system_message})
    messages.append({"role": "user", "content": prompt})
    
    data = {
        "model": model,
        "messages": messages,
        "max_tokens": 1000
    }
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers=headers,
                json=data,
                timeout=30.0
            )
            response.raise_for_status()
            result = response.json()
            return result["choices"][0]["message"]["content"]
        except httpx.RequestError as e:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"Failed to call AI service: {str(e)}"
            )
        except httpx.HTTPStatusError as e:
            # 将上游错误信息更多地暴露给前端，帮助诊断（例如 Claude Code 限制）。
            detail_text = None
            try:
                error_json = e.response.json()
                error_msg = error_json.get("error", {})
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
                detail_text = e.response.text
                
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"AI服务错误 ({e.response.status_code}): {detail_text}"
            )

@router.post("/process", response_model=AIResponse)
async def process_ai_request(
    ai_request: AIRequest,
    current_user: User = Depends(get_current_user)
):
    if not current_user.openrouter_api_key:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="OpenRouter API key not configured. Please set it in settings."
        )
    if not current_user.openrouter_api_key.startswith("sk-or-"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "无效的 OpenRouter API 密钥。请在设置中保存以 sk-or- 开头的密钥。"
                "Claude Code/Anthropic 控制台的密钥无法在此使用。"
            )
        )
    
    # 根据不同的AI动作构建prompt
    if ai_request.action == "continue":
        system_message = "你是一个写作助手。请基于用户提供的文本内容进行合理的续写，保持风格一致。"
        prompt = f"请继续以下内容的写作：\n\n{ai_request.text}"
    
    elif ai_request.action == "polish":
        system_message = "你是一个文本润色专家。请改进文本的表达，使其更加流畅、准确和优雅。"
        prompt = f"请润色以下文本：\n\n{ai_request.text}"
    
    elif ai_request.action == "translate":
        target_lang = ai_request.target_language or "英文"
        system_message = f"你是一个专业翻译。请将文本翻译成{target_lang}，保持原意和语调。"
        prompt = f"请翻译以下文本：\n\n{ai_request.text}"
    
    elif ai_request.action == "summarize":
        system_message = "你是一个文本摘要专家。请提取文本的核心要点，生成简洁明了的摘要。"
        prompt = f"请为以下文本生成摘要：\n\n{ai_request.text}"
    
    elif ai_request.action == "question":
        if not ai_request.question:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Question is required for Q&A action"
            )
        system_message = "你是一个智能问答助手。请基于提供的文本内容回答用户的问题。"
        prompt = f"基于以下文本内容：\n\n{ai_request.text}\n\n请回答问题：{ai_request.question}"
    
    elif ai_request.action == "generate_title":
        system_message = "你是一个标题生成专家。请为文本内容生成一个简洁、准确的标题。"
        prompt = f"请为以下内容生成一个合适的标题：\n\n{ai_request.text}"
    
    elif ai_request.action == "generate_tags":
        system_message = "你是一个标签生成专家。请为文本内容生成3-5个相关的标签关键词。"
        prompt = f"请为以下内容生成标签关键词：\n\n{ai_request.text}"
    
    elif ai_request.action == "analyze_project_idea":
        system_message = "你是一个项目分析专家。请分析用户的想法，提取关键要素，生成项目结构建议。"
        prompt = f"请分析以下项目想法并提供结构化建议：\n\n{ai_request.text}"
    
    elif ai_request.action == "extract_todos":
        system_message = "你是一个任务管理专家。请从文本中提取可执行的待办事项，每个事项一行，使用简洁明了的语言。"
        prompt = f"请从以下文本中提取待办事项：\n\n{ai_request.text}"
    
    elif ai_request.action == "generate_plan":
        system_message = "你是一个工作规划专家。请基于当前情况生成今日/本周的工作计划建议。"
        prompt = f"请基于以下情况生成工作计划：\n\n{ai_request.text}"
    
    else:
        # 如果没有匹配的预定义action，使用自定义instruction
        if hasattr(ai_request, 'instruction') and ai_request.instruction:
            system_message = "你是一个AI助手。请根据用户的指令处理文本内容。"
            prompt = f"指令：{ai_request.instruction}\n\n文本内容：\n{ai_request.text}"
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid AI action or missing instruction"
            )
    
    # 调用AI API，使用用户选择的模型
    model_to_use = ai_request.model if hasattr(ai_request, 'model') and ai_request.model else "anthropic/claude-3-sonnet"
    result = await call_openrouter_api(
        current_user.openrouter_api_key,
        prompt,
        system_message,
        model_to_use
    )
    
    return AIResponse(result=result, action=ai_request.action)
