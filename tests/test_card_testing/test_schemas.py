"""Tests for Pydantic schemas."""
from __future__ import annotations

from datetime import datetime

from backend.schemas.common import (
    ConfusionMatrix,
    DetectionMetrics,
    PipelineEnvelope,
    RiskTier,
)
from backend.schemas.detect import DetectResponse, PredictionResult
from backend.schemas.evaluation import EvaluationResponse
from backend.schemas.feedback import FeedbackResponse
from backend.schemas.generate import FidelityReport, GenerateResponse
from backend.schemas.identify import IdentifyPayload


class TestPipelineEnvelope:
    """Validate the common pipeline envelope."""

    def test_create_envelope(self) -> None:
        env = PipelineEnvelope(
            run_id="run_001",
            attack_id="card_testing",
            stage="identify",
            payload={"key": "value"},
        )
        assert env.schema_version == "1.0"
        assert env.run_id == "run_001"
        assert env.attack_id == "card_testing"
        assert env.stage == "identify"
        assert isinstance(env.timestamp, datetime)

    def test_envelope_serialization(self) -> None:
        env = PipelineEnvelope(
            run_id="run_002",
            attack_id="card_testing",
            stage="generate",
        )
        data = env.model_dump()
        assert data["schema_version"] == "1.0"
        assert data["run_id"] == "run_002"
        restored = PipelineEnvelope(**data)
        assert restored.run_id == env.run_id


class TestConfusionMatrix:
    """Validate confusion matrix computed fields."""

    def test_computed_fields(self) -> None:
        cm = ConfusionMatrix(tp=50, tn=900, fp=10, fn=40)
        assert cm.total == 1000
        assert cm.accuracy == 0.95

    def test_zero_division(self) -> None:
        cm = ConfusionMatrix()
        assert cm.total == 0
        assert cm.accuracy == 0.0


class TestRiskTier:
    """Validate risk tier enum."""

    def test_values(self) -> None:
        assert RiskTier.ALLOW == "ALLOW"
        assert RiskTier.CHALLENGE == "CHALLENGE"
        assert RiskTier.BLOCK == "BLOCK"


class TestDetectionMetrics:
    """Validate detection metrics."""

    def test_defaults(self) -> None:
        m = DetectionMetrics()
        assert m.precision == 0.0
        assert m.attack_success_rate is None

    def test_with_values(self) -> None:
        m = DetectionMetrics(
            precision=0.91, recall=0.85, f1=0.88,
            auc_roc=0.94, fp_rate=0.03,
            attack_success_rate=0.12,
        )
        assert m.f1 == 0.88
        assert m.attack_success_rate == 0.12


class TestIdentifyPayload:
    def test_create(self) -> None:
        p = IdentifyPayload(
            attack_name="test",
            target="payment",
            channel="cnp",
            objectives=["obj1"],
            artifacts=["art1"],
            generation_strategy="gen",
            detection_strategy="det",
        )
        assert p.attack_name == "test"


class TestGenerateResponse:
    def test_create(self) -> None:
        r = GenerateResponse(
            dataset_id="ds_001",
            sample_count=100,
            transaction_count=5100,
            data_location="data/generated/test",
        )
        assert r.sample_count == 100
        assert r.fidelity_report.passed_gate is True


class TestFidelityReport:
    def test_gate_logic(self) -> None:
        passing = FidelityReport(discriminator_accuracy=0.7, passed_gate=True)
        assert passing.passed_gate is True
        failing = FidelityReport(discriminator_accuracy=0.98, passed_gate=False)
        assert failing.passed_gate is False


class TestDetectResponse:
    def test_with_predictions(self) -> None:
        pred = PredictionResult(
            transaction_id="txn_001",
            risk_score=0.82,
            risk_tier=RiskTier.BLOCK,
            shap_top_features=["probe_count_1h"],
        )
        resp = DetectResponse(
            round=1,
            model_id="model_001",
            predictions_location="data/results/run_001/preds.csv",
            predictions_sample=[pred],
        )
        assert resp.predictions_sample[0].risk_tier == RiskTier.BLOCK


class TestEvaluationResponse:
    def test_defaults(self) -> None:
        r = EvaluationResponse()
        assert r.samples_evaluated == 0


class TestFeedbackResponse:
    def test_defaults(self) -> None:
        r = FeedbackResponse()
        assert r.recommended_action == "generate_harder_variants"
