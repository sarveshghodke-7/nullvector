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

Status: Architecture defined; implementation pending.
"""

