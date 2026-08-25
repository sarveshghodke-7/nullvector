"""
Module: backend/api/router.py

Purpose:
Main API router that aggregates all stage-specific route handlers.

Layer:
API

Inputs:
- Route registrations from individual route modules

Outputs:
- Consolidated FastAPI APIRouter

Expected responsibilities:
- Include stage-specific routers (identify, generate, detect, etc.) under a common API prefix

This module must not:
- Handle attack orchestration
- Define request/response schemas

Related modules:
- backend/api/routes/*.py
- backend/main.py

Attack association:
N/A

Pipeline stage:
N/A

Status: Architecture defined; implementation pending.
"""

