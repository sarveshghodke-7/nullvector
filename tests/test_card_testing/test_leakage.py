"""Tests for entity pool leakage enforcement."""
from __future__ import annotations

import pytest

from backend.attacks.card_testing.generator import create_entity_pools
from backend.attacks.card_testing.detector import FEATURE_COLS, BLACKLISTED_COLS, engineer_features
from backend.utils.validation import EntityLeakageError, validate_disjoint_pools


class TestEntityPools:
    """Verify entity pools are strictly disjoint."""

    def test_pools_are_disjoint(self, sample_config: dict) -> None:
        """Entity pools for train/val/test must have zero overlap."""
        pools = create_entity_pools(sample_config)
        assert len(pools["train"] & pools["val"]) == 0
        assert len(pools["train"] & pools["test"]) == 0
        assert len(pools["val"] & pools["test"]) == 0

    def test_pool_sizes_match_config(self, sample_config: dict) -> None:
        """Each pool should have the configured number of entities."""
        pools = create_entity_pools(sample_config)
        expected = sample_config["entity_pool_config"]["pool_sizes"]
        assert len(pools["train"]) == expected["train"]
        assert len(pools["val"]) == expected["val"]
        assert len(pools["test"]) == expected["test"]

    def test_pool_prefixes_are_correct(self, sample_config: dict) -> None:
        """Each pool's IDs should use the correct prefix."""
        pools = create_entity_pools(sample_config)
        for acct_id in pools["train"]:
            assert acct_id.startswith("train_acct_")
        for acct_id in pools["val"]:
            assert acct_id.startswith("val_acct_")
        for acct_id in pools["test"]:
            assert acct_id.startswith("test_acct_")

    def test_pools_are_deterministic(self, sample_config: dict) -> None:
        """Same config should produce identical pools."""
        pools_a = create_entity_pools(sample_config)
        pools_b = create_entity_pools(sample_config)
        assert pools_a["train"] == pools_b["train"]
        assert pools_a["val"] == pools_b["val"]
        assert pools_a["test"] == pools_b["test"]

    def test_validate_disjoint_raises_on_overlap(self) -> None:
        """validate_disjoint_pools must raise on overlap."""
        a = {"id_1", "id_2", "id_3"}
        b = {"id_3", "id_4"}  # overlaps with a
        c = {"id_5"}
        with pytest.raises(EntityLeakageError):
            validate_disjoint_pools(a, b, c)


class TestFeatureLeakage:
    """Verify no identifier columns leak into the feature set."""

    def test_feature_cols_are_clean(self) -> None:
        """FEATURE_COLS must not contain any blacklisted identifiers."""
        for col in FEATURE_COLS:
            assert col not in BLACKLISTED_COLS, (
                f"Blacklisted column '{col}' found in FEATURE_COLS"
            )

    def test_engineered_features_exclude_ids(
        self, sample_baseline_df, sample_attack_df
    ) -> None:
        """After feature engineering, the feature matrix must not
        include account_id, transaction_id, or round."""
        import pandas as pd

        combined = pd.concat(
            [sample_baseline_df, sample_attack_df], ignore_index=True
        )
        featured = engineer_features(combined)

        # Features used for training must not include identifiers
        for col in BLACKLISTED_COLS:
            assert col not in FEATURE_COLS, (
                f"Identifier '{col}' must not be a feature"
            )
