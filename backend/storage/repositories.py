from __future__ import annotations

import json
from typing import Any
from sqlalchemy import String, Text, select
from sqlalchemy.orm import Mapped, mapped_column
from .database import Base


class RunRecord(Base):
	__tablename__ = "runs"
	run_id: Mapped[str] = mapped_column(String(64), primary_key=True)
	attack_id: Mapped[str] = mapped_column(String(64), index=True)
	scenario: Mapped[str] = mapped_column(String(100))
	status: Mapped[str] = mapped_column(String(30), index=True)
	timestamp: Mapped[str] = mapped_column(String(64))
	config_json: Mapped[str] = mapped_column(Text)
	generated_count: Mapped[int] = mapped_column(default=0)
	detected_count: Mapped[int] = mapped_column(default=0)
	missed_count: Mapped[int] = mapped_column(default=0)
	detection_rate: Mapped[float | None] = mapped_column(nullable=True)
	model_version: Mapped[str] = mapped_column(String(30), default="v1.0")
	error: Mapped[str | None] = mapped_column(Text, nullable=True)


class ResultRecord(Base):
	__tablename__ = "results"
	run_id: Mapped[str] = mapped_column(String(64), primary_key=True)
	result_json: Mapped[str] = mapped_column(Text)
	predictions_json: Mapped[str] = mapped_column(Text)


class ModelRecord(Base):
	__tablename__ = "models"
	model_id: Mapped[str] = mapped_column(String(100), primary_key=True)
	attack_id: Mapped[str] = mapped_column(String(64), index=True)
	version: Mapped[str] = mapped_column(String(30))
	metrics_json: Mapped[str] = mapped_column(Text)
	trained_at: Mapped[str] = mapped_column(String(64))
	active: Mapped[bool] = mapped_column(default=True)


class FeedbackRecord(Base):
	__tablename__ = "feedback"
	feedback_id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
	run_id: Mapped[str] = mapped_column(String(64), index=True)
	created_at: Mapped[str] = mapped_column(String(64))
	feedback_json: Mapped[str] = mapped_column(Text)


def run_to_dict(record: RunRecord) -> dict[str, Any]:
	config = json.loads(record.config_json)
	return {"run_id": record.run_id, "attack_id": record.attack_id, "attack_name": config.get("attack_name", record.attack_id), "scenario": record.scenario, "timestamp": record.timestamp, "requested_count": config.get("requested_count", record.generated_count), "generated_count": record.generated_count, "detected_count": record.detected_count, "missed_count": record.missed_count, "detection_rate": record.detection_rate, "model_version": record.model_version, "status": record.status, "generation_time_ms": config.get("generation_time_ms"), "detection_time_ms": config.get("detection_time_ms"), "config": config}


def list_runs(session, attack_id: str | None = None, status: str | None = None, limit: int = 100, offset: int = 0) -> list[dict[str, Any]]:
	query = select(RunRecord).order_by(RunRecord.timestamp.desc()).offset(offset).limit(limit)
	if attack_id: query = query.where(RunRecord.attack_id == attack_id)
	if status: query = query.where(RunRecord.status == status)
	return [run_to_dict(r) for r in session.scalars(query)]

