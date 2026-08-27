"""Unique identifier generation for pipeline entities."""
from __future__ import annotations

import uuid


def generate_run_id() -> str:
    """Generate a unique run identifier."""
    return f"run_{uuid.uuid4().hex[:8]}"


def generate_dataset_id(attack_id: str, round_num: int) -> str:
    """Generate a unique dataset identifier."""
    return f"{attack_id}_ds_r{round_num}_{uuid.uuid4().hex[:8]}"


def generate_model_id(attack_id: str, round_num: int) -> str:
    """Generate a unique model identifier."""
    return f"{attack_id}_mdl_r{round_num}_{uuid.uuid4().hex[:8]}"


def generate_artifact_id(attack_id: str, artifact_type: str) -> str:
    """Generate a unique artifact identifier."""
    return f"{attack_id}_{artifact_type}_{uuid.uuid4().hex[:8]}"
