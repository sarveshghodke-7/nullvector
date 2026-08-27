"""Attack management API routes."""
from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from backend.orchestrator.attack_registry import list_attacks
from backend.orchestrator.pipeline import run_pipeline
from backend.schemas.common import PipelineEnvelope
from backend.storage.database import Database

router = APIRouter()


@router.get("/attacks")
async def api_list_attacks():
    """List all registered attack modules."""
    return {"attacks": list_attacks()}


class RunRequest(BaseModel):
    attack_id: str = "card_testing"
    config_overrides: dict | None = None


@router.post("/attacks/run", response_model=PipelineEnvelope)
async def api_run_pipeline(req: RunRequest):
    """Execute a full attack pipeline."""
    try:
        result = await run_pipeline(
            attack_id=req.attack_id,
            config_overrides=req.config_overrides,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/runs/{run_id}")
async def api_get_run(run_id: str):
    """Get run metadata."""
    db = Database()
    db.init_db()
    run = db.get_run(run_id)
    db.close()
    if not run:
        raise HTTPException(status_code=404, detail=f"Run not found: {run_id}")
    return run


@router.get("/results/{run_id}")
async def api_get_results(run_id: str):
    """Get full results for a run."""
    db = Database()
    db.init_db()
    run = db.get_run(run_id)
    if not run:
        db.close()
        raise HTTPException(status_code=404, detail=f"Run not found: {run_id}")
    history = db.get_loop_history(run_id)
    db.close()
    return {
        "run": run,
        "loop_history": history,
    }
