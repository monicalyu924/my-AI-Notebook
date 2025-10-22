-- ========================================
-- 添加 google_api_key 字段到 users 表
-- ========================================

-- 检查并添加 google_api_key 列
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'google_api_key'
    ) THEN
        ALTER TABLE users ADD COLUMN google_api_key TEXT;
        RAISE NOTICE '✅ 已添加 google_api_key 列到 users 表';
    ELSE
        RAISE NOTICE '⚠️ google_api_key 列已存在';
    END IF;
END $$;

-- 验证字段已添加
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name = 'google_api_key';

