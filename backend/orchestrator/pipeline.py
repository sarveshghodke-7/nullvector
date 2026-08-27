"""Master pipeline orchestrator."""
from __future__ import annotations

from datetime import datetime
from typing import Any

from backend.orchestrator.attack_registry import get_attack
from backend.schemas.common import PipelineEnvelope
from backend.storage.database import Database
from backend.utils.ids import generate_run_id
from backend.utils.logging import get_logger

logger = get_logger(__name__)


async def run_pipeline(
    attack_id: str,
    config_overrides: dict[str, Any] | None = None,
) -> PipelineEnvelope:
    """Execute the full pipeline for an attack.

    The orchestrator does NOT implement attack-specific logic.
    It delegates to the attack module's simulator.
    """
    # Validate attack exists and is implemented
    attack_entry = get_attack(attack_id)
    run_id = generate_run_id()

    db = Database()
    db.init_db()
    db.log_run(run_id, attack_id)

    logger.info(f"Starting pipeline: attack={attack_id}, run={run_id}")

    try:
        if attack_id == "card_testing":
            from backend.attacks.card_testing.identify import identify
            from backend.attacks.card_testing.simulator import run_full_simulation

            # Identify
            identify_result = identify(run_id)

            # Run full simulation loop
            loop_history = await run_full_simulation(
                run_id=run_id,
                config_overrides=config_overrides,
            )

            # Build final result
            final_metrics = {}
            if loop_history:
                last = loop_history[-1]
                final_metrics = last.get("metrics", {})

            db.update_run_status(run_id, "completed")

            return PipelineEnvelope(
                run_id=run_id,
                attack_id=attack_id,
                stage="completed",
                timestamp=datetime.utcnow(),
                payload={
                    "identify": identify_result.payload,
                    "rounds_completed": len(loop_history),
                    "final_metrics": final_metrics,
                    "loop_history": loop_history,
                },
            )
        else:
            raise NotImplementedError(f"Pipeline for {attack_id} not implemented")

    except Exception as e:
        db.update_run_status(run_id, "failed")
        logger.error(f"Pipeline failed: {e}")
        raise
    finally:
        db.close()
