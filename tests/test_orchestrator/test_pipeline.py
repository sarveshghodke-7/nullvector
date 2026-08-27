"""Tests for the orchestrator pipeline and attack registry."""
from __future__ import annotations

import pytest

from backend.orchestrator.attack_registry import (
    AttackNotImplementedError,
    get_attack,
    list_attacks,
)


class TestAttackRegistry:
    """Tests for the attack registry."""

    def test_card_testing_registered(self) -> None:
        """card_testing should be a registered, implemented attack."""
        entry = get_attack("card_testing")
        assert entry["status"] == "implemented"
        assert entry["attack_name"] == "LLM-Orchestrated Adaptive Card Testing"

    def test_stub_raises(self) -> None:
        """Stub attacks should raise AttackNotImplementedError."""
        with pytest.raises(AttackNotImplementedError):
            get_attack("synthetic_identity")

    def test_unknown_raises(self) -> None:
        """Unknown attack IDs should raise AttackNotImplementedError."""
        with pytest.raises(AttackNotImplementedError):
            get_attack("nonexistent_attack")

    def test_list_attacks_includes_all(self) -> None:
        """list_attacks should return metadata for all 5 registered attacks."""
        attacks = list_attacks()
        ids = {a["attack_id"] for a in attacks}
        assert "card_testing" in ids
        assert "synthetic_identity" in ids
        assert "deepfake" in ids
        assert "adversarial" in ids
        assert "fake_merchant" in ids

    def test_list_attacks_has_status(self) -> None:
        attacks = list_attacks()
        for a in attacks:
            assert "status" in a
            assert a["status"] in ("implemented", "stub")
