from pathlib import Path
from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import FileResponse
from ..core import ATTACKS
from ..schemas.api import AttackConfig, DetectRequest, FeedbackRequest, GenerateRequest, RetrainRequest
from ..service import add_feedback, attack_list, benchmark_summary, detect, generate, get_result, get_run, models, retrain
from ..storage.database import SessionLocal
from ..storage.repositories import list_runs

api_router = APIRouter()

@api_router.get("/attacks")
def attacks(): return attack_list()

@api_router.post("/attacks/{attack_id}/generate")
def generate_attack(attack_id: str, request: GenerateRequest):
	if attack_id not in ATTACKS: raise HTTPException(404, "Attack not found")
	try: return generate(attack_id, request.config)
	except ValueError as exc: raise HTTPException(400, str(exc))

@api_router.post("/attacks/{attack_id}/detect")
def detect_attack(attack_id: str, request: DetectRequest):
	try: return detect(attack_id, request.run_id, request.model_version)
	except KeyError: raise HTTPException(404, "Run not found")
	except ValueError as exc: raise HTTPException(409, str(exc))

@api_router.get("/runs")
def runs(attack_id: str | None = None, status: str | None = None, limit: int = Query(100, ge=1, le=500), offset: int = Query(0, ge=0)):
	with SessionLocal() as session: return list_runs(session, attack_id, status, limit, offset)

@api_router.get("/runs/{run_id}")
def run(run_id: str):
	try: return get_run(run_id)
	except KeyError: raise HTTPException(404, "Run not found")

@api_router.get("/runs/{run_id}/results")
def results(run_id: str):
	try: return get_result(run_id)
	except KeyError: raise HTTPException(404, "Results not found")

@api_router.get("/runs/{run_id}/artifacts/{artifact_name}")
def artifact_file(run_id: str, artifact_name: str):
	root_dir = Path(__file__).resolve().parent.parent / "data" / "generated" / run_id
	candidate = (root_dir / artifact_name).resolve()
	if not candidate.exists(): raise HTTPException(404, "Artifact not found")
	try: candidate.relative_to(root_dir.resolve())
	except ValueError: raise HTTPException(404, "Artifact not found")
	media_type = "application/json" if candidate.suffix.lower() == ".json" else "text/csv" if candidate.suffix.lower() == ".csv" else "audio/wav" if candidate.suffix.lower() == ".wav" else "application/octet-stream"
	return FileResponse(candidate, media_type=media_type, filename=candidate.name)

@api_router.get("/benchmark")
def benchmark():
    return benchmark_summary()

@api_router.get("/models")
def model_list(): return models()

@api_router.post("/models/retrain")
def retrain_model(request: RetrainRequest):
	try: return retrain(request.attack_id, request.min_improvement)
	except KeyError: raise HTTPException(404, "Attack not found")

@api_router.get("/models/{model_id}")
def model(model_id: str):
	value = next((item for item in models() if item["model_id"] == model_id), None)
	if not value: raise HTTPException(404, "Model not found")
	return value

@api_router.post("/feedback")
def feedback(request: FeedbackRequest):
	try: return add_feedback(request.run_id, request.note)
	except KeyError: raise HTTPException(404, "Run not found")
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

