import time
import logging
import hashlib
import json
from typing import Callable, Optional
from fastapi import Request, Response
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp
import asyncio

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class PerformanceMiddleware(BaseHTTPMiddleware):
    """性能监控中间件"""
    
    def __init__(self, app: ASGIApp, slow_request_threshold: float = 1.0):
        super().__init__(app)
        self.slow_request_threshold = slow_request_threshold
        self.request_count = 0
        self.total_time = 0.0
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        start_time = time.time()
        
        # 记录请求信息
        method = request.method
        url = str(request.url)
        client_ip = request.client.host if request.client else "unknown"
        
        try:
            # 处理请求
            response = await call_next(request)
            
            # 计算处理时间
            process_time = time.time() - start_time
            
            # 更新统计信息
            self.request_count += 1
            self.total_time += process_time
            
            # 添加性能头信息
            response.headers["X-Process-Time"] = str(round(process_time, 4))
            response.headers["X-Request-Count"] = str(self.request_count)
            
            # 记录慢请求
            if process_time > self.slow_request_threshold:
                logger.warning(
                    f"慢请求警告: {method} {url} "
                    f"耗时 {process_time:.3f}s "
                    f"来源 {client_ip}"
                )
            
            # 记录正常请求（仅在开发环境）
            logger.info(
                f"{method} {url} "
                f"状态码 {response.status_code} "
                f"耗时 {process_time:.3f}s"
            )
            
            return response
            
        except Exception as e:
            process_time = time.time() - start_time
            logger.error(
                f"请求处理错误: {method} {url} "
                f"耗时 {process_time:.3f}s "
                f"错误: {str(e)}"
            )
            
            # 返回错误响应
            return JSONResponse(
                status_code=500,
                content={
                    "error": "服务器内部错误",
                    "message": "请求处理失败，请稍后重试"
                },
                headers={"X-Process-Time": str(round(process_time, 4))}
            )

class CacheMiddleware(BaseHTTPMiddleware):
    """简单的HTTP缓存中间件"""
    
    def __init__(self, app: ASGIApp, default_ttl: int = 300, max_size: int = 1000):
        super().__init__(app)
        self.cache = {}
        self.default_ttl = default_ttl
        self.max_size = max_size
        self._lock = asyncio.Lock()
    
    def _generate_cache_key(self, request: Request) -> str:
        """生成缓存键"""
        url = str(request.url)
        method = request.method
        # 包含查询参数和头信息
        auth_header = request.headers.get("authorization", "")
        cache_string = f"{method}:{url}:{auth_header}"
        return hashlib.md5(cache_string.encode()).hexdigest()
    
    def _is_cacheable(self, request: Request, response: Response) -> bool:
        """判断请求是否可缓存"""
        # 仅缓存GET请求
        if request.method != "GET":
            return False
        
        # 仅缓存成功响应
        if response.status_code != 200:
            return False
        
        # 检查缓存控制头
        cache_control = response.headers.get("cache-control", "")
        if "no-cache" in cache_control or "no-store" in cache_control:
            return False
        
        # 排除某些路径
        excluded_paths = ["/api/auth/", "/api/user/", "/health"]
        if any(path in str(request.url) for path in excluded_paths):
            return False
        
        return True
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # 非GET请求直接处理
        if request.method != "GET":
            return await call_next(request)
        
        cache_key = self._generate_cache_key(request)
        
        # 检查缓存
        async with self._lock:
            if cache_key in self.cache:
                cached_data, cached_time, ttl = self.cache[cache_key]
                
                # 检查是否过期
                if time.time() - cached_time < ttl:
                    logger.debug(f"缓存命中: {request.url}")
                    
                    # 创建响应
                    response = JSONResponse(content=cached_data)
                    response.headers["X-Cache"] = "HIT"
                    response.headers["X-Cache-Key"] = cache_key[:8]
                    return response
                else:
                    # 删除过期缓存
                    del self.cache[cache_key]
        
        # 处理请求
        response = await call_next(request)
        
        # 尝试缓存响应
        if self._is_cacheable(request, response):
            try:
                # 读取响应体
                body = b""
                async for chunk in response.body_iterator:
                    body += chunk
                
                # 解析JSON内容
                content = json.loads(body.decode())
                
                # 确定TTL
                ttl = self.default_ttl
                cache_control = response.headers.get("cache-control", "")
                if "max-age=" in cache_control:
                    try:
                        ttl = int(cache_control.split("max-age=")[1].split(",")[0])
                    except:
                        pass
                
                # 存储到缓存
                async with self._lock:
                    # 检查缓存大小限制
                    if len(self.cache) >= self.max_size:
                        # 删除最旧的条目
                        oldest_key = min(self.cache.keys(), 
                                       key=lambda k: self.cache[k][1])
                        del self.cache[oldest_key]
                    
                    self.cache[cache_key] = (content, time.time(), ttl)
                    logger.debug(f"缓存存储: {request.url}")
                
                # 重新创建响应
                new_response = JSONResponse(content=content)
                new_response.headers.update(response.headers)
                new_response.headers["X-Cache"] = "MISS"
                new_response.headers["X-Cache-Key"] = cache_key[:8]
                
                return new_response
                
            except Exception as e:
                logger.warning(f"缓存存储失败: {e}")
        
        response.headers["X-Cache"] = "SKIP"
        return response

class RateLimitMiddleware(BaseHTTPMiddleware):
    """速率限制中间件"""
    
    def __init__(self, app: ASGIApp, requests_per_minute: int = 60):
        super().__init__(app)
        self.requests_per_minute = requests_per_minute
        self.requests = {}  # {client_ip: [(timestamp, count), ...]}
        self._lock = asyncio.Lock()
    
    def _get_client_ip(self, request: Request) -> str:
        """获取客户端IP"""
        # 检查代理头
        forwarded_for = request.headers.get("x-forwarded-for")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()
        
        real_ip = request.headers.get("x-real-ip")
        if real_ip:
            return real_ip
        
        if request.client:
            return request.client.host
        
        return "unknown"
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        client_ip = self._get_client_ip(request)
        current_time = time.time()
        
        async with self._lock:
            # 清理过期记录
            if client_ip in self.requests:
                self.requests[client_ip] = [
                    (timestamp, count) for timestamp, count in self.requests[client_ip]
                    if current_time - timestamp < 60  # 1分钟窗口
                ]
            
            # 计算当前分钟的请求数
            if client_ip not in self.requests:
                self.requests[client_ip] = []
            
            current_requests = sum(
                count for timestamp, count in self.requests[client_ip]
                if current_time - timestamp < 60
            )
            
            # 检查是否超过限制
            if current_requests >= self.requests_per_minute:
                logger.warning(f"速率限制触发: {client_ip} 超过 {self.requests_per_minute} 请求/分钟")
                
                return JSONResponse(
                    status_code=429,
                    content={
                        "error": "请求过于频繁",
                        "message": f"每分钟最多允许 {self.requests_per_minute} 个请求",
                        "retry_after": 60
                    },
                    headers={
                        "Retry-After": "60",
                        "X-RateLimit-Limit": str(self.requests_per_minute),
                        "X-RateLimit-Remaining": "0",
                        "X-RateLimit-Reset": str(int(current_time + 60))
                    }
                )
            
            # 记录请求
            self.requests[client_ip].append((current_time, 1))
        
        # 处理请求
        response = await call_next(request)
        
        # 添加速率限制头
        remaining = max(0, self.requests_per_minute - current_requests - 1)
        response.headers["X-RateLimit-Limit"] = str(self.requests_per_minute)
        response.headers["X-RateLimit-Remaining"] = str(remaining)
        response.headers["X-RateLimit-Reset"] = str(int(current_time + 60))
        
        return response

class CompressionMiddleware(BaseHTTPMiddleware):
    """简单的响应压缩中间件"""
    
    def __init__(self, app: ASGIApp, minimum_size: int = 500):
        super().__init__(app)
        self.minimum_size = minimum_size
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        response = await call_next(request)
        
        # 检查是否支持gzip压缩
        accept_encoding = request.headers.get("accept-encoding", "")
        if "gzip" not in accept_encoding:
            return response
        
        # 检查响应类型
        content_type = response.headers.get("content-type", "")
        if not any(t in content_type for t in ["application/json", "text/", "application/javascript"]):
            return response
        
        # 检查响应大小（这里简化处理）
        if hasattr(response, 'body') and len(response.body) > self.minimum_size:
            response.headers["Content-Encoding"] = "gzip"
            response.headers["Vary"] = "Accept-Encoding"
        
        return response

# 健康检查端点
async def health_check_detailed():
    """详细的健康检查"""
    from database_optimized import db_pool, cache_manager
    
    health_info = {
        "status": "healthy",
        "timestamp": time.time(),
        "database": {
            "connections": {
                "available": len(db_pool.connections),
                "used": len(db_pool.used_connections),
                "max": db_pool.max_connections
            }
        },
        "cache": {
            "size": len(cache_manager.cache),
            "max_size": cache_manager.max_size
        }
    }
    
    return health_info