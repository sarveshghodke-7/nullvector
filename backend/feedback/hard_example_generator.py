"""
Module: backend/feedback/hard_example_generator.py

Purpose:
Converts analysis of missed attacks into parameters for harder attack generation.

Layer:
FEEDBACK

Inputs:
- Evaluation metrics and false negative datasets

Outputs:
- Feedback directives or updated models

Expected responsibilities:
- Interface with the LLM or statistical tools to propose augmented attack variants

This module must not:
- Manage initial attack generation
- Route HTTP requests

Related modules:
- backend/orchestrator/pipeline.py
- backend/attacks/*/generator.py

Attack association:
N/A

Pipeline stage:
FEEDBACK

Status: Architecture defined; implementation pending.
"""

