#!/bin/bash

# 域名配置脚本
# 配置DNS记录、域名解析验证等

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
DOMAIN_NAME=${1:-"ai-notebook.com"}
SERVER_IP=${2:-$(curl -s ifconfig.me)}
DNS_PROVIDER=${3:-"manual"}

# 检查域名格式
validate_domain() {
    echo_info "验证域名格式: $DOMAIN_NAME"
    
    if [[ ! "$DOMAIN_NAME" =~ ^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$ ]]; then
        echo_error "无效的域名格式: $DOMAIN_NAME"
        exit 1
    fi
    
    echo_info "域名格式验证通过"
}

# 检查DNS解析
check_dns_resolution() {
    echo_info "检查DNS解析..."
    
    local domains=("$DOMAIN_NAME" "www.$DOMAIN_NAME" "api.$DOMAIN_NAME")
    
    for domain in "${domains[@]}"; do
        echo_debug "检查域名: $domain"
        
        # 获取A记录
        resolved_ip=$(dig +short "$domain" A | head -n1)
        
        if [ -z "$resolved_ip" ]; then
            echo_warn "域名 $domain 无法解析"
        elif [ "$resolved_ip" = "$SERVER_IP" ]; then
            echo_info "✓ $domain 解析正确: $resolved_ip"
        else
            echo_warn "✗ $domain 解析到错误IP: $resolved_ip (期望: $SERVER_IP)"
        fi
    done
}

# 生成DNS记录配置
generate_dns_records() {
    echo_info "生成DNS记录配置..."
    
    local dns_file="/tmp/dns-records-$DOMAIN_NAME.txt"
    
    cat > "$dns_file" <<EOF
# DNS记录配置 - $DOMAIN_NAME
# 请将以下记录添加到您的DNS提供商

# A记录 - 主域名
$DOMAIN_NAME.                IN    A       $SERVER_IP

# A记录 - www子域名
www.$DOMAIN_NAME.           IN    A       $SERVER_IP

# A记录 - API子域名
api.$DOMAIN_NAME.           IN    A       $SERVER_IP

# CNAME记录 - 其他子域名（可选）
admin.$DOMAIN_NAME.         IN    CNAME   $DOMAIN_NAME.
staging.$DOMAIN_NAME.       IN    CNAME   $DOMAIN_NAME.
monitoring.$DOMAIN_NAME.    IN    CNAME   $DOMAIN_NAME.

# MX记录 - 邮件服务（可选）
$DOMAIN_NAME.               IN    MX  10  mail.$DOMAIN_NAME.

# TXT记录 - SPF配置（可选）
$DOMAIN_NAME.               IN    TXT     "v=spf1 include:_spf.google.com ~all"

# TXT记录 - DKIM和DMARC（可选）
_dmarc.$DOMAIN_NAME.        IN    TXT     "v=DMARC1; p=quarantine; rua=mailto:dmarc@$DOMAIN_NAME"

# SRV记录 - 服务发现（可选）
_https._tcp.$DOMAIN_NAME.   IN    SRV     0 5 443 $DOMAIN_NAME.

# CAA记录 - 证书授权（推荐）
$DOMAIN_NAME.               IN    CAA     0 issue "letsencrypt.org"
$DOMAIN_NAME.               IN    CAA     0 issuewild "letsencrypt.org"
EOF

    echo_info "DNS记录配置已生成: $dns_file"
    echo_info "请将以下记录添加到您的DNS提供商:"
    echo "=================================="
    cat "$dns_file"
    echo "=================================="
}

# 等待DNS传播
wait_for_dns_propagation() {
    echo_info "等待DNS记录传播..."
    
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        echo_debug "尝试 $attempt/$max_attempts"
        
        resolved_ip=$(dig +short "$DOMAIN_NAME" | head -n1)
        
        if [ "$resolved_ip" = "$SERVER_IP" ]; then
            echo_info "DNS记录传播完成!"
            return 0
        fi
        
        echo_debug "等待DNS传播... (当前解析: $resolved_ip)"
        sleep 30
        ((attempt++))
    done
    
    echo_warn "DNS传播超时，但继续执行..."
    return 1
}

# 配置CloudFlare DNS（如果使用）
setup_cloudflare_dns() {
    echo_info "配置CloudFlare DNS..."
    
    if [ -z "$CLOUDFLARE_API_TOKEN" ] || [ -z "$CLOUDFLARE_ZONE_ID" ]; then
        echo_error "请设置CLOUDFLARE_API_TOKEN和CLOUDFLARE_ZONE_ID环境变量"
        return 1
    fi
    
    local records=(
        "$DOMAIN_NAME:A:$SERVER_IP"
        "www.$DOMAIN_NAME:A:$SERVER_IP"
        "api.$DOMAIN_NAME:A:$SERVER_IP"
    )
    
    for record in "${records[@]}"; do
        IFS=':' read -r name type content <<< "$record"
        
        echo_debug "创建DNS记录: $name -> $content"
        
        curl -X POST "https://api.cloudflare.com/client/v4/zones/$CLOUDFLARE_ZONE_ID/dns_records" \
            -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
            -H "Content-Type: application/json" \
            --data "{\"type\":\"$type\",\"name\":\"$name\",\"content\":\"$content\",\"ttl\":300}" \
            -s > /dev/null
        
        if [ $? -eq 0 ]; then
            echo_info "✓ 创建记录: $name"
        else
            echo_warn "✗ 创建记录失败: $name"
        fi
    done
    
    echo_info "CloudFlare DNS配置完成"
}

# 测试域名连通性
test_domain_connectivity() {
    echo_info "测试域名连通性..."
    
    local domains=("$DOMAIN_NAME" "www.$DOMAIN_NAME" "api.$DOMAIN_NAME")
    
    for domain in "${domains[@]}"; do
        echo_debug "测试域名: $domain"
        
        # 测试HTTP连接
        if curl -s -o /dev/null -w "%{http_code}" "http://$domain" | grep -q "200\|301\|302"; then
            echo_info "✓ HTTP连接正常: $domain"
        else
            echo_warn "✗ HTTP连接失败: $domain"
        fi
        
        # 测试HTTPS连接（如果SSL已配置）
        if curl -s -o /dev/null -w "%{http_code}" "https://$domain" 2>/dev/null | grep -q "200\|301\|302"; then
            echo_info "✓ HTTPS连接正常: $domain"
        else
            echo_debug "HTTPS连接未就绪: $domain"
        fi
    done
}

# 生成hosts文件条目（用于本地测试）
generate_hosts_entries() {
    echo_info "生成本地hosts文件条目..."
    
    local hosts_file="/tmp/hosts-entries-$DOMAIN_NAME.txt"
    
    cat > "$hosts_file" <<EOF
# 本地测试hosts条目 - $DOMAIN_NAME
# 添加到 /etc/hosts 文件进行本地测试

$SERVER_IP    $DOMAIN_NAME
$SERVER_IP    www.$DOMAIN_NAME
$SERVER_IP    api.$DOMAIN_NAME
$SERVER_IP    admin.$DOMAIN_NAME
$SERVER_IP    staging.$DOMAIN_NAME
EOF

    echo_info "Hosts条目已生成: $hosts_file"
    echo_info "本地测试时可将以下内容添加到 /etc/hosts:"
    echo "=================================="
    cat "$hosts_file"
    echo "=================================="
}

# 设置域名重定向规则
setup_domain_redirects() {
    echo_info "设置域名重定向规则..."
    
    local redirect_conf="/opt/ai-notebook/nginx/conf.d/redirects.conf"
    
    mkdir -p "$(dirname "$redirect_conf")"
    
    cat > "$redirect_conf" <<EOF
# 域名重定向配置

# 强制使用主域名（去除www）
server {
    listen 80;
    listen 443 ssl;
    server_name www.$DOMAIN_NAME;
    
    # SSL配置（如果启用HTTPS）
    ssl_certificate /opt/ai-notebook/ssl/cert.pem;
    ssl_certificate_key /opt/ai-notebook/ssl/key.pem;
    
    return 301 https://$DOMAIN_NAME\$request_uri;
}

# 旧域名重定向（如果有）
# server {
#     listen 80;
#     listen 443 ssl;
#     server_name old-domain.com;
#     return 301 https://$DOMAIN_NAME\$request_uri;
# }

# API版本重定向
server {
    listen 80;
    server_name api.$DOMAIN_NAME;
    return 301 https://api.$DOMAIN_NAME\$request_uri;
}
EOF

    echo_info "域名重定向规则已设置: $redirect_conf"
}

# 验证域名配置
verify_domain_setup() {
    echo_info "验证域名配置..."
    
    local all_good=true
    
    # 检查DNS解析
    if ! check_dns_resolution; then
        all_good=false
    fi
    
    # 测试连通性
    test_domain_connectivity
    
    # 检查SSL证书（如果存在）
    if [ -f "/opt/ai-notebook/ssl/cert.pem" ]; then
        local cert_domains=$(openssl x509 -in "/opt/ai-notebook/ssl/cert.pem" -text -noout | grep -A1 "Subject Alternative Name" | tail -1)
        echo_debug "证书包含的域名: $cert_domains"
        
        if echo "$cert_domains" | grep -q "$DOMAIN_NAME"; then
            echo_info "✓ SSL证书包含主域名"
        else
            echo_warn "✗ SSL证书未包含主域名"
            all_good=false
        fi
    fi
    
    if [ "$all_good" = true ]; then
        echo_info "域名配置验证通过!"
    else
        echo_warn "域名配置存在问题，请检查上述警告"
    fi
}

# 主函数
main() {
    echo_info "开始域名配置..."
    echo_info "域名: $DOMAIN_NAME"
    echo_info "服务器IP: $SERVER_IP"
    echo_info "DNS提供商: $DNS_PROVIDER"
    
    validate_domain
    
    case "$DNS_PROVIDER" in
        "cloudflare")
            setup_cloudflare_dns
            wait_for_dns_propagation
            ;;
        "manual")
            generate_dns_records
            echo_info "请手动配置DNS记录，然后按Enter继续..."
            read -r
            ;;
        *)
            echo_warn "不支持的DNS提供商: $DNS_PROVIDER"
            generate_dns_records
            ;;
    esac
    
    setup_domain_redirects
    generate_hosts_entries
    verify_domain_setup
    
    echo_info "域名配置完成!"
    echo_info "请确保DNS记录已正确配置并传播"
}

# 显示帮助信息
show_help() {
    echo "域名配置脚本"
    echo ""
    echo "用法: $0 [域名] [服务器IP] [DNS提供商]"
    echo ""
    echo "参数:"
    echo "  域名        主域名 (默认: ai-notebook.com)"
    echo "  服务器IP    服务器公网IP (默认: 自动获取)"
    echo "  DNS提供商   cloudflare 或 manual (默认: manual)"
    echo ""
    echo "环境变量 (CloudFlare):"
    echo "  CLOUDFLARE_API_TOKEN    CloudFlare API令牌"
    echo "  CLOUDFLARE_ZONE_ID      CloudFlare Zone ID"
    echo ""
    echo "示例:"
    echo "  $0 example.com 1.2.3.4 manual"
    echo "  $0 example.com 1.2.3.4 cloudflare"
    echo ""
}

# 检查参数
if [ "$1" = "-h" ] || [ "$1" = "--help" ]; then
    show_help
    exit 0
fi

# 运行主函数
main "$@"