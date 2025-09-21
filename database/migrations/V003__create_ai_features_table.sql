-- 迁移版本: 003
-- 迁移名称: 创建AI功能表
-- 创建时间: 2024-01-01T00:00:00
-- 描述: 创建AI智能功能相关的表结构

-- 创建AI模型配置表
CREATE TABLE ai_models (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    display_name VARCHAR(200) NOT NULL,
    provider VARCHAR(50) NOT NULL,
    model_type VARCHAR(50) NOT NULL,
    api_endpoint VARCHAR(500),
    max_tokens INTEGER DEFAULT 4096,
    temperature DECIMAL(3,2) DEFAULT 0.7,
    is_active BOOLEAN DEFAULT TRUE,
    cost_per_token DECIMAL(10,8) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT valid_model_type CHECK (model_type IN ('chat', 'completion', 'embedding', 'image'))
);

-- 创建AI对话表
CREATE TABLE ai_conversations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    note_id INTEGER REFERENCES notes(id) ON DELETE SET NULL,
    title VARCHAR(255),
    model_id INTEGER NOT NULL REFERENCES ai_models(id),
    system_prompt TEXT,
    total_tokens INTEGER DEFAULT 0,
    total_cost DECIMAL(10,4) DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建AI消息表
CREATE TABLE ai_messages (
    id SERIAL PRIMARY KEY,
    conversation_id INTEGER NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL,
    content TEXT NOT NULL,
    content_type VARCHAR(20) DEFAULT 'text',
    token_count INTEGER DEFAULT 0,
    cost DECIMAL(10,6) DEFAULT 0,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT valid_role CHECK (role IN ('system', 'user', 'assistant', 'tool')),
    CONSTRAINT valid_content_type CHECK (content_type IN ('text', 'image', 'file'))
);

-- 创建AI任务表
CREATE TABLE ai_tasks (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    note_id INTEGER REFERENCES notes(id) ON DELETE CASCADE,
    task_type VARCHAR(50) NOT NULL,
    input_data JSONB,
    output_data JSONB,
    model_id INTEGER NOT NULL REFERENCES ai_models(id),
    status VARCHAR(20) DEFAULT 'pending',
    progress INTEGER DEFAULT 0,
    error_message TEXT,
    token_count INTEGER DEFAULT 0,
    cost DECIMAL(10,6) DEFAULT 0,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT valid_task_type CHECK (task_type IN ('summarize', 'translate', 'expand', 'improve', 'analyze', 'generate')),
    CONSTRAINT valid_status CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
    CONSTRAINT valid_progress CHECK (progress BETWEEN 0 AND 100)
);

-- 创建AI使用统计表
CREATE TABLE ai_usage_stats (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    model_id INTEGER NOT NULL REFERENCES ai_models(id),
    date DATE NOT NULL,
    request_count INTEGER DEFAULT 0,
    token_count INTEGER DEFAULT 0,
    total_cost DECIMAL(10,4) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, model_id, date)
);

-- 创建AI知识库表
CREATE TABLE ai_knowledge_base (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    embedding_model VARCHAR(100),
    chunk_size INTEGER DEFAULT 1000,
    chunk_overlap INTEGER DEFAULT 200,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建AI文档块表
CREATE TABLE ai_document_chunks (
    id SERIAL PRIMARY KEY,
    knowledge_base_id INTEGER NOT NULL REFERENCES ai_knowledge_base(id) ON DELETE CASCADE,
    note_id INTEGER REFERENCES notes(id) ON DELETE CASCADE,
    chunk_text TEXT NOT NULL,
    embedding VECTOR(1536),  -- 假设使用OpenAI的embedding维度
    metadata JSONB,
    token_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建AI反馈表
CREATE TABLE ai_feedback (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    conversation_id INTEGER REFERENCES ai_conversations(id) ON DELETE CASCADE,
    message_id INTEGER REFERENCES ai_messages(id) ON DELETE CASCADE,
    task_id INTEGER REFERENCES ai_tasks(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL,
    feedback_text TEXT,
    feedback_type VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT valid_rating CHECK (rating BETWEEN 1 AND 5),
    CONSTRAINT valid_feedback_type CHECK (feedback_type IN ('helpful', 'accurate', 'creative', 'fast', 'other'))
);

-- 创建AI提示词模板表
CREATE TABLE ai_prompt_templates (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    template TEXT NOT NULL,
    category VARCHAR(100),
    variables JSONB,
    is_public BOOLEAN DEFAULT FALSE,
    usage_count INTEGER DEFAULT 0,
    rating DECIMAL(3,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX idx_ai_conversations_user_id ON ai_conversations(user_id);
CREATE INDEX idx_ai_conversations_note_id ON ai_conversations(note_id);
CREATE INDEX idx_ai_conversations_model_id ON ai_conversations(model_id);
CREATE INDEX idx_ai_messages_conversation_id ON ai_messages(conversation_id);
CREATE INDEX idx_ai_messages_role ON ai_messages(role);
CREATE INDEX idx_ai_tasks_user_id ON ai_tasks(user_id);
CREATE INDEX idx_ai_tasks_note_id ON ai_tasks(note_id);
CREATE INDEX idx_ai_tasks_status ON ai_tasks(status);
CREATE INDEX idx_ai_tasks_type ON ai_tasks(task_type);
CREATE INDEX idx_ai_usage_stats_user_date ON ai_usage_stats(user_id, date);
CREATE INDEX idx_ai_usage_stats_model_date ON ai_usage_stats(model_id, date);
CREATE INDEX idx_ai_knowledge_base_user_id ON ai_knowledge_base(user_id);
CREATE INDEX idx_ai_document_chunks_kb_id ON ai_document_chunks(knowledge_base_id);
CREATE INDEX idx_ai_document_chunks_note_id ON ai_document_chunks(note_id);
CREATE INDEX idx_ai_feedback_user_id ON ai_feedback(user_id);
CREATE INDEX idx_ai_prompt_templates_user_id ON ai_prompt_templates(user_id);
CREATE INDEX idx_ai_prompt_templates_category ON ai_prompt_templates(category);
CREATE INDEX idx_ai_prompt_templates_public ON ai_prompt_templates(is_public) WHERE is_public = TRUE;

-- 如果支持向量索引，为embedding列创建索引
-- CREATE INDEX idx_ai_document_chunks_embedding ON ai_document_chunks 
-- USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- 为表添加更新时间触发器
CREATE TRIGGER update_ai_conversations_updated_at
    BEFORE UPDATE ON ai_conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_usage_stats_updated_at
    BEFORE UPDATE ON ai_usage_stats
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_knowledge_base_updated_at
    BEFORE UPDATE ON ai_knowledge_base
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_prompt_templates_updated_at
    BEFORE UPDATE ON ai_prompt_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 创建自动更新AI对话统计的函数
CREATE OR REPLACE FUNCTION update_conversation_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE ai_conversations 
        SET total_tokens = total_tokens + COALESCE(NEW.token_count, 0),
            total_cost = total_cost + COALESCE(NEW.cost, 0)
        WHERE id = NEW.conversation_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE ai_conversations 
        SET total_tokens = GREATEST(0, total_tokens - COALESCE(OLD.token_count, 0)),
            total_cost = GREATEST(0, total_cost - COALESCE(OLD.cost, 0))
        WHERE id = OLD.conversation_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

-- 为AI消息表添加统计更新触发器
CREATE TRIGGER update_conversation_stats_trigger
    AFTER INSERT OR DELETE ON ai_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_conversation_stats();

-- 创建自动更新使用统计的函数
CREATE OR REPLACE FUNCTION update_ai_usage_stats()
RETURNS TRIGGER AS $$
DECLARE
    current_date DATE := CURRENT_DATE;
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO ai_usage_stats (user_id, model_id, date, request_count, token_count, total_cost)
        VALUES (
            (SELECT user_id FROM ai_conversations WHERE id = NEW.conversation_id),
            (SELECT model_id FROM ai_conversations WHERE id = NEW.conversation_id),
            current_date,
            1,
            COALESCE(NEW.token_count, 0),
            COALESCE(NEW.cost, 0)
        )
        ON CONFLICT (user_id, model_id, date)
        DO UPDATE SET 
            request_count = ai_usage_stats.request_count + 1,
            token_count = ai_usage_stats.token_count + COALESCE(NEW.token_count, 0),
            total_cost = ai_usage_stats.total_cost + COALESCE(NEW.cost, 0),
            updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

-- 为AI消息表添加使用统计触发器
CREATE TRIGGER update_ai_usage_stats_trigger
    AFTER INSERT ON ai_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_ai_usage_stats();

-- 插入默认AI模型
INSERT INTO ai_models (name, display_name, provider, model_type, max_tokens, temperature, cost_per_token) VALUES
('gpt-3.5-turbo', 'GPT-3.5 Turbo', 'openai', 'chat', 4096, 0.7, 0.002),
('gpt-4', 'GPT-4', 'openai', 'chat', 8192, 0.7, 0.03),
('text-embedding-ada-002', 'Ada Embedding', 'openai', 'embedding', 8191, 0, 0.0001),
('claude-3-sonnet', 'Claude 3 Sonnet', 'anthropic', 'chat', 200000, 0.7, 0.003);

-- 插入默认提示词模板
INSERT INTO ai_prompt_templates (name, description, template, category, variables, is_public) VALUES
('总结笔记', '为笔记内容生成简洁的总结', '请为以下笔记内容生成一个简洁明了的总结：\n\n{{content}}\n\n总结应该：\n1. 突出主要观点\n2. 保持逻辑清晰\n3. 控制在200字以内', '总结', '{"content": "笔记内容"}', true),
('翻译文本', '将文本翻译为指定语言', '请将以下文本翻译为{{target_language}}：\n\n{{text}}\n\n请保持原文的语气和风格。', '翻译', '{"text": "要翻译的文本", "target_language": "目标语言"}', true),
('扩展大纲', '将简单大纲扩展为详细内容', '请基于以下大纲，扩展为详细的内容：\n\n{{outline}}\n\n要求：\n1. 保持逻辑结构清晰\n2. 每个要点都要详细说明\n3. 语言要通俗易懂', '创作', '{"outline": "大纲内容"}', true);

-- 添加表注释
COMMENT ON TABLE ai_models IS 'AI模型配置表';
COMMENT ON TABLE ai_conversations IS 'AI对话表';
COMMENT ON TABLE ai_messages IS 'AI消息表';
COMMENT ON TABLE ai_tasks IS 'AI任务表';
COMMENT ON TABLE ai_usage_stats IS 'AI使用统计表';
COMMENT ON TABLE ai_knowledge_base IS 'AI知识库表';
COMMENT ON TABLE ai_document_chunks IS 'AI文档块表';
COMMENT ON TABLE ai_feedback IS 'AI反馈表';
COMMENT ON TABLE ai_prompt_templates IS 'AI提示词模板表';

-- 添加列注释
COMMENT ON COLUMN ai_models.model_type IS '模型类型：chat, completion, embedding, image';
COMMENT ON COLUMN ai_messages.role IS '消息角色：system, user, assistant, tool';
COMMENT ON COLUMN ai_tasks.task_type IS '任务类型：summarize, translate, expand, improve, analyze, generate';
COMMENT ON COLUMN ai_document_chunks.embedding IS '文档向量嵌入';