#!/bin/bash

# 数据库迁移脚本
# 提供简化的数据库迁移操作接口

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

echo_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

echo_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

echo_debug() {
    echo -e "${BLUE}[DEBUG]${NC} $1"
}

# 配置变量
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
MIGRATIONS_DIR="$PROJECT_ROOT/database/migrations"
ENV_FILE="$PROJECT_ROOT/.env"
MIGRATION_MANAGER="$MIGRATIONS_DIR/migration_manager.py"

# 检查环境
check_environment() {
    echo_info "检查迁移环境..."
    
    # 检查Python
    if ! command -v python3 &> /dev/null; then
        echo_error "Python3未安装"
        exit 1
    fi
    
    # 检查环境变量文件
    if [ ! -f "$ENV_FILE" ]; then
        echo_error "环境变量文件不存在: $ENV_FILE"
        echo_info "请复制 .env.example 为 .env 并配置数据库连接"
        exit 1
    fi
    
    # 加载环境变量
    source "$ENV_FILE"
    
    # 检查数据库URL
    if [ -z "$DATABASE_URL" ]; then
        echo_error "DATABASE_URL环境变量未设置"
        exit 1
    fi
    
    # 检查迁移管理器
    if [ ! -f "$MIGRATION_MANAGER" ]; then
        echo_error "迁移管理器不存在: $MIGRATION_MANAGER"
        exit 1
    fi
    
    # 检查Python依赖
    if ! python3 -c "import psycopg2" &> /dev/null; then
        echo_warn "psycopg2未安装，尝试安装..."
        pip3 install psycopg2-binary || {
            echo_error "psycopg2安装失败，请手动安装: pip3 install psycopg2-binary"
            exit 1
        }
    fi
    
    echo_info "环境检查通过"
}

# 测试数据库连接
test_connection() {
    echo_info "测试数据库连接..."
    
    python3 -c "
import psycopg2
import os
try:
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    conn.close()
    print('数据库连接成功')
except Exception as e:
    print(f'数据库连接失败: {e}')
    exit(1)
"
}

# 创建数据库备份
backup_database() {
    echo_info "创建数据库备份..."
    
    local backup_dir="$PROJECT_ROOT/backups/database"
    local backup_file="backup_$(date +%Y%m%d_%H%M%S).sql"
    
    mkdir -p "$backup_dir"
    
    # 解析数据库URL获取连接参数
    python3 -c "
import os
from urllib.parse import urlparse

url = urlparse(os.environ['DATABASE_URL'])
print(f'PGHOST={url.hostname or \"localhost\"}')
print(f'PGPORT={url.port or 5432}')
print(f'PGUSER={url.username}')
print(f'PGPASSWORD={url.password}')
print(f'PGDATABASE={url.path[1:] if url.path else \"postgres\"}')
" > /tmp/db_vars.env
    
    source /tmp/db_vars.env
    rm /tmp/db_vars.env
    
    # 创建备份
    if command -v pg_dump &> /dev/null; then
        PGPASSWORD="$PGPASSWORD" pg_dump \
            -h "$PGHOST" \
            -p "$PGPORT" \
            -U "$PGUSER" \
            -d "$PGDATABASE" \
            --no-password \
            --verbose \
            > "$backup_dir/$backup_file"
        echo_info "数据库备份已创建: $backup_dir/$backup_file"
    else
        echo_warn "pg_dump未找到，跳过备份"
    fi
}

# 运行迁移
run_migrations() {
    local target_version="$1"
    
    echo_info "开始数据库迁移..."
    
    cd "$MIGRATIONS_DIR"
    
    local cmd="python3 migration_manager.py --database-url=\"$DATABASE_URL\" migrate"
    if [ -n "$target_version" ]; then
        cmd="$cmd --target=$target_version"
    fi
    
    eval "$cmd"
    
    if [ $? -eq 0 ]; then
        echo_info "数据库迁移完成"
    else
        echo_error "数据库迁移失败"
        exit 1
    fi
}

# 显示迁移状态
show_status() {
    echo_info "查看迁移状态..."
    
    cd "$MIGRATIONS_DIR"
    python3 migration_manager.py --database-url="$DATABASE_URL" status
}

# 创建新迁移
create_migration() {
    local name="$1"
    
    if [ -z "$name" ]; then
        echo_error "请提供迁移名称"
        echo "用法: $0 create <迁移名称>"
        exit 1
    fi
    
    echo_info "创建新迁移: $name"
    
    cd "$MIGRATIONS_DIR"
    python3 migration_manager.py --database-url="$DATABASE_URL" create "$name"
}

# 验证迁移文件
validate_migrations() {
    echo_info "验证迁移文件..."
    
    local error_count=0
    
    for file in "$MIGRATIONS_DIR"/V*.sql; do
        if [ ! -f "$file" ]; then
            continue
        fi
        
        echo_debug "验证: $(basename "$file")"
        
        # 检查文件名格式
        local filename=$(basename "$file")
        if ! [[ "$filename" =~ ^V[0-9]+__.*\.sql$ ]]; then
            echo_error "无效的迁移文件名格式: $filename"
            ((error_count++))
            continue
        fi
        
        # 检查文件内容
        if [ ! -s "$file" ]; then
            echo_error "迁移文件为空: $filename"
            ((error_count++))
            continue
        fi
        
        # 检查SQL语法（基本检查）
        if grep -q "DROP TABLE\|DROP DATABASE\|TRUNCATE" "$file"; then
            echo_warn "迁移文件包含危险操作: $filename"
        fi
    done
    
    if [ $error_count -eq 0 ]; then
        echo_info "所有迁移文件验证通过"
    else
        echo_error "发现 $error_count 个问题"
        exit 1
    fi
}

# 生成迁移报告
generate_report() {
    echo_info "生成迁移报告..."
    
    local report_file="$PROJECT_ROOT/database/migration_report_$(date +%Y%m%d).md"
    
    cat << EOF > "$report_file"
# 数据库迁移报告

生成时间: $(date)

## 迁移状态

EOF
    
    cd "$MIGRATIONS_DIR"
    python3 migration_manager.py --database-url="$DATABASE_URL" status >> "$report_file"
    
    cat << EOF >> "$report_file"

## 数据库结构

\`\`\`sql
EOF
    
    # 获取数据库结构
    python3 -c "
import psycopg2
import os
try:
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cursor = conn.cursor()
    cursor.execute(\"\"\"
        SELECT table_name, column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'public'
        ORDER BY table_name, ordinal_position
    \"\"\")
    
    current_table = None
    for row in cursor.fetchall():
        table, column, dtype, nullable = row
        if table != current_table:
            if current_table:
                print()
            print(f'-- Table: {table}')
            current_table = table
        print(f'  {column}: {dtype} {"NULL" if nullable == "YES" else "NOT NULL"}')
    
    conn.close()
except Exception as e:
    print(f'-- Error: {e}')
" >> "$report_file"
    
    cat << EOF >> "$report_file"
\`\`\`

## 迁移文件

EOF
    
    for file in "$MIGRATIONS_DIR"/V*.sql; do
        if [ -f "$file" ]; then
            local filename=$(basename "$file")
            local size=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file" 2>/dev/null || echo "unknown")
            echo "- $filename (${size} bytes)" >> "$report_file"
        fi
    done
    
    echo_info "迁移报告已生成: $report_file"
}

# 清理失败的迁移
cleanup_failed() {
    echo_warn "清理失败的迁移记录..."
    
    python3 -c "
import psycopg2
import os

try:
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cursor = conn.cursor()
    
    # 查找失败的迁移
    cursor.execute('SELECT version, name FROM schema_migrations WHERE success = false')
    failed = cursor.fetchall()
    
    if failed:
        print(f'发现 {len(failed)} 个失败的迁移:')
        for version, name in failed:
            print(f'  {version}: {name}')
        
        confirm = input('是否删除这些记录? (y/N): ')
        if confirm.lower() == 'y':
            cursor.execute('DELETE FROM schema_migrations WHERE success = false')
            conn.commit()
            print('失败的迁移记录已删除')
        else:
            print('操作已取消')
    else:
        print('没有发现失败的迁移记录')
    
    conn.close()
except Exception as e:
    print(f'Error: {e}')
"
}

# 主函数
main() {
    case "$1" in
        "migrate"|"up")
            check_environment
            test_connection
            backup_database
            run_migrations "$2"
            ;;
        "status")
            check_environment
            test_connection
            show_status
            ;;
        "create")
            check_environment
            create_migration "$2"
            ;;
        "validate")
            validate_migrations
            ;;
        "report")
            check_environment
            test_connection
            generate_report
            ;;
        "cleanup")
            check_environment
            test_connection
            cleanup_failed
            ;;
        "test")
            check_environment
            test_connection
            echo_info "数据库连接测试通过"
            ;;
        *)
            show_help
            ;;
    esac
}

# 显示帮助信息
show_help() {
    echo "数据库迁移脚本"
    echo ""
    echo "用法: $0 <命令> [参数]"
    echo ""
    echo "命令:"
    echo "  migrate [version]  执行数据库迁移（可指定目标版本）"
    echo "  up [version]       同 migrate"
    echo "  status             显示迁移状态"
    echo "  create <name>      创建新的迁移文件"
    echo "  validate           验证迁移文件"
    echo "  report             生成迁移报告"
    echo "  cleanup            清理失败的迁移记录"
    echo "  test               测试数据库连接"
    echo ""
    echo "示例:"
    echo "  $0 migrate              # 执行所有待应用的迁移"
    echo "  $0 migrate 003          # 迁移到版本003"
    echo "  $0 create add_indexes   # 创建新迁移"
    echo "  $0 status               # 查看状态"
    echo ""
    echo "环境变量:"
    echo "  DATABASE_URL           数据库连接URL"
    echo ""
}

# 运行主函数
main "$@"