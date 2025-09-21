#!/bin/bash

# 监控系统配置脚本
# 部署和配置完整的监控栈

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
MONITORING_DIR="/opt/ai-notebook/monitoring"
PROJECT_ROOT="/opt/ai-notebook"
ENV_FILE="$PROJECT_ROOT/.env"

# 检查环境
check_environment() {
    echo_info "检查监控环境..."
    
    # 检查Docker和Docker Compose
    if ! command -v docker &> /dev/null; then
        echo_error "Docker未安装，请先安装Docker"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        echo_error "Docker Compose未安装，请先安装Docker Compose"
        exit 1
    fi
    
    # 检查系统资源
    local mem_total=$(grep MemTotal /proc/meminfo | awk '{print $2}')
    local mem_gb=$((mem_total / 1024 / 1024))
    
    if [ $mem_gb -lt 4 ]; then
        echo_warn "系统内存少于4GB，监控系统可能运行缓慢"
    fi
    
    # 检查磁盘空间
    local disk_free=$(df / | awk 'NR==2 {print $4}')
    local disk_gb=$((disk_free / 1024 / 1024))
    
    if [ $disk_gb -lt 10 ]; then
        echo_error "磁盘空间不足10GB，无法部署监控系统"
        exit 1
    fi
    
    echo_info "环境检查通过"
}

# 创建监控目录结构
setup_monitoring_directories() {
    echo_info "创建监控目录结构..."
    
    sudo mkdir -p "$MONITORING_DIR"/{prometheus,grafana,alertmanager,elasticsearch,kibana,logstash,loki,promtail}
    sudo mkdir -p "$MONITORING_DIR"/data/{prometheus,grafana,alertmanager,elasticsearch,kibana,loki}
    sudo mkdir -p "$MONITORING_DIR"/logs/{prometheus,grafana,alertmanager,elasticsearch,kibana,logstash,loki}
    
    # 设置权限
    sudo chown -R $USER:$USER "$MONITORING_DIR"
    sudo chmod -R 755 "$MONITORING_DIR"
    
    echo_info "监控目录创建完成"
}

# 配置系统参数
configure_system() {
    echo_info "配置系统参数..."
    
    # 增加内存映射限制（Elasticsearch需要）
    echo 'vm.max_map_count=262144' | sudo tee -a /etc/sysctl.conf
    sudo sysctl -p
    
    # 增加文件描述符限制
    cat << 'EOF' | sudo tee -a /etc/security/limits.conf
# 监控系统文件描述符限制
*               soft    nofile          65536
*               hard    nofile          65536
EOF
    
    # 配置日志轮转
    cat << 'EOF' | sudo tee /etc/logrotate.d/ai-notebook-monitoring
/opt/ai-notebook/monitoring/logs/*/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 root root
    postrotate
        docker-compose -f /opt/ai-notebook/monitoring/docker-compose.monitoring.yml restart filebeat || true
    endscript
}
EOF
    
    echo_info "系统参数配置完成"
}

# 生成监控配置
generate_monitoring_config() {
    echo_info "生成监控配置文件..."
    
    # 检查环境变量文件
    if [ ! -f "$ENV_FILE" ]; then
        echo_warn "环境变量文件不存在，创建默认配置"
        cp "$PROJECT_ROOT/.env.example" "$ENV_FILE"
    fi
    
    # 源配置环境变量
    source "$ENV_FILE"
    
    # 生成Grafana配置
    cat << EOF > "$MONITORING_DIR/grafana/grafana.ini"
[security]
admin_user = admin
admin_password = ${GRAFANA_PASSWORD:-admin123}

[smtp]
enabled = true
host = ${SMTP_HOST:-localhost:587}
user = ${SMTP_USERNAME:-}
password = ${SMTP_PASSWORD:-}
from_address = monitoring@ai-notebook.com
from_name = AI智能记事本监控

[dashboards]
default_home_dashboard_path = /etc/grafana/provisioning/dashboards/home.json

[auth]
disable_login_form = false
disable_signout_menu = false

[auth.anonymous]
enabled = false

[users]
allow_sign_up = false
allow_org_create = false
auto_assign_org = true
auto_assign_org_role = Viewer

[alerting]
enabled = true
execute_alerts = true
EOF
    
    echo_info "监控配置生成完成"
}

# 启动监控服务
start_monitoring_services() {
    echo_info "启动监控服务..."
    
    cd "$MONITORING_DIR"
    
    # 复制监控配置文件
    if [ -d "$PROJECT_ROOT/monitoring" ]; then
        cp -r "$PROJECT_ROOT/monitoring"/* "$MONITORING_DIR/"
    fi
    
    # 启动监控栈
    docker-compose -f docker-compose.monitoring.yml up -d
    
    # 等待服务启动
    echo_info "等待服务启动..."
    sleep 60
    
    # 检查服务状态
    check_monitoring_health
    
    echo_info "监控服务启动完成"
}

# 检查监控服务健康状态
check_monitoring_health() {
    echo_info "检查监控服务健康状态..."
    
    local services=(
        "prometheus:9090"
        "grafana:3000"
        "alertmanager:9093"
        "elasticsearch:9200"
        "kibana:5601"
    )
    
    for service in "${services[@]}"; do
        local name=${service%:*}
        local port=${service#*:}
        
        echo_debug "检查 $name 服务..."
        
        local retries=0
        local max_retries=30
        
        while [ $retries -lt $max_retries ]; do
            if curl -s -f "http://localhost:$port" > /dev/null 2>&1; then
                echo_info "✓ $name 服务运行正常"
                break
            fi
            
            sleep 5
            ((retries++))
        done
        
        if [ $retries -eq $max_retries ]; then
            echo_warn "✗ $name 服务可能未正常启动"
        fi
    done
}

# 配置默认仪表板
setup_default_dashboards() {
    echo_info "配置默认仪表板..."
    
    # 等待Grafana完全启动
    sleep 30
    
    # 配置默认数据源（如果需要）
    local grafana_url="http://admin:${GRAFANA_PASSWORD:-admin123}@localhost:3000"
    
    # 检查数据源是否已配置
    if ! curl -s "$grafana_url/api/datasources" | grep -q "Prometheus"; then
        echo_debug "配置Prometheus数据源..."
        curl -X POST "$grafana_url/api/datasources" \
            -H "Content-Type: application/json" \
            -d '{
                "name": "Prometheus",
                "type": "prometheus",
                "url": "http://prometheus:9090",
                "access": "proxy",
                "isDefault": true
            }' || echo_warn "数据源配置可能失败"
    fi
    
    echo_info "默认仪表板配置完成"
}

# 配置告警规则
setup_alerting() {
    echo_info "配置告警规则..."
    
    # 重新加载Prometheus配置
    curl -X POST "http://localhost:9090/-/reload" || echo_warn "Prometheus配置重载失败"
    
    # 检查告警规则
    local rules_status=$(curl -s "http://localhost:9090/api/v1/rules" | grep -o '"state":"[^"]*"' | head -5)
    echo_debug "告警规则状态: $rules_status"
    
    echo_info "告警规则配置完成"
}

# 生成监控使用指南
generate_usage_guide() {
    echo_info "生成监控使用指南..."
    
    local guide_file="$MONITORING_DIR/MONITORING_GUIDE.md"
    
    cat << EOF > "$guide_file"
# AI智能记事本监控系统使用指南

## 服务访问地址

- **Grafana仪表板**: http://localhost:3000
  - 用户名: admin
  - 密码: ${GRAFANA_PASSWORD:-admin123}

- **Prometheus指标**: http://localhost:9090
- **AlertManager告警**: http://localhost:9093
- **Elasticsearch**: http://localhost:9200
- **Kibana日志**: http://localhost:5601

## 主要功能

### 1. 系统监控
- CPU、内存、磁盘使用率
- 网络流量统计
- 系统负载监控

### 2. 应用监控
- 应用响应时间
- 错误率统计
- 请求量监控
- 数据库性能

### 3. 日志管理
- 应用日志聚合
- 错误日志分析
- 访问日志统计

### 4. 告警通知
- 邮件告警
- Slack通知（如果配置）
- 多级别告警

## 常用操作

### 查看服务状态
\`\`\`bash
docker-compose -f docker-compose.monitoring.yml ps
\`\`\`

### 重启监控服务
\`\`\`bash
docker-compose -f docker-compose.monitoring.yml restart
\`\`\`

### 查看日志
\`\`\`bash
docker-compose -f docker-compose.monitoring.yml logs -f [service_name]
\`\`\`

### 备份监控数据
\`\`\`bash
./scripts/backup-monitoring.sh
\`\`\`

## 故障排除

### 常见问题
1. Elasticsearch启动失败 - 检查vm.max_map_count设置
2. Grafana无法访问 - 检查端口占用和防火墙
3. 告警不发送 - 检查SMTP配置和AlertManager配置

### 日志查看
- Prometheus: \`docker logs ai-notebook-prometheus\`
- Grafana: \`docker logs ai-notebook-grafana\`
- Elasticsearch: \`docker logs ai-notebook-elasticsearch\`

## 维护建议

1. 定期清理旧日志和指标数据
2. 监控磁盘空间使用情况
3. 定期备份重要监控配置
4. 保持监控组件版本更新

EOF
    
    echo_info "监控使用指南已生成: $guide_file"
}

# 主函数
main() {
    echo_info "开始部署监控系统..."
    
    check_environment
    setup_monitoring_directories
    configure_system
    generate_monitoring_config
    start_monitoring_services
    setup_default_dashboards
    setup_alerting
    generate_usage_guide
    
    echo_info "监控系统部署完成!"
    echo_info "Grafana访问地址: http://localhost:3000"
    echo_info "默认用户名: admin, 密码: ${GRAFANA_PASSWORD:-admin123}"
    echo_info "详细使用指南: $MONITORING_DIR/MONITORING_GUIDE.md"
}

# 显示帮助信息
show_help() {
    echo "监控系统部署脚本"
    echo ""
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  -h, --help    显示帮助信息"
    echo "  --stop        停止监控服务"
    echo "  --restart     重启监控服务"
    echo "  --status      查看服务状态"
    echo ""
}

# 检查参数
case "$1" in
    -h|--help)
        show_help
        exit 0
        ;;
    --stop)
        echo_info "停止监控服务..."
        cd "$MONITORING_DIR"
        docker-compose -f docker-compose.monitoring.yml down
        exit 0
        ;;
    --restart)
        echo_info "重启监控服务..."
        cd "$MONITORING_DIR"
        docker-compose -f docker-compose.monitoring.yml restart
        exit 0
        ;;
    --status)
        echo_info "查看服务状态..."
        cd "$MONITORING_DIR"
        docker-compose -f docker-compose.monitoring.yml ps
        exit 0
        ;;
    "")
        main "$@"
        ;;
    *)
        echo_error "未知选项: $1"
        show_help
        exit 1
        ;;
esac