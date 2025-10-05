#!/bin/bash

# 前端性能分析脚本

echo "=========================================="
echo "🎨 前端性能分析工具"
echo "=========================================="
echo ""

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 检查是否在正确的目录
if [ ! -d "frontend" ]; then
    echo -e "${RED}错误: 请在项目根目录运行此脚本${NC}"
    exit 1
fi

cd frontend

echo -e "${BLUE}📦 1. 分析打包大小${NC}"
echo "--------------------------------"

# 构建生产版本
echo "正在构建生产版本..."
npm run build > /dev/null 2>&1

if [ -d "dist" ]; then
    echo -e "${GREEN}✓ 构建完成${NC}"
    echo ""
    echo "📊 打包文件大小:"
    du -sh dist
    echo ""
    echo "详细文件列表:"
    find dist -type f -exec du -h {} \; | sort -rh | head -20
    echo ""
else
    echo -e "${RED}✗ 构建失败${NC}"
fi

echo ""
echo -e "${BLUE}📝 2. 分析依赖包大小${NC}"
echo "--------------------------------"

# 检查是否安装了 source-map-explorer
if ! command -v source-map-explorer &> /dev/null; then
    echo "正在安装 source-map-explorer..."
    npm install -g source-map-explorer > /dev/null 2>&1
fi

echo "依赖包分析 (前10个最大的包):"
if [ -f "package.json" ]; then
    # 使用 du 分析 node_modules
    if [ -d "node_modules" ]; then
        du -sh node_modules/* 2>/dev/null | sort -rh | head -10
    fi
fi

echo ""
echo -e "${BLUE}🔍 3. 代码质量检查${NC}"
echo "--------------------------------"

# JSX/JS 文件统计
echo "组件文件统计:"
jsx_count=$(find src -name "*.jsx" -o -name "*.js" | wc -l)
echo "  JSX/JS文件数: $jsx_count"

# 代码行数统计
total_lines=$(find src -name "*.jsx" -o -name "*.js" -o -name "*.css" | xargs wc -l 2>/dev/null | tail -1 | awk '{print $1}')
echo "  总代码行数: $total_lines"

# 查找大文件
echo ""
echo "最大的10个源文件:"
find src -type f \( -name "*.jsx" -o -name "*.js" \) -exec wc -l {} \; | sort -rn | head -10 | awk '{print "  " $2 ": " $1 " lines"}'

echo ""
echo -e "${BLUE}⚡ 4. 性能建议${NC}"
echo "--------------------------------"

# 检查常见性能问题
echo "检查潜在问题..."

# 检查是否使用了 React.memo
memo_count=$(grep -r "React.memo\|memo(" src --include="*.jsx" --include="*.js" | wc -l)
echo "  使用 React.memo 的组件: $memo_count"

# 检查是否使用了 useMemo/useCallback
usememo_count=$(grep -r "useMemo\|useCallback" src --include="*.jsx" --include="*.js" | wc -l)
echo "  使用 useMemo/useCallback: $usememo_count"

# 检查懒加载
lazy_count=$(grep -r "lazy(" src --include="*.jsx" --include="*.js" | wc -l)
echo "  懒加载组件数: $lazy_count"

# 检查图片优化
img_count=$(find src public -type f \( -name "*.png" -o -name "*.jpg" -o -name "*.jpeg" \) | wc -l)
echo "  图片文件数: $img_count"

echo ""
echo -e "${GREEN}💡 优化建议:${NC}"

if [ $memo_count -lt 5 ]; then
    echo "  • 考虑对常用组件使用 React.memo 优化"
fi

if [ $usememo_count -lt 10 ]; then
    echo "  • 增加 useMemo/useCallback 的使用以优化性能"
fi

if [ $lazy_count -lt 5 ]; then
    echo "  • 考虑对更多路由组件使用懒加载"
fi

# 分析打包配置
if [ -f "vite.config.js" ]; then
    if grep -q "rollupOptions" vite.config.js; then
        echo "  ✓ 已配置代码分割"
    else
        echo "  • 建议配置 Rollup 选项进行代码分割"
    fi
fi

echo ""
echo -e "${BLUE}📈 5. Lighthouse性能测试${NC}"
echo "--------------------------------"
echo "请执行以下步骤进行 Lighthouse 测试:"
echo ""
echo "1. 启动开发服务器:"
echo "   ${YELLOW}npm run dev${NC}"
echo ""
echo "2. 打开 Chrome DevTools (F12)"
echo "3. 切换到 'Lighthouse' 标签"
echo "4. 选择 'Performance' 和 'Best practices'"
echo "5. 点击 'Generate report'"
echo ""
echo "目标指标:"
echo "  • Performance Score: > 90"
echo "  • First Contentful Paint: < 1.5s"
echo "  • Time to Interactive: < 3s"
echo "  • Speed Index: < 2s"

echo ""
echo "=========================================="
echo -e "${GREEN}✅ 前端性能分析完成!${NC}"
echo "=========================================="
