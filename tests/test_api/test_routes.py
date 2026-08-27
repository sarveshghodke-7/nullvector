"""Integration tests for the FastAPI routes."""
from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from backend.main import app

client = TestClient(app)


class TestHealthCheck:
    def test_root(self) -> None:
        resp = client.get("/")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "ok"


class TestAttackRoutes:
    def test_list_attacks(self) -> None:
        resp = client.get("/api/attacks")
        assert resp.status_code == 200
        data = resp.json()
        assert "attacks" in data
        ids = {a["attack_id"] for a in data["attacks"]}
        assert "card_testing" in ids

    def test_identify_card_testing(self) -> None:
        resp = client.post("/api/identify", json={"attack_id": "card_testing"})
        assert resp.status_code == 200
        data = resp.json()
        assert data["attack_id"] == "card_testing"
        assert data["stage"] == "identify"
        assert data["payload"]["attack_name"] == "LLM-Orchestrated Adaptive Card Testing"

    def test_identify_unknown_attack(self) -> None:
        resp = client.post("/api/identify", json={"attack_id": "nonexistent"})
        assert resp.status_code == 404

    def test_identify_stub_attack(self) -> None:
        resp = client.post("/api/identify", json={"attack_id": "deepfake"})
        assert resp.status_code == 404

    def test_get_run_not_found(self) -> None:
        resp = client.get("/api/runs/nonexistent_run")
        assert resp.status_code == 404
