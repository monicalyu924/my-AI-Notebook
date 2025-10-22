from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import auth_router, notes_router, ai_router, user_router, todos_router, folders_router, chat_router, versions_router, projects_router, admin_router, tags_router, share_router, export_router, rbac_router, nano_banana_router
from database import init_database
from middleware import RBACMiddleware, PerformanceMiddleware

app = FastAPI(
    title="AI Notebook API",
    description="AI驱动的云端同步记事本应用API",
    version="1.0.0"
)

# 添加RBAC权限中间件
app.add_middleware(RBACMiddleware)

# 添加性能监控中间件(可选)
app.add_middleware(PerformanceMiddleware, slow_request_threshold=1.0)

# 配置CORS - 支持开发环境和生产环境
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        # 开发环境
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://localhost:5176",
        "null",
        # Vercel 生产环境 - 精确域名（必须明确指定，通配符不完全支持）
        "https://ai-notebook-production.vercel.app",
        # 通配符作为备用（某些情况下可能不生效）
        "https://*.vercel.app",
        # 其他可能的生产域名
        "https://*.ai-notebook.app"
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(auth_router.router)
app.include_router(folders_router.router)
app.include_router(notes_router.router)
app.include_router(ai_router.router)
app.include_router(user_router.router)
app.include_router(todos_router.router)
app.include_router(chat_router.router)
app.include_router(versions_router.router)
app.include_router(projects_router.router)
app.include_router(admin_router.router)  # 管理员路由
app.include_router(tags_router.router)  # 标签管理路由
app.include_router(share_router.router)  # 分享和评论路由
app.include_router(export_router.router)  # 导出功能路由
app.include_router(rbac_router.router)  # RBAC权限管理路由
app.include_router(nano_banana_router.router)  # Nano Banana图像生成路由

@app.get("/")
async def root():
    return {
        "message": "AI Notebook API", 
        "version": "1.0.0",
        "docs": "/docs"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    # Initialize database
    init_database()
    
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
