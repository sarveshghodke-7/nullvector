"""
Module: backend/api/routes/results.py

Purpose:
Exposes REST API endpoints for the 'results' stage of the closed-loop pipeline.

Layer:
API

Inputs:
- HTTP requests with JSON payload conforming to results schemas

Outputs:
- HTTP responses with execution results for results

Expected responsibilities:
- Validate incoming HTTP requests
- Call the corresponding orchestrator results function
- Return standard HTTP responses

This module must not:
- Execute attack or detection algorithms
- Connect to the database directly
- Manage the end-to-end pipeline

Related modules:
- backend/orchestrator/pipeline.py
- backend/schemas/results.py

Attack association:
N/A

Pipeline stage:
RESULTS

Status: Architecture defined; implementation pending.
"""

