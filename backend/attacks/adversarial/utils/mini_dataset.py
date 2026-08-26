import os
import pandas as pd

# Dynamic path resolution to backend root
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
print(CURRENT_DIR)
BASE_DIR = os.path.abspath(os.path.join(CURRENT_DIR, "../../../"))
print(BASE_DIR)
DATA_DIR = os.path.join(BASE_DIR, "storage", "dataset")
print(DATA_DIR)
TRANSACTION_FILE = os.path.join(DATA_DIR, "train_transaction.csv")
IDENTITY_FILE = os.path.join(DATA_DIR, "train_identity.csv")
OUTPUT_FILE = os.path.join(DATA_DIR, "mini_dataset.csv")
print(OUTPUT_FILE)
print(TRANSACTION_FILE)
print(IDENTITY_FILE)
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

def build_mini_dataset():
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
    legit = df[df["isFraud"] == 0].sample(n=5000, random_state=42)
    fraud = df[df["isFraud"] == 1].sample(n=500, random_state=42)

    final_df = pd.concat([legit, fraud]).sample(frac=1.0, random_state=42).reset_index(drop=True)
    final_df.to_csv(OUTPUT_FILE, index=False)
    print(f" Mini dataset saved to: {OUTPUT_FILE} (Shape: {final_df.shape})")

if __name__ == "__main__":
    build_mini_dataset()
