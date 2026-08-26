"""
Module: backend/attacks/adversarial/generator.py
Pipeline stage: GENERATE
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
DATA_PATH = os.path.join(BASE_DIR, "storage", "dataset", "mini_dataset.csv")


class AdversarialGenerator:
    def __init__(self, config: Dict[str, Any] = None):
        if config is None:
            with open(CONFIG_PATH, "r") as f:
                self.config = json.load(f)
        else:
            self.config = config

        self.model = joblib.load(MODEL_PATH)
        self.df = pd.read_csv(DATA_PATH)
        self.mutable_cols = self.config["features"]["mutable_categorical"]
        self.threshold = self.config.get("confidence_threshold", 0.40)
        self.attack_space = self._build_attack_space()

    def _build_attack_space(self) -> Dict[str, List[str]]:
        space = {}
        for col in self.mutable_cols:
            if col in self.df.columns:
                space[col] = self.df[col].dropna().unique().tolist()
        return space

    def perturb_single_record(self, record: Dict[str, Any], initial_score: float) -> Dict[str, Any]:
        perturbed = copy.deepcopy(record)
        current_score = initial_score
        modifications = []

        for feature in self.mutable_cols:
            if feature not in self.attack_space:
                continue

            best_val = perturbed.get(feature)
            for candidate in self.attack_space[feature]:
                if candidate == perturbed.get(feature):
                    continue

                test_tx = copy.deepcopy(perturbed)
                test_tx[feature] = candidate
                test_df = pd.DataFrame([test_tx])

                score = float(self.model.predict_proba(test_df)[0][1])

                if score < current_score:
                    modifications.append({
                        "feature": feature,
                        "from": best_val,
                        "to": candidate,
                        "score_drop": round(current_score - score, 4),
                        "new_score": round(score, 4)
                    })
                    current_score = score
                    best_val = candidate

            perturbed[feature] = best_val
            if current_score < self.threshold:
                break

        return {
            "evaded": current_score < self.threshold,
            "original_score": float(initial_score),
            "perturbed_score": float(current_score),
            "original_record": record,
            "perturbed_record": perturbed,
            "modifications": modifications
        }


def generate(payload: Dict[str, Any] = None) -> Dict[str, Any]:
    """Generates perturbed tabular records to evade fraud detection."""
    gen = AdversarialGenerator()
    fraud_samples = gen.df[gen.df["isFraud"] == 1].head(10)

    generated_attacks = []
    for _, row in fraud_samples.iterrows():
        rec = row.to_dict()
        row_df = pd.DataFrame([rec])
        initial_prob = float(gen.model.predict_proba(row_df)[0][1])

        # Target high-confidence fraud detections
        if initial_prob >= 0.70:
            attack_res = gen.perturb_single_record(rec, initial_prob)
            generated_attacks.append(attack_res)

    successful_evasions = sum(1 for a in generated_attacks if a["evaded"])

    return {
        "status": "success",
        "stage": "GENERATE",
        "attack_type": "adversarial",
        "metrics": {
            "total_candidates": len(generated_attacks),
            "successful_evasions": successful_evasions,
            "success_rate": round(successful_evasions / max(len(generated_attacks), 1), 4)
        },
        "samples": generated_attacks
    }


if __name__ == "__main__":
    result = generate()
    print(json.dumps(result, indent=2))
