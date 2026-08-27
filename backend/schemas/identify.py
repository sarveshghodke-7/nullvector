"""Schema for the Identify pipeline stage."""
from __future__ import annotations

from pydantic import BaseModel


class IdentifyPayload(BaseModel):
    """Structured attack specification returned by the Identify stage."""
    attack_name: str
    target: str
    channel: str
    objectives: list[str]
    artifacts: list[str]
    generation_strategy: str
    detection_strategy: str
