"""Identify API route."""
from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from backend.orchestrator.attack_registry import AttackNotImplementedError, get_attack
from backend.schemas.common import PipelineEnvelope
from backend.utils.ids import generate_run_id

router = APIRouter()


class IdentifyRequest(BaseModel):
    attack_id: str


@router.post("/identify", response_model=PipelineEnvelope)
async def api_identify(req: IdentifyRequest):
    """Return the Identify specification for an attack."""
    try:
        get_attack(req.attack_id)
    except AttackNotImplementedError as e:
        raise HTTPException(status_code=404, detail=str(e))

    if req.attack_id == "card_testing":
        from backend.attacks.card_testing.identify import identify
        return identify(generate_run_id())

    raise HTTPException(status_code=404, detail=f"Identify not implemented for {req.attack_id}")
