"""Evaluate API route."""
from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from backend.schemas.common import PipelineEnvelope

router = APIRouter()


class EvaluateRequest(BaseModel):
    run_id: str


@router.post("/evaluate", response_model=PipelineEnvelope)
async def api_evaluate(req: EvaluateRequest):
    """Get evaluation results for a completed run."""
    from backend.storage.database import Database
    from datetime import datetime

    db = Database()
    db.init_db()
    run = db.get_run(req.run_id)

    if not run:
        raise HTTPException(status_code=404, detail=f"Run not found: {req.run_id}")

    history = db.get_loop_history(req.run_id)
    db.close()

    return PipelineEnvelope(
        run_id=req.run_id,
        attack_id=run.get("attack_id", "unknown"),
        stage="evaluate",
        timestamp=datetime.utcnow(),
        payload={
            "status": run.get("status"),
            "loop_history": history,
        },
    )
