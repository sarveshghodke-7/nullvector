# Create

## Information

**Fake Merchant / Invoice Fraud:**
Create realistic fraudulent merchants that appear legitimate but are used to process fraudulent transactions.

### Main Attack Types

* **Fake Merchant Onboarding:** Fake business/KYC details are used to create a merchant account.
* **Bust-Out Fraud:** Merchant behaves normally initially, then suddenly performs a high volume of fraudulent transactions.
* **Invoice Fraud:** Fake/inconsistent invoices are generated with anomalies such as merchant-name, bank-account, tax, or total mismatches.
* **Transaction Laundering:** A legitimate-looking merchant processes transactions unrelated to its registered business.

### Attack Generation

```text
LLM → Attack Scenario → Synthetic Merchant + Invoice + Transactions → Ground-Truth Label
```

The **LLM generates attack scenarios**, while predefined rules assign the fraud label.

### Important

Fraud should not be detectable through one obvious feature. Legitimate and fraudulent merchants must have **overlapping signals** so XGBoost learns combinations of features rather than a single shortcut.

## Defend

### Information

We detect fake merchants using a combination of **merchant identity, invoice, and transaction behaviour**.

Key signals:

* Business/bank name similarity
* Business age
* KYC/document consistency
* Transaction velocity
* Sudden amount/volume changes
* Invoice anomalies
* Geographic/device inconsistencies
* Chargeback/payment failure patterns

### Detection Pipeline

```text id="4x8c2u"
Merchant + Invoice + Transactions
            ↓
Feature Engineering
            ↓
XGBoost Risk Model
            ↓
Fraud Risk Score
            ↓
Flag Suspicious Merchant
```

We avoid relying on one feature because realistic fraud can have normal-looking individual signals.

---

## Suggestions

### AI Suggestions

* Generate **harder fraud variants** based on XGBoost false negatives.
* Create fraud cases where business and bank names **match**, so the model cannot rely only on `name_similarity`.
* Use LLM to generate different **merchant personas and attack scenarios**.
* Continuously retrain the model with missed fraud patterns.
* Keep a **held-out attack set** to measure whether the model actually improves.

### Feedback Loop

```text id="6e4wqg"
XGBoost
   ↓
False Negatives
   ↓
LLM generates harder attacks
   ↓
Synthetic Data
   ↓
Retrain XGBoost
   ↓
Evaluate Improvement
```

**Goal:** Build a continuous **Red Team → Blue Team → Feedback → Retraining** fraud-defense loop.

