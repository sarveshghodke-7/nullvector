"""Filesystem helpers for persisting generated attack artifacts."""
from __future__ import annotations

import csv
import json
import math
import struct
import wave
from pathlib import Path
from typing import Any

from ..core import ATTACKS


def make_run_dir(run_id: str) -> Path:
    run_dir = Path(__file__).resolve().parent.parent / "data" / "generated" / run_id
    run_dir.mkdir(parents=True, exist_ok=True)
    return run_dir


def _write_json(path: Path, payload: dict[str, Any]) -> None:
    path.write_text(json.dumps(payload, indent=2), encoding="utf-8")


def _write_csv(path: Path, rows: list[dict[str, Any]]) -> None:
    if not rows:
        path.write_text("", encoding="utf-8")
        return
    with path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(rows[0].keys()))
        writer.writeheader()
        writer.writerows(rows)


def _write_wav(path: Path, sample_count: int = 1600, sample_rate: int = 11025) -> None:
    amplitude = 32767
    frames = []
    for index in range(sample_count):
        time_seconds = index / sample_rate
        base_frequency = 180 + ((index % 160) / 160) * 120
        sample = int(amplitude * 0.45 * math.sin(2 * math.pi * base_frequency * time_seconds))
        frames.append(struct.pack("<h", sample))
    with wave.open(str(path), "wb") as wav_handle:
        wav_handle.setnchannels(1)
        wav_handle.setsampwidth(2)
        wav_handle.setframerate(sample_rate)
        wav_handle.writeframes(b"".join(frames))


def _sample_summary(samples: list[dict[str, Any]]) -> dict[str, Any]:
    if not samples:
        return {"sample_count": 0, "mean_risk": 0.0, "fraud_count": 0}
    risk_scores = [float(sample.get("risk_score", 0.0) or 0.0) for sample in samples]
    return {
        "sample_count": len(samples),
        "mean_risk": round(sum(risk_scores) / len(risk_scores), 4) if risk_scores else 0.0,
        "fraud_count": sum(1 for sample in samples if sample.get("ground_truth") == "fraud"),
    }


def persist_attack_artifacts(run_id: str, attack_id: str, samples: list[dict[str, Any]], config: dict[str, Any]) -> list[dict[str, Any]]:
    run_dir = make_run_dir(run_id)
    artifact_types = list(config.get("artifacts") or ATTACKS[attack_id]["artifacts"])
    artifact_records: list[dict[str, Any]] = []

    def push_record(artifact_key: str, filename: str, format_name: str, payload: Any, count: int = 0) -> None:
        file_path = run_dir / filename
        if format_name == "json":
            _write_json(file_path, payload)
        elif format_name == "csv":
            _write_csv(file_path, payload if isinstance(payload, list) else [])
        elif format_name == "wav":
            _write_wav(file_path)
        else:
            file_path.write_text(str(payload), encoding="utf-8")
        artifact_records.append({
            "artifact_id": f"ART_{run_id}_{len(artifact_records) + 1:03d}",
            "type": artifact_key,
            "format": format_name,
            "count": count or len(samples),
            "data_location": str(file_path),
        })

    for artifact_type in artifact_types:
        if artifact_type == "audio_sample":
            push_record("audio_sample", "audio_sample.wav", "wav", {"generated": True}, len(samples))
        elif artifact_type == "voice_analysis":
            push_record(
                "voice_analysis",
                "voice_analysis.json",
                "json",
                {
                    "attack_id": attack_id,
                    "summary": _sample_summary(samples),
                    "features": {
                        "sample_count": len(samples),
                        "mean_spectral_artifact_score": round(sum(float(sample.get("spectral_artifact_score", 0.0) or 0.0) for sample in samples) / len(samples), 4) if samples else 0.0,
                    },
                },
                len(samples),
            )
        elif artifact_type == "kyc_document":
            push_record(
                "kyc_document",
                "kyc_document.json",
                "json",
                {
                    "document_type": "kyc_profile",
                    "attack_id": attack_id,
                    "sample_count": len(samples),
                    "subjects": [{"sample_id": sample.get("sample_id"), "document_consistency": sample.get("document_consistency")} for sample in samples[:5]],
                },
                len(samples),
            )
        elif artifact_type == "transaction_history":
            push_record("transaction_history", "transaction_history.csv", "csv", [{"sample_id": sample.get("sample_id"), "amount": sample.get("invoice_total") or sample.get("account_age_days") or 0} for sample in samples], len(samples))
        elif artifact_type == "behavioral_profile":
            push_record("behavioral_profile", "behavioral_profile.json", "json", {"attack_id": attack_id, "summary": _sample_summary(samples)}, len(samples))
        elif artifact_type == "tabular_transaction":
            push_record("tabular_transaction", "tabular_transaction.csv", "csv", [{key: value for key, value in sample.items()} for sample in samples], len(samples))
        elif artifact_type == "adversarial_variant":
            push_record("adversarial_variant", "adversarial_variant.json", "json", {"attack_id": attack_id, "variants": samples[: min(5, len(samples))]}, len(samples))
        elif artifact_type == "merchant_profile":
            push_record("merchant_profile", "merchant_profile.json", "json", {"attack_id": attack_id, "merchants": samples[: min(5, len(samples))]}, len(samples))
        elif artifact_type == "invoice":
            push_record("invoice", "invoice.json", "json", {"attack_id": attack_id, "invoices": samples[: min(5, len(samples))]}, len(samples))
        elif artifact_type == "merchant_behavior":
            push_record("merchant_behavior", "merchant_behavior.json", "json", {"attack_id": attack_id, "behavior": _sample_summary(samples)}, len(samples))

    if not artifact_records:
        default_payload = {"attack_id": attack_id, "samples": samples[: min(3, len(samples))], "summary": _sample_summary(samples)}
        push_record((ATTACKS[attack_id]["artifacts"] or ["dataset"])[0], "dataset_summary.json", "json", default_payload, len(samples))

    return artifact_records

