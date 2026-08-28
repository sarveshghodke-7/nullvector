"""
Module: backend/attacks/adversarial/tests/test_pipeline.py
Purpose: Isolated end-to-end testing of the adversarial pipeline without touching the global orchestrator.
"""

import sys
import os
import json

# Add the backend root to sys.path so imports work regardless of where you run the script
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_ROOT = os.path.abspath(os.path.join(CURRENT_DIR, "../../../"))
if BACKEND_ROOT not in sys.path:
    sys.path.insert(0, BACKEND_ROOT)

# Import your attack stages
from attacks.adversarial.identify import identify
from attacks.adversarial.generator import generate
from attacks.adversarial.detector import detect
from attacks.adversarial.evaluator import evaluate
from attacks.adversarial.feedback import feedback

def run_test_pipeline():
    print("\n" + "="*50)
    print("STARTING ADVERSARIAL PIPELINE TEST")
    print("="*50)

    # 1. IDENTIFY
    print("\n>>> [1/5] STAGE: IDENTIFY")
    id_payload = identify()
    if id_payload.get("status") == "error":
        print("IDENTIFY FAILED. Check missing artifacts.")
        print(json.dumps(id_payload, indent=2))
        return
    print(f" Identified Attack: {id_payload['specification']['name']}")

    # 2. GENERATE
    print("\n>>> [2/5] STAGE: GENERATE")
    gen_payload = generate()
    metrics = gen_payload.get('metrics', {})
    print(f"Generated {metrics.get('total_candidates')} attacks (Success Rate: {metrics.get('success_rate', 0)*100}%)")

    # 3. DETECT
    print("\n>>> [3/5] STAGE: DETECT")
    det_payload = detect(gen_payload)
    det_metrics = det_payload.get('metrics', {})
    print(f"Scored {det_metrics.get('total_scored')} samples. Intercepted: {det_metrics.get('attacks_intercepted')}")

    # 4. EVALUATE
    print("\n>>> [4/5] STAGE: EVALUATE")
    eval_payload = evaluate(det_payload)
    eval_metrics = eval_payload.get('metrics', {})
    print(f"Evaluation complete.")
    print(f"   - Baseline Attack Success: {eval_metrics.get('attack_success_rate_baseline', 0)*100}%")
    print(f"   - Defense Interception:    {eval_metrics.get('defense_interception_rate', 0)*100}%")
    print(f"   - F1 Score:                {eval_metrics.get('f1_score')}")

    # 5. FEEDBACK (Retraining)
    print("\n>>> [5/5] STAGE: FEEDBACK (Model Retraining)")
    # We pass det_payload because it contains the perturbed_record needed for retraining
    fb_payload = feedback(det_payload)
    fb_metrics = fb_payload.get('metrics', {})
    
    if fb_metrics.get('hard_examples_injected', 0) > 0:
        print(f" Feedback loop complete. Injected {fb_metrics.get('hard_examples_injected')} hard examples.")
        print(f" NEW Model Accuracy: {fb_metrics.get('new_model_accuracy')}")
        print(f" NEW Fraud Recall:   {fb_metrics.get('new_fraud_recall')}")
    else:
        print("No hard examples needed. Model caught all attacks.")

    print("\n" + "="*50)
    print(" PIPELINE TEST FINISHED SUCCESSFULLY")
    print("="*50 + "\n")

if __name__ == "__main__":
    run_test_pipeline()
