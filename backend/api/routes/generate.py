"""Generate API route."""
from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from backend.schemas.common import PipelineEnvelope
from backend.schemas.generate import GenerateRequest
from backend.utils.ids import generate_run_id

router = APIRouter()


class GenerateAPIRequest(BaseModel):
    attack_id: str = "card_testing"
    round: int = 1
    probe_count: int = 100
    merchant_category_pool: list[str] = ["5411", "5812", "5941", "4899"]


@router.post("/generate", response_model=PipelineEnvelope)
async def api_generate(req: GenerateAPIRequest):
    """Generate attack data for a single round."""
    if req.attack_id == "card_testing":
        from backend.attacks.card_testing.generator import (
            create_entity_pools,
            generate_baseline_traffic,
            generate,
        )
        from backend.attacks.card_testing.identify import load_config
        from datetime import datetime

        config = load_config()
        run_id = generate_run_id()
        pools = create_entity_pools(config)

        baseline = generate_baseline_traffic(
            pools["train"], config,
            n_transactions=int(config["baseline_legitimate_count"] * 0.7)
        )

        combined_df, response = await generate(
            run_id=run_id,
            round_num=req.round,
            previous_outcome_summary=None,
            entity_pool=pools["train"],
            baseline_df=baseline,
            config=config,
            probe_count=req.probe_count,
            mcc_pool=req.merchant_category_pool,
        )

        return PipelineEnvelope(
            run_id=run_id,
            attack_id=req.attack_id,
            stage="generate",
            timestamp=datetime.utcnow(),
            payload=response.model_dump(),
        )

    raise HTTPException(status_code=404, detail=f"Generate not implemented for {req.attack_id}")
