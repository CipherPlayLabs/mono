import json
import unittest
from datetime import datetime, timezone
from pathlib import Path

from research_data.ids import research_id
from research_data.snapshots import build_snapshot_envelope, snapshot_object_path


FIXTURE = Path(__file__).parent / "fixtures" / "reddit_thread_snapshot.json"


class IdAndSnapshotTests(unittest.TestCase):
    def test_research_ids_are_stable_provider_neutral_and_prefixed(self):
        first = research_id("source_thread", "reddit", "smallbusiness", "abc123")
        second = research_id("source_thread", "reddit", "smallbusiness", "abc123")

        self.assertEqual(first, second)
        self.assertTrue(first.startswith("source_thread_"))
        self.assertNotIn("abc123", first)
        self.assertNotIn("smallbusiness", first)

    def test_snapshot_object_path_is_current_thread_path(self):
        fetched_at = datetime(2026, 6, 5, 12, 0, tzinfo=timezone.utc)

        path = snapshot_object_path(
            provider="reddit",
            community_name="smallbusiness",
            source_thread_id="source_thread_abc",
            snapshot_id="source_thread_snapshot_def",
            fetched_at=fetched_at,
        )

        self.assertEqual(
            path,
            "current/reddit/smallbusiness/source_thread_abc.json",
        )

    def test_current_snapshot_id_is_stable_across_refetches(self):
        raw = json.loads(FIXTURE.read_text())
        updated_raw = json.loads(FIXTURE.read_text())
        updated_raw["thread_listing"]["data"]["score"] = 99

        first = build_snapshot_envelope(
            provider="reddit",
            community_name="smallbusiness",
            provider_thread_id="abc123",
            raw_thread=raw,
            fetched_at="2026-06-05T12:00:00Z",
        )
        second = build_snapshot_envelope(
            provider="reddit",
            community_name="smallbusiness",
            provider_thread_id="abc123",
            raw_thread=updated_raw,
            fetched_at="2026-06-06T12:00:00Z",
        )

        self.assertEqual(first["source_thread_id"], second["source_thread_id"])
        self.assertEqual(first["source_thread_snapshot_id"], second["source_thread_snapshot_id"])
        self.assertNotEqual(first["raw_checksum_sha256"], second["raw_checksum_sha256"])

    def test_snapshot_envelope_preserves_raw_provider_payload(self):
        raw = json.loads(FIXTURE.read_text())

        envelope = build_snapshot_envelope(
            provider="reddit",
            community_name="smallbusiness",
            provider_thread_id="abc123",
            raw_thread=raw,
            fetched_at="2026-06-05T12:00:00Z",
        )

        self.assertEqual(envelope["raw"], raw)
        self.assertEqual(envelope["provider"], "reddit")
        self.assertEqual(envelope["provider_native"]["thread_id"], "abc123")
        self.assertIn("source_thread_id", envelope)
        self.assertIn("source_thread_snapshot_id", envelope)
        self.assertFalse(envelope["processing"]["truncated"])


if __name__ == "__main__":
    unittest.main()
