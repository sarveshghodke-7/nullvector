"""Main API router."""
from fastapi import APIRouter

from backend.api.routes import attacks, detect, evaluate, feedback, generate, identify

api_router = APIRouter(prefix="/api")

api_router.include_router(identify.router, tags=["identify"])
api_router.include_router(generate.router, tags=["generate"])
api_router.include_router(detect.router, tags=["detect"])
api_router.include_router(evaluate.router, tags=["evaluate"])
api_router.include_router(feedback.router, tags=["feedback"])
api_router.include_router(attacks.router, tags=["attacks"])
