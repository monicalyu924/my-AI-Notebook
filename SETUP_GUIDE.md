# AI记事本 - 快速设置指南

## 🚀 5分钟快速启动

### 步骤1: 克隆和安装
```bash
# 进入项目目录
cd "AI记事本项目目录"

# 给启动脚本添加执行权限
chmod +x start-dev.sh
```

### 步骤2: 配置Supabase数据库

1. 访问 [Supabase](https://supabase.com) 并创建免费账号
2. 创建新项目（选择免费套餐）
3. 等待项目初始化完成
4. 进入项目仪表板 → Settings → API
5. 复制以下信息：
   - Project URL
   - anon public key
   - service_role key (仅用于服务端)

### 步骤3: 设置数据库表

1. 在Supabase仪表板中，点击左侧 "SQL Editor"
2. 复制 `backend/supabase_setup.sql` 文件中的所有SQL代码
3. 粘贴到SQL编辑器中并运行

### 步骤4: 配置后端环境变量

```bash
cd backend
cp env_example.txt .env
```

编辑 `.env` 文件，填入Supabase信息：
```
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SECRET_KEY=your_random_secret_key_here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

### 步骤5: 配置前端环境变量

```bash
cd frontend
cp env_example.txt .env
```

编辑 `.env` 文件：
```
VITE_API_BASE_URL=http://localhost:8000
```

### 步骤6: 一键启动

回到项目根目录，运行启动脚本：
```bash
./start-dev.sh
```

这个脚本会自动：
- 检查依赖
- 创建Python虚拟环境
- 安装所有依赖
- 同时启动前后端服务

### 步骤7: 配置OpenRouter API（可选）

1. 访问 [OpenRouter.ai](https://openrouter.ai) 注册账号
2. 获取API密钥
3. 在应用中注册账号并登录
4. 进入设置页面，输入OpenRouter API密钥

## 🌐 访问应用

- 前端应用: http://localhost:5173
- 后端API: http://localhost:8000
- API文档: http://localhost:8000/docs

## ⚡ 快速功能测试

1. **注册账号**: 在前端页面注册新用户
2. **创建笔记**: 点击"New Note"创建第一篇笔记
3. **测试编辑**: 输入一些文本，体验自动保存
4. **测试AI功能**: 配置API密钥后，选中文字使用AI助手

## 🛠️ 常见问题

### 后端启动失败
- 检查Python环境是否正确安装
- 确认.env文件配置正确
- 查看控制台错误信息

### 前端无法连接后端
- 确认后端服务正在运行在8000端口
- 检查前端.env文件中的API_BASE_URL配置

### AI功能不工作
- 确认已在设置页面配置OpenRouter API密钥
- 检查API密钥是否有效
- 查看浏览器控制台的错误信息

### 数据库连接失败
- 检查Supabase URL和密钥是否正确
- 确认数据库表已正确创建
- 查看Supabase项目仪表板的日志

## 📝 开发提示

- 前端代码修改会自动热重载
- 后端代码修改需要重启服务
- 使用Ctrl+C停止开发服务器
