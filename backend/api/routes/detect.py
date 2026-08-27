"""Detect API route."""
from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from backend.schemas.common import PipelineEnvelope

router = APIRouter()


class DetectRequest(BaseModel):
    run_id: str
    attack_id: str = "card_testing"
    dataset_path: str = ""


@router.post("/detect", response_model=PipelineEnvelope)
async def api_detect(req: DetectRequest):
    """Run detection on a generated dataset.

    Note: For full pipeline execution, use POST /api/attacks/run instead.
    This endpoint is for standalone detection on pre-generated data.
    """
    raise HTTPException(
        status_code=501,
        detail="Standalone detect not yet implemented. Use POST /api/attacks/run for full pipeline.",
    )
