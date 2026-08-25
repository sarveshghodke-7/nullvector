"""
Module: backend/llm/prompts.py

Purpose:
Centralized repository of prompt templates used across the application.

Layer:
LLM

Inputs:
- Prompts and context variables

Outputs:
- Generated text or structured JSON from the LLM

Expected responsibilities:
- Store and format system instructions and few-shot examples

This module must not:
- Detect fraud on large tabular datasets
- Act as the primary fraud detection model

Related modules:
- backend/attacks/*/generator.py
- backend/feedback/hard_example_generator.py

Attack association:
N/A

Pipeline stage:
N/A

Status: Architecture defined; implementation pending.
"""

