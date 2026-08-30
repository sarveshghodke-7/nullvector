"""
Module: backend/orchestrator/attack_registry.py

Purpose:
Maintains the registry of all available attack plugins/modules.

Layer:
ORCHESTRATION

Inputs:
- Module identifiers

Outputs:
- Module references (classes or functions)

Expected responsibilities:
- Register and resolve generators, detectors, and evaluators for each attack type

This module must not:
- Execute the plugins directly

Related modules:
- backend/orchestrator/pipeline.py
- backend/attacks/*

Attack association:
N/A

Pipeline stage:
N/A

Status: Executable registry.
"""

from ..core import ATTACKS


def get_attack(attack_id: str) -> dict:
	"""Resolve an attack definition or raise a clean domain error."""
	try:
		return ATTACKS[attack_id]
	except KeyError as exc:
		raise ValueError(f"Unsupported attack: {attack_id}") from exc


def list_attacks() -> list[dict]:
	return [{"id": attack_id, **definition} for attack_id, definition in ATTACKS.items()]

