"""Feedback API route."""
from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from backend.schemas.common import PipelineEnvelope
from backend.schemas.feedback import FeedbackResponse

router = APIRouter()


class FeedbackRequest(BaseModel):
    run_id: str
    attack_id: str = "card_testing"


@router.post("/feedback", response_model=PipelineEnvelope)
async def api_feedback(req: FeedbackRequest):
    """Trigger feedback analysis for a completed run."""
    from backend.storage.database import Database
    from datetime import datetime

    db = Database()
    db.init_db()
    run = db.get_run(req.run_id)

    if not run:
        raise HTTPException(status_code=404, detail=f"Run not found: {req.run_id}")

    history = db.get_loop_history(req.run_id)
    db.close()

    # Extract feedback info from loop history
    total_fn = 0
    total_fp = 0
    for entry in history:
        metrics = entry if isinstance(entry, dict) else {}
        # Note: actual FN/FP extraction happens during simulation

    feedback = FeedbackResponse(
        false_negatives=total_fn,
        false_positives=total_fp,
        recommended_action="generate_harder_variants" if total_fn > 0 else "no_action",
    )

    return PipelineEnvelope(
        run_id=req.run_id,
        attack_id=req.attack_id,
        stage="feedback",
        timestamp=datetime.utcnow(),
        payload=feedback.model_dump(),
    )
