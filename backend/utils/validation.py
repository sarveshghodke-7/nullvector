"""Shared validation utilities."""
from __future__ import annotations

from typing import Any

from backend.schemas.common import RiskTier


class EntityLeakageError(Exception):
    """Raised when entity pools overlap across train/val/test splits."""
    pass


def risk_tier(score: float, thresholds: dict[str, float]) -> RiskTier:
    """Classify a risk score into ALLOW / CHALLENGE / BLOCK.

    Args:
        score: Risk probability in [0, 1].
        thresholds: Dict with 'allow_below' and 'block_above' keys.

    Returns:
        The appropriate RiskTier.
    """
    if score < thresholds["allow_below"]:
        return RiskTier.ALLOW
    elif score > thresholds["block_above"]:
        return RiskTier.BLOCK
    else:
        return RiskTier.CHALLENGE


def validate_disjoint_pools(*pools: set[Any]) -> bool:
    """Assert that all entity pools are strictly disjoint.

    Raises:
        EntityLeakageError: If any two pools share elements.
    """
    pool_list = list(pools)
    for i in range(len(pool_list)):
        for j in range(i + 1, len(pool_list)):
            overlap = pool_list[i] & pool_list[j]
            if overlap:
                raise EntityLeakageError(
                    f"Entity pools {i} and {j} share {len(overlap)} "
                    f"identifiers: {list(overlap)[:5]}..."
                )
    return True
