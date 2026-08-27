"""File-based LLM response cache."""
from __future__ import annotations

import hashlib
import json
import time
from pathlib import Path
from typing import Any, Optional

CACHE_DIR = Path("backend/data/.llm_cache")
DEFAULT_TTL_SECONDS = 86400  # 24 hours


class LLMCache:
    """Simple file-based prompt-to-response cache."""

    def __init__(
        self, cache_dir: Path = CACHE_DIR, ttl: int = DEFAULT_TTL_SECONDS
    ) -> None:
        self.cache_dir = cache_dir
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        self.ttl = ttl

    def _hash_key(self, prompt: str) -> str:
        return hashlib.sha256(prompt.encode()).hexdigest()[:16]

    def get(self, prompt: str) -> Optional[dict[str, Any]]:
        """Get a cached response for a prompt."""
        key = self._hash_key(prompt)
        path = self.cache_dir / f"{key}.json"
        if not path.exists():
            return None
        try:
            data = json.loads(path.read_text())
            if time.time() - data.get("timestamp", 0) > self.ttl:
                path.unlink(missing_ok=True)
                return None
            return data.get("response")
        except (json.JSONDecodeError, KeyError):
            return None

    def set(self, prompt: str, response: dict[str, Any]) -> None:
        """Cache a response for a prompt."""
        key = self._hash_key(prompt)
        path = self.cache_dir / f"{key}.json"
        data = {"timestamp": time.time(), "prompt_hash": key, "response": response}
        path.write_text(json.dumps(data, indent=2))
