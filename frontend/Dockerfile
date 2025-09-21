# 多阶段构建 - 前端
# 阶段1: 构建阶段
FROM node:18-alpine AS builder

# 设置工作目录
WORKDIR /app

# 复制package文件
COPY package*.json ./

# 安装依赖（使用npm ci提高性能）
RUN npm ci --only=production && npm cache clean --force

# 复制源代码
COPY . .

# 构建应用
RUN npm run build

# 阶段2: 生产阶段
FROM nginx:alpine AS production

# 安装必要的工具
RUN apk add --no-cache \
    curl \
    tzdata \
    && rm -rf /var/cache/apk/*

# 设置时区
ENV TZ=Asia/Shanghai
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# 创建nginx用户和目录
RUN addgroup -g 1001 -S nginx-app && \
    adduser -S nginx-app -u 1001 -G nginx-app

# 复制构建产物
COPY --from=builder /app/dist /usr/share/nginx/html

# 复制nginx配置
COPY nginx.conf /etc/nginx/nginx.conf
COPY nginx.prod.conf /etc/nginx/conf.d/default.conf

# 复制启动脚本
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# 创建必要的目录和设置权限
RUN mkdir -p /var/cache/nginx/client_temp \
             /var/cache/nginx/proxy_temp \
             /var/cache/nginx/fastcgi_temp \
             /var/cache/nginx/uwsgi_temp \
             /var/cache/nginx/scgi_temp \
             /var/log/nginx \
             /var/run && \
    chown -R nginx-app:nginx-app /var/cache/nginx \
                                /var/log/nginx \
                                /var/run \
                                /usr/share/nginx/html && \
    chmod -R 755 /var/cache/nginx \
                 /var/log/nginx \
                 /usr/share/nginx/html

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:80/health || exit 1

# 切换到非root用户
USER nginx-app

# 暴露端口
EXPOSE 80

# 启动命令
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]

# 元数据标签
LABEL maintainer="AI Notebook Team <team@ai-notebook.com>" \
      version="2.0.0" \
      description="AI智能记事本前端应用" \
      org.opencontainers.image.title="AI Notebook Frontend" \
      org.opencontainers.image.description="AI驱动的智能记事本前端应用" \
      org.opencontainers.image.version="2.0.0" \
      org.opencontainers.image.vendor="AI Notebook Team"