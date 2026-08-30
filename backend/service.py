from __future__ import annotations
import json
from pathlib import Path
from sqlalchemy import select
from .core import ATTACKS, ensure_balanced_dataset, evaluate, generate_balanced_samples, generate_samples, stable_id, utc_now
from .ml_models import craft_adversarial_variants, ensure_model, predict, train_model
from .schemas.api import AttackConfig
from .storage.database import SessionLocal
from .storage.files import persist_attack_artifacts
from .storage.repositories import FeedbackRecord, ModelRecord, ResultRecord, RunRecord, list_runs, run_to_dict


def attack_list():
    return [{"id": attack_id, **meta} for attack_id, meta in ATTACKS.items()]


def generate(attack_id: str, config: AttackConfig) -> dict:
    if attack_id not in ATTACKS: raise KeyError(attack_id)
    payload = config.model_dump()
    payload["attack_name"] = ATTACKS[attack_id]["name"]
    payload["requested_count"] = int(next((payload["parameters"].get(k) for k in ("instance_count", "sample_count", "max_variants", "merchant_count") if payload["parameters"].get(k) is not None), 10))
    seed = int(payload.get("seed") or 0)
    run_id = stable_id("RUN", seed, attack_id + utc_now())
    balanced_requested = bool(
        payload.get("balanced")
        or payload.get("mixed_dataset")
        or payload.get("parameters", {}).get("balanced")
        or payload.get("parameters", {}).get("balanced_dataset")
        or payload.get("parameters", {}).get("mixed_dataset")
    )
    payload["balanced"] = balanced_requested
    payload["mixed_dataset"] = balanced_requested
    if balanced_requested:
        samples = ensure_balanced_dataset(generate_balanced_samples(attack_id, payload), attack_id)
    else:
        samples = generate_samples(attack_id, payload)
    if attack_id == "adversarial_perturbation":
        ensure_model(attack_id, "v1.0")
        samples = craft_adversarial_variants(samples, "v1.0")
    now = utc_now()
    dataset_path = Path(__file__).resolve().parent / "data" / "generated" / run_id
    dataset_path.mkdir(parents=True, exist_ok=True)
    (dataset_path / "samples.json").write_text(json.dumps(samples, indent=2), encoding="utf-8")
    artifact_records = persist_attack_artifacts(run_id, attack_id, samples, payload)
    for artifact in artifact_records:
        filename = artifact["data_location"].split("/")[-1].split("\\")[-1]
        artifact["filename"] = filename
        artifact["data_location"] = f"/api/v1/runs/{run_id}/artifacts/{filename}"
    with SessionLocal() as session:
        session.add(RunRecord(run_id=run_id, attack_id=attack_id, scenario=payload.get("scenario") or ATTACKS[attack_id]["scenarios"][0], status="generated", timestamp=now, config_json=json.dumps(payload), generated_count=len(samples), model_version="v1.0"))
        session.add(ResultRecord(run_id=run_id, result_json=json.dumps({"samples": samples, "artifacts": artifact_records}), predictions_json="[]"))
        session.commit()
    return {"schema_version":"1.0", "run_id":run_id, "attack_id":attack_id, "stage":"generate", "timestamp":now, "payload":{"dataset_id":f"DS_{run_id}","sample_count":len(samples),"artifacts":artifact_records,"generation_time_ms":1,"status":"complete"}}


def detect(attack_id: str, run_id: str, model_version: str | None = None) -> dict:
    with SessionLocal() as session:
        run = session.get(RunRecord, run_id)
        record = session.get(ResultRecord, run_id)
        if not run or not record: raise KeyError(run_id)
        if run.attack_id != attack_id: raise ValueError("attack_id does not match run")
        samples = json.loads(record.result_json)["samples"]
        version = model_version or run.model_version
        model_metadata = ensure_model(attack_id, version)
        predictions = predict(attack_id, samples, version)
        hard_examples = collect_hard_examples(attack_id, run_id, predictions, samples)
        dataset_mode = "balanced" if run.generated_count > 0 and any(sample.get("ground_truth") == "legitimate" for sample in samples) else "fraud_only"
        result = evaluate(predictions, attack_id, run_id, version, dataset_mode=dataset_mode)
        result["scenario_breakdown"] = [{"scenario_id": run.scenario, "scenario_name": run.scenario.replace("_", " ").title(), "sample_count": len(predictions), "detected": result["summary"]["detected"], "missed": result["summary"]["missed"], "metrics": result["metrics"]}]
        result["hard_examples"] = hard_examples
        result["hard_examples_count"] = len(hard_examples)
        record.predictions_json = json.dumps(predictions)
        record.result_json = json.dumps(result)
        run.status = "completed"; run.detected_count = result["summary"]["detected"]; run.missed_count = result["summary"]["missed"]; run.detection_rate = result["summary"]["detection_rate"]
        if hard_examples:
            session.add(FeedbackRecord(run_id=run_id, created_at=utc_now(), feedback_json=json.dumps({"source": "false_negatives", "attack_id": attack_id, "hard_examples_count": len(hard_examples), "sample_ids": [example["sample_id"] for example in hard_examples]})))
        session.commit()
    return {"schema_version":"1.0", "run_id":run_id, "attack_id":attack_id, "stage":"detect", "timestamp":utc_now(), "payload":{"model_id":f"model_{attack_id}","model_version":version,"samples_evaluated":len(predictions),"predictions":predictions,"status":"complete","detection_time_ms":1,"hard_examples_count":len(hard_examples)}}


def get_result(run_id: str):
    with SessionLocal() as session:
        record = session.get(ResultRecord, run_id)
        if not record: raise KeyError(run_id)
        value = json.loads(record.result_json)
        if "metrics" not in value: raise KeyError(run_id)

        predictions = json.loads(record.predictions_json or "[]")
        if predictions:
            value["predictions"] = predictions
        if isinstance(value.get("artifacts"), list):
            for artifact in value["artifacts"]:
                filename = artifact.get("filename") or artifact.get("data_location", "").split("/")[-1].split("\\")[-1]
                if filename:
                    artifact["filename"] = filename
                    artifact["data_location"] = f"/api/v1/runs/{run_id}/artifacts/{filename}"

        return value


def get_run(run_id: str):
    with SessionLocal() as session:
        value = session.get(RunRecord, run_id)
        if not value: raise KeyError(run_id)
        return run_to_dict(value)


def benchmark_summary() -> list[dict]:
    with SessionLocal() as session:
        runs = list(session.scalars(select(RunRecord).where(RunRecord.status == "completed").order_by(RunRecord.timestamp.desc())))

    if not runs:
        return []

    summary_by_attack: dict[str, dict] = {}
    for run in runs:
        attack_id = run.attack_id
        attack_meta = ATTACKS.get(attack_id, {})
        bucket = summary_by_attack.setdefault(
            attack_id,
            {
                "attack_id": attack_id,
                "attack_name": attack_meta.get("name", attack_id),
                "total_runs": 0,
                "total_samples": 0,
                "total_detected": 0,
                "total_missed": 0,
                "detection_rates": [],
            },
        )
        bucket["total_runs"] += 1
        bucket["total_samples"] += run.generated_count or 0
        bucket["total_detected"] += run.detected_count or 0
        bucket["total_missed"] += run.missed_count or 0
        if run.detection_rate is not None:
            bucket["detection_rates"].append(float(run.detection_rate))

    rows = []
    for attack_id, bucket in summary_by_attack.items():
        rates = bucket["detection_rates"]
        rows.append({
            "attack_id": attack_id,
            "attack_name": bucket["attack_name"],
            "total_runs": bucket["total_runs"],
            "total_samples": bucket["total_samples"],
            "total_detected": bucket["total_detected"],
            "total_missed": bucket["total_missed"],
            "avg_detection_rate": round(sum(rates) / len(rates), 4) if rates else 0.0,
        })

    rows.sort(key=lambda item: (-item["avg_detection_rate"], -item["total_runs"], item["attack_id"]))
    return rows


def collect_hard_examples(attack_id: str, run_id: str, predictions: list[dict], samples: list[dict] | None = None) -> list[dict]:
    hard_examples = []
    for idx, prediction in enumerate(predictions):
        sample = samples[idx] if samples and idx < len(samples) else {}
        if prediction.get("ground_truth") == "fraud" or sample.get("ground_truth") == "fraud":
            if prediction.get("prediction") != "fraud":
                hard_examples.append({
                    "attack_id": attack_id,
                    "run_id": run_id,
                    "sample_id": prediction.get("sample_id") or sample.get("sample_id"),
                    "ground_truth": prediction.get("ground_truth") or sample.get("ground_truth") or "fraud",
                    "prediction": prediction.get("prediction", "legitimate"),
                    "risk_score": prediction.get("risk_score", 0.0),
                    "confidence": prediction.get("confidence", 0.0),
                    "features": {key: value for key, value in sample.items() if key not in {"sample_id", "ground_truth", "scenario"}},
                    "explanation": prediction.get("explanation", []),
                })
    return hard_examples


def models():
    with SessionLocal() as session:
        result = []
        for attack_id, meta in ATTACKS.items():
            versions = list(session.scalars(select(ModelRecord).where(ModelRecord.attack_id == attack_id).order_by(ModelRecord.version)))
            if not versions:
                trained = train_model(attack_id, "v1.0")
                metadata = trained["metrics"] | {"model_type": trained["model_type"], "training_samples": trained["training_samples"], "artifact_path": trained["path"]}
                versions = [ModelRecord(model_id=f"model_{attack_id}_v1", attack_id=attack_id, version="v1.0", metrics_json=json.dumps(metadata), trained_at=utc_now(), active=True)]
                session.add(versions[0]); session.commit()
            active_version = next((v.version for v in versions if v.active), versions[-1].version)
            version_data = []
            for v in versions:
                metadata = json.loads(v.metrics_json)
                version_data.append({"model_id": v.model_id, "version": v.version, "attack_id": attack_id, "model_type": metadata.get("model_type", "random_forest"), "trained_at": v.trained_at, "training_samples": metadata.get("training_samples", 480), "performance": {key: value for key, value in metadata.items() if isinstance(value, (int, float))}, "is_active": v.active})
            result.append({"model_id":f"model_{attack_id}","attack_id":attack_id,"attack_name":meta["name"],"description":f"RandomForest detector for {meta['target']}","current_version":active_version,"versions":version_data})
        return result


def add_feedback(run_id: str, note: str | None = None):
    with SessionLocal() as session:
        if not session.get(RunRecord, run_id): raise KeyError(run_id)
        record = FeedbackRecord(run_id=run_id, created_at=utc_now(), feedback_json=json.dumps({"note":note,"source":"false_negatives"}))
        session.add(record); session.commit()
    return {"feedback_id": record.feedback_id, "run_id": run_id, "status":"accepted"}


def retrain(attack_id: str, min_improvement: float = 0.0):
    if attack_id not in ATTACKS: raise KeyError(attack_id)
    with SessionLocal() as session:
        versions = list(session.scalars(select(ModelRecord).where(ModelRecord.attack_id == attack_id).order_by(ModelRecord.version)))
        if not versions:
            models()
            versions = list(session.scalars(select(ModelRecord).where(ModelRecord.attack_id == attack_id).order_by(ModelRecord.version)))
        current = next((item for item in versions if item.active), versions[-1])
        next_number = max(int(item.version.removeprefix("v").split(".")[0]) for item in versions) + 1
        new_version = f"v{next_number}.0"

        hard_examples = []
        for result_record in session.scalars(select(ResultRecord)):
            try:
                payload = json.loads(result_record.result_json)
            except Exception:
                continue
            if payload.get("attack_id") == attack_id and payload.get("hard_examples"):
                hard_examples.extend(payload["hard_examples"])

        fraud = generate_samples(attack_id, {"parameters": {"instance_count": 240}, "seed": next_number})
        if hard_examples:
            for example in hard_examples:
                features = example.get("features", {})
                if not features:
                    continue
                fraud.append({
                    **features,
                    "sample_id": example.get("sample_id", f"H{len(fraud) + 1:04d}"),
                    "scenario": example.get("scenario") or ATTACKS[attack_id]["scenarios"][0],
                    "ground_truth": "fraud",
                })

        legitimate = []
        for index, sample in enumerate(fraud):
            if attack_id == "synthetic_identity":
                legitimate.append({**sample, "ground_truth": "legitimate", "account_age_days": 365 + index % 400, "document_consistency": 0.95, "transaction_velocity": 1.5, "credit_history_gap": 0.02})
            elif attack_id == "deepfake_voice":
                legitimate.append({**sample, "ground_truth": "legitimate", "urgency": 0.05, "requested_otp": False, "spectral_artifact_score": 0.03, "prosody_consistency": 0.95})
            elif attack_id == "adversarial_perturbation":
                legitimate.append({**sample, "ground_truth": "legitimate", "perturbation_magnitude": 0.01, "velocity": 1.5, "device_risk": 0.05})
            elif attack_id == "account_takeover":
                legitimate.append({**sample, "ground_truth": "legitimate", "login_ip_distance": 600 + index % 300, "new_device_risk": 0.08, "session_velocity": 1.1, "failed_logins": 0, "geo_velocity": 0.35})
            elif attack_id == "social_engineering":
                legitimate.append({**sample, "ground_truth": "legitimate", "urgency_level": 0.18, "impersonation_score": 0.08, "requested_action": 0, "message_length": 42, "sender_match": True})
            else:
                legitimate.append({**sample, "ground_truth": "legitimate", "bank_name_match": True, "tax_document_valid": True, "pricing_anomaly": 0.03})

        trained = train_model(attack_id, new_version, seed=next_number, fraud_samples=fraud, legitimate_samples=legitimate)
        candidate = trained["metrics"]
        promoted = candidate["f1"] >= json.loads(current.metrics_json).get("f1", 0) + min_improvement
        candidate.update(model_type=trained["model_type"], training_samples=trained["training_samples"], artifact_path=trained["path"], feedback_examples=len(hard_examples))
        record = ModelRecord(model_id=f"model_{attack_id}_{new_version}", attack_id=attack_id, version=new_version, metrics_json=json.dumps(candidate), trained_at=utc_now(), active=promoted)
        if promoted:
            current.active = False
        session.add(record); session.commit()
    return {"attack_id": attack_id, "version": new_version, "promoted": promoted, "metrics": candidate, "hard_examples_count": len(hard_examples)}
