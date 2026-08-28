"""
Module: backend/attacks/adversarial/utils/mini_dataset.py
Purpose: Extracts and balances a mini-dataset from raw IEEE-CIS transaction and identity records.
"""

import os
import pandas as pd

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
BASE_DIR = os.path.abspath(os.path.join(CURRENT_DIR, "../../../"))
DATA_DIR = os.path.join(BASE_DIR, "storage", "dataset")

TRANSACTION_FILE = os.path.join(DATA_DIR, "train_transaction.csv")
IDENTITY_FILE = os.path.join(DATA_DIR, "train_identity.csv")
OUTPUT_FILE = os.path.join(DATA_DIR, "mini_dataset.csv")

SELECTED_FEATURES = [
    "TransactionID",
    "isFraud",
    "TransactionAmt",
    "ProductCD",
    "card4",
    "card6",
    "P_emaildomain",
    "R_emaildomain",
    "DeviceType",
    "DeviceInfo"
]


def build_mini_dataset(legit_samples: int = 5000, fraud_samples: int = 500):
    """Builds and exports a balanced mini-dataset."""
    print("[1/4] Reading transaction and identity datasets...")
    df_trans = pd.read_csv(TRANSACTION_FILE, low_memory=False)
    df_id = pd.read_csv(IDENTITY_FILE, low_memory=False)

    print("[2/4] Merging datasets on TransactionID...")
    merged = df_trans.merge(df_id, on="TransactionID", how="left")

    available_cols = [c for c in SELECTED_FEATURES if c in merged.columns]
    df = merged[available_cols].copy()

    print("[3/4] Imputing missing values...")
    df["DeviceType"] = df["DeviceType"].fillna("unknown")
    df["DeviceInfo"] = df["DeviceInfo"].fillna("unknown")
    df["P_emaildomain"] = df["P_emaildomain"].fillna("missing")
    df["R_emaildomain"] = df["R_emaildomain"].fillna("missing")
    df["card4"] = df["card4"].fillna("unknown")
    df["card6"] = df["card6"].fillna("unknown")
    df["ProductCD"] = df["ProductCD"].fillna("W")
    df["TransactionAmt"] = df["TransactionAmt"].fillna(0.0)

    print("[4/4] Sampling balanced subsets...")
    legit = df[df["isFraud"] == 0].sample(n=legit_samples, random_state=42)
    fraud = df[df["isFraud"] == 1].sample(n=fraud_samples, random_state=42)

    final_df = pd.concat([legit, fraud]).sample(frac=1.0, random_state=42).reset_index(drop=True)
    os.makedirs(DATA_DIR, exist_ok=True)
    final_df.to_csv(OUTPUT_FILE, index=False)
    print(f"[*] Mini dataset saved to: {OUTPUT_FILE} (Shape: {final_df.shape})")


if __name__ == "__main__":
    build_mini_dataset()
