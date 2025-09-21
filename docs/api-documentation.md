# AI智能记事本 API 文档

## 概述

AI智能记事本提供RESTful API接口，支持用户管理、笔记操作、AI功能等核心业务。本文档详细描述了所有可用的API端点。

## 基础信息

- **基础URL**: `https://api.ai-notebook.com`
- **API版本**: v1
- **数据格式**: JSON
- **字符编码**: UTF-8

## 认证方式

### JWT Token认证

所有需要认证的API都使用JWT Token进行身份验证。

```http
Authorization: Bearer <jwt_token>
```

### 获取Token

```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "your_username",
  "password": "your_password"
}
```

**响应示例**:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 3600,
  "user_id": 123,
  "username": "your_username"
}
```

## 错误处理

### 错误响应格式

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "错误描述",
    "details": "详细错误信息",
    "timestamp": "2024-01-01T12:00:00Z"
  }
}
```

### 常见错误码

| 状态码 | 错误码 | 描述 |
|--------|--------|------|
| 400 | BAD_REQUEST | 请求参数错误 |
| 401 | UNAUTHORIZED | 未授权访问 |
| 403 | FORBIDDEN | 权限不足 |
| 404 | NOT_FOUND | 资源不存在 |
| 409 | CONFLICT | 资源冲突 |
| 422 | VALIDATION_ERROR | 数据验证失败 |
| 429 | RATE_LIMIT_EXCEEDED | 请求频率超限 |
| 500 | INTERNAL_ERROR | 服务器内部错误 |

## API 接口

### 认证相关

#### 用户注册

```http
POST /api/auth/register
```

**请求参数**:
```json
{
  "username": "string (3-50字符, 必需)",
  "email": "string (有效邮箱, 必需)",
  "password": "string (6-128字符, 必需)",
  "first_name": "string (可选)",
  "last_name": "string (可选)"
}
```

**响应示例**:
```json
{
  "user_id": 123,
  "username": "newuser",
  "email": "newuser@example.com",
  "message": "用户注册成功"
}
```

#### 用户登录

```http
POST /api/auth/login
```

**请求参数**:
```json
{
  "username": "string (必需)",
  "password": "string (必需)"
}
```

#### 刷新Token

```http
POST /api/auth/refresh
```

**请求参数**:
```json
{
  "refresh_token": "string (必需)"
}
```

#### 用户登出

```http
POST /api/auth/logout
Authorization: Bearer <token>
```

### 用户管理

#### 获取用户资料

```http
GET /api/users/profile
Authorization: Bearer <token>
```

**响应示例**:
```json
{
  "id": 123,
  "username": "user123",
  "email": "user@example.com",
  "first_name": "张",
  "last_name": "三",
  "avatar_url": "https://example.com/avatar.jpg",
  "is_verified": true,
  "created_at": "2024-01-01T12:00:00Z",
  "last_login": "2024-01-01T12:00:00Z",
  "preferences": {
    "theme": "light",
    "language": "zh-CN",
    "timezone": "Asia/Shanghai"
  }
}
```

#### 更新用户资料

```http
PUT /api/users/profile
Authorization: Bearer <token>
```

**请求参数**:
```json
{
  "first_name": "string (可选)",
  "last_name": "string (可选)",
  "avatar_url": "string (可选)"
}
```

#### 更新用户偏好

```http
PUT /api/users/preferences
Authorization: Bearer <token>
```

**请求参数**:
```json
{
  "theme": "light|dark",
  "language": "zh-CN|en-US",
  "timezone": "string",
  "email_notifications": "boolean",
  "push_notifications": "boolean"
}
```

### 笔记管理

#### 获取笔记列表

```http
GET /api/notes
Authorization: Bearer <token>
```

**查询参数**:
- `page`: 页码 (默认: 1)
- `limit`: 每页数量 (默认: 20, 最大: 100)
- `category_id`: 分类ID筛选
- `tag`: 标签筛选 (可多个)
- `status`: 状态筛选 (draft|published|archived)
- `is_favorite`: 是否收藏 (true|false)
- `search`: 搜索关键词
- `sort`: 排序方式 (created_at|updated_at|title)
- `order`: 排序顺序 (asc|desc)

**响应示例**:
```json
{
  "items": [
    {
      "id": 1,
      "title": "笔记标题",
      "content": "笔记内容...",
      "content_type": "markdown",
      "status": "published",
      "category": {
        "id": 1,
        "name": "工作笔记",
        "color": "#007bff"
      },
      "tags": [
        {"id": 1, "name": "Python", "color": "#3776ab"}
      ],
      "is_favorite": false,
      "is_archived": false,
      "word_count": 256,
      "read_time": 2,
      "created_at": "2024-01-01T12:00:00Z",
      "updated_at": "2024-01-01T12:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "pages": 3,
    "has_next": true,
    "has_prev": false
  }
}
```

#### 获取单个笔记

```http
GET /api/notes/{note_id}
Authorization: Bearer <token>
```

**响应示例**:
```json
{
  "id": 1,
  "title": "笔记标题",
  "content": "完整的笔记内容...",
  "content_type": "markdown",
  "status": "published",
  "priority": 0,
  "category": {
    "id": 1,
    "name": "工作笔记",
    "description": "工作相关的笔记"
  },
  "tags": [
    {"id": 1, "name": "Python", "color": "#3776ab"}
  ],
  "attachments": [
    {
      "id": 1,
      "filename": "document.pdf",
      "file_size": 1024000,
      "file_type": "application/pdf",
      "download_url": "/api/attachments/1/download"
    }
  ],
  "versions": [
    {
      "version": 1,
      "created_at": "2024-01-01T12:00:00Z",
      "change_summary": "初始创建"
    }
  ],
  "is_favorite": false,
  "is_archived": false,
  "word_count": 256,
  "read_time": 2,
  "created_at": "2024-01-01T12:00:00Z",
  "updated_at": "2024-01-01T12:00:00Z"
}
```

#### 创建笔记

```http
POST /api/notes
Authorization: Bearer <token>
```

**请求参数**:
```json
{
  "title": "string (必需, 1-255字符)",
  "content": "string (可选)",
  "content_type": "markdown|html|plain (默认: markdown)",
  "category_id": "integer (可选)",
  "tags": ["string"] // 标签名称数组 (可选),
  "status": "draft|published (默认: draft)",
  "priority": "integer (0-5, 默认: 0)",
  "is_favorite": "boolean (默认: false)"
}
```

#### 更新笔记

```http
PUT /api/notes/{note_id}
Authorization: Bearer <token>
```

**请求参数**: 同创建笔记，所有字段可选

#### 删除笔记

```http
DELETE /api/notes/{note_id}
Authorization: Bearer <token>
```

#### 搜索笔记

```http
GET /api/notes/search
Authorization: Bearer <token>
```

**查询参数**:
- `q`: 搜索关键词 (必需)
- `page`: 页码 (默认: 1)
- `limit`: 每页数量 (默认: 20)
- `category_id`: 分类筛选
- `tag`: 标签筛选

**响应示例**:
```json
{
  "items": [
    {
      "id": 1,
      "title": "匹配的笔记标题",
      "content_preview": "包含关键词的内容片段...",
      "match_score": 0.95,
      "highlights": [
        {
          "field": "title",
          "text": "匹配的<em>关键词</em>标题"
        }
      ],
      "category": {"id": 1, "name": "工作笔记"},
      "tags": [{"id": 1, "name": "Python"}],
      "created_at": "2024-01-01T12:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "pages": 1
  },
  "search_time": 0.023
}
```

### 分类管理

#### 获取分类列表

```http
GET /api/categories
Authorization: Bearer <token>
```

**响应示例**:
```json
[
  {
    "id": 1,
    "name": "工作笔记",
    "description": "工作相关的笔记和文档",
    "color": "#007bff",
    "icon": "briefcase",
    "parent_id": null,
    "sort_order": 0,
    "note_count": 25,
    "created_at": "2024-01-01T12:00:00Z"
  }
]
```

#### 创建分类

```http
POST /api/categories
Authorization: Bearer <token>
```

**请求参数**:
```json
{
  "name": "string (必需, 1-100字符)",
  "description": "string (可选)",
  "color": "string (可选, 默认: #007bff)",
  "icon": "string (可选, 默认: folder)",
  "parent_id": "integer (可选)",
  "sort_order": "integer (可选, 默认: 0)"
}
```

### 标签管理

#### 获取标签列表

```http
GET /api/tags
Authorization: Bearer <token>
```

**查询参数**:
- `search`: 搜索标签名称
- `limit`: 返回数量限制

**响应示例**:
```json
[
  {
    "id": 1,
    "name": "Python",
    "color": "#3776ab",
    "usage_count": 15,
    "created_at": "2024-01-01T12:00:00Z"
  }
]
```

#### 创建标签

```http
POST /api/tags
Authorization: Bearer <token>
```

**请求参数**:
```json
{
  "name": "string (必需, 1-50字符)",
  "color": "string (可选, 默认: #6c757d)"
}
```

### AI功能

#### AI对话

```http
POST /api/ai/chat
Authorization: Bearer <token>
```

**请求参数**:
```json
{
  "message": "string (必需)",
  "conversation_id": "integer (可选, 继续已有对话)",
  "model": "string (可选, 默认: gpt-3.5-turbo)",
  "system_prompt": "string (可选)",
  "temperature": "float (可选, 0-1, 默认: 0.7)",
  "max_tokens": "integer (可选, 默认: 2000)"
}
```

**响应示例**:
```json
{
  "conversation_id": 123,
  "message_id": 456,
  "response": "AI助手的回复内容...",
  "model": "gpt-3.5-turbo",
  "usage": {
    "prompt_tokens": 50,
    "completion_tokens": 100,
    "total_tokens": 150
  },
  "cost": 0.003,
  "created_at": "2024-01-01T12:00:00Z"
}
```

#### 创建AI任务

```http
POST /api/ai/tasks
Authorization: Bearer <token>
```

**请求参数**:
```json
{
  "task_type": "summarize|translate|expand|improve|analyze|generate (必需)",
  "note_id": "integer (可选)",
  "input_text": "string (可选, note_id为空时必需)",
  "model": "string (可选, 默认: gpt-3.5-turbo)",
  "parameters": {
    "target_language": "string (翻译任务时必需)",
    "summary_length": "short|medium|long (总结任务时可选)",
    "writing_style": "formal|casual|academic (改进任务时可选)"
  }
}
```

**响应示例**:
```json
{
  "task_id": 789,
  "status": "pending",
  "task_type": "summarize",
  "estimated_time": 30,
  "created_at": "2024-01-01T12:00:00Z"
}
```

#### 获取AI任务状态

```http
GET /api/ai/tasks/{task_id}
Authorization: Bearer <token>
```

**响应示例**:
```json
{
  "task_id": 789,
  "status": "completed",
  "task_type": "summarize",
  "input_data": {...},
  "output_data": {
    "result": "这是AI生成的摘要内容...",
    "confidence": 0.95
  },
  "usage": {
    "total_tokens": 500,
    "cost": 0.01
  },
  "started_at": "2024-01-01T12:00:00Z",
  "completed_at": "2024-01-01T12:00:30Z"
}
```

#### 获取AI使用统计

```http
GET /api/ai/usage
Authorization: Bearer <token>
```

**查询参数**:
- `period`: 统计周期 (day|week|month|year)
- `start_date`: 开始日期 (YYYY-MM-DD)
- `end_date`: 结束日期 (YYYY-MM-DD)

**响应示例**:
```json
{
  "period": "month",
  "start_date": "2024-01-01",
  "end_date": "2024-01-31",
  "total_requests": 150,
  "total_tokens": 50000,
  "total_cost": 1.25,
  "by_model": [
    {
      "model": "gpt-3.5-turbo",
      "requests": 120,
      "tokens": 40000,
      "cost": 0.80
    }
  ],
  "by_task_type": [
    {
      "task_type": "summarize",
      "requests": 50,
      "tokens": 15000,
      "cost": 0.30
    }
  ]
}
```

### 文件管理

#### 上传附件

```http
POST /api/attachments
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**请求参数**:
- `file`: 文件 (必需)
- `note_id`: 关联的笔记ID (可选)

**响应示例**:
```json
{
  "id": 123,
  "filename": "document.pdf",
  "original_filename": "用户文档.pdf",
  "file_size": 1024000,
  "file_type": "application/pdf",
  "mime_type": "application/pdf",
  "download_url": "/api/attachments/123/download",
  "created_at": "2024-01-01T12:00:00Z"
}
```

#### 下载附件

```http
GET /api/attachments/{attachment_id}/download
Authorization: Bearer <token>
```

### 统计信息

#### 获取用户统计

```http
GET /api/statistics
Authorization: Bearer <token>
```

**响应示例**:
```json
{
  "user_stats": {
    "total_notes": 156,
    "published_notes": 120,
    "draft_notes": 36,
    "favorite_notes": 25,
    "total_categories": 8,
    "total_tags": 45,
    "total_words": 125000,
    "ai_conversations": 15,
    "ai_tasks_completed": 67
  },
  "recent_activity": [
    {
      "type": "note_created",
      "title": "新建笔记标题",
      "timestamp": "2024-01-01T12:00:00Z"
    }
  ],
  "popular_tags": [
    {"name": "Python", "count": 25},
    {"name": "AI", "count": 18}
  ]
}
```

### 系统信息

#### 健康检查

```http
GET /health
```

**响应示例**:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T12:00:00Z",
  "version": "1.0.0",
  "services": {
    "database": "ok",
    "redis": "ok",
    "ai_service": "ok"
  },
  "uptime": 86400
}
```

#### 获取系统信息

```http
GET /api/system/info
```

**响应示例**:
```json
{
  "version": "1.0.0",
  "build": "2024.01.01.123",
  "environment": "production",
  "features": {
    "ai_chat": true,
    "file_upload": true,
    "search": true
  },
  "limits": {
    "max_file_size": 10485760,
    "max_notes_per_user": 10000,
    "ai_requests_per_day": 100
  }
}
```

## 分页和排序

### 分页参数

所有列表接口都支持分页：

- `page`: 页码，从1开始 (默认: 1)
- `limit`: 每页数量 (默认: 20, 最大: 100)

### 排序参数

- `sort`: 排序字段 (created_at|updated_at|title|name)
- `order`: 排序顺序 (asc|desc, 默认: desc)

### 分页响应格式

```json
{
  "items": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 156,
    "pages": 8,
    "has_next": true,
    "has_prev": false
  }
}
```

## 速率限制

为了保护API服务，对请求频率进行限制：

- **普通接口**: 60次/分钟
- **AI接口**: 10次/分钟
- **搜索接口**: 30次/分钟
- **文件上传**: 5次/分钟

### 速率限制响应头

```http
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 59
X-RateLimit-Reset: 1640995200
```

## SDK和客户端库

### JavaScript/TypeScript

```bash
npm install ai-notebook-sdk
```

```javascript
import { AINotebookClient } from 'ai-notebook-sdk';

const client = new AINotebookClient({
  baseURL: 'https://api.ai-notebook.com',
  token: 'your-jwt-token'
});

// 获取笔记列表
const notes = await client.notes.list({
  page: 1,
  limit: 20
});

// 创建笔记
const newNote = await client.notes.create({
  title: '新笔记',
  content: '笔记内容...'
});
```

### Python

```bash
pip install ai-notebook-client
```

```python
from ai_notebook import Client

client = Client(
    base_url='https://api.ai-notebook.com',
    token='your-jwt-token'
)

# 获取笔记列表
notes = client.notes.list(page=1, limit=20)

# 创建笔记
new_note = client.notes.create(
    title='新笔记',
    content='笔记内容...'
)
```

## Webhook

### 配置Webhook

```http
POST /api/webhooks
Authorization: Bearer <token>
```

**请求参数**:
```json
{
  "url": "https://your-app.com/webhook",
  "events": ["note.created", "note.updated", "ai.task.completed"],
  "secret": "your-webhook-secret"
}
```

### Webhook事件

支持的事件类型：

- `note.created`: 笔记创建
- `note.updated`: 笔记更新
- `note.deleted`: 笔记删除
- `ai.task.completed`: AI任务完成
- `user.registered`: 用户注册

### Webhook载荷示例

```json
{
  "event": "note.created",
  "timestamp": "2024-01-01T12:00:00Z",
  "data": {
    "note_id": 123,
    "user_id": 456,
    "title": "新建笔记",
    "created_at": "2024-01-01T12:00:00Z"
  }
}
```

## 变更日志

### v1.0.0 (2024-01-01)
- 初始API发布
- 支持用户管理、笔记CRUD、AI功能
- 提供完整的认证和授权机制

---

更多详细信息请访问：https://docs.ai-notebook.com