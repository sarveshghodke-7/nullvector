# Adversarial perturbations
Adversarial perturbations are subtle, intentionally crafted alterations made to input data designed to deceive a machine learning model. While humans might look at the altered data and see nothing out of the ordinary, the AI misinterprets these mathematically engineered changes, causing it to output a confident but incorrect prediction (e.g., classifying a highly fraudulent transaction as completely safe).

---

## How it works in Tabular Payment Data 
Unlike images where an attacker can change pixel colors by a fraction of a percent, payment data is tabular (rows and columns) and highly structured. An attacker cannot simply change the "Transaction Amount" from $10,000 to $1, or the model will just process it as a $1 transaction.

Instead, realistic tabular attacks exploit the unverified or mutable features and the feature engineering pipeline

 - __Velocity Spoofing__ : Machine learning models rely heavily on aggregated features (e.g., "number of transactions in the last 24 hours" or "average spend this week"). Attackers introduce small, seemingly innocent actions to artificially manipulate these hidden aggregations.  
- __Categorical Perturbations__ : Attackers make discrete changes to data fields they control—such as spoofing a specific device type, browser fingerprint, or IP routing—to perfectly mimic the statistical distribution of a legitimate user.

---

## Real-Life Attack Scenarios

__The "Camouflage" Evasion Attack__: A fraudster obtains a stolen credit card. Before executing the main $5,000 fraudulent transfer, they process several $1 micro-transactions at legitimate merchants (like a local coffee shop). This perturbation tricks the system's behavioral profiling into establishing a "safe" baseline, effectively blinding the anomaly detector to the subsequent massive theft.

__Data Poisoning via Synthetic Identities__: Attackers don't just attack trained models; they attack the training process itself. Fraudsters construct fake identities and execute months of perfectly normal, successfully paid-off micro-loans. They systematically feed this "good" behavior into the bank's dataset. When the model retrains, it associates the attackers' underlying hardware/network signatures with high trust, paving the way for a massive coordinated bust-out fraud later.

---

## Countermeasures and Defenses

- __Gradient Masking__: Hiding the exact confidence scores (the model's output probabilities) from the end-user. If an attacker only receives a generic "Approved" or "Declined" message rather than "98.5% Fraud," it becomes significantly harder for them to calculate the exact mathematical perturbation needed to bypass the system.  

- __Ensemble Modeling__: Deploying multiple, structurally different machine learning models simultaneously. A perturbation perfectly crafted to bypass a Random Forest model will often fail entirely against a parallel Neural Network.  

- __Rule-Based Hardening__: Implementing strict, deterministic rules that sit on top of the ML model. Even if the AI is fooled into thinking a transaction is safe, hard limits (e.g., absolute geo-velocity blocks) cannot be mathematically perturbed.


- __Adversarial Training__: The current gold standard. Security teams use tools to automatically generate adversarial perturbations against their own models. They then feed these successful attacks back into the model during the training phase, forcing the AI to learn what "camouflaged" fraud looks like.  

- __Attack Propagation in Training__: A highly specialized tabular defense. Because payment data undergoes complex feature engineering (like time-window aggregations) before reaching the model, modern defenses simulate attacks through these transformations in the training loop, ensuring the model recognizes perturbations even after the data shape has changed.  

- __Surrogate Detection Models__: Running a secondary, specialized AI specifically trained to detect the statistical signature of adversarial noise. This model doesn't care if the transaction is fraud; it only asks, "Does this data look like it was artificially generated to trick an AI?"

- __Feature Squeezing__: Reducing the precision of the input data—such as aggressively rounding continuous numerical values or bucketing timestamps. This effectively "squeezes out" the microscopic mathematical noise the attacker introduced.  
