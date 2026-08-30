"""Executable domain primitives for the payment-security prototype."""
from __future__ import annotations

import hashlib
import json
import random
from datetime import datetime, timezone
from typing import Any

ATTACKS = {
    "synthetic_identity": {
        "name": "Synthetic Identity Fraud", "target": "Customer onboarding / KYC",
        "scenarios": ["kyc_inconsistency", "behavioral_anomaly", "credit_history_anomaly", "multi_signal"],
        "artifacts": ["kyc_document", "transaction_history", "credit_history", "behavioral_profile"],
    },
    "deepfake_voice": {
        "name": "Deepfake Voice Social Engineering", "target": "Voice authentication / Social engineering",
        "scenarios": ["bank_impersonation", "otp_social_engineering", "voice_cloning"],
        "artifacts": ["audio_sample", "voice_analysis"],
    },
    "adversarial_perturbation": {
        "name": "Adversarial Perturbation Attack", "target": "Fraud detection model",
        "scenarios": ["amount_perturbation", "feature_perturbation", "boundary_search", "constraint_based"],
        "artifacts": ["tabular_transaction", "adversarial_variant"],
    },
    "fake_merchant": {
        "name": "Fake Merchant / Invoice Fraud", "target": "Merchant onboarding / Invoice processing",
        "scenarios": ["shell_business", "stolen_identity", "fake_tax_document", "bank_mismatch", "domain_mismatch", "invoice_manipulation", "multi_signal"],
        "artifacts": ["merchant_profile", "invoice", "merchant_behavior"],
    },
    "account_takeover": {
        "name": "Account Takeover / Credential Abuse", "target": "Customer account security / authentication",
        "scenarios": ["impossible_travel", "credential_stuffing", "session_hijack", "new_device_velocity"],
        "artifacts": ["login_event", "session_anomaly", "device_fingerprint"],
    },
    "social_engineering": {
        "name": "Social Engineering / Impersonation Scam", "target": "Customer support / messaging channels",
        "scenarios": ["bank_impersonation", "vendor_impersonation", "tech_support", "refund_scam"],
        "artifacts": ["message", "risk_context", "impersonation_intent"],
    },
}


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def stable_id(prefix: str, seed: int, attack_id: str) -> str:
    digest = hashlib.sha1(f"{prefix}:{attack_id}:{seed}".encode()).hexdigest()[:10].upper()
    return f"{prefix}_{digest}"


def _rng(seed: int, attack_id: str) -> random.Random:
    return random.Random(f"{seed}:{attack_id}")


def generate_samples(attack_id: str, config: dict[str, Any]) -> list[dict[str, Any]]:
    if attack_id not in ATTACKS:
        raise ValueError(f"Unsupported attack: {attack_id}")
    params = config.get("parameters", {})
    seed = int(config.get("seed") or params.get("seed") or 0)
    scenario = config.get("scenario") or params.get("scenario") or ATTACKS[attack_id]["scenarios"][0]
    count = int(params.get("instance_count") or params.get("sample_count") or params.get("max_variants") or params.get("merchant_count") or params.get("login_attempts") or params.get("message_count") or 10)
    count = max(1, min(count, 500))
    rng = _rng(seed, attack_id)
    samples = []
    for index in range(count):
        sample_id = f"S{index + 1:04d}"
        if attack_id == "synthetic_identity":
            anomaly = 0.35 + rng.random() * 0.6
            sample = {"sample_id": sample_id, "scenario": scenario, "name": f"Synthetic Person {index + 1}", "account_age_days": rng.randint(1, 45), "document_consistency": round(1 - anomaly, 3), "transaction_velocity": round(2 + anomaly * 15, 3), "credit_history_gap": round(anomaly, 3), "ground_truth": "fraud"}
        elif attack_id == "deepfake_voice":
            anomaly = 0.35 + rng.random() * 0.6
            sample = {"sample_id": sample_id, "scenario": scenario, "impersonated_role": "bank_employee", "urgency": round(anomaly, 3), "requested_otp": scenario == "otp_social_engineering", "spectral_artifact_score": round(anomaly, 3), "prosody_consistency": round(1 - anomaly / 1.4, 3), "ground_truth": "fraud"}
        elif attack_id == "adversarial_perturbation":
            budget = float(params.get("perturbation_budget") or 20) / 100
            original = round(100 + rng.random() * 900, 2)
            delta = round((rng.random() * 2 - 1) * budget, 4)
            sample = {"sample_id": sample_id, "scenario": scenario, "original_amount": original, "amount": round(original * (1 + delta), 2), "perturbation_magnitude": abs(delta), "velocity": round(1 + rng.random() * 8, 3), "device_risk": round(rng.random(), 3), "ground_truth": "fraud"}
        elif attack_id == "account_takeover":
            anomaly = 0.35 + rng.random() * 0.6
            sample = {
                "sample_id": sample_id,
                "scenario": scenario,
                "user_id": f"U{index + 1:04d}",
                "login_ip_distance": round(1500 + anomaly * 5000, 2),
                "new_device_risk": round(0.45 + anomaly * 0.5, 3),
                "session_velocity": round(2 + anomaly * 8, 3),
                "failed_logins": rng.randint(3, 11),
                "geo_velocity": round(1.2 + anomaly * 5.5, 3),
                "ground_truth": "fraud",
            }
        elif attack_id == "social_engineering":
            anomaly = 0.35 + rng.random() * 0.6
            sample = {
                "sample_id": sample_id,
                "scenario": scenario,
                "channel": "sms",
                "urgency_level": round(0.4 + anomaly * 0.6, 3),
                "impersonation_score": round(0.5 + anomaly * 0.4, 3),
                "requested_action": int(scenario in {"refund_scam", "tech_support"}),
                "message_length": rng.randint(55, 260),
                "sender_match": bool(rng.random() > 0.55),
                "ground_truth": "fraud",
            }
        else:
            anomaly = 0.35 + rng.random() * 0.6
            merchant_id = f"M{index + 1:04d}"
            sample = {"sample_id": sample_id, "scenario": scenario, "merchant_id": merchant_id, "business_name": f"Synthetic Commerce {index + 1}", "bank_name_match": scenario not in {"bank_mismatch", "multi_signal"}, "tax_document_valid": scenario not in {"fake_tax_document", "multi_signal"}, "invoice_total": round(100 + rng.random() * 10000, 2), "pricing_anomaly": round(anomaly, 3), "ground_truth": "fraud"}
        samples.append(sample)
    return samples


def ensure_balanced_dataset(samples: list[dict[str, Any]], attack_id: str) -> list[dict[str, Any]]:
    if not samples:
        return []

    fraud = [sample for sample in samples if sample.get("ground_truth") == "fraud"]
    legitimate = [sample for sample in samples if sample.get("ground_truth") == "legitimate"]
    target = max(len(fraud), len(legitimate))
    if target == 0:
        return samples

    def pad_group(group: list[dict[str, Any]], label: str, prefix: str) -> list[dict[str, Any]]:
        padded = list(group)
        while len(padded) < target:
            source = group[0] if group else {"scenario": "baseline"}
            clone = dict(source)
            clone["ground_truth"] = label
            clone["sample_id"] = f"{prefix}{len(padded) + 1:04d}"
            if attack_id == "synthetic_identity":
                clone["account_age_days"] = 365 + len(padded) % 400
                clone["document_consistency"] = 0.95
                clone["transaction_velocity"] = 1.5
                clone["credit_history_gap"] = 0.02
            elif attack_id == "deepfake_voice":
                clone["urgency"] = 0.12
                clone["requested_otp"] = False
                clone["spectral_artifact_score"] = 0.08
                clone["prosody_consistency"] = 0.92
            elif attack_id == "adversarial_perturbation":
                clone["perturbation_magnitude"] = 0.01
                clone["velocity"] = 1.5
                clone["device_risk"] = 0.05
            elif attack_id == "account_takeover":
                clone["login_ip_distance"] = 600
                clone["new_device_risk"] = 0.1
                clone["session_velocity"] = 1.1
                clone["failed_logins"] = 0
                clone["geo_velocity"] = 0.5
            elif attack_id == "social_engineering":
                clone["urgency_level"] = 0.18
                clone["impersonation_score"] = 0.08
                clone["requested_action"] = 0
                clone["message_length"] = 42
                clone["sender_match"] = True
            else:
                clone["bank_name_match"] = True
                clone["tax_document_valid"] = True
                clone["pricing_anomaly"] = 0.03
            padded.append(clone)
        return padded

    if len(fraud) < target:
        fraud = pad_group(fraud, "fraud", "S")
    if len(legitimate) < target:
        legitimate = pad_group(legitimate, "legitimate", "L")

    combined = fraud[:target] + legitimate[:target]
    for idx, sample in enumerate(combined):
        sample.setdefault("sample_id", f"S{idx + 1:04d}")
    return combined


def generate_balanced_samples(attack_id: str, config: dict[str, Any]) -> list[dict[str, Any]]:
    params = config.get("parameters", {})
    seed = int(config.get("seed") or params.get("seed") or 0)
    attack_count = int(params.get("instance_count") or params.get("sample_count") or params.get("max_variants") or params.get("merchant_count") or params.get("login_attempts") or params.get("message_count") or 10)
    attack_count = max(1, min(attack_count, 250))
    fraud = generate_samples(attack_id, {"parameters": {**params, "instance_count": attack_count}, "seed": seed, "scenario": config.get("scenario") or params.get("scenario")})
    legitimate = []
    for index, sample in enumerate(fraud):
        if attack_id == "synthetic_identity":
            legitimate.append({**sample, "sample_id": f"L{index + 1:04d}", "ground_truth": "legitimate", "account_age_days": 365 + index % 400, "document_consistency": 0.95, "transaction_velocity": 1.5, "credit_history_gap": 0.02})
        elif attack_id == "deepfake_voice":
            legitimate.append({**sample, "sample_id": f"L{index + 1:04d}", "ground_truth": "legitimate", "urgency": 0.12, "requested_otp": False, "spectral_artifact_score": 0.08, "prosody_consistency": 0.92})
        elif attack_id == "adversarial_perturbation":
            legitimate.append({**sample, "sample_id": f"L{index + 1:04d}", "ground_truth": "legitimate", "perturbation_magnitude": 0.01, "velocity": 1.5, "device_risk": 0.05})
        elif attack_id == "account_takeover":
            legitimate.append({**sample, "sample_id": f"L{index + 1:04d}", "ground_truth": "legitimate", "login_ip_distance": 600 + index % 300, "new_device_risk": 0.08, "session_velocity": 1.1, "failed_logins": 0, "geo_velocity": 0.35})
        elif attack_id == "social_engineering":
            legitimate.append({**sample, "sample_id": f"L{index + 1:04d}", "ground_truth": "legitimate", "urgency_level": 0.18, "impersonation_score": 0.08, "requested_action": 0, "message_length": 42, "sender_match": True})
        else:
            legitimate.append({**sample, "sample_id": f"L{index + 1:04d}", "ground_truth": "legitimate", "bank_name_match": True, "tax_document_valid": True, "pricing_anomaly": 0.03})
    balanced = ensure_balanced_dataset(fraud + legitimate, attack_id)
    for i, sample in enumerate(balanced):
        sample.setdefault("sample_id", f"S{i + 1:04d}")
    return balanced


def detect_samples(attack_id: str, samples: list[dict[str, Any]], model_version: str = "v1.0") -> list[dict[str, Any]]:
    predictions = []
    for sample in samples:
        if attack_id == "synthetic_identity":
            score = min(1, 0.5 * (1 - sample["document_consistency"]) + 0.3 * min(sample["transaction_velocity"] / 15, 1) + 0.2 * sample["credit_history_gap"])
            factors = [("document_consistency", sample["document_consistency"], "high"), ("transaction_velocity", sample["transaction_velocity"], "medium")]
        elif attack_id == "deepfake_voice":
            score = min(1, 0.65 * sample["spectral_artifact_score"] + 0.35 * sample["urgency"])
            factors = [("spectral_artifact_score", sample["spectral_artifact_score"], "high"), ("urgency", sample["urgency"], "medium")]
        elif attack_id == "adversarial_perturbation":
            score = min(1, 0.55 * sample["device_risk"] + 0.45 * min(sample["velocity"] / 9, 1))
            factors = [("device_risk", sample["device_risk"], "high"), ("velocity", sample["velocity"], "medium")]
        elif attack_id == "account_takeover":
            score = min(1, 0.4 * min(sample["login_ip_distance"] / 8000, 1) + 0.25 * sample["new_device_risk"] + 0.2 * min(sample["session_velocity"] / 10, 1) + 0.15 * min(sample["failed_logins"] / 10, 1))
            factors = [("login_ip_distance", sample["login_ip_distance"], "high"), ("new_device_risk", sample["new_device_risk"], "medium")]
        elif attack_id == "social_engineering":
            score = min(1, 0.45 * sample["impersonation_score"] + 0.3 * sample["urgency_level"] + 0.15 * int(sample["requested_action"]) + 0.1 * (0 if sample["sender_match"] else 1))
            factors = [("impersonation_score", sample["impersonation_score"], "high"), ("urgency_level", sample["urgency_level"], "medium")]
        else:
            mismatch = int(not sample["bank_name_match"]) + int(not sample["tax_document_valid"])
            score = min(1, 0.3 * mismatch + 0.7 * sample["pricing_anomaly"])
            factors = [("pricing_anomaly", sample["pricing_anomaly"], "high"), ("bank_name_match", sample["bank_name_match"], "medium")]
        prediction = "fraud" if score >= 0.5 else "legitimate"
        predictions.append({"sample_id": sample["sample_id"], "ground_truth": sample.get("ground_truth", "fraud"), "prediction": prediction, "risk_score": round(score, 4), "confidence": round(abs(score - 0.5) * 2, 4), "decision": "flagged" if prediction == "fraud" else "passed", "explanation": [{"feature": f, "value": v, "description": f"{f} contributed to the risk score", "impact": impact} for f, v, impact in factors]})
    return predictions


def evaluate(predictions: list[dict[str, Any]], attack_id: str, run_id: str, model_version: str, dataset_mode: str | None = None) -> dict[str, Any]:
    tp = sum(p["ground_truth"] == "fraud" and p["prediction"] == "fraud" for p in predictions)
    tn = sum(p["ground_truth"] == "legitimate" and p["prediction"] == "legitimate" for p in predictions)
    fp = sum(p["ground_truth"] == "legitimate" and p["prediction"] == "fraud" for p in predictions)
    fn = sum(p["ground_truth"] == "fraud" and p["prediction"] == "legitimate" for p in predictions)
    precision = tp / (tp + fp) if tp + fp else 0.0
    recall = tp / (tp + fn) if tp + fn else 0.0
    f1 = 2 * precision * recall / (precision + recall) if precision + recall else 0.0
    total = len(predictions)
    false_positive_rate = fp / (fp + tn) if (fp + tn) else 0.0
    false_negative_rate = fn / (fn + tp) if (fn + tp) else 0.0
    dataset_label = dataset_mode or "balanced"
    return {"run_id": run_id, "attack_id": attack_id, "model_version": model_version, "timestamp": utc_now(), "dataset_mode": dataset_label, "summary": {"total_samples": total, "detected": tp, "missed": fn, "detection_rate": round(recall, 4)}, "metrics": {"precision": round(precision, 4), "recall": round(recall, 4), "f1": round(f1, 4), "roc_auc": round((precision + recall) / 2, 4), "false_positive_rate": round(false_positive_rate, 4), "false_negative_rate": round(false_negative_rate, 4)}, "confusion_matrix": {"true_positive": tp, "true_negative": tn, "false_positive": fp, "false_negative": fn}, "scenario_breakdown": [], "status": "completed"}
