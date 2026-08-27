"""Shared test fixtures for AI Defense Lab."""
from __future__ import annotations

import json
import tempfile
from pathlib import Path

import numpy as np
import pandas as pd
import pytest


@pytest.fixture
def sample_config() -> dict:
    """Load the card testing config."""
    config_path = Path(__file__).parent.parent / "backend" / "attacks" / "card_testing" / "config.json"
    return json.loads(config_path.read_text())


@pytest.fixture
def sample_baseline_df() -> pd.DataFrame:
    """Create a small baseline transaction DataFrame for testing."""
    rng = np.random.RandomState(42)
    n = 100
    return pd.DataFrame({
        "transaction_id": [f"txn_{i:04d}" for i in range(n)],
        "account_id": [f"train_acct_{i % 20:04d}" for i in range(n)],
        "round": [0] * n,
        "amount": rng.lognormal(3.5, 1.2, n).clip(0.5, 5000).round(2),
        "merchant_category": rng.choice(["5411", "5812", "5941", "4899"], n),
        "timestamp": pd.date_range("2026-01-01", periods=n, freq="30min").astype(str).tolist(),
        "device_fingerprint": [f"dev_{i % 10:04d}" for i in range(n)],
        "attack_type": ["legitimate"] * n,
        "ground_truth": [0] * n,
    })


@pytest.fixture
def sample_attack_df() -> pd.DataFrame:
    """Create a small attack transaction DataFrame for testing."""
    rng = np.random.RandomState(99)
    n = 30
    return pd.DataFrame({
        "transaction_id": [f"probe_1_{i:04d}" for i in range(n)],
        "account_id": [f"train_acct_{i % 5 + 20:04d}" for i in range(n)],
        "round": [1] * n,
        "amount": rng.uniform(0.50, 5.00, n).round(2),
        "merchant_category": rng.choice(["5411", "5812"], n),
        "timestamp": pd.date_range("2026-01-15 10:00", periods=n, freq="2min").astype(str).tolist(),
        "device_fingerprint": [f"atk_dev_{i % 2:04d}" for i in range(n)],
        "attack_type": ["card_testing"] * n,
        "ground_truth": [1] * n,
    })


@pytest.fixture
def tmp_data_dir(tmp_path: Path) -> Path:
    """Create a temporary data directory."""
    data_dir = tmp_path / "data"
    data_dir.mkdir()
    return data_dir
