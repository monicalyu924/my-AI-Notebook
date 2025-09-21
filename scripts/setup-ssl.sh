#!/bin/bash

# SSL证书配置脚本
# 支持Let's Encrypt自动证书和自签名证书

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
EMAIL=${2:-"admin@ai-notebook.com"}
SSL_DIR="/opt/ai-notebook/ssl"
NGINX_DIR="/opt/ai-notebook/nginx"
CERT_TYPE=${3:-"letsencrypt"}  # letsencrypt 或 self-signed

# 创建SSL目录
setup_ssl_directory() {
    echo_info "创建SSL证书目录..."
    
    sudo mkdir -p "$SSL_DIR"
    sudo mkdir -p "$NGINX_DIR/conf.d"
    sudo chown -R $(whoami):$(whoami) "$SSL_DIR"
    
    echo_info "SSL目录创建完成: $SSL_DIR"
}

# 安装Certbot
install_certbot() {
    echo_info "安装Certbot..."
    
    if command -v certbot &> /dev/null; then
        echo_info "Certbot已经安装"
        return
    fi
    
    # Ubuntu/Debian
    if command -v apt-get &> /dev/null; then
        sudo apt-get update
        sudo apt-get install -y certbot python3-certbot-nginx
    # CentOS/RHEL
    elif command -v yum &> /dev/null; then
        sudo yum install -y epel-release
        sudo yum install -y certbot python3-certbot-nginx
    # Fedora
    elif command -v dnf &> /dev/null; then
        sudo dnf install -y certbot python3-certbot-nginx
    else
        echo_error "不支持的操作系统，请手动安装Certbot"
        exit 1
    fi
    
    echo_info "Certbot安装完成"
}

# 生成Let's Encrypt证书
generate_letsencrypt_cert() {
    echo_info "生成Let's Encrypt SSL证书..."
    
    # 检查域名是否解析到当前服务器
    echo_info "检查域名解析..."
    DOMAIN_IP=$(dig +short "$DOMAIN_NAME")
    SERVER_IP=$(curl -s ifconfig.me)
    
    if [ "$DOMAIN_IP" != "$SERVER_IP" ]; then
        echo_warn "域名 $DOMAIN_NAME 未解析到当前服务器IP $SERVER_IP"
        echo_warn "请确保域名正确解析后再运行此脚本"
        read -p "是否继续？(y/N) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
    
    # 临时停止nginx（如果正在运行）
    sudo systemctl stop nginx 2>/dev/null || true
    
    # 生成证书
    sudo certbot certonly \
        --standalone \
        --email "$EMAIL" \
        --agree-tos \
        --no-eff-email \
        --domains "$DOMAIN_NAME,www.$DOMAIN_NAME,api.$DOMAIN_NAME" \
        --cert-name "$DOMAIN_NAME"
    
    # 复制证书到SSL目录
    sudo cp "/etc/letsencrypt/live/$DOMAIN_NAME/fullchain.pem" "$SSL_DIR/cert.pem"
    sudo cp "/etc/letsencrypt/live/$DOMAIN_NAME/privkey.pem" "$SSL_DIR/key.pem"
    sudo chown -R $(whoami):$(whoami) "$SSL_DIR"
    
    # 设置自动续期
    setup_cert_renewal
    
    echo_info "Let's Encrypt证书生成完成"
}

# 生成自签名证书
generate_self_signed_cert() {
    echo_info "生成自签名SSL证书..."
    
    # 创建私钥
    openssl genrsa -out "$SSL_DIR/key.pem" 2048
    
    # 创建证书签名请求配置
    cat > "$SSL_DIR/csr.conf" <<EOF
[req]
default_bits = 2048
prompt = no
default_md = sha256
distinguished_name = dn

[dn]
C=CN
ST=Beijing
L=Beijing
O=AI Notebook
OU=IT Department
CN=$DOMAIN_NAME
EOF

    # 创建证书扩展配置
    cat > "$SSL_DIR/cert.conf" <<EOF
authorityKeyIdentifier=keyid,issuer
basicConstraints=CA:FALSE
keyUsage = digitalSignature, nonRepudiation, keyEncipherment, dataEncipherment
subjectAltName = @alt_names

[alt_names]
DNS.1 = $DOMAIN_NAME
DNS.2 = www.$DOMAIN_NAME
DNS.3 = api.$DOMAIN_NAME
DNS.4 = localhost
IP.1 = 127.0.0.1
EOF

    # 生成证书
    openssl req -new -key "$SSL_DIR/key.pem" -out "$SSL_DIR/csr.pem" -config "$SSL_DIR/csr.conf"
    openssl x509 -req -in "$SSL_DIR/csr.pem" -signkey "$SSL_DIR/key.pem" -out "$SSL_DIR/cert.pem" \
        -days 365 -extensions v3_req -extfile "$SSL_DIR/cert.conf"
    
    # 清理临时文件
    rm "$SSL_DIR/csr.pem" "$SSL_DIR/csr.conf" "$SSL_DIR/cert.conf"
    
    # 设置权限
    chmod 600 "$SSL_DIR/key.pem"
    chmod 644 "$SSL_DIR/cert.pem"
    
    echo_info "自签名证书生成完成"
    echo_warn "注意：自签名证书在浏览器中会显示安全警告"
}

# 设置证书自动续期
setup_cert_renewal() {
    echo_info "设置Let's Encrypt证书自动续期..."
    
    # 创建续期脚本
    cat > "/opt/ai-notebook/scripts/renew-cert.sh" <<EOF
#!/bin/bash

# 续期Let's Encrypt证书
sudo certbot renew --quiet

# 复制新证书
if [ -f "/etc/letsencrypt/live/$DOMAIN_NAME/fullchain.pem" ]; then
    sudo cp "/etc/letsencrypt/live/$DOMAIN_NAME/fullchain.pem" "$SSL_DIR/cert.pem"
    sudo cp "/etc/letsencrypt/live/$DOMAIN_NAME/privkey.pem" "$SSL_DIR/key.pem"
    sudo chown -R $(whoami):$(whoami) "$SSL_DIR"
    
    # 重启nginx
    sudo systemctl reload nginx
    
    echo "证书续期完成: \$(date)"
fi
EOF

    chmod +x "/opt/ai-notebook/scripts/renew-cert.sh"
    
    # 添加到crontab
    (crontab -l 2>/dev/null; echo "0 3 * * * /opt/ai-notebook/scripts/renew-cert.sh >> /var/log/cert-renewal.log 2>&1") | crontab -
    
    echo_info "证书自动续期设置完成"
}

# 创建Nginx SSL配置
create_nginx_ssl_config() {
    echo_info "创建Nginx SSL配置..."
    
    cat > "$NGINX_DIR/conf.d/ssl.conf" <<EOF
# SSL配置
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES128-SHA256:ECDHE-RSA-AES256-SHA384;
ssl_prefer_server_ciphers on;
ssl_ecdh_curve secp384r1;
ssl_session_timeout 10m;
ssl_session_cache shared:SSL:10m;
ssl_session_tickets off;

# HSTS
add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;

# 其他安全头
add_header X-Content-Type-Options nosniff always;
add_header X-Frame-Options DENY always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;

# OCSP Stapling
ssl_stapling on;
ssl_stapling_verify on;
resolver 8.8.8.8 8.8.4.4 valid=300s;
resolver_timeout 5s;
EOF

    # 创建主域名配置
    cat > "$NGINX_DIR/conf.d/$DOMAIN_NAME.conf" <<EOF
# HTTP到HTTPS重定向
server {
    listen 80;
    server_name $DOMAIN_NAME www.$DOMAIN_NAME;
    
    # Let's Encrypt验证
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    # 重定向到HTTPS
    location / {
        return 301 https://\$server_name\$request_uri;
    }
}

# HTTPS主配置
server {
    listen 443 ssl http2;
    server_name $DOMAIN_NAME www.$DOMAIN_NAME;
    
    # SSL证书
    ssl_certificate $SSL_DIR/cert.pem;
    ssl_certificate_key $SSL_DIR/key.pem;
    
    # 包含SSL配置
    include $NGINX_DIR/conf.d/ssl.conf;
    
    # 前端代理
    location / {
        proxy_pass http://frontend:80;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}

# API子域名配置
server {
    listen 443 ssl http2;
    server_name api.$DOMAIN_NAME;
    
    # SSL证书
    ssl_certificate $SSL_DIR/cert.pem;
    ssl_certificate_key $SSL_DIR/key.pem;
    
    # 包含SSL配置
    include $NGINX_DIR/conf.d/ssl.conf;
    
    # API代理
    location / {
        proxy_pass http://backend:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # WebSocket支持
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
EOF

    echo_info "Nginx SSL配置创建完成"
}

# 验证SSL证书
verify_ssl_cert() {
    echo_info "验证SSL证书..."
    
    if [ ! -f "$SSL_DIR/cert.pem" ] || [ ! -f "$SSL_DIR/key.pem" ]; then
        echo_error "SSL证书文件不存在"
        return 1
    fi
    
    # 检查证书有效性
    if openssl x509 -in "$SSL_DIR/cert.pem" -text -noout > /dev/null 2>&1; then
        echo_info "证书格式验证通过"
    else
        echo_error "证书格式无效"
        return 1
    fi
    
    # 检查私钥
    if openssl rsa -in "$SSL_DIR/key.pem" -check > /dev/null 2>&1; then
        echo_info "私钥验证通过"
    else
        echo_error "私钥无效"
        return 1
    fi
    
    # 检查证书和私钥匹配
    cert_md5=$(openssl x509 -noout -modulus -in "$SSL_DIR/cert.pem" | openssl md5)
    key_md5=$(openssl rsa -noout -modulus -in "$SSL_DIR/key.pem" | openssl md5)
    
    if [ "$cert_md5" = "$key_md5" ]; then
        echo_info "证书和私钥匹配"
    else
        echo_error "证书和私钥不匹配"
        return 1
    fi
    
    # 显示证书信息
    echo_info "证书信息："
    openssl x509 -in "$SSL_DIR/cert.pem" -text -noout | grep -E "(Subject:|Issuer:|Not Before:|Not After:|DNS:)"
    
    echo_info "SSL证书验证完成"
}

# 主函数
main() {
    echo_info "开始SSL证书配置..."
    echo_info "域名: $DOMAIN_NAME"
    echo_info "邮箱: $EMAIL"
    echo_info "证书类型: $CERT_TYPE"
    
    setup_ssl_directory
    
    case "$CERT_TYPE" in
        "letsencrypt")
            install_certbot
            generate_letsencrypt_cert
            ;;
        "self-signed")
            generate_self_signed_cert
            ;;
        *)
            echo_error "不支持的证书类型: $CERT_TYPE"
            echo_info "支持的类型: letsencrypt, self-signed"
            exit 1
            ;;
    esac
    
    create_nginx_ssl_config
    verify_ssl_cert
    
    echo_info "SSL证书配置完成!"
    echo_info "证书位置: $SSL_DIR"
    echo_info "Nginx配置: $NGINX_DIR/conf.d"
    
    if [ "$CERT_TYPE" = "letsencrypt" ]; then
        echo_info "证书将在到期前自动续期"
    fi
}

# 显示帮助信息
show_help() {
    echo "SSL证书配置脚本"
    echo ""
    echo "用法: $0 [域名] [邮箱] [证书类型]"
    echo ""
    echo "参数:"
    echo "  域名         主域名 (默认: ai-notebook.com)"
    echo "  邮箱         Let's Encrypt注册邮箱 (默认: admin@ai-notebook.com)"
    echo "  证书类型     letsencrypt 或 self-signed (默认: letsencrypt)"
    echo ""
    echo "示例:"
    echo "  $0 example.com admin@example.com letsencrypt"
    echo "  $0 localhost admin@localhost.com self-signed"
    echo ""
}

# 检查参数
if [ "$1" = "-h" ] || [ "$1" = "--help" ]; then
    show_help
    exit 0
fi

# 检查是否以root运行
if [ "$EUID" -eq 0 ]; then
    echo_error "请不要以root用户运行此脚本"
    exit 1
fi

# 运行主函数
main "$@"