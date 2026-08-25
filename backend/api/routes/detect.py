"""
Module: backend/api/routes/detect.py

Purpose:
Exposes REST API endpoints for the 'detect' stage of the closed-loop pipeline.

Layer:
API

Inputs:
- HTTP requests with JSON payload conforming to detect schemas

Outputs:
- HTTP responses with execution results for detect

Expected responsibilities:
- Validate incoming HTTP requests
- Call the corresponding orchestrator detect function
- Return standard HTTP responses

This module must not:
- Execute attack or detection algorithms
- Connect to the database directly
- Manage the end-to-end pipeline

Related modules:
- backend/orchestrator/pipeline.py
- backend/schemas/detect.py

Attack association:
N/A

Pipeline stage:
DETECT

Status: Architecture defined; implementation pending.
"""

