"""Evaluation metrics for card testing detection."""
from __future__ import annotations

from typing import Any

import numpy as np
import pandas as pd
from sklearn.metrics import (
    average_precision_score,
    confusion_matrix as sk_confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)

from backend.schemas.common import ConfusionMatrix, DetectionMetrics
from backend.schemas.evaluation import EvaluationResponse
from backend.utils.logging import get_logger

logger = get_logger(__name__)


def evaluate(
    predictions_df: pd.DataFrame,
    ground_truth_col: str = "ground_truth",
    pred_score_col: str = "risk_score",
    pred_tier_col: str = "risk_tier",
    thresholds: dict[str, float] | None = None,
) -> EvaluationResponse:
    """Compute evaluation metrics on the test split.

    Thresholds must be frozen from the validation step — never re-tuned here.
    """
    thresholds = thresholds or {"allow_below": 0.3, "block_above": 0.7}
    y_true = predictions_df[ground_truth_col].values
    y_proba = predictions_df[pred_score_col].values

    # Binary predictions using frozen thresholds
    y_pred = np.where(
        y_proba > thresholds["block_above"], 1,
        np.where(y_proba < thresholds["allow_below"], 0, 1)
    )

    # Confusion matrix
    if len(np.unique(y_true)) >= 2:
        cm = sk_confusion_matrix(y_true, y_pred)
        tn, fp, fn, tp = cm.ravel()
    else:
        tp = tn = fp = fn = 0

    confusion = ConfusionMatrix(tp=int(tp), tn=int(tn), fp=int(fp), fn=int(fn))

    # Metrics
    if len(np.unique(y_true)) >= 2:
        metrics = DetectionMetrics(
            precision=float(precision_score(y_true, y_pred, zero_division=0)),
            recall=float(recall_score(y_true, y_pred, zero_division=0)),
            f1=float(f1_score(y_true, y_pred, zero_division=0)),
            auc_roc=float(roc_auc_score(y_true, y_proba)),
            fp_rate=float(fp / max(fp + tn, 1)),
            auc_pr=float(average_precision_score(y_true, y_proba)),
            attack_success_rate=float(fn / max(fn + tp, 1)),
        )
    else:
        metrics = DetectionMetrics()

    # Per-tier stop rate (for attack rows only)
    attack_mask = predictions_df[ground_truth_col] == 1
    attack_rows = predictions_df[attack_mask]
    tier_counts = attack_rows[pred_tier_col].value_counts(normalize=True).to_dict()
    per_tier = {
        "BLOCK": round(tier_counts.get("BLOCK", 0.0), 4),
        "CHALLENGE": round(tier_counts.get("CHALLENGE", 0.0), 4),
        "ALLOW": round(tier_counts.get("ALLOW", 0.0), 4),
    }

    logger.info(
        f"Evaluation: F1={metrics.f1:.4f}, AUC-ROC={metrics.auc_roc:.4f}, "
        f"Attack success rate={metrics.attack_success_rate or 0:.4f}"
    )

    return EvaluationResponse(
        samples_evaluated=len(predictions_df),
        confusion_matrix=confusion,
        metrics=metrics,
        per_tier_stop_rate=per_tier,
    )
