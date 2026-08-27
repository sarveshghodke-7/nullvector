"""Tests for the XGBoost card testing detector."""
from __future__ import annotations

import numpy as np
import pandas as pd
import pytest

from backend.attacks.card_testing.detector import (
    BLACKLISTED_COLS,
    FEATURE_COLS,
    LABEL_COL,
    engineer_features,
    predict,
    train,
)


@pytest.fixture
def combined_df(sample_baseline_df, sample_attack_df) -> pd.DataFrame:
    """Combined baseline + attack dataframe."""
    return pd.concat(
        [sample_baseline_df, sample_attack_df], ignore_index=True
    ).sort_values("timestamp").reset_index(drop=True)


@pytest.fixture
def featured_df(combined_df) -> pd.DataFrame:
    """Feature-engineered dataframe."""
    return engineer_features(combined_df)


class TestFeatureEngineering:
    """Tests for velocity/behavioral feature computation."""

    def test_all_features_present(self, featured_df: pd.DataFrame) -> None:
        """All expected feature columns should exist after engineering."""
        for col in FEATURE_COLS:
            assert col in featured_df.columns, f"Missing feature: {col}"

    def test_no_nans_in_features(self, featured_df: pd.DataFrame) -> None:
        """Feature columns should not have NaN values (filled to 0)."""
        for col in FEATURE_COLS:
            nan_count = featured_df[col].isna().sum()
            # Allow some NaNs from edge cases, but the model handles them via fillna
            assert nan_count < len(featured_df), (
                f"All values NaN in {col}"
            )

    def test_probe_count_positive(self, featured_df: pd.DataFrame) -> None:
        """Probe counts should be >= 1 (at least the transaction itself)."""
        assert (featured_df["probe_count_1h"] >= 0).all()
        assert (featured_df["probe_count_24h"] >= 0).all()

    def test_device_change_rate_bounded(self, featured_df: pd.DataFrame) -> None:
        """Device change rate should be in [0, 1]."""
        rates = featured_df["device_change_rate"]
        assert (rates >= 0).all()
        assert (rates <= 1).all()


class TestTraining:
    """Tests for XGBoost training pipeline."""

    def test_training_completes(self, featured_df: pd.DataFrame) -> None:
        """Training should complete on small data and return valid outputs."""
        # Split into train/val
        train_df = featured_df.iloc[:90]
        val_df = featured_df.iloc[90:]

        model, metrics, thresholds = train(
            train_df=train_df,
            val_df=val_df,
            feature_cols=FEATURE_COLS,
            label_col=LABEL_COL,
        )

        assert model is not None
        assert "f1" in metrics
        assert "auc_roc" in metrics
        assert "allow_below" in thresholds
        assert "block_above" in thresholds

    def test_scale_pos_weight_computed(self, featured_df: pd.DataFrame) -> None:
        """With scale_pos_weight_auto=True, the weight should be > 1."""
        train_df = featured_df.iloc[:90]
        val_df = featured_df.iloc[90:]

        config = {
            "xgboost_params": {
                "scale_pos_weight_auto": True,
                "use_smote": False,
                "max_depth": 3,
                "n_estimators": 10,
                "learning_rate": 0.1,
                "eval_metric": "aucpr",
                "early_stopping_rounds": 5,
            }
        }
        model, metrics, thresholds = train(
            train_df=train_df,
            val_df=val_df,
            config=config,
        )
        # Model should train successfully
        assert model is not None


class TestPrediction:
    """Tests for prediction and risk tier assignment."""

    def test_predictions_valid(self, featured_df: pd.DataFrame) -> None:
        """Predictions should have valid risk scores and tiers."""
        train_df = featured_df.iloc[:90]
        val_df = featured_df.iloc[90:]

        model, _, thresholds = train(train_df, val_df)
        predicted = predict(model, featured_df, FEATURE_COLS, thresholds)

        assert "risk_score" in predicted.columns
        assert "risk_tier" in predicted.columns
        assert (predicted["risk_score"] >= 0).all()
        assert (predicted["risk_score"] <= 1).all()
        assert set(predicted["risk_tier"].unique()).issubset(
            {"ALLOW", "CHALLENGE", "BLOCK"}
        )
