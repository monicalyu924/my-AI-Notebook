# OpenRouter 图像生成集成指南

## 🎨 功能概述

现在你可以通过 **OpenRouter** 使用 Nano Banana (Gemini 2.5 Flash Image Preview) 图像生成模型，避免 Google API 的配额限制！

---

## ✨ 主要优势

### **1. 使用 OpenRouter（推荐）**
- ✅ **避免 Google API 配额限制**
- ✅ **可能有免费配额**
- ✅ **统一使用 OpenRouter API key**
- ✅ **更稳定的服务**
- ✅ **支持按需付费**

### **2. 直接使用 Google API**
- ⚠️ 免费配额有限
- ⚠️ 可能遇到 429 错误
- ✅ 直接访问 Google 服务

---

## 🚀 快速开始

### **步骤 1：配置 OpenRouter API Key**

1. 访问 [OpenRouter](https://openrouter.ai/)
2. 注册并登录
3. 生成 API Key
4. 在应用的 **[设置页面](https://ai-notebook-production.vercel.app/settings)** 保存你的 OpenRouter API key

### **步骤 2：使用图像生成功能**

1. 访问图像生成器页面
2. 选择 **"通过 OpenRouter"** 作为提供商（默认）
3. 输入图像描述
4. 点击生成

---

## 📋 API 使用说明

### **生成图像 API**

```bash
POST /api/nano-banana/generate
```

**请求体：**
```json
{
  "prompt": "a cute robot painting",
  "negative_prompt": "blurry, low quality",
  "num_images": 1,
  "provider": "openrouter"  // 或 "google"
}
```

**响应：**
```json
{
  "images": ["base64_encoded_image_data..."],
  "prompt": "a cute robot painting",
  "model": "openrouter/gemini-2.5-flash-image-preview"
}
```

---

## 🔑 Provider 选项

### **OpenRouter (推荐)**

```json
{
  "provider": "openrouter"
}
```

- **需要**: OpenRouter API Key
- **模型**: `google/gemini-2.5-flash-image-preview:free`
- **优势**: 避免直接配额限制

### **Google API**

```json
{
  "provider": "google"
}
```

- **需要**: Google API Key
- **模型**: `gemini-2.5-flash-image-preview`
- **限制**: 受 Google AI Studio 配额限制

---

## 💰 定价说明

### **OpenRouter 定价**

- 免费版本：`google/gemini-2.5-flash-image-preview:free`
- 付费版本：根据 OpenRouter 的定价
- 查看实时定价：[OpenRouter Models](https://openrouter.ai/models)

### **Google API 定价**

- 免费配额：
  - 60 请求/分钟
  - 1,500 请求/天
  - 1M tokens/分钟
- 超出配额后需要付费

---

## 🛠️ 技术实现

### **后端代码结构**

```python
# nano_banana_router.py

# OpenRouter API 调用
async def call_openrouter_api(api_key, prompt, num_images):
    url = "https://openrouter.ai/api/v1/chat/completions"
    headers = {"Authorization": f"Bearer {api_key}"}
    data = {
        "model": "google/gemini-2.5-flash-image-preview:free",
        "messages": [{"role": "user", "content": prompt}]
    }
    # ...

# Google API 调用
async def call_gemini_api(api_key, endpoint, data):
    url = f"https://generativelanguage.googleapis.com/v1beta/models/..."
    # ...

# 生成图像端点
@router.post("/generate")
async def generate_image(request: ImageGenerateRequest):
    if request.provider == "openrouter":
        # 使用 OpenRouter
        result = await call_openrouter_api(...)
    else:
        # 使用 Google API
        result = await call_gemini_api(...)
```

---

## 🔍 可用模型查询

### **API 端点**

```bash
GET /api/nano-banana/models
```

**响应示例：**
```json
{
  "models": [
    {
      "id": "openrouter/gemini-2.5-flash-image-preview",
      "name": "Nano Banana (通过 OpenRouter)",
      "provider": "openrouter",
      "description": "通过 OpenRouter 调用...",
      "requires_api_key": "openrouter_api_key",
      "recommended": true
    },
    {
      "id": "google/gemini-2.5-flash-image-preview",
      "name": "Nano Banana (直接调用 Google API)",
      "provider": "google",
      "requires_api_key": "google_api_key",
      "recommended": false
    }
  ]
}
```

---

## 🐛 错误处理

### **常见错误**

#### **1. 未配置 API Key**
```
400: 未配置 OpenRouter API 密钥
```
**解决**: 在设置中添加 OpenRouter API key

#### **2. 配额超限 (Google)**
```
429: You exceeded your current quota
```
**解决**: 切换到 OpenRouter provider

#### **3. API 请求失败**
```
503: OpenRouter API请求失败
```
**解决**: 检查网络连接和 API key 有效性

---

## 📚 相关文档

- [OpenRouter 官方文档](https://openrouter.ai/docs)
- [Google Gemini API 文档](https://ai.google.dev/gemini-api/docs)
- [应用设置页面](https://ai-notebook-production.vercel.app/settings)

---

## ✅ 测试验证

### **测试 OpenRouter 集成**

```javascript
// 在浏览器控制台运行
const testImageGeneration = async () => {
  const token = localStorage.getItem('token');
  
  const response = await fetch(
    'https://my-ai-notebook-production.up.railway.app/api/nano-banana/generate',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: 'a cute robot',
        provider: 'openrouter',
        num_images: 1
      })
    }
  );
  
  const data = await response.json();
  console.log('生成结果:', data);
};

testImageGeneration();
```

---

## 🎯 下一步

1. ✅ 配置 OpenRouter API key
2. ✅ 测试图像生成功能
3. ✅ 如有问题，检查 Railway 部署日志
4. ✅ 查看 OpenRouter 使用统计

---

**享受无配额限制的图像生成！** 🎨✨

