# Google API Key 字段迁移指南

## 问题描述

用户无法保存 Google API key，因为 Supabase 数据库的 `users` 表缺少 `google_api_key` 字段。

## 解决方案

### 方法 1：在 Supabase SQL Editor 中执行（推荐）

1. 登录 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择你的项目
3. 点击左侧菜单的 **SQL Editor**
4. 点击 **New query**
5. 复制以下 SQL 代码并执行：

```sql
-- 添加 google_api_key 字段到 users 表
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_api_key TEXT;

-- 验证字段已添加
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name = 'google_api_key';
```

6. 点击 **Run** 执行
7. 确认返回结果显示 `google_api_key` 字段

### 方法 2：使用迁移脚本文件

执行项目中的迁移脚本：

```bash
# 在 Supabase SQL Editor 中执行
backend/add_google_api_key_migration.sql
```

## 验证

迁移完成后，验证功能：

1. 访问 [设置页面](https://ai-notebook-production.vercel.app/settings)
2. 在 "Google API Key" 输入框中输入你的 API 密钥
3. 点击 "保存设置"
4. 刷新页面，确认密钥已保存

## 代码更新

以下代码已更新以支持 Google API key：

✅ `backend/models.py` - User 和 UserUpdate 模型包含 `google_api_key`
✅ `backend/routers/user_router.py` - 路由支持保存 Google API key
✅ `backend/routers/nano_banana_router.py` - 图像生成使用用户的 Google API key
✅ `backend/database_sqlite.py` - SQLite 支持 `google_api_key` 字段
✅ `backend/database_supabase.py` - Supabase 模块支持 `google_api_key`
✅ `frontend/src/components/SettingsPage.jsx` - 设置页面包含 Google API key 输入

## 注意事项

- 迁移是**幂等的**（可以多次执行而不会出错）
- 现有用户数据不会受影响
- 新字段为可选字段（TEXT 类型，默认为 NULL）

