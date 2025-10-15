# 本地开发指南

> 在您的电脑上开发和扩展AI记事本应用

## 🎯 什么是"本地开发"？

**简单理解**: 在您的Mac电脑上运行完整的应用，就像用户使用真实产品一样，但您可以随时修改代码并立即看到效果。

### 当前架构

```
您的Mac
├─ 后端服务器 (localhost:8000)
│  └─ 连接到 → Supabase云数据库 (真实数据)
│
└─ 前端应用 (localhost:5173)
   └─ 调用 → 本地后端API
```

**关键点**:
- ✅ 代码在本地运行
- ✅ 数据在云端Supabase
- ✅ 修改代码后刷新即可看到效果
- ✅ 无需部署到服务器

---

## 🚀 您可以开发什么？

### 1. 功能增强类

#### 📝 笔记相关功能
| 功能 | 难度 | 预计时间 | 文件位置 |
|------|------|---------|---------|
| 笔记置顶 | ⭐ | 30分钟 | frontend/components/notes/, backend/routers/notes_router.py |
| 笔记分享链接 | ⭐⭐ | 1小时 | 前后端配合 |
| 笔记版本历史 | ⭐⭐⭐ | 2小时 | 需要数据库表 |
| 笔记模板 | ⭐⭐ | 1小时 | frontend/components/notes/ |
| 批量操作 | ⭐⭐ | 1小时 | frontend/components/notes/ |

#### 🔍 搜索增强
| 功能 | 难度 | 预计时间 |
|------|------|---------|
| 高级筛选 | ⭐ | 30分钟 |
| 搜索历史 | ⭐ | 30分钟 |
| 保存搜索条件 | ⭐⭐ | 1小时 |
| 全文搜索优化 | ⭐⭐⭐ | 2小时 |

#### 🎨 UI/UX优化
| 功能 | 难度 | 预计时间 |
|------|------|---------|
| 暗色模式 | ⭐⭐ | 1小时 |
| 自定义主题颜色 | ⭐⭐ | 1小时 |
| 布局调整 | ⭐ | 30分钟 |
| 响应式优化 | ⭐⭐ | 1小时 |

#### 🤖 AI功能
| 功能 | 难度 | 预计时间 |
|------|------|---------|
| 笔记摘要生成 | ⭐⭐ | 1小时 |
| 智能推荐相关笔记 | ⭐⭐⭐ | 2小时 |
| AI续写 | ⭐⭐ | 1小时 |
| 语法检查 | ⭐⭐⭐ | 2小时 |

---

### 2. 性能优化类

| 优化项 | 影响 | 难度 | 预计时间 |
|--------|------|------|---------|
| 虚拟滚动 | 大列表性能 | ⭐⭐ | 1小时 |
| 图片懒加载 | 加载速度 | ⭐ | 30分钟 |
| API响应缓存 | 减少请求 | ⭐⭐ | 1小时 |
| 代码分割 | 首屏速度 | ⭐⭐⭐ | 2小时 |

---

## 📚 刚刚完成的示例：字数统计

### 我为您添加了一个完整的功能示例

**新功能**: 实时字数统计
**位置**: 编辑器下方
**功能**: 显示总字数、字符数、中英文统计、预计阅读时间

#### 查看效果

1. **打开浏览器**: http://localhost:5173
2. **登录账号**: supabase_test@example.com / test123456
3. **打开任意笔记**
4. **看到字数统计**: 在编辑器下方会显示实时统计

#### 代码说明

**新增文件**:
- `frontend/src/components/editor/WordCounter.jsx` (新组件)

**修改文件**:
- `frontend/src/components/editor/Editor.jsx` (集成组件)

**核心代码**:
```javascript
// WordCounter.jsx - 智能字数统计
- 支持中英文混合统计
- 实时更新(随着输入自动变化)
- 显示预计阅读时间
- 漂亮的UI设计
```

---

## 🛠️ 开发工作流

### 典型的开发流程

```
1. 💡 想法
   ↓
2. 📝 计划实现
   ↓
3. 💻 编写代码
   ↓
4. 🔄 刷新浏览器
   ↓
5. ✅ 测试功能
   ↓
6. 🐛 发现问题 → 回到步骤3
   ↓
7. 🎉 功能完成
```

### 实际操作步骤

#### 添加前端功能
```bash
# 1. 创建新组件
cd frontend/src/components
mkdir my-feature
touch my-feature/MyFeature.jsx

# 2. 编写组件代码
code my-feature/MyFeature.jsx

# 3. 在父组件中引入
# 编辑对应的页面文件，添加 import 和使用

# 4. 保存文件
# Vite会自动热更新，无需手动刷新
```

#### 添加后端API
```bash
# 1. 创建或修改路由
cd backend/routers
code my_router.py

# 2. 添加API端点
@router.get("/my-endpoint")
async def my_function():
    return {"data": "..."}

# 3. 在main.py中注册路由
# app.include_router(my_router.router)

# 4. 重启后端服务
# Ctrl+C 停止，然后 python main.py 重启
```

---

## 🎓 学习路径

### 初学者 (刚接触项目)

**第1周: 熟悉代码结构**
- [ ] 浏览项目目录结构
- [ ] 理解前后端分离架构
- [ ] 查看几个核心组件的代码
- [ ] 尝试修改简单的文本或样式

**第2周: 小功能修改**
- [ ] 修改UI颜色或布局
- [ ] 添加一个新按钮
- [ ] 修改现有功能的文案
- [ ] 调整组件间距或大小

**第3周: 新功能开发**
- [ ] 添加一个不需要后端的纯前端功能
- [ ] 例如：笔记排序方式、筛选器、快捷键

### 进阶开发者 (有React/Python经验)

**立即可做的任务**
- [ ] 添加笔记置顶功能
- [ ] 实现笔记导出(PDF/Markdown)
- [ ] 添加笔记统计图表
- [ ] 实现标签管理页面
- [ ] 添加搜索历史

---

## 💡 推荐的第一个任务

### 任务: 添加"笔记置顶"功能

**目标**: 让用户可以将重要笔记置顶显示

#### 前端部分 (30分钟)

**步骤1: 添加置顶按钮**
```jsx
// frontend/src/components/notes/NoteListItem.jsx

import { Pin } from 'lucide-react';

const NoteListItem = ({ note, onClick }) => {
  const handlePin = async (e) => {
    e.stopPropagation();
    // TODO: 调用API
    await api.post(`/notes/${note.id}/pin`);
  };

  return (
    <div className="note-item">
      {/* 现有代码... */}

      <button onClick={handlePin}>
        <Pin className={note.is_pinned ? 'text-blue-600' : 'text-gray-400'} />
      </button>
    </div>
  );
};
```

#### 后端部分 (30分钟)

**步骤1: 添加数据库字段**
```sql
-- 在Supabase Dashboard执行
ALTER TABLE notes ADD COLUMN is_pinned BOOLEAN DEFAULT FALSE;
ALTER TABLE notes ADD COLUMN pinned_at TIMESTAMPTZ;
```

**步骤2: 添加API端点**
```python
# backend/routers/notes_router.py

@router.post("/notes/{note_id}/pin")
async def pin_note(
    note_id: str,
    current_user: User = Depends(get_current_user)
):
    """置顶/取消置顶笔记"""
    note = database.get_note_by_id(note_id)

    if note['user_id'] != current_user.id:
        raise HTTPException(403, "无权限")

    # 切换置顶状态
    database.update_note(note_id,
        is_pinned=not note.get('is_pinned', False),
        pinned_at='now()' if not note.get('is_pinned') else None
    )

    return {"success": True}
```

**步骤3: 修改查询排序**
```python
# backend/database_supabase.py

def get_notes_by_user(user_id: str):
    result = supabase.table('notes')\
        .select('*')\
        .eq('user_id', user_id)\
        .order('is_pinned', desc=True)\ # 置顶的在前
        .order('updated_at', desc=True)\
        .execute()
    return result.data
```

**完成!** 刷新浏览器即可测试置顶功能。

---

## 🔧 常用开发命令

### 启动服务
```bash
# 后端
cd backend
python3 main.py

# 前端
cd frontend
npm run dev
```

### 查看日志
```bash
# 后端日志
tail -f /tmp/backend_startup.log

# 前端日志(在浏览器控制台查看)
# Chrome: F12 → Console
```

### 数据库操作
```bash
# 连接测试
cd backend
python3 test_supabase_connection.py

# 查看数据
python3 -c "
import database
notes = database.get_notes_by_user('user-id')
print(f'笔记数: {len(notes)}')
"
```

### 重启服务
```bash
# 重启后端
lsof -ti:8000 | xargs kill -9
cd backend && python3 main.py &

# 前端通常不需要重启(Vite热更新)
```

---

## 📊 开发环境状态监控

### 快速检查
```bash
# 检查服务状态
lsof -i:8000  # 后端
lsof -i:5173  # 前端

# 检查数据库
cd backend
python3 -c "import database; print(database.check_database_health())"
```

### 性能分析
```bash
# 前端构建分析
cd frontend
npm run build
# 查看 dist/ 文件大小

# 后端性能
# 访问 http://localhost:8000/docs
# 使用API测试工具测试响应时间
```

---

## 🐛 常见问题

### Q1: 修改代码后没有效果？

**前端**:
- Vite会自动热更新
- 如果没更新，试试刷新浏览器(Cmd+R)
- 清除缓存: Cmd+Shift+R

**后端**:
- 需要手动重启服务
- Ctrl+C 停止，然后重新运行 `python3 main.py`

### Q2: 如何调试代码？

**前端调试**:
```javascript
// 添加console.log
console.log('当前笔记:', note);

// 使用Chrome DevTools
// F12 → Sources → 打断点
```

**后端调试**:
```python
# 添加print语句
print(f"用户ID: {user.id}")

# 或使用Python调试器
import pdb; pdb.set_trace()
```

### Q3: 如何测试新功能？

1. **单元测试**: 在浏览器控制台测试
2. **手动测试**: 实际操作新功能
3. **Supabase验证**: 在Dashboard查看数据变化

---

## 📚 学习资源

### 前端技术栈
- React 19: https://react.dev/
- Vite 7: https://vitejs.dev/
- Tailwind CSS: https://tailwindcss.com/
- Lucide Icons: https://lucide.dev/

### 后端技术栈
- FastAPI: https://fastapi.tiangolo.com/
- Supabase: https://supabase.com/docs
- PostgreSQL: https://www.postgresql.org/docs/

---

## 🎉 实战示例

### 您可以立即尝试的5个任务

#### 1. 修改应用标题 (5分钟)
```html
<!-- frontend/index.html -->
<title>我的AI记事本</title>
```

#### 2. 更改主题色 (10分钟)
```jsx
// 搜索项目中的 bg-blue-600 替换为 bg-purple-600
// 实现紫色主题
```

#### 3. 添加欢迎消息 (15分钟)
```jsx
// frontend/src/pages/MainAppPage.jsx
// 在顶部添加欢迎横幅
<div className="bg-green-100 p-4 text-center">
  欢迎使用AI记事本! 当前使用Supabase数据库
</div>
```

#### 4. 字数统计已完成 ✅
- 已经为您添加好了
- 位置: 编辑器下方
- 实时显示字数、字符数、阅读时间

#### 5. 添加笔记导出按钮 (30分钟)
```jsx
// 在编辑器工具栏添加导出按钮
// 导出为Markdown格式
```

---

## 🚀 下一步

### 选择您的路径

**A. 继续学习**
→ 浏览代码，理解现有功能
→ 尝试上面的5个小任务
→ 查看 [CLAUDE.md](CLAUDE.md) 了解代码规范

**B. 开发新功能**
→ 从推荐任务列表中选一个
→ 参考示例代码实现
→ 测试并优化

**C. 准备部署**
→ 阅读 [DEPLOYMENT_SUPABASE.md](DEPLOYMENT_SUPABASE.md)
→ 选择部署方案
→ 15分钟上线到生产环境

---

**🎊 本地开发的核心价值**: 快速迭代、即时反馈、无限可能！

**立即体验字数统计功能**:
1. 打开 http://localhost:5173
2. 登录并打开任意笔记
3. 开始输入，看字数实时变化！
