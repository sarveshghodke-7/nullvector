# LLM-Orchestrated Adaptive Card Testing (BIN Attack)

## 1. Attack Overview

An LLM-driven Red Team agent probes card validity by issuing small-value transactions across multiple merchants. Unlike traditional scripted card testing (fixed amount, single merchant, easily rule-blocked), this attack uses an LLM to read back approve/decline signals after each round and adapt its probing strategy — varying amount ranges, merchant category spread, timing, and device fingerprints — to evade static velocity thresholds. This is the GenAI-native component: the adaptation loop, not the probing itself.

**Attack ID:** `card_testing`
**Target:** `payment_transaction_layer`
**Channel:** `card_not_present`

---

## 2. Attack Scenario

1. Red Team agent receives a batch of card/account identifiers (real or synthetic).
2. Agent issues low-value probe transactions ($0.50–$4.99) across a spread of merchant category codes to avoid tripping any single merchant's velocity rule.
3. Blue Team defender scores each probe; some are `ALLOW`ed, some `CHALLENGE`d (simulated 3DS step-up, which the bot cannot complete), some `BLOCK`ed.
4. Orchestrator summarizes round outcomes (e.g., "80% of probes on MCC 5411 were declined for velocity; amounts under $2 had higher approval").
5. LLM reads this summary and generates a new strategy for the next round (tighter amount clustering, different merchant spread, slower pacing).
6. Repeated for up to 5 rounds per vector, logged to the loop ledger.

---

## 3. Attack Instance Definition

```json
{
  "schema_version": "1.0",
  "run_id": "run_001",
  "attack_id": "card_testing",
  "stage": "identify",
  "payload": {
    "attack_name": "LLM-Orchestrated Adaptive Card Testing",
    "target": "payment_transaction_layer",
    "channel": "card_not_present",
    "objectives": [
      "probe card validity across merchants without triggering per-merchant velocity thresholds",
      "adapt probing strategy based on approve/decline feedback"
    ],
    "artifacts": [
      "probe_strategy",
      "transaction_batch"
    ],
    "generation_strategy": "adaptive_round_based_probing",
    "detection_strategy": "velocity_and_risk_tier_classifier"
  }
}
```

---

## 4. Dataset

### Dataset source
- IEEE-CIS Fraud Detection (Kaggle) — real-world-derived CNP transaction data, used as the baseline/legitimate traffic anchor and for cross-validation.
- PaySim (Kaggle) — supplementary transaction-timing and velocity pattern reference.

### Relevant files
- `train_transaction.csv`, `train_identity.csv` (IEEE-CIS)
- `PS_...csv` (PaySim)

### Relevant columns
- `TransactionAmt`, `ProductCD`, `card1`–`card6` (BIN-adjacent card metadata)
- `C1`–`C14` (pre-engineered velocity/count features — reusable directly)
- `addr1`, `addr2` (geo proxy)
- `DeviceType`, `DeviceInfo`, `id_30`–`id_38` (device/session metadata)
- `TransactionDT` (relative timestamp, used to derive velocity windows)

### Labels
- `isFraud` (IEEE-CIS ground truth) — used for cross-validation only.
- Synthetic rows are self-labeled at generation time: `attack_type = "card_testing"`, `round = N`.

### Dataset size
- Baseline (legitimate) traffic: ~5,000–10,000 synthetic rows generated via Faker, calibrated to IEEE-CIS distributions.
- Injected attack rows: 40–200 per round × up to 5 rounds per vector.
- Real cross-validation slice: held-out sample of IEEE-CIS fraud rows (not used in training).

---

## 5. Train / Validation / Test Split

| Split | Source | Purpose |
|---|---|---|
| Train | Baseline + synthetic attack rows (rounds 1–N-1) | Model fitting |
| Validation | Held-out synthetic attack rows (latest round) | Threshold tuning, per-round F1 |
| Test (cross-validation) | Real IEEE-CIS held-out fraud rows | Proves detector isn't overfit to own generator's artifacts |

Split ratio: 70/15/15 for train/validation/synthetic-test; real cross-validation slice is entirely separate and never used in training.

---

## 6. Attack Generation / Simulation

### Input
- `attack_taxonomy.json` entry for `card_testing`
- Previous round's outcome summary (empty on round 1)

### Selection
- LLM call (sparse — once per round) selects: amount range, target merchant category codes, probe count, time window, device rotation cadence.

### Transformation
- Python engine (Faker + Pandas, deterministic, no LLM per row) expands the LLM's strategy JSON into 40–200 actual transaction rows: randomized-but-strategy-conforming amounts, timestamps within the window, merchant IDs from the specified categories, rotating device fingerprints.

### Constraints
- Amounts constrained to realistic micro-transaction range ($0.50–$5.00).
- Probe count capped at 200 per round to keep generation and training fast.
- Maximum 5 mutation rounds per vector (bounded loop, prevents infinite iteration).

### Output
- `synthetic_dataset_round_N.csv` — labeled transaction rows injected into baseline traffic.
- `fidelity_report_round_N.json` — KS-test and discriminator-accuracy scores vs. real IEEE-CIS distribution.

---

## 7. Detection Model

### Model
- XGBoost (primary) or LightGBM — gradient-boosted tree classifier, chosen for speed, tabular performance, and SHAP compatibility.

### Input features
- `probe_count_1h`, `probe_count_24h` (velocity per card/account)
- `unique_merchants_touched_1h`
- `amount_variance_last_n_probes`
- `decline_to_approve_ratio_recent`
- `merchant_category_diversity_score`
- `device_fingerprint_change_rate`

### Output
- `predict_proba` continuous risk score (0.0–1.0), bucketed into three tiers:
  - `< 0.3` → `ALLOW`
  - `0.3–0.7` → `CHALLENGE` (simulated 3DS step-up; bot auto-fails)
  - `> 0.7` → `BLOCK`

### Training procedure
- SMOTE (imbalanced-learn) applied for class balance.
- Trained on baseline + all synthetic rounds generated so far.
- Retrained after each feedback round on the cumulative dataset (original + hard examples).

---

## 8. Evaluation

### Metrics
- Precision, Recall, F1, AUC-ROC, AUC-PR — reported per round and overall.
- False positive rate on legitimate low-value transactions (critical — avoids flagging normal small purchases).
- Per-tier stop rate: % `BLOCK`ed, % `CHALLENGE`d (bot auto-fail), % slipped through at `ALLOW`.
- Fidelity score (KS-test / discriminator accuracy) reported alongside detection metrics.

### Baseline results
- To be populated after Round 1 training run. Target: F1 ≥ 0.85 on Round 1 (naive strategy), demonstrating a measurable dip in Round 2 (adapted strategy) and recovery by Round 3 (post-retrain) — this dip-then-recovery arc is the demo centerpiece.

---

## 9. Feedback / Learning

### Failure cases
- Rows labeled `attack_type = "card_testing"` where model predicted `ALLOW` (false negatives).
- Clustered to find the common pattern (e.g., "amounts under $1 with >24h gaps between probes evaded detection").

### Hard-example generation
- Failure cluster summary fed back to the LLM as the "previous round outcome" input.
- LLM generates a new, harder strategy JSON targeting the identified blind spot.

### Retraining
- Model retrained on cumulative dataset (original + all rounds' hard examples).
- New F1 logged to `loop_log` (SQLite): `vector_id | round | f1_score | mutation_param | timestamp`.
- Loop terminates at 5 rounds or when F1 plateaus (< 1% change between rounds), whichever comes first.

---

## 10. Required Python Libraries

```
pandas
numpy
faker
scipy          # KS-test
scikit-learn    # discriminator, metrics, train/test split
xgboost         # or lightgbm
imbalanced-learn  # SMOTE
shap            # explainability
pydantic        # LLM output schema constraint
sqlite3         # loop ledger (stdlib)
```

---

## 11. Required Files in Our Backend

Matches the repo's plugin structure (`backend/attacks/card_testing/`):

```
backend/attacks/card_testing/
├── config.json          # attack_id, thresholds, round caps
├── identify.py           # returns the Identify schema payload (Section 3)
├── generator.py          # LLM strategy call + Faker/Pandas row expansion
├── simulator.py          # round orchestration loop, risk-tier simulation
├── detector.py           # XGBoost training + predict_proba + SHAP
├── evaluator.py           # metrics computation, fidelity scoring
└── assets/                # any static reference data (MCC lists, etc.)
```

Shared modules used (not owned by this attack):
- `backend/llm/client.py` — LLM call routing
- `backend/feedback/hard_example_generator.py` — false-negative clustering
- `backend/feedback/retrainer.py` — retraining trigger
- `backend/storage/database.py` — SQLite loop ledger

---

## 12. API Input Schema

```json
{
  "schema_version": "1.0",
  "run_id": "run_001",
  "attack_id": "card_testing",
  "stage": "generate",
  "timestamp": "2026-08-27T10:00:00",
  "payload": {
    "round": 1,
    "previous_outcome_summary": null,
    "probe_count": 100,
    "merchant_category_pool": ["5411", "5812", "5941", "4899"]
  }
}
```

---

## 13. API Output Schema

```json
{
  "schema_version": "1.0",
  "run_id": "run_001",
  "attack_id": "card_testing",
  "stage": "detect",
  "timestamp": "2026-08-27T10:05:00",
  "payload": {
    "round": 1,
    "predictions": [
      {
        "transaction_id": "txn_00042",
        "risk_score": 0.82,
        "risk_tier": "BLOCK",
        "shap_top_features": ["probe_count_1h", "amount_variance_last_n_probes"]
      }
    ],
    "metrics": {
      "precision": 0.91,
      "recall": 0.85,
      "f1": 0.88,
      "auc_roc": 0.94,
      "fp_rate": 0.03
    }
  }
}
```

---

## 14. Dependencies / Risks

- **LLM availability:** strategy generation depends on the shared `llm/client.py`. If the LLM is unavailable, fall back to a pre-generated strategy pool (documented in `assets/`) so the demo does not fail live.
- **Cross-validation dependency:** requires IEEE-CIS dataset access at build time; download and cache locally early (Day 1–2) to avoid Kaggle API/rate issues later.
- **No pretrained model dependency** — this attack is pure tabular, lowest infra risk of all four modules.
- **Shared risk-tier logic:** the `ALLOW/CHALLENGE/BLOCK` function should live in a shared utility (not duplicated per attack), since `vishing_otp_bypass` reuses it directly.

---

## 15. Implementation Status

- [ ] `config.json` defined
- [ ] `identify.py` returns Section 3 payload
- [ ] `generator.py` — LLM strategy call implemented
- [ ] `generator.py` — Faker/Pandas row expansion implemented
- [ ] `simulator.py` — round loop + risk-tier simulation
- [ ] `detector.py` — XGBoost training pipeline
- [ ] `detector.py` — SHAP integration
- [ ] `evaluator.py` — metrics + fidelity scoring
- [ ] Cross-validation against real IEEE-CIS data
- [ ] Feedback loop wired to `feedback/hard_example_generator.py`
- [ ] API routes connected (`generate`, `detect`, `evaluate`, `feedback`)
- [ ] Unit tests
- [ ] Demo script rehearsed (Round 1 → dip → recovery arc)
