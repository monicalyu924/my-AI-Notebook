#!/bin/bash

# ========================================
# 全栈应用测试脚本
# 测试前端+后端+Supabase完整流程
# ========================================

set -e

echo "========================================="
echo "  🚀 全栈应用完整性测试"
echo "========================================="

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 测试计数器
PASSED=0
FAILED=0

# 测试函数
test_endpoint() {
    local name=$1
    local url=$2
    local method=${3:-GET}
    local data=$4
    local headers=$5

    echo -n "  测试: $name ... "

    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" "$url" $headers)
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" "$url" $headers -H "Content-Type: application/json" -d "$data")
    fi

    status_code=$(echo "$response" | tail -n1)

    if [ "$status_code" -ge 200 ] && [ "$status_code" -lt 300 ]; then
        echo -e "${GREEN}✅ PASS${NC} (HTTP $status_code)"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}❌ FAIL${NC} (HTTP $status_code)"
        ((FAILED++))
        return 1
    fi
}

# ========================================
# 1. 检查服务状态
# ========================================
echo ""
echo "1️⃣  检查服务运行状态..."

if lsof -ti:8000 > /dev/null 2>&1; then
    echo -e "  后端 (8000): ${GREEN}✅ 运行中${NC}"
else
    echo -e "  后端 (8000): ${RED}❌ 未运行${NC}"
    echo "  请先启动后端: cd backend && python3 main.py"
    exit 1
fi

if lsof -ti:5173 > /dev/null 2>&1; then
    echo -e "  前端 (5173): ${GREEN}✅ 运行中${NC}"
else
    echo -e "  前端 (5173): ${YELLOW}⚠️  未运行${NC}"
    echo "  建议启动前端: cd frontend && npm run dev"
fi

# ========================================
# 2. 测试后端API
# ========================================
echo ""
echo "2️⃣  测试后端API..."

# 测试健康检查
test_endpoint "健康检查" "http://localhost:8000/"

# 测试API文档
test_endpoint "API文档" "http://localhost:8000/docs"

# 测试用户注册
TIMESTAMP=$(date +%s)
REGISTER_DATA="{\"email\":\"test_${TIMESTAMP}@example.com\",\"password\":\"test123456\",\"full_name\":\"测试用户\"}"
REGISTER_RESPONSE=$(curl -s -X POST "http://localhost:8000/api/auth/register" \
    -H "Content-Type: application/json" \
    -d "$REGISTER_DATA")

if echo "$REGISTER_RESPONSE" | grep -q "access_token"; then
    echo -e "  测试: 用户注册 ... ${GREEN}✅ PASS${NC}"
    ((PASSED++))

    # 提取Token
    TOKEN=$(echo "$REGISTER_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['access_token'])" 2>/dev/null || echo "")

    if [ -n "$TOKEN" ]; then
        # 测试用户信息
        test_endpoint "获取用户信息" "http://localhost:8000/api/auth/me" "GET" "" "-H 'Authorization: Bearer $TOKEN'"

        # 测试创建笔记
        NOTE_DATA="{\"title\":\"测试笔记\",\"content\":\"这是一条测试笔记\",\"tags\":[\"测试\"]}"
        NOTE_RESPONSE=$(curl -s -X POST "http://localhost:8000/notes/" \
            -H "Authorization: Bearer $TOKEN" \
            -H "Content-Type: application/json" \
            -d "$NOTE_DATA")

        if echo "$NOTE_RESPONSE" | grep -q "id"; then
            echo -e "  测试: 创建笔记 ... ${GREEN}✅ PASS${NC}"
            ((PASSED++))

            # 提取笔记ID
            NOTE_ID=$(echo "$NOTE_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['id'])" 2>/dev/null || echo "")

            if [ -n "$NOTE_ID" ]; then
                # 测试获取笔记
                test_endpoint "获取笔记" "http://localhost:8000/notes/$NOTE_ID" "GET" "" "-H 'Authorization: Bearer $TOKEN'"

                # 测试列出笔记
                test_endpoint "列出笔记" "http://localhost:8000/notes/" "GET" "" "-H 'Authorization: Bearer $TOKEN'"
            fi
        else
            echo -e "  测试: 创建笔记 ... ${RED}❌ FAIL${NC}"
            ((FAILED++))
        fi
    fi
else
    echo -e "  测试: 用户注册 ... ${RED}❌ FAIL${NC}"
    ((FAILED++))
fi

# ========================================
# 3. 测试数据库连接
# ========================================
echo ""
echo "3️⃣  测试数据库连接..."

cd backend
DB_TEST=$(python3 -c "
import database
health = database.check_database_health()
if health['status'] == 'healthy':
    print(f\"✅ 数据库: {health['database']} (用户数: {health.get('user_count', 'N/A')})\")
    exit(0)
else:
    print(f\"❌ 数据库错误: {health.get('error', 'Unknown')}\")
    exit(1)
" 2>&1)

if [ $? -eq 0 ]; then
    echo -e "  ${GREEN}$DB_TEST${NC}"
    ((PASSED++))
else
    echo -e "  ${RED}$DB_TEST${NC}"
    ((FAILED++))
fi

cd ..

# ========================================
# 4. 测试前端访问
# ========================================
echo ""
echo "4️⃣  测试前端访问..."

if lsof -ti:5173 > /dev/null 2>&1; then
    FRONTEND_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:5173/")
    if [ "$FRONTEND_RESPONSE" = "200" ]; then
        echo -e "  前端页面: ${GREEN}✅ 可访问${NC} (http://localhost:5173/)"
        ((PASSED++))
    else
        echo -e "  前端页面: ${RED}❌ 无法访问${NC} (HTTP $FRONTEND_RESPONSE)"
        ((FAILED++))
    fi
else
    echo -e "  前端页面: ${YELLOW}⚠️  未启动${NC}"
fi

# ========================================
# 5. 测试结果汇总
# ========================================
echo ""
echo "========================================="
echo "  📊 测试结果汇总"
echo "========================================="
echo ""
echo -e "  ✅ 通过: ${GREEN}$PASSED${NC}"
echo -e "  ❌ 失败: ${RED}$FAILED${NC}"
echo -e "  📈 成功率: $((PASSED * 100 / (PASSED + FAILED)))%"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 所有测试通过!${NC}"
    echo ""
    echo "访问地址:"
    echo "  - 前端: http://localhost:5173/"
    echo "  - 后端API: http://localhost:8000/docs"
    echo "  - Supabase: https://lvwjycoderrjetuzqrdy.supabase.co"
    echo ""
    echo "测试账号:"
    echo "  - 邮箱: supabase_test@example.com"
    echo "  - 密码: test123456"
    echo ""
    exit 0
else
    echo -e "${RED}❌ 部分测试失败,请检查日志${NC}"
    exit 1
fi
