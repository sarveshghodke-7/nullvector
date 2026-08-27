"""Generate harder attack strategies based on failure analysis."""
from __future__ import annotations

from typing import Any

from backend.llm.client import get_llm_client
from backend.llm.prompts import FALLBACK_STRATEGIES
from backend.utils.logging import get_logger

logger = get_logger(__name__)


async def generate_hard_strategy(
    failure_summary: dict[str, Any],
    current_round: int,
    attack_id: str = "card_testing",
) -> dict[str, Any]:
    """Generate a harder attack strategy based on failure analysis.

    Args:
        failure_summary: Output from analyzer.analyze_failures().
        current_round: The current round number.
        attack_id: The attack module identifier.

    Returns:
        A new strategy dict for the next round.
    """
    llm_client = get_llm_client()

    # Build outcome summary from failure analysis
    outcome_summary = {
        "false_negatives": failure_summary.get("total_fn", 0),
        "evasion_patterns": [
            c.get("dominant_pattern", "")
            for c in failure_summary.get("clusters", [])
        ],
        "recommendation": "Focus on the patterns that successfully evaded detection",
    }

    strategy = await llm_client.generate_strategy(
        attack_id=attack_id,
        previous_outcome_summary=outcome_summary,
        round_num=current_round + 1,
    )

    logger.info(
        f"Generated hard strategy for round {current_round + 1}: "
        f"probes={strategy.get('probe_count')}, "
        f"mccs={strategy.get('target_mccs')}"
    )

    return strategy
