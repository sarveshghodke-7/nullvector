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

### Goal

Generate realistic and increasingly difficult merchant-fraud attacks that can challenge the XGBoost detector and support the **Red Team → Blue Team → Feedback → Harder Attack** loop.
