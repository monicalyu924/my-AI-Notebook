#!/bin/sh
set -e

# 前端Docker启动脚本

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo_info() {
    echo "${GREEN}[INFO]${NC} $1"
}

echo_warn() {
    echo "${YELLOW}[WARN]${NC} $1"
}

echo_error() {
    echo "${RED}[ERROR]${NC} $1"
}

# 检查必要的目录
check_directories() {
    echo_info "检查必要的目录..."
    
    directories=(
        "/usr/share/nginx/html"
        "/var/log/nginx"
        "/var/cache/nginx"
    )
    
    for dir in "${directories[@]}"; do
        if [ ! -d "$dir" ]; then
            echo_error "目录不存在: $dir"
            exit 1
        fi
    done
    
    echo_info "目录检查完成"
}

# 设置环境变量替换
setup_env_substitution() {
    echo_info "设置环境变量替换..."
    
    # 如果存在env.js模板，进行环境变量替换
    if [ -f "/usr/share/nginx/html/env.js.template" ]; then
        envsubst < /usr/share/nginx/html/env.js.template > /usr/share/nginx/html/env.js
        echo_info "环境变量替换完成"
    fi
}

# 验证Nginx配置
validate_nginx_config() {
    echo_info "验证Nginx配置..."
    
    if nginx -t; then
        echo_info "Nginx配置验证通过"
    else
        echo_error "Nginx配置验证失败"
        exit 1
    fi
}

# 设置文件权限
setup_permissions() {
    echo_info "设置文件权限..."
    
    # 确保日志目录可写
    chmod 755 /var/log/nginx
    
    # 确保缓存目录可写
    chmod -R 755 /var/cache/nginx
    
    echo_info "文件权限设置完成"
}

# 健康检查
health_check() {
    echo_info "执行健康检查..."
    
    # 检查重要文件是否存在
    if [ ! -f "/usr/share/nginx/html/index.html" ]; then
        echo_error "index.html文件不存在"
        exit 1
    fi
    
    echo_info "健康检查通过"
}

# 显示启动信息
show_startup_info() {
    echo_info "================================="
    echo_info "AI智能记事本 前端服务"
    echo_info "版本: 2.0.0"
    echo_info "环境: Production"
    echo_info "端口: 80"
    echo_info "================================="
}

# 主函数
main() {
    show_startup_info
    check_directories
    setup_env_substitution
    validate_nginx_config
    setup_permissions
    health_check
    
    echo_info "前端服务启动准备完成"
    echo_info "启动Nginx..."
    
    # 执行传入的命令
    exec "$@"
}

# 执行主函数
main "$@"