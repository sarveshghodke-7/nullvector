"""FastAPI application entry point for AI Defense Lab."""
from __future__ import annotations

from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.api.router import api_router
from backend.storage.database import Database

load_dotenv()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan: initialize database on startup."""
    db = Database()
    db.init_db()
    db.close()
    yield


app = FastAPI(
    title="AI Defense Lab — Payment Security",
    description=(
        "End-to-end AI-powered payment security laboratory. "
        "Red Team → Generate → Detect → Evaluate → Feedback."
    ),
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)


@app.get("/")
async def root():
    """Health check."""
    return {
        "status": "ok",
        "project": "AI Defense Lab — Payment Security",
        "docs": "/docs",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
