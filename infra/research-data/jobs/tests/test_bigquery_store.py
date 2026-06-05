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


if __name__ == "__main__":
    unittest.main()
