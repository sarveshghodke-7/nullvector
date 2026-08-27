"""Identify stage for the Card Testing attack module."""
from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path

from backend.schemas.common import PipelineEnvelope
from backend.schemas.identify import IdentifyPayload

CONFIG_PATH = Path(__file__).parent / "config.json"


def load_config() -> dict:
    """Load the attack configuration."""
    return json.loads(CONFIG_PATH.read_text())


def identify(run_id: str) -> PipelineEnvelope:
    """Return the Identify specification for card testing."""
    config = load_config()
    payload = IdentifyPayload(
        attack_name=config["attack_name"],
        target=config["target"],
        channel=config["channel"],
        objectives=[
            "probe card validity across merchants without triggering per-merchant velocity thresholds",
            "adapt probing strategy based on approve/decline feedback",
        ],
        artifacts=["probe_strategy", "transaction_batch"],
        generation_strategy="adaptive_round_based_probing",
        detection_strategy="velocity_and_risk_tier_classifier",
    )
    return PipelineEnvelope(
        run_id=run_id,
        attack_id=config["attack_id"],
        stage="identify",
        timestamp=datetime.now(timezone.utc),
        payload=payload.model_dump(),
    )
