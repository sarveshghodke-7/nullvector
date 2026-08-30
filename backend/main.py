import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .storage.database import init_db
from .api.router import api_router

DEFAULT_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3001",
]

allowed_origins = os.getenv("CORS_ALLOWED_ORIGINS")
if allowed_origins:
    origins = [origin.strip() for origin in allowed_origins.split(",") if origin.strip()]
else:
    origins = DEFAULT_ORIGINS

app = FastAPI(title="AI Defense Lab API", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=origins, allow_credentials=True, allow_methods=["*"], allow_headers=["*"])
app.include_router(api_router, prefix="/api/v1")

@app.on_event("startup")
def startup() -> None:
	init_db()

@app.get("/health")
def health():
	return {"status": "ok", "service": "ai-defense-lab"}


@app.get("/")
def root():
	return {
		"service": "AI Defense Lab API",
		"status": "ok",
		"docs": "/docs",
		"health": "/health",
	}
"""
Module: backend/main.py

Purpose:
Entry point for the AI Defense Lab for Payment Security backend API.

Layer:
API

Inputs:
- HTTP requests

Outputs:
- HTTP responses

Expected responsibilities:
- Initialize the FastAPI application
- Mount API routers
- Handle application startup and shutdown

This module must not:
- Implement attack generation or detection logic
- Handle orchestration workflow directly

Related modules:
- backend/api/router.py
- backend/orchestrator/pipeline.py

Attack association:
N/A

Pipeline stage:
N/A

Status: Architecture defined; implementation pending.
"""

