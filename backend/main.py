import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .storage.database import init_db
from .api.router import api_router


# ---------------------------------------------------------------------------
# CORS configuration
# ---------------------------------------------------------------------------

DEFAULT_ORIGINS = [
    # Production frontend
    "https://mic-2026.vercel.app",

    # Local development
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3001",
]

# Optional Render environment variable:
# CORS_ALLOWED_ORIGINS=https://mic-2026.vercel.app,http://localhost:3000
allowed_origins = os.getenv("CORS_ALLOWED_ORIGINS")

if allowed_origins:
    origins = [
        origin.strip()
        for origin in allowed_origins.split(",")
        if origin.strip()
    ]
else:
    origins = DEFAULT_ORIGINS


# ---------------------------------------------------------------------------
# FastAPI application
# ---------------------------------------------------------------------------

app = FastAPI(
    title="AI Defense Lab API",
    version="1.0.0",
)


# ---------------------------------------------------------------------------
# CORS middleware
# ---------------------------------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# API routes
# ---------------------------------------------------------------------------

app.include_router(
    api_router,
    prefix="/api/v1",
)


# ---------------------------------------------------------------------------
# Startup
# ---------------------------------------------------------------------------

@app.on_event("startup")
def startup() -> None:
    init_db()


# ---------------------------------------------------------------------------
# Health endpoint
# ---------------------------------------------------------------------------

@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "ai-defense-lab",
    }


# ---------------------------------------------------------------------------
# Root endpoint
# ---------------------------------------------------------------------------

@app.get("/")
def root():
    return {
        "service": "AI Defense Lab API",
        "status": "ok",
        "docs": "/docs",
        "health": "/health",
    }