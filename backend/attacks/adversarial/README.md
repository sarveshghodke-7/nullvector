# Attack Name

## 1. Attack Overview

Adversarial perturbations in tabular payment systems are deliberate, mathematically calculated alterations made to non-critical categorical and identity features (such as device fingerprints, browser versions, and email domains) designed to evade machine learning fraud detection models. Unlike image-based perturbations that add pixel noise, tabular attacks preserve the core transaction payload (e.g., dollar amount, target account) while manipulating peripheral metadata to exploit decision boundary blind spots and reduce fraud confidence scores below operational alerting thresholds.


## 2. Attack Scenario

A fraudster gains unauthorized access to a victim's payment credentials and prepares to execute an unauthorized transaction (e.g., $26.58 to $77.34).
- Under normal conditions, the bank's machine learning model flags the transaction as high-risk ($> 80\%$ fraud probability) due to an unfamiliar combination of device indicators, network signatures, or recipient domains.
- To evade detection without canceling the financial transfer, the attacker uses an automated black-box optimization script to query the payment gateway or surrogate model.
- The script rapidly modifies mutable client headers—swapping DeviceType to "unknown", spoofing DeviceInfo to common consumer Android/Windows builds, and changing the email domain to high-trust webmail services (yahoo.com, rocketmail.com).
- The manipulated payload successfully reduces the model's fraud probability to $< 4\%, allowing the unauthorized charge to clear automatically.

## 3. Attack Instance Definition

An attack instance consists of a fraudulent tabular transaction vector $X_{\text{orig}}$ with true label $y = 1$, partitioned into immutable and mutable subsets:

$$X = X_{\text{immutable}} \cup X_{\text{mutable}}$$

- Immutable Set ($X_{\text{immutable}}$): Key financial metrics that cannot be modified without undermining the objective of the theft:

$$\{\text{DeviceType}, \text{DeviceInfo}, \text{P\_emaildomain}, \text{R\_emaildomain}, \text{card4}, \text{card6}\}$$

The adversarial objective is to find a perturbed sample $X_{\text{adv}}$ such that:

$$X_{\text{adv}}[\text{immutable}] = X_{\text{orig}}[\text{immutable}]$$

$$f(X_{\text{adv}}) < \tau_{\text{threshold}} \quad \text{where} \quad f(X_{\text{orig}}) \ge \tau_{\text{fraud\_alert}}$$

(where $f(X)$ is the model's predicted probability of fraud, $\tau_{\text{fraud\_alert}} = 0.70$, and $\tau_{\text{threshold}} = 0.40$).



## 4. Dataset

### Dataset source

- IEEE-CIS Fraud Detection Dataset (Vesta Corporation / Kaggle Competition Benchmark).

### Relevant files

- backend/storage/dataset/train_transaction.csv (Payment transaction records and numerical features).
- backend/storage/dataset/train_identity.csv (Device and network identity attributes).
- backend/storage/dataset/mini_dataset.csv (Balanced development and testing extraction).

### Relevant columns

- Target: isFraud (Binary classification label).
- Continuous / Amount: TransactionAmt.
- ategorical / Metadata: ProductCD, card4, card6, P_emaildomain, R_emaildomain, DeviceType, DeviceInfo.

### Labels

- 0: Benign / Legitimate transaction.
- 1: Confirmed fraudulent transaction.

### Dataset size

- Raw IEEE-CIS Source: $\approx 590,540$ transactions across 430+ columns ($> 500\text{ MB}$).
- Curated Mini Dataset (mini_dataset.csv): 5,500 total rows ($5,000$ benign samples, $500$ confirmed fraud samples) across 10 core interpretable features.

## 5. Train / Validation / Test Split

- Split Strategy: Stratified 80/20 train-test partition on mini_dataset.csv.
- Training Set: 4,400 rows ($4,000$ benign, $400$ fraud).
- Test Set: 1,100 rows ($1,000$ benign, $100$ fraud).
- Class Imbalance Handling: XGBoost trained with scale_pos_weight = 10 to balance the 10:1 class ratio.

## 6. Attack Generation / Simulation
### Input
### Selection
### Transformation
### Constraints
### Output

## 7. Detection Model
### Model
### Input features
### Output
### Training procedure

## 8. Evaluation
### Metrics
### Baseline results

## 9. Feedback / Learning
### Failure cases
### Hard-example generation
### Retraining

## 10. Required Python Libraries

## 11. Required Files in Our Backend

## 12. API Input Schema

## 13. API Output Schema

## 14. Dependencies / Risks

## 15. Implementation Status
