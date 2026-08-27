"""Attack module registry."""
from __future__ import annotations

from typing import Any


class AttackNotImplementedError(Exception):
    """Raised when an attack module is not yet implemented."""
    pass


ATTACK_REGISTRY: dict[str, dict[str, Any]] = {
    "card_testing": {
        "module": "backend.attacks.card_testing",
        "attack_name": "LLM-Orchestrated Adaptive Card Testing",
        "status": "implemented",
        "target": "payment_transaction_layer",
        "channel": "card_not_present",
    },
    "synthetic_identity": {
        "attack_name": "Synthetic Identity Fraud",
        "status": "stub",
        "target": "customer_onboarding",
        "channel": "digital_kyc",
    },
    "deepfake": {
        "attack_name": "Deepfake Voice / Video",
        "status": "stub",
        "target": "authentication",
        "channel": "video_kyc",
    },
    "adversarial": {
        "attack_name": "Adversarial Perturbation",
        "status": "stub",
        "target": "fraud_detection_model",
        "channel": "transaction_layer",
    },
    "fake_merchant": {
        "attack_name": "Fake Merchant / Invoice Fraud",
        "status": "stub",
        "target": "merchant_onboarding",
        "channel": "merchant_portal",
    },
}


def get_attack(attack_id: str) -> dict[str, Any]:
    """Get an attack module by ID.

    Raises:
        AttackNotImplementedError: If the attack is a stub or not registered.
    """
    if attack_id not in ATTACK_REGISTRY:
        raise AttackNotImplementedError(f"Unknown attack: {attack_id}")
    entry = ATTACK_REGISTRY[attack_id]
    if entry.get("status") == "stub":
        raise AttackNotImplementedError(
            f"Attack '{attack_id}' is registered but not yet implemented"
        )
    return entry


def list_attacks() -> list[dict[str, Any]]:
    """List all registered attacks with metadata."""
    return [
        {"attack_id": k, **{kk: vv for kk, vv in v.items() if kk != "module"}}
        for k, v in ATTACK_REGISTRY.items()
    ]
