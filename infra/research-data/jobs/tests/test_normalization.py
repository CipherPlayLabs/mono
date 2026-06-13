import unittest

from research_data.normalization import build_normalization_rewrite


class NormalizationRewriteTests(unittest.TestCase):
    def test_full_corpus_rewrite_groups_active_evidence_and_keeps_engagement_signals_separate(self):
        result = build_normalization_rewrite(
            run_id="normalization_run_test",
            evidence_claims=[
                {
                    "evidence_claim_id": "claim_1",
                    "source_thread_id": "source_thread_a",
                    "source_passage_ids": ["passage_1"],
                    "claim_type": "job",
                    "claim_text": "Reduce manual support work",
                    "active": True,
                    "claim_json": {
                        "passage_score": 5,
                        "thread_score": 20,
                        "thread_comment_count": 7,
                    },
                },
                {
                    "evidence_claim_id": "claim_2",
                    "source_thread_id": "source_thread_b",
                    "source_passage_ids": ["passage_2"],
                    "claim_type": "job",
                    "claim_text": "reduce manual support work",
                    "active": True,
                    "claim_json": {
                        "passage_score": 3,
                        "thread_score": 11,
                        "thread_comment_count": 4,
                    },
                },
                {
                    "evidence_claim_id": "claim_3",
                    "source_thread_id": "source_thread_c",
                    "source_passage_ids": ["passage_3"],
                    "claim_type": "job",
                    "claim_text": "Reduce manual support work",
                    "active": False,
                    "claim_json": {
                        "passage_score": 100,
                        "thread_score": 100,
                        "thread_comment_count": 100,
                    },
                },
            ],
            generated_at="2026-06-13T12:00:00Z",
        )

        self.assertEqual(result["normalization_run"]["normalization_run_id"], "normalization_run_test")
        self.assertEqual(result["normalization_run"]["status"], "staged")
        self.assertEqual(len(result["normalized_jtbd_entities"]), 1)
        entity = result["normalized_jtbd_entities"][0]
        self.assertEqual(entity["entity_type"], "job")
        self.assertEqual(entity["normalized_statement"], "Reduce manual support work")
        self.assertEqual(entity["evidence_claim_count"], 2)
        self.assertEqual(entity["source_thread_count"], 2)
        self.assertEqual(entity["passage_score_sum"], 8)
        self.assertEqual(entity["thread_score_sum"], 31)
        self.assertEqual(entity["thread_comment_count_sum"], 11)

        relationships = result["evidence_relationships"]
        self.assertEqual({item["evidence_claim_id"] for item in relationships}, {"claim_1", "claim_2"})
        self.assertTrue(all(item["relationship_type"] == "primary" for item in relationships))
        self.assertTrue(all(not item["active"] for item in relationships))


if __name__ == "__main__":
    unittest.main()
