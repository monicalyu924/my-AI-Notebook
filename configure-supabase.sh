#!/bin/bash

echo "🗄️ Supabase数据库配置助手"
echo "================================"
echo ""

# 检查是否存在.env文件
if [ ! -f "backend/.env" ]; then
    echo "创建后端环境变量文件..."
    cp backend/env_example.txt backend/.env
fi

echo "📝 请按照以下步骤配置Supabase："
echo ""
echo "1. 访问 https://supabase.com 并创建新项目"
echo "2. 项目创建完成后，进入项目仪表板"
echo "3. 点击左侧 Settings > API"
echo "4. 复制以下信息："
echo ""
echo "   📍 Project URL (类似: https://xxxxx.supabase.co)"
echo "   🔑 anon public key"
echo "   🔐 service_role key (点击眼睛图标显示)"
echo ""
echo "5. 在SQL编辑器中执行数据库脚本："
echo "   - 点击左侧 SQL Editor"
echo "   - 复制并执行 backend/supabase_setup.sql 中的内容"
echo ""

# 交互式配置
read -p "请输入您的Supabase Project URL: " SUPABASE_URL
read -p "请输入您的 anon public key: " SUPABASE_ANON_KEY
read -p "请输入您的 service_role key: " SUPABASE_SERVICE_ROLE_KEY

# 生成随机SECRET_KEY
SECRET_KEY=$(openssl rand -base64 32 2>/dev/null || python3 -c "import secrets; print(secrets.token_urlsafe(32))")

# 更新.env文件
cat > backend/.env << EOF
SUPABASE_URL=$SUPABASE_URL
SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY
SECRET_KEY=$SECRET_KEY
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
EOF

echo ""
echo "✅ 环境变量配置完成！"
echo ""
echo "📋 下一步："
echo "1. 确保您已在Supabase SQL编辑器中执行了数据库脚本"
echo "2. 重启后端服务："
echo "   cd backend && source venv/bin/activate && python main.py"
echo ""
echo "🚀 配置完成后，您就可以注册账号了！"
