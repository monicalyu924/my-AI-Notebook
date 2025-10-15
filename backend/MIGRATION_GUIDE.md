# SQLite到Supabase迁移完整指南

本指南将帮助您将AI记事本从SQLite数据库迁移到Supabase云数据库,实现生产环境部署。

---

## 📋 迁移前准备清单

- [x] Supabase项目已创建并运行
- [x] `.env`文件包含正确的Supabase凭证
- [ ] 已备份SQLite数据库(`notebook.db`)
- [ ] 网络连接稳定
- [ ] Python环境正常

---

## 🚀 迁移步骤

### 第1步: 验证Supabase连接

```bash
cd backend
python3 test_supabase_connection.py
```

**预期输出**:
```
✅ Supabase连接测试通过!
```

如果连接失败:
1. 检查Supabase项目是否已暂停(访问 https://supabase.com)
2. 点击"Resume"恢复项目
3. 等待30秒后重新测试

---

### 第2步: 在Supabase创建数据库表结构

#### 方法1: 通过Supabase Dashboard (推荐)

1. 访问您的Supabase项目: https://supabase.com/dashboard
2. 选择您的项目: `lvwjycoderrjetuzqrdy`
3. 点击左侧菜单 **SQL Editor**
4. 点击 **New query**
5. 复制 `backend/supabase_schema.sql` 的全部内容
6. 粘贴到SQL编辑器
7. 点击 **Run** 或按 `Ctrl+Enter` 执行

**执行时间**: 约10-20秒

**预期结果**:
```
✅ Success. No rows returned
```

查看通知消息:
```
✅ 数据库表结构创建完成!
已创建的表: users, notes, chat_sessions, ...
```

#### 方法2: 通过命令行 (备选)

```bash
cd backend

# 使用psql连接
PGPASSWORD='your-postgres-password' psql \
  -h db.lvwjycoderrjetuzqrdy.supabase.co \
  -U postgres \
  -d postgres \
  -f supabase_schema.sql
```

---

### 第3步: 备份SQLite数据

```bash
cd backend

# 备份数据库
cp notebook.db notebook.db.backup.$(date +%Y%m%d_%H%M%S)

# 验证备份
ls -lh notebook.db*
```

---

### 第4步: 执行数据迁移

```bash
cd backend
python3 migrate_sqlite_to_supabase.py
```

**迁移过程**:
1. 验证SQLite和Supabase连接
2. 提示确认(输入 `yes`)
3. 开始迁移:
   - 用户数据
   - 笔记数据
   - 聊天会话和消息
   - 项目看板
   - 用户角色

**预期输出**:
```
============================================================
  SQLite → Supabase 数据迁移
============================================================

✅ 成功连接到SQLite数据库: notebook.db
✅ 成功连接到Supabase

⚠️  警告: 此操作将把SQLite数据迁移到Supabase
确认开始迁移? (yes/no): yes

🚀 开始迁移...

📊 迁移用户数据...
   找到 3 个用户
   ✅ 迁移用户: user1@example.com
   ✅ 迁移用户: user2@example.com
   ✅ 迁移用户: user3@example.com
   成功迁移 3/3 个用户

📝 迁移笔记数据...
   找到 45 条笔记
   已迁移 10 条笔记...
   已迁移 20 条笔记...
   ...
   成功迁移 45/45 条笔记

💬 迁移聊天会话...
   成功迁移 X/X 个聊天会话

📋 迁移项目看板...
   成功迁移 X/X 个项目看板

👥 迁移用户角色关联...
   成功迁移 X/X 条用户角色关联

============================================================
  ✅ 迁移完成!
============================================================

⏱️  总耗时: 5.32秒
👥 迁移用户: 3 个
```

**如果出现错误**:
- 检查错误消息
- 确认Supabase表结构已创建
- 检查网络连接
- 可以重新运行迁移脚本(会跳过已存在的数据)

---

### 第5步: 验证迁移结果

#### 在Supabase Dashboard验证

1. 访问Supabase Dashboard
2. 点击 **Table Editor**
3. 依次检查各个表:
   - `users`: 用户数量正确
   - `notes`: 笔记数量正确
   - `roles`: 6个默认角色
   - `permissions`: 权限列表完整

#### 通过SQL查询验证

在SQL Editor中执行:

```sql
-- 查看用户数量
SELECT COUNT(*) as user_count FROM users;

-- 查看笔记数量
SELECT COUNT(*) as note_count FROM notes;

-- 查看每个用户的笔记数量
SELECT
    u.email,
    COUNT(n.id) as note_count
FROM users u
LEFT JOIN notes n ON u.id = n.user_id
GROUP BY u.id, u.email;

-- 查看角色和权限
SELECT
    r.name as role,
    COUNT(rp.permission_id) as permission_count
FROM roles r
LEFT JOIN role_permissions rp ON r.id = rp.role_id
GROUP BY r.id, r.name
ORDER BY r.level DESC;
```

---

## 🔄 切换应用到Supabase

现在已完成数据迁移。为了保持灵活性,我们将创建一个支持双数据库的配置系统,可以通过环境变量切换。

**这部分我会在下一步为您创建配置系统!**

---

## ⚠️ 常见问题

### 问题1: 迁移脚本报错 "relation does not exist"

**原因**: Supabase表结构未创建

**解决**:
1. 确认在Supabase SQL Editor中执行了 `supabase_schema.sql`
2. 检查执行结果是否有错误
3. 重新执行第2步

### 问题2: 迁移过程中网络中断

**解决**:
1. 重新运行迁移脚本
2. 脚本会自动跳过已迁移的数据
3. 只迁移新增数据

### 问题3: 用户邮箱冲突

**原因**: Supabase中已存在相同邮箱的用户

**解决**:
- 脚本会自动跳过重复用户
- 检查 `user_id_mapping` 确保关联正确

### 问题4: Supabase连接超时

**原因**:
- 项目已暂停
- 网络问题
- API密钥错误

**解决**:
1. 访问 https://supabase.com/dashboard
2. 检查项目状态
3. 点击"Resume"恢复项目(如果已暂停)
4. 验证API密钥是否正确

---

## 📊 迁移统计参考

| 表名 | 预计迁移时间 | 说明 |
|------|-------------|------|
| users | < 1秒 | 用户数据量小 |
| notes | 1-5秒 | 取决于笔记数量 |
| chat_sessions | < 1秒 | 会话数据量小 |
| chat_messages | 1-3秒 | 消息可能较多 |
| boards | < 1秒 | 看板数据量小 |
| user_roles | < 1秒 | 关联数据量小 |

**总计**: 通常5-10秒完成全部迁移

---

## 🔐 安全建议

1. **备份SQLite数据库**
   ```bash
   cp notebook.db notebook.db.backup
   ```

2. **不要删除SQLite数据库**
   - 保留作为备份
   - 验证Supabase数据完整后再考虑删除

3. **保护Supabase凭证**
   - 不要提交`.env`文件到Git
   - 使用环境变量管理敏感信息

4. **启用RLS(Row Level Security)**
   - 已在 `supabase_schema.sql` 中配置
   - 确保用户只能访问自己的数据

---

## 📝 下一步

完成迁移后:

1. ✅ 创建双数据库支持配置系统
2. ✅ 更新应用使用Supabase
3. ✅ 本地测试Supabase集成
4. ✅ 配置Vercel前端部署
5. ✅ 配置Railway/Render后端部署

**继续查看下一部分配置...**

---

## 🆘 需要帮助?

如果遇到问题:
1. 检查错误消息
2. 查看Supabase日志
3. 重新运行测试脚本
4. 参考本文档的常见问题部分

---

**文档版本**: 1.0.0
**最后更新**: 2025-10-14
**作者**: Claude Code Assistant
