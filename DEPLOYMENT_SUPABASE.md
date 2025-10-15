# AI记事本 - Supabase版生产环境部署指南

> 基于Supabase云数据库的完整部署方案

## 📋 快速导航

- [部署前检查](#部署前检查)
- [推荐方案](#推荐方案)
- [详细步骤](#详细步骤)
- [环境配置](#环境配置)
- [测试验证](#测试验证)
- [监控维护](#监控维护)

---

## 🎯 部署前检查

### 必备条件

- [x] ✅ Supabase数据库已迁移完成
- [x] ✅ 本地测试通过
- [ ] GitHub仓库已创建
- [ ] Vercel账号已注册
- [ ] Railway/Render账号已注册

### 数据验证

运行以下命令验证Supabase数据:

```bash
cd backend
python3 -c "
import database
health = database.check_database_health()
print(f'数据库状态: {health[\"status\"]}')
print(f'用户数: {health.get(\"user_count\", 0)}')
"
```

**预期输出**:
```
数据库状态: healthy
用户数: 7 (或更多)
```

---

## 🚀 推荐方案

### 方案对比

| 方案 | 前端 | 后端 | 优点 | 缺点 | 免费额度 |
|------|------|------|------|------|---------|
| **推荐** | Vercel | Railway | 部署最快,自动CI/CD | - | 500小时/月 |
| 备选1 | Vercel | Render | 更稳定,有Health Check | 冷启动较慢 | 750小时/月 |
| 备选2 | Netlify | Railway | 替代方案 | 配置稍复杂 | 300分钟构建/月 |

### 最终架构

```
用户
  ↓
Vercel CDN (前端)
  ↓
Railway/Render (后端FastAPI)
  ↓
Supabase (PostgreSQL数据库)
```

---

## 📝 详细步骤

### 第一步: 准备Git仓库

1. **初始化Git**(如果还没有):
   ```bash
   cd "/Users/monica/Documents/ai practise/记事本 9.17"
   git init
   git add .
   git commit -m "准备部署到生产环境"
   ```

2. **创建GitHub仓库**:
   - 访问 https://github.com/new
   - 仓库名: `ai-notebook`
   - 选择Private
   - 不要初始化README

3. **推送到GitHub**:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/ai-notebook.git
   git branch -M main
   git push -u origin main
   ```

---

### 第二步: 部署后端到Railway

#### 2.1 创建Railway项目

1. 访问 https://railway.app/
2. 点击 "Start a New Project"
3. 选择 "Deploy from GitHub repo"
4. 授权并选择 `ai-notebook` 仓库

#### 2.2 配置构建设置

在Railway Dashboard:

1. **Root Directory**: `backend`
2. **Build Command**: `pip install -r requirements.txt`
3. **Start Command**: `python main.py`

#### 2.3 配置环境变量

点击 "Variables" 标签,添加以下变量:

```env
DATABASE_TYPE=supabase
SUPABASE_URL=https://lvwjycoderrjetuzqrdy.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SECRET_KEY=生成一个随机密钥
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
PORT=8000
PYTHONUNBUFFERED=1
```

**生成SECRET_KEY**:
```bash
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
```

#### 2.4 部署并获取URL

1. 点击 "Deploy"
2. 等待构建完成(约2-3分钟)
3. 记录生成的URL: `https://your-app.up.railway.app`

#### 2.5 验证后端

```bash
curl https://your-app.up.railway.app/
```

应返回:
```json
{"message":"AI记事本 API服务","version":"2.0.0"}
```

---

### 第三步: 部署前端到Vercel

#### 3.1 安装Vercel CLI

```bash
npm install -g vercel
vercel login
```

#### 3.2 配置前端环境变量

编辑 `frontend/.env.production`:

```env
VITE_API_BASE_URL=https://your-app.up.railway.app
VITE_APP_NAME=AI智能记事本
VITE_APP_VERSION=2.0.0
VITE_ENABLE_PWA=true
```

#### 3.3 构建并部署

```bash
cd frontend
npm install
npm run build
vercel --prod
```

按提示操作:
- **Set up and deploy**: Yes
- **Which scope**: 选择您的账号
- **Link to existing project**: No
- **Project name**: ai-notebook
- **Directory**: `./`
- **Override settings**: No

#### 3.4 记录Vercel URL

部署完成后会显示:
```
✅  Production: https://ai-notebook.vercel.app
```

---

### 第四步: 配置CORS

更新后端CORS设置以允许Vercel域名访问。

1. **编辑** `backend/main.py`:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # 本地开发
        "https://ai-notebook.vercel.app",  # 生产环境
        "https://*.vercel.app",  # Vercel预览部署
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

2. **提交并推送**:
```bash
git add backend/main.py
git commit -m "更新CORS配置支持Vercel域名"
git push
```

Railway会自动重新部署。

---

## ⚙️ 环境配置详解

### Supabase环境变量

| 变量 | 获取方式 | 备注 |
|------|----------|------|
| `SUPABASE_URL` | Supabase Dashboard → Settings → API | 项目URL |
| `SUPABASE_ANON_KEY` | 同上 | 前端使用(可选) |
| `SUPABASE_SERVICE_ROLE_KEY` | 同上 | **重要**: 后端专用,不要泄露 |

### JWT配置

| 变量 | 推荐值 | 说明 |
|------|--------|------|
| `SECRET_KEY` | 随机生成 | 用于签名JWT,每个环境应不同 |
| `ALGORITHM` | `HS256` | JWT算法 |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `30` | Token有效期 |

---

## ✅ 测试验证

### 1. 后端健康检查

```bash
curl https://your-app.up.railway.app/
```

### 2. 前端访问测试

在浏览器打开: `https://ai-notebook.vercel.app`

### 3. 完整流程测试

1. 访问前端应用
2. 注册新用户
3. 创建一条笔记
4. 编辑笔记
5. 删除笔记
6. 登出并重新登录

### 4. 数据库验证

登录Supabase Dashboard:
```
https://supabase.com/dashboard/project/lvwjycoderrjetuzqrdy
```

检查:
- [ ] 新用户已创建
- [ ] 笔记数据正确
- [ ] 时间戳正确

---

## 📊 监控维护

### Railway监控

访问Railway Dashboard查看:
- **Metrics**: CPU、内存、网络使用
- **Logs**: 实时日志
- **Deployments**: 部署历史

### Vercel Analytics

在Vercel Dashboard启用Analytics:
- **Visitors**: 访问量统计
- **Performance**: 页面加载时间
- **Web Vitals**: Core Web Vitals指标

### Supabase监控

在Supabase Dashboard:
- **Database**: 数据库大小、连接数
- **API**: API请求统计
- **Auth**: 用户认证统计

---

## 🔧 故障排查

### 问题1: 后端502错误

**可能原因**:
- 启动命令错误
- 依赖未安装
- 端口配置错误

**解决方案**:
```bash
# 检查Railway日志
# 确认启动命令为: python main.py
# 确认PORT环境变量已设置
```

### 问题2: CORS错误

**症状**: 前端控制台显示跨域错误

**解决方案**:
1. 检查`main.py`中的`allow_origins`
2. 确保包含Vercel域名
3. 重新部署后端

### 问题3: 数据库连接超时

**解决方案**:
```bash
# 1. 检查Supabase项目状态
# 2. 验证SERVICE_ROLE_KEY
# 3. 检查IP限制
```

### 问题4: Vercel构建失败

**常见原因**:
- npm依赖版本冲突
- 环境变量缺失

**解决方案**:
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run build
```

---

## 💰 成本估算

### 免费方案(个人使用)

| 服务 | 免费额度 | 预计使用 | 成本 |
|------|---------|---------|------|
| Vercel | 100GB带宽 | ~5GB | $0 |
| Railway | 500小时 | ~720小时 | 超出部分$5 |
| Supabase | 500MB数据库 | ~100MB | $0 |
| **总计** | - | - | **$0-5/月** |

### 生产方案(小团队)

| 服务 | 计划 | 成本 |
|------|------|------|
| Vercel Pro | 更高带宽 | $20/月 |
| Railway Pro | 专用资源 | $20/月 |
| Supabase Pro | 8GB数据库 | $25/月 |
| **总计** | - | **$65/月** |

---

## 🔐 安全最佳实践

### 1. 密钥管理

- ✅ 使用强随机密钥
- ✅ 不要在代码中硬编码密钥
- ✅ 每个环境使用不同的密钥
- ✅ 定期轮换密钥

### 2. Supabase安全

- ✅ 启用RLS (Row Level Security)
- ✅ 使用Service Role Key仅在后端
- ✅ 定期审查API日志
- ✅ 限制IP访问(可选)

### 3. 后端安全

- ✅ 配置正确的CORS
- ✅ 使用HTTPS (Railway自动提供)
- ✅ 限制API请求频率
- ✅ 验证所有用户输入

---

## 🚀 持续集成/部署 (CI/CD)

### 自动部署流程

```
Git Push
  ↓
GitHub
  ↓
├─> Railway (自动部署后端)
└─> Vercel (自动部署前端)
```

### 配置GitHub Actions(可选)

创建 `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Test Backend
        run: |
          cd backend
          pip install -r requirements.txt
          # python -m pytest tests/
```

---

## 📱 移动端支持

### PWA配置

前端已配置PWA支持,用户可以:

1. 在Chrome访问应用
2. 点击地址栏的"安装"图标
3. 添加到主屏幕
4. 像原生应用一样使用

---

## 📚 相关文档

- [Supabase迁移总结](backend/SUPABASE_MIGRATION_SUMMARY.md)
- [项目README](README.md)
- [CLAUDE配置说明](CLAUDE.md)

---

## 🎉 部署完成检查清单

- [ ] 后端已部署到Railway/Render
- [ ] 前端已部署到Vercel
- [ ] 环境变量已正确配置
- [ ] CORS配置已更新
- [ ] 数据库连接正常
- [ ] 完整流程测试通过
- [ ] 监控已启用
- [ ] 文档已更新

---

**最后更新**: 2025-10-14
**部署版本**: v2.0.0 (Supabase版)

🎊 恭喜!您的AI记事本应用已成功部署到生产环境!
