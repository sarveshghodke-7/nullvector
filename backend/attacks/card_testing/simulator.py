"""Round-based simulation orchestrator for card testing.

Executes the full Generate → Detect → Evaluate → Feedback loop
for up to max_rounds, with F1 plateau early stopping.
"""
from __future__ import annotations

import asyncio
import json
from datetime import datetime
from pathlib import Path
from typing import Any

import pandas as pd

from backend.attacks.card_testing.detector import (
    FEATURE_COLS,
    LABEL_COL,
    engineer_features,
    predict,
    train,
)
from backend.attacks.card_testing.evaluator import evaluate
from backend.attacks.card_testing.generator import (
    compute_fidelity,
    create_entity_pools,
    expand_strategy_to_rows,
    generate_baseline_traffic,
    get_round_strategy,
)
from backend.attacks.card_testing.identify import identify, load_config
from backend.feedback.analyzer import analyze_failures
from backend.feedback.hard_example_generator import generate_hard_strategy
from backend.storage.database import Database
from backend.storage.files import get_run_dir, save_dataframe
from backend.utils.ids import generate_model_id, generate_run_id
from backend.utils.logging import get_logger

logger = get_logger(__name__)


async def run_full_simulation(
    run_id: str | None = None,
    config_overrides: dict[str, Any] | None = None,
) -> list[dict[str, Any]]:
    """Execute the full card testing simulation loop.

    Returns a list of per-round result dicts.
    """
    config = load_config()
    if config_overrides:
        config.update(config_overrides)

    run_id = run_id or generate_run_id()
    db = Database()
    db.init_db()
    db.log_run(run_id, config["attack_id"], config)

    # Step 1: Create entity pools
    pools = create_entity_pools(config)

    # Step 2: Generate baseline traffic for each split
    baselines = {}
    for split in ["train", "val", "test"]:
        n_txns = int(config["baseline_legitimate_count"] * config["split_ratio"][split])
        baselines[split] = generate_baseline_traffic(
            pools[split], config, n_transactions=n_txns
        )

    loop_history: list[dict[str, Any]] = []
    cumulative_train_attack = pd.DataFrame()
    cumulative_val_attack = pd.DataFrame()
    model = None
    thresholds = None
    previous_outcome = None
    previous_f1 = 0.0

    max_rounds = config.get("max_rounds", 5)
    plateau_threshold = config.get("f1_plateau_threshold", 0.01)

    for round_num in range(1, max_rounds + 1):
        logger.info(f"\n{'='*60}\nRound {round_num}/{max_rounds}\n{'='*60}")

        # Step 3a: Get strategy
        strategy = await get_round_strategy(round_num, previous_outcome, config)

        # Step 3b: Generate attack rows for train and val pools
        train_attack = expand_strategy_to_rows(
            strategy, pools["train"], round_num, config
        )
        val_attack = expand_strategy_to_rows(
            strategy, pools["val"], round_num, config
        )

        # Accumulate
        cumulative_train_attack = pd.concat(
            [cumulative_train_attack, train_attack], ignore_index=True
        )
        cumulative_val_attack = pd.concat(
            [cumulative_val_attack, val_attack], ignore_index=True
        )

        # Step 3c: Merge with baselines
        train_combined = pd.concat(
            [baselines["train"], cumulative_train_attack], ignore_index=True
        ).sort_values("timestamp").reset_index(drop=True)

        val_combined = pd.concat(
            [baselines["val"], cumulative_val_attack], ignore_index=True
        ).sort_values("timestamp").reset_index(drop=True)

        # Step 3d: Fidelity check
        fidelity = compute_fidelity(train_attack, baselines["train"], config)
        if not fidelity.passed_gate:
            logger.warning(f"Round {round_num}: Fidelity gate failed, skipping")
            loop_history.append({
                "round": round_num,
                "status": "fidelity_gate_failed",
                "fidelity": fidelity.model_dump(),
            })
            continue

        # Step 3e: Engineer features
        train_featured = engineer_features(train_combined)
        val_featured = engineer_features(val_combined)

        # Step 3f: Train/retrain
        config["current_round"] = round_num
        model, val_metrics, thresholds = train(
            train_df=train_featured,
            val_df=val_featured,
            feature_cols=FEATURE_COLS,
            label_col=LABEL_COL,
            config=config,
        )

        # Save model
        model_id = generate_model_id(config["attack_id"], round_num)
        from backend.attacks.card_testing.detector import save_model
        save_model(model, model_id)

        # Step 3g: Predict on val split
        val_predicted = predict(model, val_featured, FEATURE_COLS, thresholds)

        # Step 3h: Evaluate
        eval_result = evaluate(
            val_predicted,
            ground_truth_col=LABEL_COL,
            pred_score_col="risk_score",
            pred_tier_col="risk_tier",
            thresholds=thresholds,
        )

        round_metrics = eval_result.metrics.model_dump()

        # Log to database
        db.log_round(
            run_id=run_id,
            round_num=round_num,
            metrics=round_metrics,
            vector_id=config["attack_id"],
            mutation_param=strategy,
        )

        # Step 3i: Extract false negatives from train+val
        failure_summary = analyze_failures(
            val_predicted,
            ground_truth_col=LABEL_COL,
            pred_tier_col="risk_tier",
            feature_cols=FEATURE_COLS,
        )

        # Save false negatives
        fn_mask = (
            (val_predicted[LABEL_COL] == 1)
            & (val_predicted["risk_tier"] == "ALLOW")
        )
        fn_df = val_predicted[fn_mask]
        if len(fn_df) > 0:
            save_dataframe(
                fn_df,
                get_run_dir(run_id) / f"false_negatives_r{round_num}.csv"
            )

        # Build outcome summary for next round
        previous_outcome = {
            "round": round_num,
            "metrics": round_metrics,
            "per_tier_stop_rate": eval_result.per_tier_stop_rate,
            "false_negatives": failure_summary.get("total_fn", 0),
            "evasion_patterns": [
                c.get("dominant_pattern", "")
                for c in failure_summary.get("clusters", [])
            ],
        }

        round_result = {
            "round": round_num,
            "status": "completed",
            "strategy": strategy,
            "fidelity": fidelity.model_dump(),
            "metrics": round_metrics,
            "per_tier_stop_rate": eval_result.per_tier_stop_rate,
            "confusion_matrix": eval_result.confusion_matrix.model_dump(),
            "false_negatives": failure_summary.get("total_fn", 0),
            "thresholds": thresholds,
            "model_id": model_id,
        }
        loop_history.append(round_result)

        logger.info(
            f"Round {round_num} complete: F1={round_metrics['f1']:.4f}, "
            f"FN={failure_summary.get('total_fn', 0)}"
        )

        # Step 3j: Check F1 plateau
        current_f1 = round_metrics.get("f1", 0)
        if round_num > 1 and abs(current_f1 - previous_f1) < plateau_threshold:
            logger.info(
                f"F1 plateau detected (delta={abs(current_f1 - previous_f1):.4f}), "
                f"stopping early"
            )
            break
        previous_f1 = current_f1

    # Step 4: Final evaluation on test split (thresholds frozen)
    if model is not None and thresholds is not None:
        logger.info("\n" + "="*60 + "\nFinal Test Evaluation\n" + "="*60)

        # Generate test attack data using the last strategy
        test_attack = expand_strategy_to_rows(
            strategy if 'strategy' in dir() else {},
            pools["test"],
            round_num=0,  # test round
            config=config,
        )
        test_combined = pd.concat(
            [baselines["test"], test_attack], ignore_index=True
        ).sort_values("timestamp").reset_index(drop=True)

        test_featured = engineer_features(test_combined)
        test_predicted = predict(model, test_featured, FEATURE_COLS, thresholds)

        final_eval = evaluate(
            test_predicted,
            ground_truth_col=LABEL_COL,
            pred_score_col="risk_score",
            pred_tier_col="risk_tier",
            thresholds=thresholds,
        )

        loop_history.append({
            "round": "final_test",
            "status": "completed",
            "metrics": final_eval.metrics.model_dump(),
            "per_tier_stop_rate": final_eval.per_tier_stop_rate,
            "confusion_matrix": final_eval.confusion_matrix.model_dump(),
            "thresholds_used": thresholds,
        })

        logger.info(
            f"Final test F1={final_eval.metrics.f1:.4f}, "
            f"AUC-ROC={final_eval.metrics.auc_roc:.4f}"
        )

    # Save loop history
    run_dir = get_run_dir(run_id)
    history_path = run_dir / "loop_history.json"
    history_path.write_text(json.dumps(loop_history, indent=2, default=str))

    db.update_run_status(run_id, "completed")
    db.close()

    logger.info(f"\nSimulation complete. {len(loop_history)} entries. Run ID: {run_id}")
    return loop_history


# Allow standalone execution
if __name__ == "__main__":
    print("Starting Card Testing Simulation...")
    results = asyncio.run(run_full_simulation())
    print(f"\nCompleted {len(results)} rounds.")
    for r in results:
        rnd = r.get('round', '?')
        status = r.get('status', '?')
        metrics = r.get('metrics', {})
        print(f"  Round {rnd}: {status}, F1={metrics.get('f1', 'N/A')}")
