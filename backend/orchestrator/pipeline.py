"""
Module: backend/orchestrator/pipeline.py

Purpose:
Manages the end-to-end workflow by calling appropriate attack modules in sequence.

Layer:
ORCHESTRATION

Inputs:
- Validated API requests
- Attack configurations

Outputs:
- Aggregated results and metadata

Expected responsibilities:
- Manage run IDs
- Route requests to the correct attack plugin via the registry
- Enforce the generate -> detect -> evaluate -> feedback sequence

This module must not:
- Implement specific attack logic
- Handle HTTP requests

Related modules:
- backend/orchestrator/attack_registry.py
- backend/attacks/*

Attack association:
N/A

Pipeline stage:
N/A

Status: Executable pipeline facade.
"""

from ..schemas.api import AttackConfig
from ..service import detect, generate


class Pipeline:
	"""Independently callable generate/detect boundary used by the API."""

	def generate(self, attack_id: str, config: AttackConfig) -> dict:
		return generate(attack_id, config)

	def detect(self, attack_id: str, run_id: str, model_version: str | None = None) -> dict:
		return detect(attack_id, run_id, model_version)


pipeline = Pipeline()

