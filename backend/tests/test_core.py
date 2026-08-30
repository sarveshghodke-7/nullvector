import json
import os
import tempfile
import unittest
from pathlib import Path

from backend.core import detect_samples, ensure_balanced_dataset, evaluate, generate_balanced_samples, generate_samples
from backend.ml_models import train_model
from backend.service import benchmark_summary, collect_hard_examples, generate
from backend.schemas.api import AttackConfig
from backend.storage.database import SessionLocal
from backend.storage.repositories import ResultRecord, RunRecord

class CoreTests(unittest.TestCase):
    def test_seeded_generation_is_reproducible(self):
        config = {"scenario": "multi_signal", "parameters": {"instance_count": 4}, "seed": 42}
        self.assertEqual(generate_samples("synthetic_identity", config), generate_samples("synthetic_identity", config))

    def test_all_attacks_generate_and_detect(self):
        cases = {
            "synthetic_identity": "instance_count",
            "deepfake_voice": "sample_count",
            "adversarial_perturbation": "max_variants",
            "fake_merchant": "merchant_count",
            "account_takeover": "login_attempts",
            "social_engineering": "message_count",
        }
        for attack_id, count_key in cases.items():
            samples = generate_samples(attack_id, {"parameters": {count_key: 3}, "seed": 9})
            predictions = detect_samples(attack_id, samples)
            self.assertEqual(len(predictions), 3)
            self.assertEqual(evaluate(predictions, attack_id, "RUN_TEST", "v1.0")["summary"]["total_samples"], 3)

    def test_collect_hard_examples_extracts_false_negatives(self):
        predictions = [
            {"sample_id": "S001", "ground_truth": "fraud", "prediction": "legitimate", "risk_score": 0.35, "confidence": 0.3, "decision": "passed", "explanation": []},
            {"sample_id": "S002", "ground_truth": "fraud", "prediction": "fraud", "risk_score": 0.82, "confidence": 0.64, "decision": "flagged", "explanation": []},
            {"sample_id": "S003", "ground_truth": "legitimate", "prediction": "legitimate", "risk_score": 0.08, "confidence": 0.16, "decision": "passed", "explanation": []},
        ]
        hard_examples = collect_hard_examples("synthetic_identity", "RUN_FEEDBACK", predictions)
        self.assertEqual(len(hard_examples), 1)
        self.assertEqual(hard_examples[0]["sample_id"], "S001")
        self.assertEqual(hard_examples[0]["attack_id"], "synthetic_identity")

    def test_balanced_generation_includes_legitimate_negatives(self):
        samples = generate_balanced_samples("synthetic_identity", {"parameters": {"instance_count": 8}, "seed": 12})
        self.assertEqual(len(samples), 16)
        self.assertGreater(sum(1 for s in samples if s.get("ground_truth") == "fraud"), 0)
        self.assertGreater(sum(1 for s in samples if s.get("ground_truth") == "legitimate"), 0)

    def test_ensure_balanced_dataset_reinforces_legitimate_negatives(self):
        fraud_only = [
            {"sample_id": "S001", "account_age_days": 6, "document_consistency": 0.44, "transaction_velocity": 10.3, "credit_history_gap": 0.55, "ground_truth": "fraud"},
            {"sample_id": "S002", "account_age_days": 9, "document_consistency": 0.39, "transaction_velocity": 11.4, "credit_history_gap": 0.61, "ground_truth": "fraud"},
            {"sample_id": "S003", "account_age_days": 8, "document_consistency": 0.41, "transaction_velocity": 9.7, "credit_history_gap": 0.57, "ground_truth": "fraud"},
        ]
        balanced = ensure_balanced_dataset(fraud_only, "synthetic_identity")
        self.assertEqual(sum(1 for s in balanced if s.get("ground_truth") == "fraud"), 3)
        self.assertEqual(sum(1 for s in balanced if s.get("ground_truth") == "legitimate"), 3)

    def test_train_model_accepts_hard_examples_for_retraining(self):
        fraud_samples = [{"sample_id": "H1", "ground_truth": "fraud", "account_age_days": 4, "document_consistency": 0.2, "transaction_velocity": 18.0, "credit_history_gap": 0.7}]
        legit_samples = [{"sample_id": "L1", "ground_truth": "legitimate", "account_age_days": 620, "document_consistency": 0.96, "transaction_velocity": 1.2, "credit_history_gap": 0.02}]
        trained = train_model("synthetic_identity", "v9.9", seed=99, fraud_samples=fraud_samples, legitimate_samples=legit_samples)
        self.assertEqual(trained["training_samples"], 2)

    def test_evaluation_reports_dataset_mode(self):
        predictions = [
            {"sample_id": "S001", "ground_truth": "fraud", "prediction": "fraud", "risk_score": 0.8, "confidence": 0.6, "decision": "flagged", "explanation": []},
            {"sample_id": "L001", "ground_truth": "legitimate", "prediction": "legitimate", "risk_score": 0.1, "confidence": 0.2, "decision": "passed", "explanation": []},
        ]
        result = evaluate(predictions, "synthetic_identity", "RUN_DATASET", "v1.0", dataset_mode="balanced")
        self.assertEqual(result["dataset_mode"], "balanced")
        self.assertIn("false_positive_rate", result["metrics"])
        self.assertIn("false_negative_rate", result["metrics"])

    def test_benchmark_summary_aggregates_attack_metrics(self):
        with SessionLocal() as session:
            session.query(ResultRecord).filter(ResultRecord.run_id.in_(["BENCH_SYN_01", "BENCH_MER_01"])).delete(synchronize_session=False)
            session.query(RunRecord).filter(RunRecord.attack_id.in_(["synthetic_identity", "fake_merchant"])).delete(synchronize_session=False)
            session.add(RunRecord(run_id="BENCH_SYN_01", attack_id="synthetic_identity", scenario="kyc_inconsistency", status="completed", timestamp="2026-08-30T00:00:00Z", config_json='{"requested_count": 8}', generated_count=8, detected_count=6, missed_count=2, detection_rate=0.75, model_version="v1.0"))
            session.add(RunRecord(run_id="BENCH_MER_01", attack_id="fake_merchant", scenario="shell_business", status="completed", timestamp="2026-08-30T00:00:10Z", config_json='{"requested_count": 8}', generated_count=8, detected_count=4, missed_count=4, detection_rate=0.5, model_version="v1.0"))
            session.commit()
        summary = benchmark_summary()
        self.assertGreaterEqual(len(summary), 2)
        synthetic = next(item for item in summary if item["attack_id"] == "synthetic_identity")
        self.assertEqual(synthetic["avg_detection_rate"], 0.75)
        self.assertEqual(synthetic["total_runs"], 1)

    def test_generate_creates_real_artifact_files(self):
        config = AttackConfig(
            attackId="deepfake_voice",
            scenario="bank_impersonation",
            artifacts=["audio_sample", "voice_analysis"],
            parameters={"sample_count": 2},
            seed=77,
        )
        response = generate("deepfake_voice", config)
        run_id = response["run_id"]
        run_dir = Path("backend/data/generated") / run_id
        self.assertTrue((run_dir / "samples.json").exists())
        self.assertTrue(any(path.exists() for path in [run_dir / "audio_sample.wav", run_dir / "voice_analysis.json"]))
        self.assertTrue(any(item.get("data_location") for item in response["payload"]["artifacts"]))
        self.assertTrue(any(item.get("format") == "wav" for item in response["payload"]["artifacts"]))

if __name__ == "__main__":
    unittest.main()
