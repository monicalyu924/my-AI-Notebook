from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import auth_router, notes_router, ai_router, user_router, todos_router, folders_router, chat_router, versions_router, projects_router
from database_sqlite import init_database

app = FastAPI(
    title="AI Notebook API",
    description="AI驱动的云端同步记事本应用API",
    version="1.0.0"
)

# 配置CORS - 支持开发环境和生产环境
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000", 
        "http://localhost:5173", 
        "http://localhost:5174", 
        "http://localhost:5175", 
        "http://localhost:5176", 
        "null",
        # Vercel 生产环境域名 (将在部署后更新具体域名)
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
