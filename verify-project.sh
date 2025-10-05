#!/bin/bash
# 项目结构验证脚本

echo "🔍 开始验证项目结构..."
echo ""

# 定义项目根目录
PROJECT_ROOT="/Users/monica/Documents/ai practise/记事本 9.17"
cd "$PROJECT_ROOT" || exit 1

# 颜色输出
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 验证计数器
PASS=0
FAIL=0

check_exists() {
    local path=$1
    local desc=$2
    if [ -e "$path" ]; then
        echo -e "${GREEN}✓${NC} $desc 存在: $path"
        ((PASS++))
    else
        echo -e "${RED}✗${NC} $desc 缺失: $path"
        ((FAIL++))
    fi
}

check_dir() {
    local path=$1
    local desc=$2
    if [ -d "$path" ]; then
        echo -e "${GREEN}✓${NC} $desc 目录存在: $path"
        ((PASS++))
    else
        echo -e "${RED}✗${NC} $desc 目录缺失: $path"
        ((FAIL++))
    fi
}

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📂 检查主要目录"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
check_dir "backend" "后端"
check_dir "frontend" "前端"
check_dir "frontend/src" "前端源码"
check_dir "frontend/src/components" "前端组件"
check_dir "database" "数据库"
check_dir "monitoring" "监控"
check_dir "docs" "文档"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔧 检查后端关键文件"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
check_exists "backend/main.py" "主应用"
check_exists "backend/auth.py" "认证模块"
check_exists "backend/models.py" "数据模型"
check_exists "backend/database_sqlite.py" "SQLite数据库"
check_exists "backend/requirements.txt" "Python依赖"
check_exists "backend/notebook.db" "SQLite数据库文件"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📡 检查后端路由"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
check_dir "backend/routers" "路由目录"
check_exists "backend/routers/auth_router.py" "认证路由"
check_exists "backend/routers/notes_router.py" "笔记路由"
check_exists "backend/routers/ai_router.py" "AI路由"
check_exists "backend/routers/user_router.py" "用户路由"
check_exists "backend/routers/chat_router.py" "聊天路由"
check_exists "backend/routers/projects_router.py" "项目路由"
check_exists "backend/routers/todos_router.py" "待办路由"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "⚛️  检查前端关键文件"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
check_exists "frontend/package.json" "NPM配置"
check_exists "frontend/vite.config.js" "Vite配置"
check_exists "frontend/src/App.jsx" "主应用组件"
check_exists "frontend/src/main.jsx" "入口文件"
check_exists "frontend/index.html" "HTML模板"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎨 检查前端组件目录"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
check_dir "frontend/src/components/auth" "认证组件"
check_dir "frontend/src/components/editor" "编辑器组件"
check_dir "frontend/src/components/layout" "布局组件"
check_dir "frontend/src/components/dashboard" "仪表盘组件"
check_dir "frontend/src/components/project" "项目组件"
check_dir "frontend/src/components/chat" "聊天组件"
check_dir "frontend/src/components/board" "看板组件"
check_dir "frontend/src/components/ui" "UI组件"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎯 检查重要组件文件"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
check_exists "frontend/src/components/MainAppPage.jsx" "主应用页面"
check_exists "frontend/src/components/WelcomePage.jsx" "欢迎页面"
check_exists "frontend/src/components/SettingsPage.jsx" "设置页面"
check_exists "frontend/src/components/dashboard/ProductivityDashboard.jsx" "生产力仪表盘"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📦 检查部署配置"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
check_exists "docker-compose.yml" "Docker Compose"
check_exists "backend/Dockerfile" "后端Dockerfile"
check_exists "frontend/Dockerfile" "前端Dockerfile"
check_exists "README.md" "项目README"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 验证结果汇总"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}通过: $PASS${NC}"
echo -e "${RED}失败: $FAIL${NC}"

TOTAL=$((PASS + FAIL))
PERCENTAGE=$((PASS * 100 / TOTAL))

echo ""
echo -e "完整性: ${YELLOW}$PERCENTAGE%${NC} ($PASS/$TOTAL)"

if [ $FAIL -eq 0 ]; then
    echo ""
    echo -e "${GREEN}🎉 项目结构完全正常！${NC}"
    exit 0
else
    echo ""
    echo -e "${YELLOW}⚠️  存在 $FAIL 个问题需要注意${NC}"
    exit 1
fi
