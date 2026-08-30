"""Small persisted scikit-learn models for the synthetic attack lab."""
from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import joblib
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, f1_score, precision_score, recall_score, roc_auc_score

from .core import generate_samples

MODEL_ROOT = Path(__file__).resolve().parent / "models" / "artifacts"
MODEL_ROOT.mkdir(parents=True, exist_ok=True)

FEATURES = {
    "synthetic_identity": ["account_age_days", "document_consistency", "transaction_velocity", "credit_history_gap"],
    "deepfake_voice": ["urgency", "requested_otp", "spectral_artifact_score", "prosody_consistency"],
    "adversarial_perturbation": ["amount", "perturbation_magnitude", "velocity", "device_risk"],
    "fake_merchant": ["bank_name_match", "tax_document_valid", "invoice_total", "pricing_anomaly"],
    "account_takeover": ["login_ip_distance", "new_device_risk", "session_velocity", "failed_logins", "geo_velocity"],
    "social_engineering": ["urgency_level", "impersonation_score", "requested_action", "message_length", "sender_match"],
}


def _vector(attack_id: str, sample: dict[str, Any]) -> list[float]:
    values = []
    for feature in FEATURES[attack_id]:
        value = sample.get(feature, 0)
        values.append(float(value) if isinstance(value, (int, float, bool)) else 0.0)
    return values


def _legitimate(attack_id: str, sample: dict[str, Any], index: int) -> dict[str, Any]:
    item = dict(sample)
    item["ground_truth"] = "legitimate"
    if attack_id == "synthetic_identity":
        item.update(account_age_days=365 + index % 400, document_consistency=0.95, transaction_velocity=1.5, credit_history_gap=0.02)
    elif attack_id == "deepfake_voice":
        item.update(urgency=0.05, requested_otp=False, spectral_artifact_score=0.03, prosody_consistency=0.95)
    elif attack_id == "adversarial_perturbation":
        item.update(perturbation_magnitude=0.01, velocity=1.5, device_risk=0.05)
    elif attack_id == "account_takeover":
        item.update(login_ip_distance=600, new_device_risk=0.08, session_velocity=1.1, failed_logins=0, geo_velocity=0.35)
    elif attack_id == "social_engineering":
        item.update(urgency_level=0.18, impersonation_score=0.08, requested_action=0, message_length=42, sender_match=True)
    else:
        item.update(bank_name_match=True, tax_document_valid=True, pricing_anomaly=0.03)
    return item


def train_model(attack_id: str, version: str = "v1.0", seed: int = 42, fraud_samples: list[dict[str, Any]] | None = None, legitimate_samples: list[dict[str, Any]] | None = None) -> dict[str, Any]:
    fraud = fraud_samples if fraud_samples is not None else generate_samples(attack_id, {"parameters": {"instance_count": 240}, "seed": seed})
    legitimate = legitimate_samples if legitimate_samples is not None else [_legitimate(attack_id, sample, i) for i, sample in enumerate(fraud)]
    samples = fraud + legitimate
    x = np.asarray([_vector(attack_id, sample) for sample in samples])
    y = np.asarray([1] * len(fraud) + [0] * len(legitimate))
    model = RandomForestClassifier(n_estimators=120, max_depth=8, random_state=seed, class_weight="balanced")
    model.fit(x, y)
    probabilities = model.predict_proba(x)[:, 1]
    predicted = (probabilities >= 0.5).astype(int)
    metrics = {"accuracy": round(float(accuracy_score(y, predicted)), 4), "precision": round(float(precision_score(y, predicted, zero_division=0)), 4), "recall": round(float(recall_score(y, predicted, zero_division=0)), 4), "f1": round(float(f1_score(y, predicted, zero_division=0)), 4), "roc_auc": round(float(roc_auc_score(y, probabilities)), 4)}
    path = MODEL_ROOT / attack_id / version
    path.mkdir(parents=True, exist_ok=True)
    joblib.dump({"model": model, "features": FEATURES[attack_id], "attack_id": attack_id, "version": version}, path / "model.joblib")
    (path / "metadata.json").write_text(json.dumps({"metrics": metrics, "training_samples": len(samples), "model_type": "random_forest", "features": FEATURES[attack_id]}), encoding="utf-8")
    return {"path": str(path / "model.joblib"), "metrics": metrics, "training_samples": len(samples), "model_type": "random_forest"}


def ensure_model(attack_id: str, version: str = "v1.0") -> dict[str, Any]:
    path = MODEL_ROOT / attack_id / version / "model.joblib"
    metadata = path.with_name("metadata.json")
    if not path.exists() or not metadata.exists():
        return train_model(attack_id, version)
    result = json.loads(metadata.read_text(encoding="utf-8"))
    result["path"] = str(path)
    return result


def predict(attack_id: str, samples: list[dict[str, Any]], version: str = "v1.0") -> list[dict[str, Any]]:
    metadata = ensure_model(attack_id, version)
    bundle = joblib.load(metadata["path"])
    model = bundle["model"]
    features = bundle["features"]
    vectors = np.asarray([_vector(attack_id, sample) for sample in samples])
    probabilities = model.predict_proba(vectors)[:, 1]
    importances = model.feature_importances_
    predictions = []
    for sample, score in zip(samples, probabilities):
        prediction = "fraud" if score >= 0.5 else "legitimate"
        top = np.argsort(importances)[::-1][:2]
        explanations = [{"feature": features[index], "value": sample.get(features[index], 0), "description": f"{features[index]} has learned importance {importances[index]:.3f}", "impact": "high" if importances[index] >= importances[top[-1]] else "medium"} for index in top]
        predictions.append({"sample_id": sample["sample_id"], "ground_truth": sample.get("ground_truth", "fraud"), "prediction": prediction, "risk_score": round(float(score), 4), "confidence": round(abs(float(score) - 0.5) * 2, 4), "decision": "flagged" if prediction == "fraud" else "passed", "explanation": explanations})
    return predictions


def craft_adversarial_variants(samples: list[dict[str, Any]], version: str = "v1.0") -> list[dict[str, Any]]:
    """Search bounded feature changes that reduce the local fraud model score."""
    metadata = ensure_model("adversarial_perturbation", version)
    bundle = joblib.load(metadata["path"])
    model = bundle["model"]
    crafted = []
    for sample in samples:
        original_score = float(model.predict_proba(np.asarray([_vector("adversarial_perturbation", sample)]))[0, 1])
        candidates = []
        for magnitude in np.linspace(0.0, min(float(sample.get("perturbation_magnitude", 0.2)), 0.5), 21):
            candidate = dict(sample)
            candidate["perturbation_magnitude"] = round(float(magnitude), 4)
            candidate["amount"] = round(float(sample["original_amount"]) * (1 + magnitude), 2)
            score = float(model.predict_proba(np.asarray([_vector("adversarial_perturbation", candidate)]))[0, 1])
            candidates.append((score, candidate))
        adversarial_score, best = min(candidates, key=lambda item: item[0])
        best["original_risk_score"] = round(original_score, 4)
        best["adversarial_risk_score"] = round(adversarial_score, 4)
        best["attack_success"] = adversarial_score < 0.5 and original_score >= 0.5
        crafted.append(best)
    return crafted
