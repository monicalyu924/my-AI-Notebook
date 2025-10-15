#!/bin/bash

# Railway CLI 部署脚本
# 用途：从backend目录部署FastAPI应用到Railway

set -e  # 遇到错误立即退出

echo "======================================"
echo "Railway CLI 部署脚本"
echo "======================================"
echo ""

# 颜色定义
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 步骤1: 检查Railway CLI
echo -e "${BLUE}步骤1: 检查Railway CLI...${NC}"
if ! command -v railway &> /dev/null; then
    echo -e "${YELLOW}Railway CLI未安装，正在安装...${NC}"
    npm install -g @railway/cli
else
    echo -e "${GREEN}✓ Railway CLI已安装${NC}"
    railway --version
fi
echo ""

# 步骤2: 登录Railway
echo -e "${BLUE}步骤2: 登录Railway账号${NC}"
echo "这将打开浏览器，请使用GitHub账号登录..."
railway login
echo -e "${GREEN}✓ 登录成功${NC}"
echo ""

# 步骤3: 进入backend目录
echo -e "${BLUE}步骤3: 进入backend目录${NC}"
cd backend
echo -e "${GREEN}✓ 当前目录: $(pwd)${NC}"
echo ""

# 步骤4: 关联Railway项目
echo -e "${BLUE}步骤4: 关联Railway项目${NC}"
echo "请在列表中选择您的项目 (my-AI-Notebook)..."
railway link
echo -e "${GREEN}✓ 项目关联成功${NC}"
echo ""

# 步骤5: 设置环境变量
echo -e "${BLUE}步骤5: 设置环境变量（一次性批量设置）${NC}"
echo "正在设置8个环境变量..."

railway variables \
  --set "DATABASE_TYPE=supabase" \
  --set "SUPABASE_URL=https://lvwjycoderrjetuzqrdy.supabase.co" \
  --set "SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2d2p5Y29kZXJyamV0dXpxcmR5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODcxNDMzMywiZXhwIjoyMDc0MjkwMzMzfQ._DTXVOVQLz1mLN9bryqea-lz0Wp1joLNE4H3W-JzoHk" \
  --set "SECRET_KEY=NuQTCFQCjJeP4eMK5g3Y6SIZpyVOOVkkafs8EJB_U2g" \
  --set "ALGORITHM=HS256" \
  --set "ACCESS_TOKEN_EXPIRE_MINUTES=30" \
  --set "PORT=8000" \
  --set "PYTHONUNBUFFERED=1"

echo -e "${GREEN}✓ 所有环境变量设置完成${NC}"
echo ""

# 步骤6: 部署
echo -e "${BLUE}步骤6: 开始部署${NC}"
echo "这可能需要2-3分钟..."
railway up

echo ""
echo -e "${GREEN}======================================"
echo "✓ 部署完成！"
echo "======================================${NC}"
echo ""

# 步骤7: 获取部署信息
echo -e "${BLUE}步骤7: 获取部署信息${NC}"
railway status

echo ""
echo -e "${YELLOW}重要：请复制上面显示的URL，这是您的后端API地址${NC}"
echo -e "${YELLOW}格式类似：https://xxx.up.railway.app${NC}"
echo ""
echo "下一步：使用这个URL部署前端到Vercel"
echo ""
