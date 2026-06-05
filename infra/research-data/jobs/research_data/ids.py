import hashlib
import json
import re
from typing import Any


def research_id(prefix: str, *parts: Any) -> str:
    """Create a stable provider-neutral research ID from auditable inputs."""
    safe_prefix = re.sub(r"[^a-z0-9_]+", "_", prefix.lower()).strip("_")
    if not safe_prefix:
        raise ValueError("research ID prefix is required")
    payload = json.dumps(parts, sort_keys=True, separators=(",", ":"), default=str)
    digest = hashlib.sha256(payload.encode("utf-8")).hexdigest()[:24]
    return f"{safe_prefix}_{digest}"
