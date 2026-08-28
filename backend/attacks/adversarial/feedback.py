"""
Module: backend/attacks/adversarial/feedback.py
Pipeline stage: FEEDBACK
"""

import os
import json
import pandas as pd
import joblib
from typing import Any, Dict, List
from xgboost import XGBClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import OrdinalEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.metrics import classification_report

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
BASE_DIR = os.path.abspath(os.path.join(CURRENT_DIR, "../../"))

DATA_PATH = os.path.join(BASE_DIR, "storage", "dataset", "mini_dataset.csv")
AUGMENTED_DATA_PATH = os.path.join(BASE_DIR, "storage", "dataset", "augmented_dataset.csv")
MODEL_PATH = os.path.join(BASE_DIR, "storage", "victim_model.pkl")


class AdversarialFeedbackLoop:
    def __init__(self):
        self.original_data_path = DATA_PATH
        self.augmented_data_path = AUGMENTED_DATA_PATH
        self.model_path = MODEL_PATH

    def extract_false_negatives(self, eval_payload: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Analyzes the evaluation payload to find attacks that evaded the detector."""
        results = eval_payload.get("results", [])
        # We want the records where the detector predicted 0 (Safe) but it was actually an attack
        missed_attacks = [
            r for r in results 
            if r.get("detection", {}).get("prediction") == 0
        ]
        return missed_attacks

    def generate_hard_examples(self, missed_attacks: List[Dict[str, Any]]) -> pd.DataFrame:
        """Converts missed attacks into labeled training rows."""
        hard_examples = []
        for attack in missed_attacks:
            # Safely extract the perturbed record. The structure depends on how evaluate passed it,
            # but usually, we inject the 'perturbed_record' into the results array.
            record = attack.get("perturbed_record")
            if not record:
                # Fallback if the payload structure varies
                continue 
            
            # Ensure it is labeled as fraud
            record["isFraud"] = 1
            hard_examples.append(record)
            
        return pd.DataFrame(hard_examples)

    def retrain_model(self, hard_examples_df: pd.DataFrame) -> Dict[str, Any]:
        """Appends hard examples to the dataset and retrains the XGBoost model."""
        print(f"[*] Loading original dataset from {self.original_data_path}...")
        df_base = pd.read_csv(self.original_data_path)
        
        if not hard_examples_df.empty:
            print(f"[*] Appending {len(hard_examples_df)} hard examples to dataset...")
            df_augmented = pd.concat([df_base, hard_examples_df], ignore_index=True)
            # Save the augmented dataset for auditing
            df_augmented.to_csv(self.augmented_data_path, index=False)
        else:
            print("[*] No hard examples to append. Retraining on base dataset.")
            df_augmented = df_base

        # Retraining logic (mirroring train_victim.py)
        categorical_cols = ["ProductCD", "card4", "card6", "P_emaildomain", "R_emaildomain", "DeviceType", "DeviceInfo"]
        numerical_cols = ["TransactionAmt"]
        target = "isFraud"

        X = df_augmented[numerical_cols + categorical_cols]
        y = df_augmented[target]

        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

        preprocessor = ColumnTransformer(
            transformers=[
                ("cat", OrdinalEncoder(handle_unknown="use_encoded_value", unknown_value=-1), categorical_cols)
            ],
            remainder="passthrough"
        )

        model = XGBClassifier(
            n_estimators=120,
            max_depth=5,
            learning_rate=0.08,
            eval_metric="logloss",
            random_state=42,
            scale_pos_weight=10
        )

        pipeline = Pipeline(steps=[("preprocessor", preprocessor), ("classifier", model)])

        print("[*] Training hardened model...")
        pipeline.fit(X_train, y_train)

        # Quick Accuracy Check on the test split
        y_pred = pipeline.predict(X_test)
        report = classification_report(y_test, y_pred, output_dict=True)

        joblib.dump(pipeline, self.model_path)
        print(f"[*] Hardened model saved to {self.model_path}")

        return {
            "model_path": self.model_path,
            "augmented_dataset_path": self.augmented_data_path,
            "new_accuracy": report["accuracy"],
            "fraud_recall": report["1"]["recall"]
        }


def feedback(payload: Dict[str, Any] = None) -> Dict[str, Any]:
    """Executes the localized feedback loop."""
    loop = AdversarialFeedbackLoop()
    
    # 1. Analyze
    missed_attacks = loop.extract_false_negatives(payload)
    
    if not missed_attacks:
        return {
            "status": "success",
            "stage": "FEEDBACK",
            "message": "No false negatives to learn from. The model caught everything.",
            "metrics": {"hard_examples_added": 0}
        }

    # 2. Hard Example Generation
    # Note: To make this work seamlessly, ensure detector.py/evaluator.py passes the 'perturbed_record' forward.
    # For robust demonstration, if perturbed_record isn't deep in the payload, we assume the user 
    # passes the combined outputs. 
    hard_examples_df = loop.generate_hard_examples(missed_attacks)

    # 3. Retrain
    retrain_metrics = loop.retrain_model(hard_examples_df)

    return {
        "status": "success",
        "stage": "FEEDBACK",
        "attack_type": "adversarial",
        "metrics": {
            "false_negatives_analyzed": len(missed_attacks),
            "hard_examples_injected": len(hard_examples_df),
            "new_model_accuracy": round(retrain_metrics["new_accuracy"], 4),
            "new_fraud_recall": round(retrain_metrics["fraud_recall"], 4)
        },
        "artifacts": {
            "updated_model": retrain_metrics["model_path"],
            "augmented_dataset": retrain_metrics["augmented_dataset_path"]
        }
    }


if __name__ == "__main__":
    # Mock payload simulation for direct execution testing
    # In reality, you will pass the output from evaluator.py here.
    mock_evaluate_payload = {
        "results": [
            {
                "detection": {"prediction": 0},
                "perturbed_record": {
                    "TransactionID": 9999999, "isFraud": 1, "TransactionAmt": 500.0,
                    "ProductCD": "C", "card4": "visa", "card6": "credit",
                    "P_emaildomain": "rocketmail.com", "R_emaildomain": "gmail.com",
                    "DeviceType": "unknown", "DeviceInfo": "Windows"
                }
            }
        ]
    }
    
    result = feedback(mock_evaluate_payload)
    print("\n=== FEEDBACK RESULTS ===")
    print(json.dumps(result, indent=2))
