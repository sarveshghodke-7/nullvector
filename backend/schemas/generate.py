"""Schemas for the Generate pipeline stage."""
from __future__ import annotations

from typing import Any, Optional

from pydantic import BaseModel, Field


class GenerateRequest(BaseModel):
    """Input to the Generate stage."""
    round: int = 1
    previous_outcome_summary: Optional[dict[str, Any]] = None
    probe_count: int = 100
    merchant_category_pool: list[str] = Field(default_factory=lambda: ["5411", "5812", "5941", "4899"])


class FidelityReport(BaseModel):
    """Statistical fidelity assessment of generated data."""
    ks_statistic: float = 0.0
    ks_pvalue: float = 1.0
    discriminator_accuracy: float = 0.5
    passed_gate: bool = True


class GenerateResponse(BaseModel):
    """Output from the Generate stage."""
    dataset_id: str
    sample_count: int
    transaction_count: int
    data_location: str
    format: dict[str, str] = Field(default_factory=lambda: {"transactions": "csv"})
    fidelity_report: FidelityReport = Field(default_factory=FidelityReport)
