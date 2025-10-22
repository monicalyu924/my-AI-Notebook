-- ========================================
-- AI记事本 - Supabase数据库表结构
-- 基于SQLite结构迁移到PostgreSQL
-- ========================================

-- 启用UUID扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================================
-- 1. 用户表
-- ========================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'user' NOT NULL,
    openrouter_api_key TEXT,
    google_api_key TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 用户表索引
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- ========================================
-- 2. 笔记表
-- ========================================
CREATE TABLE IF NOT EXISTS notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    content TEXT,
    tags JSONB DEFAULT '[]'::jsonb,  -- PostgreSQL使用JSONB存储JSON
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 笔记表索引
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_created_at ON notes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notes_updated_at ON notes(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_notes_tags ON notes USING GIN(tags);  -- JSONB索引

-- 笔记全文搜索索引
CREATE INDEX IF NOT EXISTS idx_notes_title_search ON notes USING GIN(to_tsvector('english', title));
CREATE INDEX IF NOT EXISTS idx_notes_content_search ON notes USING GIN(to_tsvector('english', content));

-- ========================================
-- 3. 聊天会话表
-- ========================================
CREATE TABLE IF NOT EXISTS chat_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    model VARCHAR(100) NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON chat_sessions(user_id);

-- ========================================
-- 4. 聊天消息表
-- ========================================
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id);

-- ========================================
-- 5. 项目看板表
-- ========================================
CREATE TABLE IF NOT EXISTS boards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    color VARCHAR(20) DEFAULT '#3b82f6',
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_boards_user_id ON boards(user_id);

-- ========================================
-- 6. 看板列表表
-- ========================================
CREATE TABLE IF NOT EXISTS lists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    position INTEGER DEFAULT 0,
    board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lists_board_id ON lists(board_id);

-- ========================================
-- 7. 任务卡片表
-- ========================================
CREATE TABLE IF NOT EXISTS cards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    due_date TIMESTAMPTZ,
    assignee VARCHAR(255),
    tags JSONB DEFAULT '[]'::jsonb,
    position INTEGER DEFAULT 0,
    list_id UUID NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
    completed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cards_list_id ON cards(list_id);
CREATE INDEX IF NOT EXISTS idx_cards_completed ON cards(completed);

-- ========================================
-- 8. 卡片评论表
-- ========================================
CREATE TABLE IF NOT EXISTS card_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    card_id UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_card_comments_card_id ON card_comments(card_id);

-- ========================================
-- RBAC权限系统表
-- ========================================

-- 9. 角色表
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    level INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_roles_name ON roles(name);
CREATE INDEX IF NOT EXISTS idx_roles_level ON roles(level DESC);

-- 10. 权限表
CREATE TABLE IF NOT EXISTS permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    resource VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_permissions_name ON permissions(name);
CREATE INDEX IF NOT EXISTS idx_permissions_resource ON permissions(resource);

-- 11. 角色-权限关联表
CREATE TABLE IF NOT EXISTS role_permissions (
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (role_id, permission_id)
);

-- 12. 用户-角色关联表
CREATE TABLE IF NOT EXISTS user_roles (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    assigned_by UUID REFERENCES users(id),
    expires_at TIMESTAMPTZ,
    PRIMARY KEY (user_id, role_id)
);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_expires_at ON user_roles(expires_at) WHERE expires_at IS NOT NULL;

-- 13. 用户自定义权限表
CREATE TABLE IF NOT EXISTS user_permissions (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    granted_by UUID REFERENCES users(id),
    expires_at TIMESTAMPTZ,
    PRIMARY KEY (user_id, permission_id)
);

CREATE INDEX IF NOT EXISTS idx_user_permissions_user_id ON user_permissions(user_id);

-- ========================================
-- 触发器：自动更新updated_at字段
-- ========================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为需要的表创建触发器
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notes_updated_at BEFORE UPDATE ON notes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chat_sessions_updated_at BEFORE UPDATE ON chat_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_boards_updated_at BEFORE UPDATE ON boards
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lists_updated_at BEFORE UPDATE ON lists
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cards_updated_at BEFORE UPDATE ON cards
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_roles_updated_at BEFORE UPDATE ON roles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- 初始化默认角色
-- ========================================
INSERT INTO roles (name, display_name, description, level) VALUES
    ('super_admin', '超级管理员', '拥有系统所有权限', 100),
    ('admin', '管理员', '管理用户和系统配置', 80),
    ('editor', '编辑', '创建和编辑所有内容', 60),
    ('collaborator', '协作者', '查看和评论共享内容', 40),
    ('user', '普通用户', '管理自己的笔记和待办', 20),
    ('guest', '访客', '只读权限', 10)
ON CONFLICT (name) DO NOTHING;

-- ========================================
-- 初始化默认权限
-- ========================================
INSERT INTO permissions (name, display_name, resource, action, description) VALUES
    -- 笔记权限
    ('notes.create', '创建笔记', 'notes', 'create', '创建新笔记'),
    ('notes.read', '查看笔记', 'notes', 'read', '查看笔记内容'),
    ('notes.update', '编辑笔记', 'notes', 'update', '编辑笔记内容'),
    ('notes.delete', '删除笔记', 'notes', 'delete', '删除笔记'),
    ('notes.share', '分享笔记', 'notes', 'share', '分享笔记给其他用户'),
    -- 待办权限
    ('todos.create', '创建待办', 'todos', 'create', '创建新待办事项'),
    ('todos.read', '查看待办', 'todos', 'read', '查看待办事项'),
    ('todos.update', '编辑待办', 'todos', 'update', '编辑待办事项'),
    ('todos.delete', '删除待办', 'todos', 'delete', '删除待办事项'),
    -- 项目权限
    ('projects.create', '创建项目', 'projects', 'create', '创建新项目'),
    ('projects.read', '查看项目', 'projects', 'read', '查看项目内容'),
    ('projects.update', '编辑项目', 'projects', 'update', '编辑项目内容'),
    ('projects.delete', '删除项目', 'projects', 'delete', '删除项目'),
    -- 用户管理权限
    ('users.create', '创建用户', 'users', 'create', '创建新用户账号'),
    ('users.read', '查看用户', 'users', 'read', '查看用户信息'),
    ('users.update', '编辑用户', 'users', 'update', '编辑用户信息'),
    ('users.delete', '删除用户', 'users', 'delete', '删除用户账号'),
    -- 角色权限管理
    ('roles.manage', '管理角色', 'roles', 'manage', '管理系统角色和权限'),
    -- 系统配置权限
    ('system.config', '系统配置', 'system', 'config', '修改系统配置'),
    ('system.stats', '系统统计', 'system', 'stats', '查看系统统计信息')
ON CONFLICT (name) DO NOTHING;

-- ========================================
-- 为角色分配权限
-- ========================================

-- 超级管理员 - 所有权限
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'super_admin'
ON CONFLICT DO NOTHING;

-- 管理员 - 除系统配置外的大部分权限
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'admin'
AND p.name IN (
    'users.create', 'users.read', 'users.update', 'users.delete',
    'notes.read', 'todos.read', 'projects.read', 'system.stats'
)
ON CONFLICT DO NOTHING;

-- 编辑 - 内容创建和编辑权限
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'editor'
AND p.name IN (
    'notes.create', 'notes.read', 'notes.update', 'notes.delete', 'notes.share',
    'todos.create', 'todos.read', 'todos.update', 'todos.delete',
    'projects.create', 'projects.read', 'projects.update', 'projects.delete'
)
ON CONFLICT DO NOTHING;

-- 协作者 - 查看和分享权限
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'collaborator'
AND p.name IN (
    'notes.read', 'notes.share', 'todos.read', 'projects.read'
)
ON CONFLICT DO NOTHING;

-- 普通用户 - 基础CRUD权限
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'user'
AND p.name IN (
    'notes.create', 'notes.read', 'notes.update', 'notes.delete',
    'todos.create', 'todos.read', 'todos.update', 'todos.delete',
    'projects.create', 'projects.read', 'projects.update', 'projects.delete'
)
ON CONFLICT DO NOTHING;

-- 访客 - 只读权限
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'guest'
AND p.name IN (
    'notes.read', 'todos.read', 'projects.read'
)
ON CONFLICT DO NOTHING;

-- ========================================
-- RLS (Row Level Security) 策略
-- ========================================

-- 启用RLS
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_comments ENABLE ROW LEVEL SECURITY;

-- 笔记RLS策略：用户只能访问自己的笔记
CREATE POLICY notes_user_policy ON notes
    FOR ALL
    USING (user_id = auth.uid()::uuid);

-- 聊天会话RLS策略
CREATE POLICY chat_sessions_user_policy ON chat_sessions
    FOR ALL
    USING (user_id = auth.uid()::uuid);

-- 项目看板RLS策略
CREATE POLICY boards_user_policy ON boards
    FOR ALL
    USING (user_id = auth.uid()::uuid);

-- ========================================
-- 全文搜索函数
-- ========================================
CREATE OR REPLACE FUNCTION search_notes(
    search_query TEXT,
    user_uuid UUID
)
RETURNS TABLE (
    id UUID,
    title TEXT,
    content TEXT,
    tags JSONB,
    user_id UUID,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    rank REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        n.id,
        n.title,
        n.content,
        n.tags,
        n.user_id,
        n.created_at,
        n.updated_at,
        ts_rank(
            to_tsvector('english', n.title || ' ' || COALESCE(n.content, '')),
            plainto_tsquery('english', search_query)
        ) as rank
    FROM notes n
    WHERE n.user_id = user_uuid
    AND (
        to_tsvector('english', n.title) @@ plainto_tsquery('english', search_query)
        OR to_tsvector('english', COALESCE(n.content, '')) @@ plainto_tsquery('english', search_query)
    )
    ORDER BY rank DESC;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 完成!
-- ========================================

-- 提示信息
DO $$
BEGIN
    RAISE NOTICE '✅ 数据库表结构创建完成!';
    RAISE NOTICE '';
    RAISE NOTICE '已创建的表:';
    RAISE NOTICE '  - users (用户)';
    RAISE NOTICE '  - notes (笔记)';
    RAISE NOTICE '  - chat_sessions (聊天会话)';
    RAISE NOTICE '  - chat_messages (聊天消息)';
    RAISE NOTICE '  - boards (项目看板)';
    RAISE NOTICE '  - lists (看板列表)';
    RAISE NOTICE '  - cards (任务卡片)';
    RAISE NOTICE '  - card_comments (卡片评论)';
    RAISE NOTICE '  - roles (角色)';
    RAISE NOTICE '  - permissions (权限)';
    RAISE NOTICE '  - role_permissions (角色权限关联)';
    RAISE NOTICE '  - user_roles (用户角色关联)';
    RAISE NOTICE '  - user_permissions (用户自定义权限)';
    RAISE NOTICE '';
    RAISE NOTICE '下一步:';
    RAISE NOTICE '1. 运行数据迁移脚本';
    RAISE NOTICE '2. 配置应用使用Supabase';
END $$;
