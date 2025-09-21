-- 迁移版本: 002
-- 迁移名称: 创建笔记表
-- 创建时间: 2024-01-01T00:00:00
-- 描述: 创建笔记管理相关的表结构

-- 创建笔记分类表
CREATE TABLE note_categories (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#007bff',
    icon VARCHAR(50) DEFAULT 'folder',
    parent_id INTEGER REFERENCES note_categories(id) ON DELETE SET NULL,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, name)
);

-- 创建笔记表
CREATE TABLE notes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id INTEGER REFERENCES note_categories(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    content_type VARCHAR(20) DEFAULT 'markdown',
    status VARCHAR(20) DEFAULT 'draft',
    priority INTEGER DEFAULT 0,
    is_favorite BOOLEAN DEFAULT FALSE,
    is_archived BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP,
    word_count INTEGER DEFAULT 0,
    read_time INTEGER DEFAULT 0,
    version INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT valid_status CHECK (status IN ('draft', 'published', 'archived')),
    CONSTRAINT valid_content_type CHECK (content_type IN ('markdown', 'html', 'plain')),
    CONSTRAINT valid_priority CHECK (priority BETWEEN 0 AND 5)
);

-- 创建笔记版本历史表
CREATE TABLE note_versions (
    id SERIAL PRIMARY KEY,
    note_id INTEGER NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    change_summary VARCHAR(500),
    created_by INTEGER NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(note_id, version_number)
);

-- 创建笔记标签表
CREATE TABLE tags (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    color VARCHAR(7) DEFAULT '#6c757d',
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, name)
);

-- 创建笔记标签关联表
CREATE TABLE note_tags (
    id SERIAL PRIMARY KEY,
    note_id INTEGER NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
    tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(note_id, tag_id)
);

-- 创建笔记附件表
CREATE TABLE note_attachments (
    id SERIAL PRIMARY KEY,
    note_id INTEGER NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT NOT NULL,
    file_type VARCHAR(100),
    mime_type VARCHAR(100),
    checksum VARCHAR(64),
    is_embedded BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建笔记分享表
CREATE TABLE note_shares (
    id SERIAL PRIMARY KEY,
    note_id INTEGER NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
    shared_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    shared_with INTEGER REFERENCES users(id) ON DELETE CASCADE,
    share_token VARCHAR(255) UNIQUE,
    permission VARCHAR(20) DEFAULT 'read',
    is_public BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMP,
    access_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT valid_permission CHECK (permission IN ('read', 'write', 'admin'))
);

-- 创建索引
CREATE INDEX idx_note_categories_user_id ON note_categories(user_id);
CREATE INDEX idx_note_categories_parent_id ON note_categories(parent_id);
CREATE INDEX idx_notes_user_id ON notes(user_id);
CREATE INDEX idx_notes_category_id ON notes(category_id);
CREATE INDEX idx_notes_status ON notes(status);
CREATE INDEX idx_notes_created_at ON notes(created_at);
CREATE INDEX idx_notes_updated_at ON notes(updated_at);
CREATE INDEX idx_notes_title ON notes USING gin(to_tsvector('english', title));
CREATE INDEX idx_notes_content ON notes USING gin(to_tsvector('english', content));
CREATE INDEX idx_notes_favorite ON notes(user_id, is_favorite) WHERE is_favorite = TRUE;
CREATE INDEX idx_notes_archived ON notes(user_id, is_archived) WHERE is_archived = TRUE;
CREATE INDEX idx_notes_deleted ON notes(is_deleted, deleted_at) WHERE is_deleted = TRUE;

CREATE INDEX idx_note_versions_note_id ON note_versions(note_id);
CREATE INDEX idx_tags_user_id ON tags(user_id);
CREATE INDEX idx_note_tags_note_id ON note_tags(note_id);
CREATE INDEX idx_note_tags_tag_id ON note_tags(tag_id);
CREATE INDEX idx_note_attachments_note_id ON note_attachments(note_id);
CREATE INDEX idx_note_shares_note_id ON note_shares(note_id);
CREATE INDEX idx_note_shares_token ON note_shares(share_token);

-- 为表添加更新时间触发器
CREATE TRIGGER update_note_categories_updated_at
    BEFORE UPDATE ON note_categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notes_updated_at
    BEFORE UPDATE ON notes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 创建自动更新字数统计的函数
CREATE OR REPLACE FUNCTION update_note_word_count()
RETURNS TRIGGER AS $$
BEGIN
    -- 简单的字数统计（按空格分割）
    NEW.word_count = array_length(string_to_array(trim(NEW.content), ' '), 1);
    -- 估算阅读时间（假设每分钟200字）
    NEW.read_time = GREATEST(1, NEW.word_count / 200);
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为笔记表添加字数统计触发器
CREATE TRIGGER update_note_stats
    BEFORE INSERT OR UPDATE OF content ON notes
    FOR EACH ROW
    EXECUTE FUNCTION update_note_word_count();

-- 创建更新标签使用次数的函数
CREATE OR REPLACE FUNCTION update_tag_usage_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE tags SET usage_count = usage_count + 1 WHERE id = NEW.tag_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE tags SET usage_count = GREATEST(0, usage_count - 1) WHERE id = OLD.tag_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

-- 为笔记标签关联表添加使用次数更新触发器
CREATE TRIGGER update_tag_usage
    AFTER INSERT OR DELETE ON note_tags
    FOR EACH ROW
    EXECUTE FUNCTION update_tag_usage_count();

-- 添加表注释
COMMENT ON TABLE note_categories IS '笔记分类表';
COMMENT ON TABLE notes IS '笔记主表';
COMMENT ON TABLE note_versions IS '笔记版本历史表';
COMMENT ON TABLE tags IS '标签表';
COMMENT ON TABLE note_tags IS '笔记标签关联表';
COMMENT ON TABLE note_attachments IS '笔记附件表';
COMMENT ON TABLE note_shares IS '笔记分享表';

-- 添加列注释
COMMENT ON COLUMN notes.content_type IS '内容类型：markdown, html, plain';
COMMENT ON COLUMN notes.status IS '笔记状态：draft, published, archived';
COMMENT ON COLUMN notes.priority IS '优先级：0-5，数字越大优先级越高';
COMMENT ON COLUMN notes.word_count IS '字数统计';
COMMENT ON COLUMN notes.read_time IS '预估阅读时间（分钟）';