"""SQLite database manager for run metadata and loop ledger."""
from __future__ import annotations

import json
import sqlite3
from datetime import datetime
from pathlib import Path
from typing import Any, Optional


DEFAULT_DB_PATH = Path("backend/data/defense_lab.db")

_CREATE_TABLES = """
CREATE TABLE IF NOT EXISTS runs (
    run_id TEXT PRIMARY KEY,
    attack_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    config TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS loop_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    run_id TEXT NOT NULL,
    vector_id TEXT,
    round INTEGER NOT NULL,
    f1_score REAL,
    precision_val REAL,
    recall_val REAL,
    auc_roc REAL,
    auc_pr REAL,
    attack_success_rate REAL,
    mutation_param TEXT,
    timestamp TEXT NOT NULL,
    FOREIGN KEY (run_id) REFERENCES runs(run_id)
);

CREATE TABLE IF NOT EXISTS datasets (
    dataset_id TEXT PRIMARY KEY,
    run_id TEXT NOT NULL,
    attack_id TEXT NOT NULL,
    round INTEGER NOT NULL,
    sample_count INTEGER,
    location TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (run_id) REFERENCES runs(run_id)
);

CREATE TABLE IF NOT EXISTS models (
    model_id TEXT PRIMARY KEY,
    run_id TEXT NOT NULL,
    attack_id TEXT NOT NULL,
    round INTEGER NOT NULL,
    location TEXT,
    metrics TEXT,
    thresholds TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (run_id) REFERENCES runs(run_id)
);
"""


class Database:
    """SQLite database manager."""

    def __init__(self, db_path: Path | str = DEFAULT_DB_PATH) -> None:
        self.db_path = Path(db_path)
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self._conn: Optional[sqlite3.Connection] = None

    def _get_conn(self) -> sqlite3.Connection:
        if self._conn is None:
            self._conn = sqlite3.connect(str(self.db_path))
            self._conn.row_factory = sqlite3.Row
        return self._conn

    def init_db(self) -> None:
        """Create tables if they don't exist."""
        conn = self._get_conn()
        conn.executescript(_CREATE_TABLES)
        conn.commit()

    def log_run(self, run_id: str, attack_id: str, config: dict | None = None) -> None:
        """Log a new pipeline run."""
        now = datetime.utcnow().isoformat()
        conn = self._get_conn()
        conn.execute(
            "INSERT INTO runs (run_id, attack_id, status, config, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
            (run_id, attack_id, "running", json.dumps(config) if config else None, now, now),
        )
        conn.commit()

    def update_run_status(self, run_id: str, status: str) -> None:
        """Update the status of a run."""
        now = datetime.utcnow().isoformat()
        conn = self._get_conn()
        conn.execute(
            "UPDATE runs SET status = ?, updated_at = ? WHERE run_id = ?",
            (status, now, run_id),
        )
        conn.commit()

    def log_round(
        self,
        run_id: str,
        round_num: int,
        metrics: dict[str, float],
        vector_id: str | None = None,
        mutation_param: dict | None = None,
    ) -> None:
        """Log a feedback loop round."""
        now = datetime.utcnow().isoformat()
        conn = self._get_conn()
        conn.execute(
            """INSERT INTO loop_log
               (run_id, vector_id, round, f1_score, precision_val, recall_val,
                auc_roc, auc_pr, attack_success_rate, mutation_param, timestamp)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                run_id,
                vector_id,
                round_num,
                metrics.get("f1"),
                metrics.get("precision"),
                metrics.get("recall"),
                metrics.get("auc_roc"),
                metrics.get("auc_pr"),
                metrics.get("attack_success_rate"),
                json.dumps(mutation_param) if mutation_param else None,
                now,
            ),
        )
        conn.commit()

    def log_dataset(
        self, dataset_id: str, run_id: str, attack_id: str, round_num: int,
        sample_count: int, location: str,
    ) -> None:
        """Log a generated dataset."""
        now = datetime.utcnow().isoformat()
        conn = self._get_conn()
        conn.execute(
            "INSERT INTO datasets (dataset_id, run_id, attack_id, round, sample_count, location, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
            (dataset_id, run_id, attack_id, round_num, sample_count, location, now),
        )
        conn.commit()

    def log_model(
        self, model_id: str, run_id: str, attack_id: str, round_num: int,
        location: str, metrics: dict | None = None, thresholds: dict | None = None,
    ) -> None:
        """Log a trained model."""
        now = datetime.utcnow().isoformat()
        conn = self._get_conn()
        conn.execute(
            "INSERT INTO models (model_id, run_id, attack_id, round, location, metrics, thresholds, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            (
                model_id, run_id, attack_id, round_num, location,
                json.dumps(metrics) if metrics else None,
                json.dumps(thresholds) if thresholds else None,
                now,
            ),
        )
        conn.commit()

    def get_run(self, run_id: str) -> dict | None:
        """Get run metadata."""
        conn = self._get_conn()
        row = conn.execute("SELECT * FROM runs WHERE run_id = ?", (run_id,)).fetchone()
        if row:
            d = dict(row)
            if d.get("config"):
                d["config"] = json.loads(d["config"])
            return d
        return None

    def get_loop_history(self, run_id: str) -> list[dict]:
        """Get all loop log entries for a run."""
        conn = self._get_conn()
        rows = conn.execute(
            "SELECT * FROM loop_log WHERE run_id = ? ORDER BY round", (run_id,)
        ).fetchall()
        results = []
        for row in rows:
            d = dict(row)
            if d.get("mutation_param"):
                d["mutation_param"] = json.loads(d["mutation_param"])
            results.append(d)
        return results

    def close(self) -> None:
        """Close the database connection."""
        if self._conn:
            self._conn.close()
            self._conn = None
