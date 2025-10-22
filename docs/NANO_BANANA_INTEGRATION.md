# Nano Banana API 集成文档

## 概述

Nano Banana 是 Google Gemini 2.5 Flash Image Preview 模型的别名，提供强大的 AI 图像生成和编辑功能。本文档说明如何在项目中使用已集成的 Nano Banana API。

## 功能特性

### 1. 文本生成图像 (Text-to-Image)
- 根据自然语言描述生成高质量图像
- 支持一次生成 1-4 张图片
- 支持负面提示词（避免生成不想要的内容）
- 默认尺寸：1024x1024（也支持 512x512, 768x768）

### 2. 图像编辑 (Image-to-Image)
- 对现有图像进行智能编辑
- 支持局部编辑（对象替换、背景更改）
- 保持主体一致性
- 物理感知渲染（自动处理阴影、反射、纹理）

## 配置步骤

### 1. 获取 Google API 密钥

1. 访问 [Google AI Studio](https://aistudio.google.com/app/apikey)
2. 使用 Google 账号登录
3. 点击 "Create API Key" 按钮
4. 选择项目或创建新项目
5. 复制生成的 API 密钥

### 2. 配置 API 密钥

1. 登录系统后，进入 **设置页面** (`/settings`)
2. 找到 "Google API Key" 输入框
3. 粘贴您的 Google API 密钥
4. 点击 "保存设置"

### 3. 数据库迁移（如果需要）

如果您使用的是现有数据库，需要运行以下 SQL 添加新字段：

#### SQLite
```sql
ALTER TABLE users ADD COLUMN google_api_key TEXT;
```

#### Supabase/PostgreSQL
```sql
ALTER TABLE users ADD COLUMN google_api_key TEXT;
```

系统会在首次启动时自动尝试添加该字段。

## 使用方法

### 通过前端界面使用

1. 访问图像生成器页面：`http://localhost:5173/image-generator`
2. 选择模式：
   - **生成图像**：输入图像描述，点击"生成图像"
   - **编辑图像**：选择已生成的图像，输入编辑指令

### API 端点说明

#### 1. 获取模型信息
```http
GET /api/nano-banana/models
```

响应示例：
```json
{
  "models": [
    {
      "id": "gemini-2.5-flash-image-preview",
      "name": "Nano Banana (Gemini 2.5 Flash Image Preview)",
      "description": "Google最新的图像生成和编辑模型",
      "capabilities": [
        "文本生成图像 (Text-to-Image)",
        "图像编辑 (Image-to-Image)",
        "局部编辑（对象替换、背景更改）",
        "保持主体一致性",
        "物理感知渲染（阴影、反射、纹理）"
      ],
      "pricing": "根据Google AI Studio定价",
      "max_images_per_request": 4,
      "supported_sizes": ["1024x1024", "512x512", "768x768"]
    }
  ]
}
```

#### 2. 生成图像
```http
POST /api/nano-banana/generate
Authorization: Bearer {your_jwt_token}
Content-Type: application/json
```

请求体：
```json
{
  "prompt": "一只可爱的猫咪坐在月球上，背景是星空",
  "negative_prompt": "模糊、低质量",
  "num_images": 1,
  "width": 1024,
  "height": 1024
}
```

响应：
```json
{
  "images": ["base64_encoded_image_data"],
  "prompt": "一只可爱的猫咪坐在月球上，背景是星空",
  "model": "gemini-2.5-flash-image-preview"
}
```

#### 3. 编辑图像
```http
POST /api/nano-banana/edit
Authorization: Bearer {your_jwt_token}
Content-Type: application/json
```

请求体（使用 base64）：
```json
{
  "image_base64": "base64_encoded_image_data",
  "prompt": "将背景改为森林"
}
```

或使用图像 URL：
```json
{
  "image_url": "https://example.com/image.jpg",
  "prompt": "将背景改为森林"
}
```

响应：
```json
{
  "images": ["base64_encoded_edited_image"],
  "prompt": "将背景改为森林",
  "model": "gemini-2.5-flash-image-preview"
}
```

## 代码集成示例

### Python/FastAPI 调用示例
```python
import httpx

async def generate_image_example():
    headers = {
        "Authorization": "Bearer YOUR_JWT_TOKEN",
        "Content-Type": "application/json"
    }

    data = {
        "prompt": "一只可爱的猫咪坐在月球上",
        "num_images": 2
    }

    async with httpx.AsyncClient() as client:
        response = await client.post(
            "http://localhost:8000/api/nano-banana/generate",
            headers=headers,
            json=data
        )
        result = response.json()
        return result["images"]
```

### JavaScript/React 调用示例
```javascript
const generateImage = async (prompt, numImages = 1) => {
  const token = localStorage.getItem('token');

  const response = await fetch('http://localhost:8000/api/nano-banana/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      prompt,
      num_images: numImages,
      width: 1024,
      height: 1024
    })
  });

  const data = await response.json();
  return data.images.map(img => `data:image/jpeg;base64,${img}`);
};
```

## 错误处理

### 常见错误

#### 1. 未配置 Google API 密钥
```json
{
  "detail": "未配置Google API密钥。请在设置中添加Google API密钥。"
}
```
**解决方法**：在设置页面配置 Google API 密钥

#### 2. API 调用失败
```json
{
  "detail": "Gemini API请求失败: Connection timeout"
}
```
**解决方法**：检查网络连接，确保可以访问 Google API

#### 3. 参数错误
```json
{
  "detail": "num_images必须在1-4之间"
}
```
**解决方法**：调整请求参数符合 API 要求

## 性能优化建议

1. **缓存生成的图像**：将生成的图像保存到本地或云存储，避免重复生成
2. **异步处理**：图像生成可能需要几秒到几十秒，建议使用异步处理
3. **批量生成**：充分利用 `num_images` 参数一次生成多张图像
4. **超时设置**：建议设置 60-90 秒的超时时间

## 定价和限制

- 根据 Google AI Studio 的定价政策计费
- 建议查看 [Google AI Studio 定价页面](https://ai.google.dev/pricing) 了解最新定价
- 免费额度可能有限制，建议监控使用量

## 技术架构

```
┌─────────────────┐
│  前端组件       │
│  ImageGenerator │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  后端路由       │
│ nano_banana_    │
│   router.py     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Google Gemini  │
│   API 2.5 Flash │
│  Image Preview  │
└─────────────────┘
```

## 文件清单

### 后端文件
- `backend/routers/nano_banana_router.py` - Nano Banana API 路由
- `backend/models.py` - 数据模型（已添加 google_api_key 字段）
- `backend/database_sqlite.py` - SQLite 数据库支持
- `backend/database_supabase.py` - Supabase 数据库支持

### 前端文件
- `frontend/src/pages/ImageGeneratorPage.jsx` - 图像生成器页面组件
- `frontend/src/components/SettingsPage.jsx` - 设置页面（已添加 Google API 密钥配置）
- `frontend/src/App.jsx` - 主应用（已添加路由）

## 后续开发建议

1. **图像历史记录**：保存用户生成的图像历史
2. **提示词模板**：提供常用的提示词模板
3. **图像编辑器**：集成更高级的图像编辑功能
4. **社区分享**：允许用户分享生成的图像
5. **批量处理**：支持批量生成和编辑图像

## 支持和反馈

如有问题或建议，请联系开发团队或提交 Issue。

---

**最后更新**：2025-10-22
**版本**：1.0.0
