1. config.json (The Boundaries)
This file dictates the rules and parameters for how attacks are generated and detected.
    What it does: Defines the acceptable bounds of your tabular data manipulation.
    Examples of contents:
        Maximum allowable perturbation limits (e.g., "Do not alter the transaction_amount by more than 1%").
        Lists of mutable categorical features (e.g., ["browser_version", "ip_routing", "device_type"]).
        Hyperparameters for the attack algorithms (like learning rates for gradient approximations).
2. generator.py (The Attacker)
This is the script that actively creates the poisoned or perturbed data to test your defenses.
    What it does: Takes a known fraudulent tabular transaction and subtly alters its features to bypass the target fraud model.
    Examples of logic:

        Generating "camouflage" by inserting artificial rows (micro-transactions) to manipulate time-window aggregations before a primary fraud event.

        Flipping categorical variables to mimic the statistical distribution of a legitimate user.

3. identify.py (The Profiler)

While a detector simply outputs "attack" or "safe", the identifier figures out the specific nature of the threat.

    What it does: Analyzes the perturbed data to classify the type of adversarial attack or identify the vulnerable attack surface.

    Examples of logic:

        Flagging which specific features were altered (e.g., "This looks like Categorical Perturbation on the device_id").

        Calculating feature importance/saliency maps to tell the generator which columns are the best targets to manipulate.

4. detector.py (The Defender)

This file implements the countermeasures mentioned in your README to catch the output of your generator.py.

    What it does: Scans incoming tabular data to intercept adversarial noise before it fools the primary payment fraud model.

    Examples of logic:

        Running a Surrogate Detection Model that looks purely for the statistical signature of artificial data manipulation.

        Applying Feature Squeezing (e.g., bucketing timestamps or rounding continuous variables) to neutralize the attacker's mathematically precise changes.

5. evaluator.py (The Scorekeeper)

This script acts as the referee between your generator.py and detector.py.

    What it does: Quantifies the success of the attacks and the robustness of the defenses.

    Examples of logic:

        Calculating the Attack Success Rate (ASR): How often did the generator successfully bypass the main model?

        Calculating the Perturbation Cost: How much did the generator have to change the data to succeed? (If it had to change the data too much, it's not a realistic adversarial attack).

        Evaluating the detector's False Positive and True Positive rates.
