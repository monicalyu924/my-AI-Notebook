#!/bin/bash

# Vercel 环境变量检查脚本
# 用于验证生产环境配置是否正确

echo "🔍 检查 Vercel 生产环境配置..."
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 生产环境 URL
VERCEL_URL="https://ai-notebook-production.vercel.app"
RAILWAY_URL="https://ai-notebook-backend-production.up.railway.app"

echo "📌 测试目标:"
echo "   前端: $VERCEL_URL"
echo "   后端: $RAILWAY_URL"
echo ""

# 测试 Railway 后端
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1️⃣  测试 Railway 后端"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo -n "   ➜ 健康检查: "
HEALTH_CHECK=$(curl -s -o /dev/null -w "%{http_code}" "$RAILWAY_URL/health" --max-time 10)

if [ "$HEALTH_CHECK" = "200" ]; then
    echo -e "${GREEN}✓ 通过 (HTTP $HEALTH_CHECK)${NC}"
else
    echo -e "${RED}✗ 失败 (HTTP $HEALTH_CHECK)${NC}"
    echo -e "${RED}   后端可能未运行或无法访问${NC}"
    exit 1
fi

echo -n "   ➜ API 端点: "
API_CHECK=$(curl -s "$RAILWAY_URL/api/nano-banana/models" --max-time 10 | grep -o '"id"' | wc -l)

if [ "$API_CHECK" -gt 0 ]; then
    echo -e "${GREEN}✓ 通过 (找到 $API_CHECK 个模型)${NC}"
else
    echo -e "${RED}✗ 失败 (API 响应异常)${NC}"
fi

echo ""

# 测试 Vercel 前端
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2️⃣  测试 Vercel 前端"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo -n "   ➜ 页面加载: "
FRONTEND_CHECK=$(curl -s -o /dev/null -w "%{http_code}" "$VERCEL_URL" --max-time 10)

if [ "$FRONTEND_CHECK" = "200" ]; then
    echo -e "${GREEN}✓ 通过 (HTTP $FRONTEND_CHECK)${NC}"
else
    echo -e "${RED}✗ 失败 (HTTP $FRONTEND_CHECK)${NC}"
fi

echo -n "   ➜ HTML 内容: "
HTML_SIZE=$(curl -s "$VERCEL_URL" --max-time 10 | wc -c)

if [ "$HTML_SIZE" -gt 1000 ]; then
    echo -e "${GREEN}✓ 通过 (${HTML_SIZE} 字节)${NC}"
else
    echo -e "${YELLOW}⚠ 警告 (HTML 体积异常: ${HTML_SIZE} 字节)${NC}"
fi

echo ""

# 检查 CORS
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "3️⃣  测试 CORS 配置"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo -n "   ➜ CORS 头部: "
CORS_CHECK=$(curl -s -H "Origin: $VERCEL_URL" \
  -H "Access-Control-Request-Method: POST" \
  -X OPTIONS "$RAILWAY_URL/api/nano-banana/models" \
  --max-time 10 \
  -I | grep -i "access-control-allow-origin")

if [ ! -z "$CORS_CHECK" ]; then
    echo -e "${GREEN}✓ 通过${NC}"
    echo "      $CORS_CHECK"
else
    echo -e "${RED}✗ 失败 (未找到 CORS 头部)${NC}"
    echo -e "${YELLOW}   可能需要更新后端 CORS 配置${NC}"
fi

echo ""

# 诊断建议
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 诊断建议"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ "$HEALTH_CHECK" != "200" ]; then
    echo -e "${YELLOW}⚠ Railway 后端问题:${NC}"
    echo "   1. 检查 Railway Dashboard 服务状态"
    echo "   2. 查看部署日志是否有错误"
    echo "   3. 验证环境变量配置"
    echo ""
fi

if [ "$FRONTEND_CHECK" != "200" ]; then
    echo -e "${YELLOW}⚠ Vercel 前端问题:${NC}"
    echo "   1. 检查 Vercel Dashboard 部署状态"
    echo "   2. 确认最新部署已完成"
    echo "   3. 验证构建日志无错误"
    echo ""
fi

echo -e "${GREEN}🔧 推荐操作:${NC}"
echo "   1. 在 Vercel Dashboard 配置环境变量:"
echo "      VITE_API_BASE_URL=$RAILWAY_URL"
echo ""
echo "   2. 重新部署 Vercel (触发已完成)"
echo ""
echo "   3. 清除浏览器缓存:"
echo "      - 按 Ctrl+Shift+Delete (Win) 或 Cmd+Shift+Delete (Mac)"
echo "      - 清除 Service Workers (F12 → Application → Service Workers)"
echo ""
echo "   4. 在无痕模式测试: $VERCEL_URL"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✅ 检查完成${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
