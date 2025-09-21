#!/bin/bash

# 生产环境安全强化脚本
# 自动应用安全配置和防护措施

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
SECURITY_DIR="/opt/ai-notebook/security"
LOG_DIR="/var/log/ai-notebook"
BACKUP_DIR="/opt/ai-notebook/backups"

# 检查运行权限
check_permissions() {
    echo_info "检查运行权限..."
    
    if [ "$EUID" -eq 0 ]; then
        echo_error "请不要以root用户运行此脚本"
        exit 1
    fi
    
    if ! groups $USER | grep -q '\bsudo\b'; then
        echo_error "当前用户需要sudo权限"
        exit 1
    fi
    
    echo_info "权限检查通过"
}

# 创建安全目录结构
setup_security_directories() {
    echo_info "创建安全目录结构..."
    
    sudo mkdir -p "$SECURITY_DIR"/{keys,certificates,policies,logs}
    sudo mkdir -p "$LOG_DIR"/{security,audit,access}
    sudo mkdir -p "$BACKUP_DIR"/{daily,weekly,monthly}
    
    # 设置正确的权限
    sudo chown -R $USER:$USER "$SECURITY_DIR"
    sudo chown -R $USER:$USER "$LOG_DIR"
    sudo chown -R $USER:$USER "$BACKUP_DIR"
    
    # 限制敏感目录访问
    sudo chmod 700 "$SECURITY_DIR/keys"
    sudo chmod 755 "$SECURITY_DIR/certificates"
    sudo chmod 644 "$SECURITY_DIR/policies"
    
    echo_info "安全目录创建完成"
}

# 配置防火墙
configure_firewall() {
    echo_info "配置防火墙规则..."
    
    # 安装ufw（如果未安装）
    if ! command -v ufw &> /dev/null; then
        echo_debug "安装ufw防火墙..."
        sudo apt-get update
        sudo apt-get install -y ufw
    fi
    
    # 重置防火墙规则
    sudo ufw --force reset
    
    # 设置默认策略
    sudo ufw default deny incoming
    sudo ufw default allow outgoing
    
    # 允许SSH（限制来源IP）
    if [ -n "$SSH_ALLOWED_IPS" ]; then
        for ip in $SSH_ALLOWED_IPS; do
            sudo ufw allow from "$ip" to any port 22 proto tcp
        done
    else
        sudo ufw allow 22/tcp
        echo_warn "SSH允许来自任何IP，建议限制来源IP"
    fi
    
    # 允许HTTP和HTTPS
    sudo ufw allow 80/tcp
    sudo ufw allow 443/tcp
    
    # 允许Docker网络
    sudo ufw allow from 172.16.0.0/12
    sudo ufw allow from 192.168.0.0/16
    
    # 启用防火墙
    sudo ufw --force enable
    
    echo_info "防火墙配置完成"
}

# 强化SSH配置
harden_ssh() {
    echo_info "强化SSH配置..."
    
    local ssh_config="/etc/ssh/sshd_config"
    local backup_config="/etc/ssh/sshd_config.backup.$(date +%Y%m%d)"
    
    # 备份原配置
    sudo cp "$ssh_config" "$backup_config"
    
    # 创建强化配置
    cat << 'EOF' | sudo tee "$ssh_config" > /dev/null
# AI智能记事本 SSH强化配置

# 基本设置
Port 22
Protocol 2
HostKey /etc/ssh/ssh_host_rsa_key
HostKey /etc/ssh/ssh_host_ecdsa_key
HostKey /etc/ssh/ssh_host_ed25519_key

# 安全设置
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
AuthorizedKeysFile .ssh/authorized_keys
ChallengeResponseAuthentication no
UsePAM yes

# 连接限制
MaxAuthTries 3
MaxSessions 5
MaxStartups 10:30:60
LoginGraceTime 30

# 协议设置
X11Forwarding no
AllowTcpForwarding no
AllowAgentForwarding no
PermitTunnel no

# 其他安全设置
ClientAliveInterval 300
ClientAliveCountMax 2
Compression no
TCPKeepAlive no
AllowUsers ai-notebook

# 日志设置
SyslogFacility AUTH
LogLevel VERBOSE

# Kex算法
KexAlgorithms curve25519-sha256@libssh.org,diffie-hellman-group16-sha512,diffie-hellman-group18-sha512
Ciphers chacha20-poly1305@openssh.com,aes256-gcm@openssh.com,aes128-gcm@openssh.com,aes256-ctr,aes192-ctr,aes128-ctr
MACs hmac-sha2-256-etm@openssh.com,hmac-sha2-512-etm@openssh.com,hmac-sha2-256,hmac-sha2-512
EOF
    
    # 验证配置
    if sudo sshd -t; then
        echo_info "SSH配置验证通过"
        sudo systemctl reload sshd
    else
        echo_error "SSH配置验证失败，恢复备份"
        sudo cp "$backup_config" "$ssh_config"
        sudo systemctl reload sshd
        exit 1
    fi
    
    echo_info "SSH强化完成"
}

# 配置fail2ban
setup_fail2ban() {
    echo_info "配置fail2ban入侵防护..."
    
    # 安装fail2ban
    if ! command -v fail2ban-server &> /dev/null; then
        echo_debug "安装fail2ban..."
        sudo apt-get update
        sudo apt-get install -y fail2ban
    fi
    
    # 创建自定义配置
    cat << 'EOF' | sudo tee /etc/fail2ban/jail.local > /dev/null
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 3
backend = systemd

[sshd]
enabled = true
port = ssh
logpath = /var/log/auth.log
maxretry = 3
bantime = 3600

[nginx-http-auth]
enabled = true
filter = nginx-http-auth
logpath = /var/log/nginx/error.log
maxretry = 3
bantime = 3600

[nginx-dos]
enabled = true
filter = nginx-dos
logpath = /var/log/nginx/access.log
maxretry = 100
findtime = 300
bantime = 3600
EOF
    
    # 创建nginx DOS过滤器
    cat << 'EOF' | sudo tee /etc/fail2ban/filter.d/nginx-dos.conf > /dev/null
[Definition]
failregex = ^<HOST> -.*"(GET|POST).*HTTP.*" 200 .*$
ignoreregex =
EOF
    
    # 启动fail2ban
    sudo systemctl enable fail2ban
    sudo systemctl restart fail2ban
    
    echo_info "fail2ban配置完成"
}

# 安装和配置ClamAV
setup_antivirus() {
    echo_info "安装和配置ClamAV反病毒..."
    
    # 安装ClamAV
    if ! command -v clamscan &> /dev/null; then
        echo_debug "安装ClamAV..."
        sudo apt-get update
        sudo apt-get install -y clamav clamav-daemon
    fi
    
    # 更新病毒库
    sudo systemctl stop clamav-freshclam
    sudo freshclam
    sudo systemctl start clamav-freshclam
    sudo systemctl enable clamav-freshclam
    
    # 创建扫描脚本
    cat << 'EOF' > "$SECURITY_DIR/virus-scan.sh"
#!/bin/bash

# 病毒扫描脚本
SCAN_DIRS="/opt/ai-notebook /home"
LOG_FILE="/var/log/ai-notebook/clamav-scan.log"
EMAIL="admin@ai-notebook.com"

echo "$(date): 开始病毒扫描" >> "$LOG_FILE"

clamscan -r --log="$LOG_FILE" --infected --remove $SCAN_DIRS

if [ $? -eq 1 ]; then
    echo "发现病毒，已记录到日志" | mail -s "ClamAV检测到病毒" "$EMAIL"
fi

echo "$(date): 病毒扫描完成" >> "$LOG_FILE"
EOF
    
    chmod +x "$SECURITY_DIR/virus-scan.sh"
    
    # 添加到crontab（每日扫描）
    (crontab -l 2>/dev/null; echo "0 2 * * * $SECURITY_DIR/virus-scan.sh") | crontab -
    
    echo_info "ClamAV配置完成"
}

# 配置系统强化
system_hardening() {
    echo_info "执行系统强化..."
    
    # 内核参数调优
    cat << 'EOF' | sudo tee /etc/sysctl.d/99-security.conf > /dev/null
# 网络安全参数
net.ipv4.ip_forward = 0
net.ipv4.conf.all.send_redirects = 0
net.ipv4.conf.default.send_redirects = 0
net.ipv4.conf.all.accept_redirects = 0
net.ipv4.conf.default.accept_redirects = 0
net.ipv4.conf.all.accept_source_route = 0
net.ipv4.conf.default.accept_source_route = 0
net.ipv4.conf.all.log_martians = 1
net.ipv4.conf.default.log_martians = 1
net.ipv4.icmp_echo_ignore_broadcasts = 1
net.ipv4.icmp_ignore_bogus_error_responses = 1
net.ipv4.tcp_syncookies = 1

# TCP强化
net.ipv4.tcp_timestamps = 0
net.ipv4.tcp_fin_timeout = 15
net.ipv4.tcp_keepalive_time = 1800
net.ipv4.tcp_keepalive_probes = 7
net.ipv4.tcp_keepalive_intvl = 30

# IPv6禁用（如果不需要）
net.ipv6.conf.all.disable_ipv6 = 1
net.ipv6.conf.default.disable_ipv6 = 1

# 文件系统保护
fs.suid_dumpable = 0
fs.protected_hardlinks = 1
fs.protected_symlinks = 1

# 内存保护
kernel.dmesg_restrict = 1
kernel.kptr_restrict = 2
kernel.core_uses_pid = 1
EOF
    
    # 应用内核参数
    sudo sysctl -p /etc/sysctl.d/99-security.conf
    
    # 禁用不必要的服务
    local disable_services=(
        "bluetooth"
        "cups"
        "avahi-daemon"
        "rpcbind"
        "nfs-common"
    )
    
    for service in "${disable_services[@]}"; do
        if systemctl is-active --quiet "$service"; then
            echo_debug "禁用服务: $service"
            sudo systemctl stop "$service"
            sudo systemctl disable "$service"
        fi
    done
    
    echo_info "系统强化完成"
}

# 配置日志审计
setup_logging() {
    echo_info "配置日志审计..."
    
    # 安装auditd
    if ! command -v auditctl &> /dev/null; then
        echo_debug "安装auditd..."
        sudo apt-get update
        sudo apt-get install -y auditd audispd-plugins
    fi
    
    # 配置审计规则
    cat << 'EOF' | sudo tee /etc/audit/rules.d/ai-notebook.rules > /dev/null
# AI智能记事本审计规则

# 删除所有现有规则
-D

# 缓冲区大小
-b 8192

# 失败模式
-f 1

# 系统调用审计
-a always,exit -F arch=b64 -S adjtimex -S settimeofday -k time-change
-a always,exit -F arch=b64 -S clock_settime -k time-change
-w /etc/localtime -p wa -k time-change

# 用户和组管理
-w /etc/group -p wa -k identity
-w /etc/passwd -p wa -k identity
-w /etc/gshadow -p wa -k identity
-w /etc/shadow -p wa -k identity
-w /etc/security/opasswd -p wa -k identity

# 网络配置
-w /etc/hosts -p wa -k system-locale
-w /etc/sysconfig/network -p wa -k system-locale

# 系统管理员操作
-w /var/log/sudo.log -p wa -k actions
-w /etc/sudoers -p wa -k scope

# 敏感文件访问
-w /opt/ai-notebook -p wa -k ai-notebook-files
-w /etc/ssl -p wa -k ssl-config

# 特权命令
-a always,exit -F path=/usr/bin/passwd -F perm=x -F auid>=1000 -F auid!=4294967295 -k privileged-passwd
-a always,exit -F path=/usr/bin/su -F perm=x -F auid>=1000 -F auid!=4294967295 -k privileged-su
-a always,exit -F path=/usr/bin/sudo -F perm=x -F auid>=1000 -F auid!=4294967295 -k privileged-sudo

# 登录审计
-w /var/log/faillog -p wa -k logins
-w /var/log/lastlog -p wa -k logins
-w /var/log/tallylog -p wa -k logins

# 进程和会话管理
-w /var/run/utmp -p wa -k session
-w /var/log/wtmp -p wa -k logins
-w /var/log/btmp -p wa -k logins

# 内核模块加载
-w /sbin/insmod -p x -k modules
-w /sbin/rmmod -p x -k modules
-w /sbin/modprobe -p x -k modules
-a always,exit -F arch=b64 -S init_module -S delete_module -k modules

# 使配置不可更改
-e 2
EOF
    
    # 重启auditd
    sudo systemctl enable auditd
    sudo systemctl restart auditd
    
    # 配置rsyslog集中日志
    cat << 'EOF' | sudo tee /etc/rsyslog.d/50-ai-notebook.conf > /dev/null
# AI智能记事本日志配置

# 认证日志
auth,authpriv.*                 /var/log/ai-notebook/auth.log

# 应用日志
local0.*                        /var/log/ai-notebook/app.log

# 安全事件
local1.*                        /var/log/ai-notebook/security.log

# 审计日志
local2.*                        /var/log/ai-notebook/audit.log

# 日志轮转配置
$WorkDirectory /var/spool/rsyslog
$ActionFileDefaultTemplate RSYSLOG_TraditionalFileFormat
$FileOwner root
$FileGroup adm
$FileCreateMode 0640
$DirCreateMode 0755
$Umask 0022
EOF
    
    sudo systemctl restart rsyslog
    
    echo_info "日志审计配置完成"
}

# 配置文件完整性监控
setup_file_integrity() {
    echo_info "配置文件完整性监控..."
    
    # 安装AIDE
    if ! command -v aide &> /dev/null; then
        echo_debug "安装AIDE..."
        sudo apt-get update
        sudo apt-get install -y aide
    fi
    
    # 配置AIDE
    cat << 'EOF' | sudo tee /etc/aide/aide.conf > /dev/null
# AI智能记事本AIDE配置

database=file:/var/lib/aide/aide.db
database_out=file:/var/lib/aide/aide.db.new
gzip_dbout=yes

# 监控规则
/opt/ai-notebook f+p+u+g+s+m+c+md5+sha1
/etc f+p+u+g+s+m+c+md5+sha1
/bin f+p+u+g+s+m+c+md5+sha1
/sbin f+p+u+g+s+m+c+md5+sha1
/usr/bin f+p+u+g+s+m+c+md5+sha1
/usr/sbin f+p+u+g+s+m+c+md5+sha1

# 排除临时文件
!/tmp
!/var/tmp
!/var/log
!/var/cache
EOF
    
    # 初始化数据库
    sudo aide --init
    sudo mv /var/lib/aide/aide.db.new /var/lib/aide/aide.db
    
    # 创建检查脚本
    cat << 'EOF' > "$SECURITY_DIR/file-integrity-check.sh"
#!/bin/bash

LOG_FILE="/var/log/ai-notebook/file-integrity.log"
EMAIL="admin@ai-notebook.com"

echo "$(date): 开始文件完整性检查" >> "$LOG_FILE"

aide --check >> "$LOG_FILE" 2>&1

if [ $? -ne 0 ]; then
    echo "文件完整性检查发现异常" | mail -s "文件完整性告警" "$EMAIL"
fi

echo "$(date): 文件完整性检查完成" >> "$LOG_FILE"
EOF
    
    chmod +x "$SECURITY_DIR/file-integrity-check.sh"
    
    # 添加到crontab（每日检查）
    (crontab -l 2>/dev/null; echo "0 3 * * * $SECURITY_DIR/file-integrity-check.sh") | crontab -
    
    echo_info "文件完整性监控配置完成"
}

# 配置入侵检测
setup_intrusion_detection() {
    echo_info "配置入侵检测系统..."
    
    # 安装OSSEC或类似工具
    if ! command -v ossec-control &> /dev/null; then
        echo_debug "下载并安装OSSEC HIDS..."
        cd /tmp
        wget https://github.com/ossec/ossec-hids/archive/3.7.0.tar.gz -O ossec.tar.gz
        tar -xzf ossec.tar.gz
        cd ossec-hids-3.7.0
        
        # 自动安装配置
        cat << 'EOF' > preloaded-vars.conf
USER_LANGUAGE="en"
USER_NO_STOP="y"
USER_INSTALL_TYPE="local"
USER_DIR="/var/ossec"
USER_ENABLE_SYSCHECK="y"
USER_ENABLE_ROOTCHECK="y"
USER_ENABLE_OPENSCAP="y"
USER_WHITE_LIST=""
EOF
        
        sudo ./install.sh
        cd ~
        rm -rf /tmp/ossec*
    fi
    
    # 配置OSSEC
    if [ -f "/var/ossec/etc/ossec.conf" ]; then
        sudo cp /var/ossec/etc/ossec.conf /var/ossec/etc/ossec.conf.backup
        
        cat << 'EOF' | sudo tee /var/ossec/etc/local_rules.xml > /dev/null
<!-- AI智能记事本自定义规则 -->
<group name="ai-notebook,">
  
  <!-- 应用特定规则 -->
  <rule id="100001" level="8">
    <if_sid>5716</if_sid>
    <srcip>!192.168.0.0/16</srcip>
    <description>Multiple authentication failures from external IP</description>
    <group>authentication_failures,</group>
  </rule>
  
  <rule id="100002" level="10">
    <if_sid>100001</if_sid>
    <same_source_ip />
    <description>Multiple authentication failures from same external IP - possible attack</description>
    <group>authentication_failures,attack,</group>
  </rule>
  
  <rule id="100003" level="12">
    <match>failed to authenticate</match>
    <description>AI Notebook authentication failure</description>
    <group>authentication_failures,</group>
  </rule>
  
</group>
EOF
        
        sudo /var/ossec/bin/ossec-control restart
    fi
    
    echo_info "入侵检测系统配置完成"
}

# 生成安全报告
generate_security_report() {
    echo_info "生成安全配置报告..."
    
    local report_file="$SECURITY_DIR/security-report-$(date +%Y%m%d).txt"
    
    cat << EOF > "$report_file"
AI智能记事本安全配置报告
生成时间: $(date)
======================================

系统信息:
- 操作系统: $(lsb_release -d | cut -f2)
- 内核版本: $(uname -r)
- 主机名: $(hostname)

安全配置状态:
- 防火墙状态: $(sudo ufw status | head -1)
- SSH强化: 已完成
- Fail2ban状态: $(systemctl is-active fail2ban)
- 病毒扫描: 已配置
- 系统强化: 已完成
- 日志审计: 已配置
- 文件完整性监控: 已配置
- 入侵检测: 已配置

开放端口:
$(sudo netstat -tulpn | grep LISTEN)

最近登录记录:
$(last -n 10)

防火墙规则:
$(sudo ufw status numbered)

建议:
1. 定期更新系统和应用程序
2. 监控安全日志和告警
3. 定期备份重要数据
4. 进行安全审计和渗透测试
5. 保持安全配置的更新

EOF
    
    echo_info "安全报告已生成: $report_file"
}

# 主函数
main() {
    echo_info "开始生产环境安全强化..."
    
    check_permissions
    setup_security_directories
    configure_firewall
    harden_ssh
    setup_fail2ban
    setup_antivirus
    system_hardening
    setup_logging
    setup_file_integrity
    setup_intrusion_detection
    generate_security_report
    
    echo_info "安全强化完成!"
    echo_info "请查看安全报告: $SECURITY_DIR/security-report-$(date +%Y%m%d).txt"
    echo_warn "建议重启系统以确保所有配置生效"
}

# 显示帮助信息
show_help() {
    echo "生产环境安全强化脚本"
    echo ""
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  -h, --help    显示帮助信息"
    echo ""
    echo "环境变量:"
    echo "  SSH_ALLOWED_IPS    允许SSH访问的IP列表（空格分隔）"
    echo ""
    echo "示例:"
    echo "  SSH_ALLOWED_IPS=\"192.168.1.100 203.0.113.10\" $0"
    echo ""
}

# 检查参数
if [ "$1" = "-h" ] || [ "$1" = "--help" ]; then
    show_help
    exit 0
fi

# 运行主函数
main "$@"