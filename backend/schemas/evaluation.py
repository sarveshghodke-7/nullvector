"""Schemas for the Evaluation pipeline stage."""
from __future__ import annotations

from pydantic import BaseModel, Field

from backend.schemas.common import ConfusionMatrix, DetectionMetrics


class EvaluationResponse(BaseModel):
    """Output from the Evaluation stage."""
    samples_evaluated: int = 0
    confusion_matrix: ConfusionMatrix = Field(default_factory=ConfusionMatrix)
    metrics: DetectionMetrics = Field(default_factory=DetectionMetrics)
    per_tier_stop_rate: dict[str, float] = Field(default_factory=dict)
