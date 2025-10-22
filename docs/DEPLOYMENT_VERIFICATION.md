# 部署验证和配置指南

## 部署架构

```
┌─────────────────────────────────────────────────────────┐
│                    用户浏览器                            │
└───────────────────┬─────────────────────────────────────┘
                    │
        ┌───────────┴──────────┐
        │                      │
        ▼                      ▼
┌──────────────┐      ┌──────────────┐
│   前端部署    │      │   后端部署    │
│   Vercel     │◄────►│   Railway    │
└──────────────┘      └───────┬──────┘
                              │
                    ┌─────────┴─────────┐
                    │                   │
                    ▼                   ▼
            ┌──────────────┐    ┌──────────────┐
            │  Supabase    │    │  Google API  │
            │  PostgreSQL  │    │  (Gemini)    │
            └──────────────┘    └──────────────┘
```

## 部署环境

### 前端 - Vercel
- **URL**: https://ai-notebook-production.vercel.app
- **框架**: React 19 + Vite 7
- **自动部署**: GitHub main 分支推送时自动触发

### 后端 - Railway
- **环境**: 生产环境
- **框架**: FastAPI + Python 3.9+
- **数据库**: Supabase PostgreSQL
- **自动部署**: GitHub main 分支推送时自动触发

### 数据库 - Supabase
- **类型**: PostgreSQL (云端托管)
- **功能**: 用户数据、笔记、聊天历史等

## 1️⃣ Supabase 数据库更新

### 步骤 1：登录 Supabase Dashboard
```
访问: https://app.supabase.com
选择您的项目
```

### 步骤 2：执行 SQL 迁移

1. 点击左侧菜单 **SQL Editor**
2. 点击 **New Query**
3. 复制以下 SQL 并执行：

```sql
-- Add google_api_key column to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS google_api_key TEXT;

-- Add comment to the column
COMMENT ON COLUMN users.google_api_key IS 'Google API key for Nano Banana image generation (Gemini 2.5 Flash Image Preview)';
```

4. 点击 **Run** 执行 SQL

### 步骤 3：验证列已添加

```sql
-- 查询 users 表结构
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;
```

预期结果应包含：
```
column_name      | data_type | is_nullable
-----------------+-----------+-------------
id               | uuid      | NO
email            | text      | NO
password_hash    | text      | NO
full_name        | text      | YES
role             | text      | NO
openrouter_api_key| text     | YES
google_api_key   | text      | YES  ← 新增字段
created_at       | timestamp | NO
updated_at       | timestamp | NO
```

## 2️⃣ Railway 后端部署验证

### 检查后端服务状态

1. **登录 Railway Dashboard**
   ```
   访问: https://railway.app
   选择您的项目
   ```

2. **查看部署日志**
   - 点击您的服务
   - 切换到 **Deployments** 标签
   - 查看最新部署的日志

3. **验证部署成功标志**
   ```
   预期日志输出：
   ✓ Building application...
   ✓ Installing dependencies...
   ✓ Starting FastAPI server...
   🚀 使用 Supabase 数据库: [YOUR_SUPABASE_URL]
   INFO: Uvicorn running on http://0.0.0.0:8000
   ```

### 检查环境变量

确保 Railway 中配置了以下环境变量：

```bash
# 必需的环境变量
DATABASE_TYPE=supabase
SUPABASE_URL=https://[your-project].supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SECRET_KEY=your-secret-key-here

# 可选但推荐
PORT=8000
PYTHON_VERSION=3.9
```

**配置方法**：
1. Railway Dashboard → 选择服务
2. 点击 **Variables** 标签
3. 添加/更新环境变量
4. 保存后自动重新部署

### 测试后端 API

```bash
# 测试健康检查
curl https://[your-railway-url]/health

# 预期响应
{"status":"healthy"}

# 测试 Nano Banana 模型列表
curl https://[your-railway-url]/api/nano-banana/models

# 预期响应
{
  "models": [
    {
      "id": "gemini-2.5-flash-image-preview",
      "name": "Nano Banana (Gemini 2.5 Flash Image Preview)",
      ...
    }
  ]
}
```

## 3️⃣ Vercel 前端部署验证

### 检查前端部署状态

1. **登录 Vercel Dashboard**
   ```
   访问: https://vercel.com/dashboard
   选择您的项目: ai-notebook-production
   ```

2. **查看部署状态**
   - 最新部署应该是 **Ready** 状态
   - 查看 **Domains** 确认域名正常

3. **验证构建日志**
   ```
   预期输出：
   ✓ Building application...
   ✓ Installing dependencies...
   ✓ Running build command: npm run build
   ✓ Build completed
   ✓ Deployment ready
   ```

### 检查环境变量

Vercel 前端需要配置：

```bash
# 生产环境后端 API 地址
VITE_API_BASE_URL=https://[your-railway-url]
```

**配置方法**：
1. Vercel Dashboard → 选择项目
2. Settings → Environment Variables
3. 添加 `VITE_API_BASE_URL`
4. 重新部署

### 访问前端应用

```
主页: https://ai-notebook-production.vercel.app
登录: https://ai-notebook-production.vercel.app/login
聊天: https://ai-notebook-production.vercel.app/app (登录后)
图像生成: https://ai-notebook-production.vercel.app/image-generator
```

## 4️⃣ 端到端功能测试

### 测试 Nano Banana 集成

#### 测试 1：聊天界面图像生成

1. 访问 https://ai-notebook-production.vercel.app/login
2. 登录您的账号
3. 进入"AI 对话"页面
4. 点击右上角模型选择器
5. 选择 **🍌 Nano Banana (图像生成)**
6. 输入提示词：`一只可爱的猫咪坐在月球上，星空背景`
7. 点击发送

**预期结果**：
- ✅ 输入框提示变为"描述您想生成的图像..."
- ✅ 5-30 秒后显示生成的图像
- ✅ 图像下方有"下载图像"按钮
- ✅ 点击下载按钮可保存图像

**如果失败**：
- 检查是否配置了 Google API 密钥（设置页面）
- 打开浏览器开发者工具（F12）查看错误信息
- 检查后端日志

#### 测试 2：独立图像生成器

1. 访问 https://ai-notebook-production.vercel.app/image-generator
2. 在"生成新图像"标签页
3. 输入图像描述
4. 设置生成数量（1-4）
5. 点击"生成图像"

**预期结果**：
- ✅ 显示加载动画
- ✅ 生成1-4张图像显示在右侧
- ✅ 每张图像可以下载

#### 测试 3：图像编辑功能

1. 在独立图像生成器中先生成一张图像
2. 切换到"编辑图像"标签页
3. 选择刚才生成的图像
4. 输入编辑指令：`将背景改为森林`
5. 点击"编辑图像"

**预期结果**：
- ✅ 生成编辑后的图像
- ✅ 保持主体一致，背景改变

### 测试 API 密钥配置

1. 访问 https://ai-notebook-production.vercel.app/settings
2. 找到"Google API Key"输入框
3. 输入测试密钥
4. 点击"保存设置"

**预期结果**：
- ✅ 显示成功提示
- ✅ 刷新页面后密钥仍然存在（加密显示）
- ✅ 可以在图像生成功能中使用

## 5️⃣ CORS 配置验证

### 确认 CORS 设置

检查后端 `main.py` 中的 CORS 配置：

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        # Vercel 生产环境
        "https://ai-notebook-production.vercel.app",
        "https://*.vercel.app",
        # 本地开发
        "http://localhost:3000",
        "http://localhost:5173",
        ...
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)
```

**验证方法**：
```bash
# 测试 CORS preflight 请求
curl -X OPTIONS \
  https://[your-railway-url]/api/nano-banana/models \
  -H "Origin: https://ai-notebook-production.vercel.app" \
  -H "Access-Control-Request-Method: POST" \
  -v

# 预期响应头包含:
# Access-Control-Allow-Origin: https://ai-notebook-production.vercel.app
# Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
```

## 6️⃣ 性能监控

### 前端性能

```bash
# 使用 Lighthouse 测试
npx lighthouse https://ai-notebook-production.vercel.app --view

# 目标指标:
Performance: > 90
Accessibility: > 90
Best Practices: > 90
SEO: > 90
```

### 后端性能

```bash
# 测试 API 响应时间
time curl https://[your-railway-url]/health

# 预期: < 500ms

# 测试图像生成响应时间
time curl -X POST https://[your-railway-url]/api/nano-banana/generate \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "test", "num_images": 1}'

# 预期: 5-30秒（取决于图像复杂度）
```

## 7️⃣ 常见问题排查

### 问题 1：前端无法连接后端

**症状**：
- 前端页面加载正常，但 API 请求失败
- 浏览器控制台显示 CORS 错误

**排查步骤**：
1. 检查 Vercel 环境变量 `VITE_API_BASE_URL` 是否正确
2. 检查 Railway 后端 CORS 配置
3. 确认 Railway 服务正在运行
4. 使用 `curl` 测试后端 API 是否可访问

### 问题 2：图像生成失败

**症状**：
- 点击发送后显示错误："图像生成失败"

**排查步骤**：
1. 检查用户是否配置了 Google API 密钥
2. 验证 Google API 密钥是否有效
3. 检查 Supabase 中 `google_api_key` 字段是否存在
4. 查看 Railway 后端日志

### 问题 3：数据库连接失败

**症状**：
- Railway 日志显示数据库连接错误

**排查步骤**：
1. 检查 Railway 环境变量：
   - `DATABASE_TYPE=supabase`
   - `SUPABASE_URL` 正确
   - `SUPABASE_SERVICE_ROLE_KEY` 正确
2. 在 Supabase Dashboard 检查项目状态
3. 验证 API 密钥权限

### 问题 4：部署后功能正常但数据丢失

**原因**：
- SQLite 数据库文件未迁移到 Supabase

**解决方法**：
1. 确认 Railway 环境变量 `DATABASE_TYPE=supabase`
2. 运行数据迁移脚本（如有本地数据需迁移）
3. 在 Supabase 中手动创建测试数据验证

## 8️⃣ 部署检查清单

使用此清单验证部署是否完整：

### Supabase
- [ ] `google_api_key` 列已添加到 `users` 表
- [ ] 可以查询 users 表并看到新列
- [ ] 数据库连接正常

### Railway 后端
- [ ] 最新代码已部署（包含 `nano_banana_router.py`）
- [ ] 环境变量配置正确
- [ ] 服务状态为 "Running"
- [ ] 健康检查 API 返回正常
- [ ] Nano Banana API 端点可访问
- [ ] 日志无错误信息

### Vercel 前端
- [ ] 最新代码已部署（包含 `ImageGeneratorPage.jsx` 和 `ChatPage.jsx` 更新）
- [ ] `VITE_API_BASE_URL` 环境变量正确
- [ ] 前端页面加载正常
- [ ] 聊天界面显示 Nano Banana 模型选项
- [ ] 图像生成器页面可访问

### 功能测试
- [ ] 可以在设置页面保存 Google API 密钥
- [ ] 聊天界面可以选择 Nano Banana 模型
- [ ] 输入提示词后可以生成图像
- [ ] 生成的图像正确显示
- [ ] 可以下载生成的图像
- [ ] 独立图像生成器页面功能正常

### CORS 和安全
- [ ] CORS 配置包含 Vercel 域名
- [ ] API 需要 JWT 认证
- [ ] API 密钥加密存储

## 9️⃣ 回滚计划

如果部署出现严重问题，可以快速回滚：

### GitHub 回滚
```bash
# 查看最近的提交
git log --oneline -5

# 回滚到上一个提交
git revert HEAD
git push

# 或硬回滚（谨慎使用）
git reset --hard <previous-commit-hash>
git push --force
```

### Railway 回滚
1. Railway Dashboard → Deployments
2. 选择之前的稳定版本
3. 点击 **Redeploy**

### Vercel 回滚
1. Vercel Dashboard → Deployments
2. 找到之前的稳定部署
3. 点击 **Promote to Production**

## 🔟 监控和日志

### 设置告警

**Railway**：
- Settings → Notifications
- 配置部署失败通知

**Vercel**：
- Settings → Notifications
- 配置构建失败通知

### 日志查看

**Railway**：
```
Dashboard → 选择服务 → Logs
实时查看应用日志
```

**Vercel**：
```
Dashboard → 选择项目 → Deployments → 选择部署 → Functions
查看函数日志
```

**Supabase**：
```
Dashboard → Logs
查看数据库查询日志
```

---

## 📞 支持资源

- **GitHub Issues**: https://github.com/monicalyu924/my-AI-Notebook/issues
- **Railway 文档**: https://docs.railway.app
- **Vercel 文档**: https://vercel.com/docs
- **Supabase 文档**: https://supabase.com/docs

---

**最后更新**: 2025-10-22
**版本**: 1.0.0
