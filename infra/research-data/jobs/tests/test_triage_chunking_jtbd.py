import json
import unittest
from pathlib import Path

from research_data.chunking import chunk_thread_nodes
from research_data.jtbd import extract_thread_level_jtbd
from research_data.reddit_mapping import flatten_reddit_thread_nodes
from research_data.snapshots import build_snapshot_envelope
from research_data.triage import triage_source_thread


FIXTURE = Path(__file__).parent / "fixtures" / "reddit_thread_snapshot.json"


class TriageChunkingAndJtbdTests(unittest.TestCase):
    def setUp(self):
        raw = json.loads(FIXTURE.read_text())
        self.envelope = build_snapshot_envelope(
            provider="reddit",
            community_name="smallbusiness",
            provider_thread_id="abc123",
            raw_thread=raw,
            fetched_at="2026-06-05T12:00:00Z",
        )
        self.nodes, _ = flatten_reddit_thread_nodes(self.envelope)

    def test_triage_marks_customer_discovery_signal_eligible(self):
        result = triage_source_thread(self.envelope, self.nodes)

        self.assertEqual(result["triage_status"], "jtbd_eligible")
        self.assertIn("customer_job_signal", result["semantic_flags"])
        self.assertGreaterEqual(result["confidence"], 0.7)

    def test_triage_preserves_rejected_threads_with_reason(self):
        deleted_post = dict(self.nodes[0], body="[removed]", title="")
        result = triage_source_thread(self.envelope, [deleted_post])

        self.assertEqual(result["triage_status"], "deleted_or_removed")
        self.assertIn("removed", result["triage_reason"])
        self.assertFalse(result["eligible_for_jtbd"])

    def test_chunking_covers_every_node_without_truncation(self):
        chunks = chunk_thread_nodes(self.nodes, max_chars=90)
        chunked_ids = [node["thread_node_id"] for chunk in chunks for node in chunk["nodes"]]

        self.assertEqual(sorted(chunked_ids), sorted(node["thread_node_id"] for node in self.nodes))
        self.assertTrue(all(not chunk["truncated"] for chunk in chunks))
        self.assertGreater(len(chunks), 1)

    def test_jtbd_output_has_thread_level_lineage_and_no_aggregate_claims(self):
        output = extract_thread_level_jtbd(self.envelope, self.nodes, max_chunk_chars=140)

        self.assertEqual(output["thread_level_jtbd_record"]["source_thread_id"], self.envelope["source_thread_id"])
        self.assertEqual(
            output["thread_level_jtbd_record"]["source_thread_snapshot_id"],
            self.envelope["source_thread_snapshot_id"],
        )
        self.assertGreater(len(output["thread_excerpts"]), 0)
        self.assertGreater(len(output["source_passages"]), 0)
        self.assertGreater(len(output["evidence_claims"]), 0)
        self.assertNotIn("jtbd_entities", output)

        passage_ids = {passage["source_passage_id"] for passage in output["source_passages"]}
        for claim in output["evidence_claims"]:
            self.assertTrue(set(claim["source_passage_ids"]).issubset(passage_ids))
            self.assertTrue(claim["active"])

        record = output["thread_level_jtbd_record"]
        all_claim_ids = {claim["evidence_claim_id"] for claim in output["evidence_claims"]}
        for field in ("jobs", "criteria", "contexts", "pains", "workarounds", "solutions", "people_roles"):
            self.assertTrue(set(record[field]).issubset(all_claim_ids))

        forbidden = {"opportunity_score", "segment_validation", "rbo", "aggregate_prevalence", "report_claim"}
        serialized = json.dumps(output)
        for term in forbidden:
            self.assertNotIn(term, serialized)


if __name__ == "__main__":
    unittest.main()
