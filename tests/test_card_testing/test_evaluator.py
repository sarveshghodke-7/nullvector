"""Tests for evaluation metrics."""
from __future__ import annotations

import numpy as np
import pandas as pd
import pytest

from backend.attacks.card_testing.evaluator import evaluate


class TestEvaluator:
    """Tests for metrics computation."""

    def test_known_confusion_matrix(self) -> None:
        """Metrics should match hand-computed values for a known matrix."""
        # TP=80, TN=900, FP=20, FN=0 -> perfect recall
        n = 1000
        df = pd.DataFrame({
            "ground_truth": [1]*80 + [0]*920,
            "risk_score": [0.9]*80 + [0.8]*20 + [0.1]*900,
            "risk_tier": ["BLOCK"]*80 + ["BLOCK"]*20 + ["ALLOW"]*900,
        })

        result = evaluate(df, thresholds={"allow_below": 0.3, "block_above": 0.7})

        assert result.confusion_matrix.tp == 80
        assert result.confusion_matrix.tn == 900
        assert result.confusion_matrix.fp == 20
        assert result.confusion_matrix.fn == 0
        assert result.metrics.recall == 1.0
        assert result.metrics.precision == pytest.approx(80 / 100, abs=0.01)

    def test_per_tier_stop_rate_sums(self) -> None:
        """Per-tier stop rates for attack rows should sum to ~1.0."""
        df = pd.DataFrame({
            "ground_truth": [1]*30 + [0]*70,
            "risk_score": [0.9]*10 + [0.5]*10 + [0.1]*10 + [0.1]*70,
            "risk_tier": ["BLOCK"]*10 + ["CHALLENGE"]*10 + ["ALLOW"]*10 + ["ALLOW"]*70,
        })
        result = evaluate(df, thresholds={"allow_below": 0.3, "block_above": 0.7})
        tier_sum = sum(result.per_tier_stop_rate.values())
        assert tier_sum == pytest.approx(1.0, abs=0.01)

    def test_attack_success_rate(self) -> None:
        """Attack success rate = FN / (FN + TP)."""
        # 10 attacks blocked, 5 attacks allowed (evasions)
        df = pd.DataFrame({
            "ground_truth": [1]*15 + [0]*85,
            "risk_score": [0.9]*10 + [0.1]*5 + [0.1]*85,
            "risk_tier": ["BLOCK"]*10 + ["ALLOW"]*5 + ["ALLOW"]*85,
        })
        result = evaluate(df, thresholds={"allow_below": 0.3, "block_above": 0.7})
        # FN=5, TP=10 => attack_success_rate = 5/15 = 0.333
        assert result.metrics.attack_success_rate == pytest.approx(5/15, abs=0.01)

    def test_fp_rate(self) -> None:
        """FP rate = FP / (FP + TN)."""
        df = pd.DataFrame({
            "ground_truth": [1]*10 + [0]*90,
            "risk_score": [0.9]*10 + [0.8]*9 + [0.1]*81,
            "risk_tier": ["BLOCK"]*10 + ["BLOCK"]*9 + ["ALLOW"]*81,
        })
        result = evaluate(df, thresholds={"allow_below": 0.3, "block_above": 0.7})
        # FP=9, TN=81 => fp_rate = 9/90 = 0.1
        assert result.metrics.fp_rate == pytest.approx(9/90, abs=0.01)
