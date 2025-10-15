# 🚀 立即部署指南 - 分步操作

> 完整的部署流程，跟着做即可成功

## 📋 准备工作检查

- [x] ✅ 代码已推送到GitHub: https://github.com/monicalyu924/my-AI-Notebook
- [x] ✅ Supabase数据库运行正常
- [ ] Railway账号 (即将创建)
- [ ] Vercel账号 (即将创建)

---

## 🚂 步骤1: 部署后端到Railway (10分钟)

### 1.1 创建Railway账号

1. **访问**: https://railway.app/
2. **点击**: "Start a New Project"
3. **登录方式**: 选择 "Login with GitHub"
4. **授权**: 允许Railway访问您的GitHub账号

### 1.2 从GitHub部署

1. **新建项目**:
   - 点击 "New Project"
   - 选择 "Deploy from GitHub repo"

2. **选择仓库**:
   - 找到并选择: `monicalyu924/my-AI-Notebook`
   - 点击 "Deploy Now"

3. **配置项目**:
   Railway会自动检测到Python项目，但我们需要指定backend目录

### 1.3 配置构建设置

在Railway项目Dashboard:

1. **点击项目** → **Settings**

2. **设置Root Directory**:
   ```
   Root Directory: backend
   ```

3. **设置Build Command** (可选，Railway会自动检测):
   ```
   Build Command: pip install -r requirements.txt
   ```

4. **设置Start Command**:
   ```
   Start Command: python main.py
   ```

### 1.4 配置环境变量

在Railway项目中:

1. **点击**: Variables 标签

2. **添加以下变量** (点击 "New Variable" 逐个添加):

   ```env
   DATABASE_TYPE=supabase

   SUPABASE_URL=https://lvwjycoderrjetuzqrdy.supabase.co

   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2d2p5Y29kZXJyamV0dXpxcmR5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODcxNDMzMywiZXhwIjoyMDc0MjkwMzMzfQ._DTXVOVQLz1mLN9bryqea-lz0Wp1joLNE4H3W-JzoHk

   SECRET_KEY=
   ```

   **生成SECRET_KEY**:
   ```bash
   # 在本地终端运行
   python3 -c "import secrets; print(secrets.token_urlsafe(32))"
   # 复制输出的随机字符串
   ```

3. **继续添加**:
   ```env
   ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=30
   PORT=8000
   PYTHONUNBUFFERED=1
   ```

### 1.5 触发部署

1. **保存环境变量后**，Railway会自动开始部署
2. **等待构建** (约2-3分钟)
3. **查看日志**: 点击 "Deployments" 查看构建进度

### 1.6 获取后端URL

部署成功后:

1. **点击**: Settings → Domains
2. **点击**: "Generate Domain"
3. **复制URL**: 例如 `https://my-ai-notebook-production.up.railway.app`

**保存这个URL!** 后面配置前端需要用到。

### 1.7 验证后端部署

```bash
# 在本地终端测试
curl https://your-app.up.railway.app/

# 应该返回:
# {"message":"AI记事本 API服务","version":"2.0.0"}
```

**访问API文档**:
```
https://your-app.up.railway.app/docs
```

---

## 🌐 步骤2: 部署前端到Vercel (5分钟)

### 2.1 创建Vercel账号

1. **访问**: https://vercel.com/
2. **点击**: "Sign Up"
3. **登录方式**: 选择 "Continue with GitHub"
4. **授权**: 允许Vercel访问您的GitHub账号

### 2.2 导入项目

1. **点击**: "Add New..." → "Project"

2. **导入仓库**:
   - 找到: `monicalyu924/my-AI-Notebook`
   - 点击 "Import"

3. **配置项目**:
   - **Project Name**: `ai-notebook` (或您喜欢的名称)
   - **Framework Preset**: Vite (Vercel应该自动检测)
   - **Root Directory**: 点击 "Edit" → 选择 `frontend`

### 2.3 配置环境变量

在 "Environment Variables" 部分:

**关键变量** (点击 "Add" 添加):

```env
VITE_API_BASE_URL=https://your-railway-app.up.railway.app
```

**⚠️ 重要**: 将上面的URL替换为您在Railway获取的真实URL!

**可选变量**:
```env
VITE_APP_NAME=AI智能记事本
VITE_APP_VERSION=2.0.0
VITE_ENABLE_PWA=true
```

### 2.4 开始部署

1. **点击**: "Deploy"
2. **等待构建** (约2-3分钟)
3. **部署成功**: 会显示 "Congratulations!" 和预览链接

### 2.5 获取前端URL

部署成功后会得到:
```
https://ai-notebook-xxx.vercel.app
```

---

## 🔧 步骤3: 配置CORS (重要!)

### 3.1 更新后端CORS配置

前端部署完成后，需要更新后端允许的域名。

1. **在本地编辑器打开**: `backend/main.py`

2. **找到CORS配置**，更新为:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # 本地开发
        "https://ai-notebook-xxx.vercel.app",  # 替换为您的Vercel URL
        "https://*.vercel.app",  # 允许所有Vercel预览部署
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

3. **保存并提交**:
```bash
cd "/Users/monica/Documents/ai practise/记事本 9.17"
git add backend/main.py
git commit -m "更新CORS配置支持Vercel生产域名"
git push
```

4. **Railway会自动重新部署** (约1-2分钟)

---

## ✅ 步骤4: 测试生产环境

### 4.1 测试后端

```bash
# 健康检查
curl https://your-railway-app.up.railway.app/

# 测试注册API
curl -X POST https://your-railway-app.up.railway.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@production.com","password":"test123","full_name":"生产测试"}'
```

### 4.2 测试前端

1. **访问**: https://ai-notebook-xxx.vercel.app

2. **测试功能**:
   - [ ] 页面正常加载
   - [ ] 可以注册新用户
   - [ ] 可以登录
   - [ ] 可以创建笔记
   - [ ] 可以编辑笔记

### 4.3 检查数据库

登录Supabase Dashboard:
```
https://supabase.com/dashboard/project/lvwjycoderrjetuzqrdy
```

检查:
- [ ] 新注册的用户已出现在users表
- [ ] 创建的笔记已保存在notes表

---

## 🎉 完成检查清单

### Railway (后端)
- [ ] 项目已创建
- [ ] 环境变量已配置
- [ ] 部署成功
- [ ] API可访问
- [ ] 健康检查通过

### Vercel (前端)
- [ ] 项目已创建
- [ ] Root Directory设置为frontend
- [ ] VITE_API_BASE_URL已配置
- [ ] 部署成功
- [ ] 网站可访问

### CORS配置
- [ ] main.py已更新
- [ ] 包含Vercel域名
- [ ] 已推送并重新部署

### 功能测试
- [ ] 用户注册功能正常
- [ ] 用户登录功能正常
- [ ] 笔记CRUD功能正常
- [ ] 数据保存到Supabase

---

## 📊 部署信息记录

**请填写您的部署信息**:

```
后端URL (Railway):
https://_____________________________________.up.railway.app

前端URL (Vercel):
https://_____________________________________.vercel.app

Supabase项目:
https://lvwjycoderrjetuzqrdy.supabase.co

部署时间:
_____年____月____日

测试账号:
邮箱: _________________________________
密码: _________________________________
```

---

## 🐛 常见问题

### Q1: Railway构建失败

**检查**:
- Root Directory是否设置为 `backend`
- requirements.txt是否存在
- Python版本是否兼容

**解决**:
- 查看构建日志
- 确认环境变量正确

### Q2: Vercel构建失败

**检查**:
- Root Directory是否设置为 `frontend`
- package.json是否存在
- npm install是否成功

**解决**:
- 查看构建日志
- 检查node_modules是否在.gitignore中

### Q3: CORS错误

**症状**: 前端控制台显示跨域错误

**解决**:
1. 确认backend/main.py中的CORS配置包含Vercel域名
2. 重新部署后端
3. 清除浏览器缓存

### Q4: 无法连接数据库

**检查**:
- SUPABASE_URL是否正确
- SUPABASE_SERVICE_ROLE_KEY是否正确
- Supabase项目是否处于Active状态

---

## 🎊 恭喜！

如果所有步骤都完成了，您的AI记事本应用已经成功部署到生产环境！

**分享您的应用**:
- 前端访问地址: https://your-app.vercel.app
- API文档: https://your-api.up.railway.app/docs

**下一步**:
- 绑定自定义域名 (可选)
- 配置SSL证书 (Vercel/Railway自动提供)
- 设置监控和日志
- 邀请用户测试

---

**需要帮助？** 参考 [DEPLOYMENT_SUPABASE.md](DEPLOYMENT_SUPABASE.md) 获取更详细的说明。
