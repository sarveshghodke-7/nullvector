"""
Module: backend/api/routes/feedback.py

Purpose:
Exposes REST API endpoints for the 'feedback' stage of the closed-loop pipeline.

Layer:
API

Inputs:
- HTTP requests with JSON payload conforming to feedback schemas

Outputs:
- HTTP responses with execution results for feedback

Expected responsibilities:
- Validate incoming HTTP requests
- Call the corresponding orchestrator feedback function
- Return standard HTTP responses

This module must not:
- Execute attack or detection algorithms
- Connect to the database directly
- Manage the end-to-end pipeline

Related modules:
- backend/orchestrator/pipeline.py
- backend/schemas/feedback.py

Attack association:
N/A

Pipeline stage:
FEEDBACK

Status: Architecture defined; implementation pending.
"""

