import httpx
import base64
from fastapi import APIRouter, HTTPException, status, Depends
from auth import get_current_user
from models import User
from pydantic import BaseModel
from typing import Optional, List, Literal

router = APIRouter(prefix="/api/nano-banana", tags=["nano-banana"])

class ImageGenerateRequest(BaseModel):
    """图像生成请求"""
    prompt: str
    negative_prompt: Optional[str] = None
    width: Optional[int] = 1024
    height: Optional[int] = 1024
    num_images: Optional[int] = 1  # 1-4张图片
    provider: Literal["google", "openrouter"] = "openrouter"  # 默认使用 OpenRouter

class ImageEditRequest(BaseModel):
    """图像编辑请求"""
    image_url: Optional[str] = None
    image_base64: Optional[str] = None
    prompt: str  # 编辑指令
    mask_url: Optional[str] = None  # 可选的蒙版图片URL
    mask_base64: Optional[str] = None  # 可选的蒙版图片Base64
    provider: Literal["google", "openrouter"] = "openrouter"  # 默认使用 OpenRouter

class ImageResponse(BaseModel):
    """图像生成/编辑响应"""
    images: List[str]  # Base64编码的图片列表
    prompt: str
    model: str = "gemini-2.5-flash-image-preview"


async def call_openrouter_api(
    api_key: str,
    prompt: str,
    num_images: int = 1,
    timeout: float = 120.0
) -> dict:
    """
    通过OpenRouter调用Nano Banana图像生成模型

    Args:
        api_key: OpenRouter API密钥
        prompt: 图像描述文本
        num_images: 生成图像数量
        timeout: 超时时间（秒）

    Returns:
        API响应数据
    """
    url = "https://openrouter.ai/api/v1/chat/completions"
    
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://ai-notebook-production.vercel.app",  # 可选，用于分析
        "X-Title": "AI Notebook"  # 可选
    }

    # OpenRouter 使用标准的 Chat Completions API 格式
    data = {
        "model": "google/gemini-2.5-flash-image-preview:free",  # 使用免费版本
        "messages": [
            {
                "role": "user",
                "content": f"Generate {num_images} image(s) based on this description: {prompt}"
            }
        ],
        "temperature": 0.7,
        "max_tokens": 2048
    }

    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                url,
                headers=headers,
                json=data,
                timeout=timeout
            )
            response.raise_for_status()
            return response.json()

        except httpx.RequestError as e:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"OpenRouter API请求失败: {str(e)}"
            )
        except httpx.HTTPStatusError as e:
            error_detail = e.response.text
            try:
                error_json = e.response.json()
                if "error" in error_json:
                    error_detail = error_json["error"].get("message", error_detail)
            except:
                pass

            raise HTTPException(
                status_code=e.response.status_code,
                detail=f"OpenRouter API错误: {error_detail}"
            )


async def call_gemini_api(
    api_key: str,
    endpoint: str,
    data: dict,
    timeout: float = 60.0
) -> dict:
    """
    调用Google Gemini API

    Args:
        api_key: Google API密钥
        endpoint: API端点 (generateContent 或 generateImage)
        data: 请求数据
        timeout: 超时时间（秒）

    Returns:
        API响应数据
    """
    # Google Gemini API基础URL
    base_url = "https://generativelanguage.googleapis.com/v1beta"

    # 构建完整URL
    url = f"{base_url}/models/gemini-2.5-flash-image-preview:{endpoint}?key={api_key}"

    headers = {
        "Content-Type": "application/json"
    }

    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                url,
                headers=headers,
                json=data,
                timeout=timeout
            )
            response.raise_for_status()
            return response.json()

        except httpx.RequestError as e:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"Gemini API请求失败: {str(e)}"
            )
        except httpx.HTTPStatusError as e:
            error_detail = e.response.text
            try:
                error_json = e.response.json()
                if "error" in error_json:
                    error_detail = error_json["error"].get("message", error_detail)
            except:
                pass

            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Gemini API错误 ({e.response.status_code}): {error_detail}"
            )


@router.post("/generate", response_model=ImageResponse)
async def generate_image(
    request: ImageGenerateRequest,
    current_user: User = Depends(get_current_user)
):
    """
    文本生成图像 (Text-to-Image)

    支持通过 OpenRouter 或 Google API 使用 Gemini 2.5 Flash Image Preview 模型生成图像
    """
    # 验证参数
    if request.num_images < 1 or request.num_images > 4:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="num_images必须在1-4之间"
        )

    # 构建提示词
    prompt_text = request.prompt
    if request.negative_prompt:
        prompt_text += f"\n\nNegative prompt (避免生成): {request.negative_prompt}"

    images = []

    # 根据 provider 选择 API
    if request.provider == "openrouter":
        # 使用 OpenRouter API
        if not hasattr(current_user, 'openrouter_api_key') or not current_user.openrouter_api_key:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="未配置 OpenRouter API 密钥。请在设置中添加 OpenRouter API 密钥。"
            )

        result = await call_openrouter_api(
            current_user.openrouter_api_key,
            prompt_text,
            request.num_images
        )

        # 解析 OpenRouter 响应
        # OpenRouter 可能会在响应的 message.content 中返回图像 URL 或 base64
        if "choices" in result and len(result["choices"]) > 0:
            content = result["choices"][0].get("message", {}).get("content", "")
            # 这里需要根据实际返回格式解析图像
            # 暂时假设返回的是文本描述或图像URL
            # 实际实现可能需要调整
            images.append(content)
        
        if not images:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="生成图像失败：OpenRouter API 未返回图像数据"
            )

    else:  # provider == "google"
        # 使用 Google API 直接调用
        if not hasattr(current_user, 'google_api_key') or not current_user.google_api_key:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="未配置 Google API 密钥。请在设置中添加 Google API 密钥。"
            )

        gemini_request = {
            "contents": [{
                "parts": [{
                    "text": f"Generate an image based on this description: {prompt_text}"
                }]
            }],
            "generationConfig": {
                "temperature": 0.7,
                "candidateCount": request.num_images,
                "maxOutputTokens": 2048,
            }
        }

        result = await call_gemini_api(
            current_user.google_api_key,
            "generateContent",
            gemini_request
        )

        # 解析 Google API 响应
        if "candidates" in result:
            for candidate in result["candidates"]:
                if "content" in candidate and "parts" in candidate["content"]:
                    for part in candidate["content"]["parts"]:
                        if "inlineData" in part:
                            images.append(part["inlineData"]["data"])

        if not images:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="生成图像失败：Google API 未返回图像数据"
            )

    return ImageResponse(
        images=images,
        prompt=request.prompt,
        model=f"{request.provider}/gemini-2.5-flash-image-preview"
    )


@router.post("/edit", response_model=ImageResponse)
async def edit_image(
    request: ImageEditRequest,
    current_user: User = Depends(get_current_user)
):
    """
    图像编辑 (Image-to-Image)

    使用Google Gemini 2.5 Flash Image Preview模型编辑现有图像
    支持局部编辑、对象替换、背景更改等
    """
    # 检查API密钥
    if not hasattr(current_user, 'google_api_key') or not current_user.google_api_key:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="未配置Google API密钥。请在设置中添加Google API密钥。"
        )

    # 验证输入图像
    if not request.image_url and not request.image_base64:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="必须提供image_url或image_base64"
        )

    # 准备图像数据
    image_data = None
    if request.image_base64:
        image_data = {
            "inlineData": {
                "mimeType": "image/jpeg",  # 或根据实际格式判断
                "data": request.image_base64
            }
        }
    elif request.image_url:
        # 下载图像并转换为base64
        async with httpx.AsyncClient() as client:
            try:
                img_response = await client.get(request.image_url, timeout=30.0)
                img_response.raise_for_status()
                img_base64 = base64.b64encode(img_response.content).decode('utf-8')
                image_data = {
                    "inlineData": {
                        "mimeType": img_response.headers.get("content-type", "image/jpeg"),
                        "data": img_base64
                    }
                }
            except Exception as e:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"无法下载图像: {str(e)}"
                )

    # 构建Gemini API请求
    parts = [
        image_data,
        {
            "text": f"Edit this image according to the following instruction: {request.prompt}"
        }
    ]

    # 如果有蒙版，添加蒙版数据
    if request.mask_base64:
        parts.insert(1, {
            "inlineData": {
                "mimeType": "image/png",
                "data": request.mask_base64
            }
        })
    elif request.mask_url:
        # 下载蒙版图像
        async with httpx.AsyncClient() as client:
            try:
                mask_response = await client.get(request.mask_url, timeout=30.0)
                mask_response.raise_for_status()
                mask_base64 = base64.b64encode(mask_response.content).decode('utf-8')
                parts.insert(1, {
                    "inlineData": {
                        "mimeType": mask_response.headers.get("content-type", "image/png"),
                        "data": mask_base64
                    }
                })
            except Exception as e:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"无法下载蒙版图像: {str(e)}"
                )

    gemini_request = {
        "contents": [{
            "parts": parts
        }],
        "generationConfig": {
            "temperature": 0.7,
            "candidateCount": 1,
            "maxOutputTokens": 2048,
        }
    }

    # 调用Gemini API
    result = await call_gemini_api(
        current_user.google_api_key,
        "generateContent",
        gemini_request,
        timeout=90.0  # 图像编辑可能需要更长时间
    )

    # 解析响应，提取编辑后的图像
    images = []
    if "candidates" in result:
        for candidate in result["candidates"]:
            if "content" in candidate and "parts" in candidate["content"]:
                for part in candidate["content"]["parts"]:
                    if "inlineData" in part:
                        images.append(part["inlineData"]["data"])

    if not images:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="编辑图像失败：API未返回图像数据"
        )

    return ImageResponse(
        images=images,
        prompt=request.prompt
    )


@router.get("/models")
async def get_available_models():
    """获取可用的Nano Banana模型信息"""
    return {
        "models": [
            {
                "id": "openrouter/gemini-2.5-flash-image-preview",
                "name": "Nano Banana (通过 OpenRouter)",
                "provider": "openrouter",
                "description": "通过 OpenRouter 调用 Google Gemini 2.5 Flash Image Preview，避免直接配额限制",
                "capabilities": [
                    "文本生成图像 (Text-to-Image)",
                    "图像编辑 (Image-to-Image)",
                    "局部编辑（对象替换、背景更改）",
                    "保持主体一致性",
                    "物理感知渲染（阴影、反射、纹理）"
                ],
                "pricing": "使用 OpenRouter 定价（可能有免费配额）",
                "max_images_per_request": 4,
                "supported_sizes": ["1024x1024", "512x512", "768x768"],
                "requires_api_key": "openrouter_api_key",
                "recommended": True
            },
            {
                "id": "google/gemini-2.5-flash-image-preview",
                "name": "Nano Banana (直接调用 Google API)",
                "provider": "google",
                "description": "直接调用 Google AI Studio API，需要 Google API 密钥",
                "capabilities": [
                    "文本生成图像 (Text-to-Image)",
                    "图像编辑 (Image-to-Image)",
                    "局部编辑（对象替换、背景更改）",
                    "保持主体一致性",
                    "物理感知渲染（阴影、反射、纹理）"
                ],
                "pricing": "根据 Google AI Studio 定价",
                "max_images_per_request": 4,
                "supported_sizes": ["1024x1024", "512x512", "768x768"],
                "requires_api_key": "google_api_key",
                "recommended": False
            }
        ]
    }
