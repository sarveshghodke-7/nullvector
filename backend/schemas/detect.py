"""Schemas for the Detect pipeline stage."""
from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, Field

from backend.schemas.common import DetectionMetrics, RiskTier


class PredictionResult(BaseModel):
    """Single transaction prediction with explainability."""
    transaction_id: str
    risk_score: float
    risk_tier: RiskTier
    shap_top_features: list[str] = Field(default_factory=list)


class DetectResponse(BaseModel):
    """Output from the Detect stage."""
    round: int
    model_id: str
    predictions_location: str
    predictions_sample: list[PredictionResult] = Field(default_factory=list)
    metrics: DetectionMetrics = Field(default_factory=DetectionMetrics)
