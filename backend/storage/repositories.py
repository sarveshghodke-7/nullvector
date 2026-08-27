"""Higher-level data access combining SQLite metadata with file operations."""
from __future__ import annotations

from pathlib import Path
from typing import Optional

import pandas as pd

from backend.storage.database import Database
from backend.storage.files import (
    get_generated_dir,
    get_run_dir,
    load_dataframe,
    save_dataframe,
)


class DataRepository:
    """Unified data access layer."""

    def __init__(self, db: Database) -> None:
        self.db = db

    def save_generated_dataset(
        self,
        df: pd.DataFrame,
        dataset_id: str,
        run_id: str,
        attack_id: str,
        round_num: int,
        filename: str = "transactions.csv",
    ) -> str:
        """Save a generated dataset and log metadata."""
        out_dir = get_generated_dir(attack_id, dataset_id)
        path = out_dir / filename
        save_dataframe(df, path)
        self.db.log_dataset(
            dataset_id=dataset_id,
            run_id=run_id,
            attack_id=attack_id,
            round_num=round_num,
            sample_count=len(df),
            location=str(path),
        )
        return str(path)

    def save_predictions(
        self, df: pd.DataFrame, run_id: str, filename: str = "predictions.csv"
    ) -> str:
        """Save prediction results."""
        out_dir = get_run_dir(run_id)
        path = out_dir / filename
        save_dataframe(df, path)
        return str(path)

    def save_false_negatives(
        self, df: pd.DataFrame, run_id: str, filename: str = "false_negatives.csv"
    ) -> str:
        """Save false negative examples."""
        out_dir = get_run_dir(run_id)
        path = out_dir / filename
        save_dataframe(df, path)
        return str(path)

    def load_dataset(self, path: str) -> pd.DataFrame:
        """Load a dataset from a path."""
        return load_dataframe(path)
