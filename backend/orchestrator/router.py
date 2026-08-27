"""Internal routing helper for pipeline stages."""
from __future__ import annotations

from typing import Any, Callable


def get_module_method(attack_id: str, stage: str) -> Callable:
    """Dynamically import and return the method for an attack stage."""
    module_map = {
        "card_testing": {
            "identify": ("backend.attacks.card_testing.identify", "identify"),
            "generate": ("backend.attacks.card_testing.generator", "generate"),
            "detect": ("backend.attacks.card_testing.detector", "predict"),
            "evaluate": ("backend.attacks.card_testing.evaluator", "evaluate"),
            "simulate": ("backend.attacks.card_testing.simulator", "run_full_simulation"),
        },
    }

    if attack_id not in module_map:
        raise ValueError(f"No module map for attack: {attack_id}")
    if stage not in module_map[attack_id]:
        raise ValueError(f"No module for stage '{stage}' in attack '{attack_id}'")

    module_path, func_name = module_map[attack_id][stage]
    import importlib
    mod = importlib.import_module(module_path)
    return getattr(mod, func_name)
