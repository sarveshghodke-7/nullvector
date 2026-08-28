"""
Module: backend/attacks/adversarial/evaluator.py
Pipeline stage: EVALUATE
"""

import json
from typing import Any, Dict


def evaluate(payload: Dict[str, Any] = None) -> Dict[str, Any]:
    """Calculates standardized metrics comparing pre-attack and post-defense performance."""
    results = payload.get("results", []) if payload else []

    if not results:
        return {
            "status": "warning",
            "stage": "EVALUATE",
            "message": "No sample results provided for evaluation.",
            "metrics": {}
        }

    total_samples = len(results)
    evaded_count =0
    for r in results: 
        score = r.get("detection",{}).get("base_score",1.0)
        if isinstance(score,dict):
            score = 1.0
        if float(score)<0.40:
            evaded_count+=1 
    # evaded_count = sum(1 for r in results if r.get("perturbed_score", 1.0) < 0.40)
    intercepted_count = sum(1 for r in results if r["detection"]["prediction"] == 1)
    false_negatives = total_samples - intercepted_count

    asr_pre_defense = round(evaded_count / total_samples, 4)
    defense_success_rate = round(intercepted_count / total_samples, 4)

    # Standard metrics
    precision = 1.0 if intercepted_count > 0 else 0.0
    recall = round(intercepted_count / total_samples, 4)
    f1 = round(2 * (precision * recall) / max((precision + recall), 0.0001), 4)

    return {
        "status": "success",
        "stage": "EVALUATE",
        "attack_type": "adversarial",
        "metrics": {
            "total_evaluated": total_samples,
            "attack_success_rate_baseline": asr_pre_defense,
            "defense_interception_rate": defense_success_rate,
            "false_negatives": false_negatives,
            "precision": precision,
            "recall": recall,
            "f1_score": f1
        },
        "summary": (
            f"The attack achieved a {asr_pre_defense:.1%} baseline evasion rate against the standard XGBoost model. "
            f"After defense application (Feature Squeezing + Consistency Checking), {defense_success_rate:.1%} "
            f"of adversarial attempts were intercepted (F1: {f1})."
        )
    }


if __name__ == "__main__":
    from generator import generate
    from detector import detect

    gen_payload = generate()
    det_payload = detect(gen_payload)
    eval_payload = evaluate(det_payload)
    print(json.dumps(eval_payload, indent=2))
