# 登录失败故障排查指南

## 错误现象

```
出现错误
很抱歉，应用遇到了一个错误，请尝试刷新页面返回主页。

错误详情:
- The FetchEvent for "https://ai-notebook-production.vercel.app/..." resulted in a network error response: the promise was rejected.
- Uncaught (in promise) TypeError: Failed to fetch
- net::ERR_FAILED
```

## 根本原因

这是一个**网络连接错误**，前端无法连接到后端 API。

---

## 快速解决方案

### 方案 1: 检查 Vercel 环境变量（最可能的原因）

1. **登录 Vercel Dashboard**
   ```
   https://vercel.com/dashboard
   ```

2. **进入项目设置**
   ```
   选择: ai-notebook-production
   点击: Settings
   点击: Environment Variables
   ```

3. **检查是否存在 `VITE_API_BASE_URL`**

   **如果不存在**，添加环境变量：
   - **Key**: `VITE_API_BASE_URL`
   - **Value**: `https://[your-railway-project-url]`
   - **Environment**: Production ✓ Preview ✓ Development ✓

4. **重新部署**
   ```
   Deployments → 最新部署 → ... → Redeploy
   ```

---

### 方案 2: 检查 Railway 后端状态

1. **登录 Railway**
   ```
   https://railway.app
   ```

2. **检查服务状态**
   - 状态应该是 **"Active"** 或 **"Running"**
   - 如果是 **"Failed"** 或 **"Crashed"**，查看日志

3. **查看后端日志**
   ```
   点击服务 → Logs
   ```

   **期望看到**:
   ```
   ✓ 🚀 使用 Supabase 数据库: https://...
   ✓ INFO: Uvicorn running on http://0.0.0.0:8000
   ```

4. **测试后端 API**
   ```bash
   # 替换为您的 Railway URL
   curl https://[your-railway-url]/health

   # 期望响应:
   {"status":"healthy"}
   ```

---

### 方案 3: 检查 Railway 环境变量

确保 Railway 配置了以下环境变量：

```bash
DATABASE_TYPE=supabase
SUPABASE_URL=https://[your-project].supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
SECRET_KEY=your-secret-key-here
```

**检查方法**:
```
Railway Dashboard → 选择服务 → Variables
```

---

## 详细排查步骤

### 步骤 1: 确认 Railway 后端 URL

1. 在 Railway Dashboard 中找到您的项目
2. 点击服务，找到 **Settings** → **Networking**
3. 复制 **Public URL**，例如：
   ```
   https://your-project.up.railway.app
   ```

### 步骤 2: 在 Vercel 配置后端 URL

1. Vercel Dashboard → ai-notebook-production
2. Settings → Environment Variables
3. 添加或更新：
   ```
   VITE_API_BASE_URL = https://your-project.up.railway.app
   ```
4. 点击 **Save**

### 步骤 3: 重新部署 Vercel

**方法 A: 自动触发**
```bash
# 在本地终端
cd "/Users/monica/Documents/ai practise/记事本 9.17"
git commit --allow-empty -m "触发 Vercel 重新部署"
git push
```

**方法 B: 手动触发**
```
Vercel Dashboard → Deployments → 最新部署 → ⋯ → Redeploy
```

### 步骤 4: 验证修复

等待 2-3 分钟后：

1. **清除浏览器缓存**
   - Chrome: `Ctrl+Shift+Delete` (Windows) 或 `Cmd+Shift+Delete` (Mac)
   - 选择 "缓存的图像和文件"
   - 点击 "清除数据"

2. **硬刷新页面**
   - Windows: `Ctrl+Shift+R`
   - Mac: `Cmd+Shift+R`

3. **尝试重新登录**

---

## 浏览器开发者工具检查

### 打开开发者工具
- Windows: `F12` 或 `Ctrl+Shift+I`
- Mac: `Cmd+Option+I`

### 检查 Network 标签

1. 切换到 **Network** 标签
2. 刷新页面
3. 查找失败的请求（红色）
4. 点击失败的请求，查看详情

**如果看到 `(failed) net::ERR_FAILED`**:
- 问题：前端无法连接到后端
- 原因：`VITE_API_BASE_URL` 未配置或配置错误

**如果看到 `404 Not Found`**:
- 问题：API 路由不存在
- 原因：后端未正确部署新代码

**如果看到 `CORS error`**:
- 问题：跨域请求被阻止
- 原因：后端 CORS 配置未包含 Vercel 域名

### 检查 Console 标签

查找错误信息：

```javascript
// 如果看到这个，说明环境变量未配置
API_BASE_URL设置为: undefined

// 正确应该是
API_BASE_URL设置为: https://your-project.up.railway.app
```

---

## 常见错误场景

### 场景 1: "Failed to fetch" + CORS error

**原因**: 后端 CORS 配置问题

**解决**: 检查 `backend/main.py` 中的 CORS 配置

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://ai-notebook-production.vercel.app",  # ← 必须包含
        "https://*.vercel.app",
        ...
    ],
    ...
)
```

### 场景 2: "net::ERR_CONNECTION_REFUSED"

**原因**: Railway 后端未运行

**解决**:
1. 检查 Railway 服务状态
2. 查看部署日志
3. 如果失败，手动触发重新部署

### 场景 3: 登录请求发到错误的 URL

**原因**: `VITE_API_BASE_URL` 配置错误

**检查**:
```bash
# 在浏览器 Console 中运行
console.log(import.meta.env.VITE_API_BASE_URL)

# 应该输出 Railway URL，而不是 localhost
```

---

## 临时解决方案：使用本地后端

如果生产环境暂时无法使用，可以在本地启动后端：

### 步骤 1: 启动本地后端

```bash
cd "/Users/monica/Documents/ai practise/记事本 9.17/backend"
python3 main.py
```

### 步骤 2: 使用本地前端

```bash
cd "/Users/monica/Documents/ai practise/记事本 9.17/frontend"
npm run dev
```

### 步骤 3: 访问本地环境

```
http://localhost:5173
```

---

## 验证环境变量的脚本

创建一个简单的测试页面来验证配置：

```javascript
// 在浏览器 Console 中运行
console.log('环境信息:');
console.log('- API Base URL:', import.meta.env.VITE_API_BASE_URL);
console.log('- 当前域名:', window.location.origin);

// 测试后端连接
fetch(import.meta.env.VITE_API_BASE_URL + '/health')
  .then(res => res.json())
  .then(data => console.log('✅ 后端连接成功:', data))
  .catch(err => console.error('❌ 后端连接失败:', err));
```

---

## 完整检查清单

### Vercel 前端
- [ ] `VITE_API_BASE_URL` 环境变量已配置
- [ ] 环境变量值是 Railway URL（不是 localhost）
- [ ] 已触发重新部署
- [ ] 部署状态为 "Ready"
- [ ] 浏览器缓存已清除

### Railway 后端
- [ ] 服务状态为 "Active"
- [ ] 环境变量已正确配置（DATABASE_TYPE, SUPABASE_URL 等）
- [ ] `/health` 端点返回正常
- [ ] CORS 配置包含 Vercel 域名

### Supabase 数据库
- [ ] `google_api_key` 列已添加
- [ ] 数据库连接正常
- [ ] 用户数据存在

---

## 获取详细日志

### Vercel 函数日志
```
Vercel Dashboard → Functions → 选择函数 → 查看日志
```

### Railway 实时日志
```
Railway Dashboard → 选择服务 → Logs → 实时查看
```

### 浏览器网络日志
```
F12 → Network → 勾选 "Preserve log" → 重现错误
```

---

## 需要帮助？

如果以上方法都无法解决问题，请提供以下信息：

1. **Vercel 部署日志**（最近一次部署的完整日志）
2. **Railway 后端日志**（最近 50 行）
3. **浏览器 Console 错误**（完整的错误堆栈）
4. **环境变量配置**（隐藏敏感信息）

---

**最后更新**: 2025-10-22
**适用版本**: v1.1.0+
