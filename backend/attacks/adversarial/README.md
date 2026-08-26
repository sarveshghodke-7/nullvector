# Attack Name
Adversarial perturbations in tabular payment systems are deliberate, mathematically calculated alterations made to non-critical categorical and identity features (such as device fingerprints, browser versions, and email domains) designed to evade machine learning fraud detection models. Unlike image-based perturbations that add pixel noise, tabular attacks preserve the core transaction payload (e.g., dollar amount, target account) while manipulating peripheral metadata to exploit decision boundary blind spots and reduce fraud confidence scores below operational alerting thresholds.

## 1. Attack Overview

A fraudster gains unauthorized access to a victim's payment credentials and prepares to execute an unauthorized transaction (e.g., $26.58 to $77.34).
- Under normal conditions, the bank's machine learning model flags the transaction as high-risk ($> 80\%$ fraud probability) due to an unfamiliar combination of device indicators, network signatures, or recipient domains.
- To evade detection without canceling the financial transfer, the attacker uses an automated black-box optimization script to query the payment gateway or surrogate model.
- The script rapidly modifies mutable client headers—swapping DeviceType to "unknown", spoofing DeviceInfo to common consumer Android/Windows builds, and changing the email domain to high-trust webmail services (yahoo.com, rocketmail.com).
- The manipulated payload successfully reduces the model's fraud probability to $< 4\%, allowing the unauthorized charge to clear automatically.

## 2. Attack Scenario
An attack instance consists of a fraudulent tabular transaction vector $X_{\text{orig}}$ with true label $y = 1$, partitioned into immutable and mutable subsets:

$$X = X_{\text{immutable}} \cup X_{\text{mutable}}$$

## 3. Attack Instance Definition

## 4. Dataset
### Dataset source
### Relevant files
### Relevant columns
### Labels
### Dataset size

## 5. Train / Validation / Test Split

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
