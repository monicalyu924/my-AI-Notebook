# AI Notebook - AI驱动的云端同步记事本

一个基于React和FastAPI的现代化记事本应用，支持AI助手功能。

## 功能特点

- 🔐 **用户认证系统**: 安全的注册和登录
- 📝 **富文本编辑**: 支持Markdown的笔记编辑器
- 🤖 **AI助手**: 集成OpenRouter API，支持文本续写、润色、翻译、摘要等功能
- 🏷️ **标签管理**: 灵活的笔记标签系统
- 🔍 **实时搜索**: 快速查找笔记内容
- 💾 **自动保存**: 实时同步，避免数据丢失
- 🎨 **现代UI**: 受Notion启发的简洁界面设计

## 技术栈

### 前端
- React 18 + Vite
- Tailwind CSS
- React Router
- Axios
- React Markdown
- Lucide React (图标)

### 后端
- Python 3.8+
- FastAPI
- Supabase (PostgreSQL数据库 + 认证)
- OpenRouter API (AI功能)

## 项目结构

```
记事本/
├── backend/                 # 后端API
│   ├── routers/            # API路由
│   ├── models.py           # 数据模型
│   ├── auth.py             # 认证逻辑
│   ├── config.py           # 配置文件
│   ├── database.py         # 数据库连接
│   ├── main.py             # 主应用文件
│   └── requirements.txt    # Python依赖
├── frontend/               # 前端应用
│   ├── src/
│   │   ├── components/     # React组件
│   │   ├── context/        # Context上下文
│   │   ├── utils/          # 工具函数
│   │   └── ...
│   └── package.json        # Node.js依赖
└── README.md
```

## 快速开始

### 1. 环境准备

确保已安装以下软件：
- Python 3.8+
- Node.js 16+
- npm

### 2. 数据库设置

1. 在 [Supabase](https://supabase.com) 创建新项目
2. 在Supabase SQL编辑器中运行 `backend/supabase_setup.sql` 中的SQL命令
3. 获取项目URL和API密钥

### 3. 后端设置

```bash
cd backend

# 创建虚拟环境
python -m venv venv
source venv/bin/activate  # Windows: venv\\Scripts\\activate

# 安装依赖
pip install -r requirements.txt

# 创建环境变量文件
cp env_example.txt .env

# 编辑.env文件，填入以下信息：
# SUPABASE_URL=your_supabase_project_url
# SUPABASE_ANON_KEY=your_supabase_anon_key
# SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
# SECRET_KEY=your_secret_key_for_jwt

# 启动后端服务
python main.py
```

后端服务将在 http://localhost:8000 启动，API文档可在 http://localhost:8000/docs 查看。

### 4. 前端设置

```bash
cd frontend

# 安装依赖
npm install

# 创建环境变量文件
cp env_example.txt .env

# 编辑.env文件：
# VITE_API_BASE_URL=http://localhost:8000

# 启动前端开发服务器
npm run dev
```

前端应用将在 http://localhost:5173 启动。

### 5. OpenRouter API配置

1. 访问 [OpenRouter.ai](https://openrouter.ai) 注册账号
2. 获取API密钥
3. 在应用设置页面中配置API密钥

## 使用指南

### 基本操作

1. **注册/登录**: 首次使用需要注册账号
2. **创建笔记**: 点击侧边栏的"New Note"按钮
3. **编辑笔记**: 在右侧编辑器中输入内容，支持Markdown语法
4. **添加标签**: 在标题下方输入标签，用逗号分隔
5. **搜索笔记**: 在侧边栏搜索框中输入关键词

### AI功能使用

配置OpenRouter API密钥后，可以使用以下AI功能：

- **文本续写**: 选中文本后点击"Continue"
- **内容润色**: 选中文本后点击"Polish"
- **多语言翻译**: 选择目标语言后翻译文本
- **内容摘要**: 为整篇笔记生成摘要
- **智能问答**: 针对笔记内容提问
- **标题生成**: 自动生成合适的标题
- **标签推荐**: 智能推荐相关标签

## 开发计划

### V1.0 已完成功能
- ✅ 用户认证系统
- ✅ 笔记CRUD操作
- ✅ AI助手功能
- ✅ 基础设置页面
- ✅ 响应式界面设计

### V2.0 规划功能
- [ ] 模板化AI指令
- [ ] 关联笔记推荐
- [ ] 多模态支持（图片、音频）
- [ ] 全局命令面板
- [ ] 双向链接
- [ ] 版本历史

## 部署

### 前端部署 (Vercel)

1. 将代码推送到GitHub
2. 在Vercel中连接GitHub仓库
3. 设置构建目录为 `frontend`
4. 配置环境变量
5. 部署

### 后端部署 (Render/Railway)

1. 在Render创建新的Web Service
2. 连接GitHub仓库
3. 设置启动命令: `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. 配置环境变量
5. 部署

## 贡献

欢迎提交Issue和Pull Request！

## 许可证

MIT License
