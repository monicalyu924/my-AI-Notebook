FROM python:3.9-slim

# 设置工作目录
WORKDIR /app

# 设置环境变量优化Python行为
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1

# 先复制依赖文件（利用Docker层缓存）
COPY requirements.txt .

# 安装Python依赖
RUN pip install --no-cache-dir -r requirements.txt

# 复制应用代码
COPY . .

# 暴露端口
EXPOSE 8000

# 使用uvicorn启动FastAPI应用
# workers=1 适合Railway的单容器部署
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]