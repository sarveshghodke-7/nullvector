"""LLM prompts and fallback strategies for attack generation."""
from __future__ import annotations

from pydantic import BaseModel


class CardTestingStrategy(BaseModel):
    """Structured output schema for card testing strategy generation."""
    amount_range: list[float] = [0.50, 5.00]
    target_mccs: list[str] = ["5411"]
    probe_count: int = 100
    time_window_minutes: int = 60
    device_rotation_cadence: int = 10
    pacing_seconds_between_probes: float = 5.0


CARD_TESTING_SYSTEM_PROMPT = """You are a Red Team AI agent simulating an LLM-orchestrated adaptive card testing (BIN) attack.

Given the previous round's outcome summary (approve/decline rates, which merchant categories and amount ranges were most successful), generate a NEW probing strategy for the next round.

Your strategy must be a JSON object with these fields:
- amount_range: [min_amount, max_amount] in USD (between 0.50 and 5.00)
- target_mccs: list of merchant category codes to probe (choose from common codes like 5411, 5812, 5941, 4899, 5311, 5691, 5999, 7011)
- probe_count: number of probe transactions to generate (40-200)
- time_window_minutes: spread probes over this many minutes (10-1440)
- device_rotation_cadence: change device fingerprint every N transactions (1-50)
- pacing_seconds_between_probes: average seconds between probes (1-900)

Your goal is to EVADE detection by the Blue Team's velocity and risk model.
Adapt based on what worked and what was blocked in previous rounds.
"""

FALLBACK_STRATEGIES: list[dict] = [
    # Round 1: Naive — easily detectable
    {
        "amount_range": [1.00, 1.00],
        "target_mccs": ["5411"],
        "probe_count": 100,
        "time_window_minutes": 30,
        "device_rotation_cadence": 50,
        "pacing_seconds_between_probes": 2.0,
    },
    # Round 2: Spread — varied amounts and merchants
    {
        "amount_range": [0.50, 3.00],
        "target_mccs": ["5411", "5812", "5941"],
        "probe_count": 80,
        "time_window_minutes": 120,
        "device_rotation_cadence": 15,
        "pacing_seconds_between_probes": 30.0,
    },
    # Round 3: Slow-drip — longer windows, more merchants
    {
        "amount_range": [0.50, 2.00],
        "target_mccs": ["5411", "5812", "5941", "4899", "5311"],
        "probe_count": 60,
        "time_window_minutes": 480,
        "device_rotation_cadence": 8,
        "pacing_seconds_between_probes": 300.0,
    },
    # Round 4: Micro-cluster — tight amounts, irregular timing
    {
        "amount_range": [0.99, 1.01],
        "target_mccs": ["5812", "5941", "4899", "5691"],
        "probe_count": 50,
        "time_window_minutes": 360,
        "device_rotation_cadence": 3,
        "pacing_seconds_between_probes": 180.0,
    },
    # Round 5: Stealth — maximum evasion
    {
        "amount_range": [0.50, 4.99],
        "target_mccs": ["5411", "5812", "5941", "4899", "5311", "5691"],
        "probe_count": 40,
        "time_window_minutes": 1440,
        "device_rotation_cadence": 1,
        "pacing_seconds_between_probes": 900.0,
    },
]
