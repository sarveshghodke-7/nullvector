"""Failure analysis for false negative clustering."""
from __future__ import annotations

from typing import Any

import numpy as np
import pandas as pd
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler

from backend.utils.logging import get_logger

logger = get_logger(__name__)


def analyze_failures(
    predictions_df: pd.DataFrame,
    ground_truth_col: str = "ground_truth",
    pred_tier_col: str = "risk_tier",
    feature_cols: list[str] | None = None,
    n_clusters: int = 3,
) -> dict[str, Any]:
    """Cluster false negatives to identify common evasion patterns.

    Args:
        predictions_df: DataFrame with predictions and ground truth.
        ground_truth_col: Column name for ground truth labels.
        pred_tier_col: Column name for predicted risk tier.
        feature_cols: Feature columns to use for clustering.
        n_clusters: Number of clusters for K-Means.

    Returns:
        Summary dict with cluster information and dominant patterns.
    """
    # Filter to false negatives: actual fraud that was ALLOWed
    fn_mask = (
        (predictions_df[ground_truth_col] == 1)
        & (predictions_df[pred_tier_col] == "ALLOW")
    )
    fn_df = predictions_df[fn_mask].copy()

    if len(fn_df) == 0:
        return {"total_fn": 0, "cluster_count": 0, "clusters": []}

    if feature_cols is None:
        feature_cols = [
            c for c in fn_df.columns
            if c not in [
                "transaction_id", "account_id", "round",
                ground_truth_col, pred_tier_col, "risk_score",
                "attack_type", "device_fingerprint",
            ]
        ]

    # Select numeric features only
    numeric_cols = [
        c for c in feature_cols
        if c in fn_df.columns and pd.api.types.is_numeric_dtype(fn_df[c])
    ]

    if len(numeric_cols) == 0 or len(fn_df) < n_clusters:
        return {
            "total_fn": len(fn_df),
            "cluster_count": 0,
            "clusters": [],
            "note": "Insufficient numeric features or samples for clustering",
        }

    # Standardize and cluster
    X = fn_df[numeric_cols].fillna(0).values
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    actual_k = min(n_clusters, len(fn_df))
    kmeans = KMeans(n_clusters=actual_k, random_state=42, n_init=10)
    labels = kmeans.fit_predict(X_scaled)

    # Build cluster summaries
    clusters = []
    for i in range(actual_k):
        cluster_mask = labels == i
        cluster_data = fn_df[cluster_mask]
        centroid = kmeans.cluster_centers_[i]

        # Find dominant features (highest absolute centroid values)
        feature_importance = sorted(
            zip(numeric_cols, centroid),
            key=lambda x: abs(x[1]),
            reverse=True,
        )
        dominant = {f: round(float(v), 3) for f, v in feature_importance[:5]}

        # Build human-readable pattern description
        patterns = []
        for feat, val in feature_importance[:3]:
            mean_val = float(cluster_data[feat].mean())
            patterns.append(f"{feat}={mean_val:.2f}")
        pattern_str = ", ".join(patterns)

        clusters.append({
            "cluster_id": i,
            "size": int(cluster_mask.sum()),
            "centroid": dominant,
            "dominant_pattern": pattern_str,
        })

    return {
        "total_fn": len(fn_df),
        "cluster_count": actual_k,
        "clusters": clusters,
    }
