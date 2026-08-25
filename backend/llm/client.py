"""
Module: backend/llm/client.py

Purpose:
Provider-agnostic client wrapper for interacting with Large Language Models.

Layer:
LLM

Inputs:
- Prompts and context variables

Outputs:
- Generated text or structured JSON from the LLM

Expected responsibilities:
- Route requests to OpenAI/Anthropic/Local LLMs
- Handle API keys, retries, and rate limits appropriately

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

