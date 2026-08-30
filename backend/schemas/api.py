from __future__ import annotations
from typing import Any, Literal
from pydantic import BaseModel, Field

class AttackConfig(BaseModel):
    attackId: str | None = None
    scenario: str | None = None
    artifacts: list[str] = Field(default_factory=list)
    parameters: dict[str, Any] = Field(default_factory=dict)
    seed: int | None = None
    balanced: bool = False
    mixed_dataset: bool = False
    severity: Literal['low', 'medium', 'high', 'critical'] | None = 'medium'

class GenerateRequest(BaseModel):
    attack_id: str
    config: AttackConfig

class DetectRequest(BaseModel):
    run_id: str
    attack_id: str
    model_version: str | None = None

class FeedbackRequest(BaseModel):
    run_id: str
    note: str | None = None

class RetrainRequest(BaseModel):
    attack_id: str
    min_improvement: float = 0.0

class ModelVersion(BaseModel):
    version: str
    model_type: str
    trained_at: str
    training_samples: int
    performance: dict[str, float]
    is_active: bool

class ModelInfo(BaseModel):
    model_id: str
    attack_id: str
    attack_name: str
    description: str
    current_version: str
    versions: list[ModelVersion]
