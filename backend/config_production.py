import os
import logging
from typing import Optional, List
from pydantic import BaseSettings, validator
from functools import lru_cache

class ProductionSettings(BaseSettings):
    """生产环境配置类"""
    
    # 应用基础配置
    app_name: str = "AI智能记事本API"
    app_version: str = "2.0.0"
    app_env: str = "production"
    debug: bool = False
    
    # 服务器配置
    host: str = "0.0.0.0"
    port: int = 8000
    workers: int = 4
    worker_class: str = "uvicorn.workers.UvicornWorker"
    max_requests: int = 1000
    max_requests_jitter: int = 100
    
    # 数据库配置
    database_url: str
    database_pool_size: int = 20
    database_max_overflow: int = 30
    database_echo: bool = False
    database_pool_timeout: int = 30
    database_pool_recycle: int = 3600
    
    # Redis配置
    redis_url: str = "redis://localhost:6379/0"
    redis_cache_db: int = 1
    redis_session_db: int = 2
    redis_pool_size: int = 10
    
    # 安全配置
    secret_key: str
    jwt_secret_key: str
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60
    refresh_token_expire_days: int = 30
    
    # CORS配置
    cors_origins: str = "https://ai-notebook.com"
    cors_allow_credentials: bool = True
    cors_allow_methods: str = "GET,POST,PUT,DELETE,OPTIONS"
    cors_allow_headers: str = "*"
    
    # 文件上传配置
    max_upload_size: int = 10485760  # 10MB
    upload_path: str = "/app/uploads"
    allowed_extensions: str = "jpg,jpeg,png,gif,pdf,doc,docx,txt"
    
    # 邮件配置
    smtp_host: str = "smtp.gmail.com"
    smtp_port: int = 587
    smtp_username: str
    smtp_password: str
    smtp_use_tls: bool = True
    from_email: str
    
    # 第三方服务
    openrouter_api_url: str = "https://openrouter.ai/api/v1"
    openrouter_rate_limit: int = 60
    openrouter_timeout: int = 30
    
    # 监控和日志
    log_level: str = "INFO"
    log_file: str = "/app/logs/app.log"
    log_rotation: str = "daily"
    log_retention: int = 30
    
    sentry_dsn: Optional[str] = None
    sentry_environment: str = "production"
    sentry_traces_sample_rate: float = 0.1
    
    # 性能配置
    cache_ttl: int = 300
    rate_limit_per_minute: int = 60
    session_timeout: int = 3600
    connection_timeout: int = 30
    
    # 备份配置
    backup_enabled: bool = True
    backup_schedule: str = "0 2 * * *"  # 每天凌晨2点
    backup_retention_days: int = 30
    backup_storage_path: str = "/app/backups"
    
    # SSL配置
    ssl_enabled: bool = True
    ssl_cert_path: str = "/app/ssl/cert.pem"
    ssl_key_path: str = "/app/ssl/key.pem"
    
    # 健康检查
    health_check_interval: int = 30
    health_check_timeout: int = 10
    health_check_retries: int = 3

    @validator('cors_origins')
    def parse_cors_origins(cls, v):
        """解析CORS origins"""
        return [origin.strip() for origin in v.split(',')]
    
    @validator('allowed_extensions')
    def parse_allowed_extensions(cls, v):
        """解析允许的文件扩展名"""
        return [ext.strip() for ext in v.split(',')]
    
    @validator('secret_key', 'jwt_secret_key')
    def validate_secrets(cls, v):
        """验证密钥安全性"""
        if len(v) < 32:
            raise ValueError('密钥长度至少32个字符')
        if v in ['your-super-secret-key-change-this-in-production', 
                'your-jwt-secret-key-change-this-too']:
            raise ValueError('请更改默认密钥')
        return v
    
    @validator('database_url')
    def validate_database_url(cls, v):
        """验证数据库URL"""
        if not v.startswith(('postgresql://', 'sqlite:///')):
            raise ValueError('不支持的数据库类型')
        return v

    class Config:
        env_file = ".env.production"
        case_sensitive = False

# 日志配置
class LogConfig:
    """日志配置类"""
    
    @staticmethod
    def setup_logging(settings: ProductionSettings):
        """设置生产环境日志"""
        
        # 创建日志目录
        log_dir = os.path.dirname(settings.log_file)
        os.makedirs(log_dir, exist_ok=True)
        
        # 日志格式
        log_format = {
            'format': '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            'datefmt': '%Y-%m-%d %H:%M:%S'
        }
        
        # 根日志配置
        logging.basicConfig(
            level=getattr(logging, settings.log_level.upper()),
            format=log_format['format'],
            datefmt=log_format['datefmt'],
            handlers=[
                # 文件处理器
                logging.handlers.TimedRotatingFileHandler(
                    settings.log_file,
                    when=settings.log_rotation,
                    backupCount=settings.log_retention,
                    encoding='utf-8'
                ),
                # 控制台处理器（仅在开发环境）
                logging.StreamHandler() if settings.debug else logging.NullHandler()
            ]
        )
        
        # 第三方库日志级别
        logging.getLogger('uvicorn').setLevel(logging.INFO)
        logging.getLogger('fastapi').setLevel(logging.INFO)
        logging.getLogger('sqlalchemy').setLevel(logging.WARNING)

# 性能监控配置
class MonitoringConfig:
    """监控配置类"""
    
    @staticmethod
    def setup_sentry(settings: ProductionSettings):
        """设置Sentry错误监控"""
        if settings.sentry_dsn:
            try:
                import sentry_sdk
                from sentry_sdk.integrations.fastapi import FastApiIntegration
                from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration
                
                sentry_sdk.init(
                    dsn=settings.sentry_dsn,
                    environment=settings.sentry_environment,
                    traces_sample_rate=settings.sentry_traces_sample_rate,
                    integrations=[
                        FastApiIntegration(auto_enabling=True),
                        SqlalchemyIntegration(),
                    ],
                    attach_stacktrace=True,
                    send_default_pii=False,
                    release=settings.app_version
                )
                
                logging.info("Sentry监控已启用")
            except ImportError:
                logging.warning("Sentry SDK未安装，跳过错误监控设置")

# 安全配置
class SecurityConfig:
    """安全配置类"""
    
    @staticmethod
    def get_security_headers():
        """获取安全头配置"""
        return {
            "X-Content-Type-Options": "nosniff",
            "X-Frame-Options": "DENY",
            "X-XSS-Protection": "1; mode=block",
            "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
            "Content-Security-Policy": (
                "default-src 'self'; "
                "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net; "
                "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
                "font-src 'self' https://fonts.gstatic.com; "
                "img-src 'self' data: https:; "
                "connect-src 'self' https://api.openrouter.ai;"
            ),
            "Referrer-Policy": "strict-origin-when-cross-origin",
            "Permissions-Policy": "geolocation=(), microphone=(), camera=()"
        }

# 数据库配置
class DatabaseConfig:
    """数据库配置类"""
    
    @staticmethod
    def get_database_config(settings: ProductionSettings):
        """获取数据库配置"""
        return {
            "url": settings.database_url,
            "pool_size": settings.database_pool_size,
            "max_overflow": settings.database_max_overflow,
            "echo": settings.database_echo,
            "pool_timeout": settings.database_pool_timeout,
            "pool_recycle": settings.database_pool_recycle,
            "pool_pre_ping": True,  # 连接健康检查
            "connect_args": {
                "connect_timeout": settings.connection_timeout,
                "application_name": settings.app_name,
                "options": "-c timezone=UTC"
            }
        }

# 缓存实例
@lru_cache()
def get_settings() -> ProductionSettings:
    """获取配置实例（单例模式）"""
    return ProductionSettings()

# 初始化函数
def init_production_config():
    """初始化生产环境配置"""
    settings = get_settings()
    
    # 设置日志
    LogConfig.setup_logging(settings)
    
    # 设置监控
    MonitoringConfig.setup_sentry(settings)
    
    logging.info(f"生产环境配置已加载: {settings.app_name} v{settings.app_version}")
    
    return settings

# 导出主要配置
__all__ = [
    'ProductionSettings',
    'LogConfig', 
    'MonitoringConfig',
    'SecurityConfig',
    'DatabaseConfig',
    'get_settings',
    'init_production_config'
]