from datetime import datetime, timezone
from typing import Any


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def parse_timestamp(value: Any) -> datetime:
    if isinstance(value, datetime):
        dt = value
    elif isinstance(value, (int, float)):
        dt = datetime.fromtimestamp(float(value), tz=timezone.utc)
    elif isinstance(value, str):
        text = value.replace("Z", "+00:00")
        dt = datetime.fromisoformat(text)
    else:
        raise ValueError(f"unsupported timestamp value {value!r}")
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


def iso_from_utc_seconds(value: Any) -> str | None:
    if value in (None, ""):
        return None
    return parse_timestamp(float(value)).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def date_from_utc_seconds(value: Any) -> str | None:
    timestamp = iso_from_utc_seconds(value)
    return timestamp[:10] if timestamp else None
