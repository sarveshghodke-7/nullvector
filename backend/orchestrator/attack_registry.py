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

Status: Architecture defined; implementation pending.
"""

