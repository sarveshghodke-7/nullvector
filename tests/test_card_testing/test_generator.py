"""Tests for the card testing generator."""
from __future__ import annotations

import numpy as np
import pandas as pd
import pytest

from backend.attacks.card_testing.generator import (
    compute_fidelity,
    create_entity_pools,
    expand_strategy_to_rows,
    generate_baseline_traffic,
)


class TestBaselineGeneration:
    """Tests for legitimate baseline traffic generation."""

    def test_baseline_count(self, sample_config: dict) -> None:
        pools = create_entity_pools(sample_config)
        df = generate_baseline_traffic(pools["train"], sample_config, n_transactions=200)
        assert len(df) == 200

    def test_baseline_labels(self, sample_config: dict) -> None:
        pools = create_entity_pools(sample_config)
        df = generate_baseline_traffic(pools["train"], sample_config, n_transactions=50)
        assert (df["ground_truth"] == 0).all()
        assert (df["attack_type"] == "legitimate").all()

    def test_baseline_accounts_from_pool(self, sample_config: dict) -> None:
        pools = create_entity_pools(sample_config)
        df = generate_baseline_traffic(pools["train"], sample_config, n_transactions=100)
        assert set(df["account_id"].unique()).issubset(pools["train"])


class TestRowExpansion:
    """Tests for strategy-to-rows expansion."""

    def test_probe_count_within_bounds(self, sample_config: dict) -> None:
        pools = create_entity_pools(sample_config)
        strategy = {
            "amount_range": [0.50, 3.00],
            "target_mccs": ["5411", "5812"],
            "probe_count": 50,
            "time_window_minutes": 60,
            "device_rotation_cadence": 10,
            "pacing_seconds_between_probes": 5.0,
        }
        df = expand_strategy_to_rows(strategy, pools["train"], round_num=1, config=sample_config)
        assert len(df) == 50

    def test_amounts_in_range(self, sample_config: dict) -> None:
        pools = create_entity_pools(sample_config)
        strategy = {
            "amount_range": [1.00, 2.00],
            "target_mccs": ["5411"],
            "probe_count": 100,
            "time_window_minutes": 60,
            "device_rotation_cadence": 10,
            "pacing_seconds_between_probes": 5.0,
        }
        df = expand_strategy_to_rows(strategy, pools["train"], round_num=1, config=sample_config)
        assert df["amount"].min() >= 1.00
        assert df["amount"].max() <= 2.00

    def test_mccs_from_strategy(self, sample_config: dict) -> None:
        pools = create_entity_pools(sample_config)
        target_mccs = ["5812", "5941"]
        strategy = {
            "amount_range": [0.50, 5.00],
            "target_mccs": target_mccs,
            "probe_count": 40,
            "time_window_minutes": 60,
            "device_rotation_cadence": 10,
            "pacing_seconds_between_probes": 5.0,
        }
        df = expand_strategy_to_rows(strategy, pools["train"], round_num=1, config=sample_config)
        assert set(df["merchant_category"].unique()).issubset(set(target_mccs))

    def test_attack_labels(self, sample_config: dict) -> None:
        pools = create_entity_pools(sample_config)
        strategy = {
            "amount_range": [0.50, 5.00],
            "target_mccs": ["5411"],
            "probe_count": 20,
            "time_window_minutes": 60,
            "device_rotation_cadence": 10,
            "pacing_seconds_between_probes": 5.0,
        }
        df = expand_strategy_to_rows(strategy, pools["train"], round_num=1, config=sample_config)
        assert (df["ground_truth"] == 1).all()
        assert (df["attack_type"] == "card_testing").all()

    def test_max_probes_capped(self, sample_config: dict) -> None:
        pools = create_entity_pools(sample_config)
        strategy = {
            "amount_range": [0.50, 5.00],
            "target_mccs": ["5411"],
            "probe_count": 9999,  # Exceeds max
            "time_window_minutes": 60,
            "device_rotation_cadence": 10,
            "pacing_seconds_between_probes": 5.0,
        }
        df = expand_strategy_to_rows(strategy, pools["train"], round_num=1, config=sample_config)
        assert len(df) <= sample_config["max_probes_per_round"]


class TestFidelityScoring:
    """Tests for the fidelity gate."""

    def test_similar_distributions_pass(self, sample_config: dict) -> None:
        """Data from similar distributions should pass the gate."""
        rng = np.random.RandomState(42)
        baseline = pd.DataFrame({
            "amount": rng.lognormal(3.5, 1.2, 200).round(2),
            "merchant_category": rng.choice(["5411", "5812", "5941"], 200),
        })
        synthetic = pd.DataFrame({
            "amount": rng.lognormal(3.5, 1.2, 50).round(2),
            "merchant_category": rng.choice(["5411", "5812", "5941"], 50),
        })
        report = compute_fidelity(synthetic, baseline, sample_config)
        # The gate should pass since distributions are similar
        assert report.discriminator_accuracy < 1.0

    def test_trivially_separable_fails(self, sample_config: dict) -> None:
        """Trivially separable data should fail the fidelity gate."""
        baseline = pd.DataFrame({
            "amount": [100.0] * 200,
            "merchant_category": ["5411"] * 200,
        })
        synthetic = pd.DataFrame({
            "amount": [0.01] * 200,
            "merchant_category": ["9999"] * 200,
        })
        config = {**sample_config, "fidelity_gate_threshold": 0.95}
        report = compute_fidelity(synthetic, baseline, config)
        assert report.discriminator_accuracy > 0.9
