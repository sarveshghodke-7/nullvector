"""
Module: backend/attacks/adversarial/detector.py
Pipeline stage: DETECT
"""

import copy
import json
import os
from typing import Any, Dict, List
import joblib
import pandas as pd

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
BASE_DIR = os.path.abspath(os.path.join(CURRENT_DIR, "../../"))
CONFIG_PATH = os.path.join(CURRENT_DIR, "config.json")
MODEL_PATH = os.path.join(BASE_DIR, "storage", "victim_model.pkl")


class AdversarialDetector:
    def __init__(self):
        with open(CONFIG_PATH, "r") as f:
            self.config = json.load(f)
        self.victim_model = joblib.load(MODEL_PATH)
        self.squeezing_map = self.config.get("defense", {}).get("squeezing_categories", {})

    def apply_feature_squeezing(self, record: Dict[str, Any]) -> Dict[str, Any]:
        """Squeezes high-cardinality categorical fields to remove micro-perturbations."""
        squeezed = copy.deepcopy(record)
        for col, allowed_values in self.squeezing_map.items():
            if col in squeezed:
                val = str(squeezed[col])
                matched = next((k for k in allowed_values if k.lower() in val.lower()), "other")
                squeezed[col] = matched
        return squeezed

    def score_record(self, record: Dict[str, Any]) -> Dict[str, Any]:
        """Scores a sample with both the baseline model and defense mechanisms."""
        # 1. Base Model Raw Score
        raw_df = pd.DataFrame([record])
        base_score = float(self.victim_model.predict_proba(raw_df)[0][1])

        # 2. Score after Feature Squeezing
        squeezed_record = self.apply_feature_squeezing(record)
        squeezed_df = pd.DataFrame([squeezed_record])
        squeezed_score = float(self.victim_model.predict_proba(squeezed_df)[0][1])

        # 3. Discrepancy Detection: High score shift indicates adversarial noise
        divergence = abs(squeezed_score - base_score)
        is_adversarial = divergence > 0.15 or (record.get("TransactionAmt", 0) > 1000 and squeezed_score > 0.50)

        defense_score = max(base_score, squeezed_score)
        prediction = 1 if (defense_score >= 0.50 or is_adversarial) else 0

        return {
            "prediction": prediction,
            "base_score": round(base_score, 4),
            "defense_score": round(defense_score, 4),
            "is_adversarial_detected": bool(is_adversarial),
            "divergence": round(divergence, 4)
        }


def detect(payload: Dict[str, Any] = None) -> Dict[str, Any]:
    """Evaluates samples generated in the GENERATE stage against the defense layer."""
    detector = AdversarialDetector()
    results = []

    samples = payload.get("samples", []) if payload else []

    for item in samples:
        target_record = item.get("perturbed_record", item.get("original_record", item))
        detection_result = detector.score_record(target_record)
        results.append({
            "original_score": item.get("original_score"),
            "perturbed_score": item.get("perturbed_score"),
            "perturbed_score" : target_record,
            "detection": detection_result
        })

    caught_attacks = sum(1 for r in results if r["detection"]["prediction"] == 1)

    return {
        "status": "success",
        "stage": "DETECT",
        "attack_type": "adversarial",
        "metrics": {
            "total_scored": len(results),
            "attacks_intercepted": caught_attacks,
            "interception_rate": round(caught_attacks / max(len(results), 1), 4)
        },
        "results": results
    }


if __name__ == "__main__":
    from generator import generate
    gen_data = generate()
    det_data = detect(gen_data)
    print(json.dumps(det_data, indent=2))
