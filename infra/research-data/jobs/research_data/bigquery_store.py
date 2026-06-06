import json
from typing import Any, Iterable


class BigQueryResearchStore:
    def __init__(self, *, project_id: str, dataset_id: str):
        from google.cloud import bigquery  # type: ignore

        self.bigquery = bigquery
        self.client = bigquery.Client(project=project_id)
        self.project_id = project_id
        self.dataset_id = dataset_id

    def get_latest_checkpoint(self, collection_run_id: str, query_mode: str) -> dict[str, Any] | None:
        query = f"""
            SELECT checkpoint_json
            FROM `{self.project_id}.{self.dataset_id}.collection_checkpoints`
            WHERE collection_run_id = @collection_run_id
              AND query_mode = @query_mode
            ORDER BY recorded_at DESC
            LIMIT 1
        """
        job_config = self.bigquery.QueryJobConfig(
            query_parameters=[
                self.bigquery.ScalarQueryParameter("collection_run_id", "STRING", collection_run_id),
                self.bigquery.ScalarQueryParameter("query_mode", "STRING", query_mode),
            ]
        )
        rows = list(self.client.query(query, job_config=job_config).result())
        return dict(rows[0]["checkpoint_json"]) if rows else None

    def write_collection_rows(self, rows_by_table: dict[str, list[dict[str, Any]]]) -> None:
        for table, rows in rows_by_table.items():
            self._insert_rows(table, rows)

    def write_checkpoint(self, row: dict[str, Any]) -> None:
        self._insert_rows("collection_checkpoints", [row])

    def write_triage_rows(self, rows: list[dict[str, Any]]) -> None:
        self._insert_rows("source_thread_triage", rows)

    def write_analysis_rows(self, output: dict[str, Any]) -> None:
        rows_by_table = {
            "analysis_batches": [output["analysis_batch"]],
            "source_quality_notes": output["source_quality_notes"],
            "thread_excerpts": output["thread_excerpts"],
            "evidence_claims": output["evidence_claims"],
            "jtbd_entities": output["jtbd_entities"],
            "thread_level_jtbd_records": [output["thread_level_jtbd_record"]],
        }
        for table, rows in rows_by_table.items():
            self._insert_rows(table, rows)

    def iter_threads_for_triage(self, limit: int) -> Iterable[dict[str, Any]]:
        query = f"""
            WITH untriaged_source_threads AS (
              SELECT
                s.source_thread_id,
                ARRAY_AGG(s.latest_snapshot_id ORDER BY s.latest_fetched_at DESC LIMIT 1)[OFFSET(0)] AS latest_snapshot_id,
                MAX(s.created_at) AS created_at
              FROM `{self.project_id}.{self.dataset_id}.source_threads` s
              LEFT JOIN `{self.project_id}.{self.dataset_id}.source_thread_triage` t
                ON s.source_thread_id = t.source_thread_id
              WHERE t.source_thread_id IS NULL
              GROUP BY s.source_thread_id
            )
            SELECT s.source_thread_id, snap.gcs_uri
            FROM untriaged_source_threads s
            JOIN `{self.project_id}.{self.dataset_id}.source_thread_snapshots` snap
              ON s.latest_snapshot_id = snap.source_thread_snapshot_id
            ORDER BY s.created_at DESC
            LIMIT @limit
        """
        yield from self._query_thread_refs(query, limit)

    def iter_threads_for_analysis(self, limit: int) -> Iterable[dict[str, Any]]:
        query = f"""
            WITH eligible_source_threads AS (
              SELECT t.source_thread_id
              FROM `{self.project_id}.{self.dataset_id}.source_thread_triage` t
              LEFT JOIN `{self.project_id}.{self.dataset_id}.thread_level_jtbd_records` r
                ON t.source_thread_id = r.source_thread_id
              WHERE t.triage_status = 'jtbd_eligible'
                AND r.source_thread_id IS NULL
              GROUP BY t.source_thread_id
            ),
            latest_source_threads AS (
              SELECT
                s.source_thread_id,
                ARRAY_AGG(s.latest_snapshot_id ORDER BY s.latest_fetched_at DESC LIMIT 1)[OFFSET(0)] AS latest_snapshot_id,
                MAX(s.created_at) AS created_at
              FROM `{self.project_id}.{self.dataset_id}.source_threads` s
              JOIN eligible_source_threads e
                ON s.source_thread_id = e.source_thread_id
              GROUP BY s.source_thread_id
            )
            SELECT s.source_thread_id, snap.gcs_uri
            FROM latest_source_threads s
            JOIN `{self.project_id}.{self.dataset_id}.source_thread_snapshots` snap
              ON s.latest_snapshot_id = snap.source_thread_snapshot_id
            ORDER BY s.created_at DESC
            LIMIT @limit
        """
        yield from self._query_thread_refs(query, limit)

    def _query_thread_refs(self, query: str, limit: int) -> Iterable[dict[str, Any]]:
        job_config = self.bigquery.QueryJobConfig(
            query_parameters=[self.bigquery.ScalarQueryParameter("limit", "INT64", limit)]
        )
        for row in self.client.query(query, job_config=job_config).result():
            yield dict(row)

    def _insert_rows(self, table: str, rows: list[dict[str, Any]]) -> None:
        if not rows:
            return
        table_id = f"{self.project_id}.{self.dataset_id}.{table}"
        row_ids = [_row_insert_id(row) for row in rows]
        insert_rows = [_prepare_row_for_insert(row) for row in rows]
        errors = self.client.insert_rows_json(table_id, insert_rows, row_ids=row_ids)
        if errors:
            raise RuntimeError(f"BigQuery insert failed for {table_id}: {errors}")


def _row_insert_id(row: dict[str, Any]) -> str | None:
    for key, value in row.items():
        if key.endswith("_id") and value:
            return str(value)
    return None


def _prepare_row_for_insert(row: dict[str, Any]) -> dict[str, Any]:
    prepared = dict(row)
    for key, value in row.items():
        if key.endswith("_json") and value is not None and not isinstance(value, str):
            prepared[key] = json.dumps(value, sort_keys=True, separators=(",", ":"))
    return prepared
