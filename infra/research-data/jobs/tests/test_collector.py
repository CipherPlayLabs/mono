import json
import unittest
from pathlib import Path

from test_config import VALID_CONFIG

from research_data.collector import run_collection_batch


FIXTURE = Path(__file__).parent / "fixtures" / "reddit_thread_snapshot.json"


class FakeProvider:
    def __init__(self, raw_thread):
        self.raw_thread = raw_thread
        self.seen_query_mode = None

    def list_thread_refs(self, config, checkpoint, limit, query_mode):
        self.seen_query_mode = query_mode
        return {
            "refs": [
                {
                    "provider_thread_id": "abc123",
                    "provider_fullname": "t3_abc123",
                    "created_utc": 1750000000,
                    "permalink": "/r/smallbusiness/comments/abc123/thread/",
                }
            ],
            "checkpoint": {
                "query_mode": "new",
                "after": "t3_abc123",
            },
            "coverage_gaps": [
                {
                    "gap_type": "listing_limit",
                    "description": "Provider listing returned one page for this batch.",
                }
            ],
        }

    def fetch_thread(self, thread_ref):
        return self.raw_thread


class FakeSnapshotStore:
    def __init__(self):
        self.saved = []

    def save_snapshot(self, envelope):
        self.saved.append(envelope)
        return {
            "gcs_uri": "gs://research/" + envelope["source_thread_snapshot_id"] + ".json",
            "byte_size": len(json.dumps(envelope)),
        }


class FakeResearchStore:
    def __init__(self):
        self.collection_rows = []
        self.checkpoints = []

    def get_latest_checkpoint(self, collection_run_id, query_mode):
        return None

    def write_collection_rows(self, rows):
        self.collection_rows.append(rows)

    def write_checkpoint(self, row):
        self.checkpoints.append(row)


class CollectorTests(unittest.TestCase):
    def test_collection_batch_writes_snapshot_rows_gaps_and_checkpoint(self):
        raw_thread = json.loads(FIXTURE.read_text())
        provider = FakeProvider(raw_thread)
        snapshot_store = FakeSnapshotStore()
        research_store = FakeResearchStore()

        result = run_collection_batch(
            config=VALID_CONFIG,
            collection_run_id="collection_run_test",
            provider=provider,
            snapshot_store=snapshot_store,
            research_store=research_store,
            fetched_at="2026-06-05T12:00:00Z",
        )

        self.assertEqual(result["threads_fetched"], 1)
        self.assertEqual(len(snapshot_store.saved), 1)
        self.assertEqual(len(research_store.collection_rows), 1)
        self.assertEqual(len(research_store.checkpoints), 1)
        rows = research_store.collection_rows[0]
        self.assertEqual(rows["source_threads"][0]["provider_thread_id"], "abc123")
        self.assertEqual(rows["coverage_gaps"][0]["gap_type"], "listing_limit")
        self.assertEqual(research_store.checkpoints[0]["checkpoint_json"]["after"], "t3_abc123")

    def test_collection_batch_passes_selected_query_mode_to_provider(self):
        raw_thread = json.loads(FIXTURE.read_text())
        provider = FakeProvider(raw_thread)

        run_collection_batch(
            config=VALID_CONFIG,
            collection_run_id="collection_run_test",
            provider=provider,
            snapshot_store=FakeSnapshotStore(),
            research_store=FakeResearchStore(),
            fetched_at="2026-06-05T12:00:00Z",
            query_mode_name="top",
        )

        self.assertEqual(provider.seen_query_mode["mode"], "top")


if __name__ == "__main__":
    unittest.main()
