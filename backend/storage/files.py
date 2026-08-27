"""File storage helpers for datasets, models, and media."""
from __future__ import annotations

from pathlib import Path
from typing import Literal

import pandas as pd

BASE_DATA_DIR = Path("backend/data")


def ensure_dir(path: Path | str) -> Path:
    """Create directory tree if it doesn't exist."""
    p = Path(path)
    p.mkdir(parents=True, exist_ok=True)
    return p


def save_dataframe(
    df: pd.DataFrame,
    path: Path | str,
    fmt: Literal["csv", "parquet"] = "csv",
) -> Path:
    """Save a DataFrame to CSV or Parquet."""
    p = Path(path)
    ensure_dir(p.parent)
    if fmt == "parquet":
        df.to_parquet(p, index=False)
    else:
        df.to_csv(p, index=False)
    return p


def load_dataframe(path: Path | str) -> pd.DataFrame:
    """Load a DataFrame from CSV or Parquet based on extension."""
    p = Path(path)
    if not p.exists():
        raise FileNotFoundError(f"Dataset not found: {p}")
    if p.suffix == ".parquet":
        return pd.read_parquet(p)
    return pd.read_csv(p)


def get_run_dir(run_id: str) -> Path:
    """Get the results directory for a run."""
    return ensure_dir(BASE_DATA_DIR / "results" / run_id)


def get_generated_dir(attack_id: str, dataset_id: str) -> Path:
    """Get the generated data directory for a dataset."""
    return ensure_dir(BASE_DATA_DIR / "generated" / attack_id / dataset_id)


def get_model_dir() -> Path:
    """Get the model storage directory."""
    return ensure_dir(Path("backend/models/xgboost"))
