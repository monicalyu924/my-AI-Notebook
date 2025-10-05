#!/bin/bash
# 快速导航脚本 - 帮助在正确的目录中工作

PROJECT_ROOT="/Users/monica/Documents/ai practise/记事本 9.17"

# 颜色定义
BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

show_help() {
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}📂 AI记事本项目 - 快速导航${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo "用法: ./quick-nav.sh [命令]"
    echo ""
    echo "可用命令:"
    echo "  root       - 进入项目根目录"
    echo "  backend    - 进入后端目录"
    echo "  frontend   - 进入前端目录"
    echo "  components - 进入前端组件目录"
    echo "  routers    - 进入后端路由目录"
    echo "  verify     - 验证项目结构"
    echo "  status     - 显示项目状态"
    echo "  help       - 显示此帮助信息"
    echo ""
}

show_status() {
    cd "$PROJECT_ROOT" || exit 1

    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}📊 项目状态概览${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""

    echo -e "${YELLOW}📁 项目根目录:${NC}"
    echo "   $PROJECT_ROOT"
    echo ""

    echo -e "${YELLOW}📂 主要目录:${NC}"
    ls -d */ 2>/dev/null | grep -E "^(backend|frontend|database|monitoring|docs)/" | sed 's/^/   /'
    echo ""

    echo -e "${YELLOW}🐍 后端路由:${NC}"
    ls backend/routers/*.py 2>/dev/null | wc -l | xargs echo "   路由文件数:"
    echo ""

    echo -e "${YELLOW}⚛️  前端组件:${NC}"
    ls -d frontend/src/components/*/ 2>/dev/null | wc -l | xargs echo "   组件目录数:"
    echo ""

    echo -e "${YELLOW}📝 Git状态:${NC}"
    git status -s 2>/dev/null | head -5
    CHANGES=$(git status -s 2>/dev/null | wc -l)
    if [ "$CHANGES" -gt 0 ]; then
        echo "   共 $CHANGES 个文件有变更"
    else
        echo "   工作区干净"
    fi
    echo ""

    echo -e "${YELLOW}🔧 最近提交:${NC}"
    git log --oneline -3 2>/dev/null | sed 's/^/   /'
    echo ""
}

case "${1:-help}" in
    root)
        echo -e "${GREEN}📂 进入项目根目录${NC}"
        cd "$PROJECT_ROOT" && pwd
        exec $SHELL
        ;;
    backend)
        echo -e "${GREEN}🐍 进入后端目录${NC}"
        cd "$PROJECT_ROOT/backend" && pwd
        exec $SHELL
        ;;
    frontend)
        echo -e "${GREEN}⚛️  进入前端目录${NC}"
        cd "$PROJECT_ROOT/frontend" && pwd
        exec $SHELL
        ;;
    components)
        echo -e "${GREEN}🎨 进入前端组件目录${NC}"
        cd "$PROJECT_ROOT/frontend/src/components" && pwd
        exec $SHELL
        ;;
    routers)
        echo -e "${GREEN}📡 进入后端路由目录${NC}"
        cd "$PROJECT_ROOT/backend/routers" && pwd
        exec $SHELL
        ;;
    verify)
        echo -e "${GREEN}🔍 验证项目结构${NC}"
        "$PROJECT_ROOT/verify-project.sh"
        ;;
    status)
        show_status
        ;;
    help|*)
        show_help
        ;;
esac
