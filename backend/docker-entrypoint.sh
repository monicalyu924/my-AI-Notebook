#!/bin/bash
set -e

# 后端Docker启动脚本

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# 等待数据库连接
wait_for_database() {
    echo_info "等待数据库连接..."
    
    if [ -n "$DATABASE_URL" ]; then
        # 解析数据库URL
        DB_HOST=$(echo $DATABASE_URL | sed -n 's/.*@\([^:]*\):.*/\1/p')
        DB_PORT=$(echo $DATABASE_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
        
        if [ -n "$DB_HOST" ] && [ -n "$DB_PORT" ]; then
            echo_info "检查数据库连接: $DB_HOST:$DB_PORT"
            
            for i in {1..30}; do
                if nc -z "$DB_HOST" "$DB_PORT"; then
                    echo_info "数据库连接成功"
                    break
                fi
                echo_debug "等待数据库连接... ($i/30)"
                sleep 2
            done
            
            if ! nc -z "$DB_HOST" "$DB_PORT"; then
                echo_error "数据库连接超时"
                exit 1
            fi
        else
            echo_warn "无法解析数据库URL，跳过连接检查"
        fi
    else
        echo_warn "未设置DATABASE_URL，跳过数据库连接检查"
    fi
}

# 等待Redis连接
wait_for_redis() {
    echo_info "等待Redis连接..."
    
    if [ -n "$REDIS_URL" ]; then
        REDIS_HOST=$(echo $REDIS_URL | sed -n 's/redis:\/\/\([^:]*\):.*/\1/p')
        REDIS_PORT=$(echo $REDIS_URL | sed -n 's/redis:\/\/[^:]*:\([0-9]*\).*/\1/p')
        
        if [ -n "$REDIS_HOST" ] && [ -n "$REDIS_PORT" ]; then
            echo_info "检查Redis连接: $REDIS_HOST:$REDIS_PORT"
            
            for i in {1..15}; do
                if nc -z "$REDIS_HOST" "$REDIS_PORT"; then
                    echo_info "Redis连接成功"
                    break
                fi
                echo_debug "等待Redis连接... ($i/15)"
                sleep 1
            done
            
            if ! nc -z "$REDIS_HOST" "$REDIS_PORT"; then
                echo_warn "Redis连接失败，但继续启动"
            fi
        fi
    else
        echo_info "未设置REDIS_URL，跳过Redis连接检查"
    fi
}

# 运行数据库迁移
run_migrations() {
    echo_info "运行数据库迁移..."
    
    if [ -f "migrations.py" ]; then
        python migrations.py
        echo_info "数据库迁移完成"
    elif [ -f "alembic.ini" ]; then
        alembic upgrade head
        echo_info "Alembic迁移完成"
    else
        echo_warn "未找到迁移脚本，跳过数据库迁移"
    fi
}

# 初始化数据库
init_database() {
    echo_info "初始化数据库..."
    
    if [ -f "database_sqlite.py" ]; then
        python -c "from database_sqlite import init_database; init_database()"
        echo_info "SQLite数据库初始化完成"
    elif [ -f "database.py" ]; then
        python -c "from database import init_database; init_database()"
        echo_info "数据库初始化完成"
    else
        echo_warn "未找到数据库初始化脚本"
    fi
}

# 检查环境变量
check_environment() {
    echo_info "检查环境变量..."
    
    required_vars=("SECRET_KEY" "JWT_SECRET_KEY")
    missing_vars=()
    
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            missing_vars+=("$var")
        fi
    done
    
    if [ ${#missing_vars[@]} -gt 0 ]; then
        echo_error "缺少必需的环境变量: ${missing_vars[*]}"
        exit 1
    fi
    
    echo_info "环境变量检查通过"
}

# 设置文件权限
setup_permissions() {
    echo_info "设置文件权限..."
    
    # 确保日志目录可写
    mkdir -p /app/logs && chmod 755 /app/logs
    
    # 确保上传目录可写
    mkdir -p /app/uploads && chmod 755 /app/uploads
    
    # 确保备份目录可写
    mkdir -p /app/backups && chmod 755 /app/backups
    
    echo_info "文件权限设置完成"
}

# 预热应用
warmup_application() {
    echo_info "预热应用..."
    
    # 导入主要模块以提前加载
    python -c "
import main
from database_sqlite import init_database
from config_production import get_settings
print('应用模块预加载完成')
" 2>/dev/null || echo_warn "应用预热失败，但继续启动"
    
    echo_info "应用预热完成"
}

# 显示启动信息
show_startup_info() {
    echo_info "================================="
    echo_info "AI智能记事本 后端API服务"
    echo_info "版本: ${APP_VERSION:-2.0.0}"
    echo_info "环境: ${APP_ENV:-production}"
    echo_info "端口: ${PORT:-8000}"
    echo_info "工作进程: ${WORKERS:-4}"
    echo_info "================================="
}

# 健康检查
health_check() {
    echo_info "执行启动前健康检查..."
    
    # 检查Python模块
    python -c "import fastapi, uvicorn, sqlalchemy" || {
        echo_error "关键Python模块缺失"
        exit 1
    }
    
    # 检查主应用文件
    if [ ! -f "main.py" ]; then
        echo_error "main.py文件不存在"
        exit 1
    fi
    
    echo_info "健康检查通过"
}

# 启动前准备
prepare_startup() {
    echo_info "执行启动前准备..."
    
    # 设置Python路径
    export PYTHONPATH="/app:$PYTHONPATH"
    
    # 设置默认环境变量
    export APP_ENV=${APP_ENV:-production}
    export PORT=${PORT:-8000}
    export WORKERS=${WORKERS:-4}
    
    echo_info "启动准备完成"
}

# 信号处理
setup_signal_handlers() {
    echo_info "设置信号处理器..."
    
    # 优雅关闭处理
    trap 'echo_info "收到SIGTERM信号，开始优雅关闭..."; exit 0' TERM
    trap 'echo_info "收到SIGINT信号，开始优雅关闭..."; exit 0' INT
    
    echo_info "信号处理器设置完成"
}

# 主函数
main() {
    show_startup_info
    setup_signal_handlers
    check_environment
    setup_permissions
    health_check
    prepare_startup
    
    # 仅在生产环境执行的步骤
    if [ "$APP_ENV" = "production" ]; then
        wait_for_database
        wait_for_redis
        init_database
        run_migrations
        warmup_application
    fi
    
    echo_info "后端服务启动准备完成"
    echo_info "启动应用服务器..."
    
    # 执行传入的命令
    exec "$@"
}

# 如果是bash脚本直接运行，执行主函数
if [ "${BASH_SOURCE[0]}" = "${0}" ]; then
    main "$@"
fi