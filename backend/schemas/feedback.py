"""Schemas for the Feedback pipeline stage."""
from __future__ import annotations

from typing import Any, Optional

from pydantic import BaseModel


class FeedbackResponse(BaseModel):
    """Output from the Feedback stage."""
    false_negatives: int = 0
    false_positives: int = 0
    hard_examples_location: str = ""
    recommended_action: str = "generate_harder_variants"
    failure_cluster_summary: Optional[dict[str, Any]] = None
