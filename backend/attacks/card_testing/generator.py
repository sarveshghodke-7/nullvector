"""Attack data generator for card testing.

Responsibilities:
1. Entity pool management with leakage enforcement
2. Baseline legitimate traffic generation (Faker + numpy, calibrated to IEEE-CIS)
3. LLM strategy integration
4. Deterministic row expansion (Faker + Pandas, no LLM per row)
5. Fidelity scoring (KS-test + discriminator)
"""
from __future__ import annotations

import uuid
from datetime import datetime, timedelta
from typing import Any

import numpy as np
import pandas as pd
from faker import Faker
from scipy import stats
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import cross_val_score
from sklearn.preprocessing import LabelEncoder

from backend.llm.client import get_llm_client
from backend.schemas.generate import FidelityReport, GenerateResponse
from backend.storage.files import get_generated_dir, save_dataframe
from backend.utils.ids import generate_dataset_id
from backend.utils.logging import get_logger
from backend.utils.validation import EntityLeakageError, validate_disjoint_pools

logger = get_logger(__name__)
fake = Faker()
Faker.seed(42)

# ─────────────────── Entity Pool Management ───────────────────

def create_entity_pools(config: dict) -> dict[str, set[str]]:
    """Create three disjoint sets of account_id values for train/val/test.

    Uses deterministic UUID generation seeded from config to ensure
    reproducibility. Validates disjointness immediately after creation.

    Returns dict with keys 'train', 'val', 'test' mapping to sets of account IDs.
    """
    import random as pyrandom

    pool_config = config["entity_pool_config"]
    pools: dict[str, set[str]] = {}

    for split in ["train", "val", "test"]:
        prefix = pool_config[f"{split}_pool_prefix"]
        size = pool_config["pool_sizes"][split]
        # Use deterministic seeds per split (Python random supports large ints)
        seed = hash(split) % (2**31)
        local_rng = pyrandom.Random(seed)
        ids = set()
        while len(ids) < size:
            uid = uuid.UUID(int=local_rng.getrandbits(128)).hex[:12]
            ids.add(f"{prefix}{uid}")
        pools[split] = ids

    # Enforce disjointness
    validate_disjoint_pools(pools["train"], pools["val"], pools["test"])
    logger.info(
        f"Created entity pools: train={len(pools['train'])}, "
        f"val={len(pools['val'])}, test={len(pools['test'])}"
    )
    return pools


# ─────────────────── Baseline Traffic Generation ───────────────────

def generate_baseline_traffic(
    entity_pool: set[str],
    config: dict,
    n_transactions: int | None = None,
) -> pd.DataFrame:
    """Generate legitimate transaction rows calibrated to IEEE-CIS distributions.

    Amount distribution: log-normal (median ~$33, long tail to $1000+)
    MCC distribution: weighted categorical
    Timestamps: uniform within business hours over 30 days
    Device fingerprints: realistic reuse patterns (200 unique devices)
    """
    n = n_transactions or config.get("baseline_legitimate_count", 5000)
    accounts = list(entity_pool)
    rng = np.random.RandomState(42)

    # MCC distribution calibrated to IEEE-CIS ProductCD frequencies
    mccs = ["5411", "5812", "5941", "4899", "5311", "5691"]
    mcc_weights = [0.35, 0.20, 0.10, 0.10, 0.15, 0.10]

    # Generate amounts: log-normal distribution
    amounts = np.exp(rng.normal(loc=3.5, scale=1.2, size=n))
    amounts = np.clip(amounts, 0.50, 5000.00)
    amounts = np.round(amounts, 2)

    # Generate timestamps: business hours over 30 days
    base_time = datetime(2026, 1, 1, 0, 0, 0)
    timestamps = []
    for _ in range(n):
        day_offset = rng.randint(0, 30)
        hour = rng.randint(8, 22)  # Business hours
        minute = rng.randint(0, 60)
        second = rng.randint(0, 60)
        ts = base_time + timedelta(
            days=day_offset, hours=hour, minutes=minute, seconds=second
        )
        timestamps.append(ts)

    # Generate device fingerprints (200 unique, realistic reuse)
    n_devices = min(200, len(accounts))
    device_pool = [f"dev_{uuid.uuid4().hex[:8]}" for _ in range(n_devices)]

    rows = []
    for i in range(n):
        rows.append({
            "transaction_id": f"txn_{uuid.uuid4().hex[:10]}",
            "account_id": rng.choice(accounts),
            "round": 0,
            "amount": float(amounts[i]),
            "merchant_category": rng.choice(mccs, p=mcc_weights),
            "timestamp": timestamps[i].isoformat(),
            "device_fingerprint": rng.choice(device_pool),
            "attack_type": "legitimate",
            "ground_truth": 0,
        })

    df = pd.DataFrame(rows)
    df = df.sort_values("timestamp").reset_index(drop=True)
    logger.info(f"Generated {len(df)} baseline legitimate transactions")
    return df


# ─────────────────── LLM Strategy Integration ───────────────────

async def get_round_strategy(
    round_num: int,
    previous_outcome_summary: dict[str, Any] | None,
    config: dict,
) -> dict[str, Any]:
    """Get the attack strategy for a round, via LLM or fallback."""
    client = get_llm_client()
    strategy = await client.generate_strategy(
        attack_id=config["attack_id"],
        previous_outcome_summary=previous_outcome_summary,
        round_num=round_num,
    )
    logger.info(
        f"Round {round_num} strategy: amounts={strategy.get('amount_range')}, "
        f"mccs={strategy.get('target_mccs')}, probes={strategy.get('probe_count')}"
    )
    return strategy


# ─────────────────── Row Expansion ───────────────────

def expand_strategy_to_rows(
    strategy: dict[str, Any],
    entity_pool: set[str],
    round_num: int,
    config: dict,
) -> pd.DataFrame:
    """Expand an LLM strategy into concrete transaction rows.

    No LLM calls here — purely deterministic Faker + Pandas expansion.
    """
    accounts = list(entity_pool)
    rng = np.random.RandomState(round_num * 1000)

    probe_count = min(
        strategy.get("probe_count", 100),
        config.get("max_probes_per_round", 200),
    )
    amount_range = strategy.get("amount_range", config["amount_range"])
    target_mccs = strategy.get("target_mccs", config["default_mcc_pool"])
    time_window = strategy.get("time_window_minutes", 60)
    device_cadence = strategy.get("device_rotation_cadence", 10)
    pacing = strategy.get("pacing_seconds_between_probes", 5.0)

    # Generate amounts uniformly within strategy range
    amounts = rng.uniform(amount_range[0], amount_range[1], size=probe_count)
    amounts = np.round(amounts, 2)

    # Generate timestamps
    base_time = datetime(2026, 1, 15, 10, 0, 0)
    timestamps = []
    for i in range(probe_count):
        offset_secs = i * pacing + rng.normal(0, pacing * 0.1)
        offset_secs = max(0, offset_secs)
        ts = base_time + timedelta(seconds=offset_secs)
        timestamps.append(ts)

    # Generate device fingerprints with rotation
    devices = []
    current_device = f"atk_dev_{uuid.uuid4().hex[:8]}"
    for i in range(probe_count):
        if i > 0 and i % device_cadence == 0:
            current_device = f"atk_dev_{uuid.uuid4().hex[:8]}"
        devices.append(current_device)

    # Select accounts — each probe targets a random account from the pool
    selected_accounts = [rng.choice(accounts) for _ in range(probe_count)]

    rows = []
    for i in range(probe_count):
        rows.append({
            "transaction_id": f"probe_{round_num}_{uuid.uuid4().hex[:10]}",
            "account_id": selected_accounts[i],
            "round": round_num,
            "amount": float(amounts[i]),
            "merchant_category": rng.choice(target_mccs),
            "timestamp": timestamps[i].isoformat(),
            "device_fingerprint": devices[i],
            "attack_type": "card_testing",
            "ground_truth": 1,
        })

    df = pd.DataFrame(rows)
    logger.info(
        f"Expanded round {round_num} strategy to {len(df)} attack rows"
    )
    return df


# ─────────────────── Fidelity Scoring ───────────────────

def compute_fidelity(
    synthetic_df: pd.DataFrame,
    baseline_df: pd.DataFrame,
    config: dict,
) -> FidelityReport:
    """Assess statistical fidelity of generated data.

    Uses KS-test on amounts and a logistic regression discriminator.
    If discriminator accuracy > threshold, the gate fails (data is trivially separable).
    """
    # KS-test on amount distributions
    ks_stat, ks_pval = stats.ks_2samp(
        synthetic_df["amount"].values,
        baseline_df["amount"].values,
    )

    # Discriminator: can a simple model tell synthetic from real?
    combined = pd.concat([
        baseline_df.assign(_is_synthetic=0),
        synthetic_df.assign(_is_synthetic=1),
    ], ignore_index=True)

    # Features for discriminator
    features = ["amount"]
    if "merchant_category" in combined.columns:
        le = LabelEncoder()
        combined["_mcc_encoded"] = le.fit_transform(
            combined["merchant_category"].astype(str)
        )
        features.append("_mcc_encoded")

    X = combined[features].fillna(0).values
    y = combined["_is_synthetic"].values

    if len(X) < 10:
        disc_accuracy = 0.5
    else:
        clf = LogisticRegression(max_iter=200, random_state=42)
        n_splits = min(5, min(int((y == 0).sum()), int((y == 1).sum())))
        if n_splits < 2:
            disc_accuracy = 0.5
        else:
            scores = cross_val_score(clf, X, y, cv=n_splits, scoring="accuracy")
            disc_accuracy = float(scores.mean())

    gate_threshold = config.get("fidelity_gate_threshold", 0.95)
    passed = disc_accuracy < gate_threshold

    report = FidelityReport(
        ks_statistic=float(ks_stat),
        ks_pvalue=float(ks_pval),
        discriminator_accuracy=round(disc_accuracy, 4),
        passed_gate=passed,
    )

    if not passed:
        logger.warning(
            f"Fidelity gate FAILED: discriminator accuracy={disc_accuracy:.4f} "
            f">= threshold={gate_threshold}"
        )
    else:
        logger.info(
            f"Fidelity gate passed: discriminator accuracy={disc_accuracy:.4f}"
        )

    return report


# ─────────────────── Main Generate Entry Point ───────────────────

async def generate(
    run_id: str,
    round_num: int,
    previous_outcome_summary: dict[str, Any] | None,
    entity_pool: set[str],
    baseline_df: pd.DataFrame,
    config: dict,
    probe_count: int | None = None,
    mcc_pool: list[str] | None = None,
) -> tuple[pd.DataFrame, GenerateResponse]:
    """Generate attack data for a round.

    Returns the combined dataset (baseline + attack) and metadata.
    """
    # Get strategy
    strategy = await get_round_strategy(
        round_num, previous_outcome_summary, config
    )

    # Override strategy fields if explicitly provided
    if probe_count is not None:
        strategy["probe_count"] = probe_count
    if mcc_pool is not None:
        strategy["target_mccs"] = mcc_pool

    # Generate attack rows
    attack_df = expand_strategy_to_rows(strategy, entity_pool, round_num, config)

    # Combine with baseline
    combined_df = pd.concat([baseline_df, attack_df], ignore_index=True)
    combined_df = combined_df.sort_values("timestamp").reset_index(drop=True)

    # Fidelity check
    fidelity = compute_fidelity(attack_df, baseline_df, config)

    # Save dataset
    dataset_id = generate_dataset_id(config["attack_id"], round_num)
    out_dir = get_generated_dir(config["attack_id"], dataset_id)
    data_path = out_dir / "transactions.csv"
    save_dataframe(combined_df, data_path)

    response = GenerateResponse(
        dataset_id=dataset_id,
        sample_count=len(attack_df),
        transaction_count=len(combined_df),
        data_location=str(out_dir),
        format={"transactions": "csv"},
        fidelity_report=fidelity,
    )

    return combined_df, response
