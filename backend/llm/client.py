"""Provider-agnostic LLM client with fallback support."""
from __future__ import annotations

import json
import os
import time
from typing import Any, Optional

from backend.llm.cache import LLMCache
from backend.llm.prompts import (
    CARD_TESTING_SYSTEM_PROMPT,
    FALLBACK_STRATEGIES,
    CardTestingStrategy,
)
from backend.utils.logging import get_logger

logger = get_logger(__name__)


class LLMClient:
    """Provider-agnostic LLM client.

    Supports OpenAI, Google Gemini, and Anthropic.
    Falls back to pre-built strategies when no API key is configured.
    """

    def __init__(self) -> None:
        self.provider = os.getenv("LLM_PROVIDER", "none").lower()
        self.api_key = os.getenv("LLM_API_KEY", "")
        self.model = os.getenv("LLM_MODEL", "")
        self.cache = LLMCache()
        self._max_retries = 3

    @property
    def is_available(self) -> bool:
        """Check if a real LLM provider is configured."""
        return self.provider not in ("none", "") and bool(self.api_key)

    async def generate_strategy(
        self,
        attack_id: str,
        previous_outcome_summary: dict[str, Any] | None = None,
        round_num: int = 1,
    ) -> dict[str, Any]:
        """Generate an attack strategy using LLM or fallback.

        Args:
            attack_id: The attack module identifier.
            previous_outcome_summary: Summary of the previous round's results.
            round_num: Current round number (1-indexed).

        Returns:
            A strategy dict conforming to CardTestingStrategy schema.
        """
        if not self.is_available:
            return self._get_fallback(round_num)

        prompt = self._build_prompt(attack_id, previous_outcome_summary)

        # Check cache
        cached = self.cache.get(prompt)
        if cached is not None:
            logger.info(f"LLM cache hit for round {round_num}")
            return cached

        # Try LLM call with retries
        for attempt in range(self._max_retries):
            try:
                response = await self._call_provider(prompt)
                strategy = self._parse_response(response)
                self.cache.set(prompt, strategy)
                return strategy
            except Exception as e:
                logger.warning(
                    f"LLM call attempt {attempt + 1}/{self._max_retries} "
                    f"failed: {e}"
                )
                if attempt < self._max_retries - 1:
                    time.sleep(2 ** attempt)  # Exponential backoff

        logger.warning("All LLM attempts failed, using fallback strategy")
        return self._get_fallback(round_num)

    def _get_fallback(self, round_num: int) -> dict[str, Any]:
        """Get a pre-built fallback strategy."""
        idx = min(round_num - 1, len(FALLBACK_STRATEGIES) - 1)
        strategy = FALLBACK_STRATEGIES[idx]
        logger.info(f"Using fallback strategy {idx + 1} for round {round_num}")
        return strategy

    def _build_prompt(
        self,
        attack_id: str,
        previous_outcome_summary: dict[str, Any] | None,
    ) -> str:
        """Build the LLM prompt."""
        user_msg = f"Attack: {attack_id}\n"
        if previous_outcome_summary:
            user_msg += (
                f"Previous round results:\n"
                f"{json.dumps(previous_outcome_summary, indent=2)}\n"
            )
        else:
            user_msg += "This is round 1. No previous results.\n"
        user_msg += (
            "\nGenerate a new probing strategy as a JSON object "
            "with the fields specified in the system prompt."
        )
        return f"{CARD_TESTING_SYSTEM_PROMPT}\n\n{user_msg}"

    async def _call_provider(self, prompt: str) -> str:
        """Call the configured LLM provider."""
        import httpx

        if self.provider == "openai":
            return await self._call_openai(prompt)
        elif self.provider == "google":
            return await self._call_google(prompt)
        elif self.provider == "anthropic":
            return await self._call_anthropic(prompt)
        else:
            raise ValueError(f"Unknown LLM provider: {self.provider}")

    async def _call_openai(self, prompt: str) -> str:
        """Call OpenAI chat completions API."""
        import httpx

        model = self.model or "gpt-4o-mini"
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={"Authorization": f"Bearer {self.api_key}"},
                json={
                    "model": model,
                    "messages": [{"role": "user", "content": prompt}],
                    "response_format": {"type": "json_object"},
                    "temperature": 0.7,
                },
            )
            resp.raise_for_status()
            return resp.json()["choices"][0]["message"]["content"]

    async def _call_google(self, prompt: str) -> str:
        """Call Google Gemini API."""
        import httpx

        model = self.model or "gemini-2.0-flash"
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(
                f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent",
                params={"key": self.api_key},
                json={
                    "contents": [{"parts": [{"text": prompt}]}],
                    "generationConfig": {"responseMimeType": "application/json"},
                },
            )
            resp.raise_for_status()
            return resp.json()["candidates"][0]["content"]["parts"][0]["text"]

    async def _call_anthropic(self, prompt: str) -> str:
        """Call Anthropic messages API."""
        import httpx

        model = self.model or "claude-sonnet-4-20250514"
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(
                "https://api.anthropic.com/v1/messages",
                headers={
                    "x-api-key": self.api_key,
                    "anthropic-version": "2023-06-01",
                    "content-type": "application/json",
                },
                json={
                    "model": model,
                    "max_tokens": 1024,
                    "messages": [{"role": "user", "content": prompt}],
                },
            )
            resp.raise_for_status()
            return resp.json()["content"][0]["text"]

    def _parse_response(self, response: str) -> dict[str, Any]:
        """Parse LLM response into a validated strategy dict."""
        try:
            data = json.loads(response)
            strategy = CardTestingStrategy(**data)
            return strategy.model_dump()
        except (json.JSONDecodeError, Exception) as e:
            logger.warning(f"Failed to parse LLM response: {e}")
            raise


# Module-level singleton
_client: LLMClient | None = None


def get_llm_client() -> LLMClient:
    """Get or create the singleton LLM client."""
    global _client
    if _client is None:
        _client = LLMClient()
    return _client
