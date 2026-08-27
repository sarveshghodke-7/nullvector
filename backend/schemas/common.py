"""Common schemas used across all attack modules and pipeline stages."""
from __future__ import annotations

import enum
from datetime import datetime, timezone
from typing import Any, Optional

from pydantic import BaseModel, ConfigDict, Field, computed_field


class RiskTier(str, enum.Enum):
    """Risk tier classification for transaction scoring."""
    ALLOW = "ALLOW"
    CHALLENGE = "CHALLENGE"
    BLOCK = "BLOCK"


class PipelineEnvelope(BaseModel):
    """Standard wrapper for all inter-module communication."""
    model_config = ConfigDict(populate_by_name=True)

    schema_version: str = "1.0"
    run_id: str
    attack_id: str
    stage: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    payload: dict[str, Any] = Field(default_factory=dict)


class ConfusionMatrix(BaseModel):
    """Standard confusion matrix with computed properties."""
    tp: int = 0
    tn: int = 0
    fp: int = 0
    fn: int = 0

    @computed_field
    @property
    def total(self) -> int:
        return self.tp + self.tn + self.fp + self.fn

    @computed_field
    @property
    def accuracy(self) -> float:
        if self.total == 0:
            return 0.0
        return (self.tp + self.tn) / self.total


class DetectionMetrics(BaseModel):
    """Standard detection metrics reported by every evaluator."""
    precision: float = 0.0
    recall: float = 0.0
    f1: float = 0.0
    auc_roc: float = 0.0
    fp_rate: float = 0.0
    auc_pr: Optional[float] = None
    attack_success_rate: Optional[float] = None
