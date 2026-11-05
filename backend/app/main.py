from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path
from app.config import settings
from app.database import init_db
from app.api.routes import (
    auth, brands, references, research, content, calendar, models, training, analytics, pipeline
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB schema
    await init_db()
    yield

app = FastAPI(
    title="Sevencore AI Content Intelligence & Generation Platform",
    description="Enterprise-grade reference-driven content intelligence, planning, generation, and multi-factor quality evaluation API.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Middleware
origins = [
    settings.FRONTEND_URL,
    
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if settings.DEBUG else origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
Path(settings.UPLOAD_DIR).mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

app.include_router(auth.router)
app.include_router(brands.router)
app.include_router(references.router)
app.include_router(research.router)
app.include_router(content.router)
app.include_router(calendar.router)
app.include_router(models.router)
app.include_router(training.router)
app.include_router(analytics.router)
app.include_router(pipeline.router)

@app.get("/health", tags=["Health"])
async def health_check():
    return {
        "status": "healthy",
        "platform": "Sevencore AI",
        "environment": settings.ENVIRONMENT,
        "default_provider": settings.DEFAULT_AI_PROVIDER,
        "database": "connected"
    }

@app.get("/", tags=["Root"])
async def root():
    return {
        "message": "Welcome to Sevencore AI Content Intelligence Platform API",
        "docs": "/docs",
        "status": "operational"
    }

if __name__ == "__main__":
    import subprocess
    import os
    import time
    import uvicorn
    # Free port 8000 automatically if occupied
    try:
        current_pid = os.getpid()
        out = subprocess.check_output(["lsof", "-ti", ":8000"], text=True, stderr=subprocess.DEVNULL).strip()
        if out:
            pids = [int(p) for p in out.split() if p.isdigit() and int(p) != current_pid]
            for p in pids:
                try:
                    os.kill(p, 9)
                except OSError:
                    pass
            time.sleep(0.3)
    except Exception:
        pass
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)

