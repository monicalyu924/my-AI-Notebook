# 文件夹功能数据库更新指南

## 🗂️ 添加文件夹功能

您的笔记应用现在支持文件夹功能！在使用前需要更新数据库结构。

## 📋 更新步骤

### 1. 登录 Supabase
1. 打开 [Supabase Dashboard](https://app.supabase.com)
2. 选择您的项目

### 2. 执行 SQL 更新
1. 点击左侧菜单中的 **"SQL Editor"**
2. 点击 **"New query"**
3. 复制以下 SQL 代码并粘贴到编辑器中：

```sql
-- 创建文件夹表
CREATE TABLE IF NOT EXISTS folders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    parent_id UUID REFERENCES folders(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(name, parent_id, user_id)  -- 同一层级下文件夹名称不能重复
);

-- 为文件夹表添加更新时间触发器
CREATE TRIGGER update_folders_updated_at 
    BEFORE UPDATE ON folders 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 为notes表添加folder_id字段
ALTER TABLE notes ADD COLUMN IF NOT EXISTS folder_id UUID REFERENCES folders(id) ON DELETE SET NULL;

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_folders_user_id ON folders(user_id);
CREATE INDEX IF NOT EXISTS idx_folders_parent_id ON folders(parent_id);
CREATE INDEX IF NOT EXISTS idx_notes_folder_id ON notes(folder_id);
```

4. 点击 **"Run"** 按钮执行 SQL
5. 确认所有命令成功执行（应该看到绿色的成功消息）

### 3. 重启服务
完成数据库更新后：
1. 重启后端服务
2. 刷新前端页面

## ✅ 验证更新
更新成功后，您应该能看到：
- 侧边栏中出现文件夹树
- "所有笔记"和"未分类"选项
- 可以创建、重命名、删除文件夹
- 在文件夹中创建和查看笔记

## 🚀 新功能
- **📁 文件夹管理**: 创建、编辑、删除文件夹
- **🌳 层级结构**: 支持多层嵌套文件夹  
- **🗂️ 笔记分类**: 将笔记整理到文件夹中
- **🔍 筛选查看**: 按文件夹查看笔记

## ❓ 遇到问题？
如果遇到任何问题，请检查：
1. SQL 是否全部成功执行
2. 后端服务是否重启
3. 浏览器控制台是否有错误信息
