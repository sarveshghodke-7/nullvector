"""Model retraining with hard examples."""
from __future__ import annotations

from pathlib import Path
from typing import Any

import pandas as pd

from backend.utils.logging import get_logger

logger = get_logger(__name__)


def retrain_model(
    existing_model_path: str | Path | None,
    cumulative_train_df: pd.DataFrame,
    val_df: pd.DataFrame,
    feature_cols: list[str],
    label_col: str,
    config: dict[str, Any],
) -> tuple[Any, dict[str, float], str]:
    """Retrain the detection model with accumulated hard examples.

    Args:
        existing_model_path: Path to existing model checkpoint (or None for fresh).
        cumulative_train_df: Training data including all rounds' hard examples.
        val_df: Validation split for threshold selection.
        feature_cols: Feature column names.
        label_col: Label column name.
        config: Attack configuration.

    Returns:
        Tuple of (model, metrics_dict, new_model_path).
    """
    # Import here to avoid circular dependency
    from backend.attacks.card_testing.detector import train, save_model
    from backend.utils.ids import generate_model_id

    round_num = config.get("current_round", 1)
    model, metrics, thresholds = train(
        train_df=cumulative_train_df,
        val_df=val_df,
        feature_cols=feature_cols,
        label_col=label_col,
        config=config,
    )

    model_id = generate_model_id("card_testing", round_num)
    model_path = save_model(model, model_id)

    logger.info(
        f"Retrained model {model_id} on {len(cumulative_train_df)} samples, "
        f"F1={metrics.get('f1', 0):.4f}"
    )

    return model, metrics, str(model_path)
