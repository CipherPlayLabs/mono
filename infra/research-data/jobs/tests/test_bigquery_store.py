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
    class SourceFormat:
        NEWLINE_DELIMITED_JSON = "NEWLINE_DELIMITED_JSON"

    class WriteDisposition:
        WRITE_TRUNCATE = "WRITE_TRUNCATE"

    class LoadJobConfig:
        def __init__(self, schema=None, source_format=None, write_disposition=None):
            self.schema = schema
            self.source_format = source_format
            self.write_disposition = write_disposition

    class ScalarQueryParameter:
        def __init__(self, name, type_, value):
            self.name = name
            self.type_ = type_
            self.value = value

    class ArrayQueryParameter:
        def __init__(self, name, type_, values):
            self.name = name
            self.type_ = type_
            self.values = values

    class QueryJobConfig:
        def __init__(self, query_parameters=None):
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


class FakeLoadJob:
    def result(self):
        return []


class FakeTable:
    def __init__(self):
        self.schema = []


class FakeMergeClient:
    def __init__(self):
        self.loaded = []
        self.queries = []
        self.deleted = []
        self.inserted = []

    def get_table(self, table_id):
        return FakeTable()

    def load_table_from_json(self, rows, table_id, job_config=None):
        self.loaded.append({"rows": rows, "table_id": table_id, "job_config": job_config})
        return FakeLoadJob()

    def query(self, query, job_config=None):
        self.queries.append({"query": query, "job_config": job_config})
        return FakeQueryJob([])

    def delete_table(self, table_id, not_found_ok=False):
        self.deleted.append({"table_id": table_id, "not_found_ok": not_found_ok})

    def insert_rows_json(self, table_id, rows, row_ids):
        self.inserted.append({"table_id": table_id, "rows": rows, "row_ids": row_ids})
        return []


class BigQueryThreadSelectionTests(unittest.TestCase):
    def make_store(self):
        store = BigQueryResearchStore.__new__(BigQueryResearchStore)
        store.bigquery = FakeBigQueryModule
        store.client = FakeQueryClient()
        store.project_id = "test-project"
        store.dataset_id = "research_data"
        return store

    def test_triage_selection_reads_current_threads_with_missing_or_stale_triage(self):
        store = self.make_store()

        rows = list(store.iter_threads_for_triage(25))

        self.assertEqual(rows, [{"source_thread_id": "source_thread_test", "gcs_uri": "gs://snapshot/test.json"}])
        query = store.client.query_texts[0]
        self.assertIn("latest_triage", query)
        self.assertIn("s.latest_fetched_at > t.observed_at", query)
        self.assertIn("ON s.source_thread_id = snap.source_thread_id", query)

    def test_analysis_selection_deduplicates_source_threads_to_latest_snapshot(self):
        store = self.make_store()

        rows = list(store.iter_threads_for_analysis(10))

        self.assertEqual(rows, [{"source_thread_id": "source_thread_test", "gcs_uri": "gs://snapshot/test.json"}])
        query = store.client.query_texts[0]
        self.assertIn("GROUP BY t.source_thread_id", query)
        self.assertIn("GROUP BY s.source_thread_id", query)
        self.assertIn("ARRAY_AGG(s.latest_snapshot_id ORDER BY s.latest_fetched_at DESC LIMIT 1)", query)


class BigQueryCurrentWriteTests(unittest.TestCase):
    def test_collection_rows_upsert_current_tables_and_replace_thread_nodes(self):
        store = BigQueryResearchStore.__new__(BigQueryResearchStore)
        store.bigquery = FakeBigQueryModule
        store.client = FakeMergeClient()
        store.project_id = "test-project"
        store.dataset_id = "research_data"

        store.write_collection_rows(
            {
                "source_threads": [
                    {
                        "source_thread_id": "source_thread_test",
                        "latest_snapshot_id": "source_thread_snapshot_current",
                        "latest_fetched_at": "2026-06-05T12:00:00Z",
                    }
                ],
                "source_thread_snapshots": [
                    {
                        "source_thread_snapshot_id": "source_thread_snapshot_current",
                        "source_thread_id": "source_thread_test",
                        "gcs_uri": "gs://research/current/reddit/ecommerce/source_thread_test.json",
                        "raw_checksum_sha256": "abc",
                    }
                ],
                "thread_nodes": [
                    {
                        "thread_node_id": "thread_node_test",
                        "source_thread_id": "source_thread_test",
                        "source_thread_snapshot_id": "source_thread_snapshot_current",
                    }
                ],
                "coverage_gaps": [],
            }
        )

        self.assertEqual(store.client.inserted, [])
        query_text = "\n".join(query["query"] for query in store.client.queries)
        self.assertIn("MERGE `test-project.research_data.source_threads`", query_text)
        self.assertIn("MERGE `test-project.research_data.source_thread_snapshots`", query_text)
        self.assertIn("MERGE `test-project.research_data.thread_nodes`", query_text)
        self.assertIn("ON target.`source_thread_id` = source.`source_thread_id`", query_text)
        self.assertIn("ON target.`thread_node_id` = source.`thread_node_id`", query_text)
        self.assertIn("WHEN NOT MATCHED BY SOURCE", query_text)
        self.assertIn("DELETE", query_text)
        self.assertEqual(len(store.client.loaded), 3)
        self.assertEqual(len(store.client.deleted), 3)

    def test_current_table_merge_deduplicates_rows_by_match_key_before_staging(self):
        store = BigQueryResearchStore.__new__(BigQueryResearchStore)
        store.bigquery = FakeBigQueryModule
        store.client = FakeMergeClient()
        store.project_id = "test-project"
        store.dataset_id = "research_data"

        store.write_collection_rows(
            {
                "source_threads": [
                    {
                        "source_thread_id": "source_thread_test",
                        "title": "older title",
                    },
                    {
                        "source_thread_id": "source_thread_test",
                        "title": "newer title",
                    },
                ]
            }
        )

        self.assertEqual(store.client.loaded[0]["rows"], [{"source_thread_id": "source_thread_test", "title": "newer title"}])


if __name__ == "__main__":
    unittest.main()
