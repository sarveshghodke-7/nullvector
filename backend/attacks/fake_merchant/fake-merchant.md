# Attack Name

**Fake Merchant & Invoice Fraud**

## 1. Attack Overview

The Red Team simulates fraudulent merchants during the merchant onboarding and invoice/payment process.

The attack creates realistic synthetic merchant profiles and invoices, then introduces controlled inconsistencies such as:

* Fake or mismatched tax information
* Bank account/business identity mismatch
* Domain/address mismatch
* Shell businesses
* Stolen or synthetic identities
* Manipulated invoice amounts
* Multiple subtle inconsistencies combined together

The Blue Team detects these attacks using a **hybrid defense consisting of deterministic verification rules and an XGBoost fraud classifier**.

---

## 2. Attack Scenario

A fraudster creates a merchant account that appears legitimate enough to pass basic onboarding checks.

The Red Team generates the merchant and its corresponding invoice, then manipulates selected attributes.

Example:

```text
Merchant:
Nova Digital Solutions

Business age:
18 days

Domain age:
5 days

Tax ID:
Mismatch

Bank account:
Does not belong to business

Invoice:
₹8,75,000
```

The system must determine whether the merchant should be:

* `APPROVE`
* `MANUAL_REVIEW`
* `REJECT`

The system must also identify which signals caused the risk decision.

---

## 3. Attack Instance Definition

Each attack instance represents one synthetic merchant and its associated invoice.

An instance contains:

```text
merchant_id
merchant_name
business_age_days
domain_age_days
tax_id_match
bank_business_match
address_match
invoice_amount
invoice_date
scenario
attack_severity
is_fraud
invoice_path
```

The merchant is generated first. The invoice is generated from that merchant's information so that the relationship between merchant and invoice remains realistic.

---

## 4. Dataset

### Dataset source

The dataset is **synthetically generated** using Python.

No external fraud dataset or paid AI/API service is required for the core pipeline.

Synthetic data is generated using:

* `Faker`
* `ReportLab`
* Python/Pandas

### Relevant files

```text
data/
├── merchants.csv
├── invoices.csv
└── merchant_invoice_dataset.csv
```

PDF invoices are stored separately:

```text
storage/
└── artifacts/
    └── invoices/
```

### Relevant columns

Core ML features:

```text
business_age_days
domain_age_days
tax_id_match
bank_business_match
address_match
invoice_amount
```

Additional metadata:

```text
merchant_id
merchant_name
scenario
attack_severity
invoice_path
```

### Labels

Primary target:

```text
is_fraud
```

Values:

```text
0 = legitimate
1 = fraud
```

`scenario` and `attack_severity` are metadata and must **not** be included as model features because they can cause label leakage.

### Dataset size

Target:

**10,000 merchant/invoice records**

The dataset will use a realistic class distribution rather than an artificial 50/50 split.

Target fraud proportion:

**approximately 15–20%**

---

## 5. Train / Validation / Test Split

The dataset will be divided using stratified splitting so that the fraud/legitimate distribution remains consistent.

Target:

```text
Training:   70%
Validation: 15%
Testing:    15%
```

The split will use:

```python
stratify=y
```

to prevent accidental class-distribution differences.

Merchant/invoice relationships must also be considered so that related records do not leak across splits.

---

## 6. Attack Generation / Simulation

### Input

The generator accepts:

```text
scenario
merchant profile parameters
fraud probability/target distribution
invoice parameters
```

### Selection

The Red Team selects an attack scenario.

Current scenarios:

```text
LEGITIMATE
SHELL_BUSINESS
STOLEN_IDENTITY
FAKE_TAX_DOCUMENT
BANK_BUSINESS_MISMATCH
DOMAIN_ADDRESS_MISMATCH
INVOICE_AMOUNT_MANIPULATION
MULTI_SIGNAL_SYNTHETIC
```

### Transformation

The generator modifies selected merchant or invoice attributes.

Examples:

```text
FAKE_TAX_DOCUMENT
→ invoice tax ID differs from registered tax ID

BANK_BUSINESS_MISMATCH
→ settlement account holder differs from business

DOMAIN_ADDRESS_MISMATCH
→ domain/business location relationship becomes inconsistent

INVOICE_AMOUNT_MANIPULATION
→ invoice amount becomes anomalous relative to merchant baseline

MULTI_SIGNAL_SYNTHETIC
→ several subtle anomalies are combined
```

### Constraints

The generator must:

* Maintain realistic feature distributions
* Avoid making every fraud case obviously fraudulent
* Create overlap between legitimate and fraudulent populations
* Preserve merchant → invoice relationships
* Avoid duplicate records
* Avoid label leakage
* Keep attack scenarios reproducible through controlled random seeds

Examples of overlap:

```text
Legitimate startup:
business_age_days < 30
tax_id_match = True

Fraudulent shell:
business_age_days > 365
tax_id_match = True
bank_business_match = False
```

This prevents the model from learning a single simplistic rule.

### Output

The generator produces:

```text
Merchant metadata
+
Invoice metadata
+
Synthetic invoice PDF
+
Fraud label
+
Attack scenario
+
Attack severity
```

---

## 7. Detection Model

### Model

**XGBoost binary classification model**

The deterministic rule engine is maintained separately as the verification layer.

Architecture:

```text
Merchant / Invoice
       │
       ├── Deterministic Rules
       │
       └── XGBoost
              │
              ▼
       Risk Aggregator
              │
       APPROVE / REVIEW / REJECT
```

### Input features

The initial feature matrix contains only legitimate predictive features, such as:

```text
business_age_days
domain_age_days
tax_id_match
bank_business_match
address_match
invoice_amount
```

Additional engineered numerical features may be added after baseline evaluation.

Excluded from `X`:

```text
merchant_id
merchant_name
scenario
attack_severity
is_fraud
invoice_path
```

### Output

XGBoost produces:

```text
fraud_probability
predicted_label
```

`fraud_probability` is specifically the probability returned by:

```python
model.predict_proba(X)
```

The deterministic rule layer instead produces:

```text
rule_risk_score
triggered_flags
```

### Training procedure

1. Load generated dataset.
2. Validate and clean data.
3. Separate metadata from ML features.
4. Define `X` and `y`.
5. Perform stratified train/validation/test split.
6. Train XGBoost.
7. Tune important hyperparameters using validation data.
8. Evaluate on unseen test data.
9. Analyze false positives and false negatives.
10. Save the trained model.

---

## 8. Evaluation

### Metrics

Primary metrics:

```text
Precision
Recall
F1-score
PR-AUC
ROC-AUC
Confusion Matrix
```

Additional analysis:

```text
False Positive Rate
False Negative Rate
Detection rate by attack scenario
Detection rate by attack severity
```

### Baseline results

The first model will be treated as a baseline.

We will **not** assume that a perfect score is desirable.

If the model produces:

```text
Precision = 1.00
Recall = 1.00
F1 = 1.00
ROC-AUC = 1.00
```

the dataset and feature pipeline will be investigated for:

* Data leakage
* Duplicate records
* Trivial feature separation
* Incorrect train/test splitting
* Label-derived features
* Unrealistic synthetic distributions

The goal is a **credible adversarial detection system**, not an artificially perfect benchmark.

---

## 9. Feedback / Learning

### Failure cases

The system records:

```text
False Negative:
actual fraud → predicted legitimate

False Positive:
actual legitimate → predicted fraud
```

False negatives are particularly important because they represent **fraud that escaped the defense**.

### Hard-example generation

Escaped fraud samples are retained as difficult fraud examples.

False-positive legitimate samples can also be retained as hard negative examples.

These examples are added to the feedback dataset.

### Retraining

The feedback loop is:

```text
Red Team attack
      ↓
Blue Team detection
      ↓
Prediction
      ↓
Error analysis
      ↓
False negatives / difficult examples
      ↓
Retraining dataset
      ↓
XGBoost retraining
      ↓
Re-evaluation
```

The objective is to demonstrate the hackathon's:

**Attack → Detect → Learn → Defend**

cycle.

---

## 10. Required Python Libraries

Core libraries:

```text
pandas
numpy
faker
reportlab
xgboost
scikit-learn
joblib
```

Backend/API:

```text
fastapi
uvicorn
pydantic
```

Optional:

```text
matplotlib
```

for evaluation visualizations.

---

## 11. Required Files in Our Backend

Target backend structure:

```text
backend/
└── app/
    ├── generators/
    │   ├── parent_merchant_generator.py
    │   ├── child_invoice_generator.py
    │   └── data_assembler.py
    │
    ├── detectors/
    │   ├── orc_rules.py
    │   ├── train_xgboost.py
    │   ├── merchant_risk_classifier.py
    │   └── risk_aggregator.py
    │
    ├── feedback/
    │   └── retrain_loop.py
    │
    ├── api/
    │   └── routes.py
    │
    └── models/
        └── xgboost_fraud_model.joblib
```

Supporting directories:

```text
data/
storage/
tests/
```

---

## 12. API Input Schema

Example request:

```json
{
  "merchant_name": "Nova Digital Solutions",
  "business_age_days": 18,
  "domain_age_days": 5,
  "tax_id_match": false,
  "bank_business_match": false,
  "address_match": true,
  "invoice_amount": 875000
}
```

The API receives merchant and invoice risk signals and passes them through the defense pipeline.

---

## 13. API Output Schema

Example:

```json
{
  "merchant_name": "Nova Digital Solutions",
  "fraud_probability": 0.94,
  "rule_risk_score": 0.75,
  "decision": "REJECT",
  "triggered_flags": [
    "RECENT_BUSINESS_REGISTRATION",
    "SUSPICIOUS_DOMAIN_AGE",
    "TAX_ID_REGISTRY_MISMATCH",
    "SETTLEMENT_BANK_MISMATCH"
  ],
  "is_detected": true
}
```

The final API response exposes both:

* deterministic rule evidence
* ML probability
* final risk decision

This provides explainability for the dashboard and technical presentation.

---

## 14. Dependencies / Risks

### Data risks

* Synthetic data may not perfectly represent real-world fraud.
* Poorly designed distributions can make fraud artificially easy to detect.
* Duplicate merchant/invoice records can cause train/test leakage.

### ML risks

* Label leakage
* Overfitting
* Class imbalance
* Poor calibration of predicted probabilities
* False positives affecting legitimate merchants
* False negatives allowing fraudulent merchants through

### Simulation risks

* Unrealistic invoice generation
* Independent merchant/invoice generation
* Overly obvious attack signatures
* Insufficient diversity of attacks

### Mitigation

The system will use:

```text
Parent-child merchant/invoice generation
Feature overlap
Stratified splitting
Leakage prevention
Multiple attack scenarios
Unseen test data
False-positive/false-negative analysis
```

---

## 15. Implementation Status

### Current status

**Architecture:** ✅ Locked

**Attack vector:** ✅ Fake Merchant & Invoice Fraud

**Generation strategy:** ✅ Parent merchant → child invoice

**Defense strategy:** ✅ Rules + XGBoost

**Attack scenarios:** ✅ Defined

**Dataset target:** ✅ 10,000 records

**Class distribution:** ✅ Realistic imbalance planned

**Feature leakage policy:** ✅ Defined

**Feedback/retraining design:** ✅ Defined

### Immediate implementation order

```text
1. parent_merchant_generator.py
          ↓
2. child_invoice_generator.py
          ↓
3. data_assembler.py
          ↓
4. Generate 10,000-row dataset
          ↓
5. train_xgboost.py
          ↓
6. Evaluate model
          ↓
7. risk_aggregator.py
          ↓
8. retrain_loop.py
          ↓
9. FastAPI
          ↓
10. Dashboard
```

**Current step: `parent_merchant_generator.py`**
