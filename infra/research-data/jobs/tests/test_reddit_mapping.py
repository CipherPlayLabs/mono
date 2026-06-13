import json
import unittest
from pathlib import Path

from research_data.bigquery_rows import build_collection_rows
from research_data.reddit_mapping import flatten_reddit_thread_nodes
from research_data.snapshots import build_snapshot_envelope


FIXTURE = Path(__file__).parent / "fixtures" / "reddit_thread_snapshot.json"


class RedditMappingTests(unittest.TestCase):
    def setUp(self):
        self.raw = json.loads(FIXTURE.read_text())
        self.envelope = build_snapshot_envelope(
            provider="reddit",
            community_name="smallbusiness",
            provider_thread_id="abc123",
            raw_thread=self.raw,
            fetched_at="2026-06-05T12:00:00Z",
        )

    def test_flatten_preserves_post_comments_morechildren_and_parent_links(self):
        nodes, gaps = flatten_reddit_thread_nodes(self.envelope)

        provider_names = {node["provider_fullname"] for node in nodes}
        self.assertEqual(provider_names, {"t3_abc123", "t1_c1", "t1_c2", "t1_c3"})

        parent_by_name = {node["provider_fullname"]: node["provider_parent_fullname"] for node in nodes}
        self.assertIsNone(parent_by_name["t3_abc123"])
        self.assertEqual(parent_by_name["t1_c1"], "t3_abc123")
        self.assertEqual(parent_by_name["t1_c2"], "t1_c1")
        self.assertEqual(parent_by_name["t1_c3"], "t3_abc123")
        self.assertEqual(gaps, [])

    def test_build_collection_rows_stores_full_source_thread_as_database_source_of_truth(self):
        rows = build_collection_rows(
            collection_run_id="collection_run_test",
            config={"community": {"platform": "reddit", "name": "smallbusiness"}},
            snapshot_envelope=self.envelope,
        )

        self.assertEqual(
            set(rows),
            {
                "source_threads",
                "thread_nodes",
                "coverage_gaps",
            },
        )
        source_thread = rows["source_threads"][0]
        self.assertEqual(source_thread["provider_thread_id"], "abc123")
        self.assertEqual(source_thread["source_thread_json"], self.envelope)
        self.assertEqual(source_thread["raw_json"], self.raw)
        self.assertEqual(source_thread["raw_checksum_sha256"], self.envelope["raw_checksum_sha256"])
        self.assertGreater(source_thread["raw_byte_size"], 0)
        self.assertEqual(len(rows["thread_nodes"]), 4)
        self.assertTrue(all("raw_json" in row for row in rows["thread_nodes"]))


if __name__ == "__main__":
    unittest.main()
