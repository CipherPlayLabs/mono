import json
import unittest

from research_data.bigquery_store import BigQueryResearchStore


class FakeBigQueryClient:
    def __init__(self):
        self.inserted = None

    def insert_rows_json(self, table_id, rows, row_ids):
        self.inserted = {
            "table_id": table_id,
            "rows": rows,
            "row_ids": row_ids,
        }
        return []


class BigQueryStoreTests(unittest.TestCase):
    def test_insert_rows_serializes_json_suffix_fields_for_bigquery_json_columns(self):
        client = FakeBigQueryClient()
        store = BigQueryResearchStore.__new__(BigQueryResearchStore)
        store.client = client
        store.project_id = "test-project"
        store.dataset_id = "research_data"

        original = {
            "source_thread_id": "source_thread_test",
            "provider_native_json": {"id": "abc123", "score": 42},
            "raw_json": [{"kind": "t3"}],
            "plain_nested_value": {"not": "a json column"},
        }

        store._insert_rows("source_threads", [original])

        row = client.inserted["rows"][0]
        self.assertEqual(json.loads(row["provider_native_json"]), {"id": "abc123", "score": 42})
        self.assertEqual(json.loads(row["raw_json"]), [{"kind": "t3"}])
        self.assertEqual(row["plain_nested_value"], {"not": "a json column"})
        self.assertEqual(original["provider_native_json"], {"id": "abc123", "score": 42})


class FakeBigQueryModule:
    class ScalarQueryParameter:
        def __init__(self, name, type_, value):
            self.name = name
            self.type_ = type_
            self.value = value

    class QueryJobConfig:
        def __init__(self, query_parameters):
            self.query_parameters = query_parameters


class FakeQueryJob:
    def __init__(self, rows):
        self.rows = rows

    def result(self):
        return self.rows


class FakeQueryClient:
    def __init__(self):
        self.query_texts = []

    def query(self, query, job_config=None):
        self.query_texts.append(query)
        return FakeQueryJob([{"source_thread_id": "source_thread_test", "gcs_uri": "gs://snapshot/test.json"}])


class BigQueryThreadSelectionTests(unittest.TestCase):
    def make_store(self):
        store = BigQueryResearchStore.__new__(BigQueryResearchStore)
        store.bigquery = FakeBigQueryModule
        store.client = FakeQueryClient()
        store.project_id = "test-project"
        store.dataset_id = "research_data"
        return store

    def test_triage_selection_deduplicates_source_threads_to_latest_snapshot(self):
        store = self.make_store()

        rows = list(store.iter_threads_for_triage(25))

        self.assertEqual(rows, [{"source_thread_id": "source_thread_test", "gcs_uri": "gs://snapshot/test.json"}])
        query = store.client.query_texts[0]
        self.assertIn("GROUP BY s.source_thread_id", query)
        self.assertIn("ARRAY_AGG(s.latest_snapshot_id ORDER BY s.latest_fetched_at DESC LIMIT 1)", query)

    def test_analysis_selection_deduplicates_source_threads_to_latest_snapshot(self):
        store = self.make_store()

        rows = list(store.iter_threads_for_analysis(10))

        self.assertEqual(rows, [{"source_thread_id": "source_thread_test", "gcs_uri": "gs://snapshot/test.json"}])
        query = store.client.query_texts[0]
        self.assertIn("GROUP BY t.source_thread_id", query)
        self.assertIn("GROUP BY s.source_thread_id", query)
        self.assertIn("ARRAY_AGG(s.latest_snapshot_id ORDER BY s.latest_fetched_at DESC LIMIT 1)", query)


if __name__ == "__main__":
    unittest.main()
