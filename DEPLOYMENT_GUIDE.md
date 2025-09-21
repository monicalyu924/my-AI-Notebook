# 部署指南

本指南将帮助您将AI记事本应用部署到生产环境。

## 🌐 前端部署 (Vercel)

### 方法1: 通过GitHub自动部署

1. **准备代码仓库**
   ```bash
   # 初始化Git仓库
   git init
   git add .
   git commit -m "Initial commit: AI Notebook"
   
   # 推送到GitHub
   git remote add origin https://github.com/你的用户名/ai-notebook.git
   git push -u origin main
   ```

2. **连接Vercel**
   - 访问 [vercel.com](https://vercel.com) 并使用GitHub登录
   - 点击 "New Project" 
   - 选择你的AI记事本仓库
   - 配置项目设置：
     - Framework Preset: React
     - Root Directory: `frontend`
     - Build Command: `npm run build`
     - Output Directory: `dist`

3. **配置环境变量**
   在Vercel项目设置中添加：
   ```
   VITE_API_BASE_URL=https://your-backend-url.com
   ```

4. **部署**
   - 点击 "Deploy" 
   - 等待构建完成

### 方法2: 手动部署

```bash
cd frontend
npm run build
# 将dist文件夹上传到任何静态网站托管服务
```

## 🐍 后端部署 (Render)

### 步骤1: 准备部署文件

在`backend`目录中创建以下文件：

**Dockerfile**
```dockerfile
FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**render.yaml** (可选，用于基础设施即代码)
```yaml
services:
  - type: web
    name: ai-notebook-api
    env: python
    buildCommand: pip install -r requirements.txt
    startCommand: uvicorn main:app --host 0.0.0.0 --port $PORT
    envVars:
      - key: SUPABASE_URL
        value: your_supabase_url
      - key: SUPABASE_ANON_KEY
        value: your_anon_key
      - key: SUPABASE_SERVICE_ROLE_KEY
        value: your_service_role_key
      - key: SECRET_KEY
        value: your_secret_key
```

### 步骤2: 部署到Render

1. **创建Render账号**
   - 访问 [render.com](https://render.com)
   - 使用GitHub账号注册/登录

2. **创建新的Web Service**
   - 点击 "New +" → "Web Service"
   - 连接GitHub仓库
   - 配置项目：
     - Name: `ai-notebook-api`
     - Environment: `Python 3`
     - Build Command: `pip install -r requirements.txt`
     - Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`

3. **配置环境变量**
   在Environment Variables部分添加：
   ```
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_anon_key  
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   SECRET_KEY=your_random_secret_key
   ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=30
   ```

4. **部署**
   - 点击 "Create Web Service"
   - 等待部署完成

## 🚀 替代部署方案

### Railway (后端)
1. 访问 [railway.app](https://railway.app)
2. 连接GitHub仓库
3. 配置环境变量
4. 自动部署

### Netlify (前端)
1. 访问 [netlify.com](https://netlify.com)
2. 拖拽`frontend/dist`文件夹到部署区域
3. 配置环境变量

### 自托管服务器

**使用Docker Compose**

创建`docker-compose.yml`:
```yaml
version: '3.8'
services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}
      - SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
      - SECRET_KEY=${SECRET_KEY}
    
  frontend:
    build: ./frontend
    ports:
      - "80:80"
    environment:
      - VITE_API_BASE_URL=http://localhost:8000
```

部署命令：
```bash
docker-compose up -d
```

## 🔧 生产环境配置

### 1. 安全设置
- 使用强密码作为SECRET_KEY
- 启用HTTPS
- 配置CORS策略
- 设置适当的环境变量

### 2. 性能优化
- 启用gzip压缩
- 配置CDN
- 数据库连接池
- 缓存策略

### 3. 监控和日志
- 设置错误监控 (如Sentry)
- 配置日志记录
- 性能监控
- 健康检查端点

## 🔍 部署后验证

1. **检查前端**
   - 访问前端URL
   - 测试登录注册功能
   - 验证页面样式正常

2. **检查后端**
   - 访问 `https://your-api-url.com/docs`
   - 测试API端点
   - 验证数据库连接

3. **集成测试**
   - 完整的用户注册流程
   - 创建和编辑笔记
   - AI功能测试

## 📝 故障排除

### 常见问题

1. **构建失败**
   - 检查Node.js版本兼容性
   - 确认所有依赖已正确安装
   - 查看构建日志

2. **环境变量问题**
   - 确认所有必需的环境变量已设置
   - 检查变量名拼写
   - 验证Supabase配置

3. **CORS错误**
   - 更新后端CORS设置
   - 确认前端URL在允许列表中

4. **数据库连接失败**
   - 验证Supabase URL和密钥
   - 检查数据库表是否正确创建
   - 确认网络连接

### 日志查看

**Vercel**: 在项目仪表板中查看Function Logs
**Render**: 在服务页面点击"Logs"标签
**本地调试**: 使用浏览器开发者工具和服务器控制台
