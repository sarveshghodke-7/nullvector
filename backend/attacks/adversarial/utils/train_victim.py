"""
Module: backend/attacks/adversarial/utils/train_victim.py
Purpose: Trains baseline XGBoost pipeline and exports victim model artifact.
"""

import os
import joblib
import pandas as pd
from xgboost import XGBClassifier
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import OrdinalEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.metrics import classification_report

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
BASE_DIR = os.path.abspath(os.path.join(CURRENT_DIR, "../../../"))
DATA_PATH = os.path.join(BASE_DIR, "storage", "dataset", "mini_dataset.csv")
MODEL_DIR = os.path.join(BASE_DIR, "storage")
MODEL_PATH = os.path.join(MODEL_DIR, "victim_model.pkl")


def train_and_save():
    """Trains an XGBoost pipeline on the mini dataset and serializes the model."""
    print("[1/3] Loading mini dataset...")
    df = pd.read_csv(DATA_PATH)

    categorical_cols = ["ProductCD", "card4", "card6", "P_emaildomain", "R_emaildomain", "DeviceType", "DeviceInfo"]
    numerical_cols = ["TransactionAmt"]
    target = "isFraud"

    X = df[numerical_cols + categorical_cols]
    y = df[target]

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

    print("[2/3] Constructing preprocessing transformer and XGBoost classifier...")
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

    pipeline = Pipeline(steps=[
        ("preprocessor", preprocessor),
        ("classifier", model)
    ])

    print("[3/3] Training pipeline...")
    pipeline.fit(X_train, y_train)

    y_pred = pipeline.predict(X_test)
    print("\n--- Model Baseline Evaluation ---")
    print(classification_report(y_test, y_pred))

    os.makedirs(MODEL_DIR, exist_ok=True)
    joblib.dump(pipeline, MODEL_PATH)
    print(f"[*] Victim model exported to: {MODEL_PATH}")


if __name__ == "__main__":
    train_and_save()
