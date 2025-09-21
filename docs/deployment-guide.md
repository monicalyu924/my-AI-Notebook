# AI智能记事本部署指南

## 概述

本文档提供AI智能记事本的完整部署指南，包括开发环境、测试环境和生产环境的部署步骤。

## 目录

- [系统要求](#系统要求)
- [快速开始](#快速开始)
- [开发环境部署](#开发环境部署)
- [生产环境部署](#生产环境部署)
- [配置说明](#配置说明)
- [SSL证书配置](#ssl证书配置)
- [监控系统](#监控系统)
- [故障排除](#故障排除)

## 系统要求

### 最低配置

- **CPU**: 2核心
- **内存**: 4GB RAM
- **磁盘**: 20GB 可用空间
- **操作系统**: Ubuntu 20.04+ / CentOS 8+ / macOS 10.15+

### 推荐配置（生产环境）

- **CPU**: 4核心或更多
- **内存**: 8GB RAM或更多
- **磁盘**: 50GB SSD存储
- **网络**: 1Gbps带宽
- **操作系统**: Ubuntu 22.04 LTS

### 软件依赖

- Docker 20.10+
- Docker Compose 2.0+
- Git 2.30+
- OpenSSL 1.1.1+

## 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/your-org/ai-notebook.git
cd ai-notebook
```

### 2. 配置环境变量

```bash
cp .env.example .env
# 编辑 .env 文件，配置必要的环境变量
nano .env
```

### 3. 启动服务

```bash
# 构建并启动服务
docker-compose up -d

# 检查服务状态
docker-compose ps
```

### 4. 初始化数据库

```bash
# 运行数据库迁移
./scripts/migrate-database.sh migrate

# 创建种子数据（可选）
python3 database/seeds/seed_data.py --database-url="$DATABASE_URL" seed
```

### 5. 访问应用

- 前端应用: http://localhost
- API文档: http://localhost/api/docs
- Grafana监控: http://localhost:3000

## 开发环境部署

### 准备工作

1. **安装依赖**

```bash
# 安装Docker和Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

2. **配置环境变量**

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑配置文件
cat > .env << 'EOF'
# 应用密钥
SECRET_KEY=dev-secret-key-change-in-production
JWT_SECRET_KEY=dev-jwt-secret-key-change-in-production

# 数据库配置
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/ai_notebook_dev
POSTGRES_PASSWORD=postgres

# Redis配置
REDIS_PASSWORD=redis123
REDIS_URL=redis://redis:6379/0

# 开发环境配置
DEBUG=true
APP_ENV=development

# Grafana配置
GRAFANA_PASSWORD=admin123
EOF
```

### 启动开发环境

```bash
# 启动基础服务
docker-compose -f docker-compose.yml up -d postgres redis

# 等待数据库就绪
sleep 10

# 运行数据库迁移
./scripts/migrate-database.sh migrate

# 创建测试数据
python3 database/seeds/seed_data.py --database-url="$DATABASE_URL" seed

# 启动应用服务
docker-compose up -d

# 查看日志
docker-compose logs -f
```

### 开发工具配置

```bash
# 启动监控系统（可选）
./scripts/setup-monitoring.sh

# 运行代码质量检查
cd frontend && npm run lint && npm run type-check
cd ../backend && flake8 . && black --check .

# 运行测试
cd frontend && npm test
cd ../backend && python -m pytest tests/
```

## 生产环境部署

### 1. 服务器准备

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装必要软件
sudo apt install -y curl wget git ufw fail2ban

# 配置防火墙
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw --force enable

# 创建应用用户
sudo useradd -m -s /bin/bash ai-notebook
sudo usermod -aG docker ai-notebook
```

### 2. 安装Docker

```bash
# 安装Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
sudo usermod -aG docker ai-notebook

# 安装Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 3. 部署应用

```bash
# 切换到应用用户
sudo su - ai-notebook

# 创建应用目录
sudo mkdir -p /opt/ai-notebook
sudo chown ai-notebook:ai-notebook /opt/ai-notebook
cd /opt/ai-notebook

# 克隆代码
git clone https://github.com/your-org/ai-notebook.git .

# 配置生产环境变量
cat > .env << 'EOF'
# 生产环境配置
APP_ENV=production
DEBUG=false

# 强密钥配置
SECRET_KEY=your-super-secure-secret-key-32-characters-long
JWT_SECRET_KEY=your-jwt-secret-key-32-characters-long

# 数据库配置
DATABASE_URL=postgresql://postgres:your-strong-password@postgres:5432/ai_notebook
POSTGRES_PASSWORD=your-strong-postgres-password

# Redis配置
REDIS_PASSWORD=your-strong-redis-password

# 邮件配置
SMTP_HOST=smtp.gmail.com
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
FROM_EMAIL=noreply@ai-notebook.com

# 监控配置
GRAFANA_PASSWORD=your-grafana-password

# 域名配置
DOMAIN_NAME=ai-notebook.com
API_DOMAIN=api.ai-notebook.com

# 第三方服务
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project
GOOGLE_ANALYTICS_ID=GA_MEASUREMENT_ID

# 备份配置
BACKUP_ENCRYPTION_KEY=your-backup-encryption-key
BACKUP_S3_BUCKET=your-s3-bucket-name
BACKUP_S3_ACCESS_KEY=your-s3-access-key
BACKUP_S3_SECRET_KEY=your-s3-secret-key
EOF

# 设置文件权限
chmod 600 .env
```

### 4. 配置SSL证书

```bash
# 自动获取Let's Encrypt证书
./scripts/setup-ssl.sh ai-notebook.com admin@ai-notebook.com letsencrypt

# 或者使用自签名证书（测试环境）
./scripts/setup-ssl.sh ai-notebook.com admin@ai-notebook.com self-signed
```

### 5. 启动生产服务

```bash
# 构建并启动服务
docker-compose -f docker-compose.yml up -d

# 等待服务就绪
sleep 30

# 运行数据库迁移
./scripts/migrate-database.sh migrate

# 检查服务状态
docker-compose ps
curl -f https://ai-notebook.com/health
```

### 6. 配置系统服务

```bash
# 创建systemd服务文件
sudo cat > /etc/systemd/system/ai-notebook.service << 'EOF'
[Unit]
Description=AI智能记事本
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/ai-notebook
ExecStart=/usr/local/bin/docker-compose up -d
ExecStop=/usr/local/bin/docker-compose down
TimeoutStartSec=0
User=ai-notebook
Group=ai-notebook

[Install]
WantedBy=multi-user.target
EOF

# 启用服务
sudo systemctl daemon-reload
sudo systemctl enable ai-notebook
sudo systemctl start ai-notebook
```

### 7. 配置监控和日志

```bash
# 部署监控系统
./scripts/setup-monitoring.sh

# 配置日志轮转
sudo cat > /etc/logrotate.d/ai-notebook << 'EOF'
/opt/ai-notebook/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    copytruncate
    postrotate
        docker-compose -f /opt/ai-notebook/docker-compose.yml restart filebeat || true
    endscript
}
EOF
```

## 配置说明

### 环境变量详解

| 变量名 | 描述 | 示例值 | 必需 |
|--------|------|--------|------|
| `SECRET_KEY` | 应用密钥 | `your-secret-key` | ✓ |
| `JWT_SECRET_KEY` | JWT密钥 | `your-jwt-secret` | ✓ |
| `DATABASE_URL` | 数据库连接URL | `postgresql://...` | ✓ |
| `REDIS_URL` | Redis连接URL | `redis://...` | ✓ |
| `APP_ENV` | 应用环境 | `production` | ✓ |
| `DEBUG` | 调试模式 | `false` | ✓ |
| `DOMAIN_NAME` | 主域名 | `ai-notebook.com` | × |
| `SMTP_HOST` | 邮件服务器 | `smtp.gmail.com` | × |

### Docker Compose配置

主要服务配置：

- **frontend**: Nginx + React前端
- **backend**: Python FastAPI后端
- **postgres**: PostgreSQL数据库
- **redis**: Redis缓存
- **nginx**: 反向代理服务器

### 网络配置

默认网络配置：

```yaml
networks:
  ai-notebook:
    driver: bridge
    ipam:
      config:
        - subnet: 172.20.0.0/16
```

## SSL证书配置

### Let's Encrypt自动证书

```bash
# 安装Certbot
sudo apt install certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d ai-notebook.com -d www.ai-notebook.com

# 设置自动续期
echo "0 0,12 * * * root python3 -c 'import random; import time; time.sleep(random.random() * 3600)' && certbot renew -q" | sudo tee -a /etc/crontab > /dev/null
```

### 自签名证书

```bash
# 生成私钥
openssl genrsa -out ssl/private.key 2048

# 生成证书签名请求
openssl req -new -key ssl/private.key -out ssl/certificate.csr

# 生成自签名证书
openssl x509 -req -days 365 -in ssl/certificate.csr -signkey ssl/private.key -out ssl/certificate.crt
```

## 监控系统

### Grafana仪表板

访问 `https://monitoring.ai-notebook.com:3000`

默认登录：
- 用户名: `admin`
- 密码: 环境变量 `GRAFANA_PASSWORD`

### 主要监控指标

1. **系统资源**
   - CPU使用率
   - 内存使用率
   - 磁盘使用率
   - 网络IO

2. **应用指标**
   - 请求响应时间
   - 错误率
   - 吞吐量
   - 活跃用户数

3. **数据库指标**
   - 连接数
   - 查询性能
   - 缓存命中率

### 告警配置

告警通知渠道：
- 邮件通知
- Slack集成
- 短信通知（可选）

## 备份和恢复

### 自动备份

```bash
# 配置自动备份
cat > /opt/ai-notebook/scripts/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/backups/ai-notebook"
DATE=$(date +%Y%m%d_%H%M%S)

# 创建备份目录
mkdir -p $BACKUP_DIR

# 备份数据库
docker-compose exec -T postgres pg_dump -U postgres ai_notebook > $BACKUP_DIR/db_backup_$DATE.sql

# 备份文件数据
tar -czf $BACKUP_DIR/files_backup_$DATE.tar.gz uploads/

# 清理旧备份（保留7天）
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
EOF

chmod +x /opt/ai-notebook/scripts/backup.sh

# 添加到crontab
echo "0 2 * * * /opt/ai-notebook/scripts/backup.sh" | crontab -
```

### 数据恢复

```bash
# 恢复数据库
docker-compose exec -T postgres psql -U postgres -d ai_notebook < backup.sql

# 恢复文件
tar -xzf files_backup.tar.gz -C ./
```

## 性能优化

### 数据库优化

```sql
-- 创建索引
CREATE INDEX CONCURRENTLY idx_notes_user_created ON notes(user_id, created_at);
CREATE INDEX CONCURRENTLY idx_notes_search ON notes USING gin(to_tsvector('english', title || ' ' || content));

-- 优化查询
VACUUM ANALYZE;
REINDEX DATABASE ai_notebook;
```

### 缓存配置

```bash
# Redis优化配置
echo "maxmemory 256mb" >> redis.conf
echo "maxmemory-policy allkeys-lru" >> redis.conf
echo "save 900 1" >> redis.conf
```

### Nginx优化

```nginx
# 启用gzip压缩
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css application/json application/javascript;

# 设置缓存
location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

## 故障排除

### 常见问题

#### 1. 服务无法启动

```bash
# 检查日志
docker-compose logs frontend
docker-compose logs backend

# 检查端口占用
sudo netstat -tulpn | grep :80
sudo netstat -tulpn | grep :443

# 重启服务
docker-compose restart
```

#### 2. 数据库连接失败

```bash
# 检查数据库状态
docker-compose exec postgres pg_isready

# 检查连接配置
docker-compose exec backend env | grep DATABASE_URL

# 重置数据库密码
docker-compose exec postgres psql -U postgres -c "ALTER USER postgres PASSWORD 'new_password';"
```

#### 3. SSL证书问题

```bash
# 检查证书状态
openssl x509 -in ssl/cert.pem -text -noout

# 续期Let's Encrypt证书
sudo certbot renew --dry-run

# 重新生成自签名证书
./scripts/setup-ssl.sh yourdomain.com admin@yourdomain.com self-signed
```

#### 4. 内存不足

```bash
# 检查内存使用
free -h
docker stats

# 优化Docker内存限制
docker-compose down
docker system prune -f
docker-compose up -d
```

### 日志分析

```bash
# 查看应用日志
tail -f logs/backend/app.log
tail -f logs/nginx/access.log

# 查看系统日志
sudo journalctl -u ai-notebook -f

# 搜索错误日志
grep -i error logs/backend/*.log
```

### 健康检查

```bash
# 检查服务健康状态
curl -f http://localhost/health
curl -f http://localhost:8000/health

# 检查数据库连接
docker-compose exec postgres pg_isready

# 检查Redis连接
docker-compose exec redis redis-cli ping
```

## 升级指南

### 应用升级

```bash
# 1. 备份当前版本
./scripts/backup.sh

# 2. 获取最新代码
git fetch origin
git checkout main
git pull origin main

# 3. 构建新镜像
docker-compose build

# 4. 运行数据库迁移
./scripts/migrate-database.sh migrate

# 5. 重启服务
docker-compose down
docker-compose up -d

# 6. 验证升级
curl -f https://ai-notebook.com/health
```

### 回滚步骤

```bash
# 1. 停止当前服务
docker-compose down

# 2. 回滚代码
git checkout previous-stable-tag

# 3. 恢复数据库（如需要）
docker-compose exec -T postgres psql -U postgres -d ai_notebook < backup.sql

# 4. 重启服务
docker-compose up -d
```

## 安全注意事项

1. **定期更新**
   - 及时更新操作系统补丁
   - 更新Docker和依赖包
   - 更新应用代码

2. **访问控制**
   - 使用强密码
   - 启用双因子认证
   - 限制SSH访问

3. **网络安全**
   - 配置防火墙规则
   - 使用SSL/TLS加密
   - 启用fail2ban

4. **数据保护**
   - 加密敏感数据
   - 定期备份
   - 测试恢复流程

## 支持和联系

- 文档: https://docs.ai-notebook.com
- 问题报告: https://github.com/your-org/ai-notebook/issues
- 邮件支持: support@ai-notebook.com

---

本文档最后更新：2024年1月1日