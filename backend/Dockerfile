# 多阶段构建 - 后端
# 阶段1: 基础Python环境
FROM python:3.11-slim AS base

# 设置环境变量
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# 安装系统依赖
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# 阶段2: 依赖安装
FROM base AS dependencies

# 设置工作目录
WORKDIR /app

# 复制requirements文件
COPY requirements.txt ./

# 安装Python依赖
RUN pip install --upgrade pip && \
    pip install -r requirements.txt

# 阶段3: 生产环境
FROM base AS production

# 创建应用用户
RUN groupadd -r appuser && useradd -r -g appuser appuser

# 设置工作目录
WORKDIR /app

# 从依赖阶段复制Python包
COPY --from=dependencies /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=dependencies /usr/local/bin /usr/local/bin

# 复制应用代码
COPY . .

# 创建必要的目录
RUN mkdir -p /app/logs \
             /app/uploads \
             /app/backups \
             /app/ssl \
             /tmp/app && \
    chown -R appuser:appuser /app /tmp/app

# 复制启动脚本
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# 安装额外的生产依赖
RUN pip install gunicorn[gthread] uvicorn[standard]

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# 切换到应用用户
USER appuser

# 暴露端口
EXPOSE 8000

# 启动命令
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["gunicorn", "--worker-class", "uvicorn.workers.UvicornWorker", "--workers", "4", "--bind", "0.0.0.0:8000", "--timeout", "120", "--keep-alive", "5", "main:app"]

# 元数据标签
LABEL maintainer="AI Notebook Team <team@ai-notebook.com>" \
      version="2.0.0" \
      description="AI智能记事本后端API" \
      org.opencontainers.image.title="AI Notebook Backend" \
      org.opencontainers.image.description="AI驱动的智能记事本后端API服务" \
      org.opencontainers.image.version="2.0.0" \
      org.opencontainers.image.vendor="AI Notebook Team"