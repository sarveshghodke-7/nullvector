"""XGBoost-based detector for card testing attacks.

Responsibilities:
1. Feature engineering (velocity/behavioral features)
2. Training with scale_pos_weight or optional SMOTE
3. Threshold selection on validation split
4. Prediction with risk tier assignment
5. SHAP explainability
6. Model persistence
"""
from __future__ import annotations

from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd
import shap
import xgboost as xgb
from sklearn.metrics import (
    average_precision_score,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)

from backend.schemas.common import RiskTier
from backend.storage.files import get_model_dir
from backend.utils.logging import get_logger
from backend.utils.validation import risk_tier

logger = get_logger(__name__)

# Feature columns used by the detector
FEATURE_COLS = [
    "probe_count_1h",
    "probe_count_24h",
    "unique_merchants_1h",
    "amount_variance_last_n",
    "merchant_diversity_score",
    "device_change_rate",
    "time_delta_seconds",
    "amount_zscore",
]

LABEL_COL = "ground_truth"

# Columns that must NEVER be used as features (identifier leakage)
BLACKLISTED_COLS = {"account_id", "transaction_id", "round", "attack_type", "device_fingerprint"}


# ─────────────────── Feature Engineering ───────────────────

def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    """Compute velocity and behavioral features grouped by account_id.

    All features are derived from observable transaction patterns.
    account_id is used for grouping only, never as a feature.
    """
    df = df.copy()
    df["_ts"] = pd.to_datetime(df["timestamp"])
    df = df.sort_values(["account_id", "_ts"]).reset_index(drop=True)

    # Group by account for velocity calculations
    grouped = df.groupby("account_id")

    # 1. probe_count_1h: transactions per account in last 1 hour
    df["probe_count_1h"] = grouped["_ts"].transform(
        lambda x: x.rolling("1h", on=x).count()
    ) if False else _rolling_count(df, "1h")

    # 2. probe_count_24h: transactions per account in last 24 hours
    df["probe_count_24h"] = _rolling_count(df, "24h")

    # 3. unique_merchants_1h: distinct MCCs per account in 1h
    df["unique_merchants_1h"] = _rolling_nunique(df, "merchant_category", "1h")

    # 4. amount_variance_last_n: variance of last 10 amounts
    df["amount_variance_last_n"] = grouped["amount"].transform(
        lambda x: x.rolling(10, min_periods=1).var().fillna(0)
    )

    # 5. merchant_diversity_score: entropy of MCC distribution per account
    df["merchant_diversity_score"] = grouped["merchant_category"].transform(
        _category_entropy
    )

    # 6. device_change_rate: unique devices / txn count per account
    acct_device_nunique = grouped["device_fingerprint"].transform("nunique")
    acct_txn_count = grouped["transaction_id"].transform("count")
    df["device_change_rate"] = (acct_device_nunique / acct_txn_count).fillna(0)

    # 7. time_delta_seconds: seconds since previous txn (same account)
    df["time_delta_seconds"] = grouped["_ts"].transform(
        lambda x: x.diff().dt.total_seconds().fillna(86400)
    )

    # 8. amount_zscore: z-score of amount vs account's history
    acct_mean = grouped["amount"].transform("mean")
    acct_std = grouped["amount"].transform("std").replace(0, 1)
    df["amount_zscore"] = ((df["amount"] - acct_mean) / acct_std).fillna(0)

    # Drop temporary columns
    df.drop(columns=["_ts"], inplace=True)

    # Validate no blacklisted columns in features
    for col in FEATURE_COLS:
        assert col not in BLACKLISTED_COLS, f"Blacklisted column in features: {col}"

    return df


def _rolling_count(df: pd.DataFrame, window: str) -> pd.Series:
    """Count transactions per account within a time window."""
    result = pd.Series(0.0, index=df.index)
    for acct_id, group in df.groupby("account_id"):
        ts = group["_ts"]
        counts = []
        for i, t in enumerate(ts):
            if window == "1h":
                window_start = t - pd.Timedelta(hours=1)
            else:
                window_start = t - pd.Timedelta(hours=24)
            count = ((ts >= window_start) & (ts <= t)).sum()
            counts.append(count)
        result.iloc[group.index] = counts
    return result


def _rolling_nunique(df: pd.DataFrame, col: str, window: str) -> pd.Series:
    """Count unique values of a column per account within a time window."""
    result = pd.Series(0.0, index=df.index)
    for acct_id, group in df.groupby("account_id"):
        ts = group["_ts"]
        values = group[col]
        nuniques = []
        for i, (t, idx) in enumerate(zip(ts, group.index)):
            if window == "1h":
                window_start = t - pd.Timedelta(hours=1)
            else:
                window_start = t - pd.Timedelta(hours=24)
            mask = (ts >= window_start) & (ts <= t)
            nuniques.append(values[mask].nunique())
        result.iloc[group.index] = nuniques
    return result


def _category_entropy(series: pd.Series) -> pd.Series:
    """Compute expanding entropy of a categorical series."""
    # For the full group, compute the entropy of the value distribution
    counts = series.value_counts(normalize=True)
    if len(counts) <= 1:
        entropy = 0.0
    else:
        entropy = float(-np.sum(counts * np.log2(counts + 1e-10)))
    return pd.Series(entropy, index=series.index)


# ─────────────────── Training ───────────────────

def train(
    train_df: pd.DataFrame,
    val_df: pd.DataFrame,
    feature_cols: list[str] = FEATURE_COLS,
    label_col: str = LABEL_COL,
    config: dict | None = None,
) -> tuple[xgb.XGBClassifier, dict[str, float], dict[str, float]]:
    """Train XGBoost classifier and select thresholds.

    Returns: (model, metrics_dict, thresholds_dict)
    """
    config = config or {}
    xgb_params = config.get("xgboost_params", {})

    X_train = train_df[feature_cols].fillna(0).values
    y_train = train_df[label_col].values
    X_val = val_df[feature_cols].fillna(0).values
    y_val = val_df[label_col].values

    # Handle class imbalance
    use_smote = xgb_params.get("use_smote", False)
    if use_smote and y_train.sum() > 0:
        from imblearn.over_sampling import SMOTE
        smote = SMOTE(random_state=42)
        X_train, y_train = smote.fit_resample(X_train, y_train)
        logger.info(f"Applied SMOTE: {len(X_train)} training samples")

    # Compute scale_pos_weight
    n_neg = (y_train == 0).sum()
    n_pos = (y_train == 1).sum()
    spw = float(n_neg / max(n_pos, 1)) if xgb_params.get("scale_pos_weight_auto", True) and not use_smote else 1.0

    model = xgb.XGBClassifier(
        max_depth=xgb_params.get("max_depth", 6),
        learning_rate=xgb_params.get("learning_rate", 0.1),
        n_estimators=xgb_params.get("n_estimators", 200),
        eval_metric=xgb_params.get("eval_metric", "aucpr"),
        scale_pos_weight=spw,
        random_state=42,
        early_stopping_rounds=xgb_params.get("early_stopping_rounds", 20),
    )

    model.fit(
        X_train, y_train,
        eval_set=[(X_val, y_val)],
        verbose=False,
    )

    # Select thresholds on validation set
    val_proba = model.predict_proba(X_val)[:, 1]
    thresholds = _select_thresholds(y_val, val_proba, config)

    # Compute validation metrics using selected thresholds
    val_preds = np.where(val_proba > thresholds["block_above"], 1,
                         np.where(val_proba < thresholds["allow_below"], 0, 1))

    metrics = _compute_metrics(y_val, val_preds, val_proba)

    logger.info(
        f"Trained XGBoost: F1={metrics['f1']:.4f}, "
        f"AUC-ROC={metrics['auc_roc']:.4f}, "
        f"scale_pos_weight={spw:.2f}"
    )

    return model, metrics, thresholds


def _select_thresholds(
    y_true: np.ndarray,
    y_proba: np.ndarray,
    config: dict | None = None,
) -> dict[str, float]:
    """Select ALLOW/BLOCK thresholds to maximize F1 while keeping FPR < 5%."""
    config = config or {}
    default_thresholds = config.get("thresholds", {"allow_below": 0.3, "block_above": 0.7})

    best_f1 = 0.0
    best_thresholds = dict(default_thresholds)

    for allow_t in np.arange(0.1, 0.5, 0.05):
        for block_t in np.arange(0.5, 0.9, 0.05):
            preds = np.where(y_proba > block_t, 1,
                             np.where(y_proba < allow_t, 0, 1))
            if y_true.sum() == 0:
                continue
            f1 = f1_score(y_true, preds, zero_division=0)
            # Check FP rate
            fp = ((preds == 1) & (y_true == 0)).sum()
            tn = ((preds == 0) & (y_true == 0)).sum()
            fpr = fp / max(fp + tn, 1)
            if f1 > best_f1 and fpr < 0.05:
                best_f1 = f1
                best_thresholds = {"allow_below": float(allow_t), "block_above": float(block_t)}

    logger.info(f"Selected thresholds: {best_thresholds} (F1={best_f1:.4f})")
    return best_thresholds


def _compute_metrics(
    y_true: np.ndarray,
    y_pred: np.ndarray,
    y_proba: np.ndarray,
) -> dict[str, float]:
    """Compute standard detection metrics."""
    if len(np.unique(y_true)) < 2:
        return {"precision": 0, "recall": 0, "f1": 0, "auc_roc": 0, "auc_pr": 0, "fp_rate": 0}

    fp = ((y_pred == 1) & (y_true == 0)).sum()
    tn = ((y_pred == 0) & (y_true == 0)).sum()

    return {
        "precision": float(precision_score(y_true, y_pred, zero_division=0)),
        "recall": float(recall_score(y_true, y_pred, zero_division=0)),
        "f1": float(f1_score(y_true, y_pred, zero_division=0)),
        "auc_roc": float(roc_auc_score(y_true, y_proba)),
        "auc_pr": float(average_precision_score(y_true, y_proba)),
        "fp_rate": float(fp / max(fp + tn, 1)),
    }


# ─────────────────── Prediction ───────────────────

def predict(
    model: xgb.XGBClassifier,
    df: pd.DataFrame,
    feature_cols: list[str] = FEATURE_COLS,
    thresholds: dict[str, float] | None = None,
) -> pd.DataFrame:
    """Predict risk scores and assign risk tiers."""
    thresholds = thresholds or {"allow_below": 0.3, "block_above": 0.7}
    df = df.copy()

    X = df[feature_cols].fillna(0).values
    df["risk_score"] = model.predict_proba(X)[:, 1]
    df["risk_tier"] = df["risk_score"].apply(
        lambda s: risk_tier(s, thresholds).value
    )

    return df


# ─────────────────── Explainability ───────────────────

def explain(
    model: xgb.XGBClassifier,
    df: pd.DataFrame,
    feature_cols: list[str] = FEATURE_COLS,
    top_k: int = 5,
) -> list[dict[str, Any]]:
    """Generate SHAP explanations for predictions."""
    X = df[feature_cols].fillna(0)
    explainer = shap.TreeExplainer(model)
    shap_values = explainer.shap_values(X)

    results = []
    for i in range(len(df)):
        sv = shap_values[i] if isinstance(shap_values, np.ndarray) else shap_values[i]
        feature_impacts = sorted(
            zip(feature_cols, sv),
            key=lambda x: abs(x[1]),
            reverse=True,
        )[:top_k]

        results.append({
            "transaction_id": df.iloc[i].get("transaction_id", f"idx_{i}"),
            "shap_top_features": [
                {"feature": f, "shap_value": round(float(v), 4)}
                for f, v in feature_impacts
            ],
        })

    return results


# ─────────────────── Model Persistence ───────────────────

def save_model(model: xgb.XGBClassifier, model_id: str) -> Path:
    """Save XGBoost model to disk."""
    model_dir = get_model_dir()
    path = model_dir / f"{model_id}.ubj"
    model.save_model(str(path))
    logger.info(f"Saved model to {path}")
    return path


def load_model(model_id: str) -> xgb.XGBClassifier:
    """Load XGBoost model from disk."""
    model_dir = get_model_dir()
    path = model_dir / f"{model_id}.ubj"
    model = xgb.XGBClassifier()
    model.load_model(str(path))
    logger.info(f"Loaded model from {path}")
    return model
